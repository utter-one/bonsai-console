<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore, useProviderCatalogStore } from '@/stores'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { ProviderResponse, ParsedError, ApiErrorDetail } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import { providerPresets } from './provider-configuration/providerPresets'
import { lookupProvider } from './provider-configuration/providerRegistry'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'metadata' | 'history'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  providerType: 'llm' as 'asr' | 'tts' | 'llm' | 'embeddings' | 'storage' | 'channel',
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
    basePath: '',
    // Channel config fields
    accountSid: '',
    authToken: '',
    fromNumber: '',
    phoneNumber: '',
    // WhatsApp channel config fields
    phoneNumberId: '',
    accessToken: '',
    appSecret: '',
    verifyToken: ''
  },
  createdBy: ''
})

// Computed
const providerId = computed(() => route.params.providerId as string | undefined)
const isEditMode = computed(() => !!providerId.value)

// Pre-select provider type from query param (passed from list view filter)
if (!isEditMode.value) {
  const queryProviderType = route.query.providerType as string | undefined
  const validTypes = ['asr', 'tts', 'llm', 'embeddings', 'storage', 'channel']
  if (queryProviderType && validTypes.includes(queryProviderType)) {
    form.value.providerType = queryProviderType as typeof form.value.providerType
  }
}

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'config', label: 'Configuration' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentProvider = ref<ProviderResponse | null>(null)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const providerTypes = [
  { value: 'asr', label: 'ASR (Automatic Speech Recognition)' },
  { value: 'channel', label: 'Channel (Messaging & Voice)' },
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
    case 'channel':
      providers = providerCatalogStore.catalog.channel || []
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
          basePath: config.basePath || '',
          // Channel config fields
          accountSid: config.accountSid || '',
          authToken: config.authToken || '',
          fromNumber: config.fromNumber || '',
          phoneNumber: config.phoneNumber || '',
          // WhatsApp channel config fields
          phoneNumberId: config.phoneNumberId || '',
          accessToken: config.accessToken || '',
          appSecret: config.appSecret || '',
          verifyToken: config.verifyToken || ''
        },
        createdBy: currentProvider.value.createdBy || ''
      }
      // The providerType watcher fires asynchronously and clears apiType if providerType
      // changed from the form's initial value ('llm'). Re-apply after the watcher runs.
      await nextTick()
      form.value.apiType = currentProvider.value.apiType
    }
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  // Validate required fields
  const validationDetails: ApiErrorDetail[] = []
  if (!form.value.name.trim()) {
    validationDetails.push({ path: ['name'], message: 'Name is required', code: 'REQUIRED' })
  }
  if (!form.value.apiType) {
    validationDetails.push({ path: ['apiType'], message: 'API type is required', code: 'REQUIRED' })
  }
  if (validationDetails.length > 0) {
    error.value = { message: 'Please correct the following errors', details: validationDetails }
    switchToFirstErrorTab(error.value)
    return
  }

  const entry = activeEntry.value
  if (!entry) {
    error.value = { message: 'Please select a valid API type', details: [{ path: ['apiType'], message: 'Please select a valid API type', code: 'INVALID_VALUE' }] }
    switchToFirstErrorTab(error.value)
    return
  }

  const configError = entry.validate(form.value.config)
  if (configError) {
    error.value = configError
    activeTab.value = 'config'
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
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
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
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading provider...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode && !currentProvider" class="error-state">
      <ErrorDisplay :error="error" />
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Providers
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
            <!-- Error Message -->
            <ErrorDisplay :error="error" />

            <!-- General Tab -->
            <TabContent v-model="activeTab" tab="basic">
              <FormField label="Name" required :error="error" path="name" class="w-full" help="A human-readable name for this provider">
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="OpenAI GPT-4"
                  class="form-input"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description to help identify the purpose of this provider">
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="form-textarea"
                  placeholder="A brief description of this provider..."
                  :disabled="isLoading"
                ></textarea>
              </FormField>

              <TagsEditor v-model="form.tags" :disabled="isLoading" />
            </TabContent>

            <!-- Configuration Tab -->
            <TabContent v-model="activeTab" tab="config">
              <FormField label="Provider Type" required :error="error" path="providerType" class="w-fit" :hint="isEditMode ? 'type cannot be changed' : undefined" :help="isEditMode ? 'The provider type cannot be changed after creation' : 'Select the type of AI service this provider offers'">
                <select
                  v-model="form.providerType"
                  class="form-select-auto min-w-64"
                  :disabled="isEditMode || isLoading"
                >
                  <option v-for="type in providerTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </FormField>

              <FormField label="API Type" required :error="error" path="apiType" class="w-fit" :help="selectedApiTypeDescription || 'The API implementation type for this provider'">
                <select
                  v-model="form.apiType"
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
              </FormField>

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
                  :error="error"
                  v-bind="activeEntry.componentProps?.(form.apiType) ?? {}"
                />
              </fieldset>
            </TabContent>

            <!-- Metadata Tab -->
            <MetadataTab
              v-if="isEditMode && currentProvider"
              v-model="activeTab"
              tab="metadata"
              :fields="metadataFields"
            />
            <!-- History Tab -->
            <TabContent v-model="activeTab" tab="history">
              <EntityHistoryView
                v-if="isEditMode && currentProvider"
                :load-history="() => providersStore.fetchAuditLogs(currentProvider!.id)"
                :current-version="currentProvider.version"
                :current-object="currentProvider"
                :active="activeTab === 'history'"
                :update-fn="(data) => providersStore.update(currentProvider!.id, data)"
                :create-fn="(data) => providersStore.create(data)"
                :ignore-fields="['createdAt', 'updatedAt', 'version']"
                @recover-success="() => router.go(0)"
              />
            </TabContent>
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
