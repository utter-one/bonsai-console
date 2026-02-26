<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, useApiKeysStore, useProvidersStore } from '@/stores'
import { ArrowLeft, Save, Plus, Trash2, X, Settings, Check } from 'lucide-vue-next'
import type { ProjectResponse, ApiKeyResponse, AsrConfig } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'
import StorageSettingsModal from '@/components/modals/StorageSettingsModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'voice' | 'storage' | 'apiKeys' | 'metadata'>('basic')
const form = ref({
  name: '',
  description: '',
  asrConfig: {
    asrProviderId: '',
    settings: {} as any,
    unintelligiblePlaceholder: '',
    voiceActivityDetection: false
  },
  storageConfig: {
    storageProviderId: '',
    settings: {} as any
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
const newKeyterm = ref('')
const createPlaygroundApiKey = ref(true)
const showStorageSettingsModal = ref(false)
const deepgramEndpointingEnabled = ref(true)
const deepgramEndpointingValue = ref(300)

// Computed
const projectId = computed(() => route.params.projectId as string | undefined)
const isEditMode = computed(() => !!projectId.value)
const currentProject = ref<ProjectResponse | null>(null)

const asrProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'asr')
)

const storageProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'storage')
)

const selectedStorageProvider = computed(() => {
  if (!form.value.storageConfig.storageProviderId) return null
  return storageProviders.value.find(p => p.id === form.value.storageConfig.storageProviderId) || null
})

const selectedAsrProvider = computed(() => {
  if (!form.value.asrConfig.asrProviderId) return null
  return asrProviders.value.find(p => p.id === form.value.asrConfig.asrProviderId) || null
})

const isAzureAsrProvider = computed(() => {
  const apiType = selectedAsrProvider.value?.apiType?.toLowerCase()
  return apiType === 'azure-speech' || apiType === 'azure'
})

const isElevenLabsAsrProvider = computed(() => {
  const apiType = selectedAsrProvider.value?.apiType?.toLowerCase()
  return apiType === 'elevenlabs-scribe' || apiType === 'elevenlabs'
})

const isDeepgramAsrProvider = computed(() => {
  const apiType = selectedAsrProvider.value?.apiType?.toLowerCase()
  return apiType === 'deepgram'
})

const isAssemblyAiAsrProvider = computed(() => {
  const apiType = selectedAsrProvider.value?.apiType?.toLowerCase()
  return apiType === 'assemblyai'
})

// Sync endpointing checkbox/input state from form settings
watch(() => form.value.asrConfig.settings.endpointing, (value) => {
  if (isDeepgramAsrProvider.value) {
    if (value === false) {
      deepgramEndpointingEnabled.value = false
      deepgramEndpointingValue.value = 300
    } else if (typeof value === 'number') {
      deepgramEndpointingEnabled.value = true
      deepgramEndpointingValue.value = value
    } else {
      // undefined or other - default to enabled with 300ms
      deepgramEndpointingEnabled.value = true
      deepgramEndpointingValue.value = 300
    }
  }
}, { immediate: true })

// Update form settings when checkbox changes
watch(deepgramEndpointingEnabled, (enabled) => {
  if (isDeepgramAsrProvider.value) {
    if (enabled) {
      form.value.asrConfig.settings.endpointing = deepgramEndpointingValue.value
    } else {
      form.value.asrConfig.settings.endpointing = false
    }
  }
})

// Update form settings when input value changes
watch(deepgramEndpointingValue, (value) => {
  if (isDeepgramAsrProvider.value && deepgramEndpointingEnabled.value) {
    form.value.asrConfig.settings.endpointing = value
  }
})

