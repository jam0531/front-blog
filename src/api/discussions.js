import { request, requestJson } from './http.js'

export function discussionPath(blogId) { return blogId ? `/blogs/${encodeURIComponent(blogId)}/comments` : '/messages' }
export function getDiscussion(blogId, messageType, page, signal) {
  const query = new URLSearchParams({ page: String(page), size: '10' })
  if (!blogId) query.set('messageType', String(messageType))
  return request(`${discussionPath(blogId)}?${query}`, { signal })
}
export function postDiscussion(blogId, messageType, input) {
  return requestJson(discussionPath(blogId), 'POST', { ...input, ...(!blogId ? { messageType } : {}) })
}
export function getAdminDiscussions(resource, filters, signal) {
  const query = new URLSearchParams({ page: String(filters.page || 1), size: '10' })
  if (resource === 'comments' && filters.blogId) query.set('blogId', filters.blogId)
  if (resource === 'messages' && filters.messageType !== '') query.set('messageType', filters.messageType)
  return request(`/admin/${resource}?${query}`, { signal })
}
export const replyAdminDiscussion = (resource, id, content) => requestJson(`/admin/${resource}/${encodeURIComponent(id)}/replies`, 'POST', { content })
export const deleteAdminDiscussion = (resource, id) => requestJson(`/admin/${resource}/${encodeURIComponent(id)}`, 'DELETE')
