/** 兼容已有 HTTP(S) 与站内图片地址，禁止将数据库中的其他协议作为可点击链接。 */
export function webUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim()) || /[\s\\]/.test(value.trim())) return ''
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : ''
  } catch { return '' }
}

export function imageUrl(value) {
  if (typeof value !== 'string') return ''
  const source = value.trim()
  if (/^\/(?!\/)/.test(source) && !/[\s\\]/.test(source)) return source
  return webUrl(source)
}
