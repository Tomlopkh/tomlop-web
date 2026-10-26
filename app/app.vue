<script setup lang="ts">
const { lang } = useLang()

useHead({
  htmlAttrs: { lang: computed(() => (lang.value === 'en' ? 'en' : 'km')), 'data-lang': lang },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
