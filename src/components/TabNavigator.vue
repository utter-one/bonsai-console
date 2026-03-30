<script lang="ts">
import type { VNodeChild } from 'vue'

export interface TabDefinition {
  key: string
  label: string | (() => VNodeChild)
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
      type="button"
      class="tab-button"
      :class="{ 'tab-button-active': modelValue === tab.key }"
      @click="emit('update:modelValue', tab.key)">
      <component v-if="typeof tab.label === 'function'" :is="tab.label" />
      <template v-else>{{ tab.label }}</template>
    </button>
  </nav>
</template>
