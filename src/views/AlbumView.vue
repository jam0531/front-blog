<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPictures, getPictureArchives } from '../api/resources.js'
import BrowseShell from '../components/BrowseShell.vue'
import ResourceImage from '../components/ResourceImage.vue'
import Pagination from '../components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const result = ref(null)
const archives = ref([])
const loading = ref(true)
const error = ref('')
const archiveError = ref('')
const date = computed(() => String(route.params.date || route.query.date || ''))
const optionsController = new AbortController()
let controller
async function load() {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true
  error.value = ''
  result.value = null
  try { result.value = await getPictures({ page: String(route.query.page || '1'), date: date.value }, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '相册加载失败。' }
  finally { if (controller === current) loading.value = false }
}
async function loadArchives() {
  archiveError.value = ''
  try { archives.value = await getPictureArchives(optionsController.signal) }
  catch (e) { if (e.name !== 'AbortError') archiveError.value = '日期目录暂时不可用。' }
}
function changeDate(value) { router.push({ path: '/album', query: value ? { date: value } : {} }) }
watch(() => route.fullPath, load, { immediate: true })
onMounted(() => { document.title = '相册 · 十二'; loadArchives() })
onBeforeUnmount(() => { controller?.abort(); optionsController.abort() })
</script>

<template>
  <BrowseShell title="光影之间" description="留下一些风景，也留下一些值得记住的瞬间。" :meta="result ? `${result.total} 张图片` : ''">
    <div class="album-controls"><div class="browse-section-heading"><h2>{{ date || '全部照片' }}</h2><span>按最近收录排列</span></div><label>按日期浏览<select :value="date" @change="changeDate($event.target.value)"><option value="">全部日期</option><option v-if="date && !archives.some(item => item.date === date)" :value="date">{{ date }}</option><option v-for="archive in archives" :key="archive.date" :value="archive.date">{{ archive.date }} · {{ archive.pictureCount }} 张</option></select></label></div>
    <p v-if="archiveError" class="album-error" role="status">{{ archiveError }} <button @click="loadArchives">重试</button></p>
    <div v-if="loading" class="browse-state" role="status">正在翻开相册…</div>
    <div v-else-if="error" class="browse-state" role="alert"><p>{{ error }}</p><button @click="load">重试</button></div>
    <template v-else-if="result">
      <p v-if="!result.records.length" class="browse-state">{{ date ? '这一天还没有收录图片。' : '相册暂时为空。' }}</p>
      <div v-else class="album-grid"><RouterLink v-for="picture in result.records" :key="picture.id" class="album-item" :to="`/picture/${picture.id}`"><div class="album-photo"><ResourceImage :src="picture.piclink" :alt="picture.picName || picture.picDescription || '相册图片'" /></div><div class="album-caption"><h2>{{ picture.picName || '未命名的风景' }}</h2><span aria-hidden="true">↗</span><p v-if="picture.picDescription">{{ picture.picDescription }}</p><time :datetime="picture.createTime || undefined">{{ picture.createTime?.slice(0, 10) || '日期未记录' }}</time></div></RouterLink></div>
      <Pagination :page="result.page" :size="result.size" :total="result.total" unit="张" label="相册分页" @change="router.push({ path: route.path, query: { ...route.query, page: $event } })" />
    </template>
  </BrowseShell>
</template>

<style scoped>
.album-controls { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 28px; }
.album-controls .browse-section-heading { display: block; margin: 0; }.album-controls .browse-section-heading h2 { margin-bottom: 8px; }
.album-controls label { display: flex; flex-direction: column; gap: 8px; color: var(--layout-muted); font-size: 11px; }.album-controls select { min-height: 42px; max-width: 100%; padding: 8px 12px; color: var(--layout-ink); background: var(--browse-surface); border: 1px solid var(--layout-line); border-radius: 5px; font: inherit; font-size: 12px; }
.album-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 28px 22px; }.album-item { min-width: 0; background: var(--browse-surface); border: 1px solid var(--layout-line); border-radius: 5px; overflow: hidden; }.album-photo { aspect-ratio: 4/3; overflow: hidden; }.album-photo :deep(img) { transition: transform .35s ease; }.album-item:hover .album-photo :deep(img) { transform: scale(1.025); }
.album-caption { position: relative; padding: 20px; }.album-caption h2 { margin: 0 24px 9px 0; color: var(--layout-ink); font: 400 20px/1.5 "Songti SC","SimSun",serif; overflow-wrap: anywhere; }.album-caption > span { position: absolute; top: 20px; right: 20px; color: var(--layout-accent); }.album-caption p { font-size: 12px; line-height: 1.9; color: var(--layout-muted); overflow-wrap: anywhere; }.album-caption time { font-size: 10px; color: var(--layout-muted); }.album-error { font-size: 12px; color: var(--layout-muted); }
@media(max-width:1050px) { .album-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) { .album-grid { grid-template-columns: 1fr; gap: 22px; }.album-controls { align-items: stretch; flex-direction: column; gap: 18px; } }
@media(prefers-reduced-motion:reduce) { .album-photo :deep(img) { transition: none; }.album-item:hover .album-photo :deep(img) { transform: none; } }
</style>
