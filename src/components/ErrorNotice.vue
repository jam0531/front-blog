<script setup>
import { watch } from 'vue'
import { showError } from '../state/errorNotifications.js'

const props = defineProps({ error: [Object, String], actionTo: [Object, String], actionLabel: String })
// 只负责通知，不清空页面的错误状态；提示消失后仍能重试。
watch(() => props.error, error => showError(error, { actionTo: props.actionTo, actionLabel: props.actionLabel }), { immediate: true })
</script>

<template></template>
