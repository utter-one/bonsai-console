<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContextTransformersStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Settings, Check } from 'lucide-vue-next'
import type { ContextTransformerResponse, LlmSettings } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import ContextFieldsSelector from '@/components/ContextFieldsSelector.vue'

const route = useRoute()
const router = useRouter()
const transformersStore = useContextTransformersStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'variables' | 'prompt' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  contextFields: [] as string[],
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const transformerId = computed(() => route.params.transformerId as string | undefined)
const isEditMode = computed(() => !!transformerId.value)
const currentTransformer = ref<ContextTransformerResponse | null>(null)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
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
    currentTransformer.value = await transformersStore.fetchById(transformerId.value)
    if (currentTransformer.value) {
      form.value = {
        id: currentTransformer.value.id,
        name: currentTransformer.value.name,
        description: currentTransformer.value.description || '',
        prompt: currentTransformer.value.prompt,
        contextFields: currentTransformer.value.contextFields || [],
        llmProviderId: currentTransformer.value.llmProviderId || '',
        llmSettings: currentTransformer.value.llmSettings || null,
        metadata: currentTransformer.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load context transformer'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentTransformer.value) {
      // Update existing transformer
      const updated = await transformersStore.update(currentTransformer.value.id, {
        version: currentTransformer.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        contextFields: form.value.contextFields.length > 0 ? form.value.contextFields : undefined,
        llmProviderId: form.value.llmProviderId || null,
        llmSettings: form.value.llmSettings || undefined,
        metadata: form.value.metadata
      })
      
      // Update currentTransformer with the response to get the new version
      currentTransformer.value = updated
    } else {
      // Create new transformer
      const createData: any = {
        projectId: projectId.value,
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

      // Only include contextFields if not empty
      if (form.value.contextFields.length > 0) {
        createData.contextFields = form.value.contextFields
      }

      // Only include LLM settings if provider is selected
      if (form.value.llmProviderId) {
        createData.llmProviderId = form.value.llmProviderId
      }

      if (form.value.llmSettings) {
        createData.llmSettings = form.value.llmSettings
      }

      const created = await transformersStore.create(createData)
      
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
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} context transformer`
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
  <div class="flex flex-col h-full md:border md:border-gray-200 md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
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
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Transformer')) }}
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
          @click="activeTab = 'variables'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'variables' }]"
          type="button"
        >
          Variables
          <span
            v-if="form.contextFields.length > 0"
            class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          >
            {{ form.contextFields.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt Configuration
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
      Loading context transformer...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Context Transformers
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
                Transformer ID <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.id"
                type="text"
                placeholder="my_custom_transformer"
                class="form-input-mono"
                :disabled="isLoading || isEditMode"
                :class="{ 'form-input-disabled': isEditMode }"
              />
              <p class="form-help-text">
                Custom identifier for the transformer. Leave empty to auto-generate.
                {{ isEditMode ? 'Cannot be changed after creation.' : '' }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="User Data Enricher"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Human-readable name for this context transformer
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
                placeholder="Brief description of what this transformer does..."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Optional description of the transformer's purpose and functionality
              </p>
            </div>


          </div>

          <!-- Variables Tab -->
          <div v-show="activeTab === 'variables'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Context Fields</label>
              <p class="form-help-text mb-4">
                Select which stage variables this transformer should have access to. Selecting a variable makes its value
                available in the transformation context. Arrays are selected as a whole with their full structure.
              </p>
              <ContextFieldsSelector
                v-model="form.contextFields"
                :project-id="projectId"
              />
            </div>
          </div>

          <!-- Prompt Configuration Tab -->
          <div v-show="activeTab === 'prompt'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                LLM Provider <span class="text-gray-500">(optional)</span>
              </label>
              <div class="flex flex-col md:flex-row gap-2">
                <select
                  v-model="form.llmProviderId"
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">Use default provider</option>
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
                The LLM provider to use for this transformer. Leave empty to use the default provider.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Transformation Prompt <span class="required">*</span>
              </label>
              <PromptEditor
                v-model="form.prompt"
                :disabled="isLoading"
                placeholder="You are a context transformer that enriches user data..."
                aria-label="Context transformer prompt"
                min-height="28rem"
              />
              <p class="form-help-text">
                The system prompt or instructions that define how the context should be transformed
              </p>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentTransformer"
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
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
