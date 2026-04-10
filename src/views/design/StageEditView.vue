<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStagesStore, useAgentsStore, useProvidersStore, useClassifiersStore, useContextTransformersStore, useToolsStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useLlmProviderSelect, useTabNavigation } from '@/composables'
import { ArrowLeft, Save, Settings, AlertTriangle, Check } from 'lucide-vue-next'
import type { StageResponse, StageAction, LlmSettings, ParsedError, ApiErrorDetail } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import StageVariablesTab from '@/components/StageVariablesTab.vue'
import StageActionsPanel from '@/components/StageActionsPanel.vue'
import StageLifecycleActionsSection from '@/components/StageLifecycleActionsSection.vue'

const LIFECYCLE_ACTION_KEYS = ['__on_enter', '__on_leave', '__on_fallback']

function isLifecycleAction(key: string): boolean {
  return LIFECYCLE_ACTION_KEYS.includes(key)
}

const route = useRoute()
const router = useRouter()
const stagesStore = useStagesStore()
const agentsStore = useAgentsStore()
const providersStore = useProvidersStore()
const classifiersStore = useClassifiersStore()
const transformersStore = useContextTransformersStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const loadError = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'features' | 'memory' | 'actions' | 'lifecycle' | 'metadata' | 'history'>('basic')
const { switchToFirstErrorTab } = useTabNavigation(activeTab)
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  agentId: '',
  prompt: `{{agent}}

...

{{#hasItems faq}}
Relevant knowledge:
{{#each faq}}
Q: {{this.question}}
A: {{this.answer}}
{{/each}}
{{/hasItems}}`,
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  enterBehavior: 'generate_response' as 'generate_response' | 'await_user_input',
  useKnowledge: false,
  knowledgeTags: [] as string[],
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

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'features', label: 'Features' },
  { key: 'memory', label: 'Memory' },
  { key: 'actions', label: 'Actions' },
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentStage = ref<StageResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentStage)
const isReadOnly = computed(() => projectIsArchived.value || !!currentStage.value?.archived)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const projectAgents = computed(() =>
  agentsStore.items
)

const projectClassifiers = computed(() =>
  classifiersStore.items
)

const projectTransformers = computed(() =>
  transformersStore.items
)

// Lifecycle
onMounted(async () => {
  // Load related data
  await Promise.all([
    providersStore.fetchAll(),
    agentsStore.fetchAll(projectId.value),
    classifiersStore.fetchAll(projectId.value),
    transformersStore.fetchAll(projectId.value),
    toolsStore.fetchAll(projectId.value),
    projectsStore.fetchById(projectId.value),
  ])
  
  userProfileVariablesForCompletion.value = projectsStore.currentItem?.userProfileVariableDescriptors || []
  
  if (isEditMode.value) {
    await loadStage()
  }
})

