<script setup>
import { useRoute } from 'vue-router'
defineProps({ error: [Object, String] })
const route = useRoute()
</script>

<template>
  <p v-if="error" class="admin-error" role="alert">{{ typeof error === 'string' ? error : error.message || '请求失败，请稍后重试。' }} <RouterLink v-if="error.status === 401 || error.status === 403" :to="{ path: '/admin/login', query: { redirect: route.fullPath } }">重新登录</RouterLink></p>
</template>
