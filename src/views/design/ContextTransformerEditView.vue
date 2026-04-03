<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContextTransformersStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useLlmProviderSelect } from '@/composables/useLlmProviderSelect'
import { ArrowLeft, Save, Settings, Check } from 'lucide-vue-next'
import type { ContextTransformerResponse, LlmSettings, ParsedError, ApiErrorDetail } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import ContextFieldsSelector from '@/components/ContextFieldsSelector.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const transformersStore = useContextTransformersStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'variables' | 'prompt' | 'metadata' | 'history'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  prompt: `You are a data extraction assistant. Your task is to extract structured information from the user's message and update the conversation context.

{{time.anchor}}

## Fields to Extract

The following fields must be populated. Their expected types and shapes are:

\`\`\`json
{{schema}}
\`\`\`

Only extract values that are explicitly stated or clearly implied by the user's message. Return previous values for any fields not mentioned.`,
  contextFields: [] as string[],
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const transformerId = computed(() => route.params.transformerId as string | undefined)
const isEditMode = computed(() => !!transformerId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'variables', label: () => [
    'Variables',
    form.value.contextFields.length > 0
      ? h('span', { class: 'ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' }, String(form.value.contextFields.length))
      : null
  ] },
  { key: 'prompt', label: 'Prompt' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentTransformer = ref<ContextTransformerResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentTransformer)
const isReadOnly = computed(() => projectIsArchived.value || !!currentTransformer.value?.archived)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const { handleProviderChange: handleLlmProviderChange } = useLlmProviderSelect(
  () => form.value.llmProviderId,
  (v) => { form.value.llmProviderId = v },
  () => form.value.llmSettings,
  (v) => { form.value.llmSettings = v }
)

// Lifecycle
onMounted(async () => {
  // Load LLM providers
  await providersStore.fetchAll()
  
  if (isEditMode.value) {
    await loadTransformer()
  }
})

