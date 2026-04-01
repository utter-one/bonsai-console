<script setup lang="ts">
import {
  MessageSquare,
  FileText,
  Wand2,
  ScrollText,
  Braces,
  Bug,
  Eye,
  TriangleAlert,
} from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatMs, hasSystemPrompt, hasRawResponse, hasFillerPrompt, hasCurrentVariables, hasAssistantTiming, hasInputTruncation } from './eventHelpers'

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
</script>

<template>
  <div class="flex items-start p-2 gap-3">
    <MessageSquare class="w-5 h-5 mt-0.5"
      :class="event.eventData.role === 'user' ? 'text-blue-600' : 'text-green-600'" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="font-semibold"
            :class="event.eventData.role === 'user' ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'">
            {{ event.eventData.role === 'user' ? 'User' : 'Assistant' }}
          </span>
          <span class="text-xs text-gray-500">{{ event.timestamp }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="hasSystemPrompt(event.eventData.metadata)"
            @click="emit('open-prompt', event.eventData.metadata!.systemPrompt as string)"
            class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="View system prompt">
            <FileText class="w-4 h-4" />
          </button>
          <button
            v-if="hasFillerPrompt(event.eventData.metadata)"
            @click="emit('open-filler-prompt', event.eventData.metadata!.fillerPrompt as string)"
            class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="View filler prompt">
            <Wand2 class="w-4 h-4" />
          </button>
          <button
            v-if="hasRawResponse(event.eventData.metadata)"
            @click="emit('open-raw-response', event.eventData.metadata!.rawResponse as string)"
            class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="View raw response">
            <ScrollText class="w-4 h-4" />
          </button>
          <button
            v-if="hasCurrentVariables(event.eventData.metadata)"
            @click="emit('open-variables', event.eventData.metadata!.currentVariables as Record<string, any>)"
            class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="View stage variables">
            <Braces class="w-4 h-4" />
          </button>
          <button
            v-if="showBugReport"
            @click="emit('open-bug-report', event)"
            class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="Report bug">
            <Bug class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div class="text-gray-900 whitespace-pre-wrap dark:text-gray-100">{{ event.eventData.text }}</div>
      <div v-if="event.eventData.role === 'user' && (event.eventData.metadata?.processingDurationMs != null || event.eventData.metadata?.actionsDurationMs != null || event.eventData.metadata?.fillerDurationMs != null || event.eventData.metadata?.moderationDurationMs != null)"
        class="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-1.5 dark:border-blue-900">
        <span v-if="event.eventData.metadata?.moderationDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Moderation</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.moderationDurationMs) }}</span></span>
        <span v-if="event.eventData.metadata?.processingDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Processing</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.processingDurationMs) }}</span></span>
        <span v-if="event.eventData.metadata?.actionsDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Actions</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.actionsDurationMs) }}</span></span>
        <span v-if="event.eventData.metadata?.fillerDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Filler</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.fillerDurationMs) }}</span></span>
      </div>
      <div v-if="event.eventData.role === 'assistant' && hasInputTruncation(event.eventData.metadata)"
        class="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800 flex items-start gap-1.5">
        <TriangleAlert class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
        <span class="text-xs text-amber-700 dark:text-amber-300">
          Input context was truncated before this response.
          <template v-if="event.eventData.metadata?.llmUsage?.estimatedInputTokens != null && event.eventData.metadata?.llmUsage?.estimatedFinalInputTokens != null">
            {{ event.eventData.metadata.llmUsage.estimatedInputTokens.toLocaleString() }}
            &rarr;
            {{ event.eventData.metadata.llmUsage.estimatedFinalInputTokens.toLocaleString() }} tokens
            ({{ (event.eventData.metadata.llmUsage.estimatedInputTokens - event.eventData.metadata.llmUsage.estimatedFinalInputTokens).toLocaleString() }} removed)
          </template>
        </span>
      </div>
      <div v-if="event.eventData.role === 'assistant' && hasAssistantTiming(event.eventData.metadata)"
        class="mt-2 pt-2 border-t border-green-200 flex flex-wrap gap-1.5 dark:border-green-900">
        <span v-if="event.eventData.metadata?.totalTurnDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">Total</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.totalTurnDurationMs) }}</span></span>
        <span v-if="event.eventData.metadata?.llmDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">LLM</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.llmDurationMs) }}</span></span>
        <span v-if="event.eventData.metadata?.timeToFirstTokenMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstTokenMs) }}</span></span>
        <span v-if="event.eventData.metadata?.timeToFirstTokenFromTurnStartMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT (turn)</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstTokenFromTurnStartMs) }}</span></span>
        <span v-if="event.eventData.metadata?.timeToFirstAudioMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">First audio</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstAudioMs) }}</span></span>
      </div>
      <div v-if="event.eventData.originalText && event.eventData.originalText !== event.eventData.text"
        class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</span>
        <div class="text-sm text-gray-700 mt-1 whitespace-pre-wrap dark:text-gray-300">{{ event.eventData.originalText }}</div>
      </div>
      <div v-if="event.eventData.visibility" class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 flex items-center gap-1.5">
        <Eye class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
        <span class="text-xs text-gray-600 dark:text-gray-400">Visibility:</span>
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
      <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0"
        class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
        <details class="group">
          <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
            Message Metadata ({{ Object.keys(event.eventData.metadata).length }})
          </summary>
          <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
            <pre class="whitespace-pre-wrap wrap-break-word dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>
