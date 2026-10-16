<script setup>
import { onMounted } from 'vue'
import BrowseShell from '../components/BrowseShell.vue'
import DiscussionThread from '../components/DiscussionThread.vue'
onMounted(() => { document.title = '留言 · 十二' })
</script>
<template><BrowseShell title="见字如面" description="路过也好，久别重逢也好，欢迎在这里打个招呼。"><DiscussionThread title="留言簿" :message-type="0" /></BrowseShell></template>
