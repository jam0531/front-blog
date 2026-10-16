<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { getArchives } from '../api/catalog.js'
import BrowseShell from '../components/BrowseShell.vue'
const archives = ref([])
const articleCount = computed(() => archives.value.reduce((sum, archive) => sum + archive.blogCount, 0))
const loading = ref(true)
const error = ref('')
const controller = new AbortController()
async function load() {
  loading.value = true
  error.value = ''
  try { archives.value = await getArchives(controller.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '归档加载失败。' }
  finally { loading.value = false }
}
onMounted(() => { document.title = '文章归档 · 十二'; load() })
onBeforeUnmount(() => controller.abort())
</script>
<template>
  <BrowseShell title="文章归档" description="按时间回望，看看那些留下来的文字。" :meta="!loading && !error ? `${articleCount} 篇文章 · ${archives.length} 个年份` : ''">
    <div v-if="loading" class="browse-state" role="status">正在加载归档…</div>
    <div v-else-if="error" class="browse-state" role="alert"><p>{{ error }}</p><button @click="load">重试</button></div>
    <section v-else aria-labelledby="archive-heading">
      <div class="browse-section-heading"><h2 id="archive-heading">时间的目录</h2><span>从最近的一年开始</span></div>
      <p v-if="!archives.length" class="browse-state">暂无文章归档。</p>
      <ul v-else class="year-list">
        <li v-for="archive in archives" :key="archive.year">
          <RouterLink class="year-card" :to="`/archive/${archive.year}`">
            <span class="year-heading"><b>{{ archive.year }}</b><span>年</span></span>
            <span class="year-summary"><strong>{{ archive.blogCount }} 篇文章</strong><span>这一年的记录与分享</span></span>
            <span class="year-action">翻开这一年 <span aria-hidden="true">↗</span></span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </BrowseShell>
</template>

<style scoped>
.year-list { list-style: none; margin: 0 0 0 5px; padding: 0 0 0 28px; border-left: 1px solid var(--layout-line); }
.year-list li { position: relative; padding-bottom: 18px; }
.year-list li:last-child { padding-bottom: 0; }
.year-list li::before { content: ''; position: absolute; left: -33px; top: 48px; width: 9px; height: 9px; border-radius: 50%; background: var(--layout-accent); }
.year-card { display: flex; align-items: center; gap: 38px; padding: 30px; background: var(--browse-surface); border: 1px solid var(--layout-line); border-radius: 5px; transition: border-color .2s ease; }
.year-card:hover { border-color: var(--layout-accent); }
.year-heading { display: flex; align-items: baseline; gap: 10px; color: var(--layout-ink); }
.year-heading b { font: 400 52px/1.2 Georgia, serif; letter-spacing: -.04em; }
.year-heading > span { font-size: 12px; color: var(--layout-muted); }
.year-summary { display: flex; flex-direction: column; gap: 7px; }
.year-summary strong { font-size: 14px; font-weight: 500; }
.year-summary > span { font-size: 11px; color: var(--layout-muted); }
.year-action { margin-left: auto; font-size: 12px; color: var(--layout-accent); white-space: nowrap; }
.year-action > span { margin-left: 12px; font-size: 18px; }
@media (max-width: 750px) { .year-card { flex-wrap: wrap; gap: 20px 28px; } .year-action { width: 100%; text-align: right; } }
@media (max-width: 480px) {
  .year-list { padding-left: 18px; }
  .year-list li::before { left: -23px; top: 38px; }
  .year-card { padding: 22px; gap: 20px; }
  .year-heading b { font-size: 44px; }
  .year-summary { width: 100%; }
}
@media (prefers-reduced-motion: reduce) { .year-card { transition: none; } }
</style>
