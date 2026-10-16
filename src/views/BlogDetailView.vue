<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getBlog } from '../api/blog.js'
import MarkdownContent from '../components/MarkdownContent.vue'
const route = useRoute()
const blog = ref(null)
const loading = ref(false)
const error = ref('')
const notFound = ref(false)
let controller
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  blog.value = null
  error.value = ''
  notFound.value = false
  loading.value = true
  try {
    blog.value = await getBlog(String(route.params.id), current.signal)
    document.title = `${blog.value.title} · 十二`
  } catch (e) {
    if (e.name !== 'AbortError') {
      notFound.value = e.status === 404
      error.value = notFound.value ? '这篇文章不存在或尚未公开。' : e.message || '文章加载失败，请重试。'
    }
  } finally { if (controller === current) loading.value = false }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div v-if="loading" class="panel state" role="status">正在加载文章…</div>
  <section v-else-if="error" class="panel state" role="alert"><h1>{{ notFound ? '文章未找到' : '暂时无法加载' }}</h1><p>{{ error }}</p><button v-if="!notFound" @click="load">重试</button> <RouterLink to="/home">返回首页</RouterLink></section>
  <article v-else-if="blog" class="article panel">
    <img v-if="blog.blogPic" class="article-cover" :src="blog.blogPic" alt="" @error="$event.target.hidden = true" />
    <header class="article-heading"><span class="eyebrow">{{ blog.type?.typeName || '未分类' }}</span><h1>{{ blog.title }}</h1><div class="meta"><span>{{ blog.author?.aliasname || '佚名' }}</span><time>{{ blog.updateTime?.slice(0, 10) }}</time><span>{{ blog.views }} 次阅读</span></div><div class="tags"><span v-for="tag in blog.tags" :key="tag.id"># {{ tag.tagName }}</span></div></header>
    <MarkdownContent :html="blog.contentHtml" />
    <aside v-if="blog.shareStatement" class="share-note">转载请注明作者及本文链接。</aside>
    <RouterLink to="/home">← 返回文章列表</RouterLink>
  </article>
</template>
