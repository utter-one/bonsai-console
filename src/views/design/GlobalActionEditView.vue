<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalActionsStore, useClassifiersStore } from '@/stores'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { GlobalActionResponse } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations, type ActionOperations } from '@/composables'

const route = useRoute()
const router = useRouter()
const globalActionsStore = useGlobalActionsStore()
const classifiersStore = useClassifiersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)

type TabType = 'basic' | 'trigger' | 'effects' | 'goToStage' | 'runScript' | 'modifyUserInput' | 'modifyVariables' | 'modifyUserProfile' | 'callTool' | 'callWebhook' | 'metadata'
const activeTab = ref<TabType>('basic')

const form = ref({
  id: '',
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  classificationTrigger: '',
  overrideClassifierId: '',
  template: '',
  examples: '',
  metadata: {}
})

const operations = ref<ActionOperations>(createDefaultOperations())

// Computed
const projectId = computed(() => route.params.projectId as string)
const globalActionId = computed(() => route.params.globalActionId as string | undefined)
const isEditMode = computed(() => !!globalActionId.value)
const currentGlobalAction = ref<GlobalActionResponse | null>(null)

const projectClassifiers = computed(() => 
  classifiersStore.items.filter(c => c.projectId === projectId.value)
)

// Lifecycle
onMounted(async () => {
  // Load classifiers for dropdown
  await classifiersStore.fetchAll({ filters: { projectId: projectId.value } })
  
  if (isEditMode.value) {
    await loadGlobalAction()
  }
})

