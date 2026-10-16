<script setup>
defineProps({ blog: { type: Object, required: true } })
</script>

<template>
  <article class="blog-card panel">
    <RouterLink v-if="blog.blogPic" :to="`/blog/${blog.id}`" class="card-image" tabindex="-1" aria-hidden="true">
      <img :src="blog.blogPic" alt="" loading="lazy" @error="$event.target.hidden = true" />
    </RouterLink>
    <div class="card-body">
      <span class="eyebrow">{{ blog.type?.typeName || '未分类' }}</span>
      <h2><RouterLink :to="`/blog/${blog.id}`">{{ blog.title }}</RouterLink></h2>
      <p class="description">{{ blog.description || '暂无摘要' }}</p>
      <div class="meta"><span>{{ blog.author?.aliasname || '佚名' }}</span><time>{{ blog.updateTime?.slice(0, 10) || '日期未记录' }}</time><span>{{ blog.views }} 次阅读</span></div>
      <div v-if="blog.tags.length" class="tags"><span v-for="tag in blog.tags" :key="tag.id"># {{ tag.tagName }}</span></div>
    </div>
  </article>
</template>
