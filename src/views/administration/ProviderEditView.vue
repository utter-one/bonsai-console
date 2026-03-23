<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore, useProviderCatalogStore } from '@/stores'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { ProviderResponse } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import { providerPresets } from './provider-configuration/providerPresets'
import { lookupProvider } from './provider-configuration/providerRegistry'

const route = useRoute()
const router = useRouter()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'metadata' | 'history'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
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
  { value: 'asr', label: 'ASR (Automatic Speech Recognition)' },
  { value: 'embeddings', label: 'Embeddings' },
  { value: 'llm', label: 'LLM (Large Language Model)' },
  { value: 'storage', label: 'Storage (S3, Azure Blob, GCS)' },
  { value: 'tts', label: 'TTS (Text-to-Speech)' }
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

  return options.sort((a, b) => a.label.localeCompare(b.label))
})

// Get description for selected API type
const selectedApiTypeDescription = computed(() => {
  const option = apiTypeOptions.value.find(o => o.value === form.value.apiType)
  return option?.description
})

const activeEntry = computed(() => lookupProvider(form.value.apiType, form.value.providerType))

watch(() => form.value.providerType, () => {
  form.value.apiType = ''
})

function handleApiTypeChange() {
  if (!isEditMode.value) {
    const preset = providerPresets.find(p => p.name === form.value.apiType)
    form.value.config.baseUrl = preset?.baseUrl ?? ''
  }
  activeEntry.value?.init?.(form.value.config)
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
        tags: currentProvider.value.tags || [],
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
      // The providerType watcher fires asynchronously and clears apiType if providerType
      // changed from the form's initial value ('llm'). Re-apply after the watcher runs.
      await nextTick()
      form.value.apiType = currentProvider.value.apiType
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load provider'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  const entry = activeEntry.value
  if (!entry) {
    error.value = 'Please select a valid API type'
    return
  }

  const validationError = entry.validate(form.value.config)
  if (validationError) {
    error.value = validationError
    return
  }

  const config = entry.buildConfig(form.value.config) as any

  isLoading.value = true

  try {
    if (isEditMode.value && currentProvider.value) {
      // Update existing provider
      const updated = await providersStore.update(currentProvider.value.id, {
        version: currentProvider.value.version,
        name: form.value.name,
        description: form.value.description || null,
        tags: form.value.tags.length > 0 ? form.value.tags : null,
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

      // Only include tags if not empty
      if (form.value.tags.length > 0) {
        createData.tags = form.value.tags
      }
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
          General
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
        <button
          v-if="isEditMode"
          @click="activeTab = 'history'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'history' }]"
          type="button"
        >
          History
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

          <TagsEditor v-model="form.tags" :disabled="isLoading" />
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
              class="form-select-auto min-w-64"
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
              class="form-select-auto min-w-64"
              :disabled="isLoading || providerCatalogStore.isLoading"
              @change="handleApiTypeChange"
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
            Please select an API Type above to configure provider-specific settings below.
          </div>

          <fieldset v-else :disabled="isLoading" class="border-0 m-0 p-0 min-w-0 w-full">
            <component
              v-if="activeEntry"
              :is="activeEntry.component"
              v-model:config="form.config"
              v-bind="activeEntry.componentProps?.(form.apiType) ?? {}"
            />
          </fieldset>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentProvider"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        <div class="tab-content">
          <!-- History Tab -->
          <EntityHistoryView
            v-if="isEditMode && currentProvider"
            v-show="activeTab === 'history'"
            :load-history="() => providersStore.fetchAuditLogs(currentProvider!.id)"
            :current-version="currentProvider.version"
            :current-object="currentProvider"
            :active="activeTab === 'history'"
            :update-fn="(data) => providersStore.update(currentProvider!.id, data)"
            :create-fn="(data) => providersStore.create(data)"
            :ignore-fields="['createdAt', 'updatedAt', 'version']"
            @recover-success="() => router.go(0)"
          />
        </div>
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
