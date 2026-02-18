<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStagesStore, usePersonasStore, useProvidersStore, useClassifiersStore, useContextTransformersStore, useToolsStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Plus, Settings, Trash2, CheckCircle, Circle } from 'lucide-vue-next'
import type { StageResponse, LlmSettings, StageAction } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import StageActionModal from '@/components/modals/StageActionModal.vue'
import VariableDescriptorModal from '@/components/modals/VariableDescriptorModal.vue'

// Lifecycle action constants
const LIFECYCLE_ACTIONS = {
  ON_ENTER: '__on_enter',
  ON_LEAVE: '__on_leave',
  ON_FALLBACK: '__on_fallback',
} as const

const LIFECYCLE_ACTION_INFO = {
  [LIFECYCLE_ACTIONS.ON_ENTER]: {
    name: 'On Enter',
    description: 'Executes when entering this stage',
    context: 'on_enter',
  },
  [LIFECYCLE_ACTIONS.ON_LEAVE]: {
    name: 'On Leave',
    description: 'Executes when leaving this stage',
    context: 'on_leave',
  },
  [LIFECYCLE_ACTIONS.ON_FALLBACK]: {
    name: 'On Fallback',
    description: 'Executes when no action matches user input',
    context: 'on_fallback',
  },
} as const

function isLifecycleAction(key: string): boolean {
  return Object.values(LIFECYCLE_ACTIONS).includes(key as any)
}

const route = useRoute()
const router = useRouter()
const stagesStore = useStagesStore()
const personasStore = usePersonasStore()
const providersStore = useProvidersStore()
const classifiersStore = useClassifiersStore()
const transformersStore = useContextTransformersStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'prompt' | 'features' | 'variables' | 'actions' | 'lifecycle' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const showActionModal = ref(false)
const editingActionKey = ref<string | null>(null)
const editingAction = ref<StageAction | null>(null)
const isLifecycleActionKey = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  personaId: '',
  prompt: '',
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  enterBehavior: 'generate_response' as 'generate_response' | 'await_user_input',
  useKnowledge: false,
  knowledgeSections: [] as string[],
  useGlobalActions: false,
  globalActions: [] as string[],
  variableDescriptors: [] as Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
    isArray: boolean
    objectSchema?: Array<any>
  }>,
  actions: {} as Record<string, StageAction>,
  defaultClassifierId: '',
  transformerIds: [] as string[],
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const stageId = computed(() => route.params.stageId as string | undefined)
const isEditMode = computed(() => !!stageId.value)
const currentStage = ref<StageResponse | null>(null)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const projectPersonas = computed(() =>
  personasStore.items.filter(p => p.projectId === projectId.value)
)

const projectClassifiers = computed(() =>
  classifiersStore.items.filter(c => c.projectId === projectId.value)
)

const projectTransformers = computed(() =>
  transformersStore.items.filter(t => t.projectId === projectId.value)
)

// Lifecycle
onMounted(async () => {
  // Load related data
  await Promise.all([
    providersStore.fetchAll(),
    personasStore.fetchAll({ filters: { projectId: projectId.value } }),
    classifiersStore.fetchAll({ filters: { projectId: projectId.value } }),
    transformersStore.fetchAll({ filters: { projectId: projectId.value } }),
    toolsStore.fetchAll({ filters: { projectId: projectId.value } })
  ])
  
  if (isEditMode.value) {
    await loadStage()
  }
})

