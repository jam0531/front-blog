import { request } from './http.js'

export const getBlogs = (page, size = 10, signal) => request(`/blogs?${new URLSearchParams({ page, size })}`, { signal })
// 业务 ID 全程保持字符串，不经过 Number 或 parseInt。
export const getBlog = (id, signal) => request(`/blogs/${encodeURIComponent(id)}`, { signal })
