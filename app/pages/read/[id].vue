<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
const { data: article, error } = await useFetch(`/api/read/${id}`)
if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

useSeoMeta({
  title: () => `${article.value?.titleKm} — ទម្លាប់`,
  description: () => article.value?.intro[0] ?? article.value?.titleEn ?? '',
})
</script>

<template>
  <div v-if="article" class="shell">
    <ArticleBody :article="article">
      <nav class="pager">
        <NuxtLink v-if="article.prev" class="pager-prev" :to="`/read/${article.prev.id}/`">
          <span class="pager-dir km">មុន</span><span class="pager-dir en">Previous</span>
          <span class="pager-title">{{ article.prev.titleKm }}</span>
        </NuxtLink>
        <span v-else />
        <NuxtLink v-if="article.next" class="pager-next" :to="`/read/${article.next.id}/`">
          <span class="pager-dir km">បន្ទាប់</span><span class="pager-dir en">Next</span>
          <span class="pager-title">{{ article.next.titleKm }}</span>
        </NuxtLink>
        <span v-else />
      </nav>
    </ArticleBody>
  </div>
</template>