const filteredApiKeys = computed(() => {
  if (!currentProject.value) return []
  return apiKeysStore.items
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
function handleAsrProviderChange() {
  const providerId = form.value.asrConfig.asrProviderId
  
  if (!providerId) {
    // Provider cleared - reset settings
    form.value.asrConfig.settings = {}
    return
  }
  
  // Initialize settings structure based on provider type
  const provider = asrProviders.value.find(p => p.id === providerId)
  const apiType = provider?.apiType?.toLowerCase()
  
  if (apiType === 'azure-speech' || apiType === 'azure') {
    // Azure ASR - initialize with empty Azure structure
    form.value.asrConfig.settings = {
      language: undefined,
      dictionaryPhrases: [],
      audioFormat: undefined
    }
  } else if (apiType === 'elevenlabs-scribe' || apiType === 'elevenlabs') {
    // ElevenLabs ASR - initialize with empty ElevenLabs structure
    form.value.asrConfig.settings = {
      modelId: undefined,
      audioFormat: undefined,
      languageCode: undefined,
      includeTimestamps: false,
      includeLanguageDetection: false,
      commitStrategy: undefined,
      vadSilenceThresholdSecs: undefined,
      vadThreshold: undefined,
      minSpeechDurationMs: undefined,
      minSilenceDurationMs: undefined,
      enableLogging: true
    }
  } else if (apiType === 'deepgram') {
    // Deepgram ASR - initialize with empty Deepgram structure
    form.value.asrConfig.settings = {
      modelId: undefined,
      audioFormat: undefined,
      language: undefined,
      interimResults: false,
      endpointing: 300,
      smartFormat: true,
      punctuate: true,
      diarize: false,
      utteranceEndMs: undefined,
      vadEvents: false,
      enableLogging: true
    }
  } else if (apiType === 'assemblyai') {
    // AssemblyAI ASR - initialize with defaults
    form.value.asrConfig.settings = {
      sampleRate: 16000,
      formatTurns: false,
      speechModel: 'universal-streaming-english',
      language: undefined,
      keytermsPrompt: [],
      vadThreshold: 0.4,
      endOfTurnConfidenceThreshold: 0.4,
      minEndOfTurnSilenceWhenConfident: 400,
      maxTurnSilence: 1280,
      inactivityTimeout: undefined
    }
  } else {
    // Unknown provider - generic empty structure
    form.value.asrConfig.settings = {}
  }
}

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
          settings: currentProject.value.asrConfig?.settings || {},
          unintelligiblePlaceholder: currentProject.value.asrConfig?.unintelligiblePlaceholder || '',
          voiceActivityDetection: currentProject.value.asrConfig?.voiceActivityDetection || false
        },
        storageConfig: {
          storageProviderId: currentProject.value.storageConfig?.storageProviderId || '',
          settings: currentProject.value.storageConfig?.settings || {}
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
    await apiKeysStore.fetchAll(currentProject.value.id)
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to load API keys'
  } finally {
    apiKeysLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  console.log(route.params.projectId, form.value, isEditMode.value, currentProject.value)

  try {
    // Build ASR config only if provider is selected
    const asrConfig: AsrConfig | undefined = form.value.asrConfig.asrProviderId ? {
      asrProviderId: form.value.asrConfig.asrProviderId,
      ...(Object.keys(form.value.asrConfig.settings || {}).length > 0 && {
        settings: form.value.asrConfig.settings
      }),
      ...(form.value.asrConfig.unintelligiblePlaceholder && { unintelligiblePlaceholder: form.value.asrConfig.unintelligiblePlaceholder }),
      voiceActivityDetection: form.value.asrConfig.voiceActivityDetection
    } : undefined

    // Build storage config only if provider is selected
    const storageConfig = form.value.storageConfig.storageProviderId ? {
      storageProviderId: form.value.storageConfig.storageProviderId,
      ...(Object.keys(form.value.storageConfig.settings || {}).length > 0 && {
        settings: form.value.storageConfig.settings
      })
    } : undefined

    if (isEditMode.value && currentProject.value) {
      // Update existing project
      const updated = await projectsStore.update(currentProject.value.id, {
        version: currentProject.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        asrConfig,
        storageConfig,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
      })
      
      // Update currentProject with the response to get the new version
      currentProject.value = updated
    } else {
      // Create new project
      const newProject = await projectsStore.create({
        name: form.value.name,
        description: form.value.description || undefined,
        asrConfig,
        storageConfig,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
      })

      // Set currentProject to the newly created project
      currentProject.value = newProject

      // Create Playground API key if checkbox is checked
      if (createPlaygroundApiKey.value && newProject) {
        try {
          await apiKeysStore.create(newProject.id, {
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
      
      // Navigate to edit mode
      await router.push({
        name: 'administration.projects.edit',
        params: { projectId: newProject.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
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

// Dictionary phrases management (Azure ASR)
function addDictionaryPhrase() {
  if (!newPhrase.value.trim()) return
  
  if (!form.value.asrConfig.settings.dictionaryPhrases) {
    form.value.asrConfig.settings.dictionaryPhrases = []
  }
  
  form.value.asrConfig.settings.dictionaryPhrases.push(newPhrase.value.trim())
  newPhrase.value = ''
}

function removeDictionaryPhrase(index: number | string) {
  if (form.value.asrConfig.settings.dictionaryPhrases) {
    form.value.asrConfig.settings.dictionaryPhrases.splice(Number(index), 1)
  }
}

function addKeyterm() {
  if (!newKeyterm.value.trim()) return
  
  if (!form.value.asrConfig.settings.keytermsPrompt) {
    form.value.asrConfig.settings.keytermsPrompt = []
  }
  
  form.value.asrConfig.settings.keytermsPrompt.push(newKeyterm.value.trim())
  newKeyterm.value = ''
}

function removeKeyterm(index: number | string) {
  if (form.value.asrConfig.settings.keytermsPrompt) {
    form.value.asrConfig.settings.keytermsPrompt.splice(Number(index), 1)
  }
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
      await apiKeysStore.update(selectedApiKey.value.projectId, selectedApiKey.value.id, data)
    } else {
      // Create new key
      const newKey = await apiKeysStore.create(currentProject.value!.id, {
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
    await apiKeysStore.update(apiKey.projectId, apiKey.id, {
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
    await apiKeysStore.remove(apiKey.projectId, apiKey.id, apiKey.version)
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to delete API key'
  }
}

// Storage settings management
function handleConfigureStorageSettings() {
  showStorageSettingsModal.value = true
}

function handleStorageSettingsSave(settings: any) {
  form.value.storageConfig.settings = settings
  showStorageSettingsModal.value = false
}

function handleStorageSettingsClose() {
  showStorageSettingsModal.value = false
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
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Project')) }}
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
          @click="activeTab = 'storage'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'storage' }]"
          type="button"
        >
          Storage
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
                  @change="handleAsrProviderChange"
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

              <!-- Azure ASR Settings -->
              <div v-if="form.asrConfig.asrProviderId && isAzureAsrProvider" class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4 dark:bg-blue-900/20 dark:border-blue-800">
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
                    <option :value="undefined">Default</option>
                    <option value="mp3">MP3</option>
                    <option value="opus">Opus</option>
                    <option value="aac">AAC</option>
                    <option value="flac">FLAC</option>
                    <option value="wav">WAV</option>
                    <option value="pcm_8000">PCM 8kHz</option>
                    <option value="pcm_16000">PCM 16kHz</option>
                    <option value="pcm_22050">PCM 22.05kHz</option>
                    <option value="pcm_24000">PCM 24kHz</option>
                    <option value="pcm_44100">PCM 44.1kHz</option>
                    <option value="pcm_48000">PCM 48kHz</option>
                    <option value="mulaw">μ-law</option>
                    <option value="alaw">A-law</option>
                    <option value="linear16">Linear16</option>
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
                  <div v-if="form.asrConfig.settings.dictionaryPhrases && form.asrConfig.settings.dictionaryPhrases.length > 0" class="space-y-2">
                    <div
                      v-for="(phrase, index) in form.asrConfig.settings.dictionaryPhrases"
                      :key="index"
                      class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ phrase }}</span>
                      <button
                        type="button"
                        @click="removeDictionaryPhrase(index)"
                        class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        title="Remove phrase"
                        :disabled="isLoading"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="form-help-text mt-2">
                    Custom phrases to improve recognition accuracy for domain-specific terms
                  </p>
                </div>
              </div>

              <!-- ElevenLabs ASR Settings -->
              <div v-if="form.asrConfig.asrProviderId && isElevenLabsAsrProvider" class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4 dark:bg-blue-900/20 dark:border-blue-800">
                <div class="form-group">
                  <label class="form-label">
                    Model ID <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model="form.asrConfig.settings.modelId"
                    type="text"
                    placeholder="e.g., scribe_v2_realtime"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Model to use for transcription (defaults to scribe_v2_realtime)
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
                    <option :value="undefined">Default (PCM 16kHz)</option>
                    <option value="pcm_8000">PCM 8kHz</option>
                    <option value="pcm_16000">PCM 16kHz</option>
                    <option value="pcm_22050">PCM 22.05kHz</option>
                    <option value="pcm_24000">PCM 24kHz</option>
                    <option value="pcm_44100">PCM 44.1kHz</option>
                  </select>
                  <p class="form-help-text">
                    Audio encoding format for speech-to-text
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Language Code <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model="form.asrConfig.settings.languageCode"
                    type="text"
                    placeholder="e.g., en, es, fr"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Language code in ISO 639-1 or ISO 639-3 format (e.g., "en", "es")
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.includeTimestamps"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Include Timestamps
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Receive word-level timestamps in transcription results
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.includeLanguageDetection"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Include Language Detection
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Include detected language code in transcription results
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Commit Strategy <span class="text-gray-500">(optional)</span>
                  </label>
                  <select
                    v-model="form.asrConfig.settings.commitStrategy"
                    class="form-select"
                    :disabled="isLoading"
                  >
                    <option :value="undefined">Default (Manual)</option>
                    <option value="manual">Manual</option>
                    <option value="vad">Voice Activity Detection (VAD)</option>
                  </select>
                  <p class="form-help-text">
                    Strategy for committing transcriptions
                  </p>
                </div>

                <!-- VAD Settings (shown when commit strategy is VAD) -->
                <div v-if="form.asrConfig.settings.commitStrategy === 'vad'" class="pl-4 border-l-2 border-green-200 bg-green-50 p-4 rounded-r space-y-4 dark:bg-green-900/20 dark:border-green-800">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Voice Activity Detection Settings</h4>
                  
                  <div class="form-group">
                    <label class="form-label">
                      Silence Threshold (seconds)
                    </label>
                    <input
                      v-model.number="form.asrConfig.settings.vadSilenceThresholdSecs"
                      type="number"
                      min="0.3"
                      max="3"
                      step="0.1"
                      class="form-input"
                      placeholder="1.5"
                      :disabled="isLoading"
                    />
                    <p class="form-help-text">
                      Silence duration before committing (0.3-3 seconds, default: 1.5)
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      VAD Threshold
                    </label>
                    <input
                      v-model.number="form.asrConfig.settings.vadThreshold"
                      type="number"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      class="form-input"
                      placeholder="0.4"
                      :disabled="isLoading"
                    />
                    <p class="form-help-text">
                      Detection sensitivity (0.1-0.9, default: 0.4)
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Minimum Speech Duration (ms)
                    </label>
                    <input
                      v-model.number="form.asrConfig.settings.minSpeechDurationMs"
                      type="number"
                      min="50"
                      max="2000"
                      step="10"
                      class="form-input"
                      placeholder="100"
                      :disabled="isLoading"
                    />
                    <p class="form-help-text">
                      Minimum speech duration (50-2000ms, default: 100)
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Minimum Silence Duration (ms)
                    </label>
                    <input
                      v-model.number="form.asrConfig.settings.minSilenceDurationMs"
                      type="number"
                      min="50"
                      max="2000"
                      step="10"
                      class="form-input"
                      placeholder="100"
                      :disabled="isLoading"
                    />
                    <p class="form-help-text">
                      Minimum silence duration (50-2000ms, default: 100)
                    </p>
                  </div>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.enableLogging"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Enable Logging
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    When disabled, zero retention mode is used (enterprise only)
                  </p>
                </div>
              </div>

              <!-- Deepgram ASR Settings -->
              <div v-if="form.asrConfig.asrProviderId && isDeepgramAsrProvider" class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4 dark:bg-blue-900/20 dark:border-blue-800">
                <div class="form-group">
                  <label class="form-label">
                    Model ID <span class="text-gray-500">(optional)</span>
                  </label>
                  <select
                    v-model="form.asrConfig.settings.modelId"
                    class="form-select"
                    :disabled="isLoading"
                  >
                    <option :value="undefined">Default (nova-3)</option>
                    <option value="nova-3">nova-3</option>
                    <option value="nova-3-general">nova-3-general</option>
                    <option value="nova-3-medical">nova-3-medical</option>
                    <option value="nova-2">nova-2</option>
                    <option value="nova-2-general">nova-2-general</option>
                    <option value="nova-2-meeting">nova-2-meeting</option>
                    <option value="nova-2-finance">nova-2-finance</option>
                    <option value="nova-2-conversationalai">nova-2-conversationalai</option>
                    <option value="nova-2-voicemail">nova-2-voicemail</option>
                    <option value="nova-2-video">nova-2-video</option>
                    <option value="nova-2-medical">nova-2-medical</option>
                    <option value="nova-2-drivethru">nova-2-drivethru</option>
                    <option value="nova-2-automotive">nova-2-automotive</option>
                    <option value="nova">nova</option>
                    <option value="nova-general">nova-general</option>
                    <option value="nova-phonecall">nova-phonecall</option>
                    <option value="nova-medical">nova-medical</option>
                    <option value="enhanced">enhanced</option>
                    <option value="enhanced-general">enhanced-general</option>
                    <option value="enhanced-meeting">enhanced-meeting</option>
                    <option value="enhanced-phonecall">enhanced-phonecall</option>
                    <option value="enhanced-finance">enhanced-finance</option>
                    <option value="base">base</option>
                    <option value="meeting">meeting</option>
                    <option value="phonecall">phonecall</option>
                    <option value="finance">finance</option>
                    <option value="conversationalai">conversationalai</option>
                    <option value="voicemail">voicemail</option>
                    <option value="video">video</option>
                    <option value="custom">custom</option>
                  </select>
                  <p class="form-help-text">
                    Model to use for transcription (defaults to nova-3)
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
                    <option :value="undefined">Default (PCM 16kHz)</option>
                    <option value="pcm_8000">PCM 8kHz</option>
                    <option value="pcm_16000">PCM 16kHz</option>
                    <option value="pcm_22050">PCM 22.05kHz</option>
                    <option value="pcm_24000">PCM 24kHz</option>
                    <option value="pcm_44100">PCM 44.1kHz</option>
                  </select>
                  <p class="form-help-text">
                    Audio encoding format for speech-to-text
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Language <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model="form.asrConfig.settings.language"
                    type="text"
                    placeholder="e.g., en-US, es, fr"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    BCP-47 language tag (e.g., "en-US", "es", "fr")
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.interimResults"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Enable Interim Results
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Enable interim (partial) transcription results during streaming
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="deepgramEndpointingEnabled"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Enable Endpointing
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Automatically finalize speech after a period of silence
                  </p>
                  <div v-if="deepgramEndpointingEnabled" class="mt-3">
                    <label class="form-label text-sm">
                      Silence Duration (ms)
                    </label>
                    <input
                      v-model.number="deepgramEndpointingValue"
                      type="number"
                      min="10"
                      required
                      placeholder="300"
                      class="form-input"
                      :disabled="isLoading"
                    />
                    <p class="form-help-text">
                      Milliseconds of silence to wait before finalizing speech (minimum: 10)
                    </p>
                  </div>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.smartFormat"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Smart Format
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Apply formatting (punctuation, capitalization, currency, etc.) to improve readability
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.punctuate"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Punctuate
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Add punctuation and capitalization to transcript
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.diarize"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Diarize
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Recognize and label different speakers in the audio
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Utterance End (ms) <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.utteranceEndMs"
                    type="number"
                    min="10"
                    placeholder="Leave empty for default"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Milliseconds to wait before sending UtteranceEnd event (use with interim results)
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.vadEvents"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      VAD Events
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Send SpeechStarted events when speech is detected
                  </p>
                </div>
              </div>

              <!-- AssemblyAI ASR Settings -->
              <div v-if="form.asrConfig.asrProviderId && isAssemblyAiAsrProvider" class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4 dark:bg-blue-900/20 dark:border-blue-800">
                <div class="form-group">
                  <label class="form-label">
                    Sample Rate <span class="required">*</span>
                  </label>
                  <select
                    v-model.number="form.asrConfig.settings.sampleRate"
                    class="form-select"
                    required
                    :disabled="isLoading"
                  >
                    <option :value="8000">8000 Hz</option>
                    <option :value="16000">16000 Hz (default)</option>
                    <option :value="22050">22050 Hz</option>
                    <option :value="24000">24000 Hz</option>
                    <option :value="44100">44100 Hz</option>
                  </select>
                  <p class="form-help-text">
                    Audio sample rate (default: 16000)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Speech Model <span class="required">*</span>
                  </label>
                  <select
                    v-model="form.asrConfig.settings.speechModel"
                    class="form-select"
                    required
                    :disabled="isLoading"
                  >
                    <option value="universal-streaming-english">Universal Streaming (English)</option>
                    <option value="universal-streaming-multilingual">Universal Streaming (Multilingual)</option>
                  </select>
                  <p class="form-help-text">
                    Model: English-only or multilingual support
                  </p>
                </div>

                <div v-if="form.asrConfig.settings.speechModel === 'universal-streaming-multilingual'" class="form-group">
                  <label class="form-label">
                    Language Code
                  </label>
                  <input
                    v-model="form.asrConfig.settings.language"
                    type="text"
                    placeholder="e.g., en, es, fr, de, it, pt"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Language for multilingual model (en, es, fr, de, it, pt)
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.settings.formatTurns"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Format Turns (Add Capitalization & Punctuation)
                    </span>
                  </label>
                  <p class="form-help-text mt-1">
                    Warning: Adds latency, not recommended for voice agents
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    VAD Threshold
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.vadThreshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    placeholder="0.4"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Voice activity detection threshold (0.0-1.0, default: 0.4)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    End of Turn Confidence
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.endOfTurnConfidenceThreshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    placeholder="0.4"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Confidence threshold for end of turn (0.0-1.0, default: 0.4)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Min Silence (Confident) (ms)
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.minEndOfTurnSilenceWhenConfident"
                    type="number"
                    min="0"
                    placeholder="400"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Minimum silence when confident (default: 400ms)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Max Turn Silence (ms)
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.maxTurnSilence"
                    type="number"
                    min="0"
                    placeholder="1280"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Maximum silence before end of turn (default: 1280ms)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Inactivity Timeout (seconds) <span class="text-gray-500">(optional)</span>
                  </label>
                  <input
                    v-model.number="form.asrConfig.settings.inactivityTimeout"
                    type="number"
                    min="5"
                    max="3600"
                    placeholder="No timeout"
                    class="form-input"
                    :disabled="isLoading"
                  />
                  <p class="form-help-text">
                    Time before session termination (5-3600s, optional)
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Custom Keywords <span class="text-gray-500">(optional)</span>
                  </label>
                  <div class="flex gap-2 mb-2">
                    <input
                      v-model="newKeyterm"
                      type="text"
                      placeholder="Add a keyword"
                      class="form-input"
                      :disabled="isLoading"
                      @keyup.enter="addKeyterm"
                    />
                    <button
                      type="button"
                      @click="addKeyterm"
                      class="btn-secondary whitespace-nowrap"
                      :disabled="isLoading"
                    >
                      <Plus class="inline-block w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                  <div v-if="form.asrConfig.settings.keytermsPrompt && form.asrConfig.settings.keytermsPrompt.length > 0" class="space-y-2">
                    <div
                      v-for="(keyterm, index) in form.asrConfig.settings.keytermsPrompt"
                      :key="index"
                      class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ keyterm }}</span>
                      <button
                        type="button"
                        @click="removeKeyterm(index)"
                        class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        title="Remove keyword"
                        :disabled="isLoading"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="form-help-text mt-2">
                    Custom words/phrases to improve recognition accuracy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Tab -->
        <div v-show="activeTab === 'storage'" class="tab-content">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Storage Configuration</h3>
              <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                Configure storage for conversation artifacts such as audio recordings, transcripts, and other files. Storage providers allow conversations to persist data beyond the database.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Storage Provider <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.storageConfig.storageProviderId"
                class="form-select-auto"
                :disabled="isLoading"
              >
                <option value="">None</option>
                <option v-for="provider in storageProviders" :key="provider.id" :value="provider.id">
                  {{ provider.name }} ({{ provider.apiType }})
                </option>
              </select>
              <p class="form-help-text">
                Select a storage provider to enable persistent storage of conversation artifacts
              </p>
            </div>

            <div v-if="form.storageConfig.storageProviderId" class="space-y-4">
              <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Storage provider selected:</strong> {{ storageProviders.find(p => p.id === form.storageConfig.storageProviderId)?.name }}
                  </p>
                  <button
                    type="button"
                    @click="handleConfigureStorageSettings"
                    class="btn-secondary btn-sm"
                    :disabled="isLoading"
                  >
                    <Settings class="inline-block w-4 h-4 mr-1" />
                    Configure Settings
                  </button>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Storage settings {{ Object.keys(form.storageConfig.settings || {}).length > 0 ? 'configured' : 'not configured yet' }}. Click "Configure Settings" to set up bucket/container and other options.
                </p>
              </div>
            </div>

            <div v-else class="bg-gray-50 border border-gray-200 p-4 rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                No storage provider selected. Conversation artifacts will not be persisted to external storage.
              </p>
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

    <!-- Storage Settings Modal -->
    <StorageSettingsModal
      v-if="showStorageSettingsModal"
      :selected-provider="selectedStorageProvider"
      :settings="form.storageConfig.settings"
      @close="handleStorageSettingsClose"
      @save="handleStorageSettingsSave"
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
