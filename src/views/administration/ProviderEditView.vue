<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore, useProviderCatalogStore, useMonitoringStore, useAuthStore } from '@/stores'
import { ArrowLeft, Save, Check, RefreshCw, ChevronRight, Plus, Trash2, PlugZap } from 'lucide-vue-next'
import type { ProviderResponse, ProviderFallback, ParsedError, ApiErrorDetail } from '@/api/types'
import ProviderConnectionTestModal, { type ConnectionTestDraft } from '@/components/modals/ProviderConnectionTestModal.vue'
import { parseApiError } from '@/utils/errors'
import {
  probeBadgeClass,
  probeLabel,
  formatOkRate,
  formatMs,
  topErrorChips,
  breakerBadgeClass,
  breakerLabel,
} from '@/utils/monitoring'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import RelativeDate from '@/components/RelativeDate.vue'
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
const monitoringStore = useMonitoringStore()
const authStore = useAuthStore()

// Health tab (probe status + rolling 15m stats), gated on the monitoring permission
const canMonitor = computed(() => authStore.permissions.includes('system:monitoring'))

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'health' | 'metadata' | 'history'>('basic')
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
    apiEndpoint: '',
    basePath: '',
    // Channel config fields
    accountSid: '',
    authToken: '',
    applicationSid: '',
    fromNumber: '',
    phoneNumber: '',
    // WhatsApp channel config fields
    phoneNumberId: '',
    accessToken: '',
    appSecret: '',
    verifyToken: '',
    // Telegram channel config fields
    botToken: '',
    // SendGrid/SES channel config fields
    fromAddress: '',
    threadingStrategy: '',
    // SMTP/IMAP channel config fields
    smtpHost: '',
    smtpPort: '',
    smtpSecure: false,
    smtpAuthUser: '',
    smtpAuthPass: '',
    imapHost: '',
    imapPort: '',
    imapSecure: false,
    imapAuthUser: '',
    imapAuthPass: '',
    imapPollingIntervalMs: '',
    processedFolder: '',
    ccBccReplyAsHandOff: true,
    // Channel processing delay fields
    processingDelayMinMs: 0,
    processingDelayMaxMs: 0,
    // SMTP/IMAP OAuth2 config fields
    oauth2Enabled: false,
    oauth2TokenUrl: '',
    oauth2AuthorizationUrl: '',
    oauth2ClientId: '',
    oauth2ClientSecret: '',
    oauth2Scope: '',
    oauth2RefreshToken: '',
    oauth2AccessToken: '',
    oauth2AccessTokenExpiry: '',
    emailToProject: {},
  },
})

// --- Fallbacks (ordered failover chain, max 3, same providerType) ---
interface FallbackDraft {
  providerId: string
  /** Raw JSON settings override; empty = none */
  settingsJson: string
}
const fallbacksDraft = ref<FallbackDraft[]>([])

/** Other providers of the same providerType that can serve as fallbacks. */
const fallbackOptions = computed(() =>
  providersStore.items
    .filter((p) => p.providerType === form.value.providerType && p.id !== currentProvider.value?.id)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name)),
)

// Computed
const providerId = computed(() => route.params.providerId as string | undefined)
const isEditMode = computed(() => !!providerId.value)

// Pre-select provider type from query param (passed from list view filter)
if (!isEditMode.value) {
  const queryProviderType = route.query.providerType as string | undefined
  const validTypes = ['asr', 'tts', 'llm', 'channel', 'storage']
  if (queryProviderType && validTypes.includes(queryProviderType)) {
    form.value.providerType = queryProviderType as typeof form.value.providerType
  }
}

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'config', label: 'Configuration' },
  { key: 'health', label: 'Health', show: isEditMode.value && canMonitor.value },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])

const healthItem = computed(() =>
  monitoringStore.providers.find((p) => p.id === providerId.value) ?? null
)

async function loadHealth() {
  if (!isEditMode.value || !canMonitor.value) return
  try {
    await monitoringStore.fetchProviders()
  } catch {
    // error surfaced via monitoringStore.providersError
  }
}

function openRecentCalls() {
  router.push({
    name: 'system.providerCalls',
    query: { providerId: providerId.value },
  })
}

function openFallbackEvents() {
  router.push({
    name: 'system.fallbackEvents',
    query: { providerId: providerId.value },
  })
}
const currentProvider = ref<ProviderResponse | null>(null)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

// --- On-demand connection test for the (possibly unsaved) draft configuration ---
const TESTABLE_PROVIDER_TYPES = new Set(['llm', 'asr', 'tts', 'storage'])
const canTestConnection = computed(() =>
  !!activeEntry.value && TESTABLE_PROVIDER_TYPES.has(form.value.providerType)
)
const showTestModal = ref(false)
const testDraft = ref<ConnectionTestDraft | null>(null)

