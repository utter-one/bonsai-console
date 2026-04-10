<script setup lang="ts">
import { ref } from 'vue'
import { UserX, ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'

defineProps<{
  event: NormalizedEvent
}>()

const expanded = ref(false)
</script>

<template>
  <div class="grid grid-cols-[auto_auto_1fr] gap-x-2">
    <button @click.stop="expanded = !expanded" class="place-self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <UserX class="place-self-center w-5 h-5 text-rose-600" />
    <div style="display:contents">
      <div class="min-w-0 flex items-center gap-2">
        <button @click="expanded = !expanded" class="font-semibold text-rose-900 dark:text-rose-100 shrink-0 text-left">User Banned</button>
        <span v-if="!expanded" class="text-xs font-medium text-rose-700 dark:text-rose-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
        <span v-if="!expanded && event.eventData.reason" class="text-xs text-gray-500 shrink-0 truncate">· {{ event.eventData.reason }}</span>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="col-start-3 mt-2 space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
          <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
        </div>
        <div v-if="event.eventData.reason">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
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
