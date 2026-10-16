import { request } from './http.js'

export const getTypes = (signal) => request('/types', { signal })
export const getTags = (signal) => request('/tags', { signal })
export const getArchives = (signal) => request('/archives', { signal })
