<script setup>
import { provide, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, logout } from '../state/auth.js'
import AdminError from '../components/AdminError.vue'
import '../assets/admin.css'
const router = useRouter()
const leaving = ref(false)
const error = ref(null)
const navigation = { beforeLogout: shallowRef(null), loggingOut: ref(false) }
provide('adminNavigation', navigation)
async function signOut() {
  if (leaving.value || (navigation.beforeLogout.value && !navigation.beforeLogout.value())) return
  leaving.value = true
  error.value = null
  try { await logout(); navigation.loggingOut.value = true; await router.push('/admin/login') }
  catch (e) { error.value = e }
  finally { leaving.value = false; navigation.loggingOut.value = false }
}
</script>

<template>
  <div class="admin-app">
    <header class="admin-header"><RouterLink class="admin-brand" to="/home">十二<span>写作后台</span></RouterLink><div class="admin-account"><span>{{ currentUser?.aliasname || '管理员' }}</span><RouterLink to="/home">浏览博客 ↗</RouterLink><button :disabled="leaving" @click="signOut">{{ leaving ? '正在退出…' : '退出登录' }}</button></div></header>
    <div class="admin-workspace">
      <nav class="admin-nav" aria-label="后台导航"><RouterLink to="/admin/blogs">文章管理</RouterLink><RouterLink to="/admin/types">分类管理</RouterLink><RouterLink to="/admin/tags">标签管理</RouterLink><RouterLink to="/admin/notices">公告管理</RouterLink><RouterLink to="/admin/pictures">图片管理</RouterLink><RouterLink to="/admin/friend-links">友链管理</RouterLink><RouterLink to="/admin/comments">评论管理</RouterLink><RouterLink to="/admin/messages">留言管理</RouterLink><RouterLink to="/admin/navigation">导航管理</RouterLink></nav>
      <main class="admin-main"><AdminError :error="error" /><RouterView v-slot="{ Component, route }"><component :is="Component" :key="route.path" /></RouterView></main>
    </div>
  </div>
</template>
