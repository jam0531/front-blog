<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPicture } from '../api/resources.js'
import { imageUrl } from '../utils/resourceUrl.js'
import BrowseShell from '../components/BrowseShell.vue'
import ResourceImage from '../components/ResourceImage.vue'
const route = useRoute()
const picture = ref(null)
const loading = ref(true)
const error = ref('')
const source = computed(() => imageUrl(picture.value?.piclink))
let controller
async function load() {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true; error.value = ''; picture.value = null
  try { picture.value = await getPicture(String(route.params.id), current.signal); document.title = `${picture.value.picName || '风景'} · 十二` }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '图片加载失败。' }
  finally { if (controller === current) loading.value = false }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
<template>
  <BrowseShell :title="picture?.picName || '一帧风景'" :description="picture?.picDescription || '把喜欢的瞬间，留在这里。'" :meta="picture?.createTime?.slice(0, 10)">
    <div v-if="loading" class="browse-state" role="status">正在加载图片…</div>
    <div v-else-if="error" class="browse-state" role="alert"><p>{{ error }}</p><button @click="load">重试</button></div>
    <template v-else-if="picture"><figure class="picture-detail"><ResourceImage :src="picture.piclink" :alt="picture.picName || picture.picDescription || '相册图片'" eager /></figure><div class="picture-actions"><RouterLink :to="picture.createTime ? `/albumArchive/${picture.createTime.slice(0, 10)}` : '/album'">← 返回相册</RouterLink><a v-if="source" :href="source" target="_blank" rel="noopener noreferrer">查看原图 ↗</a></div></template>
  </BrowseShell>
</template>
<style scoped>
.picture-detail { margin: 0; overflow: hidden; min-height: 180px; background: #e8eee8; border-radius: 4px; }.picture-detail :deep(img) { max-height: 75vh; height: auto; object-fit: contain; }.picture-detail :deep(.resource-image-fallback) { min-height: 220px; }.picture-actions { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px; margin-top: 24px; color: var(--layout-accent); font-size: 12px; }
</style>
