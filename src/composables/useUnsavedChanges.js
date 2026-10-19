import { inject, onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

/** 统一离开页面和退出登录前的检查；表单状态及保存逻辑仍由各页面维护。 */
export function useUnsavedChanges({ dirty, busy, message }) {
  const navigation = inject('adminNavigation', null)

  function mayLeave() {
    if (navigation?.loggingOut.value) return true
    if (busy.value) return false
    return !dirty.value || window.confirm(message)
  }

  function beforeUnload(event) {
    if (dirty.value || busy.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  onBeforeRouteLeave(mayLeave)
  onBeforeRouteUpdate(mayLeave)
  if (navigation) navigation.beforeLogout.value = mayLeave
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnload)
    // 新页面可能已注册自己的回调，只清理本页面持有的保护。
    if (navigation?.beforeLogout.value === mayLeave) navigation.beforeLogout.value = null
  })

  return { mayLeave }
}
