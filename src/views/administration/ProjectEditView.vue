<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, useApiKeysStore, useProvidersStore } from '@/stores'
import { ArrowLeft, Save, Plus, Trash2, X } from 'lucide-vue-next'
import type { ProjectResponse, ApiKeyResponse, AsrConfig } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'voice' | 'apiKeys' | 'metadata'>('basic')
const form = ref({
  name: '',
  description: '',
  asrConfig: {
    asrProviderId: '',
    settings: {
      language: '',
      dictionaryPhrases: [] as string[],
      audioFormat: '' as '' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100'
    },
    unintelligiblePlaceholder: '',
    voiceActivityDetection: false
  },
  acceptVoice: false,
  generateVoice: false,
  version: undefined as number | undefined,
})

const showApiKeyModal = ref(false)
const selectedApiKey = ref<ApiKeyResponse | null>(null)
const apiKeysLoading = ref(false)
const apiKeysError = ref<string | null>(null)
const newPhrase = ref('')
const createPlaygroundApiKey = ref(true)

// Computed
const projectId = computed(() => route.params.projectId as string | undefined)
const isEditMode = computed(() => !!projectId.value)
const currentProject = ref<ProjectResponse | null>(null)

const asrProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'asr')
)

const filteredApiKeys = computed(() => {
  if (!currentProject.value) return []
  return apiKeysStore.items.filter(key => key.projectId === currentProject.value!.id)
})

const metadataFields = computed(() => {
  if (!currentProject.value) return []
  return [
    { label: 'Project ID', value: currentProject.value.id, format: 'mono' as const },
    { label: 'Version', value: currentProject.value.version },
    { label: 'Created', value: currentProject.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentProject.value.updatedAt, format: 'date' as const },
  ]
})

// Lifecycle
onMounted(async () => {
  // Load providers for ASR dropdown
  await providersStore.fetchAll()
  
  if (isEditMode.value) {
    await loadProject()
  }
})

// Watch tab changes to reload API keys
watch(activeTab, (newTab) => {
  if (newTab === 'apiKeys' && currentProject.value) {
    loadApiKeys()
  }
})

