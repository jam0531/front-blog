<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUnsavedChanges } from '../../composables/useUnsavedChanges.js'
import { getAdminCatalog, saveAdminCatalog, deleteAdminCatalog } from '../../api/admin.js'
import AdminError from '../../components/AdminError.vue'
import Pagination from '../../components/Pagination.vue'

const props = defineProps({ resource: { type: String, required: true } })
const label = computed(() => props.resource === 'types' ? '分类' : '标签')
const field = computed(() => props.resource === 'types' ? 'typeName' : 'tagName')
const result = ref(null)
const loading = ref(false)
const busy = ref(false)
const error = ref(null)
const message = ref('')
const editId = ref('')
const name = ref('')
const originalName = ref('')
const dirty = computed(() => name.value !== originalName.value)
const { mayLeave } = useUnsavedChanges({
  dirty,
  busy,
  message: '名称尚未保存，确定放弃修改吗？',
})
let controller

async function load(page = result.value?.page || 1) {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    result.value = await getAdminCatalog(props.resource, page, 10, current.signal)
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e
  } finally {
    if (controller === current) loading.value = false
  }
}
function edit(item) {
  if (!mayLeave()) return
  editId.value = item?.id || ''
  name.value = originalName.value = item?.[field.value] || ''
  message.value = ''
}
async function save() {
  if (busy.value || !name.value.trim()) return
  busy.value = true
  error.value = null
  message.value = ''
  const updating = !!editId.value
  try {
    await saveAdminCatalog(props.resource, editId.value, { [field.value]: name.value.trim() })
    editId.value = name.value = originalName.value = ''
    message.value = `${label.value}已${updating ? '更新' : '新增'}。`
    await load(updating ? result.value?.page || 1 : 1)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function remove(item) {
  if (busy.value || !window.confirm(
    `确定删除${label.value}“${item[field.value]}”吗？\n删除后无法在后台恢复；被文章使用时将拒绝删除。`
  )) return
  busy.value = true
  error.value = null
  message.value = ''
  try {
    await deleteAdminCatalog(props.resource, item.id)
    if (editId.value === item.id) editId.value = name.value = originalName.value = ''
    message.value = `${label.value}已删除。`
    await load(result.value.records.length === 1 ? Math.max(1, result.value.page - 1) : result.value.page)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  document.title = `${label.value}管理 · 十二`
  load()
})
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div>
    <header class="admin-title-row">
      <div>
        <h1>{{ label }}管理</h1>
        <p>被文章使用的{{ label }}不能直接删除。</p>
      </div>
    </header>
    <form class="admin-panel admin-filter" @submit.prevent="save">
      <label>{{ editId ? '编辑' : '新增' }}{{ label }}<input
          v-model="name"
          required
          maxlength="255"
          :disabled="busy"
          :placeholder="`输入${label}名称`"
        /></label>
      <button class="admin-primary" :disabled="busy || !name.trim()" type="submit">{{ busy ? '正在处理…' : editId ? '保存修改' : `新增${label}` }}</button>
      <button
        v-if="editId"
        type="button"
        :disabled="busy"
        @click="edit(null)"
      >取消编辑</button>
    </form>
    <AdminError :error="error" />
    <p v-if="message" class="admin-success" role="status">{{ message }}</p>
    <section class="admin-panel" :aria-label="`${label}列表`" :aria-busy="loading">
      <p v-if="loading" class="admin-state" role="status">正在加载{{ label }}…</p>
      <template v-else-if="result">
        <p v-if="!result.records.length" class="admin-state">暂无{{ label }}。</p>
        <div v-else class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th scope="col">名称</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in result.records" :key="item.id">
                <td>{{ item[field] }}</td>
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
          :label="`${label}分页`"
          @change="load"
        />
      </template>
      <div v-else class="admin-state">
        <button @click="load()">重新加载</button>
      </div>
    </section>
  </div>
</template>
