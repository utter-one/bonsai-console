<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeftRight,
  GitBranch,
  Zap,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  Wrench,
  Globe,
  Code,
  Sparkles,
  FileText,
  ScrollText,
  Wand2,
  Braces,
  Bug,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  Eye,
} from 'lucide-vue-next'
import ContentViewer from '@/components/ContentViewer.vue'

/**
 * Normalized event interface that abstracts over both ConversationEventResponse
 * (from the REST API) and WSConversationEvent (from WebSocket).
 */
export interface NormalizedEvent {
  /** Unique identifier used for expand/collapse tracking */
  id: string
  /** The event type discriminator */
  eventType:
    | 'message'
    | 'classification'
    | 'transformation'
    | 'action'
    | 'command'
    | 'tool_call'
    | 'conversation_start'
    | 'conversation_resume'
    | 'conversation_end'
    | 'conversation_aborted'
    | 'conversation_failed'
    | 'jump_to_stage'
    | 'moderation'
  /** Event payload (same union shape from the API) */
  eventData: any
  /** Formatted timestamp string to display */
  timestamp: string
}

const props = defineProps<{
  event: NormalizedEvent
  /** Whether to show the bug report button on events */
  showBugReport?: boolean
  /** Whether to highlight this event (e.g. when navigating from an issue report) */
  highlighted?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-prompt', prompt: string): void
  (e: 'open-filler-prompt', prompt: string): void
  (e: 'open-raw-response', rawResponse: string): void
  (e: 'open-variables', variables: Record<string, any>): void
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const expanded = ref(false)
const hasHovered = ref(false)

function toggle() {
  expanded.value = !expanded.value
}

function onHighlightMouseEnter() {
  if (props.highlighted && !hasHovered.value) {
    hasHovered.value = true
  }
}

// Type guards
function isMessageEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'message'
}

const TOP_LEVEL_EVENT_TYPES = new Set([
  'message',
  'command',
  'conversation_start',
  'conversation_resume',
  'conversation_end',
  'conversation_aborted',
  'conversation_failed',
])

function isTopLevelEvent(event: NormalizedEvent): boolean {
  return TOP_LEVEL_EVENT_TYPES.has(event.eventType)
}

function isClassificationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'classification'
}

function isTransformationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'transformation'
}

function isActionEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'action'
}

function isCommandEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'command'
}

function isToolCallEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'tool_call'
}

function isConversationStartEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_start'
}

function isConversationResumeEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_resume'
}

function isConversationEndEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_end'
}

function isConversationAbortedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_aborted'
}

function isConversationFailedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_failed'
}

function isJumpToStageEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'jump_to_stage'
}

function isModerationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'moderation'
}

function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'message':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
    case 'classification':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
    case 'transformation':
      return 'bg-violet-50 border-violet-200 dark:bg-violet-900/10 dark:border-violet-800'
    case 'action':
      return 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
    case 'command':
      return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800'
    case 'tool_call':
      return 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-800'
    case 'conversation_start':
      return 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
    case 'conversation_resume':
      return 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-800'
    case 'conversation_end':
      return 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
    case 'conversation_aborted':
      return 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
    case 'conversation_failed':
      return 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
    case 'jump_to_stage':
      return 'bg-teal-50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800'
    case 'moderation':
      return 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
    // Note: color is overridden inline in the template based on blocking state
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  }
}

function getEventSummary(event: NormalizedEvent): string {
  const data = event.eventData as any
  switch (event.eventType) {
    case 'classification':
      return `${data.classifierId} · ${data.actions?.length ?? 0} action(s) matched`
    case 'transformation':
      return `${data.transformerId} · ${data.appliedFields?.length ?? 0} field(s) applied`
    case 'action':
      return data.actionName
    case 'command':
      return data.command
    case 'tool_call':
      return `${data.toolName} · ${data.success ? 'success' : 'failed'}${
        data.toolType ? ' · ' + getToolTypeLabel(data.toolType) : ''
      }`
    case 'conversation_start':
      return `stage: ${data.stageId}`
    case 'conversation_resume':
      return `${data.previousStatus} → stage: ${data.stageId}`
    case 'conversation_end':
      return data.reason ? data.reason : `stage: ${data.stageId}`
    case 'conversation_aborted':
      return data.reason
    case 'conversation_failed':
      return data.reason
    case 'jump_to_stage':
      return `${data.fromStageId} → ${data.toStageId}`
    case 'moderation': {
      const blocking: string[] = data.blockingCategories ?? []
      const detected: string[] = data.detectedCategories ?? []
      if (blocking.length > 0) return `Blocked · ${blocking.join(', ')}`
      if (detected.length > 0) return `Detected · ${detected.join(', ')}`
      return 'Passed'
    }
    default:
      return ''
  }
}

