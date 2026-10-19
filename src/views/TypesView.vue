<script setup>
import ErrorNotice from '../components/ErrorNotice.vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getTypes, getTags } from '../api/catalog.js'
import BrowseShell from '../components/BrowseShell.vue'
const types = ref([])
const tags = ref([])
const loading = ref(true)
const error = ref('')
const controller = new AbortController()
async function load() {
  loading.value = true
  error.value = ''
  try { [types.value, tags.value] = await Promise.all([getTypes(controller.signal), getTags(controller.signal)]) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '分类加载失败。' }
  finally { loading.value = false }
}
onMounted(() => { document.title = '分类与标签 · 十二'; load() })
onBeforeUnmount(() => controller.abort())
</script>
<template>
  <BrowseShell title="分类与标签" description="从一个感兴趣的主题开始，慢慢读下去。" :meta="!loading && !error ? `${types.length} 个分类 · ${tags.length} 个标签` : ''">
    <div v-if="loading" class="browse-state" role="status">正在加载分类…</div>
    <div v-else-if="error" class="browse-state"><ErrorNotice :error="error" /><button @click="load">重新加载分类</button></div>
    <template v-else>
      <section aria-labelledby="category-heading">
        <div class="browse-section-heading"><h2 id="category-heading">按主题阅读</h2><span>不同主题，同样认真记录</span></div>
        <p v-if="!types.length" class="browse-state">暂无已发布文章的分类。</p>
        <ul v-else class="category-list">
          <li v-for="(type, index) in types" :key="type.id">
            <RouterLink class="category-card" :to="`/type/${type.id}`">
              <span class="category-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="category-arrow" aria-hidden="true">↗</span>
              <h3>{{ type.typeName }}</h3><span class="category-count">{{ type.blogCount }} 篇文章</span>
            </RouterLink>
          </li>
        </ul>
      </section>
      <section class="tag-section" aria-labelledby="tag-heading">
        <div class="browse-section-heading"><h2 id="tag-heading">从标签出发</h2><span>也可以从一个关键词开始阅读</span></div>
        <p v-if="!tags.length" class="browse-state">暂无标签。</p>
        <ul v-else class="tag-cloud"><li v-for="tag in tags" :key="tag.id"><RouterLink :to="`/tag/${tag.id}`"><span class="tag-hash" aria-hidden="true">#</span>{{ tag.tagName }}<span class="tag-count">{{ tag.blogCount }} 篇</span></RouterLink></li></ul>
      </section>
    </template>
  </BrowseShell>
</template>

<style scoped>
.category-list, .tag-cloud { list-style: none; margin: 0; padding: 0; }
.category-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.category-card { position: relative; display: block; padding: 24px 28px; border: 1px solid var(--layout-line); border-radius: 5px; background: var(--browse-surface); transition: border-color .2s ease, transform .2s ease; }
.category-card:hover { border-color: var(--layout-accent); transform: translateY(-2px); }
.category-number { font: 400 24px Georgia, serif; color: var(--layout-muted); opacity: .65; }
.category-arrow { position: absolute; right: 28px; top: 24px; color: var(--layout-accent); font-size: 19px; }
.category-card h3 { margin: 22px 0 9px; color: var(--layout-ink); font: 400 26px/1.5 "Songti SC", "SimSun", serif; overflow-wrap: anywhere; }
.category-count { font-size: 12px; color: var(--layout-muted); }
.tag-section { margin-top: 38px; padding-top: 28px; border-top: 1px solid var(--layout-line); }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 12px; }
.tag-cloud a { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 9px 15px; border: 1px solid var(--layout-line); border-radius: 5px; background: var(--browse-surface); font-size: 13px; }
.tag-cloud a:hover { border-color: var(--layout-accent); }
.tag-hash { color: var(--layout-accent); }
.tag-count { padding-left: 12px; margin-left: 3px; border-left: 1px solid var(--layout-line); color: var(--layout-muted); font-size: 11px; }
@media (max-width: 600px) {
  .category-list { gap: 12px; }
  .category-card { padding: 20px; }
  .category-card h3 { font-size: 23px; }
  .category-arrow { right: 20px; top: 20px; }
}
@media (max-width: 420px) { .category-list { grid-template-columns: 1fr; } .category-card h3 { margin-top: 16px; } }
@media (prefers-reduced-motion: reduce) { .category-card { transition: none; } .category-card:hover { transform: none; } }
</style>