// Methods
async function loadStage() {
  if (!stageId.value) return
  
  isLoading.value = true
  try {
    currentStage.value = await stagesStore.fetchById(projectId.value, stageId.value)
    if (currentStage.value) {
      form.value = {
        id: currentStage.value.id,
        name: currentStage.value.name,
        description: currentStage.value.description || '',
        tags: currentStage.value.tags || [],
        agentId: currentStage.value.agentId,
        prompt: currentStage.value.prompt,
        llmProviderId: currentStage.value.llmProviderId || '',
        llmSettings: currentStage.value.llmSettings || null,
        enterBehavior: currentStage.value.enterBehavior,
        useKnowledge: currentStage.value.useKnowledge,
        knowledgeTags: currentStage.value.knowledgeTags || [],
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
    loadError.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  const errorDetails: ApiErrorDetail[] = []

  if(!form.value.name.trim())
    errorDetails.push({ code: 'required', path: ['name'], message: 'Name is required' })

  if(!form.value.agentId)
    errorDetails.push({ code: 'required', path: ['agentId'], message: 'Agent selection is required' })

  if(!form.value.enterBehavior)
    errorDetails.push({ code: 'required', path: ['enterBehavior'], message: 'Enter behavior is required' })

  if(!form.value.llmProviderId)
    errorDetails.push({ code: 'required', path: ['llmProviderId'], message: 'LLM Provider is required' })

  if(!form.value.llmSettings)
    errorDetails.push({ code: 'required', path: ['llmSettings'], message: 'LLM Settings are required' })

  if(!form.value.prompt.trim())
    errorDetails.push({ code: 'required', path: ['prompt'], message: 'Prompt is required' })

  if (duplicateVariableNames.value.length > 0)
    errorDetails.push({ code: 'duplicate', path: ['variableDescriptors'], message: `Duplicate variable names detected: ${duplicateVariableNames.value.join(', ')}. Variable names must be unique within each level.` })

  if (errorDetails.length > 0) {
    error.value = {
      message: 'Please fix the validation errors and try again.',
      details: errorDetails
    }
    switchToFirstErrorTab(error.value)
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentStage.value) {
      // Update existing stage
      const updated = await stagesStore.update(projectId.value, currentStage.value.id, {
        version: currentStage.value.version,
        name: form.value.name,
        description: form.value.description || null,
        tags: form.value.tags,
        agentId: form.value.agentId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings || undefined,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeTags: form.value.knowledgeTags,
        useGlobalActions: form.value.useGlobalActions,
        globalActions: form.value.globalActions,
        variableDescriptors: form.value.variableDescriptors,
        actions: form.value.actions,
        defaultClassifierId: form.value.defaultClassifierId || null,
        transformerIds: form.value.transformerIds,
        metadata: form.value.metadata
      })
      
      // Update currentStage with the response to get the new version
      currentStage.value = updated
    } else {
      // Create new stage
      const createData: any = {
        name: form.value.name,
        agentId: form.value.agentId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeTags: form.value.knowledgeTags,
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

      // Only include tags if not empty
      if (form.value.tags.length > 0) {
        createData.tags = form.value.tags
      }

      const created = await stagesStore.create(projectId.value, createData)
      
      // Update currentStage with the created stage
      currentStage.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.stages.edit',
        params: { projectId: projectId.value, stageId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
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
    { label: 'Agent ID', value: currentStage.value.agentId, format: 'mono' as const },
    { label: 'Version', value: currentStage.value.version },
    { label: 'Created', value: currentStage.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentStage.value.updatedAt, format: 'date' as const },
  ]
})

// Computed properties for prompt editor auto-completion
const stageVariablesForCompletion = computed(() => form.value.variableDescriptors)

const userProfileVariablesForCompletion = ref<any[]>([])

const projectConstantsForCompletion = computed(() => projectsStore.currentItem?.constants ?? {})

const actionParametersForCompletion = computed(() => {
  const result: Record<string, any[]> = {}
  for (const [key, action] of Object.entries(form.value.actions)) {
    if (!isLifecycleAction(key) && action.parameters && action.parameters.length > 0) {
      result[action.name] = action.parameters
    }
  }
  return result
})

const { handleProviderChange: handleLlmProviderChange } = useLlmProviderSelect(
  () => form.value.llmProviderId,
  (v) => {
    form.value.llmProviderId = v;
    if (error.value?.details?.some(d => d.path[0] === 'llmProviderId')) error.value = null
  },
  () => form.value.llmSettings,
  (v) => {
    form.value.llmSettings = v;
    if (error.value?.details?.some(d => d.path[0] === 'llmSettings')) error.value = null
  }
)

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
  if (error.value?.details?.some(d => d.path[0] === 'llmSettings')) error.value = null
}

// Duplicate variable name detection (used in handleSubmit validation)
const duplicateVariableNames = computed(() => {
  function findDuplicates(descriptors: Array<{ name: string; objectSchema?: any[] }>): string[] {
    const seen = new Set<string>()
    const dupes: string[] = []
    for (const d of descriptors) {
      if (seen.has(d.name)) {
        if (!dupes.includes(d.name)) dupes.push(d.name)
      } else {
        seen.add(d.name)
      }
    }
    for (const d of descriptors) {
      if (d.objectSchema && d.objectSchema.length > 0) {
        dupes.push(...findDuplicates(d.objectSchema))
      }
    }
    return dupes
  }
  return findDuplicates(form.value.variableDescriptors)
})


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
      <div class="flex gap-3 items-center">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="isReadOnly" class="btn-secondary" disabled>Read-only</button>
        <button v-else @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Stage')) }}
        </button>
      </div>
    </div>

    <!-- Archived banner -->
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This stage is read-only because the project is archived.
    </div>
    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading stage...
    </div>

    <!-- Error State -->
    <div v-else-if="loadError && isEditMode" class="error-state">
      <ErrorDisplay :error="loadError" class="mx-8 mt-4"/>
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Stages
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Error Message -->
          <ErrorDisplay v-if="error" :error="error" class="mx-8 mt-4" />

          <!-- General Tab -->
          <TabContent v-model="activeTab" tab="basic">
            <FormField label="Name" required :error="error" path="name" help="Human-readable name for this stage" class="w-full">
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Greeting Stage"
                class="form-input"
                :disabled="isLoading"
              />
            </FormField>

            <FormField label="Description" :error="error" path="description" help="Optional description of what this stage does" class="w-full">
              <textarea
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of this stage's purpose..."
                :disabled="isLoading"
              ></textarea>
            </FormField>

            <TagsEditor v-model="form.tags" :disabled="isLoading" />

            <FormField label="Agent" required :error="error" path="agentId" help="The AI agent to use for this stage">
              <select
                v-model="form.agentId"
                required
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="">Select an agent</option>
                <option v-for="agent in projectAgents" :key="agent.id" :value="agent.id">
                  {{ agent.name }}
                </option>
              </select>
            </FormField>

            <FormField label="Default Enter Behavior" required :error="error" path="enterBehavior" help="What should happen when entering this stage">
              <select
                v-model="form.enterBehavior"
                required
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="generate_response">Generate Response</option>
                <option value="await_user_input">Await User Input</option>
              </select>
            </FormField>
          </TabContent>

          <!-- Prompt Tab -->
          <TabContent v-model="activeTab" tab="prompt">
            <CompositeFormField label="LLM Provider" required :error="error" help="The LLM provider to use for this stage">
              <div class="flex flex-col md:flex-row gap-2">
                <FormField path="llmProviderId">
                  <select
                    :value="form.llmProviderId"
                    @change="handleLlmProviderChange"
                    required
                    class="form-select-auto min-w-64"
                    :disabled="isLoading"
                  >
                    <option value="">Select an LLM provider</option>
                    <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                      {{ provider.name }}
                    </option>
                  </select>
                </FormField>
                <FormField path="llmSettings">
                  <button
                    type="button"
                    @click="showLLMSettingsModal = true"
                    class="btn-secondary whitespace-nowrap h-10.5"
                    :disabled="isLoading"
                  >
                    <Settings class="inline-block mr-1 w-4 h-4" />
                    Settings...
                  </button>
                </FormField>
                <LLMModelBadge :settings="form.llmSettings" />
              </div>
            </CompositeFormField>

            <FormField label="Stage Prompt" required :error="error" path="prompt" class="w-full" help="The system prompt or instructions specific to this stage">
              <PromptEditor
                v-model="form.prompt"
                :disabled="isLoading || isReadOnly"
                :stage-variables="stageVariablesForCompletion"
                :action-parameters="actionParametersForCompletion"
                :user-profile-variables="userProfileVariablesForCompletion"
                :project-constants="projectConstantsForCompletion"
                show-toolbar
                placeholder="You are now in the [stage name] stage..."
                aria-label="Stage prompt"
                min-height="28rem"
              />
            </FormField>
          </TabContent>

          <!-- Features Tab -->
          <TabContent v-model="activeTab" tab="features">
            
            <FormField help="Allow this stage to access the knowledge base">
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
            </FormField>

            <FormField help="Allow this stage to execute global actions">
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
            </FormField>

            <div class="mt-6">
              <FormField label="Default Classifier" hint="(required for actions)" :error="error" path="defaultClassifierId" help="Default classifier for this stage. Individual actions can override this using &quot;Override Classifier ID&quot; in action settings.">
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
                <div
                  v-if="!form.defaultClassifierId"
                  class="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
                >
                  <AlertTriangle class="mt-0.5 w-4 h-4 shrink-0" />
                  <span>Actions triggered by user input classification won't work without a Default Classifier assigned.</span>
                </div>
              </FormField>
            </div>

            <div class="mt-6">
              <FormField label="Attached Transformers" :error="error" path="transformerIds" class="w-full">
                <div class="space-y-2">
                  <label
                    v-for="transformer in projectTransformers"
                    :key="transformer.id"
                    class="flex items-center cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                  >
                    <input
                      v-model="form.transformerIds"
                      :value="transformer.id"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                      {{ transformer.name }}
                    </span>
                  </label>
                  <p v-if="projectTransformers.length === 0" class="text-sm text-gray-500 italic">
                    No transformers available for this project
                  </p>
                </div>
              </FormField>
            </div>
          </TabContent>

          <!-- Memory Tab -->
          <TabContent v-model="activeTab" tab="memory">
            <StageVariablesTab
              v-model="form.variableDescriptors"
              :is-loading="isLoading"
              :error="error"
            />
          </TabContent>

          <!-- Actions Tab -->
          <TabContent v-model="activeTab" tab="actions">
            <StageActionsPanel
              v-model="form.actions"
              :classifiers="projectClassifiers"
              :stage-variables="stageVariablesForCompletion"
              :project-constants="projectConstantsForCompletion"
              :is-loading="isLoading"
            />
          </TabContent>

          <!-- Lifecycle Tab -->
          <TabContent v-model="activeTab" tab="lifecycle">
            <StageLifecycleActionsSection
              v-model="form.actions"
              :stage-variables="stageVariablesForCompletion"
              :project-constants="projectConstantsForCompletion"
              :is-loading="isLoading"
            />
          </TabContent>

          <!-- Metadata Tab -->
          <MetadataTab v-if="isEditMode && currentStage" v-model="activeTab" tab="metadata" :fields="metadataFields" />
          <!-- History Tab -->
          <TabContent v-model="activeTab" tab="history">
            <EntityHistoryView
              v-if="isEditMode && currentStage"
              :load-history="() => stagesStore.fetchAuditLogs(projectId, currentStage!.id)"
              :current-version="currentStage.version"
              :current-object="currentStage"
              :active="activeTab === 'history'"
              :update-fn="(data) => stagesStore.update(projectId, currentStage!.id, data)"
              :create-fn="(data) => stagesStore.create(projectId, data)"
              :ignore-fields="['createdAt', 'archived', 'updatedAt', 'version']"
              @recover-success="() => router.go(0)"
            />
          </TabContent>
          </fieldset>
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

  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
