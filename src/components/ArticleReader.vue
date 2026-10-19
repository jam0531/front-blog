<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MarkdownContent from './MarkdownContent.vue'
import { showError } from '../state/errorNotifications.js'

const props = defineProps({ html: { type: String, default: '' } })
const emit = defineEmits(['reading-time'])
const content = ref(null)
const contentsPanel = ref(null)
const headings = ref([])
const copiedMessage = ref('')
const codeButtons = new Map()
let narrowScreen

function clearCopyButtons() {
  for (const item of codeButtons.values()) clearTimeout(item.timer)
  codeButtons.clear()
  copiedMessage.value = ''
}

function updateContentsPanel() {
  if (contentsPanel.value) contentsPanel.value.open = !narrowScreen?.matches
}

async function prepareContent() {
  clearCopyButtons()
  const root = content.value?.querySelector('.markdown-content')
  if (!root) return

  // 只统计正文；代码按非空行另行估算，避免将代码、目录和按钮重复计入字数。
  const prose = root.cloneNode(true)
  prose.querySelectorAll('pre').forEach(element => element.remove())
  const text = prose.textContent || ''
  const chineseCharacters = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || []).length
  const words = (text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length
  const blocks = [...root.querySelectorAll('pre')]
  const codeLines = blocks.reduce((total, block) => total + (block.textContent || '').split('\n').filter(line => line.trim()).length, 0)
  emit('reading-time', Math.max(1, Math.ceil(chineseCharacters / 300 + words / 200 + codeLines / 25)))

  const elements = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(element => element.textContent.trim())
  const firstLevel = Math.min(...elements.map(element => Number(element.tagName.slice(1))))
  const usedIds = new Set()
  headings.value = elements.map((element, index) => {
    let id = element.id
    // 保留后端的标题锚点；对缺失或冲突的锚点补唯一值，不修改正文文字。
    if (!id || usedIds.has(id) || document.getElementById(id) !== element) {
      let suffix = index + 1
      do { id = `article-section-${suffix++}` } while (document.getElementById(id) || usedIds.has(id))
      element.id = id
    }
    usedIds.add(id)
    element.tabIndex = -1
    return { id, text: element.textContent.trim(), depth: Math.min(3, Number(element.tagName.slice(1)) - firstLevel), element }
  })

  for (const [index, block] of blocks.entries()) {
    const code = block.querySelector('code') || block
    const wrapper = document.createElement('div')
    wrapper.className = 'article-code-block'
    const toolbar = document.createElement('div')
    toolbar.className = 'article-code-tools'
    const language = document.createElement('span')
    language.textContent = [...code.classList].find(name => name.startsWith('language-'))?.slice(9) || '代码'
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.copyCode = ''
    button.textContent = '复制代码'
    button.setAttribute('aria-label', `复制第 ${index + 1} 段代码`)
    codeButtons.set(button, { text: code.textContent || '', timer: null, index: index + 1 })
    toolbar.append(language, button)
    block.before(wrapper)
    wrapper.append(toolbar, block)
  }
  await nextTick()
  updateContentsPanel()
}

function goToHeading(item) {
  if (narrowScreen?.matches && contentsPanel.value) contentsPanel.value.open = false
  item.element.focus({ preventScroll: true })
  item.element.scrollIntoView({ block: 'start', behavior: 'auto' })
}

function fallbackCopy(text) {
  const previousFocus = document.activeElement
  const selection = window.getSelection()
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : []
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0'
  document.body.append(textarea)
  try {
    textarea.select()
    if (!document.execCommand('copy')) throw new Error('Copy unavailable')
  } finally {
    textarea.remove()
    previousFocus?.focus({ preventScroll: true })
    if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)) }
  }
}

async function copyCode(event) {
  const button = event.target.closest('button[data-copy-code]')
  const item = codeButtons.get(button)
  if (!item || button.disabled) return
  button.disabled = true
  copiedMessage.value = ''
  try {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(item.text)
    } catch { fallbackCopy(item.text) }
    if (!button.isConnected) return
    button.textContent = '已复制'
    copiedMessage.value = `第 ${item.index} 段代码已复制。`
    clearTimeout(item.timer)
    item.timer = setTimeout(() => { button.textContent = '复制代码' }, 2000)
  } catch {
    if (button.isConnected) showError('复制失败，请选中代码手动复制。')
  } finally { button.disabled = false }
}

watch(() => props.html, prepareContent, { flush: 'post' })
onMounted(() => {
  narrowScreen = window.matchMedia('(max-width: 850px)')
  narrowScreen.addEventListener('change', updateContentsPanel)
  prepareContent()
})
onBeforeUnmount(() => {
  clearCopyButtons()
  narrowScreen?.removeEventListener('change', updateContentsPanel)
})
</script>

<template>
  <div class="article-reading-layout" :class="{ 'has-contents': headings.length }">
    <aside v-if="headings.length" class="article-contents">
      <details ref="contentsPanel" open>
        <summary><span>文章目录</span><small>{{ headings.length }} 节</small></summary>
        <nav aria-label="文章目录"><ol><li v-for="item in headings" :key="item.id" :style="{ '--heading-depth': item.depth }"><a :href="`#${encodeURIComponent(item.id)}`" @click.prevent="goToHeading(item)">{{ item.text }}</a></li></ol></nav>
      </details>
    </aside>
    <div class="article-reading-main">
      <div ref="content" @click="copyCode"><MarkdownContent :html="html" /></div>
      <span class="copy-announcement" role="status" aria-live="polite">{{ copiedMessage }}</span>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.article-reading-layout { display: grid; grid-template-columns: minmax(0, 1fr); }
