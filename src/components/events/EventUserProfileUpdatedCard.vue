<script setup lang="ts">
import { ref } from 'vue'
import { UserCircle, ChevronRight, ChevronDown } from 'lucide-vue-next'
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
    <UserCircle class="w-5 h-5 mt-0.5 text-sky-600 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
        <button @click="expanded = !expanded" class="font-semibold text-sky-900 dark:text-sky-100 shrink-0 text-left">Profile Updated</button>
        <span v-if="!expanded" class="text-xs font-medium text-sky-700 dark:text-sky-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
        <span v-if="!expanded && event.eventData.profile" class="text-xs text-gray-400 shrink-0">· {{ Object.keys(event.eventData.profile).length }} field(s)</span>
        <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
          <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
        </div>
        <div v-if="event.eventData.profile && Object.keys(event.eventData.profile).length > 0">
          <details class="group" open>
            <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
              Profile Fields ({{ Object.keys(event.eventData.profile).length }})
            </summary>
            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
              <pre class="whitespace-pre-wrap wrap-break-word dark:text-gray-300">{{ JSON.stringify(event.eventData.profile, null, 2) }}</pre>
            </div>
          </details>
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
