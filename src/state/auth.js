import { ref } from 'vue'
import { request, requestJson, resetCsrf } from '../api/http.js'

export const currentUser = ref(null)

export async function loadCurrentUser() {
  try { currentUser.value = await request('/auth/me'); return currentUser.value }
  catch (error) { currentUser.value = null; throw error }
}

export async function login(username, password) {
  const user = await requestJson('/auth/login', 'POST', { username, password })
  resetCsrf() // 登录时服务端轮换 Session ID 和 CSRF token。
  currentUser.value = user
  return user
}

export async function logout() {
  await requestJson('/auth/logout', 'POST')
  currentUser.value = null
  resetCsrf()
}
