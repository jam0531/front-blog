<script setup>
import ErrorNotice from '../components/ErrorNotice.vue'
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getBlog } from '../api/blog.js'
import ArticleReader from '../components/ArticleReader.vue'
import DiscussionThread from '../components/DiscussionThread.vue'
import { getHomeLayout } from '../state/homeLayout.js'
const route = useRoute()
const layout = computed(() => getHomeLayout())
const blog = ref(null)
const readingMinutes = ref(0)
const loading = ref(false)
const error = ref('')
const notFound = ref(false)
let controller
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  blog.value = null
  readingMinutes.value = 0
  error.value = ''
  notFound.value = false
  loading.value = true
  try {
    blog.value = await getBlog(String(route.params.id), current.signal)
    document.title = `${blog.value.title} · 十二`
  } catch (e) {
    if (e.name !== 'AbortError') {
      notFound.value = e.status === 404
      error.value = notFound.value ? '这篇文章不存在或尚未公开。' : e.message || '文章加载失败，请重试。'
    }
  } finally { if (controller === current) loading.value = false }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div v-if="loading" class="panel state" role="status">正在加载文章…</div>
  <section v-else-if="error" class="panel state"><h1>{{ notFound ? '文章未找到' : '文章内容' }}</h1><ErrorNotice :error="error" /><button v-if="!notFound" @click="load">重新加载文章</button> <RouterLink to="/home">返回首页</RouterLink></section>
  <article v-else-if="blog" class="reading-page" :class="`reading-theme-${layout.id}`">
    <header class="reading-header">
      <div class="reading-eyebrow"><RouterLink to="/home">十二 / 个人博客</RouterLink><span aria-hidden="true">／</span><span>{{ blog.type?.typeName || '未分类' }}</span></div>
      <h1>{{ blog.title }}</h1>
      <p v-if="blog.description" class="reading-description">{{ blog.description }}</p>
      <div class="reading-meta">
        <span class="reading-author">{{ blog.author?.aliasname || '佚名' }}</span>
        <!-- 按现有数据口径，发布于沿用首次保存时间，可能早于草稿实际公开时间。 -->
        <span v-if="blog.createTime">发布于 <time :datetime="blog.createTime" :title="blog.createTime.replace('T', ' ')">{{ blog.createTime.slice(0, 10) }}</time></span>
        <span v-if="blog.updateTime">更新于 <time :datetime="blog.updateTime" :title="blog.updateTime.replace('T', ' ')">{{ blog.updateTime.slice(0, 10) }}</time></span>
        <span v-if="readingMinutes" title="根据正文篇幅与代码行数估算，实际阅读时间因人而异">预计阅读 {{ readingMinutes }} 分钟</span>
        <span>{{ blog.views }} 次阅读</span>
      </div>
      <div v-if="blog.tags.length" class="reading-tags"><span v-for="tag in blog.tags" :key="tag.id"># {{ tag.tagName }}</span></div>
    </header>
    <img v-if="blog.blogPic" class="reading-cover" :src="blog.blogPic" alt="" @error="$event.target.hidden = true" />
    <ArticleReader :html="blog.contentHtml" @reading-time="readingMinutes = $event">
      <aside v-if="blog.shareStatement" class="reading-share-note">转载请注明作者及本文链接。</aside>
      <footer class="reading-footer"><span>十二 · 记录与分享</span><RouterLink to="/home">返回文章列表 ↗</RouterLink></footer>
      <DiscussionThread :key="blog.id" :blog-id="blog.id" :enabled="blog.commentAble" title="文章评论" />
    </ArticleReader>
  </article>
</template>

<style scoped>
.reading-page {
  --layout-ink: #293d38;
  --layout-muted: #6f7770;
  --layout-accent: #2b665b;
  --layout-line: #dedfd5;
  --article-surface: #fffefa;
  --article-subtle: #eef0e6;
  --accent: var(--layout-accent);
  --border: var(--layout-line);
  --browse-surface: var(--article-surface);
  padding: 42px;
  background: #faf9f4;
  border: 1px solid #e6e5dc;
  border-radius: 4px;
  color: var(--layout-ink);
}
.reading-header { padding-bottom: 30px; margin-bottom: 34px; border-bottom: 1px solid var(--layout-line); }
.reading-eyebrow { display: flex; flex-wrap: wrap; gap: 12px; color: var(--layout-accent); font-size: 11px; letter-spacing: .08em; margin-bottom: 24px; }
.reading-eyebrow > span[aria-hidden] { color: var(--layout-line); }
.reading-header h1 { max-width: 900px; margin: 0 0 20px; font: 400 42px/1.5 "Songti SC","SimSun",serif; color: var(--layout-ink); overflow-wrap: anywhere; }
.reading-description { max-width: 740px; margin-bottom: 24px; color: var(--layout-muted); font-size: 14px; line-height: 1.9; overflow-wrap: anywhere; }
.reading-meta { display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--layout-muted); font-size: 11px; }
.reading-author { color: var(--layout-ink); font-weight: 600; }
.reading-tags { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 17px; color: var(--layout-accent); font-size: 11px; }
.reading-cover { display: block; width: 100%; max-height: 310px; object-fit: cover; border-radius: 4px; margin-bottom: 36px; }
.reading-share-note { margin-top: 32px; padding: 16px 20px; background: var(--article-subtle); color: var(--layout-muted); font-size: 12px; border-left: 2px solid var(--layout-line); }
.reading-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; border-top: 1px solid var(--layout-line); margin-top: 36px; padding-top: 24px; font-size: 11px; color: var(--layout-muted); }
.reading-footer a { color: var(--layout-accent); }
.reading-theme-journal { --layout-accent: #876951; --layout-line: #e9e3d9; --article-subtle: #f4f1ea; background: #fffefa; padding: 48px 54px; }
.reading-theme-journal .reading-cover { max-height: 230px; }
.reading-theme-gallery { --layout-ink: #273e44; --layout-accent: #286976; --layout-line: #dfe7e4; --article-surface: #fff; --article-subtle: #eaf0ed; background: #f2f6f5; border-color: #dfe9e7; }
.reading-theme-gallery .reading-header h1 { font-family: inherit; font-size: 36px; font-weight: 600; letter-spacing: -.02em; }
@media (max-width: 1050px) { .reading-page { padding: 30px; } .reading-header h1 { font-size: 36px; } }
@media (max-width: 850px) { .reading-cover { max-height: 250px; margin-bottom: 28px; } }
@media (max-width: 480px) {
  .reading-page { padding: 24px 18px; }
  .reading-header { padding-bottom: 24px; margin-bottom: 26px; }
  .reading-header h1,.reading-theme-gallery .reading-header h1 { font-size: 28px; line-height: 1.55; }
  .reading-eyebrow { font-size: 10px; gap: 8px; margin-bottom: 18px; }
  .reading-meta { gap: 8px 14px; }
  .reading-description { font-size: 13px; }
  .reading-cover { max-height: 190px; }
}
</style>
