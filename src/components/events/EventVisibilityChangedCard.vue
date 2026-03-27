<script setup lang="ts">
import { ref } from 'vue'
import { Eye, ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'

defineProps<{
  event: NormalizedEvent
}>()

const expanded = ref(false)
</script>

<template>
  <div class="flex items-start gap-2">
    <button @click.stop="expanded = !expanded" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <Eye class="w-5 h-5 mt-0.5 text-slate-500 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
        <button @click="expanded = !expanded" class="font-semibold text-slate-700 dark:text-slate-200 shrink-0 text-left">Visibility Changed</button>
        <span v-if="!expanded" class="text-xs font-medium text-slate-600 dark:text-slate-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
        <span
          v-if="!expanded && event.eventData.visibility"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
          :class="{
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': event.eventData.visibility.visibility === 'always',
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.eventData.visibility.visibility === 'stage',
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': event.eventData.visibility.visibility === 'never',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': event.eventData.visibility.visibility === 'conditional',
          }"
        >
          {{ event.eventData.visibility.visibility }}
        </span>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
          <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
        </div>
        <div v-if="event.eventData.visibility">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">New Visibility:</span>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': event.eventData.visibility.visibility === 'always',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.eventData.visibility.visibility === 'stage',
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': event.eventData.visibility.visibility === 'never',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': event.eventData.visibility.visibility === 'conditional',
              }"
            >
              {{ event.eventData.visibility.visibility }}
            </span>
            <span v-if="event.eventData.visibility.visibility === 'conditional' && event.eventData.visibility.condition"
              class="font-mono text-xs text-gray-600 dark:text-gray-400 truncate">
              {{ event.eventData.visibility.condition }}
            </span>
          </div>
        </div>
        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
          <details class="group">
            <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
              Metadata ({{ Object.keys(event.eventData.metadata).length }})
            </summary>
            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
              <pre class="whitespace-pre-wrap wrap-break-word dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
