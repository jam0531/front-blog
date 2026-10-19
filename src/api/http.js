export class ApiError extends Error {
  constructor(message, status = 0, retryAfter = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
  }
}

let csrfToken = null
let csrfPending = null
export function resetCsrf() { csrfToken = null; csrfPending = null }

async function getCsrf() {
  if (csrfToken) return csrfToken
  if (!csrfPending) {
    const pending = request('/auth/csrf').then(data => {
      if (!data || typeof data.token !== 'string' || !data.token) {
        throw new ApiError('会话校验信息异常，请刷新页面后重试。')
      }
      if (csrfPending === pending) csrfToken = data.token
      return data.token
    }).finally(() => { if (csrfPending === pending) csrfPending = null })
    csrfPending = pending
  }
  return csrfPending
}

// CSRF 请求由多个写请求共享；取消某个页面只停止其等待，不取消其他页面正在使用的请求。
function waitForCsrf(signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('请求已取消', 'AbortError'))
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    getCsrf().then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

export async function request(path, { signal, timeoutMs = 20000, ...options } = {}) {
  if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError')
  const controller = new AbortController()
  let timedOut = false
  let dispatched = false
  let status = 0
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  // 超时覆盖会话校验、发送请求及读取响应正文全过程。
  const timer = setTimeout(() => {
    if (!controller.signal.aborted) { timedOut = true; controller.abort() }
  }, timeoutMs)
  const writing = !['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())
  const mutation = writing && !path.startsWith('/auth/') && path !== '/admin/blogs/preview'
  try {
    const headers = { Accept: 'application/json', ...options.headers }
    if (writing) headers['X-CSRF-Token'] = await waitForCsrf(controller.signal)
    if (controller.signal.aborted) throw new DOMException('请求已取消', 'AbortError')
    dispatched = true
    const response = await fetch(`/api${path}`, {
      credentials: 'same-origin', ...options, signal: controller.signal, headers,
    })
    status = response.status
    // 仅清理旧令牌，不自动重放写请求，避免重复保存或提交。
    if (status === 401 || status === 403) resetCsrf()
    const retryHeader = response.headers.get('retry-after') || ''
    const retryAfter = /^\d+$/.test(retryHeader) ? Number(retryHeader) : 0
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new ApiError(status >= 500 ? '服务暂时不可用，请稍后重试。' : '服务返回的数据格式异常，请稍后重试。', status, retryAfter)
    }
    const result = await response.json()
    if (!result || typeof result !== 'object' || !Number.isInteger(result.code)) {
      throw new ApiError('服务返回的数据格式异常，请稍后重试。', status, retryAfter)
    }
    if (!response.ok || result.code !== 0) {
      const message = typeof result.message === 'string' && result.message.trim()
        ? result.message : '请求失败，请稍后重试。'
      throw new ApiError(message, status, retryAfter)
    }
    return result.data
  } catch (error) {
    // 页面主动取消不弹错；超时和网络中断则提供可读提示。
    if (!timedOut && (controller.signal.aborted || error.name === 'AbortError')) {
      throw new DOMException('请求已取消', 'AbortError')
    }
    let failure
    if (timedOut) failure = new ApiError('请求超时，请稍后重试。', status)
    else if (error instanceof ApiError) failure = error
    else if (error instanceof SyntaxError) failure = new ApiError('服务返回的数据格式异常，请稍后重试。', status)
    else failure = new ApiError('网络连接失败，请检查网络或稍后重试。', status)
    if (mutation && dispatched && (timedOut || status === 0 || status >= 500 || (status >= 200 && status < 300))) {
      failure.message += '操作结果尚未确认，请先查看列表，避免重复提交。'
    }
    throw failure
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export function requestJson(path, method, data, options = {}) {
  return request(path, { ...options, method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: data === undefined ? undefined : JSON.stringify(data) })
}
