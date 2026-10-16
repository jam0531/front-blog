import { request } from './http.js'

export const getBlogs = (page, size = 10, signal) => request(`/blogs?${new URLSearchParams({ page, size })}`, { signal })
// 业务 ID 全程保持字符串，不经过 Number 或 parseInt。
export const getBlog = (id, signal) => request(`/blogs/${encodeURIComponent(id)}`, { signal })

export const findBlogs = (filters, signal) => {
  const params = new URLSearchParams()
  for (const key of ['page', 'size', 'typeId', 'tagId', 'year', 'keyword']) {
    if (filters[key] !== undefined && filters[key] !== '') params.set(key, String(filters[key]))
  }
  return request(`/blogs?${params}`, { signal })
}
