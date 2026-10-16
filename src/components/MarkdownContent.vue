<script setup>
defineProps({ html: { type: String, default: '' } })
</script>

<template>
  <!-- 只接收后端安全渲染的 contentHtml，禁止直接插入用户输入或 Markdown 原文。 -->
  <div class="markdown-content" v-html="html"></div>
</template>
