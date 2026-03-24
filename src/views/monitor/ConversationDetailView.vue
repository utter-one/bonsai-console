<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConversationsStore, useProjectSelectionStore, useApiKeysStore, useIssuesStore, useAnalyticsStore } from '@/stores'
import { ArrowLeft, Play } from 'lucide-vue-next'
import type { ConversationResponse, ConversationEventResponse, CreateIssueRequest, UpdateIssueRequest } from '@/api/types'
import type { ConversationTimelineTurn } from '@/api/generated/data-contracts'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PromptPreviewModal from '@/components/modals/PromptPreviewModal.vue'
import VariablesPreviewModal from '@/components/modals/VariablesPreviewModal.vue'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'
import ConversationEventCard, { type NormalizedEvent } from '@/components/ConversationEventCard.vue'


const route = useRoute()
const router = useRouter()
const conversationsStore = useConversationsStore()
const projectSelectionStore = useProjectSelectionStore()
const apiKeysStore = useApiKeysStore()
const issuesStore = useIssuesStore()
const analyticsStore = useAnalyticsStore()

const conversationId = computed(() => route.params.conversationId as string)
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const conversation = ref<ConversationResponse | null>(null)
const events = ref<ConversationEventResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'events' | 'performance' | 'metadata' | 'history'>('events')
const performanceTabActivated = ref(false)
const highlightEventIndex = computed(() => {
  const v = route.query.highlightEventIndex
  return v !== undefined ? Number(v) : null
})
const eventRefs = ref<(HTMLElement | null)[]>([])
const showPromptPreviewModal = ref(false)
const selectedPrompt = ref('')
const showFillerPromptPreviewModal = ref(false)
const selectedFillerPrompt = ref('')
const showRawResponsePreviewModal = ref(false)
const selectedRawResponse = ref('')
const showVariablesPreviewModal = ref(false)
const selectedVariables = ref<Record<string, any>>({})
const showBugReportModal = ref(false)
const bugReportPrefillData = ref<{ projectId?: string; sessionId?: string; eventIndex?: number; stageId?: string } | undefined>(undefined)

function toNormalizedEvent(event: ConversationEventResponse): NormalizedEvent {
  return {
    id: event.id,
    eventType: event.eventType,
    eventData: event.eventData,
    timestamp: formatTime(event.timestamp),
  }
}

onMounted(async () => {
  await loadConversationData()
})

async function loadConversationData() {
  isLoading.value = true
  error.value = null

  try {
    // Load conversation details
    conversation.value = await conversationsStore.fetchById(projectId.value, conversationId.value)

    // Load conversation events
    const eventsResponse = await conversationsStore.fetchEvents(projectId.value, conversationId.value, {
      orderBy: 'timestamp'
    })
    events.value = eventsResponse.items || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load conversation data'
    console.error('Failed to load conversation:', err)
  } finally {
    isLoading.value = false
    setTimeout(scrollToHighlightedEvent, 200)
  }
}

function goBack() {
  router.push({ name: 'monitor.conversations' })
}

