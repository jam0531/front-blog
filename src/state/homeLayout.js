import { ref } from 'vue'

export const homeLayoutOptions = [
  { id: 'editorial', number: '01', name: '留白杂志', detail: '大图引入 · 图文列表', note: '保留图片氛围，同时把标题和阅读顺序放在第一位，与欢迎页的书写感最协调。' },
  { id: 'journal', number: '02', name: '文字专栏', detail: '文字为主 · 轻量侧栏', note: '适合技术笔记和长文。用行距、字重与分隔线建立层次，图片不打断阅读。' },
  { id: 'gallery', number: '03', name: '图文画廊', detail: '三列卡片 · 分类入口', note: '适合生活记录与图文混合内容。首屏能浏览更多文章，手机上自然变成单列。' },
]

const storageKey = 'twelve.home-layout'
const findLayout = id => homeLayoutOptions.find(option => option.id === id)
function readSavedLayout() {
  try { return findLayout(localStorage.getItem(storageKey))?.id || 'editorial' }
  catch { return 'editorial' }
}
const savedLayout = ref(readSavedLayout())

export function getHomeLayout(id) {
  return findLayout(id) || findLayout(savedLayout.value)
}

export function rememberHomeLayout(id) {
  if (!findLayout(id)) return
  savedLayout.value = id
  // 浏览器禁用存储时仍允许本次页面切换。
  try { localStorage.setItem(storageKey, id) } catch {}
}
