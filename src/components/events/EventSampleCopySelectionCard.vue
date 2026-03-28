<script setup lang="ts">
import { ref } from 'vue'
import { MessageSquareQuote, ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  entityNames?: {
    stages?: Record<string, string>
    classifiers?: Record<string, string>
    transformers?: Record<string, string>
  }
}>()

const expanded = ref(false)

const classifierName = () =>
  props.entityNames?.classifiers?.[props.event.eventData.classifierId] || props.event.eventData.classifierId
</script>

<template>
  <div class="flex items-start gap-2">
    <button @click.stop="expanded = !expanded" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <MessageSquareQuote class="w-5 h-5 mt-0.5 text-stone-500 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
        <button @click="expanded = !expanded" class="font-semibold text-stone-700 dark:text-stone-200 shrink-0 text-left">Sample Copy Selection</button>
        <span v-if="!expanded" class="text-xs font-medium text-stone-600 dark:text-stone-300 min-w-0 truncate">{{ classifierName() }}</span>
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
          :class="event.eventData.sampleCopyId
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        >
          {{ event.eventData.sampleCopyId ? 'Selected' : 'None' }}
        </span>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Classifier:</span>
          <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ classifierName() }}</div>
        </div>
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200 mt-0.5 bg-white bg-opacity-60 rounded p-2 font-mono text-xs whitespace-pre-wrap wrap-break-word dark:bg-gray-900 dark:bg-opacity-60 dark:text-gray-300">{{ event.eventData.input }}</div>
        </div>
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Selected Copy:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200 mt-0.5">
            <span v-if="event.eventData.sampleCopyId" class="font-mono text-xs text-stone-700 dark:text-stone-300">{{ event.eventData.sampleCopyId }}</span>
            <span v-else class="text-xs text-gray-400 italic">None selected</span>
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
