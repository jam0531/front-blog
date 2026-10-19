<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useUnsavedChanges } from '../../composables/useUnsavedChanges.js'
import { getAdminNavigation, getNavigationPages, saveNavigation, deleteNavigation } from '../../api/navigation.js'
import { refreshNavigation } from '../../state/navigation.js'
import { showError } from '../../state/errorNotifications.js'
import AdminError from '../../components/AdminError.vue'

const items = ref([])
const pages = ref([])
const ready = ref(false)
const loading = ref(false)
const busy = ref(false)
const error = ref(null)
const message = ref('')
const editId = ref('')
const emptyForm = () => ({ pageKey: '', menuName: '', sortOrder: 10, visible: true })
const form = reactive(emptyForm())
const original = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== original.value)
const { mayLeave } = useUnsavedChanges({
  dirty,
  busy,
  message: '菜单配置尚未保存，确定放弃修改吗？',
})
const selectedPage = computed(() => pages.value.find(page => page.pageKey === form.pageKey))
const canSave = computed(() =>
  ready.value && !loading.value && !busy.value && selectedPage.value &&
  form.menuName.trim() && Number.isInteger(form.sortOrder) && form.sortOrder >= 0 && form.sortOrder <= 9999
)
const allConfigured = computed(() =>
  pages.value.length > 0 && pages.value.every(page => items.value.some(item => item.pageKey === page.pageKey))
)
let controller

function pageUsed(pageKey) {
  return items.value.some(item => item.pageKey === pageKey && item.id !== editId.value)
}
function setForm(item = null) {
  editId.value = item?.id || ''
  Object.assign(form, item ? {
    pageKey: item.pageKey,
    menuName: item.menuName,
    sortOrder: item.sortOrder,
    visible: item.visible
  } : emptyForm())
  original.value = JSON.stringify(form)
}
function edit(item) {
  if (!mayLeave()) return
  setForm(item)
  message.value = ''
}
function fillName() {
  if (!editId.value && selectedPage.value) form.menuName = selectedPage.value.pageName
}

async function load() {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    const [list, available] = await Promise.all([
      getAdminNavigation(current.signal),
      getNavigationPages(current.signal)
    ])
    if (controller !== current) return
    items.value = list
    pages.value = available
    ready.value = true
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e
  } finally {
    if (controller === current) loading.value = false
  }
}
async function refreshAfterSave(text) {
  message.value = text
  const [, updated] = await Promise.all([load(), refreshNavigation()])
  if (!updated) showError('前台菜单暂未刷新，请稍后刷新页面。已保存的配置不会丢失。')
}
async function save() {
  if (!canSave.value) return
  busy.value = true
  error.value = null
  message.value = ''
  try {
    await saveNavigation(editId.value, { ...form, menuName: form.menuName.trim() })
    // 写入成功后先清空已提交表单，列表刷新失败也不能引导重复提交。
    setForm()
    await refreshAfterSave('菜单已保存。')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function remove(item) {
  if (busy.value || loading.value) return
  const editWarning = editId.value === item.id && dirty.value ? '\n该菜单尚未保存的编辑也会丢弃。' : ''
  if (!window.confirm(
    `确定删除菜单“${item.menuName}”吗？\n只移除导航配置，不会删除页面或页面内容。${editWarning}`
  )) return
  busy.value = true
  error.value = null
  message.value = ''
  try {
    await deleteNavigation(item.id)
    if (editId.value === item.id) setForm()
    await refreshAfterSave('菜单已删除，对应页面仍可通过原网址访问。')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  document.title = '导航管理 · 十二'
  load()
})
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div>
    <header class="admin-title-row">
      <div>
        <h1>导航管理</h1>
        <p>管理“更多”中的菜单。隐藏菜单后，原页面网址仍可访问。</p>
      </div>
    </header>
    <form class="admin-panel" @submit.prevent="save">
      <h2>{{ editId ? '编辑菜单' : '新增菜单' }}</h2>
      <p v-if="!editId && allConfigured" class="admin-muted">所有可选页面均已配置。可在下方编辑现有菜单，或删除配置后重新添加。</p>
      <div class="admin-form-grid">
        <label>关联页面<select
            v-model="form.pageKey"
            required
            :disabled="busy || loading || !ready"
            @change="fillName"
          >
            <option value="" disabled>请选择已有页面</option>
            <option
              v-for="page in pages"
              :key="page.pageKey"
              :value="page.pageKey"
              :disabled="pageUsed(page.pageKey)"
            >{{ page.pageName }}{{ pageUsed(page.pageKey) ? '（已配置）' : '' }}</option>
          </select></label>
        <label>页面地址<input :value="selectedPage?.path || ''" readonly placeholder="选择页面后自动显示" /></label>
        <label>菜单名称<input
            v-model="form.menuName"
            required
            maxlength="64"
            :disabled="busy || !ready"
            placeholder="最多 64 个字符"
          /></label>
        <label>排序<input
            v-model.number="form.sortOrder"
            type="number"
            min="0"
            max="9999"
            step="1"
            required
            :disabled="busy || !ready"
          /><span class="admin-help">仅限 0～9999 的整数，不支持小数。数字越小越靠前；相同数字按 ID 排序。</span></label>
        <div class="admin-checkboxes full">
          <label><input v-model="form.visible" type="checkbox" :disabled="busy || !ready" />在“更多”中显示</label>
        </div>
      </div>
      <div class="admin-form-actions">
        <button
          v-if="editId || dirty"
          type="button"
          :disabled="busy"
          @click="edit(null)"
        >取消编辑</button>
        <button type="submit" class="admin-primary" :disabled="!canSave">{{ busy ? '正在处理…' : editId ? '保存修改' : '新增菜单' }}</button>
      </div>
    </form>
    <AdminError :error="error" />
    <p v-if="message" class="admin-success" role="status">{{ message }}</p>
    <section class="admin-panel" aria-label="菜单列表" :aria-busy="loading">
      <p v-if="loading" class="admin-state" role="status">正在加载菜单…</p>
      <template v-else-if="ready">
        <p v-if="!items.length" class="admin-state">暂无菜单，前台不显示“更多”入口。</p>
        <div v-else class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th scope="col">菜单名称</th>
                <th scope="col">页面地址</th>
                <th scope="col">排序</th>
                <th scope="col">显示状态</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.menuName }}</td>
                <td>{{ item.path || '页面未登记，请重新选择' }}</td>
                <td>{{ item.sortOrder }}</td>
                <td>
                  <span class="admin-badge" :class="{ published: item.visible }">{{ item.visible ? '显示' : '隐藏' }}</span>
                </td>
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
      </template>
      <button v-if="error" :disabled="busy || loading" @click="load">重新加载</button>
    </section>
  </div>
</template>
