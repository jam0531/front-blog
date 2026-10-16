<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import BrowseShell from '../components/BrowseShell.vue'
const route = useRoute()
const aboutSite = computed(() => route.meta.aboutSite === true)
watch(aboutSite, value => { document.title = `${value ? '关于本站' : '关于十二'} · 十二` }, { immediate: true })
</script>
<template>
  <BrowseShell :title="aboutSite ? '这个小站的故事' : '你好，我是十二'" description="记录生活，分享技术。">
    <nav class="about-tabs" aria-label="关于页面"><RouterLink to="/about" :class="{ selected: !aboutSite }">关于我</RouterLink><RouterLink to="/about-web" :class="{ selected: aboutSite }">关于本站</RouterLink></nav>
    <article v-if="aboutSite" class="about-prose"><p class="about-date">故事从 2021 年 11 月 10 日开始</p><h2>从一个想法，慢慢变成一个网站</h2><p>本站于2021年11月10号开始着手准备。最开始的初衷只是单纯觉得自己上了“软件工程实践”这门课，可以有能力来做一下网站了。同时可以锻炼自己的全栈开发的能力。</p><p>说实话，自己着手搭建这个网站还是比较迷茫的。对于自己的页面设计和功能设计完全没有清楚的思路，只是觉得要有这个功能或者说别人有我也要有的。一开始真的无从下手，自己只有零零散散的想法，自己想做的东西又有很多。</p><p>但是觉得自己与其在哪空想还不如直接开始动手开始先写代码来的直接。以后想到啥补啥。</p><p>开始的时候，从 GitHub 上看了很多炫酷的网站。但自己想要一个简简单单的网站，满足一下自己的需求就好了。所以简单最好。</p><p>这个小站也参考了其他人的网站，在一点点尝试中，继续记录和完善。</p></article>
    <article v-else class="about-prose"><div class="about-signature" aria-hidden="true">十二</div><h2>把生活中的点滴，写成可以回看的故事。</h2><p>这里是十二的个人博客。生活的片段，技术的积累，都在这里。</p><p>你可以从一个感兴趣的分类开始，也可以翻翻归档，或者在相册里停留一会儿。</p><div class="about-links"><RouterLink to="/types">按主题阅读 ↗</RouterLink><RouterLink to="/album">看看相册 ↗</RouterLink></div></article>
  </BrowseShell>
</template>
<style scoped>
.about-tabs { display: flex; gap: 26px; margin-bottom: 36px; font-size: 13px; color: var(--layout-muted); }.about-tabs a { padding: 8px 0; border-bottom: 2px solid transparent; }.about-tabs a.selected { color: var(--layout-accent); border-color: var(--layout-accent); }.about-prose { max-width: 720px; margin: 0 auto; padding: 8px 0 30px; }.about-prose h2 { font: 400 29px/1.7 "Songti SC","SimSun",serif; margin-bottom: 26px; color: var(--layout-ink); }.about-prose p { font-size: 14px; line-height: 2.2; color: var(--layout-muted); margin-bottom: 24px; }.about-prose .about-date { font-size: 11px; color: var(--layout-accent); letter-spacing: .05em; }.about-signature { font: 400 62px/1.5 "STKaiti","KaiTi","SimSun",serif; letter-spacing: .15em; margin-bottom: 28px; }.about-links { display: flex; flex-wrap: wrap; gap: 26px; margin-top: 30px; color: var(--layout-accent); font-size: 12px; } @media(max-width:480px) { .about-prose h2 { font-size: 24px; }.about-prose p { font-size: 13px; } }
</style>
