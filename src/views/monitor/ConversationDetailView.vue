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
    { label: 'Client ID', value: conversation.value.clientId, format: 'mono' as const },
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

const timelinePhases: { key: keyof ConversationTimelineTurn; label: string; color: string }[] = [
  { key: 'asrDurationMs', label: 'ASR', color: 'bg-blue-400' },
  { key: 'moderationDurationMs', label: 'Moderation', color: 'bg-yellow-400' },
  { key: 'processingDurationMs', label: 'Processing', color: 'bg-purple-400' },
  { key: 'knowledgeRetrievalDurationMs', label: 'Knowledge', color: 'bg-teal-400' },
  { key: 'actionsDurationMs', label: 'Actions', color: 'bg-orange-400' },
  { key: 'fillerDurationMs', label: 'Filler', color: 'bg-gray-400' },
  { key: 'llmDurationMs', label: 'LLM', color: 'bg-emerald-400' },
  { key: 'ttsDurationMs', label: 'TTS', color: 'bg-pink-400' },
]

function getPhaseWidth(turn: ConversationTimelineTurn, key: keyof ConversationTimelineTurn): number {
  const total = turn.totalTurnDurationMs
  const value = turn[key] as number | null
  if (!total || !value) return 0
  return Math.min(100, (value / total) * 100)
}

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
              <!-- Phase legend -->
              <div class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span v-for="phase in timelinePhases" :key="phase.key" class="flex items-center gap-1">
                  <span :class="[phase.color, 'inline-block w-3 h-3 rounded-sm']" />
                  {{ phase.label }}
                </span>
              </div>

              <!-- Waterfall -->
              <div class="space-y-3">
                <div
                  v-for="turn in analyticsStore.conversationTimeline.turns"
                  :key="turn.turnIndex"
                  class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Turn {{ turn.turnIndex }}</span>
                      <span v-if="turn.source" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{{ turn.source }}</span>
                      <span class="text-xs text-gray-400 dark:text-gray-500">{{ new Date(turn.timestamp).toLocaleTimeString() }}</span>
                    </div>
                    <span class="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{{ fmtMs(turn.totalTurnDurationMs) }}</span>
                  </div>
                  <!-- Phase bar -->
                  <div class="h-5 w-full flex rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <div
                      v-for="phase in timelinePhases"
                      :key="phase.key"
                      :class="[phase.color]"
                      :style="{ width: getPhaseWidth(turn, phase.key) + '%' }"
                      :title="`${phase.label}: ${fmtMs(turn[phase.key] as number | null)}`"
                    />
                  </div>
                  <!-- Metric details -->
                  <div class="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 text-xs">
                    <div v-for="phase in timelinePhases" :key="'d-' + phase.key" class="flex items-center gap-1">
                      <span :class="[phase.color, 'inline-block w-2 h-2 rounded-sm flex-shrink-0']" />
                      <span class="text-gray-500 dark:text-gray-400">{{ phase.label }}:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(turn[phase.key] as number | null) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="inline-block w-2 h-2 rounded-sm bg-blue-200 dark:bg-blue-800 flex-shrink-0" />
                      <span class="text-gray-500 dark:text-gray-400">TTFT:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(turn.timeToFirstTokenMs) }}</span>
                    </div>
                    <div v-if="turn.source === 'voice'" class="flex items-center gap-1">
                      <span class="inline-block w-2 h-2 rounded-sm bg-orange-200 dark:bg-orange-800 flex-shrink-0" />
                      <span class="text-gray-500 dark:text-gray-400">First audio:</span>
                      <span class="font-mono text-gray-700 dark:text-gray-300">{{ fmtMs(turn.timeToFirstAudioMs) }}</span>
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
