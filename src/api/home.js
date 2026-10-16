import { request } from './http.js'

export const getHome = (signal) => request('/home', { signal })

export const getBackground = (excludeId, signal) => request(`/background${excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : ''}`, { signal })
