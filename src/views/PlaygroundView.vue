<template>
  <!-- No Project Selected State -->
  <div v-if="!hasProject" class="flex items-center justify-center h-screen bg-gray-50">
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
  <div v-else class="h-screen flex flex-col bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 class="text-2xl font-bold text-gray-900">Playground</h1>
        <p class="text-sm text-gray-600 mt-1">Test and debug conversation flows in real-time</p>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-h-0 p-6 gap-4 overflow-hidden">
        <!-- History Panel (Main Area) -->
        <div class="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-semibold text-gray-700">Conversation History</h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Placeholder for conversation events -->
            <div class="flex items-center justify-center h-full text-gray-400">
              <div class="text-center">
                <p class="text-lg font-medium">No active conversation</p>
                <p class="text-sm mt-1">Start a conversation to see events appear here</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Panel -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div class="flex gap-3 items-end">
            <!-- Text Input -->
            <div class="flex-1">
              <label class="form-label">Message</label>
              <textarea
                v-model="messageInput"
                class="form-textarea"
                rows="2"
                placeholder="Type your message here..."
                :disabled="!isConversationActive"
                @keydown.enter.ctrl="sendMessage"
              />
            </div>

            <!-- Voice Input Button -->
            <button
              class="btn-secondary h-10 w-10 flex items-center justify-center"
              :disabled="!isConversationActive"
              title="Push to talk (voice input)"
            >
              <Mic :size="20" />
            </button>

            <!-- Send Button -->
            <button
              class="btn-primary h-10 px-6"
              :disabled="!isConversationActive || !messageInput.trim()"
              @click="sendMessage"
            >
              <Send :size="20" />
            </button>

            <!-- Audio Settings -->
            <button
              class="btn-secondary h-10 w-10 flex items-center justify-center"
              title="Audio settings"
            >
              <Settings :size="20" />
            </button>
          </div>
        </div>

        <!-- Control Panel -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
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
              >
                <Play :size="18" />
                Start Conversation
              </button>
              <button
                v-else
                class="btn-danger flex items-center gap-2"
                @click="endConversation"
              >
                <Square :size="18" />
                End Conversation
              </button>
            </div>

            <div class="h-8 border-l border-gray-300"></div>

            <!-- Advanced Controls -->
            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!isConversationActive"
              @click="showCallActionDialog = true"
            >
              <Zap :size="18" />
              Call Action
            </button>

            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!isConversationActive"
              @click="showJumpToStageDialog = true"
            >
              <SkipForward :size="18" />
              Jump to Stage
            </button>

            <button
              class="btn-secondary flex items-center gap-2"
              :disabled="!isConversationActive"
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
                  :class="isConversationActive ? 'bg-green-500' : 'bg-gray-400'"
                ></div>
                <span>{{ isConversationActive ? 'Active' : 'Inactive' }}</span>
              </div>
              <div v-if="conversationId">
                <span class="text-gray-500">ID:</span>
                <span class="font-mono ml-1">{{ conversationId }}</span>
              </div>
            </div>
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
    
    <CallActionModal
      v-if="showCallActionDialog"
      :global-actions="globalActions"
      :current-stage="currentStage"
      @close="showCallActionDialog = false"
      @call="handleCallAction"
    />
    
    <!-- TODO: Add Audio Settings Modal -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectSelectionStore, useGlobalActionsStore } from '@/stores'
import { Play, Square, Send, Mic, Settings, Zap, SkipForward, RefreshCw } from 'lucide-vue-next'
import StageSelectionModal from '@/components/modals/StageSelectionModal.vue'
import CallActionModal from '@/components/modals/CallActionModal.vue'
import type { StageResponse } from '@/api/types'

const router = useRouter()
const route = useRoute()
const projectSelectionStore = useProjectSelectionStore()
const globalActionsStore = useGlobalActionsStore()

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

// Load global actions when project changes
watch(projectId, async (newProjectId) => {
  if (newProjectId) {
    await globalActionsStore.fetchAll({ filters: { projectId: newProjectId } })
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

// State
const messageInput = ref('')
const isConversationActive = ref(false)
const conversationId = ref<string | null>(null)
const currentStage = ref<StageResponse | null>(null)
const showStartConversationModal = ref(false)
const showCallActionDialog = ref(false)
const showJumpToStageDialog = ref(false)

// Methods
function startConversation() {
  showStartConversationModal.value = true
}

function handleStartConversation(stage: StageResponse) {
  isConversationActive.value = true
  conversationId.value = 'conv-' + Date.now() // Placeholder
  currentStage.value = stage
  // TODO: Implement actual conversation start logic with selected stage
  console.log('Starting conversation with stage:', stage.name)
}

function handleJumpToStage(stage: StageResponse) {
  currentStage.value = stage
  // TODO: Implement actual jump to stage logic
  console.log('Jumping to stage:', stage.name)
}

function endConversation() {
  isConversationActive.value = false
  conversationId.value = null
  // TODO: Implement actual conversation end logic
}

function sendMessage() {
  if (!messageInput.value.trim() || !isConversationActive.value) return
  
  // TODO: Implement message sending logic
  console.log('Sending message:', messageInput.value)
  messageInput.value = ''
}

function handleCallAction(data: { type: 'global' | 'stage'; actionKey: string; parameters: Record<string, any> }) {
  // TODO: Implement actual call action logic
  console.log('Calling action:', data)
  showCallActionDialog.value = false
}
</script>