// Methods
async function loadTransformer() {
  if (!transformerId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentTransformer.value = await transformersStore.fetchById(projectId.value, transformerId.value)
    if (currentTransformer.value) {
      form.value = {
        id: currentTransformer.value.id,
        name: currentTransformer.value.name,
        description: currentTransformer.value.description || '',
        tags: currentTransformer.value.tags || [],
        prompt: currentTransformer.value.prompt,
        contextFields: currentTransformer.value.contextFields || [],
        llmProviderId: currentTransformer.value.llmProviderId || '',
        llmSettings: currentTransformer.value.llmSettings || null,
        metadata: currentTransformer.value.metadata || {}
      }
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load context transformer'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  const validationDetails: ApiErrorDetail[] = []

  if (!form.value.name.trim())
    validationDetails.push({ code: 'required', path: ['name'], message: 'Name is required.' })

  if (!form.value.llmProviderId)
    validationDetails.push({ code: 'required', path: ['llmProviderId'], message: 'LLM Provider is required.' })

  if (!form.value.llmSettings)
    validationDetails.push({ code: 'required', path: ['llmSettings'], message: 'LLM Settings are required. Click Settings... to configure.' })

  if (!form.value.prompt.trim())
    validationDetails.push({ code: 'required', path: ['prompt'], message: 'Transformation prompt is required.' })

  if (validationDetails.length > 0) {
    error.value = { message: validationDetails[0]!.message, details: validationDetails }
    switchToFirstErrorTab(error.value)
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentTransformer.value) {
      // Update existing transformer
      const updated = await transformersStore.update(projectId.value, currentTransformer.value.id, {
        version: currentTransformer.value.version,
        name: form.value.name,
        description: form.value.description || null,
        tags: form.value.tags,
        prompt: form.value.prompt,
        contextFields: form.value.contextFields.length > 0 ? form.value.contextFields : undefined,
        llmProviderId: form.value.llmProviderId || undefined,
        llmSettings: form.value.llmSettings || undefined,
        metadata: form.value.metadata
      })
      
      // Update currentTransformer with the response to get the new version
      currentTransformer.value = updated
    } else {
      // Create new transformer
      const createData: any = {
        name: form.value.name,
        prompt: form.value.prompt,
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
      if (form.value.contextFields.length > 0) {
        createData.contextFields = form.value.contextFields
      }

      // Only include LLM settings if provider is selected
      createData.llmProviderId = form.value.llmProviderId
      createData.llmSettings = form.value.llmSettings

      const created = await transformersStore.create(projectId.value, createData)
      
      // Update currentTransformer with the created transformer
      currentTransformer.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.contextTransformers.edit',
        params: { projectId: projectId.value, transformerId: created.id }
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
  router.push({ name: 'design.contextTransformers', params: { projectId: projectId.value } })
}

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}

const metadataFields = computed(() => {
  if (!currentTransformer.value) return []
  return [
    { label: 'Transformer ID', value: currentTransformer.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentTransformer.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentTransformer.value.version },
    { label: 'Created', value: currentTransformer.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentTransformer.value.updatedAt, format: 'date' as const },
  ]
})


</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to context transformers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">{{ isEditMode ? 'Edit Context Transformer' : 'Create Context Transformer' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the context transformer configuration' : 'Define a new context transformer for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="!isReadOnly" @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Transformer')) }}
        </button>
      </div>
    </div>
    
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This context transformer is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading context transformer...
    </div>

    <!-- Error State -->
    <div v-else-if="loadError && isEditMode" class="error-state">
      {{ loadError }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Context Transformers
      </button>
    </div>

    <!-- Form -->
    <div v-show="!loadError || isReadOnly" class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Error Message -->
          <ErrorDisplay :error="error" />

          <!-- General Tab -->
          <TabContent v-model="activeTab" tab="basic">
            <FormField label="Transformer ID" :error="error" path="id" class="w-full" hint="optional" :help="isEditMode ? 'Cannot be changed after creation.' : 'Custom identifier for the transformer. Leave empty to auto-generate.'">
              <input
                v-model="form.id"
                type="text"
                placeholder="my_custom_transformer"
                class="form-input-mono"
                :disabled="isLoading || isEditMode"
                :class="{ 'form-input-disabled': isEditMode }"
              />
            </FormField>

            <FormField label="Name" required :error="error" path="name" class="w-full" help="Human-readable name for this context transformer">
              <input
                v-model="form.name"
                type="text"
                placeholder="User Data Enricher"
                class="form-input"
                :disabled="isLoading"
              />
            </FormField>

            <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description of the transformer's purpose and functionality">
              <textarea
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of what this transformer does..."
                :disabled="isLoading"
              ></textarea>
            </FormField>

            <TagsEditor v-model="form.tags" :disabled="isLoading" />

          </TabContent>

          <!-- Variables Tab -->
          <TabContent v-model="activeTab" tab="variables">
            <FormField label="Context Fields" class="w-full">
              <p class="form-help-text mb-4">
                Select which stage variables this transformer should have access to. Selecting a variable makes its value
                available in the transformation context. Arrays are selected as a whole with their full structure.
              </p>
              <ContextFieldsSelector
                v-model="form.contextFields"
                :project-id="projectId"
              />
            </FormField>
          </TabContent>

          <!-- Prompt Tab -->
          <TabContent v-model="activeTab" tab="prompt">
            <CompositeFormField label="LLM Provider" required :error="error" help="The LLM provider to use for this transformer.">
              <div class="flex flex-col md:flex-row gap-2 items-center">
                <FormField path="llmProviderId">
                  <select
                    :value="form.llmProviderId"
                    @change="handleLlmProviderChange"
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
                    class="btn-secondary whitespace-nowrap"
                    :disabled="isLoading"
                  >
                    <Settings class="inline-block mr-1 w-4 h-4" />
                    Settings...
                  </button>
                </FormField>
                <LLMModelBadge :settings="form.llmSettings" />
              </div>
            </CompositeFormField>

            <FormField label="Transformation Prompt" required :error="error" path="prompt" class="w-full" help="The system prompt or instructions that define how the context should be transformed">
              <PromptEditor
                v-model="form.prompt"
                :disabled="isLoading || isReadOnly"
                show-toolbar
                placeholder="You are a context transformer that enriches user data..."
                aria-label="Context transformer prompt"
                min-height="28rem"
              />
            </FormField>
          </TabContent>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentTransformer"
            v-model="activeTab"
            tab="metadata"
            :fields="metadataFields"
          />
          <!-- History Tab -->
          <TabContent v-model="activeTab" tab="history">
            <EntityHistoryView
              v-if="isEditMode && currentTransformer"
              :load-history="() => transformersStore.fetchAuditLogs(projectId, currentTransformer!.id)"
              :current-version="currentTransformer.version"
              :current-object="currentTransformer"
              :active="activeTab === 'history'"
              :update-fn="(data) => transformersStore.update(projectId, currentTransformer!.id, data)"
              :create-fn="(data) => transformersStore.create(projectId, data)"
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
