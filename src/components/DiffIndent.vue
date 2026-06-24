<script setup lang="ts">
interface Props {
  depth: number
}

defineProps<Props>()
</script>

<template>
  <span class="shrink-0 select-none" :style="{ width: `${depth * 1.25}rem`, display: 'inline-block' }" />
</template>
