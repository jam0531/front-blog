<script setup>
import ErrorNotice from '../components/ErrorNotice.vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getBackground } from '../api/home.js'
const background = ref(null)
const error = ref('')
const loading = ref(false)
const motionPaused = ref(false)
let controller

function changeBackground(event) {
  if (loading.value || event.target.closest('a, button, input, textarea, select')) return
  if (window.getSelection()?.toString()) return
  load()
}

// 新背景加载成功后才替换旧图，避免切换时先出现空白或破图。
function preloadImage(src, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => finish(new Error('背景加载超时')), 12000)
    const abort = () => finish(new DOMException('请求已取消', 'AbortError'))
    function finish(error) {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      image.onload = image.onerror = null
      if (error) { image.src = ''; reject(error) } else resolve()
    }
    image.onload = () => finish()
    image.onerror = () => finish(new Error('背景加载失败'))
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { abort(); return }
    image.src = src
  })
}

async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  try {
    const next = await getBackground(background.value?.id, current.signal)
    if (next?.piclink) await preloadImage(next.piclink, current.signal)
    if (controller === current && !current.signal.aborted) background.value = next
  }
  catch (e) { if (e.name !== 'AbortError') error.value = '背景暂时加载失败，可以继续进入首页。' }
  finally { if (controller === current) loading.value = false }
}
onMounted(() => { document.title = '十二的温馨小站'; load() })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <main class="cover" :class="{ 'motion-paused': motionPaused }" tabindex="0" aria-label="欢迎页，点击页面空白处或按空格键切换背景" @click="changeBackground" @keydown.space.self.prevent="!loading && load()">
    <Transition name="scene">
      <img v-if="background?.piclink" :key="background.piclink" class="cover-image" :src="background.piclink" alt="" />
    </Transition>
    <div class="cover-shade" aria-hidden="true"></div>
    <header class="cover-header">
      <span class="cover-brand" aria-label="十二的个人博客">十二<span>个人博客</span></span>
    </header>
    <section class="cover-content">
      <p class="eyebrow"><span aria-hidden="true"></span>生活 · 技术 · 随笔</p>
      <h1><span class="title-prefix">十二的</span><span>温馨小站</span></h1>
      <p class="cover-description">把生活中的点滴，<wbr />写成可以回看的故事。</p>
      <RouterLink to="/home" class="enter-button">进入博客 <span aria-hidden="true">↗</span></RouterLink>
      <ErrorNotice :error="error" />
    </section>
    <footer class="cover-footer">
      <span>记录生活，分享技术</span>
      <button class="motion-toggle" :aria-pressed="motionPaused" :aria-label="motionPaused ? '继续背景动画' : '暂停背景动画'" @click="motionPaused = !motionPaused">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path v-if="motionPaused" d="m5 3 7 5-7 5Z" /><path v-else d="M5 3v10M11 3v10" /></svg>
        {{ motionPaused ? '继续背景动画' : '暂停背景动画' }}
      </button>
    </footer>
  </main>
</template>

<style scoped>
.cover {
  overflow: hidden;
  background: #193c40;
  color: #fffdf7;
}
/* 保留原来的慢节奏；幅度收敛到 8%，避免背景主体被明显裁切。 */
.cover-image { animation: cover-zoom 100s ease-in-out infinite; transform-origin: center; }
.motion-paused .cover-image { animation-play-state: paused; }
.cover-shade {
  background: linear-gradient(90deg, #071e25c9 0%, #071e2580 48%, #071e2526 100%),
    linear-gradient(180deg, #06191e35, transparent 35%, #06191e99);
}
.cover-header, .cover-footer {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 28px clamp(24px, 6.5vw, 104px);
}
.cover-brand { display: inline-flex; align-items: center; gap: 20px; font-family: "STKaiti", "KaiTi", "SimSun", serif; font-size: 34px; letter-spacing: .15em; }
.cover-brand > span { padding-left: 20px; border-left: 1px solid #fff6; font-family: sans-serif; font-size: 11px; font-weight: 400; letter-spacing: .24em; color: #fffdf7d9; }
.cover-content { width: 100%; max-width: 1600px; margin: auto; padding: 60px clamp(24px, 9vw, 144px) 72px; text-align: left; }
.cover-content .eyebrow { display: flex; align-items: center; gap: 14px; margin: 0 0 24px; font-size: 12px; letter-spacing: .24em; color: #fffdf7e6; }
.eyebrow > span { width: 30px; height: 1px; background: #e8d9ba; }
.cover-content h1 { display: flex; flex-direction: column; gap: 10px; margin: 0 0 25px; color: #fffdf7; font-family: "Songti SC", "STSong", "SimSun", serif; font-size: clamp(46px, 6.5vw, 88px); font-weight: 400; line-height: 1.3; letter-spacing: .12em; text-shadow: 0 2px 24px #071e2533; }
.cover-content .title-prefix { font-size: .48em; letter-spacing: .2em; }
.cover-description { margin: 0; color: #fffdf7e6; font-size: 14px; line-height: 2; letter-spacing: .06em; }
.enter-button { display: inline-flex; align-items: center; gap: 36px; margin: 32px 0 0; min-height: 48px; padding: 12px 22px; border: 1px solid #fffdf7; border-radius: 5px; background: #fffdf7; color: #15343b; font-size: 14px; letter-spacing: .08em; transition: background .2s, box-shadow .2s; }
.enter-button span { font-size: 20px; line-height: 1; transition: transform .2s ease; }
.enter-button:hover { background: #f0eadc; color: #15343b; box-shadow: 0 5px 18px #06191e33; }
.enter-button:hover span { transform: translate(2px, -2px); }
.cover-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-top: 18px; padding-bottom: 22px; font-size: 11px; letter-spacing: .12em; color: #fffdf7d9; }
.cover-footer::before { content: ""; position: absolute; left: 6.5%; right: 6.5%; height: 1px; background: #ffffff26; transform: translateY(-33px); }
.cover-footer .motion-toggle { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 8px 0 8px 12px; border: 0; background: transparent; color: inherit; font-size: 11px; }
.motion-toggle svg { width: 12px; height: 12px; }
.cover :is(a, button):focus-visible { outline: 2px solid #fffdf7; outline-offset: 5px; }
.scene-enter-active, .scene-leave-active { transition: opacity .8s ease; }
.scene-enter-from, .scene-leave-to { opacity: 0; }
@keyframes cover-zoom {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
@media (max-width: 600px) {
  .cover-header { padding-top: 20px; padding-bottom: 20px; }
  .cover-brand { font-size: 30px; }
  .cover-brand > span { display: none; }
  .cover-content { padding-top: 40px; padding-bottom: 48px; }
  .cover-content h1 { margin-bottom: 24px; }
  .cover-description { max-width: 280px; font-size: 13px; }
  .cover-shade { background: linear-gradient(90deg, #071e25a8, #071e254d), linear-gradient(180deg, #06191e33, transparent 30%, #06191e99); }
  .cover-footer { padding-top: 10px; padding-bottom: 12px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .cover-image { animation: none; }
  .scene-enter-active, .scene-leave-active, .enter-button, .enter-button span { transition: none; }
  .cover-footer .motion-toggle { display: none; }
  .enter-button:hover span { transform: none; }
}
</style>
