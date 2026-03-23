<script setup lang="ts">
import { ref } from 'vue'
import {
  Terminal,
  FileText,
  Wand2,
  ScrollText,
  Braces,
  Bug,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatMs, hasSystemPrompt, hasRawResponse, hasFillerPrompt, hasCurrentVariables } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-prompt', prompt: string): void
  (e: 'open-filler-prompt', prompt: string): void
  (e: 'open-raw-response', rawResponse: string): void
  (e: 'open-variables', variables: Record<string, any>): void
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const expanded = ref(false)
</script>

<template>
  <div class="flex items-start gap-2">
    <button @click.stop="expanded = !expanded" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <Terminal class="w-5 h-5 mt-0.5 text-indigo-600 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
        <div class="flex items-center gap-2 min-w-0">
          <button @click="expanded = !expanded" class="font-semibold text-indigo-900 dark:text-indigo-100 shrink-0 text-left">Command</button>
          <span v-if="!expanded" class="text-xs text-gray-500 font-mono truncate">{{ event.eventData.command }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 shrink-0"><span class="text-indigo-600 dark:text-indigo-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
        </div>
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <button
            v-if="hasSystemPrompt(event.eventData.metadata)"
            @click="emit('open-prompt', event.eventData.metadata!.systemPrompt as string)"
            class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            title="View system prompt">
            <FileText class="w-4 h-4" />
          </button>
          <button
            v-if="hasFillerPrompt(event.eventData.metadata)"
            @click="emit('open-filler-prompt', event.eventData.metadata!.fillerPrompt as string)"
            class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            title="View filler prompt">
            <Wand2 class="w-4 h-4" />
          </button>
          <button
            v-if="hasRawResponse(event.eventData.metadata)"
            @click="emit('open-raw-response', event.eventData.metadata!.rawResponse as string)"
            class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            title="View raw response">
            <ScrollText class="w-4 h-4" />
          </button>
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
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Command:</span>
          <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-sm text-indigo-900 dark:bg-gray-900 dark:bg-opacity-60 dark:text-indigo-200">
            {{ event.eventData.command }}
          </div>
        </div>
        <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Parameters:</span>
          <div class="mt-1 space-y-1">
            <div v-for="(value, key) in event.eventData.parameters" :key="key"
              class="flex gap-2 text-xs rounded bg-gray-50 border border-gray-200 px-2 py-1.5 dark:bg-gray-900/40 dark:border-gray-700">
              <span class="font-mono font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">{{ key }}</span>
              <span class="text-gray-500 dark:text-gray-400">:</span>
              <span class="font-mono text-gray-800 dark:text-gray-300 break-all">{{ value }}</span>
            </div>
          </div>
        </div>
        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
          <details class="group">
            <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
              Metadata ({{ Object.keys(event.eventData.metadata).length }})
            </summary>
            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
              <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
