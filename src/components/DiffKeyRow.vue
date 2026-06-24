<script setup lang="ts">
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import DiffIndent from '@/components/DiffIndent.vue'

interface Props {
  depth: number
  label: string
  status: 'same' | 'modified' | 'deleted' | 'added'
  side: 'left' | 'right'
  isCollapsible: boolean
  isCollapsed: boolean
  keyClass: (status: 'same' | 'modified' | 'deleted' | 'added', side: 'left' | 'right') => string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6">
    <DiffIndent :depth="depth" />
    <span :class="keyClass(status, side)" class="shrink-0 whitespace-nowrap">{{ label }}:</span>
    <span v-if="isCollapsible" class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 self-center">
      <ChevronRight v-if="isCollapsed" class="w-3 h-3" />
      <ChevronDown v-else class="w-3 h-3" />
    </span>
  </div>
</template>
