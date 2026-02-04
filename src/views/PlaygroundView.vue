<template>
  <!-- No Project Selected State -->
  <div v-if="!hasProject" class="flex items-center justify-center bg-gray-50 h-[calc(100vh-7rem)] overflow-hidden">
    <div class="text-center max-w-md">
      <Play class="mx-auto mb-4 text-gray-400" :size="64" />
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
      <p class="text-gray-600 mb-6">
        Please select a project from the dropdown in the top navigation bar to use the Playground.
      </p>
      <button 
        @click="goToProjects"
        class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
      >
        View All Projects
      </button>
    </div>
  </div>

  <!-- Main Playground UI -->
  <div v-else class="flex flex-col bg-gray-50 overflow-hidden h-[calc(100vh-7rem)]">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Playground</h1>
            <p class="text-sm text-gray-600 mt-1">Test and debug conversation flows in real-time</p>
          </div>
          
          <!-- API Key Selection -->
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700">API&nbsp;Key:</label>
            <select
              v-model="selectedApiKeyId"
              class="form-select min-w-[200px]"
              :disabled="wsIsConnected || apiKeysLoading"
            >
              <option :value="null">Select API Key...</option>
              <option
                v-for="key in activeApiKeys"
                :key="key.id"
                :value="key.id"
              >
                {{ key.name }}
              </option>
            </select>
            <button
              v-if="!wsIsConnected"
              @click="connectWebSocket"
              :disabled="!canConnectWebSocket"
              class="btn-primary flex items-center gap-2"
            >
              <Plug :size="16" />
              {{ isWsConnecting ? 'Connecting...' : 'Connect' }}
            </button>
            <button
              v-else
              @click="disconnectWebSocket"
              :disabled="!canDisconnectWebSocket"
              class="btn-danger flex items-center gap-2"
            >
              <X :size="16" />
              {{ isWsDisconnecting ? 'Disconnecting...' : 'Disconnect' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-h-0 pt-4 gap-4 overflow-hidden">
        <!-- Control Panel -->
        <div class="flex-shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="px-4 py-3 border-b border-gray-200">
            <h2 class="text-sm font-semibold text-gray-700">Controls</h2>
          </div>
          <div class="p-4 flex flex-wrap gap-3">
            <!-- Conversation Controls -->
            <div class="flex gap-2">
              <button
                v-if="!isConversationActive"
                class="btn-primary flex items-center gap-2"
                @click="startConversation"
                :disabled="!canStartConversation"
              >
                <Play :size="18" />
                {{ isConversationStarting ? 'Starting...' : 'Start Conversation' }}
              </button>
              <button
                v-else
                class="btn-danger flex items-center gap-2"
                @click="endConversation"
                :disabled="!canEndConversation"
              >
                <Square :size="18" />
                {{ isConversationEnding ? 'Ending...' : 'End Conversation' }}
              </button>
            </div>

            <div class="h-8 border-l border-gray-300"></div>

            <!-- Advanced Controls -->
            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!canRunAction"
              @click="showRunActionDialog = true"
            >
              <Zap :size="18" />
              Run Action
            </button>

            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!canJumpToStage"
              @click="showJumpToStageDialog = true"
            >
              <SkipForward :size="18" />
              Jump to Stage
            </button>

            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!isConversationActive || isConversationStarting || isConversationEnding"
            >
              <RefreshCw :size="18" />
              Reset Context
            </button>

            <div class="h-8 border-l border-gray-300"></div>

            <!-- Info -->
            <div class="flex items-center gap-4 text-sm text-gray-600 ml-auto">
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="wsIsConnected ? 'bg-green-500' : 'bg-gray-400'"
                ></div>
                <span>{{ wsIsConnected ? 'Connected' : 'Disconnected' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="isConversationActive ? 'bg-blue-500' : 'bg-gray-400'"
                ></div>
                <span>{{ isConversationActive ? 'Conversation Active' : 'No Conversation' }}</span>
              </div>
              <div v-if="conversationId">
                <span class="text-gray-500">Conv ID:</span>
                <span class="font-mono ml-1 text-xs">{{ conversationId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- History Panel (Main Area) -->
        <div class="flex-1 min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-semibold text-gray-700">Conversation History</h2>
          </div>
          <div ref="historyContainer" class="flex-1 overflow-y-auto p-4">
            <!-- No conversation state -->
            <div v-if="conversationEvents.length === 0" class="flex items-center justify-center h-full text-gray-400">
              <div class="text-center">
                <p class="text-lg font-medium">No active conversation</p>
                <p class="text-sm mt-1">Start a conversation to see events appear here</p>
              </div>
            </div>

            <!-- Conversation events -->
            <div v-else class="space-y-3">
              <div
                v-for="(event, index) in conversationEvents"
                :key="index"
                class="p-3 rounded-lg border"
                :class="{
                  'bg-blue-50 border-blue-200': event.type === 'user',
                  'bg-green-50 border-green-200': event.type === 'ai',
                  'bg-gray-50 border-gray-200': event.type === 'system',
                  'bg-red-50 border-red-200': event.type === 'error'
                }"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    :class="{
                      'bg-blue-500 text-white': event.type === 'user',
                      'bg-green-500 text-white': event.type === 'ai',
                      'bg-gray-500 text-white': event.type === 'system',
                      'bg-red-500 text-white': event.type === 'error'
                    }"
                  >
                    <User v-if="event.type === 'user'" :size="16" />
                    <Bot v-else-if="event.type === 'ai'" :size="16" />
                    <AlertCircle v-else-if="event.type === 'error'" :size="16" />
                    <Info v-else :size="16" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-sm capitalize">{{ event.type }}</span>
                      <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                    </div>
                    <div class="text-sm">
                      <p v-if="event.message" class="whitespace-pre-wrap">{{ event.message }}</p>
                      <div v-if="event.details" class="mt-2 text-xs text-gray-600 font-mono">
                        {{ event.details }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Panel -->
        <div class="flex-shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div class="flex gap-3 items-end">
            <!-- Text Input -->
            <div class="flex-1">
              <label class="form-label">Message</label>
              <textarea
                v-model="messageInput"
                class="form-textarea"
                rows="2"
                placeholder="Type your message here..."
                :disabled="!canSendMessage"
                @keydown.enter.ctrl="sendMessage"
              />
            </div>

            <!-- Send Button -->
            <button
              class="btn-primary h-10 px-6"
              :disabled="!canSendMessage || !messageInput.trim()"
              @click="sendMessage"
            >
              <Send :size="20" />
            </button>
          </div>
        </div>
      </div>

    <!-- Modals -->
    <StageSelectionModal
      v-if="showStartConversationModal"
      :project-id="projectId"
      title="Start Conversation"
      @close="showStartConversationModal = false"
      @select="handleStartConversation"
    />
    
    <StageSelectionModal
      v-if="showJumpToStageDialog"
      :project-id="projectId"
      title="Jump to Stage"
      @close="showJumpToStageDialog = false"
      @select="handleJumpToStage"
    />
    
    <RunActionModal
      v-if="showRunActionDialog"
      :global-actions="globalActions"
      :current-stage="currentStage"
      @close="showRunActionDialog = false"
      @run="handleRunAction"
    />
    
    <!-- TODO: Add Audio Settings Modal -->
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectSelectionStore, useGlobalActionsStore, useApiKeysStore, useAuthStore, useUsersStore } from '@/stores'
import { useWebSocketClient } from '@/composables/useWebSocketClient'
import { Play, Square, Send, Zap, SkipForward, RefreshCw, Plug, X, User, Bot, AlertCircle, Info } from 'lucide-vue-next'
import StageSelectionModal from '@/components/modals/StageSelectionModal.vue'
import RunActionModal from '@/components/modals/RunActionModal.vue'
import type { StageResponse } from '@/api/types'
import type { SendAiVoiceChunkMessage, StartAiVoiceOutputMessage, EndAiVoiceOutputMessage } from '@/api/websocket/contracts/aiResponse'

const router = useRouter()
const route = useRoute()
const projectSelectionStore = useProjectSelectionStore()
const globalActionsStore = useGlobalActionsStore()
const apiKeysStore = useApiKeysStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

// Project selection - use route params as source of truth
const projectId = computed(() => route.params.projectId as string || '')
const hasProject = computed(() => !!projectId.value)

// Sync route projectId with store on mount and route changes
onMounted(() => {
  if (projectId.value) {
    projectSelectionStore.setSelectedProjectId(projectId.value)
  }
})

watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId) {
    projectSelectionStore.setSelectedProjectId(newProjectId as string)
  }
})

// Load global actions and API keys when project changes
watch(projectId, async (newProjectId) => {
  if (newProjectId) {
    await Promise.all([
      globalActionsStore.fetchAll({ filters: { projectId: newProjectId } }),
      apiKeysStore.fetchAll({ filters: { projectId: newProjectId, isActive: true } })
    ])
    
    // Auto-select first active API key
    const firstActiveKey = activeApiKeys.value[0]
    if (firstActiveKey && !selectedApiKeyId.value) {
      selectedApiKeyId.value = firstActiveKey.id
    }
  }
}, { immediate: true })

function goToProjects() {
  router.push({ name: 'administration.projects' })
}

// Computed
const globalActions = computed(() => {
  if (!projectId.value) return []
  return globalActionsStore.items.filter(action => action.projectId === projectId.value)
})

const activeApiKeys = computed(() => {
  if (!projectId.value) return []
  return apiKeysStore.items.filter(key => key.projectId === projectId.value && key.isActive)
})

const apiKeysLoading = computed(() => apiKeysStore.isLoading)

// WebSocket and conversation state
const selectedApiKeyId = ref<string | null>(null)
const selectedApiKey = computed(() => {
  if (!selectedApiKeyId.value) return null
  return apiKeysStore.items.find(k => k.id === selectedApiKeyId.value)
})

// Conversation event log
interface ConversationEvent {
  type: 'user' | 'ai' | 'system' | 'error'
  message: string
  timestamp: Date
  details?: string
}

const conversationEvents = ref<ConversationEvent[]>([])
const historyContainer = ref<HTMLElement | null>(null)

function scrollHistoryToBottom() {
  const el = historyContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function addEvent(event: ConversationEvent) {
  conversationEvents.value.push(event)
  // Auto-scroll to bottom
  nextTick(() => {
    scrollHistoryToBottom()
    requestAnimationFrame(() => scrollHistoryToBottom())
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// WebSocket client setup
const wsClient = shallowRef<ReturnType<typeof useWebSocketClient> | null>(null)
const isWsConnecting = ref(false)
const isWsDisconnecting = ref(false)
const isConversationStarting = ref(false)
const isConversationEnding = ref(false)
const isSendingMessage = ref(false)
const isRunningAction = ref(false)
const isJumpingStage = ref(false)

const wsIsConnected = computed(() => wsClient.value?.isConnected.value || false)
const wsSessionId = computed(() => wsClient.value?.sessionId.value || null)
const isConversationActive = computed(() => wsClient.value?.isInConversation.value || false)
const conversationId = computed(() => wsClient.value?.conversationId.value || null)

const canConnectWebSocket = computed(() => {
  return !!selectedApiKey.value?.key && !wsIsConnected.value && !isWsConnecting.value && !isWsDisconnecting.value
})

const canDisconnectWebSocket = computed(() => {
  return wsIsConnected.value && !isWsConnecting.value && !isWsDisconnecting.value && !isConversationActive.value
})

const canStartConversation = computed(() => {
  return wsIsConnected.value && !isConversationActive.value && !isWsConnecting.value && !isWsDisconnecting.value && !isConversationStarting.value && !isConversationEnding.value
})

const canEndConversation = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value
})

const canRunAction = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isRunningAction.value
})

const canJumpToStage = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isJumpingStage.value
})

