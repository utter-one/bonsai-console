<template>
  <!-- No Project Selected State -->
  <NoProjectSelected
    v-if="!hasProject"
    description="Please select a project from the dropdown in the top navigation bar to use the Playground."
  />

  <!-- No Active API Keys State -->
  <div v-else-if="hasProject && !apiKeysLoading && activeApiKeys.length === 0"
    class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-[calc(100vh-7rem)] overflow-hidden">
    <div class="text-center max-w-md">
      <AlertCircle class="mx-auto mb-4 text-gray-400 dark:text-gray-500" :size="64" />
      <h2 class="text-2xl font-semibold text-gray-900 mb-2 dark:text-white">No Active API Keys</h2>
      <p class="text-gray-600 mb-6 dark:text-gray-400">
        This project doesn't have any active API keys. Please create an API key to use the Playground.
      </p>
      <button @click="goToApiKeys"
        class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600">
        Manage API Keys
      </button>
    </div>
  </div>

  <!-- Main Playground UI -->
  <div v-else-if="hasProject && (apiKeysLoading || activeApiKeys.length > 0)"
    class="flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-[calc(100vh-7rem)]">
    <!-- Header -->
    <div class="flex-shrink-0">
      <div class="flex md:flex-row flex-col md:items-center justify-between">
        <div>
          <div class="flex items-center">
            <h1 class="page-title">Playground</h1>
            <div class="ml-2 w-3 h-3 rounded-full"
              :class="wsIsConnected ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'"></div>
            <div class="text-gray-900 text-sm dark:text-gray-500 ml-2">{{ wsIsConnected ? 'Connected' : 'Disconnected' }}</div>
          </div>
          <p class="page-subtitle">Test and debug conversation flows in real-time</p>
        </div>

        <PlaygroundConnectionPanel
          :is-connected="wsIsConnected"
          :is-conversation-active="isConversationActive"
          :is-conversation-starting="isConversationStarting"
          :is-conversation-ending="isConversationEnding"
          :can-start-conversation="canStartConversation"
          :can-end-conversation="canEndConversation"
          :can-run-action="canRunAction"
          :can-jump-to-stage="canJumpToStage"
          :can-call-tool="canCallTool"
          :can-set-variable="canSetVariable"
          :api-keys="activeApiKeys"
          :api-keys-loading="apiKeysLoading"
          v-model:selected-api-key-id="selectedApiKeyId"
          v-model:selected-timezone="selectedTimezone"
          v-model:connection-type="connectionType"
          :selected-conversation-mode="selectedConversationMode"
          :available-presets="availablePresets"
          :conversation-presets="conversationPresets"
          @start-conversation="startConversation"
          @end-conversation="endConversation"
          @preset-select="handlePresetSelect"
          @run-action="showRunActionDialog = true"
          @jump-to-stage="showJumpToStageDialog = true"
          @call-tool="showCallToolDialog = true"
          @set-variable="showSetVariableDialog = true"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-h-0 pt-4 gap-4 overflow-hidden pb-15 md:pb-0">
      <!-- History Panel (Main Area) -->
      <PlaygroundEventFeed
        :events="conversationEvents"
        :entity-names="entityNames"
        :project-id="projectId"
        :session-id="currentConversationId ?? undefined"
        :stage-id="currentStage?.id ?? undefined"
        :show-system-events="showSystemEvents"
        v-model:show-conversation-events="showConversationEvents"
        :get-voice-output="getVoiceOutput"
      />
      <!-- Input Panel -->
      <div
        class="fixed md:relative bottom-0 left-0 right-0 flex-shrink-0 bg-white md:rounded-lg md:border border-t border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700 ">
        <div class="flex flex-row items-end md:items-start gap-0 md:gap-3">
          <!-- Voice Recording -->
          <PlaygroundAudioPanel
            :is-server-vad-mode="isServerVadMode"
            :can-record-voice="canRecordVoice"
            :recording="recording"
            :audio-settings="audioSettings"
            :sample-rate="parseSampleRate(wsClient?.projectSettings.value?.asrConfig?.settings?.audioFormat)"
            :is-input-focused="isInputFocused"
            @start-recording="startVoiceRecording"
            @stop-recording="stopVoiceRecording"
            @settings-save="handleAudioSettingsSave"
          />

          <!-- Text Input -->
          <div class="flex flex-col gap-2 flex-1 w-full">
            <label class="hidden md:block mb-1.5 font-medium text-gray-900 dark:text-gray-200">Message</label>
            <div class="flex w-full gap-2 items-end">
              <textarea v-model="messageInput"
               @focus="isInputFocused = true"
                @blur="handleInputBlur"
                class="form-textarea w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-primary-400 transition-all duration-300 ease-in-out"
                rows="1" 
                placeholder="Type your message here..."
                :disabled="!canSendMessage || recording?.recordingState === 'recording'"
                @keydown.enter.exact.prevent="sendMessage" 
                style="min-height: 42px; max-height: 120px;" 
                />

              <!-- Send Button -->
              <button class="btn-primary items-center justify-center transition-all duration-300 ease-in-out w-14 px-0 w-auto"
                :disabled="!canSendMessage || !messageInput.trim() || recording?.recordingState === 'recording'"
                @click="sendMessage">
                <Send :size="20" />
              </button>
            </div>

            </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <StageSelectionModal v-if="showStartConversationModal" :project-id="projectId" title="Start Conversation"
      :default-stage-id="projectSelectionStore.selectedProject?.startingStageId"
      @close="showStartConversationModal = false" @select="handleStartConversation" />

    <StageSelectionModal v-if="showJumpToStageDialog" :project-id="projectId" title="Jump to Stage"
      @close="showJumpToStageDialog = false" @select="handleJumpToStage" />

    <RunActionModal v-if="showRunActionDialog" :global-actions="globalActions" :current-stage="currentStage"
      @close="showRunActionDialog = false" @call="handleRunAction" />

    <CallToolModal v-if="showCallToolDialog" :project-id="projectId"
      @close="showCallToolDialog = false" @call="handleCallTool" />

    <SetVariableModal v-if="showSetVariableDialog" :current-stage="currentStage"
      @close="showSetVariableDialog = false" @set="handleSetVariable" />

  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useProjectSelectionStore, usePlaygroundStore, useGlobalActionsStore, useApiKeysStore, useAuthStore, useUsersStore, useConversationsStore, useStagesStore, useClassifiersStore, useContextTransformersStore } from '@/stores'
