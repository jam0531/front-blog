<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { getAdminBlog, getAllAdminCatalog, previewBlog, saveAdminBlog } from '../../api/admin.js'
import AdminError from '../../components/AdminError.vue'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import MarkdownContent from '../../components/MarkdownContent.vue'

const route = useRoute()
const router = useRouter()
const navigation = inject('adminNavigation')
const id = computed(() => route.params.id ? String(route.params.id) : '')
const loading = ref(true)
const busy = ref(false)
const error = ref(null)
const message = ref('')
const types = ref([])
const tags = ref([])
const formElement = ref(null)
const editor = ref(null)
const form = reactive({ title: '', description: '', blogPic: '', flag: '原创', contentMarkdown: '', typeId: '', tagIds: [], publish: false, recommend: true, shareStatement: false, commentAble: false })
const baseline = ref('')
const dirty = computed(() => !!baseline.value && JSON.stringify(form) !== baseline.value)
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewHtml = ref('')
const previewSource = ref(null)
const previewError = ref(null)
const missingTags = computed(() => form.tagIds.filter(tagId => !tags.value.some(tag => tag.id === tagId)))
let controller
let previewController

async function load() {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    const [allTypes, allTags, blog] = await Promise.all([
      getAllAdminCatalog('types', current.signal), getAllAdminCatalog('tags', current.signal),
      id.value ? getAdminBlog(id.value, current.signal) : Promise.resolve(null),
    ])
    types.value = allTypes
    tags.value = allTags
    if (blog) {
      for (const key of ['title', 'description', 'blogPic', 'flag', 'contentMarkdown', 'typeId']) form[key] = blog[key] || ''
      form.tagIds = [...(blog.tagIds || [])]
      for (const key of ['publish', 'recommend', 'shareStatement', 'commentAble']) form[key] = !!blog[key]
    }
    baseline.value = JSON.stringify(form)
  } catch (e) { if (e.name !== 'AbortError') error.value = e }
  finally { if (controller === current) loading.value = false }
}
async function showPreview() {
  if (previewLoading.value || busy.value) return
  previewOpen.value = true
  previewLoading.value = true
  previewError.value = null
  previewController?.abort()
  const current = previewController = new AbortController()
  try {
    const source = await editor.value.getContent()
    const data = await previewBlog(source, current.signal)
    previewHtml.value = data.contentHtml
    previewSource.value = source
  } catch (e) { if (e.name !== 'AbortError') previewError.value = e }
  finally { if (previewController === current) previewLoading.value = false }
}
async function save(publish) {
  if (busy.value || !formElement.value.reportValidity()) return
  if (form.publish && !publish && !window.confirm('转为草稿后，这篇文章将不再公开显示。确定继续吗？')) return
  busy.value = true
  error.value = null
  message.value = ''
  try {
    form.contentMarkdown = await editor.value.getContent()
    if (!form.contentMarkdown.trim()) throw new Error('请填写文章正文。')
    if (!form.title.trim() || !form.description.trim()) throw new Error('标题和摘要不能为空。')
    if (missingTags.value.length) throw new Error('部分已关联标签不存在，请先取消选中这些标签。')
    if (!types.value.some(type => type.id === form.typeId)) throw new Error('请选择有效的分类。')
    // 业务 ID 始终保留字符串；只提交可编辑字段，不携带作者、阅读量和时间。
    const input = { ...form, title: form.title.trim(), description: form.description.trim(), blogPic: form.blogPic.trim(), tagIds: [...form.tagIds], publish }
    const saved = await saveAdminBlog(id.value, input)
    Object.assign(form, input)
    baseline.value = JSON.stringify(form)
    message.value = saved.publish ? '文章已保存并发布。' : '草稿已保存。'
    if (!id.value) {
      busy.value = false
      await router.replace(`/admin/blogs/${saved.id}/edit`)
    }
  } catch (e) { if (e.name !== 'AbortError') error.value = e }
  finally { busy.value = false }
}
function mayLeave() {
  if (navigation?.loggingOut.value) return true
  if (busy.value) return false
  return !dirty.value || window.confirm('文章还有未保存的修改，确定离开吗？')
}
function beforeUnload(event) { if (dirty.value || busy.value) { event.preventDefault(); event.returnValue = '' } }
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
if (navigation) navigation.beforeLogout.value = mayLeave
onMounted(() => { document.title = `${id.value ? '编辑文章' : '写文章'} · 十二`; load(); window.addEventListener('beforeunload', beforeUnload) })
onBeforeUnmount(() => { controller?.abort(); previewController?.abort(); window.removeEventListener('beforeunload', beforeUnload); if (navigation?.beforeLogout.value === mayLeave) navigation.beforeLogout.value = null })
</script>