// Methods
async function loadStage() {
  if (!stageId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentStage.value = await stagesStore.fetchById(stageId.value)
    if (currentStage.value) {
      form.value = {
        id: currentStage.value.id,
        name: currentStage.value.name,
        description: currentStage.value.description || '',
        personaId: currentStage.value.personaId,
        prompt: currentStage.value.prompt,
        llmProviderId: currentStage.value.llmProviderId || '',
        llmSettings: currentStage.value.llmSettings || null,
        enterBehavior: currentStage.value.enterBehavior,
        useKnowledge: currentStage.value.useKnowledge,
        knowledgeSections: currentStage.value.knowledgeSections || [],
        useGlobalActions: currentStage.value.useGlobalActions,
        globalActions: currentStage.value.globalActions || [],
        variableDescriptors: currentStage.value.variableDescriptors || [],
        actions: currentStage.value.actions || {},
        defaultClassifierId: currentStage.value.defaultClassifierId || '',
        transformerIds: currentStage.value.transformerIds || [],
        metadata: currentStage.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load stage'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentStage.value) {
      // Update existing stage
      await stagesStore.update(currentStage.value.id, {
        version: currentStage.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        personaId: form.value.personaId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings || undefined,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeSections: form.value.knowledgeSections,
        useGlobalActions: form.value.useGlobalActions,
        globalActions: form.value.globalActions,
        variableDescriptors: form.value.variableDescriptors,
        actions: form.value.actions,
        defaultClassifierId: form.value.defaultClassifierId || null,
        transformerIds: form.value.transformerIds,
        metadata: form.value.metadata
      })
    } else {
      // Create new stage
      const createData: any = {
        projectId: projectId.value,
        name: form.value.name,
        personaId: form.value.personaId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeSections: form.value.knowledgeSections,
        useGlobalActions: form.value.useGlobalActions,
        globalActions: form.value.globalActions,
        variableDescriptors: form.value.variableDescriptors,
        actions: form.value.actions,
        defaultClassifierId: form.value.defaultClassifierId || null,
        transformerIds: form.value.transformerIds,
        metadata: form.value.metadata
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include description if it's not empty
      if (form.value.description) {
        createData.description = form.value.description
      }

      await stagesStore.create(createData)
    }

    // Navigate back to stages list
    router.push({ name: 'design.stages', params: { projectId: projectId.value } })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} stage`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.stages', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentStage.value) return []
  return [
    { label: 'Stage ID', value: currentStage.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentStage.value.projectId, format: 'mono' as const },
    { label: 'Persona ID', value: currentStage.value.personaId, format: 'mono' as const },
    { label: 'Version', value: currentStage.value.version },
    { label: 'Created', value: currentStage.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentStage.value.updatedAt, format: 'date' as const },
  ]
})

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}

// Action management functions
function addAction() {
  editingActionKey.value = null
  editingAction.value = null
  isLifecycleActionKey.value = false
  showActionModal.value = true
}

function editAction(key: string) {
  const action = form.value.actions[key]
  if (!action) return
  
  editingActionKey.value = key
  editingAction.value = action
  isLifecycleActionKey.value = isLifecycleAction(key)
  showActionModal.value = true
}

function deleteAction(key: string) {
  // Prevent deletion of lifecycle actions
  if (isLifecycleAction(key)) {
    alert('Lifecycle actions cannot be deleted. Use "Clear" to remove the configuration instead.')
    return
  }
  
  if (confirm(`Are you sure you want to delete action "${key}"?`)) {
    const newActions = { ...form.value.actions }
    delete newActions[key]
    form.value.actions = newActions
  }
}

function configureLifecycleAction(key: string) {
  editingActionKey.value = key
  editingAction.value = form.value.actions[key] || null
  isLifecycleActionKey.value = true
  showActionModal.value = true
}

function clearLifecycleAction(key: string) {
  if (confirm(`Are you sure you want to clear the "${LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO].name}" action?`)) {
    const newActions = { ...form.value.actions }
    delete newActions[key]
    form.value.actions = newActions
  }
}

function isLifecycleActionConfigured(key: string): boolean {
  return !!form.value.actions[key]
}

function handleActionSave(data: { key: string; action: StageAction }) {
  const newActions = { ...form.value.actions }
  newActions[data.key] = data.action
  form.value.actions = newActions
  showActionModal.value = false
}

const actionsList = computed(() => {
  return Object.entries(form.value.actions)
    .filter(([key]) => !isLifecycleAction(key))
    .map(([key, action]) => ({
      key,
      ...action
    }))
})

const lifecycleActions = computed(() => {
  return Object.values(LIFECYCLE_ACTIONS).map(key => ({
    key,
    info: LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO],
    action: form.value.actions[key] || null,
    isConfigured: isLifecycleActionConfigured(key),
  }))
})

// Variable descriptor management
const showVariableDescriptorModal = ref(false)
const editingVariableIndex = ref<number | null>(null)
const editingVariableDescriptor = ref<any>(null)

function addVariableDescriptor() {
  editingVariableIndex.value = null
  editingVariableDescriptor.value = null
  showVariableDescriptorModal.value = true
}

function editVariableDescriptor(index: number) {
  const descriptor = form.value.variableDescriptors[index]
  if (!descriptor) return
  
  editingVariableIndex.value = index
  editingVariableDescriptor.value = descriptor
  showVariableDescriptorModal.value = true
}

function handleVariableDescriptorSave(descriptor: any) {
  if (editingVariableIndex.value !== null) {
    // Update existing
    form.value.variableDescriptors[editingVariableIndex.value] = descriptor
  } else {
    // Add new
    form.value.variableDescriptors.push(descriptor)
  }
  
  showVariableDescriptorModal.value = false
  editingVariableIndex.value = null
  editingVariableDescriptor.value = null
}

function deleteVariableDescriptor(index: number) {
  if (confirm('Are you sure you want to delete this variable descriptor?')) {
    form.value.variableDescriptors.splice(index, 1)
  }
}

</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to stages">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Stage' : 'Create Stage' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the stage configuration' : 'Define a new conversation stage for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Stage') }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
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
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt Configuration
        </button>
        <button
          @click="activeTab = 'features'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'features' }]"
          type="button"
        >
          Features & Integrations
        </button>
        <button
          @click="activeTab = 'variables'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'variables' }]"
          type="button"
        >
          Variables
        </button>
        <button
          @click="activeTab = 'actions'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'actions' }]"
          type="button"
        >
          Actions
        </button>
        <button
          @click="activeTab = 'lifecycle'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'lifecycle' }]"
          type="button"
        >
          Lifecycle
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

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading stage...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Stages
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <!-- Error Message -->
          <div v-if="error" class="alert-error mb-6">
            {{ error }}
          </div>

          <!-- Basic Information Tab -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Greeting Stage"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Human-readable name for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Description <span class="text-gray-500">(optional)</span>
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of this stage's purpose..."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Optional description of what this stage does
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Persona <span class="required">*</span>
              </label>
              <select
                v-model="form.personaId"
                required
                class="form-select-auto"
                :disabled="isLoading"
              >
                <option value="">Select a persona</option>
                <option v-for="persona in projectPersonas" :key="persona.id" :value="persona.id">
                  {{ persona.name }}
                </option>
              </select>
              <p class="form-help-text">
                The AI persona to use for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Default Enter Behavior <span class="required">*</span>
              </label>
              <select
                v-model="form.enterBehavior"
                required
                class="form-select-auto"
                :disabled="isLoading"
              >
                <option value="generate_response">Generate Response</option>
                <option value="await_user_input">Await User Input</option>
              </select>
              <p class="form-help-text">
                What should happen when entering this stage
              </p>
            </div>
          </div>

          <!-- Prompt Configuration Tab -->
          <div v-show="activeTab === 'prompt'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                LLM Provider <span class="required">*</span>
              </label>
              <div class="flex flex-col md:flex-row gap-2">
                <select
                  v-model="form.llmProviderId"
                  required
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">Select an LLM provider</option>
                  <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="showLLMSettingsModal = true"
                  class="btn-secondary whitespace-nowrap"
                  :disabled="isLoading"
                >
                  <Settings class="inline-block mr-1 w-4 h-4" />
                  Settings...
                </button>
              </div>
              <p class="form-help-text">
                The LLM provider to use for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Stage Prompt <span class="required">*</span>
              </label>
              <PromptEditor
                v-model="form.prompt"
                :disabled="isLoading"
                placeholder="You are now in the [stage name] stage..."
                aria-label="Stage prompt"
                min-height="28rem"
              />
              <p class="form-help-text">
                The system prompt or instructions specific to this stage
              </p>
            </div>
          </div>

          <!-- Features & Integrations Tab -->
          <div v-show="activeTab === 'features'" class="tab-content">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Knowledge Integration</h3>
            
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.useKnowledge"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Knowledge Base
                </span>
              </label>
              <p class="form-help-text mt-1">
                Allow this stage to access the knowledge base
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.useGlobalActions"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Global Actions
                </span>
              </label>
              <p class="form-help-text mt-1">
                Allow this stage to execute global actions
              </p>
            </div>

            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Classifiers</h3>
              
              <div class="form-group">
                <label class="form-label">
                  Default Classifier <span class="text-gray-500">(required for actions)</span>
                </label>
                <select
                  v-model="form.defaultClassifierId"
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">No default classifier</option>
                  <option
                    v-for="classifier in projectClassifiers"
                    :key="classifier.id"
                    :value="classifier.id"
                  >
                    {{ classifier.name }}
                  </option>
                </select>
                <p class="form-help-text">
                  Default classifier for this stage. Individual actions can override this using "Override Classifier ID" in action settings.
                </p>
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Context Transformers</h3>
              
              <div class="form-group">
                <label class="form-label">
                  Attached Transformers <span class="text-gray-500">(optional)</span>
                </label>
                <div class="space-y-2">
                  <label
                    v-for="transformer in projectTransformers"
                    :key="transformer.id"
                    class="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      v-model="form.transformerIds"
                      :value="transformer.id"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm text-gray-700">
                      {{ transformer.name }}
                    </span>
                  </label>
                  <p v-if="projectTransformers.length === 0" class="text-sm text-gray-500 italic">
                    No transformers available for this project
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Variables Tab -->
          <div v-show="activeTab === 'variables'" class="tab-content">
            <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Variable Descriptors</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Define the expected structure of stage variables. This helps document what variables are available in this stage context.
                </p>
              </div>
              <button
                type="button"
                @click="addVariableDescriptor"
                class="btn-primary"
                :disabled="isLoading"
              >
                <Plus class="inline-block mr-1 w-4 h-4" />
                Add Variable
              </button>
            </div>

            <!-- Empty State -->
            <div v-if="form.variableDescriptors.length === 0" class="text-center py-12">
              <p class="text-gray-500 dark:text-gray-400 mb-4">No variable descriptors defined yet</p>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                Variable descriptors help document the stage's context structure
              </p>
            </div>

            <!-- Variables Table -->
            <div v-else class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Variable Name</th>
                      <th class="table-header-cell">Type</th>
                      <th class="table-header-cell">Is Array</th>
                      <th class="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-for="(descriptor, index) in form.variableDescriptors" :key="index" class="table-row">
                      <td class="table-cell">
                        <code class="text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded font-mono">
                          {{ descriptor.name }}
                        </code>
                      </td>
                      <td class="table-cell">
                        <span class="badge-primary text-xs">
                          {{ descriptor.type }}
                        </span>
                      </td>
                      <td class="table-cell">
                        <span v-if="descriptor.isArray" class="text-green-600 dark:text-green-400 text-sm">Yes</span>
                        <span v-else class="text-gray-400 text-sm">No</span>
                      </td>
                      <td class="table-cell-right">
                        <div class="flex-end">
                          <button
                            type="button"
                            @click="editVariableDescriptor(index)"
                            class="btn-secondary btn-sm"
                            :disabled="isLoading"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            @click="deleteVariableDescriptor(index)"
                            class="btn-danger btn-sm"
                            :disabled="isLoading"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Actions Tab -->
          <div v-show="activeTab === 'actions'" class="tab-content">
            <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Stage Actions</h3>
                <p class="text-sm text-gray-600 mt-1">
                  Define custom actions that can be triggered during conversations
                </p>
              </div>
              <button
                type="button"
                @click="addAction"
                class="btn-primary"
                :disabled="isLoading"
              >
                <Plus class="inline-block mr-1 w-4 h-4" />
                Add Action
              </button>
            </div>

            <!-- Empty State -->
            <div v-if="actionsList.length === 0" class="text-center py-12">
              <p class="text-gray-500 mb-4">No actions defined yet</p>
            </div>

            <!-- Actions Table -->
            <div v-else class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Key</th>
                      <th class="table-header-cell">Name</th>
                      <th class="table-header-cell">Triggers</th>
                      <th class="table-header-cell">Classification</th>
                      <th class="table-header-cell">Effects</th>
                      <th class="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-for="action in actionsList" :key="action.key" class="table-row">
                      <td class="table-cell">
                        <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-700 dark:text-gray-300">{{ action.key }}</code>
                      </td>
                      <td class="table-clickable-cell" @click="editAction(action.key)">
                        {{ action.name }}
                      </td>
                      <td class="table-cell">
                        <div class="flex flex-col gap-1">
                          <span v-if="action.triggerOnUserInput" class="badge-primary text-xs whitespace-nowrap">User Input</span>
                          <span v-if="action.triggerOnClientCommand" class="badge-primary text-xs whitespace-nowrap">Client Command</span>
                        </div>
                      </td>
                      <td class="table-cell">
                        <code v-if="action.classificationTrigger" class="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-700 dark:text-gray-300">
                          {{ action.classificationTrigger }}
                        </code>
                        <span v-else class="text-gray-400 text-sm">—</span>
                      </td>
                      <td class="table-cell-muted">
                        {{ action.effects?.length || 0 }}
                      </td>
                      <td class="table-cell-right">
                        <div class="flex-end">
                          <button
                            type="button"
                            @click="editAction(action.key)"
                            class="btn-secondary btn-sm"
                            :disabled="isLoading"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            @click="deleteAction(action.key)"
                            class="btn-danger btn-sm"
                            :disabled="isLoading"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Lifecycle Tab -->
          <div v-show="activeTab === 'lifecycle'" class="tab-content">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lifecycle Actions</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Special system actions that execute at specific lifecycle points in the conversation flow.
                These are optional but provide powerful hooks for initialization, cleanup, and fallback handling.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                v-for="lifecycle in lifecycleActions" 
                :key="lifecycle.key"
                class="lifecycle-action-card"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-medium text-gray-900 dark:text-white">{{ lifecycle.info.name }}</h4>
                      <span 
                        v-if="lifecycle.isConfigured" 
                        class="badge-configured"
                      >
                        <CheckCircle class="w-3 h-3 mr-1 inline-block" />
                        Configured
                      </span>
                      <span 
                        v-else
                        class="badge-unconfigured"
                      >
                        <Circle class="w-3 h-3 mr-1 inline-block" />
                        Not Set
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ lifecycle.info.description }}</p>
                  </div>
                </div>
                
                <div v-if="lifecycle.action" class="mb-3 text-sm">
                  <p class="text-gray-700 dark:text-gray-300 font-medium">{{ lifecycle.action.name }}</p>
                  <p class="text-gray-500 text-xs mt-1">
                    {{ lifecycle.action.effects?.length || 0 }} effect(s)
                  </p>
                </div>
                
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="configureLifecycleAction(lifecycle.key)"
                    class="btn-secondary btn-sm flex-1"
                    :disabled="isLoading"
                  >
                    <Settings class="w-3 h-3 mr-1 inline-block" />
                    {{ lifecycle.isConfigured ? 'Edit' : 'Configure' }}
                  </button>
                  <button
                    v-if="lifecycle.isConfigured"
                    type="button"
                    @click="clearLifecycleAction(lifecycle.key)"
                    class="btn-danger btn-sm"
                    :disabled="isLoading"
                    title="Clear action"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentStage"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
        </form>
      </div>
    </div>

    <!-- LLM Settings Modal -->
    <LLMSettingsModal
      v-if="showLLMSettingsModal"
      :settings="form.llmSettings"
      :selected-provider-id="form.llmProviderId"
      :providers="llmProviders"
      @close="showLLMSettingsModal = false"
      @save="handleLLMSettingsSave"
    />

    <!-- Stage Action Modal -->
    <StageActionModal
      v-if="showActionModal"
      :action="editingAction"
      :editing-key="editingActionKey"
      :is-lifecycle-action="isLifecycleActionKey"
      @close="showActionModal = false"
      @save="handleActionSave"
    />

    <!-- Variable Descriptor Modal -->
    <VariableDescriptorModal
      v-if="showVariableDescriptorModal"
      :descriptor="editingVariableDescriptor"
      :editing-index="editingVariableIndex"
      @close="showVariableDescriptorModal = false"
      @save="handleVariableDescriptorSave"
    />
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
