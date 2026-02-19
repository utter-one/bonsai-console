<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore, useProviderCatalogStore } from '@/stores'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { ProviderResponse } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'

const route = useRoute()
const router = useRouter()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

// OpenAI-compatible provider presets
interface ProviderPreset {
  name: string
  displayName: string
  baseUrl: string
  urlPattern: RegExp
  icon: string // SVG path or simple identifier
  color: string // Brand color for the button
}

const providerPresets: ProviderPreset[] = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    urlPattern: /openai\.com/i,
    icon: 'O',
    color: '#10a37f'
  },
  {
    name: 'mistral',
    displayName: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    urlPattern: /mistral\.ai/i,
    icon: 'M',
    color: '#f2773d'
  },
  {
    name: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    urlPattern: /groq\.com/i,
    icon: 'G',
    color: '#f55036'
  },
  {
    name: 'together',
    displayName: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    urlPattern: /together\.xyz/i,
    icon: 'T',
    color: '#6366f1'
  },
  {
    name: 'fireworks',
    displayName: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    urlPattern: /fireworks\.ai/i,
    icon: 'F',
    color: '#ff6b35'
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity AI',
    baseUrl: 'https://api.perplexity.ai',
    urlPattern: /perplexity\.ai/i,
    icon: 'P',
    color: '#20808d'
  },
  {
    name: 'cohere',
    displayName: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    urlPattern: /cohere\.ai/i,
    icon: 'C',
    color: '#d18ee2'
  },
  {
    name: 'ai21',
    displayName: 'AI21 Labs',
    baseUrl: 'https://api.ai21.com/studio/v1',
    urlPattern: /ai21\.com/i,
    icon: '21',
    color: '#4a9eff'
  },
  {
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    urlPattern: /deepseek\.com/i,
    icon: 'D',
    color: '#1a73e8'
  },
  {
    name: 'xai',
    displayName: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    urlPattern: /x\.ai/i,
    icon: 'X',
    color: '#000000'
  },
  {
    name: 'cerebras',
    displayName: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    urlPattern: /cerebras\.ai/i,
    icon: 'Cb',
    color: '#0066cc'
  },
  {
    name: 'lepton',
    displayName: 'Lepton AI',
    baseUrl: 'https://api.lepton.ai/api/v1',
    urlPattern: /lepton\.ai/i,
    icon: 'L',
    color: '#8b5cf6'
  },
  {
    name: 'novita',
    displayName: 'Novita AI',
    baseUrl: 'https://api.novita.ai/v3/openai',
    urlPattern: /novita\.ai/i,
    icon: 'N',
    color: '#22c55e'
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    urlPattern: /openrouter\.ai/i,
    icon: 'OR',
    color: '#8b5cf6'
  }
]

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'metadata'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  providerType: 'llm' as 'asr' | 'tts' | 'llm' | 'embeddings' | 'storage',
  apiType: '',
  config: {
    apiKey: '',
    organizationId: '',
    baseUrl: '',
    region: '',
    subscriptionKey: '',
    // Storage config fields
    accessKeyId: '',
    secretAccessKey: '',
    endpoint: '',
    accountName: '',
    accountKey: '',
    projectId: '',
    keyFileJson: '',
    basePath: ''
  },
  createdBy: ''
})

// Computed
const providerId = computed(() => route.params.providerId as string | undefined)
const isEditMode = computed(() => !!providerId.value)
const currentProvider = ref<ProviderResponse | null>(null)

const providerTypes = [
  { value: 'llm', label: 'LLM (Large Language Model)' },
  { value: 'asr', label: 'ASR (Automatic Speech Recognition)' },
  { value: 'tts', label: 'TTS (Text-to-Speech)' },
  { value: 'embeddings', label: 'Embeddings' },
  { value: 'storage', label: 'Storage (S3, Azure Blob, GCS)' }
]

