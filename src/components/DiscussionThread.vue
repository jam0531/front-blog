<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { getDiscussion, postDiscussion } from '../api/discussions.js'
import Pagination from './Pagination.vue'
const props = defineProps({ blogId: String, messageType: { type: Number, default: 0 }, enabled: { type: Boolean, default: true }, title: { type: String, default: '说说你的想法' } })
const result = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const submitError = ref('')
const success = ref('')
const replying = ref(null)
const textarea = ref(null)
const cooldown = ref(false)
const form = reactive({ nickname: '', email: '', content: '' })
const dirty = computed(() => !!form.content.trim())
let controller, cooldownTimer
async function load(page = 1) {
  controller?.abort()
  const current = controller = new AbortController()
  loading.value = true; error.value = ''
  try { result.value = await getDiscussion(props.blogId, props.messageType, page, current.signal) }
  catch (e) { if (e.name !== 'AbortError') error.value = e.message || '留言加载失败。' }
  finally { if (controller === current) loading.value = false }
}
function reply(item) { replying.value = item; textarea.value?.focus() }
function waitForInterval() { cooldown.value = true; clearTimeout(cooldownTimer); cooldownTimer = setTimeout(() => { cooldown.value = false }, 15000) }
async function submit() {
  if (busy.value || cooldown.value || !props.enabled) return
  if (!form.nickname.trim() || !form.email.trim() || !form.content.trim()) { submitError.value = '请填写昵称、邮箱和内容。'; return }
  busy.value = true; submitError.value = ''; success.value = ''
  const wasReply = !!replying.value
  try {
    await postDiscussion(props.blogId, props.messageType, { nickname: form.nickname.trim(), email: form.email.trim(), content: form.content.trim(), parentId: replying.value?.id || null })
    form.content = ''; replying.value = null; success.value = wasReply ? '回复已发表。' : '留言已发表。'; waitForInterval()
    await load(wasReply ? result.value?.page || 1 : 1)
  } catch (e) { submitError.value = e.message || '发表失败，请稍后重试。'; if (e.status === 429) waitForInterval() }
  finally { busy.value = false }
}
onBeforeRouteLeave(() => !busy.value && (!dirty.value || window.confirm('留言尚未发表，确定离开吗？')))
function beforeUnload(event) { if (busy.value || dirty.value) { event.preventDefault(); event.returnValue = '' } }
watch(() => [props.blogId, props.messageType], () => { replying.value = null; result.value = null; load() }, { immediate: true })
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => { controller?.abort(); clearTimeout(cooldownTimer); window.removeEventListener('beforeunload', beforeUnload) })
</script>

<template>
  <section class="discussion" :aria-label="title">
    <header class="discussion-heading"><h2>{{ title }}</h2><span v-if="result">{{ result.total }} 条话题</span></header>
    <p v-if="loading" class="discussion-state" role="status">正在加载…</p>
    <div v-else-if="error" class="discussion-state" role="alert"><p>{{ error }}</p><button @click="load(result?.page || 1)">重试</button></div>
    <template v-else-if="result"><p v-if="!result.records.length" class="discussion-state">还没有留言，来留下第一句话吧。</p>
      <ol v-else class="discussion-roots"><li v-for="root in result.records" :key="root.id"><article class="discussion-entry"><div class="discussion-person"><strong>{{ root.nickname || '访客' }}</strong><span v-if="root.admin" class="discussion-badge">博主</span><time :datetime="root.createTime || undefined">{{ root.createTime?.replace('T', ' ') || '' }}</time></div><p class="discussion-content">{{ root.content }}</p><button v-if="enabled" :disabled="busy" class="discussion-reply" @click="reply(root)">回复 {{ root.nickname || '访客' }}</button></article>
        <ol v-if="root.replies.length" class="discussion-replies"><li v-for="item in root.replies" :key="item.id"><article class="discussion-entry"><div class="discussion-person"><strong>{{ item.nickname || '访客' }}</strong><span v-if="item.admin" class="discussion-badge">博主</span><span>回复 {{ item.replyTo || '访客' }}</span><time :datetime="item.createTime || undefined">{{ item.createTime?.replace('T', ' ') || '' }}</time></div><p class="discussion-content">{{ item.content }}</p><button v-if="enabled" :disabled="busy" class="discussion-reply" @click="reply(item)">回复 {{ item.nickname || '访客' }}</button></article></li></ol>
      </li></ol><Pagination :page="result.page" :size="result.size" :total="result.total" unit="条话题" label="评论留言分页" @change="page => !busy && load(page)" />
    </template>
    <p v-if="!enabled" class="discussion-closed">这篇文章已关闭评论，已有交流仍保留在这里。</p>
    <form v-else class="discussion-form" @submit.prevent="submit"><fieldset :disabled="busy"><legend>{{ replying ? `回复 ${replying.nickname || '访客'}` : '留下一句话' }}</legend><button v-if="replying" type="button" class="discussion-reply" @click="replying = null">取消回复</button><div class="discussion-fields"><label>昵称<input v-model="form.nickname" required maxlength="255" autocomplete="nickname" /></label><label>邮箱<span>仅博主管理时可见</span><input v-model="form.email" type="email" required maxlength="255" autocomplete="email" /></label></div><label class="discussion-text">内容<textarea ref="textarea" v-model="form.content" required maxlength="5000" rows="4" placeholder="分享你的想法…" /></label><div class="discussion-form-bottom"><small>纯文本 · 每次发表请间隔 15 秒<br />已登录管理员时，使用博主身份发表。</small><button type="submit" :disabled="cooldown">{{ busy ? '正在发表…' : cooldown ? '请稍候再发表' : '发表' }}</button></div></fieldset></form>
    <p v-if="submitError" class="discussion-error" role="alert">{{ submitError }}</p><p v-if="success" class="discussion-success" role="status">{{ success }}</p>
  </section>
