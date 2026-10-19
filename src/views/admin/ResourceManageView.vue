<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useUnsavedChanges } from '../../composables/useUnsavedChanges.js'
import { getAdminResources, getAdminResource, saveAdminResource, deleteAdminResource } from '../../api/admin.js'
import AdminError from '../../components/AdminError.vue'
import Pagination from '../../components/Pagination.vue'
import ResourceImage from '../../components/ResourceImage.vue'

const props = defineProps({ resource: { type: String, required: true } })
const definitions = {
  notices: {
    label: '公告',
    title: 'content',
    note: '首页展示创建时间最新的一条公告，编辑旧公告不会改变其创建时间。',
    deleteNote: '删除后，首页会展示剩余公告中最新的一条。',
    fields: [
      { key: 'content', label: '公告内容', multiline: true, required: true }
    ]
  },
  pictures: {
    label: '图片',
    title: 'picName',
    image: 'piclink',
    note: '填写图片地址，供相册与欢迎页背景使用。',
    deleteNote: '删除记录后，该图片会从相册和欢迎页背景中移除。',
    fields: [
      { key: 'picName', label: '图片名称' },
      { key: 'piclink', label: '图片地址', required: true, placeholder: 'https://… 或 /images/…' },
      { key: 'picDescription', label: '图片描述', multiline: true }
    ]
  },
  'friend-links': {
    label: '友链',
    title: 'friendlinkName',
    image: 'friendlinkAvater',
    note: '友链按创建时间从新到旧展示。',
    deleteNote: '删除后，该小站不再显示在友链页。',
    fields: [
      { key: 'friendlinkName', label: '博客名称', required: true },
      { key: 'friendlinkAddress', label: '博客地址', required: true, placeholder: 'https://…' },
      { key: 'friendlinkAvater', label: '头像地址', required: true, placeholder: 'https://… 或 /images/…' },
      { key: 'friendlinkDescription', label: '博客描述', multiline: true }
    ]
  },
}
const config = computed(() => definitions[props.resource])
const result = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref(null)
const message = ref('')
const editId = ref('')
const form = reactive(Object.fromEntries(config.value.fields.map(field => [field.key, ''])))
const baseline = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== baseline.value)
const { mayLeave } = useUnsavedChanges({
  dirty,
  busy,
  message: '还有未保存的内容，确定放弃修改吗？',
})
let controller
const editController = new AbortController()

async function load(page = result.value?.page || 1) {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    result.value = await getAdminResources(props.resource, page, current.signal)
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e
  } finally {
    if (controller === current) loading.value = false
  }
}
function reset() {
  editId.value = ''
  for (const field of config.value.fields) form[field.key] = ''
  baseline.value = JSON.stringify(form)
}
async function edit(item) {
  if (!mayLeave()) return
  error.value = null
  message.value = ''
  if (!item) {
    reset()
    return
  }
  busy.value = true
  try {
    const detail = await getAdminResource(props.resource, item.id, editController.signal)
    editId.value = detail.id
    for (const field of config.value.fields) form[field.key] = detail[field.key] || ''
    baseline.value = JSON.stringify(form)
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e
  } finally {
    busy.value = false
  }
}
async function save() {
  if (busy.value) return
  if (config.value.fields.some(field => field.required && !form[field.key].trim())) {
    error.value = new Error('请填写所有必填内容。')
    return
  }
  busy.value = true
  error.value = null
  message.value = ''
  const updating = !!editId.value
  try {
    const input = Object.fromEntries(config.value.fields.map(field => [field.key, form[field.key].trim()]))
    await saveAdminResource(props.resource, editId.value, input)
    reset()
    message.value = `${config.value.label}已${updating ? '更新' : '新增'}。`
    await load(updating ? result.value?.page || 1 : 1)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function remove(item) {
  if (busy.value || !window.confirm(
    `确定删除${config.value.label}“${item[config.value.title] || '未命名'}”吗？\n${config.value.deleteNote}\n此操作无法在后台恢复。`
  )) return
  busy.value = true
  error.value = null
  message.value = ''
  try {
    await deleteAdminResource(props.resource, item.id)
    if (editId.value === item.id) reset()
    message.value = `${config.value.label}已删除。`
    await load(result.value.records.length === 1 ? Math.max(1, result.value.page - 1) : result.value.page)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  document.title = `${config.value.label}管理 · 十二`
  load()
})
onBeforeUnmount(() => {
  controller?.abort()
  editController.abort()
})
</script>

<template>
  <div>
    <header class="admin-title-row">
      <div>
        <h1>{{ config.label }}管理</h1>
        <p>{{ config.note }}</p>
      </div>
    </header>
    <form class="admin-panel" @submit.prevent="save">
      <h2>{{ editId ? '编辑' : '新增' }}{{ config.label }}</h2>
      <fieldset :disabled="busy" class="resource-fields">
        <div class="admin-form-grid">
          <label v-for="field in config.fields" :key="field.key" :class="{ full: field.multiline }">{{ field.label }}{{ field.required ? ' *' : '' }}<textarea
              v-if="field.multiline"
              v-model="form[field.key]"
              :required="field.required"
              maxlength="255"
              rows="3"
            /><input
              v-else
              v-model="form[field.key]"
              :required="field.required"
              maxlength="255"
              :placeholder="field.placeholder || ''"
            /></label>
        </div>
        <div class="admin-form-actions">
          <span v-if="dirty" class="admin-muted">有未保存的修改</span>
          <button v-if="editId" type="button" @click="edit(null)">取消编辑</button>
          <button class="admin-primary" type="submit">{{ busy ? '正在处理…' : editId ? '保存修改' : `新增${config.label}` }}</button>
        </div>
      </fieldset>
    </form>
    <AdminError :error="error" />
    <p v-if="message" class="admin-success" role="status">{{ message }}</p>
    <section class="admin-panel" :aria-label="`${config.label}列表`" :aria-busy="loading">
      <p v-if="loading" class="admin-state" role="status">正在加载{{ config.label }}…</p>
      <template v-else-if="result">
        <p v-if="!result.records.length" class="admin-state">暂无{{ config.label }}。</p>
        <div v-else class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th v-if="config.image" scope="col">图片</th>
                <th scope="col">{{ props.resource === 'notices' ? '内容' : '名称' }}</th>
                <th scope="col">创建时间</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in result.records" :key="item.id">
                <td v-if="config.image">
                  <div class="resource-thumbnail">
                    <ResourceImage :src="item[config.image]" :alt="''" />
                  </div>
                </td>
                <td class="resource-title">{{ item[config.title] || '未命名' }}</td>
                <td class="nowrap">{{ item.createTime?.slice(0, 10) || '未记录' }}</td>
                <td>
                  <div class="admin-row-actions">
                    <button :disabled="busy" @click="edit(item)">编辑</button>
                    <button class="danger" :disabled="busy" @click="remove(item)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          :page="result.page"
          :size="result.size"
          :total="result.total"
          unit="项"
          :label="`${config.label}分页`"
          @change="load"
        />
      </template>
      <div v-else class="admin-state">
        <button @click="load()">重新加载</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.resource-fields {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.resource-thumbnail {
  width: 72px;
  height: 54px;
  border-radius: 4px;
  overflow: hidden;
}

.resource-thumbnail :deep(.resource-image-fallback) {
  min-height: 54px;
  gap: 0;
}

.resource-thumbnail :deep(small) {
  display: none;
}

.resource-title {
  min-width: 180px;
  max-width: 480px;
  overflow-wrap: anywhere;
}
</style>
