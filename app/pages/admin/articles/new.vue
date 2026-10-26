<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: 'New article' })

const { data } = await useFetch<{ suggestedNextId: string }>('/api/admin/articles')
// Suggest the next number with an empty name, so the owner chooses what it is called.
const suggested = computed(() => (data.value?.suggestedNextId ?? '').replace(/-new-article$/, '-'))
const template = `# English Title / ចំណងជើងខ្មែរ

សរសេរកថាខណ្ឌនាំមួយជួរក្នុងមួយកថាខណ្ឌ។

## ចំណងជើងផ្នែក

- **ពាក្យគន្លឹះ៖** ការពន្យល់ខ្លី
កថាខណ្ឌធម្មតា។
`
</script>

<template>
  <AdminArticleEditor mode="create" :id="suggested" :markdown="template" :published="false" />
</template>