function openTestConnection() {
  if (!activeEntry.value) return
  // Validate the form first so the draft only contains well-formed values
  const configError = activeEntry.value.validate(form.value.config)
  if (configError) {
    error.value = configError
    activeTab.value = 'config'
    return
  }
  testDraft.value = {
    providerType: form.value.providerType,
    apiType: form.value.apiType,
    config: activeEntry.value.buildConfig(form.value.config),
  }
  showTestModal.value = true
}

const providerTypes = [
  { value: 'asr', label: 'ASR (Automatic Speech Recognition)' },
  { value: 'channel', label: 'Channel (Messaging & Voice)' },
  { value: 'llm', label: 'LLM (Large Language Model)' },
  { value: 'storage', label: 'Storage (File Storage)' },
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

  // Fallback candidates (other providers of the same type)
  providersStore.fetchAll().catch(() => {
    // non-fatal — the fallback select degrades to empty
  })

  if (isEditMode.value) {
    await loadProvider()
    loadHealth()
  }
})

const handleOAuth2Message = async (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.source !== 'oauth2-callback') return
  if (event.data.success && isEditMode.value) {
    await loadProvider()
  }
}

onMounted(() => {
  window.addEventListener('message', handleOAuth2Message)
})

onUnmounted(() => {
  window.removeEventListener('message', handleOAuth2Message)
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
          apiEndpoint: config.apiEndpoint || '',
          basePath: config.basePath || '',
          // Channel config fields
          accountSid: config.accountSid || '',
          authToken: config.authToken || '',
          applicationSid: config.applicationSid || '',
          fromNumber: config.fromNumber || '',
          phoneNumber: config.phoneNumber || '',
          // WhatsApp channel config fields
          phoneNumberId: config.phoneNumberId || '',
          accessToken: config.accessToken || '',
          appSecret: config.appSecret || '',
          verifyToken: config.verifyToken || '',
          // Telegram channel config fields
          botToken: config.botToken || '',
          // SendGrid/SES channel config fields
          fromAddress: config.fromAddress || '',
          threadingStrategy: config.threadingStrategy || '',
          // SMTP/IMAP channel config fields
          smtpHost: (config.smtp && config.smtp.host) || '',
          smtpPort: (config.smtp && config.smtp.port != null) ? String(config.smtp.port) : '',
          smtpSecure: (config.smtp && config.smtp.secure) || false,
          smtpAuthUser: (config.smtp && config.smtp.auth && config.smtp.auth.user) || '',
          smtpAuthPass: (config.smtp && config.smtp.auth && config.smtp.auth.pass) || '',
          imapHost: (config.imap && config.imap.host) || '',
          imapPort: (config.imap && config.imap.port != null) ? String(config.imap.port) : '',
          imapSecure: (config.imap && config.imap.secure) || false,
          imapAuthUser: (config.imap && config.imap.auth && config.imap.auth.user) || '',
          imapAuthPass: (config.imap && config.imap.auth && config.imap.auth.pass) || '',
          imapPollingIntervalMs: (config.imap && config.imap.pollingIntervalMs != null) ? String(config.imap.pollingIntervalMs) : '',
          processedFolder: config.processedFolder || '',
          ccBccReplyAsHandOff: config.ccBccReplyAsHandOff !== false,
          // Channel processing delay fields
          processingDelayMinMs: config.processingDelayMinMs || 0,
          processingDelayMaxMs: config.processingDelayMaxMs || 0,
          // SMTP/IMAP OAuth2 config fields
          oauth2Enabled: !!(config.oauth2 && config.oauth2.clientId),
          oauth2TokenUrl: (config.oauth2 && config.oauth2.tokenUrl) || '',
          oauth2AuthorizationUrl: (config.oauth2 && config.oauth2.authorizationUrl) || '',
          oauth2ClientId: (config.oauth2 && config.oauth2.clientId) || '',
          oauth2ClientSecret: (config.oauth2 && config.oauth2.clientSecret) || '',
          oauth2Scope: (config.oauth2 && config.oauth2.scope) || '',
          oauth2RefreshToken: (config.oauth2 && config.oauth2.refreshToken) || '',
          oauth2AccessToken: (config.oauth2 && config.oauth2.accessToken) || '',
          oauth2AccessTokenExpiry: (config.oauth2 && config.oauth2.accessTokenExpiry != null) ? String(config.oauth2.accessTokenExpiry) : '',
          emailToProject: config.emailToProject || {},
        },
      }
      // The providerType watcher fires asynchronously and clears apiType if providerType
      // changed from the form's initial value ('llm'). Re-apply after the watcher runs.
      await nextTick()
      form.value.apiType = currentProvider.value.apiType
      fallbacksDraft.value = (currentProvider.value.fallbacks ?? []).map((f) => ({
        providerId: f.providerId,
        settingsJson: f.settings ? JSON.stringify(f.settings, null, 2) : '',
      }))
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

  // Validate fallbacks: each needs a provider, settings (if any) must be a JSON object, and no duplicates
  for (let i = 0; i < fallbacksDraft.value.length; i++) {
    const fallback = fallbacksDraft.value[i]
    if (!fallback) continue
    if (!fallback.providerId) {
      validationDetails.push({ path: ['fallbacks', i, 'providerId'], message: `Fallback ${i + 1}: select a provider.`, code: 'REQUIRED' })
    }
    if (fallback.settingsJson.trim()) {
      let parsed: unknown
      try {
        parsed = JSON.parse(fallback.settingsJson)
      } catch {
        parsed = undefined
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        validationDetails.push({ path: ['fallbacks', i, 'settings'], message: `Fallback ${i + 1}: settings override must be a JSON object.`, code: 'INVALID_FORMAT' })
      }
    }
  }
  const seenFallbacks = new Set<string>()
  for (const fallback of fallbacksDraft.value) {
    if (!fallback?.providerId) continue
    if (seenFallbacks.has(fallback.providerId)) {
      validationDetails.push({ path: ['fallbacks'], message: 'Fallback providers must be unique.', code: 'DUPLICATE' })
      break
    }
    seenFallbacks.add(fallback.providerId)
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
        config: config,
        // Always sent (even empty) so removing all fallbacks clears them
        fallbacks: buildFallbacks()
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

      // Include the failover chain when configured
      if (fallbacksDraft.value.length > 0) {
        createData.fallbacks = buildFallbacks()
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

/**
 * Convert the fallback drafts into the API payload.
 * Settings override is only included when non-empty (validated as a JSON object in handleSubmit).
 */
function buildFallbacks(): ProviderFallback[] {
  return fallbacksDraft.value
    .filter((f) => f.providerId)
    .map((f) => {
      const fallback: ProviderFallback = { providerId: f.providerId }
      if (f.settingsJson.trim()) fallback.settings = JSON.parse(f.settingsJson)
      return fallback
    })
}

function goBack() {
  router.push({ name: 'administration.providers' })
}

const metadataFields = computed(() => {
  if (!currentProvider.value) return []
  return [
    { label: 'Provider ID', value: currentProvider.value.id, format: 'mono' as const },
    { label: 'Version', value: currentProvider.value.version },
    { label: 'Created', value: currentProvider.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentProvider.value.updatedAt, format: 'date' as const },
  ]
})
</script>

<template>
  <div class="flex-1 min-w-0">
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-4 md:py-3 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to providers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">{{ isEditMode ? 'Edit Provider' : 'Create Provider' }}</h1>
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
            <ErrorDisplay :error="error" class="mx-4 mt-3" />

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
                  :provider-id="providerId || undefined"
                  v-bind="activeEntry.componentProps?.(form.apiType) ?? {}"
                />
              </fieldset>

              <!-- On-demand connection test for the draft configuration -->
              <div v-if="canTestConnection" class="section-card mt-6 p-4">
                <h2 class="section-title mb-1">Connection Test</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Verify the provider is reachable with the current settings before saving.
                  <template v-if="isEditMode">Unsaved changes in this form are used for the test.</template>
                  The test exercises the provider's own protocol at minimum size (a small LLM completion, a short ASR/TTS session, or a storage round trip).
                </p>
                <button type="button" class="btn-secondary" :disabled="isLoading" @click="openTestConnection">
                  <PlugZap class="inline-block mr-2 w-4 h-4" />
                  Test Connection
                </button>
              </div>

              <!-- Fallbacks: ordered failover chain (max 3, same provider type) -->
              <div class="section-card mt-6 p-4">
                <h2 class="section-title mb-1">Fallbacks</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Other {{ form.providerType }} providers tried in order when this one fails during setup. Max 3.
                </p>
                <div v-if="fallbackOptions.length === 0" class="alert-info">
                  No other providers of the same type are available as fallbacks yet.
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="(fallback, index) in fallbacksDraft"
                    :key="index"
                    class="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-3"
                  >
                    <div class="flex flex-wrap items-center gap-3">
                      <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 w-6">#{{ index + 1 }}</span>
                      <FormField :error="error" :path="['fallbacks', index, 'providerId']" class="flex-1 min-w-64">
                        <select v-model="fallback.providerId" class="form-select-auto" :disabled="isLoading">
                          <option value="" disabled>Select a provider…</option>
                          <option v-for="option in fallbackOptions" :key="option.id" :value="option.id">
                            {{ option.name }} ({{ option.apiType }})
                          </option>
                        </select>
                      </FormField>
                      <button type="button" class="btn-icon-danger" title="Remove fallback" :disabled="isLoading" @click="fallbacksDraft.splice(index, 1)">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label class="form-label">Settings override (JSON) <span class="text-gray-500 font-normal">(optional)</span></label>
                      <FormField :error="error" :path="['fallbacks', index, 'settings']" class="w-full">
                        <textarea
                          v-model="fallback.settingsJson"
                          rows="2"
                          class="form-textarea form-input-mono"
                          placeholder='{"model": "gpt-4o-mini"}'
                          :disabled="isLoading"
                        ></textarea>
                      </FormField>
                    </div>
                  </div>
                  <button type="button" class="btn-secondary" :disabled="isLoading || fallbacksDraft.length >= 3" @click="fallbacksDraft.push({ providerId: '', settingsJson: '' })">
                    <Plus class="inline-block mr-2 w-4 h-4" />
                    Add fallback
                  </button>
                </div>
              </div>
            </TabContent>

            <!-- Health Tab -->
            <TabContent v-if="canMonitor" v-model="activeTab" tab="health">
              <div v-if="monitoringStore.providersLoading && !healthItem" class="flex justify-center py-8">
                <div class="spinner"></div>
              </div>

              <div v-else-if="monitoringStore.providersError && !healthItem" class="alert-error mx-4 mt-3">
                {{ monitoringStore.providersError }}
              </div>

              <div v-else-if="!healthItem" class="empty-state py-8">
                <p class="text-sm text-gray-500 dark:text-gray-400">No monitoring data for this provider yet.</p>
              </div>

              <div v-else class="mx-4 my-4 space-y-4">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="badge" :class="probeBadgeClass(healthItem.probeStatus)" title="Latest probe status">
                    {{ probeLabel(healthItem.probeStatus) }}
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    Rolling window: last {{ healthItem.rolling.windowMinutes }} minutes of recorded calls
                  </span>
                  <div class="flex-1"></div>
                  <button type="button" @click="loadHealth" class="btn-secondary btn-sm">
                    <RefreshCw class="inline-block mr-2 w-4 h-4" />
                    Refresh
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="stat-card">
                    <div class="flex-1">
                      <div class="stat-value tabular-nums">{{ healthItem.rolling.calls }}</div>
                      <div class="stat-label">Calls (15m)</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="flex-1">
                      <div class="stat-value tabular-nums">{{ formatOkRate(healthItem.rolling.okRate) }}</div>
                      <div class="stat-label">OK rate (15m)</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="flex-1">
                      <div class="stat-value tabular-nums">{{ formatMs(healthItem.rolling.p95DurationMs) }}</div>
                      <div class="stat-label">p95 duration (15m)</div>
                    </div>
                  </div>
                </div>

                <div class="section-card">
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Top error codes (15m)</p>
                  <template v-if="topErrorChips(healthItem).length">
                    <span
                      v-for="chip in topErrorChips(healthItem)"
                      :key="chip.code"
                      class="badge badge-danger mr-1"
                    >
                      {{ chip.code }} ×{{ chip.count }}
                    </span>
                  </template>
                  <span v-else class="text-sm text-gray-400 dark:text-gray-500">No errors in the rolling window.</span>
                </div>

                <div class="section-card">
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Circuit breaker</p>
                  <template v-if="healthItem.circuitBreaker">
                    <div class="flex flex-wrap items-center gap-3">
                      <span class="badge" :class="breakerBadgeClass(healthItem.circuitBreaker.state)" title="Circuit breaker state">
                        {{ breakerLabel(healthItem.circuitBreaker.state) }}
                      </span>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ healthItem.circuitBreaker.failuresInWindow }} failure{{ healthItem.circuitBreaker.failuresInWindow === 1 ? '' : 's' }} in window
                        <template v-if="healthItem.circuitBreaker.lastStateChangeAt">
                          · state since <RelativeDate :date="healthItem.circuitBreaker.lastStateChangeAt" />
                        </template>
                        <template v-if="healthItem.circuitBreaker.opensInLast24h > 0">
                          · {{ healthItem.circuitBreaker.opensInLast24h }} open in last 24h
                        </template>
                      </span>
                    </div>
                  </template>
                  <span v-else class="text-sm text-gray-400 dark:text-gray-500">
                    No calls recorded yet — the breaker stays closed.
                  </span>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button type="button" @click="openRecentCalls" class="btn-secondary">
                    <ChevronRight class="inline-block mr-2 w-4 h-4" />
                    View recent calls
                  </button>
                  <button type="button" @click="openFallbackEvents" class="btn-secondary">
                    <ChevronRight class="inline-block mr-2 w-4 h-4" />
                    View failover events
                  </button>
                </div>
              </div>
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

  <ProviderConnectionTestModal
    v-if="showTestModal && testDraft"
    :draft="testDraft"
    @close="showTestModal = false; testDraft = null"
  />
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
