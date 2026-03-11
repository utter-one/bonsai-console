<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConversationsStore, useProjectSelectionStore, useApiKeysStore, useIssuesStore } from '@/stores'
import { ArrowLeft, Play } from 'lucide-vue-next'
import type { ConversationResponse, ConversationEventResponse, CreateIssueRequest, UpdateIssueRequest } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
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

const conversationId = computed(() => route.params.conversationId as string)
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const conversation = ref<ConversationResponse | null>(null)
const events = ref<ConversationEventResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'events' | 'metadata'>('events')
const highlightEventIndex = computed(() => {
  const v = route.query.highlightEventIndex
  return v !== undefined ? Number(v) : null
})
const eventRefs = ref<(HTMLElement | null)[]>([])
const showPromptPreviewModal = ref(false)
const selectedPrompt = ref('')
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
  ]
})

const isArchived = computed(() => conversation.value?.archived ?? false)

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
          <button v-if="conversation" @click="activeTab = 'metadata'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]" type="button">
            Metadata
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
                v-for="(event, index) in events"
                :key="event.id"
                :ref="(el) => { eventRefs[index] = el as HTMLElement | null }"
              >
                <ConversationEventCard
                  :event="toNormalizedEvent(event)"
                  :show-bug-report="!isArchived"
                  :highlighted="highlightEventIndex === index"
                  @open-prompt="openPromptPreview"
                  @open-raw-response="openRawResponsePreview"
                  @open-variables="openVariablesPreview"
                  @open-bug-report="openBugReport(event, index)"
                />
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab v-if="conversation" v-show="activeTab === 'metadata'" :fields="metadataFields" />
        </div>
      </div>
    </div>

    <!-- Prompt Preview Modal -->
    <PromptPreviewModal
      v-if="showPromptPreviewModal"
      :prompt="selectedPrompt"
      @close="showPromptPreviewModal = false" />
    
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
