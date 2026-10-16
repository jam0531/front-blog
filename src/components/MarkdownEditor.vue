<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' }, disabled: Boolean })
const emit = defineEmits(['update:modelValue'])
const frame = ref(null)
const ready = ref(false)
const failed = ref(false)
const channel = 'twelve-markdown-editor'
const requests = new Map()
let sequence = 0
let loadingTimeout
let lastEditorValue = ''

function send(type, data = {}) { frame.value?.contentWindow?.postMessage({ channel, type, ...data }, window.location.origin) }
function configure() { if (ready.value) { lastEditorValue = props.modelValue; send('configure', { value: props.modelValue, disabled: props.disabled }) } }
function receive(event) {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow || event.data?.channel !== channel) return
  const data = event.data
  if (data.type === 'ready') { ready.value = true; clearTimeout(loadingTimeout); configure() }
  else if (data.type === 'failed') { failed.value = true; clearTimeout(loadingTimeout) }
  else if (['change', 'content'].includes(data.type) && typeof data.value === 'string') {
    lastEditorValue = data.value
    emit('update:modelValue', data.value)
    if (data.type === 'content' && requests.has(data.requestId)) {
      const pending = requests.get(data.requestId)
      clearTimeout(pending.timeout)
      requests.delete(data.requestId)
      pending.resolve(data.value)
    }
  }
}
// 保存和预览前读取编辑器的即时值，避免异步消息尚未同步时提交旧正文。
function getContent() {
  if (failed.value) return Promise.resolve(props.modelValue)
  if (!ready.value) return Promise.reject(new Error('正文编辑器仍在加载，请稍后重试。'))
  return new Promise((resolve, reject) => {
    const requestId = ++sequence
    const timeout = setTimeout(() => { requests.delete(requestId); reject(new Error('无法读取正文，请保留当前页面并稍后重试。')) }, 5000)
    requests.set(requestId, { resolve, reject, timeout })
    send('read', { requestId })
  })
}
defineExpose({ getContent })
watch(() => props.modelValue, value => {
  // 不将编辑器发出的 v-model 更新回送给它，避免快速输入时旧消息覆盖新字符。
  if (ready.value && value !== lastEditorValue) { lastEditorValue = value; send('configure', { value }) }
})
watch(() => props.disabled, disabled => { if (ready.value) send('configure', { disabled }) })
onMounted(() => {
  window.addEventListener('message', receive)
  loadingTimeout = setTimeout(() => { if (!ready.value) failed.value = true }, 30000)
})
onBeforeUnmount(() => {
  window.removeEventListener('message', receive)
  clearTimeout(loadingTimeout)
  for (const pending of requests.values()) { clearTimeout(pending.timeout); pending.reject(new DOMException('编辑器已关闭', 'AbortError')) }
  requests.clear()
})
</script>

<template>
  <div class="markdown-editor">
    <template v-if="failed"><p class="admin-help" role="status">工具栏未能加载，可继续在下面编辑 Markdown 原文。</p><textarea :value="modelValue" :disabled="disabled" aria-label="Markdown 正文" rows="22" @input="emit('update:modelValue', $event.target.value)" /></template>
    <template v-else><p v-if="!ready" class="editor-loading" role="status">正在加载正文编辑器…</p><iframe ref="frame" src="/editor/index.html" title="Markdown 正文编辑器" /></template>
  </div>
</template>

<style scoped>
.markdown-editor { position: relative; min-width: 0; }
.markdown-editor iframe { display: block; width: 100%; height: 580px; border: 1px solid #d9e1da; border-radius: 5px; background: #fff; }
.editor-loading { position: absolute; z-index: 1; inset: 0 0 auto; padding: 18px; margin: 0; background: #f5f8f3; font-size: 13px; color: #57675e; }
.markdown-editor textarea { font: 14px/1.8 Consolas, "Microsoft YaHei", monospace; }
@media(max-width:600px) { .markdown-editor iframe { height: 480px; } }
</style>
