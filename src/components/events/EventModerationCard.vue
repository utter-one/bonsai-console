<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldAlert, ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatMs } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
}>()

const expanded = ref(false)

const isBlocking = computed(() =>
  props.event.eventData.blockingCategories && props.event.eventData.blockingCategories.length > 0,
)

const isDetected = computed(() =>
  props.event.eventData.detectedCategories && props.event.eventData.detectedCategories.length > 0,
)

const iconColor = computed(() =>
  isBlocking.value ? 'text-red-600' : isDetected.value ? 'text-amber-500' : 'text-green-600',
)
</script>

<template>
  <div class="grid grid-cols-[auto_auto_1fr] gap-x-2">
    <button @click.stop="expanded = !expanded" class="place-self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <ShieldAlert class="place-self-center w-5 h-5" :class="iconColor" />
    <div style="display:contents">
      <div class="min-w-0 flex items-center gap-2">
        <button @click="expanded = !expanded" class="font-semibold shrink-0 text-left" :class="isBlocking ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'">
          Moderation
        </button>
        <span
          class="text-xs font-medium px-1.5 py-0.5 rounded shrink-0"
          :class="isBlocking
            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
            : isDetected
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'"
        >
          {{ isBlocking ? 'Blocked' : isDetected ? 'Detected' : 'Passed' }}
        </span>
        <span v-if="!expanded && isBlocking" class="text-xs text-gray-500 truncate">{{ event.eventData.blockingCategories.join(', ') }}</span>
        <span v-else-if="!expanded && isDetected" class="text-xs text-gray-500 truncate">{{ event.eventData.detectedCategories.join(', ') }}</span>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
        <span v-if="event.eventData.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 shrink-0"><span class="text-amber-600 dark:text-amber-400">{{ formatMs(event.eventData.durationMs) }}</span></span>
      </div>
      <div v-show="expanded" class="col-start-3 mt-2 space-y-2">
        <div v-if="event.eventData.blockingCategories && event.eventData.blockingCategories.length > 0">
          <span class="text-xs font-medium text-red-700 dark:text-red-400">Blocking Categories:</span>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <span v-for="cat in event.eventData.blockingCategories" :key="cat"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800">
              {{ cat }}
            </span>
          </div>
        </div>
        <div v-if="event.eventData.detectedCategories && event.eventData.detectedCategories.length > 0">
          <span class="text-xs font-medium text-amber-700 dark:text-amber-400">Detected Categories:</span>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <span v-for="cat in event.eventData.detectedCategories" :key="cat"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
              {{ cat }}
            </span>
          </div>
        </div>
        <div v-if="event.eventData.input">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
          <div class="text-sm text-gray-900 dark:text-gray-200 bg-white bg-opacity-60 rounded p-2 mt-1 dark:bg-gray-900 dark:bg-opacity-60">{{ event.eventData.input }}</div>
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
