<script setup lang="ts">
// Renders the article format's one inline style, **bold**, as text nodes and <strong>,
// never as HTML.
const props = defineProps<{ text: string }>()
const segments = computed(() => splitBold(props.text))
</script>

<template>
  <template v-for="(segment, i) in segments" :key="i">
    <strong v-if="segment.bold">{{ segment.text }}</strong>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
