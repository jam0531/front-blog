<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteAdminBlog, getAdminBlogs, getAllAdminCatalog } from '../../api/admin.js'
import AdminError from '../../components/AdminError.vue'
import Pagination from '../../components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const result = ref(null)
const types = ref([])
const loading = ref(false)
const error = ref(null)
const optionsError = ref(null)
const message = ref('')
const deleting = ref('')
const form = reactive({ keyword: '', typeId: '', publish: '', recommend: '' })
const optionsController = new AbortController()
let controller

async function load() {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = null
  for (const key of Object.keys(form)) form[key] = String(route.query[key] || '')
  try { result.value = await getAdminBlogs({ ...form, page: String(route.query.page || '1'), size: 10 }, current.signal) }
  catch (e) { if (e.name !== 'AbortError') { error.value = e; result.value = null } }
  finally { if (controller === current) loading.value = false }
}
async function loadTypes() {
  optionsError.value = null
  try { types.value = await getAllAdminCatalog('types', optionsController.signal) }
  catch (e) { if (e.name !== 'AbortError') optionsError.value = e }
}
function search() {
  message.value = ''
  const query = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value))
  router.push({ path: '/admin/blogs', query })
}
async function remove(blog) {
  if (deleting.value || !window.confirm(`确定删除《${blog.title}》吗？\n文章、标签关联和该文章的全部评论都会删除，且无法在后台恢复。`)) return
  deleting.value = blog.id
  error.value = null
  message.value = ''
  try {
    await deleteAdminBlog(blog.id)
    message.value = '文章已删除。'
    if (result.value.records.length === 1 && result.value.page > 1) {
      await router.replace({ query: { ...route.query, page: result.value.page - 1 } })
    } else await load()
  } catch (e) { error.value = e }
  finally { deleting.value = '' }
}
watch(() => route.fullPath, load, { immediate: true })
onMounted(() => { document.title = '文章管理 · 十二'; loadTypes() })
onBeforeUnmount(() => { controller?.abort(); optionsController.abort() })
</script>

<template>
  <div>
    <header class="admin-title-row"><div><h1>文章管理</h1><p>整理草稿，记录新想法。</p></div><RouterLink class="admin-primary" to="/admin/blogs/new">写文章 +</RouterLink></header>
    <form class="admin-panel admin-filter" @submit.prevent="search">
      <label class="keyword">关键词<input v-model="form.keyword" type="search" maxlength="255" placeholder="标题或摘要" /></label>
      <label>分类<select v-model="form.typeId"><option value="">全部分类</option><option v-for="type in types" :key="type.id" :value="type.id">{{ type.typeName }}</option></select></label>
      <label>状态<select v-model="form.publish"><option value="">全部状态</option><option value="true">已发布</option><option value="false">草稿</option></select></label>
      <label>推荐<select v-model="form.recommend"><option value="">全部文章</option><option value="true">推荐文章</option><option value="false">普通文章</option></select></label>
      <button class="admin-primary" type="submit">筛选</button><RouterLink to="/admin/blogs">清除</RouterLink>
    </form>
    <div v-if="optionsError"><AdminError :error="optionsError" /><button @click="loadTypes">重新加载分类</button></div>
    <AdminError :error="error" />
    <p v-if="message" class="admin-success" role="status">{{ message }}</p>
    <section class="admin-panel" aria-label="文章列表" :aria-busy="loading">
      <p v-if="loading" class="admin-state" role="status">正在加载文章…</p>
      <div v-else-if="!result" class="admin-state"><button @click="load">重新加载</button></div>
      <template v-else>
        <p v-if="!result.records.length" class="admin-state">暂无符合条件的文章。</p>
        <div v-else class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th scope="col">文章</th><th scope="col">分类</th><th scope="col">状态</th><th scope="col">更新时间</th><th scope="col">操作</th></tr></thead>
          <tbody><tr v-for="blog in result.records" :key="blog.id">
            <td class="article-title"><RouterLink :to="`/admin/blogs/${blog.id}/edit`">{{ blog.title }}</RouterLink><p v-if="blog.recommend" class="admin-help">推荐阅读</p></td>
            <td>{{ blog.type?.typeName || '未分类' }}</td><td><span class="admin-badge" :class="{ published: blog.publish }">{{ blog.publish ? '已发布' : '草稿' }}</span></td>
            <td class="nowrap">{{ blog.updateTime?.slice(0, 10) || '—' }}</td>
            <td><div class="admin-row-actions"><RouterLink :to="`/admin/blogs/${blog.id}/edit`">编辑</RouterLink><button class="danger" :disabled="!!deleting" @click="remove(blog)">{{ deleting === blog.id ? '删除中…' : '删除' }}</button></div></td>
          </tr></tbody>
        </table></div>
        <Pagination :page="result.page" :size="result.size" :total="result.total" @change="router.push({ query: { ...route.query, page: $event } })" />
      </template>
    </section>
  </div>
</template>
