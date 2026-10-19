<script setup>
import ErrorNotice from '../../components/ErrorNotice.vue'
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../../state/auth.js'
import '../../assets/admin.css'
const route = useRoute()
const router = useRouter()
const form = reactive({ username: '', password: '' })
const busy = ref(false)
const error = ref('')
const retrySeconds = ref(0)
let retryTimer
function waitBeforeRetry(seconds) {
  clearInterval(retryTimer)
  const until = Date.now() + seconds * 1000
  const update = () => {
    retrySeconds.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
    if (!retrySeconds.value) clearInterval(retryTimer)
  }
  update()
  retryTimer = setInterval(update, 1000)
}
const reason = computed(() => ({ unavailable: '后台连接暂时不可用，请稍后重试。', forbidden: '当前账号没有管理权限，请使用管理员账号登录。' })[route.query.reason] || '')
const destination = computed(() => typeof route.query.redirect === 'string' && /^\/admin(?:\/|$)/.test(route.query.redirect) && !route.query.redirect.startsWith('/admin/login') ? route.query.redirect : '/admin/blogs')
async function submit() {
  if (busy.value || retrySeconds.value) return
  busy.value = true
  error.value = ''
  try { await login(form.username.trim(), form.password); form.password = ''; await router.replace(destination.value) }
  catch (e) {
    error.value = e
    if (e.status === 429 && e.retryAfter > 0) waitBeforeRetry(e.retryAfter)
  }
  finally { busy.value = false }
}
onMounted(() => { document.title = '管理登录 · 十二' })
onBeforeUnmount(() => clearInterval(retryTimer))
</script>

<template>
  <main class="admin-login">
    <RouterLink class="admin-brand" to="/home">十二<span>个人博客</span></RouterLink>
    <section class="login-card"><p class="admin-eyebrow">写下新的故事</p><h1>管理登录</h1><p class="admin-muted">记录、整理，发布你的文章。</p>
      <ErrorNotice :error="reason" />
      <form @submit.prevent="submit"><label>账号<input v-model="form.username" autocomplete="username" maxlength="255" required :disabled="busy" /></label><label>密码<input v-model="form.password" type="password" autocomplete="current-password" maxlength="255" required :disabled="busy" /></label><ErrorNotice :error="error" /><button class="admin-primary" :disabled="busy || retrySeconds > 0">{{ busy ? '正在登录…' : retrySeconds ? `${retrySeconds} 秒后可重试` : '进入后台' }}</button></form>
      <RouterLink class="login-back" to="/home">← 返回博客</RouterLink>
    </section>
  </main>
</template>
