<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { getAdminDiscussions, replyAdminDiscussion, deleteAdminDiscussion } from '../../api/discussions.js'
import AdminError from '../../components/AdminError.vue'
import Pagination from '../../components/Pagination.vue'
const props = defineProps({ resource: { type: String, required: true } })
const isComments = computed(() => props.resource === 'comments')
const label = computed(() => isComments.value ? '评论' : '留言')
const navigation = inject('adminNavigation')
const result = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref(null)
const success = ref('')
const filters = reactive({ blogId: '', messageType: '' })
const replying = ref(null)
const content = ref('')
let appliedFilters = { ...filters }, controller
async function load(page = result.value?.page || 1) {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true; error.value = null
  try { result.value = await getAdminDiscussions(props.resource, { ...appliedFilters, page }, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e }
  finally { if (controller === current) loading.value = false }
}
function mayLeave() {
  if (navigation?.loggingOut.value) return true
  return !busy.value && (!content.value.trim() || window.confirm('回复尚未发表，确定放弃吗？'))
}
function selectReply(item) { if (mayLeave()) { replying.value = item; content.value = ''; success.value = '' } }
function filter() { if (!mayLeave()) return; replying.value = null; content.value = ''; appliedFilters = { blogId: filters.blogId.trim(), messageType: filters.messageType }; load(1) }
async function submit() {
  if (busy.value || !replying.value || !content.value.trim()) return
  busy.value = true; error.value = null; success.value = ''
  try { await replyAdminDiscussion(props.resource, replying.value.id, content.value.trim()); replying.value = null; content.value = ''; success.value = '回复已发表。'; await load(1) }
  catch (e) { error.value = e }
  finally { busy.value = false }
}
async function remove(item) {
  if (busy.value || !mayLeave() || !window.confirm(`删除这条${label.value}及其全部后续回复？\n此操作无法在后台恢复。`)) return
  busy.value = true; error.value = null; success.value = ''
  try { await deleteAdminDiscussion(props.resource, item.id); replying.value = null; content.value = ''; success.value = `${label.value}及其回复已删除。`; await load(result.value.records.length === 1 ? Math.max(1, result.value.page - 1) : result.value.page) }
  catch (e) { error.value = e }
  finally { busy.value = false }
}
function beforeUnload(event) { if (busy.value || content.value.trim()) { event.preventDefault(); event.returnValue = '' } }
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
if (navigation) navigation.beforeLogout.value = mayLeave
onMounted(() => { document.title = `${label.value}管理 · 十二`; load(); window.addEventListener('beforeunload', beforeUnload) })
onBeforeUnmount(() => { controller?.abort(); window.removeEventListener('beforeunload', beforeUnload); if (navigation?.beforeLogout.value === mayLeave) navigation.beforeLogout.value = null })
</script>

<template>
  <div><header class="admin-title-row"><div><h1>{{ label }}管理</h1><p>{{ isComments ? '管理文章下的交流，关闭评论的文章仍可在这里回复。' : '普通留言和友链交流分别管理。' }}</p></div></header>
    <form class="admin-filters admin-panel" @submit.prevent="filter"><label v-if="isComments">文章 ID<input v-model="filters.blogId" inputmode="numeric" pattern="[1-9][0-9]*" placeholder="留空显示全部" /></label><label v-else>留言类型<select v-model="filters.messageType"><option value="">全部留言</option><option value="0">普通留言</option><option value="1">友链交流</option></select></label><button :disabled="busy">筛选</button></form>
    <form v-if="replying" class="admin-panel" @submit.prevent="submit"><h2>回复 {{ replying.nickname || '访客' }}</h2><p class="managed-content">{{ replying.content }}</p><label class="managed-reply">回复内容<textarea v-model="content" :disabled="busy" required maxlength="5000" rows="4" /></label><div class="admin-form-actions"><span class="admin-muted">以博主身份发表 · 纯文本 · 每次间隔 15 秒</span><button type="button" :disabled="busy" @click="selectReply(null)">取消回复</button><button class="admin-primary" :disabled="busy">{{ busy ? '正在处理…' : '发表回复' }}</button></div></form>
    <AdminError :error="error" /><p v-if="success" class="admin-success" role="status">{{ success }}</p>
    <section class="admin-panel" :aria-label="`${label}列表`" :aria-busy="loading"><p v-if="loading" class="admin-state" role="status">正在加载…</p><template v-else-if="result"><p v-if="!result.records.length" class="admin-state">暂无{{ label }}。</p><ul v-else class="managed-discussions"><li v-for="item in result.records" :key="item.id"><header><strong>{{ item.nickname || '访客' }}</strong><span v-if="item.admin" class="admin-badge">博主</span><time>{{ item.createTime?.replace('T',' ') || '日期未记录' }}</time></header><p class="managed-context" v-if="isComments"><RouterLink v-if="item.blogId" :to="`/admin/blogs/${item.blogId}/edit`">{{ item.blogTitle || `文章 ${item.blogId}` }}</RouterLink><span v-else>文章关联缺失</span></p><p v-else class="managed-context">{{ item.messageType === 1 ? '友链交流' : '普通留言' }}</p><p class="managed-content">{{ item.content }}</p><p class="managed-context">邮箱：{{ item.email || '未提供' }}<br />{{ item.parentId ? `回复 ${item.parentId}` : '根话题' }} · ID {{ item.id }}</p><div class="admin-row-actions"><button :disabled="busy || (isComments && !item.blogId)" @click="selectReply(item)">回复</button><button :disabled="busy" class="danger" @click="remove(item)">删除及全部回复</button></div></li></ul><Pagination :page="result.page" :size="result.size" :total="result.total" unit="条" :label="`${label}管理分页`" @change="page => !busy && load(page)" /></template><button v-else @click="load()">重新加载</button></section>
  </div>
</template>

<style scoped>
.managed-discussions { list-style: none; margin: 0; padding: 0; }.managed-discussions > li { padding: 20px 0; border-bottom: 1px solid #e3e8e3; }.managed-discussions > li:first-child { padding-top: 0; }.managed-discussions header { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }.managed-discussions time,.managed-context { color: #738079; font-size: 12px; line-height: 1.9; overflow-wrap: anywhere; }.managed-content { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.9; font-size: 14px; }.managed-reply { display: flex; flex-direction: column; gap: 10px; font-size: 13px; }.managed-reply textarea { padding: 12px; border: 1px solid #d8e1d9; border-radius: 4px; resize: vertical; font: inherit; line-height: 1.8; }
</style>