const canSendMessage = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isSendingMessage.value
})

async function connectWebSocket() {
  if (!canConnectWebSocket.value) return

  const apiKey = selectedApiKey.value?.key
  if (!apiKey) return

  try {
    isWsConnecting.value = true

    addEvent({
      type: 'system',
      message: 'Connecting to WebSocket server...',
      timestamp: new Date()
    })

    const client = useWebSocketClient(apiKey, {
      onConnect: () => {
        addEvent({
          type: 'system',
          message: 'Connected to WebSocket',
          timestamp: new Date()
        })
      },
      onDisconnect: () => {
        addEvent({
          type: 'system',
          message: 'Disconnected from WebSocket',
          timestamp: new Date()
        })
      },
      onError: (error) => {
        addEvent({
          type: 'error',
          message: error.error,
          timestamp: new Date()
        })
      },
      onAiVoiceStart: (msg: StartAiVoiceOutputMessage) => {
        addEvent({
          type: 'system',
          message: 'AI voice output started',
          timestamp: new Date(),
          details: `Voice Output ID: ${msg.voiceOutputId}`
        })
      },
      onAiVoiceChunk: (msg: SendAiVoiceChunkMessage) => {
        if (msg.isFinal) {
          addEvent({
            type: 'system',
            message: 'AI voice output completed',
            timestamp: new Date(),
            details: `Received ${msg.ordinal + 1} audio chunks`
          })
        }
      },
      onAiVoiceEnd: (msg: EndAiVoiceOutputMessage) => {
        const fullText = msg.fullText?.trim()
        if (fullText) {
          addEvent({
            type: 'ai',
            message: fullText,
            timestamp: new Date(),
            details: `Voice Output ID: ${msg.voiceOutputId}`
          })
          return
        }

        addEvent({
          type: 'system',
          message: 'AI voice output ended',
          timestamp: new Date(),
          details: `Voice Output ID: ${msg.voiceOutputId}`
        })
      }
    })

    wsClient.value = client
    await client.connect()

    if (wsSessionId.value) {
      addEvent({
        type: 'system',
        message: 'WebSocket session established',
        timestamp: new Date(),
        details: `Session ID: ${wsSessionId.value}`
      })
    }
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
    wsClient.value?.disconnect()
    wsClient.value = null
  } finally {
    isWsConnecting.value = false
  }
}

