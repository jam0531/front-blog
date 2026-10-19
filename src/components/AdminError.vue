<script setup>
import { useRoute } from 'vue-router'
import ErrorNotice from './ErrorNotice.vue'
defineProps({ error: [Object, String] })
const route = useRoute()
</script>

<template>
  <ErrorNotice :error="error" :action-to="error?.status === 401 || error?.status === 403 ? { path: '/admin/login', query: { redirect: route.fullPath } } : undefined" action-label="重新登录" />
</template>