import NoProjectSelected from '@/components/NoProjectSelected.vue'
import { useWebSocketClient } from '@/composables/useWebSocketClient'
import { useWebRtcClient } from '@/composables/useWebRtcClient'
import { useAudioPlayback } from '@/composables/useAudioPlayback'
import { useAudioRecording } from '@/composables/useAudioRecording'
import { AlertCircle, Send } from 'lucide-vue-next'
import StageSelectionModal from '@/components/modals/StageSelectionModal.vue'
import RunActionModal from '@/components/modals/RunActionModal.vue'
import CallToolModal from '@/components/modals/CallToolModal.vue'
import SetVariableModal from '@/components/modals/SetVariableModal.vue'
import PlaygroundEventFeed from '@/components/playground/PlaygroundEventFeed.vue'
import PlaygroundConnectionPanel from '@/components/playground/PlaygroundConnectionPanel.vue'
import PlaygroundAudioPanel from '@/components/playground/PlaygroundAudioPanel.vue'
import type { StageResponse, ConversationEventResponse } from '@/api/types'
import type { SendAiVoiceChunk, StartAiGenerationOutput, EndAiGenerationOutput, UserTranscribedChunk, AiTranscribedChunk, ConversationEvent as WSConversationEvent, ConversationEventUpdate as WSConversationEventUpdate } from '@/api/websocket/websocket-contracts'

