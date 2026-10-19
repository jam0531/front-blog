<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { errorNotifications, dismissError, pauseError, clearErrors, showError } from '../state/errorNotifications.js'

const route = useRoute()
// 页面跳转后不携带上一页的错误；新的页面会自行发出对应提示。
watch(() => route.fullPath, clearErrors, { flush: 'sync' })
let validating = false
let validationTimer
function showInvalidField(event) {
  const field = event.target
  if (!field.closest?.('#app') || !field.validationMessage) return
  event.preventDefault()
  // 浏览器一次可能报告多个必填项，只提示并定位第一个；校验仍阻止提交。
  if (validating) return
  validating = true
  validationTimer = setTimeout(() => { validating = false }, 0)
  const label = field.labels?.[0]?.firstChild?.textContent?.trim()
  showError(`${label ? `${label}：` : ''}${field.validationMessage}`)
  field.focus()
}
onMounted(() => document.addEventListener('invalid', showInvalidField, true))
onBeforeUnmount(() => { document.removeEventListener('invalid', showInvalidField, true); clearTimeout(validationTimer); clearErrors() })
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="error-toast" tag="div" class="error-toasts" aria-label="错误提示">
      <div v-for="item in errorNotifications" :key="item.id" class="error-toast" role="alert" aria-atomic="true"
        @mouseenter="pauseError(item.id, 'mouse', true)" @mouseleave="pauseError(item.id, 'mouse', false)"
        @focusin="pauseError(item.id, 'focus', true)" @focusout="event => { if (!event.currentTarget.contains(event.relatedTarget)) pauseError(item.id, 'focus', false) }">
        <span class="error-toast-icon" aria-hidden="true">!</span>
        <div class="error-toast-content"><p>{{ item.message }}</p><RouterLink v-if="item.actionTo" :to="item.actionTo" @click="dismissError(item.id)">{{ item.actionLabel }}</RouterLink></div>
        <button type="button" class="error-toast-close" aria-label="关闭错误提示" @click="dismissError(item.id)">×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.error-toasts { position: fixed; z-index: 10000; top: calc(22px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); width: min(480px, calc(100vw - 32px)); display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
.error-toast { display: flex; align-items: flex-start; gap: 12px; padding: 15px 16px; color: #713b36; background: #fffaf8; border: 1px solid #e9c9c2; border-radius: 10px; box-shadow: 0 8px 28px #42251a20; pointer-events: auto; }
.error-toast-icon { display: grid; place-items: center; flex: 0 0 20px; height: 20px; margin-top: 2px; border-radius: 50%; color: #fff; background: #b65a4b; font: 700 13px/1 sans-serif; }
.error-toast-content { flex: 1; min-width: 0; max-height: min(240px, 35vh); overflow-y: auto; font: 14px/1.7 system-ui, sans-serif; }
.error-toast-content p { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.error-toast-content a { display: inline-block; margin-top: 5px; color: #713b36; text-decoration: underline; text-underline-offset: 3px; }
.error-toast-close { display: grid; place-items: center; flex: 0 0 28px; height: 28px; margin: -2px -5px -2px 0; padding: 0; color: #94675f; background: transparent; border: 0; border-radius: 5px; box-shadow: none; cursor: pointer; font: 22px/1 sans-serif; }
.error-toast-close:hover { color: #713b36; background: #f6e6e1; }
.error-toast-close:focus-visible,.error-toast-content a:focus-visible { outline: 2px solid #b65a4b; outline-offset: 2px; }
.error-toast-enter-active,.error-toast-leave-active { transition: opacity .18s ease, transform .18s ease; }
.error-toast-enter-from,.error-toast-leave-to { opacity: 0; transform: translateY(-8px); }
@media (prefers-reduced-motion: reduce) { .error-toast-enter-active,.error-toast-leave-active { transition: none; } }
</style>
