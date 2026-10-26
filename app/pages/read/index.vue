<script setup lang="ts">
useSeoMeta({
  title: 'បណ្ណាល័យ — ទម្លាប់',
  description: 'អត្ថបទខ្មែរខ្លីៗអំពីការគិត ទម្លាប់ និងការរស់នៅ។',
})

const { data: articles } = await useFetch('/api/read', { default: () => [] })
</script>

<template>
  <div class="shell">
    <section class="band band--flush">
      <h1 class="library-title"><span class="km">បណ្ណាល័យ</span><span class="en">Library</span></h1>
      <p class="hero-lede">
        <span class="km">អត្ថបទខ្លីៗចំនួន {{ kh(articles.length) }} ជាភាសាខ្មែរ អំពីការគិត ទម្លាប់ និងការរស់នៅ។ អត្ថបទដើមទាំងអស់មានស្រាប់ក្នុងកម្មវិធី ហើយអានបានទោះគ្មានអ៊ីនធឺណិត។</span>
        <span class="en">{{ articles.length }} short Khmer articles on thinking, habit and living. The original articles ship inside the app and are readable with no connection.</span>
      </p>
      <ol class="index">
        <li v-for="a in articles" :key="a.id" class="index-row">
          <NuxtLink :to="`/read/${a.id}/`">
            <span class="index-num">{{ kh(Number.parseInt(a.id, 10) || 0) }}</span>
            <span class="index-titles"><b>{{ a.titleKm }}</b><i>{{ a.titleEn }}</i></span>
            <span class="index-min"><span class="km">{{ kh(a.readingMinutes) }} នាទី</span><span class="en">{{ a.readingMinutes }} min</span></span>
          </NuxtLink>
        </li>
      </ol>
    </section>
  </div>
</template>
