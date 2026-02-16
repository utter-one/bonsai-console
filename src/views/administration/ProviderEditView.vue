<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore, useProviderCatalogStore } from '@/stores'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { ProviderResponse } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'

const route = useRoute()
const router = useRouter()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'config' | 'metadata'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  providerType: 'llm' as 'asr' | 'tts' | 'llm' | 'embeddings',
  apiType: '',
  config: {
    apiKey: '',
    organizationId: '',
    baseUrl: '',
    region: '',
    subscriptionKey: ''
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
  { value: 'embeddings', label: 'Embeddings' }
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
    default:
      return []
  }
  
  // Map catalog providers to options, always include 'custom' option
  const options = providers.map(p => ({
    value: p.apiType,
    label: p.displayName,
    description: p.description
  }))
  
  // Add custom option if not already present
  if (!options.some(o => o.value === 'custom')) {
    options.push({ value: 'custom', label: 'Custom', description: 'Custom API implementation' })
  }
  
  return options
})

// Get description for selected API type
const selectedApiTypeDescription = computed(() => {
  const option = apiTypeOptions.value.find(o => o.value === form.value.apiType)
  return option?.description
})

// Check which config fields to show based on API type
const showOpenAIFields = computed(() => 
  form.value.apiType === 'openai' || form.value.apiType === 'openai-legacy'
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
const showAzureASRFields = computed(() => 
  form.value.apiType === 'azure' && form.value.providerType === 'asr'
)

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
          subscriptionKey: config.subscriptionKey || ''
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
  } else if (showAzureASRFields.value) {
    config = {
      region: form.value.config.region,
      subscriptionKey: form.value.config.subscriptionKey
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
  } else {
    if (!config.apiKey) {
      error.value = 'API Key is required'
      return
    }
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentProvider.value) {
      // Update existing provider
      await providersStore.update(currentProvider.value.id, {
        version: currentProvider.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        providerType: form.value.providerType,
        apiType: form.value.apiType,
        config: config
      })
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

      await providersStore.create(createData)
    }

    // Navigate back to providers list
    router.push({ name: 'administration.providers' })
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
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Provider') }}
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
              <input
                v-model="form.config.baseUrl"
                type="url"
                placeholder="https://api.openai.com/v1"
                class="form-input-mono"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Optional base URL for OpenAI-compatible APIs
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
