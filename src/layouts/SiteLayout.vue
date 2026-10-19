<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHomeLayout, homeLayoutOptions, rememberHomeLayout } from '../state/homeLayout.js'
import { navigationItems, refreshNavigation } from '../state/navigation.js'

const route = useRoute()
const router = useRouter()
const moreMenu = ref(null)
const moreItems = computed(() => navigationItems.value.filter(item => router.hasRoute(`extra-${item.pageKey}`)))
function closeMore() { moreMenu.value?.removeAttribute('open') }
function clickOutside(event) { if (!moreMenu.value?.contains(event.target)) closeMore() }
watch(() => route.fullPath, closeMore)
onMounted(() => { document.addEventListener('click', clickOutside); refreshNavigation() })
onBeforeUnmount(() => document.removeEventListener('click', clickOutside))
const isHome = computed(() => route.path === '/home' || route.path === '/home-layouts')
const selectedLayout = computed(() => getHomeLayout(isHome.value ? route.query.layout : undefined))
watch(() => [route.path, route.query.layout], () => {
  if (isHome.value) rememberHomeLayout(route.query.layout)
}, { immediate: true })

function changeLayout(event) {
  const layout = event.target.value
  rememberHomeLayout(layout)
  router.push({ path: '/home', query: { ...(isHome.value ? route.query : {}), layout } })
}
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand" aria-label="十二的个人博客，返回欢迎页"><strong class="brand-title">十二</strong><span class="brand-caption">个人博客</span></RouterLink>
    <nav class="site-navigation" aria-label="主导航">
      <div class="nav-links"><RouterLink to="/home">首页</RouterLink><RouterLink to="/types">分类</RouterLink><RouterLink to="/archives">归档</RouterLink><RouterLink to="/search">搜索</RouterLink><details v-if="moreItems.length" ref="moreMenu" class="nav-more" @keydown.esc="closeMore"><summary>更多</summary><div class="nav-more-links"><RouterLink v-for="item in moreItems" :key="item.id" :to="{ name: `extra-${item.pageKey}` }">{{ item.menuName }}</RouterLink></div></details></div>
      <label class="layout-switcher"><select aria-label="首页排版" :value="selectedLayout.id" @change="changeLayout"><option v-for="option in homeLayoutOptions" :key="option.id" :value="option.id">{{ option.name }}</option></select></label>
    </nav>
  </header>
  <main class="site-main"><RouterView /></main>
  <footer class="site-footer">十二的个人博客 · 愿你每天都有新的收获</footer>
</template>

<style scoped>
.site-header { gap: 24px; }
.site-navigation { align-items: center; justify-content: flex-end; gap: 24px; }
.nav-links { display: flex; align-items: center; gap: 22px; white-space: nowrap; }
.nav-more { position: relative; }.nav-more summary { cursor: pointer; list-style: none; }.nav-more summary::-webkit-details-marker { display: none; }.nav-more summary::after { content: '⌄'; margin-left: 5px; font-size: 11px; }.nav-more summary:focus-visible { outline: 3px solid #268da780; outline-offset: 4px; }.nav-more-links { position: absolute; z-index: 10; top: calc(100% + 12px); right: 0; display: flex; flex-direction: column; min-width: 140px; padding: 8px; border: 1px solid #dce3e0; border-radius: 6px; background: #fff; box-shadow: 0 10px 25px #273d3812; }.nav-more-links a { padding: 9px 12px; font-size: 13px; border-radius: 4px; }.nav-more-links a:hover { background: #f3f6f1; }
.layout-switcher { display: flex; align-items: center; gap: 10px; padding-left: 24px; border-left: 1px solid #dce3e0; white-space: nowrap; }
.layout-switcher select { min-height: 38px; padding: 7px 10px; border: 1px solid #d8e1db; border-radius: 6px; background: #f6f8f4; color: #35574b; font: inherit; font-size: 12px; cursor: pointer; }
.layout-switcher select:focus-visible { outline: 3px solid #268da780; outline-offset: 3px; }
.brand { display: inline-flex; align-items: center; flex-shrink: 0; gap: 20px; }
.brand-title {
  font-family: "STKaiti", "KaiTi", "SimSun", serif;
  font-size: 34px;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: .15em;
  color: #293d48;
  transition: color .2s ease;
}
.brand-caption {
  display: inline;
  margin-left: 0;
  padding-left: 20px;
  border-left: 1px solid #293d4840;
  font-family: sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: .24em;
  color: #65717a;
}
.brand:hover .brand-title { color: var(--accent); }
@media (max-width: 900px) {
  .site-navigation { gap: 10px; }
  .layout-switcher { padding-left: 16px; }
}
@media (max-width: 600px) {
  .site-header { gap: 16px; padding: 14px 20px; }
  .site-navigation { flex-direction: column; align-items: flex-end; gap: 9px; font-size: 14px; }
  .nav-links { gap: 12px; }
  .layout-switcher { padding-left: 0; border-left: 0; gap: 8px; }
  .layout-switcher select { min-height: 32px; padding: 4px 8px; }
  .brand-title { font-size: 30px; }
  .brand-caption { display: none; }
}
@media (max-width: 380px) { .site-header { padding-left: 14px; padding-right: 14px; gap: 10px; }.nav-links { gap: 10px; font-size: 13px; }.brand-title { font-size: 27px; } }
</style>
