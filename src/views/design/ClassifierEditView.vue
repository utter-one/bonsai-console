<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassifiersStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Settings, Check } from 'lucide-vue-next'
import type { ClassifierResponse, LlmSettings } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import TagsEditor from '@/components/TagsEditor.vue'

const route = useRoute()
const router = useRouter()
const classifiersStore = useClassifiersStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  prompt: `You are a classification assistant. Your task is to analyze user input and determine which actions to trigger.

Available actions:
{{#each stage.availableActions}}
- **{{name}}** (ID: {{id}})
  Trigger: {{trigger}}
  {{#if examples}}Examples: {{join examples ", "}}{{/if}}
  {{#if parameters}}
  Parameters:
  {{#each parameters}}
    - {{name}} ({{type}}){{#if required}} *required*{{/if}}: {{description}}
  {{/each}}
  {{/if}}
{{/each}}

Instructions:
1. Determine the user's intent from their input using the defined actions above.
2. Extract any parameters that are explicitly mentioned or strongly implied.
3. Only return actions that clearly match the user's intent.
4. Return an empty object {} for simple acknowledgments or off-topic messages.

Respond with a JSON object:
{
  "actions": {
    "actionId": {
      "parameterName": "value"
    }
  }
}`,
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const classifierId = computed(() => route.params.classifierId as string | undefined)
const isEditMode = computed(() => !!classifierId.value)
const currentClassifier = ref<ClassifierResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentClassifier)
const isReadOnly = computed(() => projectIsArchived.value || !!currentClassifier.value?.archived)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

watch(() => form.value.llmProviderId, (newVal) => {
  if (!newVal) {
    form.value.llmSettings = null
  }
})

// Lifecycle
onMounted(async () => {
  await providersStore.fetchAll()
  
  if (isEditMode.value) {
    await loadClassifier()
  }
})

// Methods
async function loadClassifier() {
  if (!classifierId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentClassifier.value = await classifiersStore.fetchById(projectId.value, classifierId.value)
    if (currentClassifier.value) {
      form.value = {
        id: currentClassifier.value.id,
        name: currentClassifier.value.name,
        description: currentClassifier.value.description || '',
        tags: currentClassifier.value.tags || [],
        prompt: currentClassifier.value.prompt,
        llmProviderId: currentClassifier.value.llmProviderId || '',
        llmSettings: currentClassifier.value.llmSettings || null,
        metadata: currentClassifier.value.metadata || {}
      }
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load classifier'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  if (!form.value.llmProviderId) {
    error.value = 'LLM Provider is required. Please select an LLM provider.'
    activeTab.value = 'prompt'
    return
  }

  if (!form.value.llmSettings) {
    error.value = 'LLM Settings are required. Please configure the LLM settings.'
    activeTab.value = 'prompt'
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentClassifier.value) {
      // Update existing classifier
      const updated = await classifiersStore.update(projectId.value, currentClassifier.value.id, {
        version: currentClassifier.value.version,
        name: form.value.name,
        description: form.value.description || null,
        tags: form.value.tags,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId || undefined,
        llmSettings: form.value.llmSettings || undefined,
        metadata: form.value.metadata
      })
      
      // Update currentClassifier with the response to get the new version
      currentClassifier.value = updated
    } else {
      // Create new classifier
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

      // Only include llmProviderId if it's not empty
      if (form.value.llmProviderId) {
        createData.llmProviderId = form.value.llmProviderId
      }

      // Only include llmSettings if it's not empty
      if (form.value.llmSettings) {
        createData.llmSettings = form.value.llmSettings
      }

      const created = await classifiersStore.create(projectId.value, createData)
      
      // Update currentClassifier with the created classifier
      currentClassifier.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.classifiers.edit',
        params: { projectId: projectId.value, classifierId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} classifier`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.classifiers', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentClassifier.value) return []
  return [
    { label: 'Classifier ID', value: currentClassifier.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentClassifier.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentClassifier.value.version },
    { label: 'Created', value: currentClassifier.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentClassifier.value.updatedAt, format: 'date' as const },
  ]
})

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to classifiers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Classifier' : 'Create Classifier' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the classifier configuration' : 'Define a new intent classifier for this project' }}
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
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Classifier')) }}
        </button>
      </div>
    </div>
    
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This classifier is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          General
        </button>
        <button
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt
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
      Loading classifier...
    </div>

    <!-- Error State -->
    <div v-else-if="loadError && isEditMode" class="error-state">
      {{ loadError }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Classifiers
      </button>
    </div>

    <!-- Form -->
    <div v-show="!loadError || isReadOnly" class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
        <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
        <!-- Error Message -->
        <div v-if="error" class="alert-error mb-6">
          {{ error }}
        </div>

        <!-- General Tab -->
        <div v-show="activeTab === 'basic'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Intent Classifier"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A descriptive name for this classifier</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Description <span class="text-gray-500">(optional)</span>
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-textarea"
              placeholder="A brief description of what this classifier does..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              Optional description to help identify the purpose of this classifier
            </p>
          </div>

          <TagsEditor v-model="form.tags" :disabled="isLoading" />
        </div>

        <!-- Prompt Tab -->
        <div v-show="activeTab === 'prompt'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              LLM Provider <span class="required">*</span>
            </label>
            <div class="flex flex-col md:flex-row gap-2">
              <select
                v-model="form.llmProviderId"
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
              <LLMModelBadge :settings="form.llmSettings" />
            </div>
            <p class="form-help-text">
              The LLM provider to use for this classifier.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Classification Prompt <span class="required">*</span>
            </label>
            <PromptEditor
              v-model="form.prompt"
              :disabled="isLoading || isReadOnly"
              show-toolbar
              placeholder="Classify the user's intent based on their message..."
              aria-label="Classifier prompt"
              min-height="28rem"
            />
            <p class="form-help-text">
              The prompt that defines how the classifier should categorize user inputs. Include instructions on what intents to identify and how to classify them.
            </p>
          </div>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentClassifier"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
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
