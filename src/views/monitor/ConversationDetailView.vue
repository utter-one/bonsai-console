<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConversationsStore } from '@/stores'
import { ArrowLeft, MessageSquare, GitBranch, Zap, Terminal, Play, RotateCcw, CheckCircle, XCircle, AlertCircle, Layers } from 'lucide-vue-next'
import type { ConversationResponse, ConversationEventResponse } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'


const route = useRoute()
const router = useRouter()
const conversationsStore = useConversationsStore()

const conversationId = computed(() => route.params.conversationId as string)
const conversation = ref<ConversationResponse | null>(null)
const events = ref<ConversationEventResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'events' | 'metadata'>('events')

onMounted(async () => {
  await loadConversationData()
})

async function loadConversationData() {
  isLoading.value = true
  error.value = null

  try {
    // Load conversation details
    conversation.value = await conversationsStore.fetchById(conversationId.value)

    // Load conversation events
    const eventsResponse = await conversationsStore.fetchEvents(conversationId.value, {
      orderBy: 'timestamp'
    })
    events.value = eventsResponse.items || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load conversation data'
    console.error('Failed to load conversation:', err)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'monitor.conversations' })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
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

function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'message':
      return 'bg-blue-50 border-blue-200'
    case 'classification':
      return 'bg-yellow-50 border-yellow-200'
    case 'action':
      return 'bg-purple-50 border-purple-200'
    case 'command':
      return 'bg-indigo-50 border-indigo-200'
    case 'conversation_start':
      return 'bg-green-50 border-green-200'
    case 'conversation_resume':
      return 'bg-cyan-50 border-cyan-200'
    case 'conversation_end':
      return 'bg-gray-50 border-gray-300'
    case 'conversation_aborted':
      return 'bg-orange-50 border-orange-200'
    case 'conversation_failed':
      return 'bg-red-50 border-red-200'
    case 'jump_to_stage':
      return 'bg-teal-50 border-teal-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function isMessageEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'message'
}

function isClassificationEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'classification'
}

function isActionEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'action'
}

function isCommandEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'command'
}

function isConversationStartEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'conversation_start'
}

function isConversationResumeEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'conversation_resume'
}

function isConversationEndEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'conversation_end'
}

function isConversationAbortedEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'conversation_aborted'
}

function isConversationFailedEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'conversation_failed'
}

