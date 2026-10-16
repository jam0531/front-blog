<script setup>
import { computed } from 'vue'
import { getHomeLayout } from '../state/homeLayout.js'

defineProps({ title: String, description: String, meta: String })
const layout = computed(() => getHomeLayout())
</script>

<template>
  <section class="browse-shell" :class="`browse-theme-${layout.id}`">
    <header class="browse-intro">
      <p class="browse-eyebrow">十二 / 个人博客</p>
      <h1>{{ title }}</h1>
      <div class="browse-intro-bottom"><p>{{ description }}</p><span v-if="meta">{{ meta }}</span></div>
    </header>
    <slot />
    <footer class="browse-footer"><span>十二 · 把日常写成故事</span><RouterLink to="/home">回到首页 ↗</RouterLink></footer>
  </section>
</template>

<style scoped>
.browse-shell {
  --layout-ink: #293d38;
  --layout-muted: #6f7770;
  --layout-accent: #2b665b;
  --layout-line: #dedfd5;
  --browse-surface: #fffefa;
  --accent: var(--layout-accent);
  --border: var(--layout-line);
  padding: 42px;
  border: 1px solid #e6e5dc;
  border-radius: 4px;
  background: #faf9f4;
  color: var(--layout-ink);
}
.browse-eyebrow { margin: 0 0 20px; font-size: 11px; letter-spacing: .15em; color: var(--layout-accent); }
.browse-intro { padding-bottom: 30px; border-bottom: 1px solid var(--layout-line); margin-bottom: 32px; }
.browse-intro h1 { margin: 0 0 18px; color: var(--layout-ink); font: 400 48px/1.35 "Songti SC", "SimSun", serif; letter-spacing: .08em; overflow-wrap: anywhere; }
.browse-intro-bottom { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: var(--layout-muted); }
.browse-intro-bottom p { margin: 0; font-size: 13px; line-height: 1.9; }
.browse-intro-bottom > span { font-size: 12px; }
.browse-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 42px; padding-top: 24px; border-top: 1px solid var(--layout-line); color: var(--layout-muted); font-size: 11px; letter-spacing: .06em; }
.browse-shell :deep(.browse-state) { padding: 48px 20px; text-align: center; font-size: 14px; color: var(--layout-muted); }
.browse-shell :deep(.browse-section-heading) { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.browse-shell :deep(.browse-section-heading h2) { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .08em; color: var(--layout-ink); }
.browse-shell :deep(.browse-section-heading > span) { font-size: 11px; color: var(--layout-muted); }
.browse-shell :deep(.pagination) { padding-top: 14px; color: var(--layout-muted); }
.browse-shell :deep(.pagination button) { min-height: 40px; font-size: 12px; background: var(--browse-surface); }
.browse-theme-journal { --layout-accent: #876951; --layout-line: #e9e3d9; --browse-surface: #fffefa; background: #fffefa; padding: 48px 54px; }
.browse-theme-gallery { --layout-ink: #273e44; --layout-accent: #286976; --layout-line: #dfe7e4; --browse-surface: #fff; background: #f2f6f5; border-color: #dfe9e7; }
.browse-theme-gallery .browse-intro h1 { font-family: inherit; font-size: 36px; font-weight: 600; letter-spacing: -.02em; }
@media (max-width: 1050px) { .browse-shell { padding: 30px; } }
@media (max-width: 750px) { .browse-intro h1 { font-size: 40px; } }
@media (max-width: 480px) {
  .browse-shell { padding: 24px 18px; }
  .browse-intro { padding-bottom: 24px; margin-bottom: 26px; }
  .browse-intro h1 { font-size: 33px; }
  .browse-theme-gallery .browse-intro h1 { font-size: 29px; }
  .browse-intro-bottom > span, .browse-footer { font-size: 10px; }
}
</style>
