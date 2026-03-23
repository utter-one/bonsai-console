<script setup lang="ts">
defineProps<{
  name: string
  activeTab: string
}>()
</script>

<template>
  <div v-show="name === activeTab">
    <slot />
  </div>
</template>
