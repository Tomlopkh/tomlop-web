<script setup lang="ts">
// One article, as readers see it. The public page and the backoffice preview both render this,
// so the preview cannot drift from what gets published.
defineProps<{
  article: {
    titleEn: string
    titleKm: string
    minutes: number
    intro: string[]
    sections: { title: string, lines: { text: string, bullet: boolean }[] }[]
  }
}>()
</script>

<template>
  <article class="prose article">
    <p class="kicker">{{ article.titleEn }}</p>
    <h1>{{ article.titleKm }}</h1>
    <p class="updated">
      <span class="km">អានប្រហែល {{ kh(article.minutes) }} នាទី</span>
      <span class="en">About {{ article.minutes }} min read</span>
    </p>

    <p v-for="(p, i) in article.intro" :key="`i${i}`"><InlineText :text="p" /></p>

    <template v-for="section in article.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <!-- Consecutive bullets form one list; any other line is a paragraph. -->
      <template v-for="(group, g) in groupLines(section.lines)" :key="g">
        <ul v-if="group.bullets"><li v-for="(line, l) in group.lines" :key="l"><InlineText :text="line" /></li></ul>
        <p v-else><InlineText :text="group.lines[0]!" /></p>
      </template>
    </template>

    <slot />
  </article>
</template>
