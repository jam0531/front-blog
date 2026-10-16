<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getHome } from '../api/home.js'
const background = ref(null)
const error = ref('')
const loading = ref(false)
let controller
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  try { background.value = (await getHome(current.signal)).background }
  catch (e) { if (e.name !== 'AbortError') error.value = '背景暂时加载失败，可以继续进入首页。' }
  finally { if (controller === current) loading.value = false }
}
onMounted(load)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <main class="cover">
    <img v-if="background?.piclink" class="cover-image" :src="background.piclink" alt="" @error="$event.target.hidden = true" />
    <div class="cover-shade"></div>
    <header class="cover-header"><span>十二</span><button :disabled="loading" @click="load">{{ loading ? '加载中…' : '换一张背景' }}</button></header>
    <section class="cover-content">
      <p class="eyebrow">生活 · 技术 · 随笔</p><h1>十二的温馨小站</h1><p>把生活中的点滴，写成可以回看的故事。</p>
      <RouterLink to="/home" class="enter-button">进入博客 →</RouterLink>
      <p v-if="error" role="status">{{ error }}</p>
    </section>
  </main>
</template>
