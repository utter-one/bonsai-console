<script setup lang="ts">
import { ref } from 'vue'
import { Layers, ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { resolveName } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
  entityNames?: {
    stages?: Record<string, string>
  }
}>()

const expanded = ref(false)
</script>

<template>
  <div class="flex items-start gap-2">
    <button @click.stop="expanded = !expanded" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <Layers class="w-5 h-5 mt-0.5 text-teal-600 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
        <button @click="expanded = !expanded" class="font-semibold text-teal-900 dark:text-teal-100 shrink-0 text-left">Stage Transition</button>
        <template v-if="!expanded">
          <span class="text-xs font-medium text-teal-700 dark:text-teal-300 shrink-0 truncate">{{ resolveName(event.eventData.fromStageId, entityNames?.stages) }}</span>
          <span class="text-xs text-gray-400 shrink-0">→</span>
          <span class="text-xs font-medium text-teal-700 dark:text-teal-300 min-w-0 truncate">{{ resolveName(event.eventData.toStageId, entityNames?.stages) }}</span>
        </template>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div v-if="event.eventData.fromStageId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">From:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.fromStageId, entityNames?.stages) }}</div>
          <div v-if="entityNames?.stages?.[event.eventData.fromStageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.fromStageId }}</div>
        </div>
        <div v-if="event.eventData.toStageId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">To:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.toStageId, entityNames?.stages) }}</div>
          <div v-if="entityNames?.stages?.[event.eventData.toStageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.toStageId }}</div>
        </div>
        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
          <details class="group">
            <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
              Metadata ({{ Object.keys(event.eventData.metadata).length }})
            </summary>
            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
              <pre class="whitespace-pre-wrap wrap-break-word">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
