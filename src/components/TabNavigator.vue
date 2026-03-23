<script lang="ts">
export interface TabDefinition {
  key: string
  label: string
  show?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  tabs: TabDefinition[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const visibleTabs = computed(() => props.tabs.filter((t) => t.show !== false))
</script>

<template>
  <nav class="tabs-nav">
    <button
      v-for="tab in visibleTabs"
      :key="tab.key"
      class="tab-button"
      :class="{ 'tab-button-active': modelValue === tab.key }"
      @click="emit('update:modelValue', tab.key)">
      {{ tab.label }}
    </button>
  </nav>
</template>
