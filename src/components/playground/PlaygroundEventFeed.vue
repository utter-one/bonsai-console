<template>
  <div
    class="flex-1 min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700">
    <div
      class="bg-gray-50 border-b border-gray-200 px-4 py-3 md:flex items-center justify-between dark:bg-gray-700/50 dark:border-gray-700">
      <span class="text-md font-semibold text-gray-700 dark:text-gray-200">Conversation History</span>
      <div class="flex items-center md:gap-4 mt-2 md:mt-0">
        <label class="flex items-center  md:gap-2 text-xs text-gray-600 cursor-pointer dark:text-gray-400">
          <input type="checkbox" v-model="showConversationEventsModel" class="form-checkbox" />
          <span>Show conversation events</span>
        </label>
      </div>
    </div>
    <div ref="historyContainer" class="flex-1 overflow-y-auto p-4">
      <div v-if="props.events.length === 0"
        class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <div class="text-center">
          <p class="text-lg font-medium">No active conversation</p>
          <p class="text-sm mt-1">Start a conversation to see events appear here</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div v-for="(event, index) in filteredEvents" :key="index">
          <!-- Regular User/AI/System/Error events -->
          <div v-if="event.type !== 'ConversationEvent'" class="p-3 rounded-lg border" :class="{
            'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800': event.type === 'User',
            'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': event.type === 'AI',
            'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 ml-8': event.type === 'System',
            'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': event.type === 'Error'
          }">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="{
                'bg-blue-500 text-white': event.type === 'User',
                'bg-green-500 text-white': event.type === 'AI',
                'bg-gray-500 text-white': event.type === 'System',
                'bg-red-500 text-white': event.type === 'Error'
              }">
                <User v-if="event.type === 'User'" :size="16" />
                <Bot v-else-if="event.type === 'AI'" :size="16" />
                <AlertCircle v-else-if="event.type === 'Error'" :size="16" />
                <Info v-else :size="16" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-sm">{{ event.type }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasSystemPrompt(event.wsEvent.eventData.metadata)"
                      @click="openPromptPreview(event.wsEvent.eventData.metadata!.systemPrompt as string)"
                      class="btn-icon p-1"
                      :class="{
                        'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                        'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                      }"
                      title="View system prompt">
                      <FileText class="w-4 h-4" />
                    </button>
                    <button
                      v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasFillerPrompt(event.wsEvent.eventData.metadata)"
                      @click="openFillerPromptPreview(event.wsEvent.eventData.metadata!.fillerPrompt as string)"
                      class="btn-icon p-1"
                      :class="{
                        'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                        'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                      }"
                      title="View filler prompt">
                      <Wand2 class="w-4 h-4" />
                    </button>
                    <button
                      v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasCurrentVariables(event.wsEvent.eventData.metadata)"
                      @click="openVariablesPreview(event.wsEvent.eventData.metadata!.currentVariables as Record<string, any>)"
                      class="btn-icon p-1"
                      :class="{
                        'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                        'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                      }"
                      title="View stage variables">
                      <Braces class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleOpenBugReport(event)"
                      class="btn-icon p-1"
                      :class="{
                        'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                        'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI',
                        'hover:bg-gray-100 dark:hover:bg-gray-900/30': event.type === 'System',
                        'hover:bg-red-100 dark:hover:bg-red-900/30': event.type === 'Error'
                      }"
                      title="Report bug">
                      <Bug class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div class="text-sm">
                  <!-- Voice message with audio player -->
                  <template v-if="event.voiceOutputId">
                    <AudioPlayer v-if="props.getVoiceOutput(event.voiceOutputId)"
                      :state="props.getVoiceOutput(event.voiceOutputId)!.player.state"
                      :is-ready="props.getVoiceOutput(event.voiceOutputId)!.player.isReady"
                      :progress="props.getVoiceOutput(event.voiceOutputId)!.player.progress"
                      :transcript="props.getVoiceOutput(event.voiceOutputId)!.transcript || event.message || undefined"
                      @play="props.getVoiceOutput(event.voiceOutputId)!.player.play()"
                      @pause="props.getVoiceOutput(event.voiceOutputId)!.player.pause()"
                      @stop="props.getVoiceOutput(event.voiceOutputId)!.player.stop()"
                      @volume-change="(v: number) => { if (event.voiceOutputId) props.getVoiceOutput(event.voiceOutputId)?.player.setVolume(v) }" />
                    <!-- Show real-time text below audio player if transcription is in progress -->
                    <div v-if="event.isRealTime && event.message" class="mt-2 text-sm text-gray-700">
                      <span class="prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(event.message)" />
                      <span class="inline-block ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                        title="Real-time transcription in progress"></span>
                    </div>
                  </template>

                  <!-- Regular text message -->
                  <template v-else>
                    <div class="relative">
                      <div v-if="event.message" class="prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(event.message)" />
                      <!-- Real-time indicator -->
                      <span v-if="event.isRealTime"
                        class="inline-block ml-1 w-2 h-2 bg-current rounded-full animate-pulse" :class="{
                          'text-blue-500': event.type === 'User',
                          'text-green-500': event.type === 'AI'
                        }" title="Real-time transcription in progress"></span>
                    </div>
                    <div v-if="event.details" class="mt-2 text-xs text-gray-600 font-mono dark:text-gray-400">
                      {{ event.details }}
                    </div>
                  </template>
                </div>
                <div v-if="event.type === 'User' && event.wsEvent?.eventData?.metadata && (event.wsEvent.eventData.metadata.moderationDurationMs != null || event.wsEvent.eventData.metadata.processingDurationMs != null || event.wsEvent.eventData.metadata.actionsDurationMs != null || event.wsEvent.eventData.metadata.fillerDurationMs != null)"
                  class="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-1.5 dark:border-blue-900">
                  <span v-if="event.wsEvent.eventData.metadata.moderationDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Moderation</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.moderationDurationMs) }}</span></span>
                  <span v-if="event.wsEvent.eventData.metadata.processingDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Processing</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.processingDurationMs) }}</span></span>
                  <span v-if="event.wsEvent.eventData.metadata.actionsDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Actions</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.actionsDurationMs) }}</span></span>
                  <span v-if="event.wsEvent.eventData.metadata.fillerDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Filler</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.fillerDurationMs) }}</span></span>
                </div>
                <div v-if="event.type === 'AI' && hasAssistantTiming(event.wsEvent?.eventData?.metadata)"
                  class="mt-2 pt-2 border-t border-green-200 flex flex-wrap gap-1.5 dark:border-green-900">
                  <span v-if="event.wsEvent?.eventData?.metadata?.totalTurnDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">Total</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.totalTurnDurationMs) }}</span></span>
                  <span v-if="event.wsEvent?.eventData?.metadata?.llmDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">LLM</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.llmDurationMs) }}</span></span>
                  <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstTokenMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstTokenMs) }}</span></span>
                  <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstTokenFromTurnStartMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT (turn)</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstTokenFromTurnStartMs) }}</span></span>
                  <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstAudioMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">First audio</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstAudioMs) }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversation Events (styled like ConversationDetailView) -->
          <ConversationEventCard
            v-else-if="event.wsEvent"
            :event="toNormalizedWsEvent(event, index)"
            :show-bug-report="false"
            :entity-names="props.entityNames"
            @open-prompt="openPromptPreview"
            @open-filler-prompt="openFillerPromptPreview"
            @open-raw-response="openRawResponsePreview"
            @open-variables="openVariablesPreview"
          />
        </div>
      </div>
    </div>
  </div>

  <PromptPreviewModal
    v-if="showPromptPreviewModal"
    :prompt="selectedPrompt"
    @close="showPromptPreviewModal = false" />

  <PromptPreviewModal
    v-if="showFillerPromptPreviewModal"
    :prompt="selectedFillerPrompt"
    title="Filler Prompt"
    @close="showFillerPromptPreviewModal = false" />

  <PromptPreviewModal
    v-if="showRawResponsePreviewModal"
    :prompt="selectedRawResponse"
    title="Raw Response"
    @close="showRawResponsePreviewModal = false" />

  <VariablesPreviewModal
    v-if="showVariablesPreviewModal"
    :variables="selectedVariables"
    @close="showVariablesPreviewModal = false" />

  <IssueEditModal
    v-if="showBugReportModal"
    :issue="null"
    :error="bugReportError"
    :prefill-data="bugReportPrefillData"
    @close="closeBugReportModal"
    @save="handleBugReportSave" />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { User, Bot, AlertCircle, Info, FileText, Wand2, Braces, Bug } from 'lucide-vue-next'
