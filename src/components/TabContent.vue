<script setup lang="ts">
const props = defineProps<{ tab: string; modelValue: string }>()
</script>

<template>
  <div v-show="modelValue === props.tab" class="tab-content" :data-tab="props.tab">
    <slot />
  </div>
</template>