function scrollToHighlightedEvent() {
  if (highlightEventIndex.value === null) return
  const el = eventRefs.value[highlightEventIndex.value]
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function formatTime(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString()
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function openPromptPreview(prompt: string) {
  selectedPrompt.value = prompt
  showPromptPreviewModal.value = true
}

function openFillerPromptPreview(prompt: string) {
  selectedFillerPrompt.value = prompt
  showFillerPromptPreviewModal.value = true
}

function openRawResponsePreview(rawResponse: string) {
  selectedRawResponse.value = rawResponse
  showRawResponsePreviewModal.value = true
}

function openVariablesPreview(variables: Record<string, any>) {
  selectedVariables.value = variables
  showVariablesPreviewModal.value = true
}

function openBugReport(_event: ConversationEventResponse, index?: number) {
  bugReportPrefillData.value = {
    projectId: projectId.value,
    sessionId: conversationId.value,
    eventIndex: index,
    stageId: conversation.value?.stageId || undefined
  }
  showBugReportModal.value = true
}

function closeBugReportModal() {
  showBugReportModal.value = false
  bugReportPrefillData.value = undefined
}

async function handleBugReportSave(data: CreateIssueRequest | UpdateIssueRequest) {
  try {
    await issuesStore.create(data as CreateIssueRequest)
    closeBugReportModal()
  } catch (error) {
    console.error('Failed to create issue:', error)
  }
}

function isResumable(status: string | undefined): boolean {
  return status === 'awaiting_user_input'
}

async function handleResumeConversation() {
  if (!conversation.value || !projectId.value) return

  try {
    // Fetch active API keys for the project
    await apiKeysStore.fetchAll(projectId.value, { filters: { isActive: true } })
    const activeKeys = apiKeysStore.items.filter(k => k.isActive && k.projectId === projectId.value)

    if (activeKeys.length === 0) {
      alert('No active API keys found for this project. Please create an API key first.')
      return
    }

    // Auto-select the first available key for this project
    const key = activeKeys[0]!
    router.push({
      name: 'playground',
      params: { projectId: projectId.value },
      query: { conversationId: conversation.value.id, apiKeyId: key.id }
    })
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to load API keys')
  }
}

const metadataFields = computed(() => {
  if (!conversation.value) return []
  return [
    { label: 'Conversation ID', value: conversation.value.id, format: 'mono' as const },
    { label: 'Project ID', value: conversation.value.projectId, format: 'mono' as const },
    { label: 'User ID', value: conversation.value.userId, format: 'mono' as const },
    { label: 'Session ID', value: conversation.value.sessionId, format: 'mono' as const },
    { label: 'Stage ID', value: conversation.value.stageId, format: 'mono' as const },
    { label: 'Status', value: formatStatusLabel(conversation.value.status) },
    { label: 'Status Details', value: conversation.value.statusDetails },
    { label: 'Created', value: conversation.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: conversation.value.updatedAt, format: 'date' as const },
    { label: 'Starting Stage ID', value: conversation.value.startingStageId, format: 'mono' as const },
    { label: 'Ending Stage ID', value: conversation.value.endingStageId, format: 'mono' as const },
  ]
})

const isArchived = computed(() => conversation.value?.archived ?? false)

const INTERIM_EVENT_TYPES = new Set([
  'transformation', 'classification', 'action',
  'moderation', 'tool_call',
])

const orderedEvents = computed(() => {
  const result: ConversationEventResponse[] = []
  const buffer: ConversationEventResponse[] = []

  for (const event of events.value) {
    if (event.eventType === 'message' || event.eventType === 'command') {
      const role = (event.eventData as any)?.role
      if (role === 'user' || event.eventType === 'command') {
        result.push(event)
        result.push(...buffer)
        buffer.length = 0
      } else {
        result.push(...buffer)
        buffer.length = 0
        result.push(event)
      }
    } else if (INTERIM_EVENT_TYPES.has(event.eventType)) {
      buffer.push(event)
    } else {
      result.push(...buffer)
      buffer.length = 0
      result.push(event)
    }
  }

  result.push(...buffer)
  return result
})

async function activatePerformanceTab() {
  activeTab.value = 'performance'
  if (!performanceTabActivated.value) {
    performanceTabActivated.value = true
    await analyticsStore.fetchConversationTimeline(projectId.value, conversationId.value)
  }
}

watch(conversationId, () => {
  performanceTabActivated.value = false
  analyticsStore.clearTimeline()
})

interface GanttPhaseConfig {
  label: string
  colorClass: string
  durationKey: keyof ConversationTimelineTurn
  startKey: keyof ConversationTimelineTurn
  endKey: keyof ConversationTimelineTurn
}

interface GanttBar {
  left: number
  width: number
  durationMs: number
  offsetMs: number
}

const ganttPhases: GanttPhaseConfig[] = [
  { label: 'ASR', colorClass: 'bg-blue-400', durationKey: 'asrDurationMs', startKey: 'asrStartMs', endKey: 'asrEndMs' },
  { label: 'Moderation', colorClass: 'bg-yellow-400', durationKey: 'moderationDurationMs', startKey: 'moderationStartMs', endKey: 'moderationEndMs' },
  { label: 'Filler', colorClass: 'bg-gray-400', durationKey: 'fillerDurationMs', startKey: 'fillerStartMs', endKey: 'fillerEndMs' },
  { label: 'Processing', colorClass: 'bg-purple-400', durationKey: 'processingDurationMs', startKey: 'processingStartMs', endKey: 'processingEndMs' },
  { label: 'Knowledge', colorClass: 'bg-teal-400', durationKey: 'knowledgeRetrievalDurationMs', startKey: 'knowledgeRetrievalStartMs', endKey: 'knowledgeRetrievalEndMs' },
  { label: 'Actions', colorClass: 'bg-orange-400', durationKey: 'actionsDurationMs', startKey: 'actionsStartMs', endKey: 'actionsEndMs' },
  { label: 'Stage Transition', colorClass: 'bg-violet-400', durationKey: 'stageTransitionStartMs', startKey: 'stageTransitionStartMs', endKey: 'stageTransitionEndMs' },
  { label: 'Prompt Render', colorClass: 'bg-indigo-400', durationKey: 'promptRenderDurationMs', startKey: 'promptRenderStartMs', endKey: 'promptRenderEndMs' },
  { label: 'LLM', colorClass: 'bg-emerald-400', durationKey: 'llmDurationMs', startKey: 'llmStartMs', endKey: 'llmEndMs' },
  { label: 'TTS Connect', colorClass: 'bg-rose-300', durationKey: 'ttsConnectDurationMs', startKey: 'ttsConnectStartMs', endKey: 'ttsConnectEndMs' },
  { label: 'TTS', colorClass: 'bg-pink-400', durationKey: 'ttsDurationMs', startKey: 'ttsStartMs', endKey: 'ttsEndMs' },
]

function getEffectiveTurnEnd(turn: ConversationTimelineTurn): number | null {
  if (turn.turnEndMs != null) return turn.turnEndMs
  if (turn.turnStartMs != null && turn.totalTurnDurationMs != null) return turn.turnStartMs + turn.totalTurnDurationMs
  return null
}

function getGanttBar(turn: ConversationTimelineTurn, startKey: keyof ConversationTimelineTurn, endKey: keyof ConversationTimelineTurn): GanttBar | null {
  const turnStart = turn.turnStartMs
  const turnEnd = getEffectiveTurnEnd(turn)
  const phaseStart = turn[startKey] as number | null
  const phaseEnd = turn[endKey] as number | null
  if (turnStart == null || turnEnd == null || phaseStart == null || phaseEnd == null) return null
  const totalDuration = turnEnd - turnStart
  if (totalDuration <= 0) return null
  const left = Math.max(0, ((phaseStart - turnStart) / totalDuration) * 100)
  const width = Math.max(0.5, Math.min(100 - left, ((phaseEnd - phaseStart) / totalDuration) * 100))
  return { left, width, durationMs: phaseEnd - phaseStart, offsetMs: phaseStart - turnStart }
}

function getMarkerLeft(turn: ConversationTimelineTurn, markerMs: number | null): number | null {
  const turnEnd = getEffectiveTurnEnd(turn)
  if (turn.turnStartMs == null || turnEnd == null || markerMs == null) return null
  const totalDuration = turnEnd - turn.turnStartMs
  if (totalDuration <= 0) return null
  return Math.max(0, Math.min(99.8, ((markerMs - turn.turnStartMs) / totalDuration) * 100))
}

function getTimeAxisTicks(totalDurationMs: number): { left: number; label: string }[] {
  if (totalDurationMs <= 0) return [{ left: 0, label: '0' }]
  const magnitude = Math.pow(10, Math.floor(Math.log10(totalDurationMs / 5)))
  const normalized = (totalDurationMs / 5) / magnitude
  let niceInterval: number
  if (normalized < 1.5) niceInterval = magnitude
  else if (normalized < 3.5) niceInterval = 2 * magnitude
  else if (normalized < 7.5) niceInterval = 5 * magnitude
  else niceInterval = 10 * magnitude
  const ticks: { left: number; label: string }[] = []
  for (let t = 0; t <= totalDurationMs; t += niceInterval) {
    ticks.push({ left: (t / totalDurationMs) * 100, label: t === 0 ? '0' : `${Math.round(t)}ms` })
  }
  const last = ticks[ticks.length - 1]
  if (!last || last.left < 95) {
    ticks.push({ left: 100, label: `${Math.round(totalDurationMs)}ms` })
  } else {
    last.label = `${Math.round(totalDurationMs)}ms`
    last.left = 100
  }
  return ticks
}

function getPhaseWidth(turn: ConversationTimelineTurn, key: keyof ConversationTimelineTurn): number {
  const total = turn.totalTurnDurationMs
  const value = turn[key] as number | null
  if (!total || !value) return 0
  return Math.min(100, (value / total) * 100)
}

const ganttTurnData = computed(() => {
  const timeline = analyticsStore.conversationTimeline
  if (!timeline) return []
  return timeline.turns.map(turn => {
    const effectiveTurnEnd = getEffectiveTurnEnd(turn)
    const isGantt = turn.turnStartMs != null && effectiveTurnEnd != null
    const totalDurationMs = isGantt ? (effectiveTurnEnd! - turn.turnStartMs!) : (turn.totalTurnDurationMs ?? 0)
    const phases = ganttPhases
      .map(phase => {
        const bar = getGanttBar(turn, phase.startKey, phase.endKey)
        const startMs = turn[phase.startKey] as number | null
        const endMs = turn[phase.endKey] as number | null
        const durationMs = (startMs != null && endMs != null)
          ? endMs - startMs
          : (turn[phase.durationKey] as number | null)
        return { ...phase, bar, durationMs }
      })
      .filter(p => p.bar !== null || p.durationMs !== null)
    return {
      turn,
      isGantt,
      phases,
      firstTokenLeft: getMarkerLeft(turn, turn.firstTokenMs),
      firstAudioLeft: getMarkerLeft(turn, turn.firstAudioMs),
      ticks: isGantt ? getTimeAxisTicks(totalDurationMs) : [],
    }
  })
})

function fmtMs(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)} ms`
}

</script>

<template>
  <MonitorSectionLayout>
    <div class="flex flex-col h-full md:border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <!-- Header -->
    <div class="flex items-center justify-between md:px-8 px-0 md:py-6 pb-6 border-b border-gray-200 md:bg-white bg-transparent flex-shrink-0 md:dark:bg-gray-800 dark:border-gray-700">
      <div class="md:flex items-center gap-4 flex-1">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to conversations">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">Conversation Details</h1>
            <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ conversationId }}</p>
          </div>
          <span v-if="isArchived" class="badge-secondary ml-2 self-center">Archived</span>
        </div>
        <div v-if="conversation && isResumable(conversation.status) && !isArchived">
          <button @click="handleResumeConversation" class="btn-primary" title="Resume conversation">
            <Play class="w-4 h-4 mr-2" />
            Resume
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <nav class="tabs-nav" aria-label="Tabs">
          <button @click="activeTab = 'events'" :class="['tab-button', { 'tab-button-active': activeTab === 'events' }]"
            type="button">
            Events Timeline
          </button>
          <button v-if="conversation" @click="activatePerformanceTab"
            :class="['tab-button', { 'tab-button-active': activeTab === 'performance' }]" type="button">
            Performance
          </button>
          <button v-if="conversation" @click="activeTab = 'metadata'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]" type="button">
            Metadata
          </button>
          <button v-if="conversation" @click="activeTab = 'history'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'history' }]" type="button">
            History
          </button>
        </nav>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        Loading conversation...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        {{ error }}
        <button @click="loadConversationData" class="btn-secondary mt-4">
          Retry
        </button>
      </div>

      <!-- Content -->
      <div v-else class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto">
          <!-- Events Timeline Tab -->
          <div v-show="activeTab === 'events'" class="tab-content">
            <div v-if="events.length === 0" class="text-center py-12 text-gray-500">
              No events recorded for this conversation
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(event, index) in orderedEvents"
                :key="event.id"
                :ref="(el) => { eventRefs[index] = el as HTMLElement | null }"
              >
                <ConversationEventCard
                  :event="toNormalizedEvent(event)"
                  :show-bug-report="!isArchived"
                  :highlighted="highlightEventIndex === index"
                  @open-prompt="openPromptPreview"
                  @open-filler-prompt="openFillerPromptPreview"
                  @open-raw-response="openRawResponsePreview"
                  @open-variables="openVariablesPreview"
                  @open-bug-report="openBugReport(event, index)"
                />
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab v-if="conversation" v-show="activeTab === 'metadata'" :fields="metadataFields" />
          <!-- History Tab -->
          <div class="tab-content">
            <EntityHistoryView
              v-if="conversation"
              v-show="activeTab === 'history'"
              :load-history="() => conversationsStore.fetchAuditLogs(projectId, conversationId)"
              :current-object="conversation"
              :active="activeTab === 'history'"
              :ignore-fields="['createdAt', 'archived', 'updatedAt']"
            />
          </div>

          <!-- Performance Tab -->
          <div v-if="conversation" v-show="activeTab === 'performance'" class="tab-content">
            <div v-if="analyticsStore.isLoadingTimeline" class="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading performance data...
            </div>
            <div v-else-if="analyticsStore.timelineError" class="error-state">
              {{ analyticsStore.timelineError }}
            </div>
            <div v-else-if="!analyticsStore.conversationTimeline || analyticsStore.conversationTimeline.turns.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
              No performance data available for this conversation
            </div>
            <div v-else class="space-y-6">
              <!-- Legend -->
              <div class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span v-for="phase in ganttPhases" :key="phase.durationKey" class="flex items-center gap-1">
                  <span :class="[phase.colorClass, 'inline-block w-3 h-3 rounded-sm']" />
                  {{ phase.label }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block w-px h-3 bg-amber-400" />
                  First Token
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block w-px h-3 bg-cyan-500" />
                  First Audio
                </span>
              </div>

              <!-- Turn cards -->
              <div class="space-y-4">
                <div
                  v-for="td in ganttTurnData"
                  :key="td.turn.turnIndex"
                  class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <!-- Turn header -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Turn {{ td.turn.turnIndex }}</span>
                      <span v-if="td.turn.source" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{{ td.turn.source }}</span>
                      <span class="text-xs text-gray-400 dark:text-gray-500">{{ new Date(td.turn.timestamp).toLocaleTimeString() }}</span>
                    </div>
                    <span class="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{{ fmtMs(td.turn.totalTurnDurationMs) }}</span>
                  </div>

                  <!-- Gantt chart -->
                  <div v-if="td.isGantt" class="space-y-0.5">
                    <div v-for="phase in td.phases" :key="phase.durationKey" class="flex items-center gap-2">
                      <span class="w-24 text-xs text-right text-gray-400 dark:text-gray-500 shrink-0">{{ phase.label }}</span>
                      <div class="flex-1 relative h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                          v-if="phase.bar"
                          :class="[phase.colorClass, 'absolute top-0.5 h-4 rounded opacity-80']"
                          :style="{ left: phase.bar.left + '%', width: phase.bar.width + '%' }"
                          :title="`${phase.label}: ${fmtMs(phase.bar.durationMs)} (at +${fmtMs(phase.bar.offsetMs)})`"
                        />
                        <div
                          v-if="td.firstTokenLeft !== null"
                          class="absolute top-0 h-full w-px bg-amber-400"
                          :style="{ left: td.firstTokenLeft + '%' }"
                          title="First Token"
                        />
                        <div
                          v-if="td.firstAudioLeft !== null"
                          class="absolute top-0 h-full w-px bg-cyan-500"
                          :style="{ left: td.firstAudioLeft + '%' }"
                          title="First Audio"
                        />
                      </div>
                      <span class="w-16 text-right text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">{{ fmtMs(phase.durationMs) }}</span>
                    </div>
                    <!-- Time axis -->
                    <div class="flex items-center gap-2 mt-2">
                      <span class="w-24 shrink-0" />
                      <div class="flex-1 relative h-4 border-t border-gray-200 dark:border-gray-600">
                        <span
                          v-for="tick in td.ticks"
                          :key="tick.label"
                          class="absolute top-0.5 text-xs text-gray-400 dark:text-gray-500"
                          :style="{ left: tick.left + '%', transform: tick.left < 5 ? 'none' : tick.left > 90 ? 'translateX(-100%)' : 'translateX(-50%)' }"
                        >{{ tick.label }}</span>
                      </div>
                      <span class="w-16 shrink-0" />
                    </div>
                  </div>

                  <!-- Fallback stacked bar (no start/end data) -->
                  <div v-else class="h-5 w-full flex rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <div
                      v-for="phase in td.phases"
                      :key="'bar-' + phase.durationKey"
                      :class="[phase.colorClass]"
                      :style="{ width: getPhaseWidth(td.turn, phase.durationKey) + '%' }"
                      :title="`${phase.label}: ${fmtMs(phase.durationMs)}`"
                    />
                  </div>

                  <!-- Metrics summary -->
                  <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 text-xs">
                    <div v-for="phase in td.phases" :key="'m-' + phase.durationKey" class="flex items-center gap-1">
                      <span :class="[phase.colorClass, 'inline-block w-2 h-2 rounded-sm flex-shrink-0']" />
                      <span class="text-gray-500 dark:text-gray-400">{{ phase.label }}:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(phase.durationMs) }}</span>
                    </div>
                    <div v-if="td.turn.timeToFirstTokenMs != null" class="flex items-center gap-1">
                      <span class="inline-block w-2 h-2 rounded-sm bg-amber-300 dark:bg-amber-700 flex-shrink-0" />
                      <span class="text-gray-500 dark:text-gray-400">TTFT:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(td.turn.timeToFirstTokenMs) }}</span>
                    </div>
                    <div v-if="td.turn.timeToFirstAudioMs != null" class="flex items-center gap-1">
                      <span class="inline-block w-2 h-2 rounded-sm bg-cyan-400 dark:bg-cyan-700 flex-shrink-0" />
                      <span class="text-gray-500 dark:text-gray-400">First audio:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(td.turn.timeToFirstAudioMs) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prompt Preview Modal -->
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
    
    <!-- Variables Preview Modal -->
    <VariablesPreviewModal
      v-if="showVariablesPreviewModal"
      :variables="selectedVariables"
      @close="showVariablesPreviewModal = false" />
    
    <!-- Bug Report Modal -->
    <IssueEditModal
      v-if="showBugReportModal"
      :issue="null"
      :prefill-data="bugReportPrefillData"
      @close="closeBugReportModal"
      @save="handleBugReportSave" />
  </MonitorSectionLayout>
</template>

<style scoped>
.badge-active {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
}

.badge-success {
  background-color: rgb(219 234 254);
  color: rgb(30 64 175);
}

.badge-warning {
  background-color: rgb(254 249 195);
  color: rgb(133 77 14);
}

.badge-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.badge-secondary {
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

details summary::-webkit-details-marker {
  display: none;
}

details summary::marker {
  display: none;
}

details[open] summary {
  margin-bottom: 0.5rem;
}
</style>
