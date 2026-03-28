<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatEventType } from './eventHelpers'

defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
}>()

const expanded = ref(false)
</script>

<template>
  <div class="grid grid-cols-[auto_1fr] gap-x-2">
    <button @click.stop="expanded = !expanded" class="place-self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <div style="display:contents">
      <div class="min-w-0 flex items-center gap-2">
        <button @click="expanded = !expanded" class="font-semibold text-gray-800 dark:text-gray-200 shrink-0 text-left">
          {{ formatEventType(event.eventType) }}
        </button>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="col-start-2 mt-2 space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Raw Event Data:</span>
          <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
            <pre class="whitespace-pre-wrap wrap-break-word">{{ JSON.stringify(event.eventData, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
