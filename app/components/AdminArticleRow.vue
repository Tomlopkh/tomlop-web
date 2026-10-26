<script setup lang="ts">
export interface ArticleRow { id: string, titleEn: string, titleKm: string, readingMinutes: number, published: boolean, updatedAt: string }

defineProps<{ article: ArticleRow, showStatus?: boolean }>()
</script>

<template>
  <li class="row-item">
    <NuxtLink class="arow" :to="`/admin/articles/${article.id}`">
      <span class="arow-num num">{{ Number.parseInt(article.id, 10) || '—' }}</span>
      <span class="arow-titles"><b>{{ article.titleKm }}</b><span>{{ article.titleEn }}</span></span>
      <span class="arow-end">
        <span v-if="showStatus || !article.published" class="chip" :class="article.published ? 'chip--live' : 'chip--draft'">{{ article.published ? 'Published' : 'Draft' }}</span>
        <span class="num">{{ article.readingMinutes }} min · {{ timeAgo(article.updatedAt) }}</span>
      </span>
    </NuxtLink>
  </li>
</template>
