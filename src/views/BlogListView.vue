<script setup>
import ErrorNotice from '../components/ErrorNotice.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findBlogs } from '../api/blog.js'
import { getTypes, getTags, getArchives } from '../api/catalog.js'
import BrowseShell from '../components/BrowseShell.vue'
import LayoutPreviewPost from '../components/LayoutPreviewPost.vue'
import Pagination from '../components/Pagination.vue'
import { getHomeLayout } from '../state/homeLayout.js'
const route = useRoute()
const router = useRouter()
const result = ref(null)
const loading = ref(false)
const error = ref('')
const catalogError = ref('')
const types = ref([])
const tags = ref([])
const archives = ref([])
const form = reactive({ keyword: '', typeId: '', tagId: '', year: '' })
const title = computed(() => route.meta.title || '文章')
const layout = computed(() => getHomeLayout())
const postVariant = computed(() => ({ editorial: 'row', journal: 'journal', gallery: 'grid' })[layout.value.id])
const description = computed(() => route.meta.filter === 'year'
  ? '回到这一年，重读当时的想法与日常。'
  : route.meta.filter ? '沿着这个主题，继续阅读相关的记录。' : '在标题与摘要里，寻找你想读的内容。')
const optionsController = new AbortController()
let controller

function routeFilters() {
  const filters = { page: String(route.query.page || '1'), size: 10 }
  for (const key of Object.keys(form)) filters[key] = String(route.query[key] || '')
  if (route.meta.filter) filters[route.meta.filter] = String(route.params.id || route.params.year)
  return filters
}
async function loadOptions() {
  catalogError.value = ''
  try { [types.value, tags.value, archives.value] = await Promise.all([getTypes(optionsController.signal), getTags(optionsController.signal), getArchives(optionsController.signal)]) }
  catch (e) { if (e.name !== 'AbortError') catalogError.value = '筛选选项加载失败，仍可输入关键词搜索。' }
}
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  const filters = routeFilters()
  for (const key of Object.keys(form)) form[key] = filters[key]
  loading.value = true
  error.value = ''
  result.value = null
  document.title = `${title.value} · 十二`
  try { result.value = await findBlogs(filters, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '文章加载失败，请重试。' }
  finally { if (controller === current) loading.value = false }
}
function search() {
  const query = {}
  for (const key of Object.keys(form)) if (form[key].trim()) query[key] = form[key].trim()
  router.push({ path: '/search', query })
}
watch(() => route.fullPath, load, { immediate: true })
onMounted(loadOptions)
onBeforeUnmount(() => { controller?.abort(); optionsController.abort() })
</script>

<template>
  <BrowseShell :title="title" :description="description">
    <form class="browse-search" @submit.prevent="search">
      <div class="search-main">
        <label class="search-keyword">关键词<input v-model="form.keyword" type="search" maxlength="255" placeholder="搜索标题和摘要" /></label>
        <button class="search-submit" type="submit">搜索 <span aria-hidden="true">↗</span></button>
      </div>
      <div class="search-filters">
        <label>分类<select v-model="form.typeId"><option value="">全部分类</option><option v-for="type in types" :key="type.id" :value="type.id">{{ type.typeName }}</option></select></label>
        <label>标签<select v-model="form.tagId"><option value="">全部标签</option><option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.tagName }}</option></select></label>
        <label>年份<select v-model="form.year"><option value="">全部年份</option><option v-for="archive in archives" :key="archive.year" :value="String(archive.year)">{{ archive.year }}</option></select></label>
        <RouterLink class="clear-filters" to="/search">清除条件</RouterLink>
      </div>
      <div v-if="catalogError" class="catalog-error"><ErrorNotice :error="catalogError" /><button type="button" @click="loadOptions">重新加载筛选选项</button></div>
    </form>
    <section aria-label="文章列表" :aria-busy="loading">
      <div v-if="loading" class="browse-state" role="status">正在加载文章…</div>
      <div v-else-if="error" class="browse-state"><ErrorNotice :error="error" /><button @click="load">重新加载文章</button></div>
      <template v-else-if="result">
        <div class="browse-section-heading results-heading"><h2>共找到 {{ result.total }} 篇文章</h2><span>按最近更新排列</span></div>
        <div v-if="!result.records.length" class="browse-state">{{ result.total ? '该页没有文章，请返回第一页。' : '没有符合条件的文章，可以调整筛选条件。' }}</div>
        <div v-else class="browse-results" :class="`results-${layout.id}`"><LayoutPreviewPost v-for="blog in result.records" :key="blog.id" :blog="blog" :variant="postVariant" /></div>
        <Pagination :page="result.page" :size="result.size" :total="result.total" @change="router.push({ path: route.path, query: { ...route.query, page: $event } })" />
      </template>
    </section>
  </BrowseShell>
</template>

<style scoped>
.browse-search { padding: 0 0 32px; margin-bottom: 30px; border-bottom: 1px solid var(--layout-line); }
.search-main { display: flex; align-items: flex-end; gap: 14px; }
.browse-search label { display: flex; flex-direction: column; gap: 9px; min-width: 0; font-size: 11px; color: var(--layout-muted); }
.search-keyword { flex: 1; }
.browse-search input, .browse-search select { width: 100%; min-width: 0; height: 44px; padding: 10px 13px; font: inherit; font-size: 13px; color: var(--layout-ink); border: 1px solid var(--layout-line); border-radius: 5px; background: var(--browse-surface); }
.browse-search input { height: 48px; font-size: 14px; }
.browse-search input::placeholder { color: var(--layout-muted); }
.browse-search input:focus-visible, .browse-search select:focus-visible { outline: 2px solid var(--layout-accent); outline-offset: 3px; }
.search-submit { display: inline-flex; align-items: center; justify-content: center; gap: 25px; min-height: 48px; padding: 10px 23px; border-color: var(--layout-accent); border-radius: 5px; background: var(--layout-accent); color: #fff; font-size: 13px; }
.search-submit:hover:not(:disabled) { background: var(--layout-ink); color: #fff; border-color: var(--layout-ink); }
.search-submit > span { font-size: 18px; }
.search-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: 18px; margin-top: 20px; }
.clear-filters { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--layout-muted); font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
.clear-filters:hover { color: var(--layout-accent); }
.catalog-error { margin: 20px 0 0; font-size: 12px; color: var(--layout-muted); }
.results-heading { margin-bottom: 12px; }
.results-journal { max-width: 820px; margin: 0 auto; }
.results-gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; padding-top: 12px; }
@media (max-width: 1050px) { .results-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .search-main { gap: 10px; }
  .search-submit { padding: 10px 18px; gap: 10px; }
  .search-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .clear-filters { justify-content: flex-end; }
  .results-gallery { grid-template-columns: 1fr; }
}
</style>