<template>
  <div>
    <header class="admin-title-row"><div><h1>{{ id ? '编辑文章' : '写文章' }}</h1><p>{{ id ? '编辑正文与分类，保存你的修改。' : '从一个标题开始，记录值得留下的想法。' }}</p></div><RouterLink to="/admin/blogs">返回列表 ↗</RouterLink></header>
    <p v-if="loading" class="admin-panel admin-state" role="status">正在加载编辑信息…</p>
    <template v-else>
      <AdminError :error="error" /><p v-if="message" class="admin-success" role="status">{{ message }}</p>
      <div v-if="!baseline" class="admin-panel admin-state"><button @click="load">重新加载</button></div>
      <form v-else ref="formElement" @submit.prevent="save(form.publish)">
        <fieldset class="admin-edit-fields" :disabled="busy">
          <section class="admin-panel admin-form-grid" aria-label="文章信息">
            <label class="full">文章标题<input v-model="form.title" required maxlength="255" placeholder="为这篇文章起一个标题" /></label>
            <label>文章分类<select v-model="form.typeId" required><option value="" disabled>请选择分类</option><option v-if="form.typeId && !types.some(type => type.id === form.typeId)" :value="form.typeId" disabled>原分类已不存在，请重新选择</option><option v-for="type in types" :key="type.id" :value="type.id">{{ type.typeName }}</option></select><span v-if="!types.length" class="admin-help">请先在分类管理中新增分类。</span></label>
            <label>文章来源<select v-model="form.flag" required><option value="" disabled>请选择来源</option><option>原创</option><option>转载</option><option>翻译</option></select></label>
            <label class="full">封面地址<input v-model="form.blogPic" required maxlength="255" placeholder="https://… 或 /images/…" /><span class="admin-help">填写图片地址，不上传文件。</span></label>
            <label class="full">文章摘要<textarea v-model="form.description" required maxlength="200" rows="3" placeholder="用几句话概括这篇文章" /><span class="admin-help">{{ form.description.length }} / 200</span></label>
            <div class="full"><p class="admin-field-label">文章标签</p><div class="admin-checkboxes"><label v-for="tag in tags" :key="tag.id"><input v-model="form.tagIds" type="checkbox" :value="tag.id" />{{ tag.tagName }}</label><label v-for="tagId in missingTags" :key="tagId"><input v-model="form.tagIds" type="checkbox" :value="tagId" />已失效标签 {{ tagId }}</label></div><p v-if="!tags.length && !missingTags.length" class="admin-help">暂无标签，可稍后添加。</p></div>
          </section>
          <section class="admin-panel" aria-labelledby="body-heading"><div class="admin-title-row"><h2 id="body-heading">文章正文</h2><button type="button" :disabled="previewLoading" @click="showPreview">{{ previewLoading ? '正在生成预览…' : '预览正文' }}</button></div><MarkdownEditor ref="editor" v-model="form.contentMarkdown" :disabled="busy" /></section>
          <section class="admin-panel"><div class="admin-checkboxes"><label><input v-model="form.recommend" type="checkbox" />推荐阅读</label><label><input v-model="form.commentAble" type="checkbox" />允许评论</label><label><input v-model="form.shareStatement" type="checkbox" />显示转载声明</label></div><div class="admin-form-actions"><span class="admin-muted">{{ dirty ? '有未保存的修改' : form.publish ? '当前为已发布文章' : '当前为草稿' }}</span><button type="button" @click="save(false)">{{ busy ? '正在保存…' : form.publish ? '转为草稿' : '保存草稿' }}</button><button class="admin-primary" type="button" @click="save(true)">{{ busy ? '正在保存…' : form.publish ? '保存修改' : '保存并发布' }}</button></div></section>
        </fieldset>
      </form>
      <section v-if="previewOpen" class="admin-panel admin-preview" aria-labelledby="preview-heading"><div class="admin-title-row"><h2 id="preview-heading">正文预览</h2><button type="button" @click="previewOpen = false">收起预览</button></div><AdminError :error="previewError" /><p v-if="previewLoading" class="admin-state" role="status">正在生成预览…</p><template v-else-if="previewSource !== null"><p v-if="previewSource !== form.contentMarkdown" class="admin-help">正文已有修改，请重新预览以查看最新内容。</p><MarkdownContent :html="previewHtml" /></template></section>
    </template>
  </div>
</template>

<style scoped>
.admin-edit-fields { padding: 0; margin: 0; border: 0; min-width: 0; }
.admin-field-label { margin: 0 0 12px; font-size: 13px; color: #57675e; }
.admin-preview { overflow-wrap: anywhere; }
.admin-preview :deep(pre) { overflow-x: auto; }
.admin-panel .admin-title-row { margin-bottom: 18px; }
.admin-panel .admin-title-row h2 { margin: 0; }
</style>