// API type options from provider catalog based on provider type
const apiTypeOptions = computed(() => {
  if (!providerCatalogStore.catalog) return []
  
  let providers: { apiType: string; displayName: string; description?: string }[] = []
  
  switch (form.value.providerType) {
    case 'llm':
    case 'embeddings':
      providers = providerCatalogStore.catalog.llm
      break
    case 'tts':
      providers = providerCatalogStore.catalog.tts
      break
    case 'asr':
      providers = providerCatalogStore.catalog.asr
      break
    case 'storage':
      providers = providerCatalogStore.catalog.storage || []
      break
    default:
      return []
  }
  
  // Map catalog providers to options, always include 'custom' option
  const options = providers.map(p => ({
    value: p.apiType,
    label: p.displayName,
    description: p.description
  }))
    
  return options
})

// Get description for selected API type
const selectedApiTypeDescription = computed(() => {
  const option = apiTypeOptions.value.find(o => o.value === form.value.apiType)
  return option?.description
})

// Check which config fields to show based on API type
const showOpenAIFields = computed(() => 
  form.value.apiType === 'openai' || form.value.apiType === 'openai-legacy' || form.value.apiType === 'groq'
)
const showAnthropicFields = computed(() => 
  form.value.apiType === 'anthropic'
)
const showGoogleFields = computed(() => 
  form.value.apiType === 'gemini'
)
const showElevenLabsFields = computed(() => 
  form.value.apiType === 'elevenlabs'
)
const showDeepgramFields = computed(() => 
  form.value.apiType === 'deepgram'
)
const showCartesiaFields = computed(() => 
  form.value.apiType === 'cartesia'
)
const showAzureASRFields = computed(() => 
  form.value.apiType === 'azure' && form.value.providerType === 'asr'
)
const showAzureTtsFields = computed(() => 
  form.value.apiType === 'azure' && form.value.providerType === 'tts'
)

// Storage provider config fields
const showS3Fields = computed(() => 
  form.value.apiType === 's3' && form.value.providerType === 'storage'
)
const showAzureBlobFields = computed(() => 
  form.value.apiType === 'azure-blob' && form.value.providerType === 'storage'
)
const showGcsFields = computed(() => 
  form.value.apiType === 'gcs' && form.value.providerType === 'storage'
)
const showLocalStorageFields = computed(() => 
  form.value.apiType === 'local' && form.value.providerType === 'storage'
)

// Detect which provider preset is currently selected based on baseUrl
const detectedProvider = computed(() => {
  const baseUrl = form.value.config.baseUrl
  if (!baseUrl) return null
  
  return providerPresets.find(preset => preset.urlPattern.test(baseUrl))
})

// Select a provider preset
function selectProviderPreset(preset: ProviderPreset) {
  form.value.config.baseUrl = preset.baseUrl
  
  // If creating a new provider and name is empty, suggest a name
  if (!isEditMode.value && !form.value.name) {
    form.value.name = preset.displayName
  }
}

// Lifecycle
onMounted(async () => {
  // Load provider catalog for API type options
  if (!providerCatalogStore.catalog) {
    try {
      await providerCatalogStore.fetchCatalog()
    } catch (err) {
      console.error('Failed to load provider catalog:', err)
    }
  }
  
  if (isEditMode.value) {
    await loadProvider()
  }
})

