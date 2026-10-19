import { ref } from 'vue'
import { getNavigation } from '../api/navigation.js'

export const navigationItems = ref([])
let latestRequest = 0

/** 保存后或重新进入公开布局时刷新；旧请求不能覆盖更新后的菜单。 */
export async function refreshNavigation() {
  const request = ++latestRequest
  try {
    const items = await getNavigation()
    if (!Array.isArray(items)) throw new Error('菜单响应格式不正确')
    if (request === latestRequest) navigationItems.value = items
    return true
  } catch {
    // 保留本次会话最后一次成功结果，首次失败不恢复任何写死的菜单。
    return false
  }
}