// Audio settings persistence
interface AudioSettings {
  deviceId: string | null
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

const AUDIO_SETTINGS_KEY = 'bonsai_audio_settings'

function loadAudioSettings(): AudioSettings {
  try {
    const stored = localStorage.getItem(AUDIO_SETTINGS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load audio settings:', error)
  }
  // Default settings
  return {
    deviceId: null,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
}

function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save audio settings:', error)
  }
}

// Conversation mode presets and playground preferences
interface SessionSettings {
  sendVoiceInput: boolean
  sendTextInput: boolean
  receiveVoiceOutput: boolean
  receiveTranscriptionUpdates: boolean
  receiveEvents: boolean
}

type ConversationMode = 'text-only' | 'voice-input' | 'voice-output' | 'full-voice'

interface ConversationPreset {
  id: ConversationMode
  name: string
  description: string
  sessionSettings: SessionSettings
}

interface PlaygroundPreferences {
  lastApiKeyId: string | null
  lastStageId: string | null
  showSystemEvents: boolean
  showConversationEvents: boolean
  conversationMode: ConversationMode
  timezone: string
  connectionType?: 'websocket' | 'webrtc'
}

interface PlaygroundPreferencesStorage {
  [projectId: string]: PlaygroundPreferences
}

const PLAYGROUND_PREFS_KEY = 'bonsai_playground_prefs'

const conversationPresets: ConversationPreset[] = [
  {
    id: 'text-only',
    name: 'Text Only',
    description: 'Text input and output only',
    sessionSettings: {
      sendVoiceInput: false,
      sendTextInput: true,
      receiveVoiceOutput: false,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'voice-input',
    name: 'Voice Input + Text',
    description: 'Speak to the AI, receive text responses',
    sessionSettings: {
      sendVoiceInput: true,
      sendTextInput: true,
      receiveVoiceOutput: false,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'voice-output',
    name: 'Text + Voice Output',
    description: 'Type messages, hear AI responses',
    sessionSettings: {
      sendVoiceInput: false,
      sendTextInput: true,
      receiveVoiceOutput: true,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'full-voice',
    name: 'Full Voice',
    description: 'Complete voice conversation',
    sessionSettings: {
      sendVoiceInput: true,
      sendTextInput: true,
      receiveVoiceOutput: true,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  }
]

function loadPlaygroundPreferences(projectId: string): PlaygroundPreferences {
  try {
    const stored = localStorage.getItem(PLAYGROUND_PREFS_KEY)
    if (stored) {
      const allPrefs: PlaygroundPreferencesStorage = JSON.parse(stored)
      if (allPrefs[projectId]) {
        return allPrefs[projectId]
      }
    }
  } catch (error) {
    console.error('Failed to load playground preferences:', error)
  }
  // Default preferences
  return {
    lastApiKeyId: null,
    lastStageId: null,
    showSystemEvents: false,
    showConversationEvents: true,
    conversationMode: 'full-voice', // Default to full voice
    timezone: '',
    connectionType: 'websocket',
  }
}

function savePlaygroundPreferences(projectId: string, prefs: PlaygroundPreferences): void {
  try {
    const stored = localStorage.getItem(PLAYGROUND_PREFS_KEY)
    const allPrefs: PlaygroundPreferencesStorage = stored ? JSON.parse(stored) : {}
    allPrefs[projectId] = prefs
    localStorage.setItem(PLAYGROUND_PREFS_KEY, JSON.stringify(allPrefs))
  } catch (error) {
    console.error('Failed to save playground preferences:', error)
  }
}

const router = useRouter()
const route = useRoute()
const projectSelectionStore = useProjectSelectionStore()
const playgroundStore = usePlaygroundStore()
const globalActionsStore = useGlobalActionsStore()
const apiKeysStore = useApiKeysStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()
const stagesStore = useStagesStore()
const classifiersStore = useClassifiersStore()
const contextTransformersStore = useContextTransformersStore()

// Project selection - use route params as source of truth
const projectId = computed(() => route.params.projectId as string || '')
const hasProject = computed(() => !!projectId.value)

const entityNames = computed(() => ({
  stages: Object.fromEntries(stagesStore.items.map(s => [s.id, s.name])),
  classifiers: Object.fromEntries(classifiersStore.items.map(c => [c.id, c.name])),
  transformers: Object.fromEntries(contextTransformersStore.items.map(t => [t.id, t.name])),
}))

// Sync route projectId with store on mount and route changes
onMounted(() => {
  if (projectId.value) {
    projectSelectionStore.setSelectedProjectId(projectId.value)
    // Re-fetch project to get latest voice settings (user may have changed them while away)
    projectSelectionStore.refreshSelectedProject()
  }
})

onBeforeRouteLeave(() => {
  stopAllAudioPlayback()
  playgroundStore.setConversationActive(false)
})

// Load global actions and API keys when project changes
watch(projectId, async (newProjectId, oldProjectId) => {
  // Clean up previous project's state when switching projects
  if (oldProjectId && oldProjectId !== newProjectId) {
    stopAllAudioPlayback()
    wsClient.value?.disconnect()
    wsClient.value = null
    conversationEvents.value = []
    currentStage.value = null
    currentConversationId.value = null
    resumeConversationId.value = null
    selectedApiKeyId.value = null
    messageInput.value = ''
    showStartConversationModal.value = false
    showRunActionDialog.value = false
    showJumpToStageDialog.value = false
    showCallToolDialog.value = false
    showSetVariableDialog.value = false
  }

  if (newProjectId) {
    await Promise.all([
      globalActionsStore.fetchAll(newProjectId),
      apiKeysStore.fetchAll(newProjectId, { filters: { isActive: true } }),
      stagesStore.fetchAll(newProjectId, { limit: 1000 }),
      classifiersStore.fetchAll(newProjectId, { limit: 1000 }),
      contextTransformersStore.fetchAll(newProjectId, { limit: 1000 }),
    ])

    // Check if resuming from query params
    const queryConversationId = route.query.conversationId as string | undefined
    const queryApiKeyId = route.query.apiKeyId as string | undefined

    if (queryConversationId && queryApiKeyId) {
      // Resume flow: pre-select API key and store conversation ID
      resumeConversationId.value = queryConversationId
      selectedApiKeyId.value = queryApiKeyId

      // Load preferences but don't overwrite the resume API key
      const prefs = loadPlaygroundPreferences(newProjectId)
      showSystemEvents.value = prefs.showSystemEvents
      showConversationEvents.value = prefs.showConversationEvents
      selectedConversationMode.value = prefs.conversationMode
      selectedTimezone.value = prefs.timezone ?? ''
      connectionType.value = prefs.connectionType ?? 'websocket'

      // Clear query params from URL
      router.replace({ 
        name: route.name!, 
        params: route.params,
        query: {} 
      })

      // Auto-connect and resume
      await handleResumeConversation()
    } else {
      // Normal flow: load preferences and auto-select first active API key
      const prefs = loadPlaygroundPreferences(newProjectId)
      selectedApiKeyId.value = prefs.lastApiKeyId
      showSystemEvents.value = prefs.showSystemEvents
      showConversationEvents.value = prefs.showConversationEvents
      selectedConversationMode.value = prefs.conversationMode
      selectedTimezone.value = prefs.timezone ?? ''
      connectionType.value = prefs.connectionType ?? 'websocket'

      // Auto-select first active API key if saved preference doesn't match any key in this project
      const firstActiveKey = activeApiKeys.value[0]
      const savedKeyExists = selectedApiKeyId.value && activeApiKeys.value.some(k => k.id === selectedApiKeyId.value)
      if (firstActiveKey && !savedKeyExists) {
        selectedApiKeyId.value = firstActiveKey.id
      }
    }
  }
}, { immediate: true })

function goToApiKeys() {
  router.push({ name: 'administration.projects', params: { projectId: projectId.value } })
}

// Computed
const globalActions = computed(() => {
  if (!projectId.value) return []
  return globalActionsStore.items
})

const activeApiKeys = computed(() => {
  if (!projectId.value) return []
  return apiKeysStore.items.filter(key => key.isActive && key.projectId === projectId.value)
})

const apiKeysLoading = computed(() => apiKeysStore.isLoading)

// WebSocket and conversation state
const selectedApiKeyId = ref<string | null>(null)
const selectedApiKey = computed(() => {
  if (!selectedApiKeyId.value) return null
  return apiKeysStore.items.find(k => k.id === selectedApiKeyId.value)
})

// Resume conversation state
const resumeConversationId = ref<string | null>(null)
const isResuming = ref(false)

// Conversation mode and preferences
const selectedConversationMode = ref<ConversationMode>('full-voice')
const selectedTimezone = ref('')
const connectionType = ref<'websocket' | 'webrtc'>('websocket')
const showSystemEvents = ref(false)
const showConversationEvents = ref(true)

// Note: Preferences loading is now handled in the main projectId watch above to avoid conflicts with resume flow

// Save preferences when they change
watch([selectedApiKeyId, showSystemEvents, showConversationEvents, selectedConversationMode, selectedTimezone, connectionType], () => {
  if (projectId.value) {
    const prefs: PlaygroundPreferences = {
      lastApiKeyId: selectedApiKeyId.value,
      lastStageId: null,
      showSystemEvents: showSystemEvents.value,
      showConversationEvents: showConversationEvents.value,
      conversationMode: selectedConversationMode.value,
      timezone: selectedTimezone.value,
      connectionType: connectionType.value,
    }
    savePlaygroundPreferences(projectId.value, prefs)
  }
})

// Get session settings for selected mode
const currentSessionSettings = computed(() => {
  const preset = conversationPresets.find(p => p.id === selectedConversationMode.value)
  return preset?.sessionSettings
})

// Conversation event log
interface ConversationEvent {
  type: 'User' | 'AI' | 'System' | 'Error' | 'ConversationEvent'
  message: string
  timestamp: Date
  details?: string
  voiceOutputId?: string // Link to voice output for audio playback
  inputTurnId?: string // Link to input turn for real-time transcription
  outputTurnId?: string // Link to output turn for real-time transcription
  isRealTime?: boolean // Whether this is a real-time updating text
  transcriptChunks?: Array<{ chunkId: string; text: string; isFinal: boolean }> // Array to maintain insertion order
  wsEvent?: WSConversationEvent | WSConversationEventUpdate // Raw WebSocket conversation event for detailed display
}

const conversationEvents = ref<ConversationEvent[]>([])

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Voice output tracking
const activeVoiceOutputs = ref<Map<string, { player: ReturnType<typeof useAudioPlayback>; transcript: string | null }>>(new Map())

/**
 * Get voice output by ID
 */
function getVoiceOutput(voiceOutputId: string) {
  return activeVoiceOutputs.value.get(voiceOutputId)
}

function scrollHistoryToBottom() {}

function addEvent(event: ConversationEvent) {
  conversationEvents.value.push(event)
}

/**
 * Update user transcript with real-time ASR chunks
 */
function updateUserTranscript(msg: UserTranscribedChunk) {
  console.log('Received user chunk:', msg.chunkId, 'Text:', msg.chunkText, 'isFinal:', msg.isFinal)

  // Find or create the event for this input turn
  let event = conversationEvents.value.find(e => e.inputTurnId === msg.inputTurnId && e.type === 'User')

  if (!event) {
    // Create new event for this input turn
    event = {
      type: 'User',
      message: '',
      timestamp: new Date(),
      inputTurnId: msg.inputTurnId,
      isRealTime: true,
      transcriptChunks: []
    }
    conversationEvents.value.push(event)
    console.log('Created new event for inputTurnId:', msg.inputTurnId)
  }

  // Initialize transcriptChunks if not exists
  if (!event.transcriptChunks) {
    event.transcriptChunks = []
  }

  // Find existing chunk by chunkId
  const existingIndex = event.transcriptChunks.findIndex(c => c.chunkId === msg.chunkId)

  if (existingIndex >= 0) {
    console.log('Updating existing chunk at index:', existingIndex)
    // Update existing chunk
    event.transcriptChunks[existingIndex] = {
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    }
  } else {
    console.log('Adding new chunk, current array length:', event.transcriptChunks.length)
    // Add new chunk to array
    event.transcriptChunks.push({
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    })
  }

  console.log('Total chunks:', event.transcriptChunks.length, 'Chunks:', event.transcriptChunks.map(c => c.chunkId))

  // Rebuild message from chunks in array order
  event.message = event.transcriptChunks.map(chunk => chunk.text.trim()).join(' ')

  console.log('Final message:', event.message)

  // Auto-scroll to bottom
  nextTick(() => scrollHistoryToBottom())
}

/**
 * Update AI transcript with real-time text streaming chunks
 */
function updateAiTranscript(msg: AiTranscribedChunk) {
  // Find existing event for this output turn (may have voice output)
  let event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')

  if (!event) {
    // Create new event for this output turn (text-only AI response)
    event = {
      type: 'AI',
      message: '',
      timestamp: new Date(),
      outputTurnId: msg.outputTurnId,
      isRealTime: true,
      transcriptChunks: []
    }
    conversationEvents.value.push(event)
  }

  // Initialize transcriptChunks if not exists
  if (!event.transcriptChunks) {
    event.transcriptChunks = []
  }

  // Find existing chunk by chunkId
  const existingIndex = event.transcriptChunks.findIndex(c => c.chunkId === msg.chunkId)

  if (existingIndex >= 0) {
    // Update existing chunk
    event.transcriptChunks[existingIndex] = {
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    }
  } else {
    // Add new chunk to array
    event.transcriptChunks.push({
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    })
  }

  // Rebuild message from chunks in array order
  event.message = event.transcriptChunks.map(chunk => chunk.text).join('')

  // Mark as not real-time if this chunk is final
  if (msg.isFinal) {
    event.isRealTime = false
  }

  // Auto-scroll to bottom
  nextTick(() => scrollHistoryToBottom())
}
function isMessageEvent(event: WSConversationEvent | WSConversationEventUpdate): event is (WSConversationEvent | WSConversationEventUpdate) & {
  eventType: 'message'
  eventData: { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'message'
}

const TERMINAL_CONVERSATION_EVENTS = new Set(['conversation_end', 'conversation_aborted', 'conversation_failed'] as ConversationEventResponse['eventType'][])

/**
 * Handle conversation event from WebSocket
 */
async function handleConversationEvent(event: WSConversationEvent) {
  // Handle terminal events - conversation ended server-side
  if (TERMINAL_CONVERSATION_EVENTS.has(event.eventType)) {
    // Add the event to history first
    addEvent({
      type: 'ConversationEvent',
      message: formatEventType(event.eventType as string),
      timestamp: new Date(),
      wsEvent: event
    })
    // Reset conversation state without calling endConversation() on the server
    currentStage.value = null
    if (wsClient.value) {
      wsClient.value.isInConversation.value = false
    }
    recording.value?.stopRecording()
    // If endConversation() is already in flight, skip disconnecting here — the terminal
    // event arrived before the end_conversation_response. Let endConversation() handle
    // cleanup so it doesn't get an unexpected "WebSocket connection closed" rejection.
    if (!isConversationEnding.value) {
      await disconnectWebSocket()
    }
    return
  }

  // Handle message events - update existing events with final metadata
  if (isMessageEvent(event)) {
    // For AI messages, first try to match by outputTurnId (handles filler response case where
    // the final event text differs from what was accumulated via transcript chunks)
    let existingEvent: ConversationEvent | undefined
    if (event.eventData.role === 'assistant' && event.outputTurnId) {
      existingEvent = conversationEvents.value.find(e =>
        e.type === 'AI' && e.outputTurnId === event.outputTurnId
      )
    }
    // Fall back to text matching (for user messages or when no outputTurnId match)
    if (!existingEvent) {
      existingEvent = conversationEvents.value.find(e =>
        (e.type === 'User' && event.eventData.role === 'user' && e.message.trim() === event.eventData.text.trim()) ||
        (e.type === 'AI' && event.eventData.role === 'assistant' && e.message.trim() === event.eventData.text.trim())
      )
    }

    if (existingEvent) {
      // Update existing event with message event data (includes metadata with systemPrompt)
      existingEvent.wsEvent = event
      existingEvent.message = event.eventData.text
      existingEvent.isRealTime = false
    } else {
      // No existing event found - create new one (shouldn't normally happen but safe fallback)
      addEvent({
        type: event.eventData.role === 'user' ? 'User' : 'AI',
        message: event.eventData.text,
        timestamp: new Date(),
        wsEvent: event,
        isRealTime: false
      })
    }
    return
  }

  // Store the raw WebSocket event for rendering in ConversationDetailView style
  if (!currentConversationId.value && event.conversationId) {
    currentConversationId.value = event.conversationId
  }
  addEvent({
    type: 'ConversationEvent',
    message: formatEventType(event.eventType as string),
    timestamp: new Date(),
    wsEvent: event
  })
}

/**
 * Handle conversation event update from WebSocket — updates the wsEvent of an
 * existing playground event matched by outputTurnId or inputTurnId.
 */
function handleConversationEventUpdate(event: WSConversationEventUpdate) {
  let existingEvent: ConversationEvent | undefined

  if (event.outputTurnId) {
    existingEvent = conversationEvents.value.find(e =>
      e.outputTurnId === event.outputTurnId ||
      e.wsEvent?.outputTurnId === event.outputTurnId
    )
  } else if (event.inputTurnId) {
    existingEvent = conversationEvents.value.find(e =>
      e.inputTurnId === event.inputTurnId ||
      e.wsEvent?.inputTurnId === event.inputTurnId
    )
  }

  if (existingEvent) {
    existingEvent.wsEvent = event
  }
}

// WebSocket client setup
const wsClient = shallowRef<ReturnType<typeof useWebSocketClient> | ReturnType<typeof useWebRtcClient> | null>(null)
const isWsConnecting = ref(false)
const isWsDisconnecting = ref(false)
const isConversationStarting = ref(false)
const isConversationEnding = ref(false)
const isSendingMessage = ref(false)
const isRunningAction = ref(false)
const isJumpingStage = ref(false)
const isCallingTool = ref(false)

const wsIsConnected = computed(() => wsClient.value?.isConnected.value || false)
const wsSessionId = computed(() => wsClient.value?.sessionId.value || null)
const isConversationActive = computed(() => wsClient.value?.isInConversation.value || false)

// Voice capability flags — derived from project data (available immediately) with WS settings as override
const projectAcceptsVoice = computed(() => {
  const wsSettings = wsClient.value?.projectSettings.value
  if (wsSettings) return wsSettings.acceptVoice
  return projectSelectionStore.selectedProject?.acceptVoice ?? false
})

const projectGeneratesVoice = computed(() => {
  const wsSettings = wsClient.value?.projectSettings.value
  if (wsSettings) return wsSettings.generateVoice
  return projectSelectionStore.selectedProject?.generateVoice ?? false
})

// Filter presets based on project voice capabilities
const availablePresets = computed(() => {
  // If no project is loaded yet, show all
  if (!projectSelectionStore.selectedProject) {
    return conversationPresets.map(preset => ({ preset, disabled: false, reason: null }))
  }

  return conversationPresets.map(preset => {
    const needsVoiceInput = preset.sessionSettings.sendVoiceInput
    const needsVoiceOutput = preset.sessionSettings.receiveVoiceOutput

    if (needsVoiceInput && !projectAcceptsVoice.value) {
      return { preset, disabled: true, reason: 'Project does not support voice input' }
    }
    if (needsVoiceOutput && !projectGeneratesVoice.value) {
      return { preset, disabled: true, reason: 'Project does not support voice output' }
    }
    return { preset, disabled: false, reason: null }
  })
})

// Auto-switch conversation mode when the selected mode becomes unavailable
watch(availablePresets, (presets) => {
  const currentPreset = presets.find(p => p.preset.id === selectedConversationMode.value)
  if (currentPreset?.disabled) {
    const lastAvailable = [...presets].reverse().find(p => !p.disabled)
    if (lastAvailable) {
      selectedConversationMode.value = lastAvailable.preset.id
    }
  }
}, { immediate: true })

// Sync conversation active state with the store so MainLayout can block project changes
watch(isConversationActive, (active) => {
  playgroundStore.setConversationActive(active)
})

// Auto-start/stop audio streaming in VAD mode when conversation starts/ends
// We watch the combination of active+notStarting so we trigger after isConversationStarting resets
watch(
  () => isConversationActive.value && !isConversationStarting.value,
  async (readyAndActive, wasReadyAndActive) => {
    if (!isServerVadMode.value) return
    if (!projectAcceptsVoice.value) return
    if (!currentSessionSettings.value?.sendVoiceInput) return
    if (readyAndActive && !wasReadyAndActive) {
      // Conversation just became fully active — start streaming
      await nextTick()
      if (recording.value && recording.value.recordingState === 'idle') {
        await startVoiceRecording()
      }
    } else if (!isConversationActive.value) {
      // Conversation ended — stop streaming
      if (recording.value?.recordingState === 'recording') {
        recording.value.stopRecording()
      }
    }
  }
)

const canConnectWebSocket = computed(() => {
  return !!selectedApiKey.value?.key && !wsIsConnected.value && !isWsConnecting.value && !isWsDisconnecting.value
})

const canStartConversation = computed(() => {
  return !!selectedApiKey.value?.key && !isConversationActive.value && !isWsConnecting.value && !isWsDisconnecting.value && !isConversationStarting.value && !isConversationEnding.value
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

const canCallTool = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isCallingTool.value
})

const canSetVariable = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && currentStage.value !== null
})

const canSendMessage = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isSendingMessage.value
})

const canRecordVoice = computed(() => {
  const baseConditions = wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isSendingMessage.value
    && (currentSessionSettings.value?.sendVoiceInput ?? false)
  // In WebRTC mode the mic audio flows via the native RTP track — no recording composable needed
  if (connectionType.value === 'webrtc') return baseConditions
  return baseConditions && recording.value?.recordingState === 'idle'
})

// Parse sample rate from audioFormat (e.g., 'pcm_16000' -> 16000)
function parseSampleRate(audioFormat?: string): number {
  if (!audioFormat) return 16000 // Default
  const match = audioFormat.match(/(\d+)$/)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return 16000
}

// Audio recording setup - reactive based on ASR settings
const recording = ref<ReturnType<typeof useAudioRecording> | null>(null)
const isServerVadMode = computed(() => !!wsClient.value?.projectSettings.value?.asrConfig?.serverVad)

// Initialize/update recording when project settings change
watch(() => wsClient.value?.projectSettings.value, (settings) => {
  if (!settings) {
    recording.value = null
    return
  }

  const sampleRate = parseSampleRate(settings.asrConfig?.settings?.audioFormat)

  addEvent({
    type: 'System',
    message: `Audio recording configured: ${sampleRate}Hz (${settings.asrConfig?.settings?.audioFormat || 'pcm_16000'})`,
    timestamp: new Date(),
    details: settings.acceptVoice ? 'Voice input enabled' : 'Voice input disabled'
  })

  // Create new recording instance with correct sample rate and saved settings
  recording.value = useAudioRecording({
    sampleRate,
    chunkDurationMs: 750, // 0.75 second per chunk
    deviceId: audioSettings.value.deviceId ?? undefined,
    echoCancellation: audioSettings.value.echoCancellation,
    noiseSuppression: audioSettings.value.noiseSuppression,
    autoGainControl: audioSettings.value.autoGainControl,
    ...(connectionType.value !== 'webrtc' ? {
      onChunk: async (base64Audio: string) => {
        const client = wsClient.value as ReturnType<typeof useWebSocketClient> | null
        if (!client) return
        if (isConversationEnding.value || !isConversationActive.value) return
        try {
          if (isServerVadMode.value) {
            await client.sendVadVoiceChunk(base64Audio)
          } else {
            await client.sendVoiceChunk(base64Audio)
          }
        } catch (error) {
          if (isConversationEnding.value || !isConversationActive.value) return
          console.error('Failed to send voice chunk:', error)
          addEvent({
            type: 'Error',
            message: `Failed to send audio: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date()
          })
        }
      },
    } : {}),
    onError: (error: Error) => {
      addEvent({
        type: 'Error',
        message: `Recording error: ${error.message}`,
        timestamp: new Date()
      })
    }
  })
}, { immediate: true })

async function startVoiceRecording() {
  if (!canRecordVoice.value || !wsClient.value) return
  if (connectionType.value !== 'webrtc' && !recording.value) return

  stopAllAudioPlayback()

  try {
    if (isServerVadMode.value && connectionType.value !== 'webrtc') {
      // Server VAD mode (WebSocket only): skip start_user_voice_input — server manages turn boundaries
      ;(wsClient.value as ReturnType<typeof useWebSocketClient>).resetVadStreaming()
    } else {
      // Standard mode: start voice input phase on backend and get inputTurnId
      const inputTurnId = await wsClient.value.startVoiceInput()

      // Pre-create user event box with inputTurnId (empty message, will be filled by chunks)
      const event: ConversationEvent = {
        type: 'User',
        message: '',
        timestamp: new Date(),
        inputTurnId: inputTurnId,
        isRealTime: true,
        transcriptChunks: []
      }
      conversationEvents.value.push(event)

      // Auto-scroll to show the new event
      nextTick(() => scrollHistoryToBottom())
    }

    // For WebSocket: start recording; for WebRTC the mic audio flows via the RTP track
    if (connectionType.value !== 'webrtc' && recording.value) {
      await recording.value.startRecording()
    }
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

async function stopVoiceRecording() {
  if (!wsClient.value) return
  if (connectionType.value !== 'webrtc' && !recording.value) return

  try {
    // For WebSocket: stop recording (will process remaining chunks)
    if (connectionType.value !== 'webrtc' && recording.value) {
      recording.value.stopRecording()
    }

    if (!isServerVadMode.value) {
      // Mark the last event not real-time anymore (in case onChunk is still processing)
      const lastEvent = conversationEvents.value[conversationEvents.value.length - 1]
      if (lastEvent) {
        lastEvent.isRealTime = false
      }

      // End voice input phase on backend
      await wsClient.value.endVoiceInput()
    }
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to end voice input: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

function handleAudioSettingsSave(settings: AudioSettings) {
  audioSettings.value = settings
  saveAudioSettings(settings)

  addEvent({
    type: 'System',
    message: 'Audio settings saved',
    timestamp: new Date(),
    details: `Device: ${settings.deviceId || 'default'}`
  })

  // Recreate recording instance with new settings if project settings exist
  if (wsClient.value?.projectSettings.value) {
    const projectSettings = wsClient.value.projectSettings.value
    const sampleRate = parseSampleRate(projectSettings.asrConfig?.settings?.audioFormat)

    recording.value = useAudioRecording({
      sampleRate,
      chunkDurationMs: 750,
      deviceId: settings.deviceId ?? undefined,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
      ...(connectionType.value !== 'webrtc' ? {
        onChunk: async (base64Audio: string) => {
          const client = wsClient.value as ReturnType<typeof useWebSocketClient> | null
          if (!client) return
          if (isConversationEnding.value || !isConversationActive.value) return
          try {
            if (isServerVadMode.value) {
              await client.sendVadVoiceChunk(base64Audio)
            } else {
              await client.sendVoiceChunk(base64Audio)
            }
          } catch (error) {
            if (isConversationEnding.value || !isConversationActive.value) return
            console.error('Failed to send voice chunk:', error)
            addEvent({
              type: 'Error',
              message: `Failed to send audio: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date()
            })
          }
        },
      } : {}),
      onError: (error: Error) => {
        addEvent({
          type: 'Error',
          message: `Recording error: ${error.message}`,
          timestamp: new Date()
        })
      }
    })
  }
}

async function connectWebSocket() {
  if (connectionType.value === 'webrtc') {
    return connectWebRTC()
  }

  if (!canConnectWebSocket.value) return

  const apiKey = selectedApiKey.value?.key
  if (!apiKey) return

  try {
    isWsConnecting.value = true

    addEvent({
      type: 'System',
      message: 'Connecting to WebSocket server...',
      timestamp: new Date()
    })

    const client = useWebSocketClient(apiKey, {
      sessionSettings: currentSessionSettings.value,
      onConnect: () => {
        addEvent({
          type: 'System',
          message: 'Connected to WebSocket',
          timestamp: new Date()
        })
      },
      onDisconnect: () => {
        addEvent({
          type: 'System',
          message: 'Disconnected from WebSocket',
          timestamp: new Date()
        })
      },
      onError: (error) => {
        addEvent({
          type: 'Error',
          message: error.error,
          timestamp: new Date()
        })
      },
      onUserTranscribedChunk: (msg: UserTranscribedChunk) => {
        updateUserTranscript(msg)
      },
      onAiOutputStart: (msg: StartAiGenerationOutput) => {
        // Find or create event for this output turn
        let event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')

        if (!event) {
          // Create new event
          event = {
            type: 'AI',
            message: '',
            timestamp: new Date(),
            outputTurnId: msg.outputTurnId
          }
          conversationEvents.value.push(event)
        }

        // Only initialize audio player if voice output is expected
        if (msg.expectVoice) {
          event.voiceOutputId = msg.outputTurnId
          const player = useAudioPlayback()
          activeVoiceOutputs.value.set(msg.outputTurnId, {
            player: player as any,
            transcript: null
          })
        }

        // Auto-scroll
        nextTick(() => scrollHistoryToBottom())
      },
      onAiVoiceChunk: async (msg: SendAiVoiceChunk) => {
        const voiceOutput = activeVoiceOutputs.value.get(msg.outputTurnId)
        if (!voiceOutput) {
          console.warn('Received audio chunk for unknown voice output:', msg.outputTurnId)
          return
        }

        // Add chunk to audio player queue
        await voiceOutput.player.addChunk({
          audioData: msg.audioData,
          audioFormat: msg.audioFormat,
          ordinal: msg.ordinal,
          isFinal: msg.isFinal,
          bitRate: msg.bitRate,
          sampleRate: msg.sampleRate,
        })
      },
      onAiOutputEnd: (msg: EndAiGenerationOutput) => {
        const voiceOutput = activeVoiceOutputs.value.get(msg.outputTurnId)
        if (voiceOutput) {
          // Store transcript for display in AudioPlayer
          voiceOutput.transcript = msg.fullText?.trim() || null
        }

        // Update the conversation event with the full text
        const event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')
        if (event && msg.fullText) {
          event.message = msg.fullText.trim()
          event.isRealTime = false

          // Auto-scroll to bottom
          nextTick(() => scrollHistoryToBottom())
        }
      },
      onAiTranscribedChunk: (msg: AiTranscribedChunk) => {
        updateAiTranscript(msg)
      },
      onConversationEvent: (event: WSConversationEvent) => {
        handleConversationEvent(event)
      },
      onConversationEventUpdate: (event: WSConversationEventUpdate) => {
        handleConversationEventUpdate(event)
      }
    })

    wsClient.value = client
    await client.connect()

    if (wsSessionId.value) {
      addEvent({
        type: 'System',
        message: 'WebSocket session established',
        timestamp: new Date(),
        details: `Session ID: ${wsSessionId.value}`
      })
    }

    // If resuming, do it after successful connection
    if (resumeConversationId.value && !isResuming.value) {
      await resumeConversation(resumeConversationId.value)
    }
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
    wsClient.value?.disconnect()
    wsClient.value = null
  } finally {
    isWsConnecting.value = false
  }
}

const webrtcRemoteAudio = ref<HTMLAudioElement | null>(null)

async function connectWebRTC() {
  if (!canConnectWebSocket.value) return

  const apiKey = selectedApiKey.value?.key
  if (!apiKey) return

  try {
    isWsConnecting.value = true

    addEvent({
      type: 'System',
      message: 'Connecting via WebRTC...',
      timestamp: new Date()
    })

    // Prepare the audio element that will receive the server's outbound audio track.
    if (!webrtcRemoteAudio.value) {
      webrtcRemoteAudio.value = new Audio()
      webrtcRemoteAudio.value.autoplay = true
    }

    const client = useWebRtcClient(apiKey, {
      microphoneConstraints: {
        echoCancellation: audioSettings.value.echoCancellation,
        noiseSuppression: audioSettings.value.noiseSuppression,
        autoGainControl: audioSettings.value.autoGainControl,
        ...(audioSettings.value.deviceId ? { deviceId: audioSettings.value.deviceId } : {}),
      },
      sessionSettings: currentSessionSettings.value,
      onRemoteStream: (stream: MediaStream) => {
        if (webrtcRemoteAudio.value) {
          webrtcRemoteAudio.value.srcObject = stream
        }
      },
      onConnect: () => {
        addEvent({
          type: 'System',
          message: 'Connected via WebRTC',
          timestamp: new Date()
        })
      },
      onDisconnect: () => {
        addEvent({
          type: 'System',
          message: 'Disconnected from WebRTC',
          timestamp: new Date()
        })
        if (webrtcRemoteAudio.value) {
          webrtcRemoteAudio.value.srcObject = null
          webrtcRemoteAudio.value = null
        }
      },
      onError: (error) => {
        addEvent({
          type: 'Error',
          message: error.error,
          timestamp: new Date()
        })
      },
      onUserTranscribedChunk: (msg: UserTranscribedChunk) => {
        updateUserTranscript(msg)
      },
      onAiOutputStart: (msg: StartAiGenerationOutput) => {
        let event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')

        if (!event) {
          event = {
            type: 'AI',
            message: '',
            timestamp: new Date(),
            outputTurnId: msg.outputTurnId
          }
          conversationEvents.value.push(event)
        }

        nextTick(() => scrollHistoryToBottom())
      },
      onAiOutputEnd: (msg: EndAiGenerationOutput) => {
        const voiceOutput = activeVoiceOutputs.value.get(msg.outputTurnId)
        if (voiceOutput) {
          voiceOutput.transcript = msg.fullText?.trim() || null
        }

        const event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')
        if (event && msg.fullText) {
          event.message = msg.fullText.trim()
          event.isRealTime = false
          nextTick(() => scrollHistoryToBottom())
        }
      },
      onAiTranscribedChunk: (msg: AiTranscribedChunk) => {
        updateAiTranscript(msg)
      },
      onConversationEvent: (event: WSConversationEvent) => {
        handleConversationEvent(event)
      },
      onConversationEventUpdate: (event: WSConversationEventUpdate) => {
        handleConversationEventUpdate(event)
      }
    })

    wsClient.value = client
    await client.connect()

    if (wsSessionId.value) {
      addEvent({
        type: 'System',
        message: 'WebRTC session established',
        timestamp: new Date(),
        details: `Session ID: ${wsSessionId.value}`
      })
    }

    if (resumeConversationId.value && !isResuming.value) {
      await resumeConversation(resumeConversationId.value)
    }
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to connect via WebRTC: ${error instanceof Error ? error.message : String(error)}`,
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
  if (isWsDisconnecting.value) return

  try {
    isWsDisconnecting.value = true

    addEvent({
      type: 'System',
      message: 'Disconnecting from WebSocket...',
      timestamp: new Date()
    })

    wsClient.value.disconnect()
    wsClient.value = null
  } finally {
    isWsDisconnecting.value = false
  }
}

// State
const messageInput = ref('')
const isInputFocused = ref(false)
const handleInputBlur = () => {
  setTimeout(() => {
    isInputFocused.value = false
  }, 200)
}
const currentStage = ref<StageResponse | null>(null)
const showStartConversationModal = ref(false)
const showRunActionDialog = ref(false)
const showJumpToStageDialog = ref(false)
const showCallToolDialog = ref(false)
const showSetVariableDialog = ref(false)
const currentConversationId = ref<string | null>(null)

// Audio settings
const audioSettings = ref<AudioSettings>(loadAudioSettings())

// Conversation mode selection
function handlePresetSelect(mode: ConversationMode) {
  selectedConversationMode.value = mode

  addEvent({
    type: 'System',
    message: `Conversation mode changed to: ${conversationPresets.find(p => p.id === mode)?.name}`,
    timestamp: new Date()
  })

  // Auto-start conversation after selecting mode
  startConversation()
}

// Methods
async function startConversation() {
  if (isConversationActive.value || isConversationStarting.value || showStartConversationModal.value) {
    return
  }

  // Auto-connect WebSocket if not connected
  if (!wsIsConnected.value) {
    await connectWebSocket()
    if (!wsIsConnected.value) {
      return // Connection failed
    }
  }

  showStartConversationModal.value = true
}

/**
 * Ensure a user exists for the current operator
 * If not, create one with the operator's ID and basic profile
 */
async function ensureUserExists(): Promise<string> {
  const operatorId = authStore.currentOperator?.id
  if (!operatorId) {
    throw new Error('No authenticated operator found')
  }

  try {
    // Try to fetch the user by operator ID
    const user = await usersStore.fetchById(projectId.value, operatorId)
    if (user) {
      return operatorId
    }
  } catch (error) {
    // User doesn't exist (404), so we'll create it
  }

  // Create user with operator ID
  try {
    addEvent({
      type: 'System',
      message: `Creating user profile for operator: ${authStore.currentOperator?.name}`,
      timestamp: new Date()
    })

    await usersStore.create(projectId.value, {
      id: operatorId,
      profile: {
        name: authStore.currentOperator?.name || 'Operator User',
        type: 'operator',
        createdVia: 'playground'
      }
    })

    addEvent({
      type: 'System',
      message: 'User profile created successfully',
      timestamp: new Date()
    })

    return operatorId
  } catch (error) {
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function handleStartConversation(stage: StageResponse | null) {
  if (!wsClient.value) return
  if (isConversationStarting.value || isConversationEnding.value) return

  try {
    isConversationStarting.value = true

    // Clear conversation history when starting a new conversation
    conversationEvents.value = []
    currentConversationId.value = null
    activeVoiceOutputs.value.clear()

    addEvent({
      type: 'System',
      message: stage ? `Starting conversation with stage: ${stage.name}` : 'Starting conversation with default starting stage',
      timestamp: new Date()
    })

    // Ensure user exists before starting conversation
    const userId = await ensureUserExists()

    const convId = await wsClient.value.startConversation({
      userId: userId,
      stageId: stage?.id,
      agentId: stage?.agentId,
      timezone: selectedTimezone.value || undefined,
    })

    currentStage.value = stage

    addEvent({
      type: 'System',
      message: 'Conversation started successfully',
      timestamp: new Date(),
      details: `Conversation ID: ${convId}, User ID: ${userId}`
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationStarting.value = false
  }
}

async function handleResumeConversation() {
  if (!selectedApiKey.value) {
    addEvent({
      type: 'Error',
      message: 'No API key selected',
      timestamp: new Date()
    })
    return
  }

  // Connect if not already connected
  if (!wsIsConnected.value) {
    await connectWebSocket()
  }
}

async function resumeConversation(convId: string) {
  if (!wsClient.value) return
  if (isResuming.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isResuming.value = true

    // Clear conversation history and voice outputs
    conversationEvents.value = []
    currentConversationId.value = convId
    activeVoiceOutputs.value.clear()

    addEvent({
      type: 'System',
      message: `Loading conversation history...`,
      timestamp: new Date()
    })

    // Fetch conversation history from API
    const projectIdValue = projectId.value
    if (projectIdValue) {
      try {
        const response = await conversationsStore.fetchEvents(projectIdValue, convId, {
          orderBy: 'timestamp'
        })
        
        const historicalEvents = response.items || []
        
        // Convert API events to display format
        for (const apiEvent of historicalEvents) {
          conversationEvents.value.push(convertApiEventToDisplayEvent(apiEvent))
        }

        addEvent({
          type: 'System',
          message: `Loaded ${historicalEvents.length} historical event${historicalEvents.length !== 1 ? 's' : ''}`,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Failed to load conversation history:', error)
        addEvent({
          type: 'Error',
          message: `Failed to load conversation history: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date()
        })
      }
    }

    addEvent({
      type: 'System',
      message: `Resuming conversation: ${convId}`,
      timestamp: new Date()
    })

    await wsClient.value.resumeConversation(convId)

    addEvent({
      type: 'System',
      message: 'Conversation resumed successfully',
      timestamp: new Date(),
      details: `Conversation ID: ${convId}`
    })

    // Auto-scroll to bottom after loading history
    nextTick(() => scrollHistoryToBottom())

    // Clear the resume conversation ID after successful resume
    resumeConversationId.value = null
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to resume conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })

    // Clear the resume conversation ID on error
    resumeConversationId.value = null
  } finally {
    isResuming.value = false
  }
}

