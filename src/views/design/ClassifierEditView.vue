<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassifiersStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Settings } from 'lucide-vue-next'
import type { ClassifierResponse, LlmSettings } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'

const route = useRoute()
const router = useRouter()
const classifiersStore = useClassifiersStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'prompt' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const classifierId = computed(() => route.params.classifierId as string | undefined)
const isEditMode = computed(() => !!classifierId.value)
const currentClassifier = ref<ClassifierResponse | null>(null)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

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
    currentClassifier.value = await classifiersStore.fetchById(classifierId.value)
    if (currentClassifier.value) {
      form.value = {
        id: currentClassifier.value.id,
        name: currentClassifier.value.name,
        description: currentClassifier.value.description || '',
        prompt: currentClassifier.value.prompt,
        llmProviderId: currentClassifier.value.llmProviderId || '',
        llmSettings: currentClassifier.value.llmSettings || null,
        metadata: currentClassifier.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load classifier'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentClassifier.value) {
      // Update existing classifier
      await classifiersStore.update(currentClassifier.value.id, {
        version: currentClassifier.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId || null,
        llmSettings: form.value.llmSettings || undefined,
        metadata: form.value.metadata
      })
    } else {
      // Create new classifier
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

      // Only include llmProviderId if it's not empty
      if (form.value.llmProviderId) {
        createData.llmProviderId = form.value.llmProviderId
      }

      // Only include llmSettings if it's not empty
      if (form.value.llmSettings) {
        createData.llmSettings = form.value.llmSettings
      }

      await classifiersStore.create(createData)
    }

    // Navigate back to classifiers list
    router.push({ name: 'design.classifiers', params: { projectId: projectId.value } })
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
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to classifiers">
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
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Classifier') }}
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
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Classifiers
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
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
        </div>

        <!-- Prompt Configuration Tab -->
        <div v-show="activeTab === 'prompt'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              LLM Provider <span class="text-gray-500">(optional)</span>
            </label>
            <div class="flex gap-2">
              <select
                v-model="form.llmProviderId"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="">Default provider</option>
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
              Optional LLM provider for this classifier. Leave empty to use the default provider.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Classification Prompt <span class="required">*</span>
            </label>
            <PromptEditor
              v-model="form.prompt"
              :disabled="isLoading"
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