// Methods
async function loadProvider() {
  if (!providerId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentProvider.value = await providersStore.fetchById(providerId.value)
    if (currentProvider.value) {
      const config = currentProvider.value.config as any
      form.value = {
        id: currentProvider.value.id,
        name: currentProvider.value.name,
        description: currentProvider.value.description || '',
        providerType: currentProvider.value.providerType,
        apiType: currentProvider.value.apiType,
        config: {
          apiKey: config.apiKey || '',
          organizationId: config.organizationId || '',
          baseUrl: config.baseUrl || '',
          region: config.region || '',
          subscriptionKey: config.subscriptionKey || '',
          // Storage config fields
          accessKeyId: config.accessKeyId || '',
          secretAccessKey: config.secretAccessKey || '',
          endpoint: config.endpoint || '',
          accountName: config.accountName || '',
          accountKey: config.accountKey || '',
          projectId: config.projectId || '',
          keyFileJson: config.keyFileJson || '',
          basePath: config.basePath || ''
        },
        createdBy: currentProvider.value.createdBy || ''
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load provider'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  
  // Build config object based on API type
  let config: any = {}
  
  if (showOpenAIFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
    if (form.value.config.organizationId) {
      config.organizationId = form.value.config.organizationId
    }
    if (form.value.config.baseUrl) {
      config.baseUrl = form.value.config.baseUrl
    }
  } else if (showAnthropicFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
    if (form.value.config.baseUrl) {
      config.baseUrl = form.value.config.baseUrl
    }
  } else if (showGoogleFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
  } else if (showElevenLabsFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
  } else if (showDeepgramFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
  } else if (showCartesiaFields.value) {
    config = {
      apiKey: form.value.config.apiKey
    }
  } else if (showAzureASRFields.value) {
    config = {
      region: form.value.config.region,
      subscriptionKey: form.value.config.subscriptionKey
    }
  } else if (showAzureTtsFields.value) {
    config = {
      region: form.value.config.region,
      subscriptionKey: form.value.config.subscriptionKey
    }
  } else if (showS3Fields.value) {
    config = {
      accessKeyId: form.value.config.accessKeyId,
      secretAccessKey: form.value.config.secretAccessKey,
      region: form.value.config.region
    }
    if (form.value.config.endpoint) {
      config.endpoint = form.value.config.endpoint
    }
  } else if (showAzureBlobFields.value) {
    config = {
      accountName: form.value.config.accountName,
      accountKey: form.value.config.accountKey
    }
    if (form.value.config.endpoint) {
      config.endpoint = form.value.config.endpoint
    }
  } else if (showGcsFields.value) {
    config = {
      projectId: form.value.config.projectId,
      keyFileJson: form.value.config.keyFileJson
    }
  } else if (showLocalStorageFields.value) {
    config = {
      basePath: form.value.config.basePath
    }
    if (form.value.config.baseUrl) {
      config.baseUrl = form.value.config.baseUrl
    }
  } else {
    error.value = 'Please select a valid API type'
    return
  }

  // Validate required fields
  if (showAzureASRFields.value) {
    if (!config.region || !config.subscriptionKey) {
      error.value = 'Region and Subscription Key are required for Azure Speech'
      return
    }
  } else if (showAzureTtsFields.value) {
    if (!config.region || !config.subscriptionKey) {
      error.value = 'Region and Subscription Key are required for Azure Speech'
      return
    }
  } else if (showS3Fields.value) {
    if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
      error.value = 'Access Key ID, Secret Access Key, and Region are required for S3'
      return
    }
  } else if (showAzureBlobFields.value) {
    if (!config.accountName || !config.accountKey) {
      error.value = 'Account Name and Account Key are required for Azure Blob Storage'
      return
    }
  } else if (showGcsFields.value) {
    if (!config.projectId || !config.keyFileJson) {
      error.value = 'Project ID and Key File JSON are required for Google Cloud Storage'
      return
    }
  } else if (showLocalStorageFields.value) {
    if (!config.basePath) {
      error.value = 'Base Path is required for Local Storage'
      return
    }
  } else if (!showAzureASRFields.value && !showS3Fields.value && !showAzureBlobFields.value && !showGcsFields.value && !showLocalStorageFields.value) {
    if (!config.apiKey) {
      error.value = 'API Key is required'
      return
    }
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentProvider.value) {
      // Update existing provider
      const updated = await providersStore.update(currentProvider.value.id, {
        version: currentProvider.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        providerType: form.value.providerType,
        apiType: form.value.apiType,
        config: config
      })
      
      // Update currentProvider with the response to get the new version
      currentProvider.value = updated
    } else {
      // Create new provider
      const createData: any = {
        name: form.value.name,
        providerType: form.value.providerType,
        apiType: form.value.apiType,
        config: config
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include description if it's not empty
      if (form.value.description) {
        createData.description = form.value.description
      }

      // Only include createdBy if it's not empty
      if (form.value.createdBy) {
        createData.createdBy = form.value.createdBy
      }

      const created = await providersStore.create(createData)
      
      // Update currentProvider with the created provider
      currentProvider.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'administration.providers.edit',
        params: { providerId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} provider`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.providers' })
}

const metadataFields = computed(() => {
  if (!currentProvider.value) return []
  return [
    { label: 'Provider ID', value: currentProvider.value.id, format: 'mono' as const },
    { label: 'Created By', value: currentProvider.value.createdBy },
    { label: 'Version', value: currentProvider.value.version },
    { label: 'Created', value: currentProvider.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentProvider.value.updatedAt, format: 'date' as const },
  ]
})
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to providers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">{{ isEditMode ? 'Edit Provider' : 'Create Provider' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the provider configuration' : 'Define a new AI provider' }}
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
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Provider')) }}
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
          @click="activeTab = 'config'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'config' }]"
          type="button"
        >
          Configuration
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
      Loading provider...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode && !currentProvider" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Providers
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
              placeholder="OpenAI GPT-4"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A human-readable name for this provider</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Description <span class="text-gray-500">(optional)</span>
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-textarea"
              placeholder="A brief description of this provider..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              Optional description to help identify the purpose of this provider
            </p>
          </div>
        </div>

        <!-- Configuration Tab -->
        <div v-show="activeTab === 'config'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Provider Type <span class="required">*</span>
            </label>
            <select
              v-model="form.providerType"
              required
              class="form-select"
              :disabled="isEditMode || isLoading"
            >
              <option v-for="type in providerTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The provider type cannot be changed after creation' 
                : 'Select the type of AI service this provider offers' 
              }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              API Type <span class="required">*</span>
            </label>
            <select
              v-model="form.apiType"
              required
              class="form-select"
              :disabled="isLoading || providerCatalogStore.isLoading"
            >
              <option value="" disabled>
                {{ providerCatalogStore.isLoading ? 'Loading providers...' : 'Select API type...' }}
              </option>
              <option v-for="type in apiTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <p v-if="selectedApiTypeDescription" class="form-help-text">
              {{ selectedApiTypeDescription }}
            </p>
            <p v-else class="form-help-text">
              The API implementation type for this provider
            </p>
          </div>

          <div v-if="providerCatalogStore.isLoading" class="alert-info mb-6">
            Loading available provider types...
          </div>

          <div v-else-if="!form.providerType" class="alert-info mb-6">
            Please select a Provider Type above to see available API types.
          </div>

          <div v-else-if="!form.apiType" class="alert-info mb-6">
            Please select an API Type above to configure provider settings.
          </div>

          <!-- OpenAI Configuration -->
          <template v-if="showOpenAIFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">OpenAI Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="sk-..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your OpenAI API key
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Organization ID <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.config.organizationId"
                type="text"
                placeholder="org-..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Optional organization ID for OpenAI
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Base URL <span class="text-gray-500">(optional)</span>
              </label>
              <div class="flex gap-2">
                <div class="flex-1">
                  <input
                    v-model="form.config.baseUrl"
                    type="url"
                    placeholder="https://api.openai.com/v1"
                    class="form-input-mono"
                    :disabled="isLoading"
                  />
                </div>
                <div class="relative">
                  <select
                    @change="(e) => { const preset = providerPresets.find(p => p.name === (e.target as HTMLSelectElement).value); if (preset) { selectProviderPreset(preset); (e.target as HTMLSelectElement).value = ''; } }"
                    class="form-select min-w-[160px]"
                    :disabled="isLoading"
                  >
                    <option value="">{{ detectedProvider ? detectedProvider.displayName : 'Quick Select...' }}</option>
                    <option v-for="preset in providerPresets" :key="preset.name" :value="preset.name">
                      {{ preset.displayName }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="form-help-text">
                Optional base URL for OpenAI-compatible APIs. Use the dropdown to quick-select popular providers.
              </p>
            </div>
          </template>

          <!-- Anthropic Configuration -->
          <template v-if="showAnthropicFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Anthropic Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="sk-ant-..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Anthropic API key
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Base URL <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.config.baseUrl"
                type="url"
                placeholder="https://api.anthropic.com"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Optional base URL for custom endpoints
              </p>
            </div>
          </template>

          <!-- Google Configuration -->
          <template v-if="showGoogleFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Google Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="AIza..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Google API key
              </p>
            </div>
          </template>

          <!-- ElevenLabs Configuration -->
          <template v-if="showElevenLabsFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">ElevenLabs Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your ElevenLabs API key
              </p>
            </div>
          </template>

          <!-- Deepgram Configuration -->
          <template v-if="showDeepgramFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Deepgram Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Deepgram API key
              </p>
            </div>
          </template>

          <!-- Cartesia Configuration -->
          <template v-if="showCartesiaFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Cartesia Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.apiKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Cartesia API key
              </p>
            </div>
          </template>

          <!-- Azure ASR Configuration -->
          <template v-if="showAzureASRFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Speech Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                Region <span class="required">*</span>
              </label>
              <input
                v-model="form.config.region"
                type="text"
                required
                placeholder="eastus"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Azure region for the Speech service (e.g., eastus, westeurope)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Subscription Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.subscriptionKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Azure Speech service subscription key
              </p>
            </div>
          </template>

          <!-- Azure TTS Configuration -->
          <template v-if="showAzureTtsFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Speech Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                Region <span class="required">*</span>
              </label>
              <input
                v-model="form.config.region"
                type="text"
                required
                placeholder="eastus"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Azure region for the Speech service (e.g., eastus, westeurope)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Subscription Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.subscriptionKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Azure Speech service subscription key
              </p>
            </div>
          </template>

          <!-- S3 Storage Configuration -->
          <template v-if="showS3Fields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">AWS S3 Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                AWS Access Key ID <span class="required">*</span>
              </label>
              <input
                v-model="form.config.accessKeyId"
                type="text"
                required
                placeholder="AKIA..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your AWS Access Key ID for S3 access
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                AWS Secret Access Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.secretAccessKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your AWS Secret Access Key for S3 access
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                AWS Region <span class="required">*</span>
              </label>
              <input
                v-model="form.config.region"
                type="text"
                required
                placeholder="us-east-1"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                AWS region for S3 (e.g., us-east-1, eu-west-1)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Custom Endpoint <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.config.endpoint"
                type="url"
                placeholder="https://s3.example.com"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Optional custom endpoint for S3-compatible services (e.g., MinIO)
              </p>
            </div>
          </template>

          <!-- Azure Blob Storage Configuration -->
          <template v-if="showAzureBlobFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Blob Storage Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                Storage Account Name <span class="required">*</span>
              </label>
              <input
                v-model="form.config.accountName"
                type="text"
                required
                placeholder="mystorageaccount"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Azure Storage account name
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Storage Account Key <span class="required">*</span>
              </label>
              <input
                v-model="form.config.accountKey"
                type="password"
                required
                placeholder="..."
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Azure Storage account key
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Custom Endpoint <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.config.endpoint"
                type="url"
                placeholder="https://mystorageaccount.blob.core.windows.net"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Optional custom endpoint for Azure Blob Storage
              </p>
            </div>
          </template>

          <!-- Google Cloud Storage Configuration -->
          <template v-if="showGcsFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Google Cloud Storage Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                GCP Project ID <span class="required">*</span>
              </label>
              <input
                v-model="form.config.projectId"
                type="text"
                required
                placeholder="my-project-id"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Your Google Cloud project ID
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Service Account Key (JSON) <span class="required">*</span>
              </label>
              <textarea
                v-model="form.config.keyFileJson"
                rows="6"
                required
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                class="form-textarea font-mono text-sm"
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                The complete JSON content of your service account key file
              </p>
            </div>
          </template>

          <!-- Local Storage Configuration -->
          <template v-if="showLocalStorageFields">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Local Storage Configuration</h3>
            
            <div class="form-group">
              <label class="form-label">
                Base Path <span class="required">*</span>
              </label>
              <input
                v-model="form.config.basePath"
                type="text"
                required
                placeholder="/var/data/storage"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Base directory path for local file storage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Base URL <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.config.baseUrl"
                type="url"
                placeholder="https://storage.example.com"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Base URL for generating file URLs (if files are served via HTTP)
              </p>
            </div>
          </template>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentProvider"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