function isJumpToStageEvent(event: ConversationEventResponse): boolean {
  return event.eventType === 'jump_to_stage'
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

</script>

<template>
  <MonitorSectionLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
        <div class="flex items-center gap-4 flex-1">
          <button @click="goBack" class="btn-icon" title="Back to conversations">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-1">Conversation Details</h1>
            <p class="text-sm text-gray-600 font-mono">{{ conversationId }}</p>
          </div>
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
      <div v-else class="flex-1 overflow-y-auto bg-gray-50">
        <div class="mx-auto">
          <!-- Events Timeline Tab -->
          <div v-show="activeTab === 'events'" class="tab-content">
            <div v-if="events.length === 0" class="text-center py-12 text-gray-500">
              No events recorded for this conversation
            </div>

            <div v-else class="space-y-4">
              <div v-for="event in events" :key="event.id"
                class="border rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md"
                :class="getEventTypeColor(event.eventType)">

                <!-- Message Event -->
                <div v-if="isMessageEvent(event)">
                  <div class="flex items-start gap-3">
                    <MessageSquare class="w-5 h-5 mt-0.5"
                      :class="event.eventData.role === 'user' ? 'text-blue-600' : 'text-green-600'" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold"
                          :class="event.eventData.role === 'user' ? 'text-blue-900' : 'text-green-900'">
                          {{ event.eventData.role === 'user' ? 'User' : 'Assistant' }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="text-gray-900 whitespace-pre-wrap">{{ event.eventData.text }}</div>
                      <div v-if="event.eventData.originalText && event.eventData.originalText !== event.eventData.text"
                        class="mt-2 pt-2 border-t border-gray-300">
                        <span class="text-xs font-medium text-gray-600">Original:</span>
                        <div class="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{{ event.eventData.originalText }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Classification Event -->
                <div v-else-if="isClassificationEvent(event)">
                  <div class="flex items-start gap-3">
                    <GitBranch class="w-5 h-5 mt-0.5 text-yellow-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-yellow-900">Classification</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Classifier:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.classifierId }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">Input:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.input }}</div>
                        </div>
                        <div v-if="event.eventData.actions && event.eventData.actions.length > 0">
                          <span class="text-xs font-medium text-gray-600">Actions:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.actions.length }} action(s) matched
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Event -->
                <div v-else-if="isActionEvent(event)">
                  <div class="flex items-start gap-3">
                    <Zap class="w-5 h-5 mt-0.5 text-purple-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-purple-900">Action</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Action Name:</span>
                          <div class="text-sm font-medium text-gray-900">{{ event.eventData.actionName }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.effects && event.eventData.effects.length > 0">
                          <span class="text-xs font-medium text-gray-600">Effects:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.effects.length }} effect(s)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Command Event -->
                <div v-else-if="isCommandEvent(event)">
                  <div class="flex items-start gap-3">
                    <Terminal class="w-5 h-5 mt-0.5 text-indigo-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-indigo-900">Command</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Command:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.command }}</div>
                        </div>
                        <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none">
                              Parameters ({{ Object.keys(event.eventData.parameters).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Conversation Start Event -->
                <div v-else-if="isConversationStartEvent(event)">
                  <div class="flex items-start gap-3">
                    <Play class="w-5 h-5 mt-0.5 text-green-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-green-900">Conversation Started</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Initial Stage:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                        <div
                          v-if="event.eventData.initialVariables && Object.keys(event.eventData.initialVariables).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none">
                              Initial Variables ({{ Object.keys(event.eventData.initialVariables).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.initialVariables, null, 2) }}</pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Conversation Resume Event -->
                <div v-else-if="isConversationResumeEvent(event)">
                  <div class="flex items-start gap-3">
                    <RotateCcw class="w-5 h-5 mt-0.5 text-cyan-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-cyan-900">Conversation Resumed</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Previous Status:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.previousStatus }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Conversation End Event -->
                <div v-else-if="isConversationEndEvent(event)">
                  <div class="flex items-start gap-3">
                    <CheckCircle class="w-5 h-5 mt-0.5 text-gray-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-gray-900">Conversation Ended</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div v-if="event.eventData.reason">
                          <span class="text-xs font-medium text-gray-600">Reason:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.reason }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Conversation Aborted Event -->
                <div v-else-if="isConversationAbortedEvent(event)">
                  <div class="flex items-start gap-3">
                    <XCircle class="w-5 h-5 mt-0.5 text-orange-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-orange-900">Conversation Aborted</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Reason:</span>
                          <div class="text-sm text-gray-900">{{ event.eventData.reason }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Conversation Failed Event -->
                <div v-else-if="isConversationFailedEvent(event)">
                  <div class="flex items-start gap-3">
                    <AlertCircle class="w-5 h-5 mt-0.5 text-red-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-red-900">Conversation Failed</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">Error:</span>
                          <div class="text-sm text-red-900 font-mono bg-red-100 bg-opacity-50 rounded p-2 mt-1">{{
                            event.eventData.error }}</div>
                        </div>
                        <div v-if="event.eventData.stageId">
                          <span class="text-xs font-medium text-gray-600">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.stageId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Jump to Stage Event -->
                <div v-else-if="isJumpToStageEvent(event)">
                  <div class="flex items-start gap-3">
                    <Layers class="w-5 h-5 mt-0.5 text-teal-600" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-teal-900">Stage Transition</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600">From:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.fromStageId }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600">To:</span>
                          <div class="text-sm font-mono text-gray-900">{{ event.eventData.toStageId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Generic Event (Fallback) -->
                <div v-else>
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900">
                          {{ formatEventType(event.eventType) }}
                        </span>
                        <span class="text-xs text-gray-500 font-mono">
                          {{ event.id }}
                        </span>
                      </div>
                      <div class="text-xs text-gray-600 mt-1">
                        {{ formatDate(event.timestamp) }}
                      </div>
                    </div>
                  </div>

                  <!-- Event Data -->
                  <div v-if="Object.keys(event.eventData).length > 0" class="mt-3">
                    <details class="group">
                      <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
                        Event Data
                        <span class="text-xs text-gray-500 ml-1">(click to expand)</span>
                      </summary>
                      <div class="mt-2 bg-white bg-opacity-60 rounded p-3 font-mono text-xs overflow-x-auto">
                        <pre
                          class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData, null, 2) }}</pre>
                      </div>
                    </details>
                  </div>
                </div>

                <!-- Metadata (Available for all events) -->
                <div v-if="event.metadata && Object.keys(event.metadata).length > 0" class="mt-3">
                  <details class="group">
                    <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
                      Metadata
                      <span class="text-xs text-gray-500 ml-1">(click to expand)</span>
                    </summary>
                    <div class="mt-2 bg-white bg-opacity-60 rounded p-3 font-mono text-xs overflow-x-auto">
                      <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.metadata, null, 2) }}</pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab v-if="conversation" v-show="activeTab === 'metadata'" :fields="metadataFields" />
        </div>
      </div>
    </div>
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
