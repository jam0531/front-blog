<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHome } from '../api/home.js'
import { getBlogs } from '../api/blog.js'
import LayoutPreviewPost from '../components/LayoutPreviewPost.vue'
import Pagination from '../components/Pagination.vue'
import { getHomeLayout, homeLayoutOptions } from '../state/homeLayout.js'

const route = useRoute()
const router = useRouter()
const options = homeLayoutOptions
const isPreview = computed(() => route.path === '/home-layouts')
const selected = computed(() => getHomeLayout(route.query.layout))
const page = computed(() => /^[1-9]\d*$/.test(String(route.query.page || '1')) && Number(route.query.page || 1) <= 2147483647 ? Number(route.query.page || 1) : 1)
const home = ref(null)
const result = ref(null)
const loading = ref(false)
const error = ref('')
const homeError = ref('')
let controller
const homeController = new AbortController()
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  try { result.value = await getBlogs(page.value, 6, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '文章加载失败。' }
  finally { if (controller === current) loading.value = false }
}
async function loadHome() {
  homeError.value = ''
  try { home.value = await getHome(homeController.signal) }
  catch (e) { if (e.name !== 'AbortError') homeError.value = '栏目加载失败。' }
}
function choose(id) { router.replace({ query: { ...route.query, layout: id } }) }
watch(page, load, { immediate: true })
watch([selected, isPreview], ([value, preview]) => { document.title = preview ? `${value.name} · 首页排版预览` : '首页 · 十二' }, { immediate: true })
onMounted(loadHome)
onBeforeUnmount(() => { controller?.abort(); homeController.abort() })
</script>

<template>
  <div class="layout-lab">
    <section v-if="isPreview" class="layout-picker" aria-label="首页排版方案">
      <div class="picker-heading"><span>首页排版预览</span><RouterLink to="/home">返回当前首页 ↗</RouterLink></div>
      <div class="layout-options">
        <button v-for="option in options" :key="option.id" :aria-pressed="selected.id === option.id" @click="choose(option.id)">
          <span class="option-number">{{ option.number }}</span><span><b>{{ option.name }}</b><small>{{ option.detail }}</small></span><span v-if="option.id === 'editorial'" class="recommended">推荐</span>
        </button>
      </div>
      <p class="design-note">{{ selected.note }}</p>
    </section>

    <div class="design-canvas" :class="`design-${selected.id}`">
      <header class="design-intro">
        <p class="intro-label">十二 / 个人博客</p>
        <h1>{{ selected.id === 'gallery' ? '发现生活，记录灵感。' : '记录与分享' }}</h1>
        <div class="intro-bottom"><p>生活的片段，技术的积累，都在这里。</p><span v-if="result">{{ result.total }} 篇文章，慢慢读。</span></div>
      </header>

      <nav v-if="home && selected.id !== 'journal'" class="topic-nav" aria-label="文章主题">
        <span class="current-topic">全部文章</span><RouterLink v-for="type in home.topTypes" :key="type.id" :to="`/type/${type.id}`">{{ type.typeName }}<small>{{ type.blogCount }}</small></RouterLink><RouterLink to="/search" class="topic-search">搜索文章 ↗</RouterLink>
      </nav>

      <div v-if="loading" class="preview-state" role="status">正在加载文章…</div>
      <div v-else-if="error" class="preview-state" role="alert"><p>{{ error }}</p><button @click="load">重试</button></div>
      <div v-else-if="!result?.records.length" class="preview-state">这一页暂时没有文章。</div>
      <template v-else>
        <template v-if="selected.id === 'editorial'">
          <div class="section-label"><span>最近更新</span><span>写下此刻，也留给以后</span></div>
          <LayoutPreviewPost :blog="result.records[0]" variant="feature" />
          <div class="reading-grid">
            <section aria-label="更多文章"><div class="section-label"><span>继续阅读</span><RouterLink to="/archives">全部归档 ↗</RouterLink></div><LayoutPreviewPost v-for="blog in result.records.slice(1)" :key="blog.id" :blog="blog" variant="row" /></section>
            <aside class="reading-aside" aria-label="博客信息">
              <section class="author-note"><span class="note-index">关于这个小站</span><h2>你好，我是十二。</h2><p>{{ home?.notice?.content || '记录生活中的点滴，也分享一路学到的技术。欢迎来坐坐，随意翻翻。' }}</p><div v-if="home" class="small-stats"><span><b>{{ home.stats.blogCount }}</b>文章</span><span><b>{{ home.stats.typeCount }}</b>分类</span><span><b>{{ home.stats.tagCount }}</b>标签</span></div></section>
              <section v-if="home?.recommendedBlogs.length" class="recommended-list"><h2>推荐阅读</h2><ol><li v-for="(blog, index) in home.recommendedBlogs.slice(0, 4)" :key="blog.id"><span>{{ String(index + 1).padStart(2, '0') }}</span><RouterLink :to="`/blog/${blog.id}`">{{ blog.title }}</RouterLink></li></ol></section>
            </aside>
          </div>
        </template>

        <div v-else-if="selected.id === 'journal'" class="journal-grid">
          <section aria-label="文章专栏"><LayoutPreviewPost v-for="blog in result.records" :key="blog.id" :blog="blog" variant="journal" /></section>
          <aside class="journal-aside" aria-label="博客栏目">
            <p class="note-index">一点介绍</p><h2>字里行间，<br />都是日常。</h2><p>{{ home?.notice?.content || '在这里写技术，也写生活。愿每一次记录，都有一点新的收获。' }}</p>
            <template v-if="home"><h3>按主题阅读</h3><ul class="journal-topics"><li v-for="type in home.topTypes" :key="type.id"><RouterLink :to="`/type/${type.id}`">{{ type.typeName }}</RouterLink><span>{{ type.blogCount }}</span></li></ul><h3>时间的目录</h3><ul class="journal-topics"><li v-for="archive in home.archives" :key="archive.year"><RouterLink :to="`/archive/${archive.year}`">{{ archive.year }} 年</RouterLink><span>{{ archive.blogCount }} 篇</span></li></ul></template>
          </aside>
        </div>

        <div v-else class="gallery-grid" aria-label="图文文章"><LayoutPreviewPost v-for="blog in result.records" :key="blog.id" :blog="blog" variant="grid" /></div>
      </template>
      <Pagination v-if="result && !loading && !error" :page="result.page" :size="result.size" :total="result.total" @change="router.push({ query: { ...route.query, layout: selected.id, page: $event } })" />
      <p v-if="homeError" class="preview-state" role="status">{{ homeError }} <button @click="loadHome">重试</button></p>
      <footer class="design-footer"><span>十二 · 把日常写成故事</span><RouterLink to="/archives">慢慢来，慢慢读 ↗</RouterLink></footer>
    </div>
    <p v-if="isPreview" class="reference-note">排版参考：<a href="https://ghost.org/themes/casper/" target="_blank" rel="noopener noreferrer">Ghost / Casper</a>、<a href="https://alistapart.com/" target="_blank" rel="noopener noreferrer">A List Apart</a>、<a href="https://www.smashingmagazine.com/" target="_blank" rel="noopener noreferrer">Smashing Magazine</a>。使用本站现有内容设计，三个方案均保留当前文章顺序。</p>
  </div>
