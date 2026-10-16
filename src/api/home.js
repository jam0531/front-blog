import { request } from './http.js'

export const getHome = (signal) => request('/home', { signal })
