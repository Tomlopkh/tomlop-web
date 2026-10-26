<script setup lang="ts">
// A small drawn icon set: one 24px grid, 1.75 stroke, round caps. Decorative by default;
// the control that holds an icon carries the accessible name.
defineProps<{ name: 'plus' | 'search' | 'copy' | 'check' | 'external' | 'plug' | 'arrow-left' | 'trash' | 'alert' | 'x' }>()

const paths: Record<string, string> = {
  'plus': 'M12 5v14M5 12h14',
  'search': 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  'copy': 'M9 9h10v11H9zM5 15V4h10',
  'check': 'M5 12.8 9.4 17 19 7.2',
  'external': 'M14 5h5v5M19 5l-8 8M18 14v5H5V6h5',
  'plug': 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'trash': 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  'alert': 'M12 4 3 20h18zM12 10v4.5M12 17.5v.01',
  'x': 'M6 6l12 12M18 6 6 18',
}
</script>

<template>
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name]" />
  </svg>
</template>