// Methods
async function loadGlobalAction() {
  if (!globalActionId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentGlobalAction.value = await globalActionsStore.fetchById(globalActionId.value)
    if (currentGlobalAction.value) {
      form.value = {
        id: currentGlobalAction.value.id,
        name: currentGlobalAction.value.name,
        condition: currentGlobalAction.value.condition || '',
        triggerOnUserInput: currentGlobalAction.value.triggerOnUserInput,
        triggerOnClientCommand: currentGlobalAction.value.triggerOnClientCommand,
        classificationTrigger: currentGlobalAction.value.classificationTrigger || '',
        overrideClassifierId: currentGlobalAction.value.overrideClassifierId || '',
        template: currentGlobalAction.value.template || '',
        examples: currentGlobalAction.value.examples?.join('\n') || '',
        metadata: currentGlobalAction.value.metadata || {}
      }

      // Load effects from action
      loadEffectsIntoOperations(currentGlobalAction.value.effects || [], operations.value)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load global action'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    // Build effects array from enabled effects
    const { effects: effectsArray, error: buildError } = buildEffectsFromOperations(operations.value)
    
    if (buildError) {
      error.value = buildError
      isLoading.value = false
      return
    }

    if (isEditMode.value && currentGlobalAction.value) {
      // Update existing global action
      await globalActionsStore.update(currentGlobalAction.value.id, {
        version: currentGlobalAction.value.version,
        name: form.value.name,
        condition: form.value.condition || null,
        triggerOnUserInput: form.value.triggerOnUserInput,
        triggerOnClientCommand: form.value.triggerOnClientCommand,
        classificationTrigger: form.value.classificationTrigger || null,
        overrideClassifierId: form.value.overrideClassifierId || null,
        effects: effectsArray,
        template: form.value.template || null,
        examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : [],
        metadata: form.value.metadata
      })
    } else {
      // Create new global action
      const createData: any = {
        projectId: projectId.value,
        name: form.value.name,
        effects: effectsArray,
        metadata: form.value.metadata
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include optional fields if they have values
      if (form.value.condition) {
        createData.condition = form.value.condition
      }
      
      createData.triggerOnUserInput = form.value.triggerOnUserInput
      createData.triggerOnClientCommand = form.value.triggerOnClientCommand

      if (form.value.classificationTrigger) {
        createData.classificationTrigger = form.value.classificationTrigger
      }

      if (form.value.overrideClassifierId) {
        createData.overrideClassifierId = form.value.overrideClassifierId
      }

      if (form.value.template) {
        createData.template = form.value.template
      }

      if (form.value.examples) {
        createData.examples = form.value.examples.split('\n').filter((e: string) => e.trim())
      }

      await globalActionsStore.create(createData)
    }

    // Navigate back to global actions list
    router.push({ name: 'design.globalActions', params: { projectId: projectId.value } })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} global action`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.globalActions', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentGlobalAction.value) return []
  return [
    { label: 'Action ID', value: currentGlobalAction.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentGlobalAction.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentGlobalAction.value.version },
    { label: 'Created', value: currentGlobalAction.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentGlobalAction.value.updatedAt, format: 'date' as const },
  ]
})

// Effect modification helpers
function addVariableModification() {
  operations.value.modifyVariables.modifications.push({
    variableName: '',
    operation: 'set',
    value: ''
  })
}

function removeVariableModification(index: number) {
  operations.value.modifyVariables.modifications.splice(index, 1)
}

function addProfileModification() {
  operations.value.modifyUserProfile.modifications.push({
    fieldName: '',
    operation: 'set',
    value: ''
  })
}

function removeProfileModification(index: number) {
  operations.value.modifyUserProfile.modifications.splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to global actions">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEditMode ? 'Edit Global Action' : 'New Global Action' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isEditMode ? `Editing: ${currentGlobalAction?.name}` : 'Create a new system-wide action' }}
          </p>
        </div>
      </div>
      <button 
        @click="handleSubmit" 
        :disabled="isLoading"
        class="btn-primary"
      >
        <Save class="inline-block mr-2 w-4 h-4" />
        {{ isEditMode ? 'Save Changes' : 'Create Action' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mx-8 mt-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          Basic Information
        </button>
        <button
          @click="activeTab = 'trigger'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'trigger' }]"
          type="button"
        >
          Trigger Configuration
        </button>
        <button
          @click="activeTab = 'effects'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'effects' }]"
          type="button"
        >
          Effects Selection
        </button>
        <button
          v-if="operations.goToStage.enabled"
          @click="activeTab = 'goToStage'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'goToStage' }]"
          type="button"
        >
          Go To Stage
        </button>
        <button
          v-if="operations.runScript.enabled"
          @click="activeTab = 'runScript'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'runScript' }]"
          type="button"
        >
          Run Script
        </button>
        <button
          v-if="operations.modifyUserInput.enabled"
          @click="activeTab = 'modifyUserInput'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'modifyUserInput' }]"
          type="button"
        >
          Modify User Input
        </button>
        <button
          v-if="operations.modifyVariables.enabled"
          @click="activeTab = 'modifyVariables'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'modifyVariables' }]"
          type="button"
        >
          Modify Variables
        </button>
        <button
          v-if="operations.modifyUserProfile.enabled"
          @click="activeTab = 'modifyUserProfile'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'modifyUserProfile' }]"
          type="button"
        >
          Modify User Profile
        </button>
        <button
          v-if="operations.callTool.enabled"
          @click="activeTab = 'callTool'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'callTool' }]"
          type="button"
        >
          Call Tool
        </button>
        <button
          v-if="operations.callWebhook.enabled"
          @click="activeTab = 'callWebhook'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'callWebhook' }]"
          type="button"
        >
          Call Webhook
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'metadata'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]"
          type="button"
        >
          Metadata
        </button>
      </nav>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Basic Tab -->
          <div v-show="activeTab === 'basic'" class="space-y-6">
            <div v-if="!isEditMode" class="form-group">
              <label class="form-label">
                Action ID <span class="text-gray-500">(optional, auto-generated)</span>
              </label>
              <input
                v-model="form.id"
                type="text"
                placeholder="my_global_action"
                class="form-input font-mono"
              />
              <p class="form-help-text">
                Custom identifier for this action. Leave blank to auto-generate.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Display Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Transfer to Human Agent"
                class="form-input"
              />
              <p class="form-help-text">
                Human-readable name for this action
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Template <span class="text-gray-500">(optional)</span>
              </label>
              <textarea
                v-model="form.template"
                rows="3"
                class="form-textarea"
                placeholder="I'll connect you with an agent. Please hold..."
              ></textarea>
              <p class="form-help-text">
                Optional message template for the action response
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Examples <span class="text-gray-500">(optional, one per line)</span>
              </label>
              <textarea
                v-model="form.examples"
                rows="4"
                class="form-textarea"
                placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
              ></textarea>
              <p class="form-help-text">
                Example phrases that should trigger this action
              </p>
            </div>
          </div>

          <!-- Trigger Tab -->
          <div v-show="activeTab === 'trigger'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">Trigger Options <span class="required">*</span></label>
              <div class="space-y-2">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="form.triggerOnUserInput"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700">
                    Trigger on User Input
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="form.triggerOnClientCommand"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700">
                    Trigger on Client Command
                  </span>
                </label>
              </div>
              <p class="form-help-text">
                Select when this action can be triggered
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Classification Trigger <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.classificationTrigger"
                type="text"
                placeholder="transfer_request"
                class="form-input"
              />
              <p class="form-help-text">
                Classification label that triggers this action
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Override Classifier ID <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.overrideClassifierId"
                class="form-select-auto"
              >
                <option value="">No override (use stage classifiers)</option>
                <option v-for="classifier in projectClassifiers" :key="classifier.id" :value="classifier.id">
                  {{ classifier.name }}
                </option>
              </select>
              <p class="form-help-text">
                Override the stage classifier for this action
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Condition <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.condition"
                type="text"
                placeholder="context.variables.agent_available === true"
                class="form-input font-mono text-sm"
              />
              <p class="form-help-text">
                Optional JavaScript condition expression for action activation
              </p>
            </div>
          </div>

          <!-- Effects Tab -->
          <div v-show="activeTab === 'effects'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">Select Effects</label>
              <p class="form-help-text mb-3">
                Choose which effects this action should perform. Complex effects will add dedicated tabs for configuration.
              </p>
              <div class="space-y-3">
                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.endConversation.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">End Conversation</span>
                    <p class="text-xs text-gray-500">Gracefully end the conversation</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.abortConversation.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Abort Conversation</span>
                    <p class="text-xs text-gray-500">Immediately terminate the conversation</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.goToStage.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Go To Stage</span>
                    <p class="text-xs text-gray-500">Navigate to a different stage (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.runScript.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Run Script</span>
                    <p class="text-xs text-gray-500">Execute custom JavaScript code (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.modifyUserInput.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Modify User Input</span>
                    <p class="text-xs text-gray-500">Transform the user's input before processing (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.modifyVariables.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Modify Variables</span>
                    <p class="text-xs text-gray-500">Set, update, or remove conversation variables (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.modifyUserProfile.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Modify User Profile</span>
                    <p class="text-xs text-gray-500">Update user profile fields (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.callTool.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Call Tool</span>
                    <p class="text-xs text-gray-500">Invoke a registered tool (adds tab for configuration)</p>
                  </div>
                </label>

                <label class="flex items-start cursor-pointer">
                  <input
                    v-model="operations.callWebhook.enabled"
                    type="checkbox"
                    class="form-checkbox mt-0.5"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-700">Call Webhook</span>
                    <p class="text-xs text-gray-500">Make an HTTP request to an external endpoint (adds tab for configuration)</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Go To Stage Tab -->
          <div v-show="activeTab === 'goToStage'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">
                Target Stage ID <span class="required">*</span>
              </label>
              <input
                v-model="operations.goToStage.stageId"
                type="text"
                :required="operations.goToStage.enabled"
                placeholder="stage_abc123"
                class="form-input font-mono"
              />
              <p class="form-help-text">
                The ID of the stage to navigate to
              </p>
            </div>
          </div>

          <!-- Run Script Tab -->
          <div v-show="activeTab === 'runScript'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">
                JavaScript Code <span class="required">*</span>
              </label>
              <textarea
                v-model="operations.runScript.code"
                rows="10"
                :required="operations.runScript.enabled"
                class="form-textarea font-mono text-sm"
                placeholder="// Available: context, user, conversation&#10;const result = context.variables.count + 1;&#10;return { count: result };"
              ></textarea>
              <p class="form-help-text">
                JavaScript code to execute. Available objects: context, user, conversation
              </p>
            </div>
          </div>

          <!-- Modify User Input Tab -->
          <div v-show="activeTab === 'modifyUserInput'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">
                Template <span class="required">*</span>
              </label>
              <textarea
                v-model="operations.modifyUserInput.template"
                rows="4"
                :required="operations.modifyUserInput.enabled"
                class="form-textarea"
                placeholder="User wants to {{user.input}}"
              ></textarea>
              <p class="form-help-text">
                Template to transform the user input. Use <code>&#123;&#123;user.input&#125;&#125;</code> to reference original input
              </p>
            </div>
          </div>

          <!-- Modify Variables Tab -->
          <div v-show="activeTab === 'modifyVariables'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">Variable Modifications</label>
              <div class="space-y-4">
                <div
                  v-for="(mod, index) in operations.modifyVariables.modifications"
                  :key="index"
                  class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Modification {{ index + 1 }}</span>
                    <button
                      type="button"
                      @click="removeVariableModification(index)"
                      class="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label class="form-label text-sm">Variable Name</label>
                    <input
                      v-model="mod.variableName"
                      type="text"
                      placeholder="cart_total"
                      class="form-input font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label class="form-label text-sm">Operation</label>
                    <select v-model="mod.operation" class="form-select-auto text-sm">
                      <option value="set">Set</option>
                      <option value="reset">Reset</option>
                      <option value="add">Add</option>
                      <option value="remove">Remove</option>
                    </select>
                  </div>

                  <div v-if="mod.operation !== 'reset'">
                    <label class="form-label text-sm">Value</label>
                    <input
                      v-model="mod.value"
                      type="text"
                      placeholder="42"
                      class="form-input text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  @click="addVariableModification"
                  class="btn-secondary w-full"
                >
                  + Add Modification
                </button>
              </div>
            </div>
          </div>

          <!-- Modify User Profile Tab -->
          <div v-show="activeTab === 'modifyUserProfile'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">Profile Modifications</label>
              <div class="space-y-4">
                <div
                  v-for="(mod, index) in operations.modifyUserProfile.modifications"
                  :key="index"
                  class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Modification {{ index + 1 }}</span>
                    <button
                      type="button"
                      @click="removeProfileModification(index)"
                      class="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label class="form-label text-sm">Field Name</label>
                    <input
                      v-model="mod.fieldName"
                      type="text"
                      placeholder="email"
                      class="form-input font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label class="form-label text-sm">Operation</label>
                    <select v-model="mod.operation" class="form-select-auto text-sm">
                      <option value="set">Set</option>
                      <option value="reset">Reset</option>
                      <option value="add">Add</option>
                      <option value="remove">Remove</option>
                    </select>
                  </div>

                  <div v-if="mod.operation !== 'reset'">
                    <label class="form-label text-sm">Value</label>
                    <input
                      v-model="mod.value"
                      type="text"
                      placeholder="user@example.com"
                      class="form-input text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  @click="addProfileModification"
                  class="btn-secondary w-full"
                >
                  + Add Modification
                </button>
              </div>
            </div>
          </div>

          <!-- Call Tool Tab -->
          <div v-show="activeTab === 'callTool'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">
                Tool ID <span class="required">*</span>
              </label>
              <input
                v-model="operations.callTool.toolId"
                type="text"
                :required="operations.callTool.enabled"
                placeholder="tool_abc123"
                class="form-input font-mono"
              />
              <p class="form-help-text">
                The ID of the tool to invoke
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Parameters <span class="text-gray-500">(optional, JSON)</span>
              </label>
              <textarea
                v-model="operations.callTool.parameters"
                rows="6"
                class="form-textarea font-mono text-sm"
                placeholder='{\n  "query": "{{user.input}}",\n  "limit": 10\n}'
              ></textarea>
              <p class="form-help-text">
                JSON object with tool parameters. Supports template variables.
              </p>
            </div>
          </div>

          <!-- Call Webhook Tab -->
          <div v-show="activeTab === 'callWebhook'" class="space-y-6">
            <div class="form-group">
              <label class="form-label">
                URL <span class="required">*</span>
              </label>
              <input
                v-model="operations.callWebhook.url"
                type="url"
                :required="operations.callWebhook.enabled"
                placeholder="https://api.example.com/webhook"
                class="form-input font-mono"
              />
              <p class="form-help-text">
                The webhook endpoint URL
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                HTTP Method <span class="required">*</span>
              </label>
              <select v-model="operations.callWebhook.method" class="form-select-auto" :required="operations.callWebhook.enabled">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Headers <span class="text-gray-500">(optional, JSON)</span>
              </label>
              <textarea
                v-model="operations.callWebhook.headers"
                rows="4"
                class="form-textarea font-mono text-sm"
                placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
              ></textarea>
              <p class="form-help-text">
                JSON object with HTTP headers
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Body <span class="text-gray-500">(optional, JSON)</span>
              </label>
              <textarea
                v-model="operations.callWebhook.body"
                rows="6"
                class="form-textarea font-mono text-sm"
                placeholder='{\n  "userId": "{{user.id}}",\n  "message": "{{user.input}}"\n}'
              ></textarea>
              <p class="form-help-text">
                JSON body for the request. Supports template variables.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Result Key <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="operations.callWebhook.resultKey"
                type="text"
                placeholder="webhookResult"
                class="form-input font-mono"
              />
              <p class="form-help-text">
                Variable name to store the webhook response
              </p>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentGlobalAction"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
</style>
