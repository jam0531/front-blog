<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ blog: { type: Object, required: true }, variant: { type: String, default: 'row' } })
const imageFailed = ref(false)
watch(() => props.blog.blogPic, () => { imageFailed.value = false })
const date = computed(() => props.blog.updateTime?.slice(0, 10) || '日期未记录')
const showMedia = computed(() => props.variant !== 'journal')
</script>

<template>
  <article class="preview-post" :class="`post-${variant}`">
    <RouterLink v-if="showMedia" class="post-media" :to="`/blog/${blog.id}`" tabindex="-1" aria-hidden="true">
      <img v-if="blog.blogPic && !imageFailed" :src="blog.blogPic" alt="" loading="lazy" @error="imageFailed = true" />
      <div v-else class="image-fallback"><span>{{ blog.type?.typeName || '生活随笔' }}</span><b>字里行间</b><i>十二 · 记录与分享</i></div>
    </RouterLink>
    <div class="post-copy">
      <div class="post-category"><RouterLink v-if="blog.type" :to="`/type/${blog.type.id}`">{{ blog.type.typeName }}</RouterLink><span v-else>随笔</span><time :datetime="blog.updateTime || undefined">{{ date }}</time></div>
      <h2><RouterLink :to="`/blog/${blog.id}`">{{ blog.title }}</RouterLink></h2>
      <p class="post-description">{{ blog.description || '打开文章，继续阅读。' }}</p>
      <div class="post-bottom"><span>{{ blog.author?.aliasname || '佚名' }}<span class="meta-dot">·</span>{{ blog.views }} 次阅读</span><RouterLink :to="`/blog/${blog.id}`" :aria-label="`阅读：${blog.title}`">阅读文章 <span aria-hidden="true">↗</span></RouterLink></div>
    </div>
  </article>
</template>

<style scoped>
.preview-post { min-width: 0; }
.post-media { display: block; overflow: hidden; background: #e6ece7; aspect-ratio: 16 / 10; }
.post-media img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
.post-media:hover img { transform: scale(1.025); }
.post-category { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 12px; color: var(--layout-accent); font-size: 11px; letter-spacing: .04em; }
.post-category time { color: var(--layout-muted); }
h2 { margin: 0 0 15px; color: var(--layout-ink); font-family: "Songti SC", "STSong", "SimSun", serif; font-size: 25px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
h2 a:hover { color: var(--layout-accent); }
.post-description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; color: var(--layout-muted); font-size: 13px; line-height: 1.9; margin: 0 0 22px; overflow-wrap: anywhere; }
.post-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: auto; color: var(--layout-muted); font-size: 11px; }
.post-bottom > a { color: var(--layout-accent); white-space: nowrap; }
.post-bottom > a span { display: inline-block; margin-left: 6px; }
.meta-dot { margin: 0 7px; }
.post-feature { display: grid; grid-template-columns: 1.12fr 1fr; gap: 40px; align-items: center; padding-bottom: 40px; border-bottom: 1px solid var(--layout-line); }
.post-feature .post-media { aspect-ratio: 4 / 3; border-radius: 3px; }
.post-feature h2 { font-size: clamp(26px, 2.6vw, 36px); line-height: 1.5; }
.post-feature .post-description { font-size: 14px; -webkit-line-clamp: 4; }
.post-row { display: grid; grid-template-columns: minmax(0, 1fr) 168px; gap: 28px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--layout-line); }
.post-row .post-media { grid-column: 2; grid-row: 1; aspect-ratio: 4 / 3; border-radius: 3px; }
.post-row .post-copy { grid-column: 1; grid-row: 1; }
.post-row h2 { font-size: 22px; margin-bottom: 9px; }
.post-row .post-description { -webkit-line-clamp: 2; margin-bottom: 14px; }
.post-row .post-bottom > a { display: none; }
.post-journal { padding: 34px 0; border-bottom: 1px solid var(--layout-line); }
.post-journal h2 { font-size: 30px; font-weight: 400; }
.post-journal .post-description { font-size: 15px; -webkit-line-clamp: 3; line-height: 2; }
.post-journal .post-category { margin-bottom: 14px; }
.post-grid { display: flex; flex-direction: column; border: 1px solid var(--layout-line); border-radius: 8px; overflow: hidden; background: #fff; }
.post-grid .post-media { aspect-ratio: 16 / 10; }
.post-grid .post-copy { display: flex; flex-direction: column; flex: 1; padding: 23px; }
.post-grid h2 { font-family: inherit; font-weight: 600; font-size: 20px; }
.post-grid .post-description { -webkit-line-clamp: 2; }
.post-grid .post-bottom > a { font-size: 0; }
.post-grid .post-bottom > a span { font-size: 18px; }
.image-fallback { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; width: 100%; height: 100%; color: #355550; background: repeating-linear-gradient(0deg, transparent, transparent 23px, #3159540c 24px), #e7ede6; }
.image-fallback span { font-size: 10px; letter-spacing: .2em; }
.image-fallback b { font: 400 26px "Songti SC", "SimSun", serif; letter-spacing: .22em; }
.image-fallback i { font-style: normal; font-size: 9px; color: #617b74; letter-spacing: .15em; }
@media (max-width: 750px) {
  .post-feature { grid-template-columns: 1fr; gap: 24px; padding-bottom: 28px; }
  .post-feature .post-media { aspect-ratio: 16 / 9; }
  .post-row { grid-template-columns: minmax(0, 1fr) 120px; gap: 18px; }
}
@media (max-width: 480px) {
  .post-row { grid-template-columns: minmax(0, 1fr) 84px; gap: 14px; align-items: start; padding: 24px 0; }
  .post-row .post-media { aspect-ratio: 1; margin-top: 28px; }
  .post-row h2 { font-size: 20px; }
  .post-row .post-category { font-size: 10px; gap: 8px; }
  .post-row .post-description { display: none; }
  .post-journal h2 { font-size: 25px; }
  .post-grid .post-copy { padding: 20px; }
}
@media (prefers-reduced-motion: reduce) { .post-media img { transition: none; } .post-media:hover img { transform: none; } }
</style>