// Methods
async function loadProject() {
  if (!projectId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentProject.value = await projectsStore.fetchById(projectId.value)
    if (currentProject.value) {
      form.value = {
        name: currentProject.value.name,
        description: currentProject.value.description ?? '',
        asrConfig: {
          asrProviderId: currentProject.value.asrConfig?.asrProviderId || '',
          settings: {
            language: currentProject.value.asrConfig?.settings?.language || '',
            dictionaryPhrases: currentProject.value.asrConfig?.settings?.dictionaryPhrases || [],
            audioFormat: (currentProject.value.asrConfig?.settings?.audioFormat || '') as '' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100'
          },
          unintelligiblePlaceholder: currentProject.value.asrConfig?.unintelligiblePlaceholder || '',
          voiceActivityDetection: currentProject.value.asrConfig?.voiceActivityDetection || false
        },
        acceptVoice: currentProject.value.acceptVoice ?? false,
        generateVoice: currentProject.value.generateVoice ?? false,
        version: currentProject.value.version,
      }
      
      // Load API keys for edit mode
      await loadApiKeys()
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load project'
  } finally {
    isLoading.value = false
  }
}

async function loadApiKeys() {
  if (!currentProject.value) return
  
  apiKeysLoading.value = true
  apiKeysError.value = null
  
  try {
    await apiKeysStore.fetchAll({
      filters: {
        projectId: currentProject.value.id
      }
    })
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to load API keys'
  } finally {
    apiKeysLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    // Build ASR config only if provider is selected
    const asrConfig: AsrConfig | undefined = form.value.asrConfig.asrProviderId ? {
      asrProviderId: form.value.asrConfig.asrProviderId,
      settings: {
        ...(form.value.asrConfig.settings.language && { language: form.value.asrConfig.settings.language }),
        ...(form.value.asrConfig.settings.dictionaryPhrases.length > 0 && { dictionaryPhrases: form.value.asrConfig.settings.dictionaryPhrases }),
        ...(form.value.asrConfig.settings.audioFormat && { audioFormat: form.value.asrConfig.settings.audioFormat })
      },
      ...(form.value.asrConfig.unintelligiblePlaceholder && { unintelligiblePlaceholder: form.value.asrConfig.unintelligiblePlaceholder }),
      voiceActivityDetection: form.value.asrConfig.voiceActivityDetection
    } : undefined

    if (isEditMode.value && currentProject.value) {
      // Update existing project
      await projectsStore.update(currentProject.value.id, {
        version: currentProject.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        asrConfig,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
      })
    } else {
      // Create new project
      const newProject = await projectsStore.create({
        name: form.value.name,
        description: form.value.description || undefined,
        asrConfig,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
      })

      // Create Playground API key if checkbox is checked
      if (createPlaygroundApiKey.value && newProject) {
        try {
          await apiKeysStore.create({
            projectId: newProject.id,
            name: 'Playground',
            metadata: {
              autoCreated: true,
              createdDuring: 'projectCreation'
            }
          })
        } catch (err: any) {
          // Don't fail project creation if API key creation fails
          console.error('Failed to create Playground API key:', err)
        }
      }
    }

    // Navigate back to projects list
    router.push({ name: 'administration.projects' })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} project`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.projects' })
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

// Dictionary phrases management
function addDictionaryPhrase() {
  if (newPhrase.value.trim()) {
    form.value.asrConfig.settings.dictionaryPhrases.push(newPhrase.value.trim())
    newPhrase.value = ''
  }
}

function removeDictionaryPhrase(index: number) {
  form.value.asrConfig.settings.dictionaryPhrases.splice(index, 1)
}

// API Key management
function handleCreateApiKey() {
  selectedApiKey.value = null
  showApiKeyModal.value = true
}

function handleEditApiKey(apiKey: ApiKeyResponse) {
  selectedApiKey.value = apiKey
  showApiKeyModal.value = true
}

async function handleApiKeySave(data: any) {
  apiKeysError.value = null
  
  try {
    if (selectedApiKey.value) {
      // Update existing key
      await apiKeysStore.update(selectedApiKey.value.id, data)
    } else {
      // Create new key
      const newKey = await apiKeysStore.create({
        projectId: data.projectId,
        name: data.name,
        metadata: data.metadata
      })
      
      // Show the modal again with the new key (which includes the secret)
      if (newKey) {
        selectedApiKey.value = newKey
        // Don't close the modal - let user see and copy the key
        return
      }
    }
    
    // Close modal and reload keys
    showApiKeyModal.value = false
    selectedApiKey.value = null
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to save API key'
  }
}

function handleApiKeyModalClose() {
  showApiKeyModal.value = false
  selectedApiKey.value = null
}

async function handleToggleApiKey(apiKey: ApiKeyResponse) {
  apiKeysError.value = null
  
  try {
    await apiKeysStore.update(apiKey.id, {
      isActive: !apiKey.isActive,
      version: apiKey.version
    })
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to update API key'
  }
}

async function handleDeleteApiKey(apiKey: ApiKeyResponse) {
  if (!confirm(`Are you sure you want to delete the API key "${apiKey.name}"? This action cannot be undone.`)) {
    return
  }
  
  apiKeysError.value = null
  
  try {
    await apiKeysStore.remove(apiKey.id, apiKey.version)
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to delete API key'
  }
}
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to projects">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">{{ isEditMode ? 'Edit Project' : 'Create Project' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update project configuration and settings' : 'Create a new AI application project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Project') }}
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
          @click="activeTab = 'voice'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'voice' }]"
          type="button"
        >
          Voice Settings
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'apiKeys'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'apiKeys' }]"
          type="button"
        >
          API Keys
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
      Loading project...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode && !currentProject" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Projects
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-900">
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
              Project Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="My AI Project"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A descriptive name for your AI application project</p>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Optional description of what this project does"
              class="form-textarea"
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">Provide additional context about the project's purpose</p>
          </div>

          <!-- Create Playground API Key Checkbox (only when creating) -->
          <div v-if="!isEditMode" class="form-group bg-purple-50 p-4 rounded-lg border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="createPlaygroundApiKey"
                type="checkbox"
                class="form-checkbox"
                :disabled="isLoading"
              />
              <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Create API key for Playground
              </span>
            </label>
            <p class="form-help-text mt-1">
              Automatically create a "Playground" API key for testing and development
            </p>
          </div>
        </div>

        <!-- Voice Settings Tab -->
        <div v-show="activeTab === 'voice'" class="tab-content">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Voice Input & Output Configuration</h3>
              <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                Configure voice capabilities for your conversations, including speech recognition (ASR) and text-to-speech (TTS).
              </p>
            </div>
            
            <!-- Voice Input Checkbox (Top) -->
            <div class="form-group bg-blue-50 p-4 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.acceptVoice"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable Voice Input
                </span>
              </label>
              <p class="form-help-text mt-1">
                Allow conversations to accept voice input (requires ASR provider configured below)
              </p>
            </div>

            <!-- Voice Output Checkbox -->
            <div class="form-group bg-green-50 p-4 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.generateVoice"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable Voice Output
                </span>
              </label>
              <p class="form-help-text mt-1 text-gray-500 dark:text-gray-400">
                Allow conversations to generate voice responses using text-to-speech
              </p>
            </div>

            <div class="border-t border-gray-200 pt-6 dark:border-gray-700">
              <h4 class="text-base font-semibold text-gray-900 mb-4 dark:text-white">ASR Configuration</h4>
              
              <div class="form-group">
                <label class="form-label">
                  Unintelligible Placeholder <span class="text-gray-500">(optional)</span>
                </label>
                <input
                  v-model="form.asrConfig.unintelligiblePlaceholder"
                  type="text"
                  placeholder="e.g., [unintelligible]"
                  class="form-input"
                  :disabled="isLoading"
                />
                <p class="form-help-text">
                  Text to use when speech is unintelligible or cannot be transcribed
                </p>
              </div>

              <div class="form-group">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="form.asrConfig.voiceActivityDetection"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="isLoading"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Enable Voice Activity Detection
                  </span>
                </label>
                <p class="form-help-text mt-1">
                  Automatically start/stop recording based on speech presence
                </p>
              </div>

              <div class="form-group mt-6">
                <label class="form-label">
                  ASR Provider
                  <span v-if="form.acceptVoice" class="required">*</span>
                  <span v-else class="text-gray-500">(optional)</span>
                </label>
                <select
                  v-model="form.asrConfig.asrProviderId"
                  class="form-select"
                  :disabled="isLoading"
                  :required="form.acceptVoice"
                >
                  <option value="">None</option>
                  <option v-for="provider in asrProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                <p class="form-help-text">
                  Select the Automatic Speech Recognition provider for voice input{{ form.acceptVoice ? ' (required when voice input is enabled)' : '' }}
                </p>
              </div>

              <!-- ASR Provider Settings (shown when provider is selected) -->
              <div v-if="form.asrConfig.asrProviderId" class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4 dark:bg-blue-900/20 dark:border-blue-800">
                <div class="form-group">
                  <label class="form-label">
                    Language <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model="form.asrConfig.settings.language"
                    type="text"
                    placeholder="e.g., en-US, es-ES, fr-FR"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Language code for speech recognition (e.g., "en-US", "es-ES", "fr-FR")
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Audio Format <span class="text-gray-500">(optional)</span>
                  </label>
                  <select
                    v-model="form.asrConfig.settings.audioFormat"
                    class="form-select"
                    :disabled="isLoading"
                  >
                    <option value="">Default</option>
                    <option value="pcm_16000">PCM 16kHz</option>
                    <option value="pcm_22050">PCM 22.05kHz</option>
                    <option value="pcm_44100">PCM 44.1kHz</option>
                  </select>
                  <p class="form-help-text">
                    Audio input format for speech recognition
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Dictionary Phrases <span class="text-gray-500">(optional)</span>
                  </label>
                  <div class="flex gap-2 mb-2">
                    <input
                      v-model="newPhrase"
                      type="text"
                      placeholder="Add a phrase"
                      class="form-input"
                      :disabled="isLoading"
                      @keyup.enter="addDictionaryPhrase"
                    />
                    <button
                      type="button"
                      @click="addDictionaryPhrase"
                      class="btn-secondary whitespace-nowrap"
                      :disabled="isLoading"
                    >
                      <Plus class="inline-block w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                  <div v-if="form.asrConfig.settings.dictionaryPhrases.length > 0" class="space-y-1">
                    <div
                      v-for="(phrase, index) in form.asrConfig.settings.dictionaryPhrases"
                      :key="index"
                      class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ phrase }}</span>
                      <button
                        type="button"
                        @click="removeDictionaryPhrase(index)"
                        class="btn-icon text-red-600 hover:bg-red-50"
                        title="Remove phrase"
                        :disabled="isLoading"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="form-help-text">
                    Custom phrases to improve recognition accuracy for domain-specific terms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Keys Tab -->
        <div v-show="activeTab === 'apiKeys' && isEditMode" class="tab-content">
          <div class="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Manage API keys for this project</p>
            </div>
            <button @click="handleCreateApiKey" class="btn-primary" type="button">
              <Plus class="inline-block w-4 h-4 mr-2" />
              Create API Key
            </button>
          </div>

          <div v-if="apiKeysLoading" class="text-center py-8 text-gray-500">
            Loading API keys...
          </div>
          
          <div v-else-if="apiKeysError" class="alert-error">
            {{ apiKeysError }}
          </div>

          <div v-else-if="filteredApiKeys.length === 0" class="text-center py-8 text-gray-500">
            No API keys yet. Create one to get started.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="apiKey in filteredApiKeys"
              :key="apiKey.id"
              class="bg-white border border-gray-200 rounded-lg p-4 transition-all hover:shadow dark:bg-gray-800 dark:border-gray-700"
            >
              <div class="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ apiKey.name }}</h4>
                    <span
                      :class="[
                        'badge',
                        apiKey.isActive ? 'badge-active' : 'badge-inactive'
                      ]"
                    >
                      {{ apiKey.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ apiKey.keyPreview }}</p>
                  <div class="text-xs text-gray-500 mt-1">
                    <span>Created: {{ formatDate(apiKey.createdAt) }}</span>
                    <span class="mx-2">•</span>
                    <span>Last used: {{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="handleToggleApiKey(apiKey)"
                    class="btn-secondary text-sm"
                    :title="apiKey.isActive ? 'Deactivate' : 'Activate'"
                    type="button"
                  >
                    {{ apiKey.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="handleEditApiKey(apiKey)"
                    class="btn-secondary text-sm"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    @click="handleDeleteApiKey(apiKey)"
                    class="btn-danger text-sm"
                    type="button"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentProject"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        </form>
      </div>
    </div>

    <!-- API Key Edit Modal -->
    <ApiKeyEditModal
      v-if="showApiKeyModal"
      :api-key="selectedApiKey"
      :project-id="currentProject?.id || ''"
      @close="handleApiKeyModalClose"
      @save="handleApiKeySave"
    />
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
.required {
  color: #ef4444;
}


.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}
</style>
