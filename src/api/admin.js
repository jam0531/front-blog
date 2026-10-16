import { request, requestJson } from './http.js'

function queryString(filters) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value !== '' && value != null) query.set(key, String(value))
  return query.toString()
}

export const getAdminBlogs = (filters, signal) => request(`/admin/blogs?${queryString(filters)}`, { signal })
export const getAdminBlog = (id, signal) => request(`/admin/blogs/${encodeURIComponent(id)}`, { signal })
export const saveAdminBlog = (id, input) => requestJson(`/admin/blogs${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PUT' : 'POST', input)
export const deleteAdminBlog = id => requestJson(`/admin/blogs/${encodeURIComponent(id)}`, 'DELETE')
export const previewBlog = (contentMarkdown, signal) => requestJson('/admin/blogs/preview', 'POST', { contentMarkdown }, { signal })

export const getAdminCatalog = (resource, page = 1, size = 10, signal) => request(`/admin/${resource}?${queryString({ page, size })}`, { signal })
export const saveAdminCatalog = (resource, id, input) => requestJson(`/admin/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PUT' : 'POST', input)
export const deleteAdminCatalog = (resource, id) => requestJson(`/admin/${resource}/${encodeURIComponent(id)}`, 'DELETE')

export const getAdminResources = (resource, page = 1, signal) => request(`/admin/${resource}?${queryString({ page, size: 10 })}`, { signal })
export const getAdminResource = (resource, id, signal) => request(`/admin/${resource}/${encodeURIComponent(id)}`, { signal })
export const saveAdminResource = (resource, id, input) => requestJson(`/admin/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PUT' : 'POST', input)
export const deleteAdminResource = (resource, id) => requestJson(`/admin/${resource}/${encodeURIComponent(id)}`, 'DELETE')

/** 编辑选项读取完整分页，不能把公开分类/标签统计或第一页当作全部选项。 */
export async function getAllAdminCatalog(resource, signal) {
  const items = new Map()
  for (let page = 1; ; page += 1) {
    const result = await getAdminCatalog(resource, page, 100, signal)
    for (const item of result.records) items.set(item.id, item)
    if (!result.records.length || page * result.size >= result.total) return [...items.values()]
  }
}