function getToolTypeLabel(toolType: string | undefined): string {
  switch (toolType) {
    case 'smart_function': return 'Smart Function'
    case 'webhook': return 'Webhook'
    case 'script': return 'Script'
    default: return 'Tool'
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function hasSystemPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.systemPrompt && typeof metadata.systemPrompt === 'string')
}

function hasRawResponse(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.rawResponse && typeof metadata.rawResponse === 'string')
}

function hasFillerPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.fillerPrompt && typeof metadata.fillerPrompt === 'string')
}

function hasCurrentVariables(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.currentVariables && typeof metadata.currentVariables === 'object')
}

function formatMs(ms: number | null | undefined): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function hasAssistantTiming(metadata: Record<string, any> | undefined): boolean {
  if (!metadata) return false
  return ['llmDurationMs', 'timeToFirstTokenMs', 'timeToFirstTokenFromTurnStartMs', 'timeToFirstAudioMs', 'totalTurnDurationMs']
    .some(key => metadata[key] != null)
}

function onOpenPrompt(prompt: string) {
  emit('open-prompt', prompt)
}

function onOpenFillerPrompt(prompt: string) {
  emit('open-filler-prompt', prompt)
}

function onOpenRawResponse(rawResponse: string) {
  emit('open-raw-response', rawResponse)
}

function onOpenVariables(variables: Record<string, any>) {
  emit('open-variables', variables)
}

function onBugReport() {
  emit('open-bug-report', props.event)
}
</script>