</template>

<style scoped>
.discussion { --discussion-line: var(--layout-line,#dce4df); margin-top: 40px; padding-top: 30px; border-top: 1px solid var(--discussion-line); }.discussion-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }.discussion-heading h2 { font: 400 26px/1.5 "SimSun",serif; margin: 0 0 20px; }.discussion-heading > span,.discussion-state,.discussion-closed { font-size: 12px; color: var(--layout-muted,#6c7b77); }.discussion-state { padding: 24px 0; }.discussion-roots,.discussion-replies { list-style: none; padding: 0; margin: 0; }.discussion-roots > li { padding: 22px 0; border-bottom: 1px solid var(--discussion-line); }.discussion-person { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; color: var(--layout-muted,#6c7b77); font-size: 11px; overflow-wrap: anywhere; }.discussion-person strong { color: var(--layout-ink,#293d38); font-size: 13px; }.discussion-person time { font-size: 10px; }.discussion-badge { background: #e2eee7; color: #2b665b; padding: 2px 6px; border-radius: 3px; font-size: 10px; }.discussion-content { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.9; margin: 12px 0; }.discussion-reply { border: 0; background: transparent; padding: 4px 0; color: var(--layout-accent,#2b665b); font-size: 11px; }.discussion-replies { border-left: 2px solid var(--discussion-line); margin: 20px 0 0 16px; padding-left: 20px; }.discussion-replies > li + li { margin-top: 22px; }.discussion-form { margin-top: 30px; background: var(--browse-surface,#f7f9f6); padding: 24px; border: 1px solid var(--discussion-line); border-radius: 5px; }.discussion-form fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }.discussion-form legend { font-size: 15px; padding: 0 0 18px; }.discussion-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }.discussion-form label { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; }.discussion-form label > span { color: var(--layout-muted,#6c7b77); font-size: 10px; }.discussion-form input,.discussion-form textarea { width: 100%; min-width: 0; border: 1px solid var(--discussion-line); background: #fff; border-radius: 4px; padding: 11px; color: #293d38; font: inherit; font-size: 14px; }.discussion-form textarea { resize: vertical; line-height: 1.8; }.discussion-text { margin-top: 18px; }.discussion-form-bottom { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 18px; }.discussion-form-bottom small { color: var(--layout-muted,#6c7b77); line-height: 1.7; font-size: 10px; }.discussion-form-bottom button { background: #315e50; color: #fff; padding: 10px 25px; border: 0; }.discussion-form-bottom button:disabled { opacity: .55; }.discussion-error { font-size: 13px; color: #9b3232; }.discussion-success { font-size: 13px; color: #2b665b; }
@media(max-width:600px) { .discussion-form { padding: 18px; }.discussion-fields { grid-template-columns: 1fr; }.discussion-replies { margin-left: 5px; padding-left: 15px; } }
</style>
