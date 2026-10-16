<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../../state/auth.js'
import '../../assets/admin.css'
const route = useRoute()
const router = useRouter()
const form = reactive({ username: '', password: '' })
const busy = ref(false)
const error = ref('')
const reason = computed(() => ({ unavailable: '后台连接暂时不可用，请稍后重试。', forbidden: '当前账号没有管理权限，请使用管理员账号登录。' })[route.query.reason] || '')
const destination = computed(() => typeof route.query.redirect === 'string' && /^\/admin(?:\/|$)/.test(route.query.redirect) && !route.query.redirect.startsWith('/admin/login') ? route.query.redirect : '/admin/blogs')
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try { await login(form.username.trim(), form.password); form.password = ''; await router.replace(destination.value) }
  catch (e) { error.value = e.message || '登录失败，请稍后重试。' }
  finally { busy.value = false }
}
onMounted(() => { document.title = '管理登录 · 十二' })
</script>

<template>
  <main class="admin-login">
    <RouterLink class="admin-brand" to="/home">十二<span>个人博客</span></RouterLink>
    <section class="login-card"><p class="admin-eyebrow">写下新的故事</p><h1>管理登录</h1><p class="admin-muted">记录、整理，发布你的文章。</p>
      <form @submit.prevent="submit"><label>账号<input v-model="form.username" autocomplete="username" maxlength="255" required :disabled="busy" /></label><label>密码<input v-model="form.password" type="password" autocomplete="current-password" maxlength="255" required :disabled="busy" /></label><p v-if="error || reason" class="admin-error" role="alert">{{ error || reason }}</p><button class="admin-primary" :disabled="busy">{{ busy ? '正在登录…' : '进入后台' }}</button></form>
      <RouterLink class="login-back" to="/home">← 返回博客</RouterLink>
    </section>
  </main>
</template>
