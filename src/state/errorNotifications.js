import { ref } from 'vue'

export const errorNotifications = ref([])
const duration = 5000
const timers = new Map()
let nextId = 0

export function dismissError(id) {
  clearTimeout(timers.get(id)?.timer)
  timers.delete(id)
  errorNotifications.value = errorNotifications.value.filter(item => item.id !== id)
}

function startTimer(id, clock) {
  clock.startedAt = Date.now()
  clock.timer = setTimeout(() => dismissError(id), clock.remaining)
}

/** 阅读提示或操作其中的链接时暂停倒计时，不移动用户的键盘焦点。 */
export function pauseError(id, reason, paused) {
  const clock = timers.get(id)
  if (!clock) return
  if (paused) {
    if (!clock.pauses.size) {
      clearTimeout(clock.timer)
      clock.remaining = Math.max(0, clock.remaining - (Date.now() - clock.startedAt))
    }
    clock.pauses.add(reason)
  } else if (clock.pauses.delete(reason) && !clock.pauses.size) startTimer(id, clock)
}

export function showError(error, { actionTo, actionLabel } = {}) {
  if (!error || error.name === 'AbortError') return
  const message = (typeof error === 'string' ? error : error.message) || '请求失败，请稍后重试。'
  const key = JSON.stringify([message, actionTo || null, actionLabel || ''])
  let item = errorNotifications.value.find(value => value.key === key)
  if (!item) {
    item = { id: ++nextId, key, message, actionTo, actionLabel }
    errorNotifications.value.push(item)
    // 多个区块同时失败时最多显示三条，避免遮住整个页面。
    if (errorNotifications.value.length > 3) dismissError(errorNotifications.value[0].id)
  }
  const clock = timers.get(item.id) || { pauses: new Set() }
  clearTimeout(clock.timer)
  clock.remaining = duration
  timers.set(item.id, clock)
  if (!clock.pauses.size) startTimer(item.id, clock)
}

export function clearErrors() {
  for (const item of errorNotifications.value) dismissError(item.id)
}