</template>

<style scoped>
.layout-lab { --layout-ink: #293d38; --layout-muted: #6f7770; --layout-accent: #2b665b; --layout-line: #dedfd5; }
.layout-picker { padding: 20px; margin-bottom: 24px; border: 1px solid #dce3e4; border-radius: 10px; background: white; }
.picker-heading { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 16px; font-size: 12px; color: #647574; }
.picker-heading > span { font-weight: 600; color: #2b4140; }
.layout-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.layout-options button { display: flex; align-items: center; gap: 12px; padding: 14px 16px; text-align: left; border-radius: 6px; }
.layout-options button[aria-pressed=true] { border-color: #35675e; background: #edf4ee; color: #264d43; box-shadow: inset 0 0 0 1px #35675e; }
.option-number { font-family: Georgia, serif; font-size: 25px; color: #91a09a; }
.layout-options b { display: block; font-size: 14px; font-weight: 600; }
.layout-options small { display: block; margin-top: 2px; font-size: 11px; color: #728079; }
.recommended { margin-left: auto; font-size: 10px; color: #35675e; }
.design-note { margin: 14px 0 0; font-size: 12px; color: #647574; }
.design-canvas { padding: 42px; color: var(--layout-ink); background: #faf9f4; border: 1px solid #e6e5dc; border-radius: 4px; }
.intro-label { margin: 0 0 20px; color: var(--layout-accent); font-size: 11px; letter-spacing: .15em; }
.design-intro h1 { margin: 0 0 18px; color: var(--layout-ink); font-family: "Songti SC", "SimSun", serif; font-size: 48px; font-weight: 400; letter-spacing: .08em; }
.intro-bottom { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 12px; color: var(--layout-muted); font-size: 12px; }
.intro-bottom p { margin: 0; font-size: 13px; }
.topic-nav { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 26px; padding: 20px 0; margin: 28px 0 0; border-top: 1px solid var(--layout-line); border-bottom: 1px solid var(--layout-line); font-size: 12px; }
.topic-nav small { margin-left: 7px; font-size: 9px; color: var(--layout-muted); }
.current-topic { color: var(--layout-accent); font-weight: 600; }
.topic-search { margin-left: auto; }
.section-label { display: flex; justify-content: space-between; gap: 16px; margin: 30px 0 22px; font-size: 11px; }
.section-label > :first-child { font-weight: 600; letter-spacing: .1em; }
.section-label > :last-child { color: var(--layout-muted); }
.reading-grid { display: grid; grid-template-columns: minmax(0, 1fr) 235px; gap: 38px; }
.reading-aside { padding: 30px 0 0; }
.author-note { padding: 24px; background: #eef0e6; }
.note-index { font-size: 10px; letter-spacing: .15em; color: var(--layout-muted); }
.reading-aside h2 { margin: 14px 0; font-family: "Songti SC", "SimSun", serif; font-size: 20px; font-weight: 400; color: var(--layout-ink); }
.reading-aside p { margin-bottom: 0; font-size: 12px; line-height: 2; color: var(--layout-muted); }
.small-stats { display: flex; justify-content: space-between; border-top: 1px solid #d7dcce; margin-top: 20px; padding-top: 16px; color: var(--layout-muted); font-size: 10px; }
.small-stats b { display: block; font: 400 24px Georgia, serif; color: var(--layout-ink); margin-bottom: 4px; }
.recommended-list { margin-top: 30px; }
.recommended-list ol { list-style: none; margin: 0; padding: 0; }
.recommended-list li { display: flex; align-items: baseline; gap: 13px; padding: 15px 0; border-bottom: 1px solid var(--layout-line); font-size: 12px; line-height: 1.9; }
.recommended-list li > span { color: #a5ada4; font: italic 18px Georgia, serif; }
.design-journal { background: #fffefa; padding: 48px 54px; }
.design-journal .design-intro { padding-bottom: 32px; border-bottom: 1px solid var(--layout-line); }
.design-journal .intro-label { color: #876951; }
.design-journal { --layout-accent: #876951; --layout-line: #e9e3d9; }
.journal-grid { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 64px; }
.journal-aside { margin-top: 36px; padding-left: 26px; border-left: 1px solid var(--layout-line); }
.journal-aside h2 { margin: 18px 0; font-family: "Songti SC", "SimSun", serif; font-weight: 400; line-height: 1.7; font-size: 23px; }
.journal-aside p { color: var(--layout-muted); font-size: 12px; line-height: 2; }
.journal-aside h3 { margin: 30px 0 12px; font-size: 11px; font-weight: 600; }
.journal-topics { list-style: none; padding: 0; margin: 0; }
.journal-topics li { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; font-size: 11px; }
.journal-topics span { color: var(--layout-muted); font-size: 10px; }
.design-gallery { --layout-ink: #273e44; --layout-accent: #286976; --layout-line: #e2e9e8; background: #f2f6f5; border-color: #dfe9e7; }
.design-gallery .design-intro h1 { font-family: inherit; font-size: 36px; font-weight: 600; letter-spacing: -.02em; }
.design-gallery .topic-nav { border: 0; padding: 0; margin: 28px 0 32px; gap: 10px; }
.design-gallery .topic-nav > :not(.topic-search) { padding: 7px 12px; border: 1px solid #dce5e2; border-radius: 5px; font-size: 11px; background: #fff; }
.design-gallery .topic-nav > .current-topic { background: #284c4e; color: #fff; border-color: #284c4e; }
.gallery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
.design-footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--layout-line); color: var(--layout-muted); font-size: 10px; letter-spacing: .08em; }
.reference-note { margin-top: 20px; color: #728079; font-size: 11px; line-height: 1.9; }
.reference-note a { text-decoration: underline; text-underline-offset: 3px; }
.preview-state { padding: 40px 20px; text-align: center; color: var(--layout-muted); }
@media (max-width: 1050px) {
  .design-canvas { padding: 30px; }
  .reading-grid { gap: 26px; grid-template-columns: minmax(0, 1fr) 210px; }
  .journal-grid { gap: 32px; grid-template-columns: minmax(0, 1fr) 165px; }
  .journal-aside { padding-left: 20px; }
  .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .layout-options button { padding: 12px; gap: 10px; }
  .recommended { display: none; }
}
@media (max-width: 750px) {
  .layout-options { gap: 8px; }
  .layout-options button { display: block; text-align: center; padding: 10px 4px; }
  .option-number { font-size: 18px; }
  .layout-options small { display: none; }
  .layout-options b { font-size: 12px; }
  .reading-grid, .journal-grid { grid-template-columns: 1fr; }
  .reading-aside { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
  .recommended-list { margin-top: 0; }
  .journal-aside { border-left: 0; border-top: 1px solid var(--layout-line); padding: 24px 0 0; margin-top: 0; }
  .design-intro h1 { font-size: 40px; }
  .topic-nav { gap: 12px 18px; }
  .topic-search { margin-left: 0; }
}
@media (max-width: 480px) {
  .layout-picker { padding: 15px; }
  .design-canvas { padding: 24px 18px; }
  .design-intro h1 { font-size: 33px; }
  .design-gallery .design-intro h1 { font-size: 29px; }
  .gallery-grid, .reading-aside { grid-template-columns: 1fr; }
  .design-note { font-size: 11px; }
  .section-label { font-size: 10px; }
  .section-label > :last-child { letter-spacing: 0; }
  .intro-bottom > span { font-size: 10px; }
}
</style>
