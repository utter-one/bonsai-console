<script setup lang="ts">
import { ref } from 'vue'
import {
  Reply,
  CheckCircle,
  XCircle,
  Bug,
  ChevronRight,
  ChevronDown,
  Braces,
} from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { hasCurrentVariables } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-variables', variables: Record<string, any>): void
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const expanded = ref(false)

function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <div class="grid grid-cols-[auto_auto_1fr] gap-x-2">
    <button @click.stop="expanded = !expanded" class="place-self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <Reply class="place-self-center w-5 h-5 text-indigo-600" />
    <div style="display:contents">
      <div class="min-w-0 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <button @click="expanded = !expanded" class="font-semibold text-indigo-900 dark:text-indigo-100 shrink-0 text-left">Tool Reply</button>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            :class="event.eventData.status === 'completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'"
          >
            <CheckCircle v-if="event.eventData.status === 'completed'" class="w-3 h-3" />
            <XCircle v-else class="w-3 h-3" />
            {{ capitalizeStatus(event.eventData.status) }}
          </span>
          <span v-if="event.eventData.aborted" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 shrink-0">
            Aborted
          </span>
          <span v-if="!expanded" class="text-xs font-medium text-indigo-700 dark:text-indigo-300 min-w-0 truncate">
            {{ event.eventData.toolId || event.eventData.requestId }}
          </span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <button
            v-if="hasCurrentVariables(event.eventData.metadata)"
            @click="emit('open-variables', event.eventData.metadata!.currentVariables as Record<string, any>)"
            class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            title="View stage variables">
            <Braces class="w-4 h-4" />
          </button>
          <button
            v-if="showBugReport"
            @click="emit('open-bug-report', event)"
            class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            title="Report bug">
            <Bug class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-show="expanded" class="col-start-3 mt-2 space-y-2">
        <div v-if="event.eventData.requestId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Request ID:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.requestId }}</div>
        </div>
        <div v-if="event.eventData.toolId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool ID:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toolId }}</div>
        </div>
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Status:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">{{ capitalizeStatus(event.eventData.status) }}</div>
        </div>
        <div v-if="event.eventData.hasEffects">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Effects:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.effectsCount }} effect(s)</div>
        </div>
        <div v-if="event.eventData.hasData">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Data:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200">Included</div>
        </div>
        <div v-if="event.eventData.error">
          <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-800">
            <span class="text-xs font-medium text-red-700 dark:text-red-300">Error:</span>
            <div class="text-sm text-red-900 mt-1 dark:text-red-200">{{ event.eventData.error }}</div>
          </div>
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
