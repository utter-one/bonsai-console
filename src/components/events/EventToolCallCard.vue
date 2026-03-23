<script setup lang="ts">
import { ref } from 'vue'
import {
  Wrench,
  Globe,
  Code,
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  Wand2,
  ScrollText,
  Braces,
  Bug,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatMs, getToolTypeLabel, hasSystemPrompt, hasRawResponse, hasFillerPrompt, hasCurrentVariables } from './eventHelpers'
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

const toolTypeIcon = {
  webhook: Globe,
  script: Code,
  smart_function: Sparkles,
}
</script>

<template>
  <div class="flex items-start gap-2">
    <button @click.stop="expanded = !expanded" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <Wrench class="w-5 h-5 mt-0.5 text-pink-600 shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
        <div class="flex items-center gap-2 min-w-0">
          <button @click="expanded = !expanded" class="font-semibold text-pink-900 dark:text-pink-100 shrink-0 text-left">Tool Call</button>
          <span v-if="event.eventData.toolType"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shrink-0 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
            <component :is="toolTypeIcon[event.eventData.toolType as keyof typeof toolTypeIcon] ?? Wrench" class="w-3 h-3" />
            {{ getToolTypeLabel(event.eventData.toolType) }}
          </span>
          <span v-if="event.eventData.success === true"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shrink-0 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            <CheckCircle class="w-3 h-3" />success
          </span>
          <span v-else-if="event.eventData.success === false"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 shrink-0 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
            <XCircle class="w-3 h-3" />failed
          </span>
          <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ event.eventData.toolName }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-pink-50 border border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 shrink-0"><span class="text-pink-600 dark:text-pink-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
        </div>
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <button
            v-if="hasSystemPrompt(event.eventData.metadata)"
            @click="emit('open-prompt', event.eventData.metadata!.systemPrompt as string)"
            class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
            title="View system prompt">
            <FileText class="w-4 h-4" />
          </button>
          <button
            v-if="hasFillerPrompt(event.eventData.metadata)"
            @click="emit('open-filler-prompt', event.eventData.metadata!.fillerPrompt as string)"
            class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
            title="View filler prompt">
            <Wand2 class="w-4 h-4" />
          </button>
          <button
            v-if="hasRawResponse(event.eventData.metadata)"
            @click="emit('open-raw-response', event.eventData.metadata!.rawResponse as string)"
            class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
            title="View raw response">
            <ScrollText class="w-4 h-4" />
          </button>
          <button
            v-if="hasCurrentVariables(event.eventData.metadata)"
            @click="emit('open-variables', event.eventData.metadata!.currentVariables as Record<string, any>)"
            class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
            title="View stage variables">
            <Braces class="w-4 h-4" />
          </button>
          <button
            v-if="showBugReport"
            @click="emit('open-bug-report', event)"
            class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
            title="Report bug">
            <Bug class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-show="expanded" class="space-y-2">
        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toolName }}</div>
        </div>
        <div v-if="event.eventData.toolId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool ID:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toolId }}</div>
        </div>
        <div v-if="event.eventData.stageId">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
        </div>
        <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Parameters:</span>
          <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
            <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
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
        <div v-if="event.eventData.error">
          <span class="text-xs font-medium text-red-600 dark:text-red-400">Error:</span>
          <div class="mt-1 bg-red-50 border border-red-200 rounded p-2 font-mono text-xs text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {{ event.eventData.error }}
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
