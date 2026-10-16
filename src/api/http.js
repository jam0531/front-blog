export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

let csrfToken = null
let csrfPending = null
export function resetCsrf() { csrfToken = null; csrfPending = null }

async function getCsrf() {
  if (csrfToken) return csrfToken
  if (!csrfPending) {
    const pending = request('/auth/csrf').then(data => {
      if (csrfPending === pending) csrfToken = data.token
      return data.token
    }).finally(() => { if (csrfPending === pending) csrfPending = null })
    csrfPending = pending
  }
  return csrfPending
}

export async function request(path, { signal, ...options } = {}) {
  const headers = { Accept: 'application/json', ...options.headers }
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())) {
    headers['X-CSRF-Token'] = await getCsrf()
    if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError')
  }
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    signal,
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new ApiError('服务响应异常，请稍后重试。', response.status)
  }
  const result = await response.json()
  if (!response.ok || result.code !== 0) {
    // 仅清理旧令牌，不自动重放写请求，避免重复保存或提交。
    if (response.status === 401 || response.status === 403) resetCsrf()
    throw new ApiError(result.message || '请求失败，请稍后重试。', response.status)
  }
  return result.data
}

export function requestJson(path, method, data, options = {}) {
  return request(path, { ...options, method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: data === undefined ? undefined : JSON.stringify(data) })
}