.article-reading-layout.has-contents { grid-template-columns: minmax(0, 1fr) 210px; gap: 44px; }
.article-reading-main { grid-column: 1; grid-row: 1; min-width: 0; }
.article-contents { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 24px; padding-left: 22px; border-left: 1px solid var(--layout-line); max-height: calc(100dvh - 48px); overflow-y: auto; }
.article-contents summary { display: flex; align-items: center; gap: 12px; cursor: pointer; list-style: none; color: var(--layout-ink); font-size: 13px; padding: 4px 0 14px; }
.article-contents summary::-webkit-details-marker { display: none; }
.article-contents summary::after { content: '+'; margin-left: auto; color: var(--layout-muted); }
.article-contents details[open] summary::after { content: '−'; }
.article-contents small { font-size: 10px; color: var(--layout-muted); }
.article-contents ol { list-style: none; margin: 0; padding: 0 0 4px; }
.article-contents a { display: block; padding: 6px 0 6px calc(var(--heading-depth) * 10px); font-size: 12px; line-height: 1.8; color: var(--layout-muted); overflow-wrap: anywhere; }
.article-contents a:hover { color: var(--layout-accent); }
.article-contents summary:focus-visible { outline: 2px solid var(--layout-accent); outline-offset: 3px; }
.copy-announcement { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; clip-path: inset(50%); overflow: hidden; white-space: nowrap; }
.article-reading-main :deep(.markdown-content) { padding: 0; font-size: 16px; line-height: 1.95; color: var(--layout-ink); }
.article-reading-main :deep(.markdown-content > :first-child) { margin-top: 0; }
.article-reading-main :deep(.markdown-content :is(h1,h2,h3,h4,h5,h6)) { scroll-margin-top: 28px; color: var(--layout-ink); line-height: 1.5; margin: 1.9em 0 .8em; }
.article-reading-main :deep(.markdown-content h1) { font-size: 28px; }
.article-reading-main :deep(.markdown-content h2) { font-size: 24px; }
.article-reading-main :deep(.markdown-content h3) { font-size: 20px; }
.article-reading-main :deep(.markdown-content :is(h4,h5,h6)) { font-size: 17px; }
.article-reading-main :deep(.markdown-content [tabindex='-1']:focus) { outline: none; }
.article-reading-main :deep(.markdown-content p) { margin-bottom: 1.3em; }
.article-reading-main :deep(.markdown-content :is(ul,ol)) { padding-left: 1.5em; margin: 1em 0 1.4em; }
.article-reading-main :deep(.markdown-content li + li) { margin-top: .4em; }
.article-reading-main :deep(.markdown-content blockquote) { margin: 24px 0; padding: 14px 20px; border-left: 3px solid var(--layout-accent); background: var(--article-subtle); color: var(--layout-muted); font-size: 15px; }
.article-reading-main :deep(.markdown-content blockquote > :last-child) { margin-bottom: 0; }
.article-reading-main :deep(.markdown-content :not(pre) > code) { background: var(--article-subtle); border-radius: 3px; padding: 2px 5px; overflow-wrap: anywhere; }
.article-reading-main :deep(.markdown-content img) { height: auto; border-radius: 4px; }
.article-reading-main :deep(.markdown-content table) { max-width: 100%; font-size: 14px; }
.article-reading-main :deep(.article-code-block) { margin: 24px 0; overflow: hidden; border: 1px solid var(--layout-line); border-radius: 6px; background: var(--article-subtle); }
.article-reading-main :deep(.article-code-tools) { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 8px 14px; border-bottom: 1px solid var(--layout-line); color: var(--layout-muted); font: 11px/1.6 system-ui,sans-serif; }
.article-reading-main :deep(.article-code-tools > span) { overflow-wrap: anywhere; min-width: 0; }
.article-reading-main :deep(.article-code-tools button) { flex-shrink: 0; padding: 5px 9px; min-height: 30px; background: var(--article-surface); color: var(--layout-accent); border: 1px solid var(--layout-line); border-radius: 4px; font: inherit; font-size: 12px; }
.article-reading-main :deep(.article-code-block pre) { margin: 0; border-radius: 0; padding: 18px; background: transparent; overflow-x: auto; line-height: 1.7; tab-size: 4; }
.article-reading-main :deep(.article-code-block code) { font-size: 13px; }
@media (max-width: 1050px) { .article-reading-layout.has-contents { grid-template-columns: minmax(0, 1fr) 185px; gap: 28px; } .article-contents { padding-left: 16px; } }
@media (max-width: 850px) {
  .article-reading-layout.has-contents { grid-template-columns: minmax(0, 1fr); gap: 26px; }
  .article-contents { grid-column: 1; grid-row: auto; position: static; max-height: none; padding: 14px 18px; border: 1px solid var(--layout-line); border-radius: 5px; background: var(--article-surface); }
  .article-contents summary { padding: 0; }
  .article-contents nav { max-height: 45vh; overflow-y: auto; margin-top: 14px; }
  .article-contents a { font-size: 13px; padding-top: 8px; padding-bottom: 8px; }
  .article-reading-main { grid-row: auto; }
}
@media (max-width: 480px) {
  .article-reading-main :deep(.markdown-content) { font-size: 15px; }
  .article-reading-main :deep(.markdown-content h1) { font-size: 24px; }
  .article-reading-main :deep(.markdown-content h2) { font-size: 22px; }
  .article-reading-main :deep(.markdown-content blockquote) { padding: 12px 14px; }
  .article-reading-main :deep(.article-code-block pre) { padding: 14px; }
}
</style>
