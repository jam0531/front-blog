export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function request(path, { signal, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    signal,
    headers: { Accept: 'application/json', ...options.headers },
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new ApiError('服务响应异常，请稍后重试。', response.status)
  }
  const result = await response.json()
  if (!response.ok || result.code !== 0) {
    throw new ApiError(result.message || '请求失败，请稍后重试。', response.status)
  }
  return result.data
}