/**
 * Convert API conversation event to Playground display format
 */
function convertApiEventToDisplayEvent(apiEvent: ConversationEventResponse): ConversationEvent {
  const timestamp = apiEvent.timestamp ? new Date(apiEvent.timestamp) : new Date()
  
  // Handle message events specially (User/AI type)
  if (apiEvent.eventType === 'message' && 'role' in apiEvent.eventData) {
    const messageData = apiEvent.eventData as { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
    return {
      type: messageData.role === 'user' ? 'User' : 'AI',
      message: messageData.text || messageData.originalText || '',
      timestamp,
      wsEvent: apiEvent as any // Include raw event for metadata buttons
    }
  }
  
  // For all other events, use ConversationEvent type with wsEvent
  return {
    type: 'ConversationEvent',
    message: formatEventType(apiEvent.eventType as string),
    timestamp,
    wsEvent: apiEvent as any
  }
}

async function handleJumpToStage(stage: StageResponse | null) {
  if (!stage) return
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (isJumpingStage.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isJumpingStage.value = true
    addEvent({
      type: 'System',
      message: `Jumping to stage: ${stage.name}`,
      timestamp: new Date()
    })

    await wsClient.value.client.value.goToStage(stage.id)
    currentStage.value = stage

    addEvent({
      type: 'System',
      message: `Successfully moved to stage: ${stage.name}`,
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to jump to stage: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isJumpingStage.value = false
  }
}

async function handleCallTool(toolId: string, parameters: Record<string, any>) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (isCallingTool.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isCallingTool.value = true
    addEvent({
      type: 'System',
      message: `Calling tool: ${toolId}`,
      timestamp: new Date()
    })

    const result = await wsClient.value.client.value.callTool(toolId, parameters)

    addEvent({
      type: 'System',
      message: `Tool executed successfully. Result: ${JSON.stringify(result, null, 2)}`,
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to call tool: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isCallingTool.value = false
  }
}

async function handleSetVariable(data: { variableName: string; variableValue: any }) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }

  if (!currentStage.value) {
    addEvent({
      type: 'Error',
      message: 'No active stage',
      timestamp: new Date()
    })
    return
  }

  try {
    addEvent({
      type: 'System',
      message: `Setting variable "${data.variableName}" in stage "${currentStage.value.name}"`,
      timestamp: new Date(),
      details: `Value: ${JSON.stringify(data.variableValue)}`
    })

    await wsClient.value.client.value.setVariable(
      currentStage.value.id,
      data.variableName,
      data.variableValue
    )

    addEvent({
      type: 'System',
      message: `Variable "${data.variableName}" set successfully`,
      timestamp: new Date()
    })

    showSetVariableDialog.value = false
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to set variable: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

async function endConversation() {
  if (!wsClient.value) return
  if (isConversationEnding.value || isConversationStarting.value) return

  try {
    isConversationEnding.value = true
    if (recording.value?.recordingState === 'recording') {
      recording.value.stopRecording()
    }
    addEvent({
      type: 'System',
      message: 'Ending conversation...',
      timestamp: new Date()
    })

    await wsClient.value.endConversation()
    currentStage.value = null

    addEvent({
      type: 'System',
      message: 'Conversation ended successfully',
      timestamp: new Date()
    })

    // Auto-disconnect WebSocket
    await disconnectWebSocket()
  } catch (error) {
    // If the WS connection closed during our end request it means the server-side
    // conversation_end event arrived first and triggered cleanup — the conversation
    // did actually end, so treat this as a success rather than an error.
    if (!wsIsConnected.value) {
      currentStage.value = null
      addEvent({
        type: 'System',
        message: 'Conversation ended successfully',
        timestamp: new Date()
      })
      if (wsClient.value) {
        await disconnectWebSocket()
      }
      return
    }
    addEvent({
      type: 'Error',
      message: `Failed to end conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationEnding.value = false
  }
}

function stopAllAudioPlayback() {
  for (const voiceOutput of activeVoiceOutputs.value.values()) {
    voiceOutput.player.stop()
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !wsClient.value) return
  if (!canSendMessage.value) return

  stopAllAudioPlayback()

  const message = messageInput.value.trim()

  try {
    isSendingMessage.value = true
    addEvent({
      type: 'User',
      message: message,
      timestamp: new Date()
    })

    await wsClient.value.sendTextInput(message)
    messageInput.value = ''
  } catch (error) {
    // If the conversation ended server-side while the message was in flight,
    // the WS teardown rejects all pending requests — suppress the noise.
    if (!isConversationActive.value) return
    addEvent({
      type: 'Error',
      message: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isSendingMessage.value = false
  }
}

async function handleRunAction(data: { type: 'global' | 'stage'; actionKey: string; parameters: Record<string, any>; parameterOrder: string[] }) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (!canRunAction.value) return

  try {
    isRunningAction.value = true
    addEvent({
      type: 'System',
      message: `Running action: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Parameters: ${JSON.stringify(data.parameters)}`
    })

    // Pass parameters as record with order information
    const result = await wsClient.value.client.value.runAction(data.actionKey, data.parameters)

    addEvent({
      type: 'System',
      message: `Action completed: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Result: ${JSON.stringify(result)}`
    })

    showRunActionDialog.value = false
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to run action: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isRunningAction.value = false
  }
}
</script>
