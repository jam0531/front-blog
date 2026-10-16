<script setup>
import { computed, ref, watch } from 'vue'
import { imageUrl } from '../utils/resourceUrl.js'
const props = defineProps({ src: String, alt: { type: String, default: '' }, eager: Boolean })
const failed = ref(false)
const source = computed(() => imageUrl(props.src))
watch(() => props.src, () => { failed.value = false })
</script>
<template>
  <img v-if="source && !failed" :src="source" :alt="alt" :loading="eager ? 'eager' : 'lazy'" @error="failed = true" />
  <div v-else class="resource-image-fallback" role="img" :aria-label="alt || '图片暂不可用'"><span>十二</span><small>图片暂不可用</small></div>
</template>
<style scoped>
img { display: block; width: 100%; height: 100%; object-fit: cover; }
.resource-image-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 100%; min-height: 80px; color: #61766d; background: #e8eee8; }
.resource-image-fallback span { font: 400 28px "KaiTi", "SimSun", serif; letter-spacing: .15em; }
.resource-image-fallback small { font-size: 11px; }
</style>