import AudioPlayer from '@/components/AudioPlayer.vue'
import PromptPreviewModal from '@/components/modals/PromptPreviewModal.vue'
import VariablesPreviewModal from '@/components/modals/VariablesPreviewModal.vue'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'
import ConversationEventCard from '@/components/ConversationEventCard.vue'
import { useConversationPreviews } from '@/composables'
import type { ConversationEvent as WSConversationEvent, ConversationEventUpdate as WSConversationEventUpdate } from '@/api/websocket/websocket-contracts'
import type { NormalizedEvent } from '@/components/events/eventHelpers'

function renderMarkdown(content: string): string {
  const raw = marked.parse(content) as string
  return DOMPurify.sanitize(raw)
}

interface PlaygroundConversationEvent {
  type: 'User' | 'AI' | 'System' | 'Error' | 'ConversationEvent'
  message: string
  timestamp: Date
  details?: string
  voiceOutputId?: string
  inputTurnId?: string
  outputTurnId?: string
  isRealTime?: boolean
  transcriptChunks?: Array<{ chunkId: string; text: string; isFinal: boolean }>
  wsEvent?: WSConversationEvent | WSConversationEventUpdate
}

interface VoiceOutput {
  player: {
    state: any
    isReady: boolean
    progress: number
    play: () => void
    pause: () => void
    stop: () => void
    setVolume: (v: number) => void
  }
  transcript: string | null
}

