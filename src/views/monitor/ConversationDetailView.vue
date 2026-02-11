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
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
    case 'classification':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
    case 'action':
      return 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
    case 'command':
      return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800'
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
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Type guard to check if event data is a message event
function isMessageEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'message'
  eventData: { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'message'
}

// Type guard to check if event data is a classification event
function isClassificationEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'classification'
  eventData: {
    classifierId: string
    input: string
    actions: {
      classifierId: string
      classifierName: string
      actions: { name: string; parameters: Record<string, any> }[]
    }[]
    metadata?: Record<string, any>
  }
} {
  return event.eventType === 'classification'
}

// Type guard to check if event data is an action event
function isActionEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'action'
  eventData: { actionName: string; stageId: string; effects: any[]; metadata?: Record<string, any> }
} {
  return event.eventType === 'action'
}

// Type guard to check if event data is a command event
function isCommandEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'command'
  eventData: { command: string; parameters?: Record<string, any>; metadata?: Record<string, any> }
} {
  return event.eventType === 'command'
}

// Type guard to check if event data is a conversation start event
function isConversationStartEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'conversation_start'
  eventData: { stageId: string; initialVariables?: Record<string, any>; metadata?: Record<string, any> }
} {
  return event.eventType === 'conversation_start'
}

// Type guard to check if event data is a conversation resume event
function isConversationResumeEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'conversation_resume'
  eventData: {
    previousStatus: string
    stageId: string
    metadata?: Record<string, any>
  }
} {
  return event.eventType === 'conversation_resume'
}

// Type guard to check if event data is a conversation end event
function isConversationEndEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'conversation_end'
  eventData: { reason?: string; stageId: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'conversation_end'
}

// Type guard to check if event data is a conversation aborted event
function isConversationAbortedEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'conversation_aborted'
  eventData: { reason: string; stageId: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'conversation_aborted'
}

// Type guard to check if event data is a conversation failed event
function isConversationFailedEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'conversation_failed'
  eventData: { error: string; stageId?: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'conversation_failed'
}

// Type guard to check if event data is a jump to stage event
function isJumpToStageEvent(event: ConversationEventResponse): event is ConversationEventResponse & {
  eventType: 'jump_to_stage'
  eventData: { fromStageId: string; toStageId: string; metadata?: Record<string, any> }
} {
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
                          :class="event.eventData.role === 'user' ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'">
                          {{ event.eventData.role === 'user' ? 'User' : 'Assistant' }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="text-gray-900 whitespace-pre-wrap dark:text-gray-100">{{ event.eventData.text }}</div>
                      <div v-if="event.eventData.originalText && event.eventData.originalText !== event.eventData.text"
                        class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</span>
                        <div class="text-sm text-gray-700 mt-1 whitespace-pre-wrap dark:text-gray-300">{{ event.eventData.originalText }}
                        </div>
                      </div>
                      <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0"
                        class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <details class="group">
                          <summary
                            class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                            Message Metadata ({{ Object.keys(event.eventData.metadata).length }})
                          </summary>
                          <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                            <pre
                              class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                          </div>
                        </details>
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
                        <span class="font-semibold text-yellow-900 dark:text-yellow-100">Classification</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
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
                              <div class="text-[10px] text-gray-500 font-mono mb-2">{{ actionGroup.classifierId }}</div>
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
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-purple-900 dark:text-purple-100">Action</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Action Name:</span>
                          <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.actionName }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.effects && event.eventData.effects.length > 0">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Effects ({{ event.eventData.effects.length }}):</span>
                          <div class="mt-1 space-y-2">
                            <div v-for="(effect, idx) in event.eventData.effects" :key="idx"
                              class="bg-white bg-opacity-60 rounded p-2.5 dark:bg-gray-900 dark:bg-opacity-60">
                              <div class="text-sm font-semibold text-purple-900 mb-2 dark:text-purple-100">
                                {{ effect.type || 'Effect' }} {{ idx + 1 }}
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
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-indigo-900 dark:text-indigo-100">Command</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Command:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.command }}</div>
                        </div>
                        <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Parameters ({{ Object.keys(event.eventData.parameters).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                            </div>
                          </details>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
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
                        <span class="font-semibold text-green-900 dark:text-green-100">Conversation Started</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Initial Stage:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div
                          v-if="event.eventData.initialVariables && Object.keys(event.eventData.initialVariables).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Initial Variables ({{ Object.keys(event.eventData.initialVariables).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.initialVariables, null, 2) }}</pre>
                            </div>
                          </details>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
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
                        <span class="font-semibold text-cyan-900 dark:text-cyan-100">Conversation Resumed</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Previous Status:</span>
                          <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.previousStatus }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-gray-900 dark:text-white">Conversation Ended</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div v-if="event.eventData.reason">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
                          <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-orange-900 dark:text-orange-100">Conversation Aborted</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
                          <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-red-900 dark:text-red-100">Conversation Failed</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
                        <div>
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Error:</span>
                          <div class="text-sm text-red-900 font-mono bg-red-100 bg-opacity-50 rounded p-2 mt-1 dark:bg-red-900/40 dark:text-red-100">{{
                            event.eventData.error }}</div>
                        </div>
                        <div v-if="event.eventData.stageId">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage ID:</span>
                          <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.stageId }}</div>
                        </div>
                        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
                          <details class="group">
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-teal-900 dark:text-teal-100">Stage Transition</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="space-y-2">
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
                            <summary
                              class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                              Metadata ({{ Object.keys(event.eventData.metadata).length }})
                            </summary>
                            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                              <pre
                                class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                            </div>
                          </details>
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
                        <span class="font-semibold text-gray-900 dark:text-white">
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
                      <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none dark:text-gray-300 dark:hover:text-gray-100">
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
                    <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none dark:text-gray-300 dark:hover:text-gray-100">
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