<template>
  <div
    class="border rounded-lg p-1 shadow-sm transition-shadow hover:shadow-md"
    :class="[
      getEventTypeColor(event.eventType),
      { 'ml-8': !isTopLevelEvent(event) },
      { 'highlight-pulse': highlighted && !hasHovered },
      { 'highlight-finish': highlighted && hasHovered }
    ]"
    @mouseenter="onHighlightMouseEnter"
  >
    <!-- Message Event -->
    <div v-if="isMessageEvent(event)">
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
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
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
            <Eye class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
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
                <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Classification Event -->
    <div v-else-if="isClassificationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <GitBranch class="w-5 h-5 mt-0.5 text-yellow-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-yellow-900 dark:text-yellow-100 shrink-0 text-left">Classification</button>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 shrink-0"><span class="text-yellow-600 dark:text-yellow-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Classifier:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.classifierId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.actions && event.eventData.actions.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Matched Actions:</span>
              <div class="mt-1 space-y-2">
                <div v-for="(actionGroup, idx) in event.eventData.actions" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-2.5 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-xs font-medium text-gray-700 mb-1.5">
                    {{ actionGroup.classifierName }}
                  </div>
                  <div v-if="actionGroup.classifierId" class="text-[10px] text-gray-500 font-mono mb-2">{{ actionGroup.classifierId }}</div>
                  <div class="space-y-2.5">
                    <div v-for="(action, aidx) in actionGroup.actions" :key="aidx"
                      class="pl-2.5 border-l-2 border-yellow-300">
                      <div class="text-sm font-semibold text-gray-900 mb-1.5 dark:text-white">{{ action.name }}</div>
                      <div v-if="action.parameters && Object.keys(action.parameters).length > 0"
                        class="space-y-1">
                        <div v-for="(value, key) in action.parameters" :key="key"
                          class="md:flex items-start gap-2 text-xs">
                          <span class="text-gray-600 font-medium min-w-[80px] shrink-0 dark:text-gray-400">{{ key }}:</span>
                          <span class="text-gray-900 break-words dark:text-gray-200">{{ 
                            typeof value === 'object' ? JSON.stringify(value) : String(value) 
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
    </div>

    <!-- Transformation Event -->
    <div v-else-if="isTransformationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <ArrowLeftRight class="w-5 h-5 mt-0.5 text-violet-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-violet-900 dark:text-violet-100 shrink-0 text-left">Transformation</button>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 shrink-0"><span class="text-violet-600 dark:text-violet-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Transformer:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.transformerId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.appliedFields && event.eventData.appliedFields.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Applied Fields ({{ event.eventData.appliedFields.length }}):</span>
              <div class="mt-1 flex flex-wrap gap-1.5">
                <span v-for="field in event.eventData.appliedFields" :key="field"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  {{ field }}
                </span>
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
    </div>

    <!-- Action Event -->
    <div v-else-if="isActionEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Zap class="w-5 h-5 mt-0.5 text-purple-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-purple-900 dark:text-purple-100 shrink-0 text-left">Action</button>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="event.eventData.result != null"
                @click="onOpenRawResponse(JSON.stringify(event.eventData.result, null, 2))"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View result">
                <Layers class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Action Name:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.actionName }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.effects && event.eventData.effects.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Effects ({{ event.eventData.effects.length }}):</span>
              <div class="mt-1 space-y-2">
                <div v-for="(effect, idx) in event.eventData.effects" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-2.5 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-sm font-semibold text-purple-900 mb-2 dark:text-purple-100">
                    {{ effect.type || 'Effect' }} {{ (idx as number) + 1 }}
                  </div>
                  <div class="space-y-1">
                    <div v-for="(value, key) in effect" :key="key"
                      class="md:flex items-start gap-2 text-xs">
                      <span class="text-gray-600 font-medium min-w-[100px] shrink-0 dark:text-gray-400">{{ key }}: </span>
                      <span class="text-gray-900 break-words font-mono dark:text-gray-200">{{
                        typeof value === 'object' ? JSON.stringify(value) : String(value)
                      }}</span>
                    </div>
                  </div>
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
    </div>

    <!-- Command Event -->
    <div v-else-if="isCommandEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Terminal class="w-5 h-5 mt-0.5 text-indigo-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-indigo-900 dark:text-indigo-100 shrink-0 text-left">Command</button>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Command:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.command }}</div>
            </div>
            <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Parameters ({{ Object.keys(event.eventData.parameters).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                </div>
              </details>
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
    </div>

    <!-- Tool Call Event -->
    <div v-else-if="isToolCallEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Wrench class="w-5 h-5 mt-0.5 text-pink-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-pink-900 dark:text-pink-100 shrink-0 text-left">Tool Call</button>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                :class="event.eventData.toolType === 'webhook'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                  : event.eventData.toolType === 'script'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'"
              >
                <Globe v-if="event.eventData.toolType === 'webhook'" class="w-3 h-3" />
                <Code v-else-if="event.eventData.toolType === 'script'" class="w-3 h-3" />
                <Sparkles v-else class="w-3 h-3" />
                {{ getToolTypeLabel(event.eventData.toolType) }}
              </span>
              <span v-if="event.eventData.success" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
                <CheckCircle class="w-3 h-3" />
                Success
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shrink-0">
                <XCircle class="w-3 h-3" />
                Failed
              </span>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-pink-50 border border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 shrink-0"><span class="text-pink-600 dark:text-pink-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="event.eventData.result != null"
                @click="onOpenRawResponse(JSON.stringify(event.eventData.result, null, 2))"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View result">
                <Layers class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool Name:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.toolName }}</div>
            </div>
            <div v-if="event.eventData.toolId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toolId }}</div>
            </div>
            <div v-if="event.eventData.toolType">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Type:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ getToolTypeLabel(event.eventData.toolType) }}</div>
            </div>
            <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Parameters ({{ Object.keys(event.eventData.parameters).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.success && event.eventData.result != null && Array.isArray(event.eventData.result) && event.eventData.result.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Result ({{ event.eventData.result.length }} item{{ event.eventData.result.length !== 1 ? 's' : '' }}):</span>
              <div class="mt-2 space-y-3">
                <div v-for="(content, idx) in event.eventData.result" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-3 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-xs font-medium text-gray-500 mb-2 uppercase dark:text-gray-400">{{ content.contentType }}</div>
                  <ContentViewer :content="content" />
                </div>
              </div>
            </div>
            <div v-if="!event.eventData.success && event.eventData.error">
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
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Start Event -->
    <div v-else-if="isConversationStartEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Play class="w-5 h-5 mt-0.5 text-green-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-green-900 dark:text-green-100 shrink-0 text-left">Conversation Started</button>
              <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Initial Stage:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.initialVariables && Object.keys(event.eventData.initialVariables).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Initial Variables ({{ Object.keys(event.eventData.initialVariables).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.initialVariables, null, 2) }}</pre>
                </div>
              </details>
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
    </div>

    <!-- Conversation Resume Event -->
    <div v-else-if="isConversationResumeEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <RotateCcw class="w-5 h-5 mt-0.5 text-cyan-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-cyan-900 dark:text-cyan-100 shrink-0 text-left">Conversation Resumed</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Previous Status:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.previousStatus }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
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
    </div>

    <!-- Conversation End Event -->
    <div v-else-if="isConversationEndEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <CheckCircle class="w-5 h-5 mt-0.5 text-gray-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-gray-900 dark:text-white shrink-0 text-left">Conversation Ended</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div v-if="event.eventData.reason">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
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
    </div>

    <!-- Conversation Aborted Event -->
    <div v-else-if="isConversationAbortedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <XCircle class="w-5 h-5 mt-0.5 text-orange-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-orange-900 dark:text-orange-100 shrink-0 text-left">Conversation Aborted</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
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
    </div>

    <!-- Conversation Failed Event -->
    <div v-else-if="isConversationFailedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <AlertCircle class="w-5 h-5 mt-0.5 text-red-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-red-900 dark:text-red-100 shrink-0 text-left">Conversation Failed</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Error:</span>
              <div class="text-sm text-red-900 font-mono bg-red-100 bg-opacity-50 rounded p-2 mt-1 dark:bg-red-900/40 dark:text-red-100">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
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
    </div>

    <!-- Jump to Stage Event -->
    <div v-else-if="isJumpToStageEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Layers class="w-5 h-5 mt-0.5 text-teal-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-teal-900 dark:text-teal-100 shrink-0 text-left">Stage Transition</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">From:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.fromStageId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">To:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toStageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Moderation Event -->
    <div v-else-if="isModerationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <ShieldAlert
          class="w-5 h-5 mt-0.5 shrink-0"
          :class="event.eventData.blockingCategories?.length > 0
            ? 'text-red-600'
            : event.eventData.detectedCategories?.length > 0
              ? 'text-amber-500'
              : 'text-green-600'"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button
              @click="toggle()"
              class="font-semibold shrink-0 text-left"
              :class="event.eventData.blockingCategories?.length > 0
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'"
            >Moderation</button>
            <span
              class="text-xs font-medium px-1.5 py-0.5 rounded shrink-0"
              :class="event.eventData.blockingCategories?.length > 0
                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                : event.eventData.detectedCategories?.length > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'"
            >
              {{ event.eventData.blockingCategories?.length > 0 ? 'Blocked' : event.eventData.detectedCategories?.length > 0 ? 'Detected' : 'Passed' }}
            </span>
            <span v-if="!expanded && event.eventData.blockingCategories?.length > 0" class="text-xs text-gray-500 truncate">{{ event.eventData.blockingCategories.join(', ') }}</span>
            <span v-else-if="!expanded && event.eventData.detectedCategories?.length > 0" class="text-xs text-gray-500 truncate">{{ event.eventData.detectedCategories.join(', ') }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200 bg-white bg-opacity-60 rounded p-2 mt-1 dark:bg-gray-900 dark:bg-opacity-60">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.blockingCategories?.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Blocking categories:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="category in event.eventData.blockingCategories"
                  :key="category"
                  class="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                >
                  {{ category }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.detectedCategories?.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Detected categories:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="category in event.eventData.detectedCategories"
                  :key="category"
                  class="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                >
                  {{ category }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.durationMs != null">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Duration:</span>
              <span class="text-sm text-gray-900 dark:text-gray-200 ml-1">{{ event.eventData.durationMs }}ms</span>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generic Event (Fallback) -->
    <div v-else>
      <div class="flex items-center gap-2" :class="{ 'mb-3': expanded }">
        <button @click.stop="toggle()" class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <button @click="toggle()" class="font-semibold text-gray-900 dark:text-white shrink-0 text-left">
            {{ formatEventType(event.eventType) }}
          </button>
          <span v-if="!expanded" class="text-xs text-gray-500 font-mono truncate">{{ event.id }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
        </div>
      </div>
      <div v-if="expanded && Object.keys(event.eventData).length > 0" class="mt-3">
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none dark:text-gray-300 dark:hover:text-gray-100">
            Event Data
            <span class="text-xs text-gray-500 ml-1">(click to expand)</span>
          </summary>
          <div class="mt-2 bg-white bg-opacity-60 rounded p-3 font-mono text-xs overflow-x-auto">
            <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData, null, 2) }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details summary::marker {
  display: none;
}

details[open] summary {
  margin-bottom: 0.5rem;
}

@keyframes highlight-infinite {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.08);
    outline: 2px solid rgba(59, 130, 246, 0.15);
    outline-offset: 4px;
  }
}

@keyframes highlight-finish {
  0%, 60% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
}

.highlight-pulse {
  animation: highlight-infinite 1.5s ease-in-out infinite;
}

.highlight-finish {
  animation: highlight-finish 5s ease-out forwards;
}
</style>