const props = defineProps<{
  events: PlaygroundConversationEvent[]
  entityNames: { stages: Record<string, string>; classifiers: Record<string, string>; transformers: Record<string, string> }
  projectId: string
  sessionId?: string
  stageId?: string
  showConversationEvents: boolean
  showSystemEvents: boolean
  getVoiceOutput: (id: string) => VoiceOutput | undefined
}>()

const emit = defineEmits<{
  'update:showConversationEvents': [value: boolean]
}>()

const historyContainer = ref<HTMLElement | null>(null)

const showConversationEventsModel = computed({
  get: () => props.showConversationEvents,
  set: (v) => emit('update:showConversationEvents', v),
})

const filteredEvents = computed(() => {
  let result = props.events
  if (!props.showSystemEvents) {
    result = result.filter(e => e.type !== 'System')
  }
  if (!props.showConversationEvents) {
    result = result.filter(e => e.type !== 'ConversationEvent')
  }
  return result
})

const {
  showPromptPreviewModal, selectedPrompt,
  showFillerPromptPreviewModal, selectedFillerPrompt,
  showRawResponsePreviewModal, selectedRawResponse,
  showVariablesPreviewModal, selectedVariables,
  showBugReportModal, bugReportPrefillData, bugReportError,
  openPromptPreview, openFillerPromptPreview, openRawResponsePreview,
  openVariablesPreview, openBugReport, closeBugReportModal, handleBugReportSave,
} = useConversationPreviews()

function handleOpenBugReport(event: PlaygroundConversationEvent) {
  const eventIndex = props.events.filter(e => e.type !== 'System').indexOf(event)
  openBugReport({
    projectId: props.projectId,
    sessionId: props.sessionId,
    eventIndex: eventIndex >= 0 ? eventIndex : undefined,
    stageId: props.stageId,
  })
}

function scrollHistoryToBottom() {
  const el = historyContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

watch(() => props.events, () => {
  nextTick(() => {
    scrollHistoryToBottom()
    requestAnimationFrame(() => scrollHistoryToBottom())
  })
}, { deep: true })

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatMs(ms: any): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function isMessageEvent(event: WSConversationEvent | WSConversationEventUpdate): event is (WSConversationEvent | WSConversationEventUpdate) & {
  eventType: 'message'
  eventData: { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'message'
}

function hasSystemPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.systemPrompt && typeof metadata.systemPrompt === 'string')
}

function hasFillerPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.fillerPrompt && typeof metadata.fillerPrompt === 'string')
}

function hasCurrentVariables(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.currentVariables && typeof metadata.currentVariables === 'object')
}

function hasAssistantTiming(metadata: Record<string, any> | undefined): boolean {
  if (!metadata) return false
  return ['llmDurationMs', 'timeToFirstTokenMs', 'timeToFirstTokenFromTurnStartMs', 'timeToFirstAudioMs', 'totalTurnDurationMs']
    .some(key => metadata[key] != null)
}

function toNormalizedWsEvent(event: PlaygroundConversationEvent, index: number): NormalizedEvent {
  const wsEvent = event.wsEvent!
  return {
    id: String(index),
    eventType: wsEvent.eventType as NormalizedEvent['eventType'],
    eventData: wsEvent.eventData,
    timestamp: formatTime(event.timestamp),
  }
}
</script>
