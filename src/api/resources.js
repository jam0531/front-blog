import { request } from './http.js'

export const getFriendLinks = signal => request('/friend-links', { signal })
export const getPictureArchives = signal => request('/picture-archives', { signal })
export const getPicture = (id, signal) => request(`/pictures/${encodeURIComponent(id)}`, { signal })
export function getPictures({ page = 1, size = 12, date = '' }, signal) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (date) query.set('date', date)
  return request(`/pictures?${query}`, { signal })
}