async function disconnectWebSocket() {
  if (!wsClient.value) return
  if (isConversationActive.value) {
    addEvent({
      type: 'error',
      message: 'End the conversation before disconnecting',
      timestamp: new Date()
    })
    return
  }
  if (isWsDisconnecting.value) return

  try {
    isWsDisconnecting.value = true
    wsClient.value.disconnect()
    wsClient.value = null
  } finally {
    isWsDisconnecting.value = false
  }
}

// State
const messageInput = ref('')
const currentStage = ref<StageResponse | null>(null)
const showStartConversationModal = ref(false)
const showRunActionDialog = ref(false)
const showJumpToStageDialog = ref(false)

// Methods
function startConversation() {
  if (!wsIsConnected.value) {
    addEvent({
      type: 'error',
      message: 'Please connect to WebSocket first',
      timestamp: new Date()
    })
    return
  }
  if (isConversationActive.value || isConversationStarting.value || showStartConversationModal.value) {
    return
  }
  showStartConversationModal.value = true
}

/**
 * Ensure a user exists for the current admin
 * If not, create one with the admin's ID and basic profile
 */
async function ensureUserExists(): Promise<string> {
  const adminId = authStore.currentAdmin?.id
  if (!adminId) {
    throw new Error('No authenticated admin found')
  }

  try {
    // Try to fetch the user by admin ID
    const user = await usersStore.fetchById(adminId)
    if (user) {
      return adminId
    }
  } catch (error) {
    // User doesn't exist (404), so we'll create it
  }

  // Create user with admin ID
  try {
    addEvent({
      type: 'system',
      message: `Creating user profile for admin: ${authStore.currentAdmin?.name}`,
      timestamp: new Date()
    })

    await usersStore.create({
      id: adminId,
      profile: {
        name: authStore.currentAdmin?.name || 'Admin User',
        type: 'admin',
        createdVia: 'playground'
      }
    })

    addEvent({
      type: 'system',
      message: 'User profile created successfully',
      timestamp: new Date()
    })

    return adminId
  } catch (error) {
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function handleStartConversation(stage: StageResponse) {
  if (!wsClient.value) return
  if (isConversationStarting.value || isConversationEnding.value) return

  try {
    isConversationStarting.value = true
    addEvent({
      type: 'system',
      message: `Starting conversation with stage: ${stage.name}`,
      timestamp: new Date()
    })

    // Ensure user exists before starting conversation
    const userId = await ensureUserExists()

    const convId = await wsClient.value.startConversation({
      userId: userId,
      stageId: stage.id,
      personaId: stage.personaId
    })

    currentStage.value = stage
    
    addEvent({
      type: 'system',
      message: 'Conversation started successfully',
      timestamp: new Date(),
      details: `Conversation ID: ${convId}, User ID: ${userId}`
    })
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationStarting.value = false
  }
}

async function handleJumpToStage(stage: StageResponse) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (isJumpingStage.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isJumpingStage.value = true
    addEvent({
      type: 'system',
      message: `Jumping to stage: ${stage.name}`,
      timestamp: new Date()
    })

    await wsClient.value.client.value.goToStage(stage.id)
    currentStage.value = stage
    
    addEvent({
      type: 'system',
      message: `Successfully moved to stage: ${stage.name}`,
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to jump to stage: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isJumpingStage.value = false
  }
}

async function endConversation() {
  if (!wsClient.value) return
  if (isConversationEnding.value || isConversationStarting.value) return

  try {
    isConversationEnding.value = true
    addEvent({
      type: 'system',
      message: 'Ending conversation...',
      timestamp: new Date()
    })

    await wsClient.value.endConversation()
    currentStage.value = null
    
    addEvent({
      type: 'system',
      message: 'Conversation ended successfully',
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to end conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationEnding.value = false
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !wsClient.value) return
  if (!canSendMessage.value) return
  
  const message = messageInput.value.trim()
  
  try {
    isSendingMessage.value = true
    addEvent({
      type: 'user',
      message: message,
      timestamp: new Date()
    })

    await wsClient.value.sendTextInput(message)
    messageInput.value = ''
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isSendingMessage.value = false
  }
}

async function handleRunAction(data: { type: 'global' | 'stage'; actionKey: string; parameters: Record<string, any> }) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (!canRunAction.value) return

  try {
    isRunningAction.value = true
    addEvent({
      type: 'system',
      message: `Running action: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Parameters: ${JSON.stringify(data.parameters)}`
    })

    // Convert parameters object to array format expected by the API
    const paramsArray = Object.values(data.parameters)
    const result = await wsClient.value.client.value.runAction(data.actionKey, paramsArray)
    
    addEvent({
      type: 'system',
      message: `Action completed: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Result: ${JSON.stringify(result)}`
    })
    
    showRunActionDialog.value = false
  } catch (error) {
    addEvent({
      type: 'error',
      message: `Failed to run action: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isRunningAction.value = false
  }
}
</script>
