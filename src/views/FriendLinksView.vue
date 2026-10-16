<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getFriendLinks } from '../api/resources.js'
import { webUrl } from '../utils/resourceUrl.js'
import BrowseShell from '../components/BrowseShell.vue'
import ResourceImage from '../components/ResourceImage.vue'
import DiscussionThread from '../components/DiscussionThread.vue'
const friends = ref([])
const loading = ref(true)
const error = ref('')
const controller = new AbortController()
async function load() {
  loading.value = true; error.value = ''
  try { friends.value = await getFriendLinks(controller.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '友链加载失败。' }
  finally { loading.value = false }
}
onMounted(() => { document.title = '友链 · 十二'; load() })
onBeforeUnmount(() => controller.abort())
</script>
<template>
  <BrowseShell title="山海有相逢" description="这里收录一些朋友的小站，愿每一次拜访都有新的发现。" :meta="!loading && !error ? `${friends.length} 个小站` : ''">
    <div v-if="loading" class="browse-state" role="status">正在加载友链…</div><div v-else-if="error" class="browse-state" role="alert"><p>{{ error }}</p><button @click="load">重试</button></div>
    <p v-else-if="!friends.length" class="browse-state">友链正在慢慢收集中，期待下一次相逢。</p>
    <ul v-else class="friends-grid"><li v-for="friend in friends" :key="friend.id"><component :is="webUrl(friend.friendlinkAddress) ? 'a' : 'div'" :href="webUrl(friend.friendlinkAddress) || undefined" :target="webUrl(friend.friendlinkAddress) ? '_blank' : undefined" rel="noopener noreferrer" class="friend-card"><div class="friend-avatar"><ResourceImage :src="friend.friendlinkAvater" :alt="''" /></div><div class="friend-copy"><h2>{{ friend.friendlinkName || '友邻博客' }}</h2><p>{{ friend.friendlinkDescription || '去看看朋友的记录与分享。' }}</p><span>{{ webUrl(friend.friendlinkAddress) ? '拜访小站 ↗' : '地址暂不可用' }}</span></div></component></li></ul>
    <DiscussionThread :message-type="1" title="友链交流" />
  </BrowseShell>
</template>
<style scoped>
.friends-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }.friend-card { display: flex; align-items: flex-start; gap: 20px; height: 100%; padding: 26px; border: 1px solid var(--layout-line); background: var(--browse-surface); border-radius: 5px; }.friend-card[href]:hover { border-color: var(--layout-accent); }.friend-avatar { width: 64px; height: 64px; flex-shrink: 0; border-radius: 50%; overflow: hidden; }.friend-avatar :deep(.resource-image-fallback) { min-height: 64px; gap: 0; }.friend-avatar :deep(small) { display: none; }.friend-copy { min-width: 0; }.friend-copy h2 { margin: 0 0 10px; color: var(--layout-ink); font: 400 22px/1.5 "Songti SC","SimSun",serif; overflow-wrap: anywhere; }.friend-copy p { margin: 0 0 15px; color: var(--layout-muted); font-size: 12px; line-height: 1.9; overflow-wrap: anywhere; }.friend-copy > span { color: var(--layout-accent); font-size: 11px; }
@media(max-width:750px) { .friends-grid { grid-template-columns: 1fr; } } @media(max-width:480px) { .friend-card { gap: 15px; padding: 20px; }.friend-avatar { width: 52px; height: 52px; } }
</style>
