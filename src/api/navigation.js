import { request, requestJson } from './http.js'

export const getNavigation = () => request('/navigation')
export const getAdminNavigation = signal => request('/admin/navigation', { signal })
export const getNavigationPages = signal => request('/admin/navigation/pages', { signal })
export const saveNavigation = (id, input) => requestJson(`/admin/navigation${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PUT' : 'POST', input)
export const deleteNavigation = id => requestJson(`/admin/navigation/${encodeURIComponent(id)}`, 'DELETE')
