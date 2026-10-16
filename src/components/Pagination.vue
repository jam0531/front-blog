<script setup>
import { computed } from 'vue'
const props = defineProps({ page: Number, size: Number, total: Number })
const emit = defineEmits(['change'])
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
</script>

<template>
  <nav class="pagination" aria-label="文章分页">
    <button :disabled="page <= 1" @click="emit('change', Math.max(1, page - 1))">上一页</button>
    <span>第 {{ page }} 页 / 共 {{ pages }} 页 · {{ total }} 篇</span>
    <button :disabled="page >= pages" @click="emit('change', page + 1)">下一页</button>
    <button v-if="page > pages" @click="emit('change', 1)">返回第一页</button>
  </nav>
</template>
