<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHome } from '../api/home.js'
import { getBlogs } from '../api/blog.js'
import BlogCard from '../components/BlogCard.vue'
import Pagination from '../components/Pagination.vue'
const route = useRoute()
const router = useRouter()
const home = ref(null)
const homeError = ref('')
const result = ref(null)
const error = ref('')
const loading = ref(false)
const page = computed(() => {
  const value = String(route.query.page || '1')
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647 ? Number(value) : 1
})
let listController
const homeController = new AbortController()
async function loadHome() {
  homeError.value = ''
  try { home.value = await getHome(homeController.signal) }
  catch (e) { if (e.name !== 'AbortError') homeError.value = '首页信息加载失败。' }
}
async function loadBlogs() {
  listController?.abort()
  const current = new AbortController()
  listController = current
  loading.value = true
  error.value = ''
  result.value = null
  try { result.value = await getBlogs(page.value, 10, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '网络连接失败，请重试。' }
  finally { if (listController === current) loading.value = false }
}
watch(page, loadBlogs, { immediate: true })
onMounted(() => { document.title = '首页 · 十二'; loadHome() })
onBeforeUnmount(() => { listController?.abort(); homeController.abort() })
</script>

<template>
  <section class="home-intro"><p class="eyebrow">欢迎来到我的博客</p><h1>记录与分享</h1><p>生活的片段，技术的积累，都在这里。</p></section>
  <div class="home-grid">
    <section aria-label="文章列表" :aria-busy="loading">
      <div v-if="loading" class="panel state" role="status">正在加载文章…</div>
      <div v-else-if="error" class="panel state" role="alert"><p>{{ error }}</p><button @click="loadBlogs">重试</button></div>
      <template v-else-if="result">
        <div v-if="!result.records.length" class="panel state">{{ result.total ? '这一页没有文章，请返回前面的页码。' : '还没有已发布的文章。' }}</div>
        <BlogCard v-for="blog in result.records" :key="blog.id" :blog="blog" />
        <Pagination :page="result.page" :size="result.size" :total="result.total" @change="router.push({ path: '/home', query: { page: $event } })" />
      </template>
    </section>
    <aside class="sidebar" aria-label="博客信息">
      <div v-if="homeError" class="panel state" role="alert"><p>{{ homeError }}</p><button @click="loadHome">重试</button></div>
      <template v-if="home">
        <section class="panel"><h2>公告</h2><p>{{ home.notice?.content || '欢迎来到我的网站！' }}</p><div class="stats"><span><b>{{ home.stats.blogCount }}</b>文章</span><span><b>{{ home.stats.typeCount }}</b>分类</span><span><b>{{ home.stats.tagCount }}</b>标签</span></div></section>
        <section class="panel"><h2>最新文章</h2><ul class="link-list"><li v-for="blog in home.latestBlogs" :key="blog.id"><RouterLink :to="`/blog/${blog.id}`">{{ blog.title }}</RouterLink></li></ul><p v-if="!home.latestBlogs.length">暂无文章</p></section>
        <section class="panel"><h2>推荐阅读</h2><ul class="link-list"><li v-for="blog in home.recommendedBlogs" :key="blog.id"><RouterLink :to="`/blog/${blog.id}`">{{ blog.title }}</RouterLink></li></ul><p v-if="!home.recommendedBlogs.length">暂无推荐</p></section>
        <section class="panel"><h2>文章分类</h2><ul class="count-list"><li v-for="type in home.topTypes" :key="type.id"><span>{{ type.typeName }}</span><span>{{ type.blogCount }}</span></li></ul></section>
        <section class="panel"><h2>归档</h2><ul class="count-list"><li v-for="archive in home.archives" :key="archive.year"><span>{{ archive.year }} 年</span><span>{{ archive.blogCount }} 篇</span></li></ul></section>
      </template>
    </aside>
  </div>
</template>
