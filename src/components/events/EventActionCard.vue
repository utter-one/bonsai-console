<script setup lang="ts">
import { ref } from 'vue'
import {
  Zap,
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
import ContentViewer from '@/components/ContentViewer.vue'

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
    <Zap class="w-5 h-5 mt-0.5 text-purple-600 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
        <div class="flex items-center gap-2 min-w-0">
          <button @click="expanded = !expanded" class="font-semibold text-purple-900 dark:text-purple-100 shrink-0 text-left">Action</button>
          <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ event.eventData.actionName }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"><span class="text-purple-600 dark:text-purple-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
        </div>
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <button
            v-if="hasSystemPrompt(event.eventData.metadata)"
            @click="emit('open-prompt', event.eventData.metadata!.systemPrompt as string)"
            class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            title="View system prompt">
            <FileText class="w-4 h-4" />
          </button>
          <button
            v-if="hasFillerPrompt(event.eventData.metadata)"
            @click="emit('open-filler-prompt', event.eventData.metadata!.fillerPrompt as string)"
            class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            title="View filler prompt">
            <Wand2 class="w-4 h-4" />
          </button>
          <button
            v-if="hasRawResponse(event.eventData.metadata)"
            @click="emit('open-raw-response', event.eventData.metadata!.rawResponse as string)"
            class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            title="View raw response">
            <ScrollText class="w-4 h-4" />
          </button>
          <button
            v-if="hasCurrentVariables(event.eventData.metadata)"
            @click="emit('open-variables', event.eventData.metadata!.currentVariables as Record<string, any>)"
            class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            title="View stage variables">
            <Braces class="w-4 h-4" />
          </button>
          <button
            v-if="showBugReport"
            @click="emit('open-bug-report', event)"
            class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            title="Report bug">
            <Bug class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Action:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.actionName }}</div>
        </div>
        <div v-if="event.eventData.stageId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
        </div>
        <div v-if="event.eventData.effects && event.eventData.effects.length > 0">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Effects ({{ event.eventData.effects.length }}):</span>
          <div class="mt-1 space-y-1">
            <div v-for="(effect, i) in event.eventData.effects" :key="i"
              class="text-xs rounded bg-gray-50 border border-gray-200 px-2 py-1.5 font-mono dark:bg-gray-900/40 dark:border-gray-700">
              <span class="font-semibold text-purple-700 dark:text-purple-400">{{ effect.field }}</span>
              <span class="text-gray-500 dark:text-gray-400"> = </span>
              <span class="text-gray-800 dark:text-gray-300">{{ effect.value }}</span>
            </div>
          </div>
        </div>
        <div v-if="event.eventData.result != null">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Result:</span>
          <ContentViewer
            v-if="Array.isArray(event.eventData.result)"
            :content="event.eventData.result"
            class="mt-1" />
          <div v-else class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
            <pre class="whitespace-pre-wrap break-words">{{ typeof event.eventData.result === 'string' ? event.eventData.result : JSON.stringify(event.eventData.result, null, 2) }}</pre>
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
