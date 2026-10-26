<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const id = String(useRoute().params.id)
useHead({ title: id })
const { data, error } = await useFetch<{ id: string, markdown: string, published: boolean }>(`/api/admin/articles/${id}`)
</script>

<template>
  <div v-if="error" class="adm-mid">
    <NuxtLink class="backlink" to="/admin"><AdminIcon name="arrow-left" />Articles</NuxtLink>
    <h1 style="margin-top:.75rem">No article “{{ id }}”</h1>
    <p class="soft" style="margin-top:.5rem">It may have been deleted, or the number is mistyped.</p>
  </div>
  <AdminArticleEditor v-else-if="data" :key="data.id" mode="update" :id="data.id" :markdown="data.markdown" :published="data.published" />
</template>
