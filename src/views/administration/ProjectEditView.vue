<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, useApiKeysStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import TimezoneSelector from '@/components/TimezoneSelector.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { ArrowLeft, Save, Plus, Trash2, X, Settings, Check, FlaskConical } from 'lucide-vue-next'
import type { ProjectResponse, ApiKeyResponse, AsrConfig, CostManagementConfig, ProviderModelLimits, RequestTypeLimits } from '@/api/types'
import apiClient from '@/api/client'
import type { CostLimitEntry } from '@/components/modals/CostLimitEntryModal.vue'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import CostLimitEntryModal from '@/components/modals/CostLimitEntryModal.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import { PROJECT_COLOR_FAMILIES, getProjectColorHex } from '@/assets/projectColors'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'
import StorageSettingsModal from '@/components/modals/StorageSettingsModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import AsrSettingsModal from '@/components/modals/AsrSettingsModal.vue'
import ServerVadSettingsModal from '@/components/modals/ServerVadSettingsModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'voice' | 'storage' | 'costs' | 'apiKeys' | 'metadata' | 'history' | 'danger'>('basic')

const form = ref({
  name: '',
  description: '',
  asrConfig: {
    asrProviderId: '',
    settings: {} as any,
    unintelligiblePlaceholder: '',
    voiceActivityDetection: false,
    serverVadEnabled: false,
    serverVad: {
      mode: undefined as number | undefined,
      frameDurationMs: undefined as (10 | 20 | 30) | undefined,
      silencePaddingMs: undefined as number | undefined,
      autoEndSilenceDurationMs: undefined as number | undefined,
    }
  },
  storageConfig: {
    storageProviderId: '',
    settings: {} as any
  },
  generateVoice: false,
  acceptVoice: false,
  timezone: null as string | null,
  languageCode: null as string | null,
  conversationTimeoutSeconds: 120 as number | null,
  primaryColor: null as string | null,
  version: undefined as number | undefined,
  costLimitEntries: [] as CostLimitEntry[],
})

const showApiKeyModal = ref(false)
const selectedApiKey = ref<ApiKeyResponse | null>(null)
const apiKeysLoading = ref(false)
const apiKeysError = ref<string | null>(null)
const createPlaygroundApiKey = ref(true)
const showStorageSettingsModal = ref(false)
const showAsrSettingsModal = ref(false)
const showServerVadModal = ref(false)

// Computed
const projectId = computed(() => route.params.projectId as string | undefined)
const isEditMode = computed(() => !!projectId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'voice', label: 'Voice' },
  { key: 'storage', label: () => [
    'Storage',
    h('span', { class: 'ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
      h(FlaskConical, { class: 'w-3 h-3' })
    )
  ] },
  { key: 'costs', label: 'Cost Management' },
  { key: 'apiKeys', label: 'API Keys', show: isEditMode.value },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
  { key: 'danger', label: 'Danger Zone', show: isEditMode.value },
])
const currentProject = ref<ProjectResponse | null>(null)

const isArchived = computed(() => !!currentProject.value?.archivedAt)
const deleteConfirmName = ref('')

const asrProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'asr')
)

const storageProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'storage')
)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const llmProviderOptions = computed(() =>
  [...llmProviders.value].sort((a, b) => a.name.localeCompare(b.name))
)

function providerNameForId(id: string): string {
  return llmProviders.value.find(p => p.id === id)?.name ?? id
}

// Cache of providerId -> modelId -> displayName, built lazily as models are fetched
const modelDisplayNames = ref<Record<string, Record<string, string>>>({})

async function ensureModelsLoaded(providerId: string) {
  if (!providerId || modelDisplayNames.value[providerId]) return
  try {
    const response = await apiClient.providersModelsList(providerId)
    const map: Record<string, string> = {}
    for (const m of response.models) map[m.id] = m.displayName
    modelDisplayNames.value = { ...modelDisplayNames.value, [providerId]: map }
  } catch {
    // silently ignore — fall back to raw ID
  }
}

function modelNameForEntry(entry: CostLimitEntry): string {
  if (entry.modelName === '*') return '* (Any model)'
  return modelDisplayNames.value[entry.providerId]?.[entry.modelName] ?? entry.modelName
}

const requestTypeLabels: Record<string, string> = {
  completion: 'Compl',
  classification: 'Class',
  tool: 'Tool',
  transformation: 'Trans',
  filler: 'Filler',
}

function limitsForDisplay(limits: CostLimitEntry['inputTokensLimits']): { label: string; value: number }[] {
  return Object.entries(limits)
    .filter(([, v]) => v != null)
    .map(([k, v]) => ({ label: requestTypeLabels[k] ?? k, value: v as number }))
}

const showCostLimitModal = ref(false)
const editingCostLimitEntry = ref<CostLimitEntry | null>(null)
const editingCostLimitIndex = ref<number | null>(null)

function openAddCostLimitEntry() {
  editingCostLimitEntry.value = null
  editingCostLimitIndex.value = null
  showCostLimitModal.value = true
}

function openEditCostLimitEntry(index: number) {
  editingCostLimitEntry.value = form.value.costLimitEntries[index] ?? null
  editingCostLimitIndex.value = index
  showCostLimitModal.value = true
}

function handleCostLimitEntrySave(entry: CostLimitEntry) {
  if (editingCostLimitIndex.value !== null) {
    form.value.costLimitEntries.splice(editingCostLimitIndex.value, 1, entry)
  } else {
    form.value.costLimitEntries.push(entry)
  }
  ensureModelsLoaded(entry.providerId)
  showCostLimitModal.value = false
}

function removeCostLimitEntry(index: number) {
  form.value.costLimitEntries.splice(index, 1)
}

const selectedStorageProvider = computed(() => {
  if (!form.value.storageConfig.storageProviderId) return null
  return storageProviders.value.find(p => p.id === form.value.storageConfig.storageProviderId) || null
})

const selectedAsrProvider = computed(() => {
  if (!form.value.asrConfig.asrProviderId) return null
  return asrProviders.value.find(p => p.id === form.value.asrConfig.asrProviderId) || null
})

const filteredApiKeys = computed(() => {
  if (!currentProject.value) return []
  return [...apiKeysStore.items].sort((a, b) => a.name.localeCompare(b.name))
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
  } else if (apiType === 'speechmatics') {
    // Speechmatics ASR - initialize with defaults
    form.value.asrConfig.settings = {
      audioFormat: 'pcm_16000',
      transcriptionMode: 'standard',
      enablePunctuation: true,
      enableFormatting: true,
      enableDiarization: false,
      language: undefined,
      additionalVocab: [],
      maxDelay: undefined
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
      deleteConfirmName.value = ''
      form.value = {
        name: currentProject.value.name,
        description: currentProject.value.description ?? '',
        asrConfig: {
          asrProviderId: currentProject.value.asrConfig?.asrProviderId || '',
          settings: currentProject.value.asrConfig?.settings || {},
          unintelligiblePlaceholder: currentProject.value.asrConfig?.unintelligiblePlaceholder || '',
          voiceActivityDetection: currentProject.value.asrConfig?.voiceActivityDetection || false,
          serverVadEnabled: !!currentProject.value.asrConfig?.serverVad,
          serverVad: {
            mode: currentProject.value.asrConfig?.serverVad?.mode,
            frameDurationMs: currentProject.value.asrConfig?.serverVad?.frameDurationMs,
            silencePaddingMs: currentProject.value.asrConfig?.serverVad?.silencePaddingMs,
            autoEndSilenceDurationMs: currentProject.value.asrConfig?.serverVad?.autoEndSilenceDurationMs,
          }
        },
        storageConfig: {
          storageProviderId: currentProject.value.storageConfig?.storageProviderId || '',
          settings: currentProject.value.storageConfig?.settings || {}
        },
        generateVoice: currentProject.value.generateVoice ?? false,
        acceptVoice: currentProject.value.acceptVoice ?? false,
        timezone: currentProject.value.timezone ?? null,
        languageCode: currentProject.value.languageCode ?? null,
        conversationTimeoutSeconds: currentProject.value.conversationTimeoutSeconds ?? null,
        primaryColor: currentProject.value.metadata?.primaryColor ?? null,
        version: currentProject.value.version,
        costLimitEntries: currentProject.value.costManagementConfig
          ? configToCostLimitEntries(currentProject.value.costManagementConfig)
          : [],
      }

      // Load model display names for configured entries
      for (const entry of form.value.costLimitEntries) {
        ensureModelsLoaded(entry.providerId)
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

  if (form.value.acceptVoice && !form.value.asrConfig.asrProviderId) {
    error.value = 'An ASR provider must be selected when Speech Input is enabled.'
    activeTab.value = 'voice'
    return
  }

  isLoading.value = true

  try {
    // Build ASR config only if provider is selected
    const asrConfig: AsrConfig | undefined = form.value.asrConfig.asrProviderId ? {
      asrProviderId: form.value.asrConfig.asrProviderId,
      ...(Object.keys(form.value.asrConfig.settings || {}).length > 0 && {
        settings: form.value.asrConfig.settings
      }),
      ...(form.value.asrConfig.unintelligiblePlaceholder && { unintelligiblePlaceholder: form.value.asrConfig.unintelligiblePlaceholder }),
      voiceActivityDetection: form.value.asrConfig.voiceActivityDetection,
      ...(form.value.asrConfig.serverVadEnabled && {
        serverVad: {
          ...(form.value.asrConfig.serverVad.mode !== undefined && { mode: form.value.asrConfig.serverVad.mode }),
          ...(form.value.asrConfig.serverVad.frameDurationMs !== undefined && { frameDurationMs: form.value.asrConfig.serverVad.frameDurationMs }),
          ...(form.value.asrConfig.serverVad.silencePaddingMs !== undefined && { silencePaddingMs: form.value.asrConfig.serverVad.silencePaddingMs }),
          ...(form.value.asrConfig.serverVad.autoEndSilenceDurationMs !== undefined && { autoEndSilenceDurationMs: form.value.asrConfig.serverVad.autoEndSilenceDurationMs }),
        }
      })
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
      const metadata: Record<string, any> = { ...(currentProject.value.metadata || {}) }
      if (form.value.primaryColor) {
        metadata.primaryColor = form.value.primaryColor
      } else {
        delete metadata.primaryColor
      }
      const updated = await projectsStore.update(currentProject.value.id, {
        version: currentProject.value.version,
        name: form.value.name,
        description: form.value.description || null,
        asrConfig: asrConfig || null,
        storageConfig: storageConfig || null,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
        timezone: form.value.timezone,
        languageCode: form.value.languageCode,
        conversationTimeoutSeconds: form.value.conversationTimeoutSeconds ?? undefined,
        metadata,
        costManagementConfig: buildCostManagementConfig(),
      })
      
      // Update currentProject with the response to get the new version
      currentProject.value = updated

      // Sync colour into the project selection store when this is the active project
      const projSel = useProjectSelectionStore()
      if (projSel.selectedProjectId === currentProject.value?.id) {
        projSel.selectedProject = currentProject.value
      }
    } else {
      // Create new project
      const createMetadata: Record<string, any> = {}
      if (form.value.primaryColor) createMetadata.primaryColor = form.value.primaryColor
      const newProject = await projectsStore.create({
        name: form.value.name,
        description: form.value.description || undefined,
        asrConfig,
        storageConfig,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
        timezone: form.value.timezone,
        languageCode: form.value.languageCode,
        conversationTimeoutSeconds: form.value.conversationTimeoutSeconds ?? undefined,
        ...(Object.keys(createMetadata).length > 0 && { metadata: createMetadata }),
        costManagementConfig: buildCostManagementConfig(),
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

async function handleArchiveUnarchive() {
  if (!currentProject.value) return
  const action = isArchived.value ? 'unarchive' : 'archive'
  if (!confirm(`${action === 'archive' ? 'Archive' : 'Unarchive'} project "${currentProject.value.name}"?`)) return
  try {
    if (action === 'archive') {
      currentProject.value = await projectsStore.archive(currentProject.value.id, currentProject.value.version)
    } else {
      currentProject.value = await projectsStore.unarchive(currentProject.value.id, currentProject.value.version)
    }
    // refresh selection store if this project is currently selected
    const projSel = useProjectSelectionStore()
    const updatedId = currentProject.value?.id
    if (updatedId && projSel.selectedProjectId === updatedId) {
      projSel.setSelectedProjectId(updatedId)
    }
  } catch (err: any) {
    alert(err.response?.data?.message || `Failed to ${action} project`)
  }
}

async function handleDeleteProject() {
  if (!currentProject.value) return
  if (deleteConfirmName.value !== currentProject.value.name) {
    alert('You must type the project name exactly to confirm deletion')
    return
  }
  if (!confirm('This will permanently remove the project and all related entities. This action cannot be undone.')) return
  try {
    const deletedId = currentProject.value.id
    await projectsStore.remove(deletedId, currentProject.value.version)

    // If the deleted project was selected globally, clear it
    const projSel = useProjectSelectionStore()
    if (projSel.selectedProjectId === deletedId) {
      projSel.clearSelectedProject()
    }

    goBack()
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete project')
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

function handleAsrSettingsSave(data: { settings: any; voiceActivityDetection: boolean }) {
  form.value.asrConfig.settings = data.settings
  form.value.asrConfig.voiceActivityDetection = data.voiceActivityDetection
  showAsrSettingsModal.value = false
}

function handleServerVadSettingsSave(config: { mode: number | undefined; frameDurationMs: (10 | 20 | 30) | undefined; silencePaddingMs: number | undefined; autoEndSilenceDurationMs: number | undefined }) {
  form.value.asrConfig.serverVad = config
  showServerVadModal.value = false
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

// Cost Management helpers
function configToCostLimitEntries(config: CostManagementConfig): CostLimitEntry[] {
  const entries: CostLimitEntry[] = []
  for (const [providerId, models] of Object.entries(config.limits)) {
    for (const [modelName, limits] of Object.entries(models)) {
      entries.push({
        providerId,
        modelName,
        outputTokensLimits: {
          completion: limits.outputTokensLimits?.completion,
          classification: limits.outputTokensLimits?.classification,
          tool: limits.outputTokensLimits?.tool,
          transformation: limits.outputTokensLimits?.transformation,
          filler: limits.outputTokensLimits?.filler,
        },
        inputTokensLimits: {
          completion: limits.inputTokensLimits?.completion,
          classification: limits.inputTokensLimits?.classification,
          tool: limits.inputTokensLimits?.tool,
          transformation: limits.inputTokensLimits?.transformation,
          filler: limits.inputTokensLimits?.filler,
        },
      })
    }
  }
  return entries
}

function buildCostManagementConfig(): CostManagementConfig {
  const limits: Record<string, Record<string, ProviderModelLimits>> = {}
  for (const entry of form.value.costLimitEntries) {
    if (!entry.providerId || !entry.modelName) continue
    if (!limits[entry.providerId]) limits[entry.providerId] = {}
    const pml: ProviderModelLimits = {}
    const outTokens: RequestTypeLimits = {}
    if (entry.outputTokensLimits.completion) outTokens.completion = entry.outputTokensLimits.completion
    if (entry.outputTokensLimits.classification) outTokens.classification = entry.outputTokensLimits.classification
    if (entry.outputTokensLimits.tool) outTokens.tool = entry.outputTokensLimits.tool
    if (entry.outputTokensLimits.transformation) outTokens.transformation = entry.outputTokensLimits.transformation
    if (entry.outputTokensLimits.filler) outTokens.filler = entry.outputTokensLimits.filler
    if (Object.keys(outTokens).length > 0) pml.outputTokensLimits = outTokens
    const inTokens: RequestTypeLimits = {}
    if (entry.inputTokensLimits.completion) inTokens.completion = entry.inputTokensLimits.completion
    if (entry.inputTokensLimits.classification) inTokens.classification = entry.inputTokensLimits.classification
    if (entry.inputTokensLimits.tool) inTokens.tool = entry.inputTokensLimits.tool
    if (entry.inputTokensLimits.transformation) inTokens.transformation = entry.inputTokensLimits.transformation
    if (entry.inputTokensLimits.filler) inTokens.filler = entry.inputTokensLimits.filler
    if (Object.keys(inTokens).length > 0) pml.inputTokensLimits = inTokens
    ;(limits[entry.providerId] as Record<string, ProviderModelLimits>)[entry.modelName] = pml
  }
  return { limits }
}


</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border md:border-gray-200 md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
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
      <div class="flex gap-3 items-center">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="!isArchived" @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Project')) }}
        </button>
      </div>
    </div>

    <!-- Archived banner -->
    <div v-if="isArchived" class="alert-warning mb-4">
      This project is archived — editing is disabled.
    </div>
    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
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
        <fieldset :disabled="isArchived" class="border-0 p-0 m-0 min-w-0 w-full">
        <!-- Error Message -->
        <div v-if="error" class="alert-error mb-6">
          {{ error }}
        </div>

        <!-- General Tab -->
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

          <div class="form-group">
            <label class="form-label">Timezone</label>
            <TimezoneSelector
              v-model="form.timezone"
              width="override"
              placeholder="Default (UTC)"
              :disabled="isLoading"
              class="max-w-96"
            />
            <p class="form-help-text">IANA timezone used as the default for conversations in this project (e.g. Europe/Warsaw, America/New_York)</p>
          </div>

          <div class="form-group">
            <label class="form-label">Language</label>
            <LanguageSelector
              v-model="form.languageCode"
              width="override"
              placeholder="Not set"
              :disabled="isLoading"
              class="max-w-96"
            />
            <p class="form-help-text">Default language for this project. Exposed in scripts and templates as <code>project.languageCode</code> and <code>project.language</code>.</p>
          </div>

          <div class="form-group">
            <label class="form-label">Conversation Timeout (seconds)</label>
            <input
              :value="form.conversationTimeoutSeconds ?? ''"
              @change="(e) => {
                const raw = (e.target as HTMLInputElement).value
                if (raw === '' || raw === null) { form.conversationTimeoutSeconds = null; return }
                const n = parseInt(raw, 10)
                if (isNaN(n) || n === 0) { form.conversationTimeoutSeconds = null; return }
                form.conversationTimeoutSeconds = Math.min(3600, Math.max(60, n));
                (e.target as HTMLInputElement).value = String(form.conversationTimeoutSeconds)
              }"
              type="number"
              min="60"
              max="3600"
              placeholder="No timeout"
              class="form-input max-w-64"
              :disabled="isLoading"
            />
            <p class="form-help-text">Automatically abort conversations with no activity after this many seconds (60–3600). Leave empty to disable.</p>
          </div>

          <!-- Project Color Picker -->
          <div class="form-group">
            <label class="form-label">Project Color</label>
            <div class="mt-2">
              <!-- Color swatch grid: columns = hue families, rows = shades (300 / 600 / 900) -->
              <div class="flex gap-1 flex-wrap">
                <!-- "No color" clear swatch -->
                <div class="flex flex-col gap-1 mr-2">
                  <button
                    type="button"
                    @click="form.primaryColor = null"
                    :class="[
                      'w-7 h-7 rounded border-2 flex items-center justify-center bg-white dark:bg-gray-700 transition-all',
                      !form.primaryColor
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-110 hover:border-gray-500'
                    ]"
                    title="No color"
                  >
                    <X :size="12" class="text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div
                  v-for="family in PROJECT_COLOR_FAMILIES"
                  :key="family.name"
                  class="flex flex-col gap-1"
                >
                  <button
                    v-for="color in family.colors"
                    :key="color.key"
                    type="button"
                    @click="form.primaryColor = color.key"
                    :title="`${family.name} ${color.shade}`"
                    :class="[
                      'w-7 h-7 rounded transition-all',
                      form.primaryColor === color.key
                        ? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-white scale-110'
                        : 'hover:scale-110 hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500'
                    ]"
                    :style="{ backgroundColor: color.hex }"
                  />
                </div>
              </div>

              <!-- Current selection label -->
              <div class="mt-2 h-5 flex items-center gap-2">
                <template v-if="form.primaryColor">
                  <span
                    class="inline-block w-4 h-4 rounded"
                    :style="{ backgroundColor: getProjectColorHex(form.primaryColor) ?? undefined }"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ form.primaryColor }}</span>
                  <button type="button" @click="form.primaryColor = null" class="text-xs text-red-500 underline">Clear</button>
                </template>
                <span v-else class="text-xs text-gray-400 dark:text-gray-500">No color selected</span>
              </div>
            </div>
            <p class="form-help-text mt-1">Optional accent color shown in the top navigation bar when this project is active</p>
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
              <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Speech Recognition & Text To Speech Configuration</h3>
              <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                Configure voice capabilities for your conversations, including speech recognition (ASR) and text-to-speech (TTS).
              </p>
            </div>

            <!-- Enable Speech Input Box -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                <input
                  v-model="form.acceptVoice"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Speech Input
                </span>
              </label>

              <div v-if="form.acceptVoice" class="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                <p class="form-help-text">
                  Allow conversations to accept voice input from users using automatic speech recognition.
                </p>

                <!-- ASR Provider -->
                <div class="form-group">
                  <label class="form-label">
                    ASR Provider <span class="required">*</span>
                  </label>
                  <div class="flex flex-col md:flex-row gap-2">
                    <select
                      v-model="form.asrConfig.asrProviderId"
                      class="form-select-auto min-w-64"
                      :class="{ 'border-red-500': !form.asrConfig.asrProviderId }"
                      :disabled="isLoading"
                      @change="handleAsrProviderChange"
                    >
                      <option value="">None</option>
                      <option v-for="provider in asrProviders" :key="provider.id" :value="provider.id">
                        {{ provider.name }}
                      </option>
                    </select>
                    <button
                      type="button"
                      @click="showAsrSettingsModal = true"
                      class="btn-secondary whitespace-nowrap"
                      :disabled="isLoading || !form.asrConfig.asrProviderId"
                    >
                      <Settings class="inline-block mr-1 w-4 h-4" />
                      Settings...
                    </button>
                  </div>
                  <p class="form-help-text">
                    Select the Automatic Speech Recognition provider for voice input.
                  </p>
                  <p v-if="!form.asrConfig.asrProviderId" class="text-xs text-red-600 mt-1">An ASR provider is required when speech input is enabled.</p>
                </div>

                <!-- Unintelligible Placeholder -->
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

                <!-- Server-side VAD -->
                <div class="flex items-center gap-3">
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="form.asrConfig.serverVadEnabled"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Enable Server-side VAD
                    </span>
                    <span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Experimental</span>
                  </label>
                  <button
                    v-if="form.asrConfig.serverVadEnabled"
                    type="button"
                    class="btn-secondary whitespace-nowrap"
                    :disabled="isLoading"
                    @click="showServerVadModal = true"
                  >
                    <Settings class="inline-block mr-1 w-4 h-4" />
                    Settings...
                  </button>
                </div>
              </div>
            </div>

            <!-- Voice Output -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                <input
                  v-model="form.generateVoice"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Speech Output
                </span>
              </label>
              <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p class="form-help-text text-gray-500 dark:text-gray-400">
                  Allow conversations to generate voice responses using text-to-speech
                </p>
              </div>
            </div>
          </div>
        </div>


        <!-- Storage Tab -->
        <div v-show="activeTab === 'storage'" class="tab-content">
          <div class="flex items-start gap-3 p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <FlaskConical class="shrink-0 mt-0.5 w-4 h-4" />
            <p class="text-sm">
              <span class="font-semibold">Experimental feature</span> — Storage is under active development. Behaviour may change in future releases.
            </p>
          </div>
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
                class="form-select-auto min-w-64Tags for categorizing and filtering. Press Enter or comma to add a tag."
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

        <!-- Cost Management Tab -->
        <div v-show="activeTab === 'costs'" class="tab-content">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Token Limits</h3>
              <p class="text-sm text-gray-600 mb-1 dark:text-gray-400">
                Define per-model token limits to control LLM costs across all conversations in this project.
                Limits are keyed by provider and model name (e.g. <code>gpt-4o</code>).
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <strong>Output token limits</strong> are enforced as a hard ceiling over entity-level defaults.
                <strong>Input token limits</strong> cause oldest messages to be trimmed from context when exceeded.
              </p>
            </div>

            <!-- Limit rules table -->
            <div v-if="form.costLimitEntries.length > 0" class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Provider</th>
                      <th class="table-header-cell">Model</th>
                      <th class="table-header-cell">Input Limits</th>
                      <th class="table-header-cell">Output Limits</th>
                      <th class="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-for="(entry, index) in form.costLimitEntries" :key="index" class="table-row">
                      <td class="table-clickable-cell" @click="openEditCostLimitEntry(index)">{{ providerNameForId(entry.providerId) }}</td>
                      <td class="table-cell">{{ modelNameForEntry(entry) }}</td>
                      <td class="table-cell">
                        <ul v-if="limitsForDisplay(entry.inputTokensLimits).length" class="space-y-0.5">
                          <li v-for="l in limitsForDisplay(entry.inputTokensLimits)" :key="l.label" class="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                            <span class="text-gray-400 dark:text-gray-500">&bull;</span>
                            <span>{{ l.label }}:</span>
                            <span class="font-medium text-gray-800 dark:text-gray-200">{{ l.value.toLocaleString() }}</span>
                          </li>
                        </ul>
                        <span v-else class="text-xs text-gray-400 dark:text-gray-500">&mdash;</span>
                      </td>
                      <td class="table-cell">
                        <ul v-if="limitsForDisplay(entry.outputTokensLimits).length" class="space-y-0.5">
                          <li v-for="l in limitsForDisplay(entry.outputTokensLimits)" :key="l.label" class="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                            <span class="text-gray-400 dark:text-gray-500">&bull;</span>
                            <span>{{ l.label }}:</span>
                            <span class="font-medium text-gray-800 dark:text-gray-200">{{ l.value.toLocaleString() }}</span>
                          </li>
                        </ul>
                        <span v-else class="text-xs text-gray-400 dark:text-gray-500">&mdash;</span>
                      </td>
                      <td class="table-cell-right">
                        <div class="flex justify-end gap-2">
                          <button type="button" class="btn-secondary btn-sm" :disabled="isLoading" @click="openEditCostLimitEntry(index)">Edit</button>
                          <button type="button" class="btn-danger btn-sm" :disabled="isLoading" @click="removeCostLimitEntry(index)">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="flex flex-col items-center justify-center py-10 gap-2 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p class="text-sm">No limit rules configured.</p>
              <p class="text-xs">Add a rule to set token limits for a specific provider and model.</p>
            </div>

            <!-- Add rule button -->
            <button type="button" @click="openAddCostLimitEntry" class="btn-secondary" :disabled="isLoading">
              <Plus class="inline-block w-4 h-4 mr-2" />
              Add Limit Rule
            </button>

          </div>
        </div>

        </fieldset>

        <!-- API Keys Tab (outside fieldset so delete buttons are never disabled) -->
        <div v-show="activeTab === 'apiKeys' && isEditMode" class="tab-content">
          <div class="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Manage API keys for this project</p>
            </div>
            <button @click="handleCreateApiKey" class="btn-primary" type="button" :disabled="isArchived">
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

          <div v-else class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Name</th>
                    <th class="table-header-cell">Key</th>
                    <th class="table-header-cell">Active</th>
                    <th class="table-header-cell">Last Used</th>
                    <th class="table-header-cell">Created</th>
                    <th class="table-header-cell-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="apiKey in filteredApiKeys" :key="apiKey.id" class="table-row">
                    <td class="table-clickable-cell" @click="handleEditApiKey(apiKey)">{{ apiKey.name }}</td>
                    <td class="table-cell"><code class="font-mono text-sm">{{ apiKey.keyPreview }}</code></td>
                    <td class="table-cell">
                      <input
                        type="checkbox"
                        :checked="apiKey.isActive"
                        @change="handleToggleApiKey(apiKey)"
                        class="form-checkbox cursor-pointer"
                        :disabled="isArchived"
                      />
                    </td>
                    <td class="table-cell-muted">{{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</td>
                    <td class="table-cell-muted">{{ formatDate(apiKey.createdAt) }}</td>
                    <td class="table-cell-right">
                      <div class="flex justify-end gap-2">
                        <button @click="handleEditApiKey(apiKey)" class="btn-secondary btn-sm" type="button">
                          {{ isArchived ? 'View' : 'Edit' }}
                        </button>
                        <button @click="handleDeleteApiKey(apiKey)" class="btn-danger btn-sm" type="button">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentProject"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        <div class="tab-content">
          <!-- History Tab -->
          <EntityHistoryView
            v-if="isEditMode && currentProject"
            v-show="activeTab === 'history'"
            :load-history="() => projectsStore.fetchAuditLogs(currentProject!.id)"
            :current-version="currentProject.version"
            :current-object="currentProject"
            :active="activeTab === 'history'"
            :update-fn="(data) => projectsStore.update(currentProject!.id, data)"
            :create-fn="(data) => projectsStore.create(data)"
            :ignore-fields="['updatedAt', 'version', 'archivedAt', 'archivedBy']"
            @recover-success="loadProject"
          />
        </div>
        <!-- Danger Zone Tab -->
        <div v-if="isEditMode" v-show="activeTab === 'danger'" class="tab-content">
          <h3 class="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Deleting a project will remove <strong>all</strong> related entities (agents, stages,
            classifiers, etc.). This cannot be undone. Type the project name below to confirm
            deletion.
          </p>
          <div class="form-group mb-4">
            <label class="form-label">Project name</label>
            <input v-model="deleteConfirmName" type="text" class="form-input" :disabled="isLoading" />
          </div>
          <button
            class="btn-danger"
            :disabled="isLoading || deleteConfirmName !== currentProject?.name"
            @click="handleDeleteProject"
          >
            Delete Project
          </button>
        </div>
        </form>
      </div>
    </div>

    <!-- Cost Limit Entry Modal -->
    <CostLimitEntryModal
      v-if="showCostLimitModal"
      :entry="editingCostLimitEntry"
      :llm-providers="llmProviderOptions"
      @close="showCostLimitModal = false"
      @save="handleCostLimitEntrySave"
    />

    <!-- API Key Edit Modal -->
    <ApiKeyEditModal
      v-if="showApiKeyModal"
      :api-key="selectedApiKey"
      :project-id="currentProject?.id || ''"
      :is-read-only="isArchived"
      @close="handleApiKeyModalClose"
      @save="handleApiKeySave"
    />

    <!-- ASR Settings Modal -->
    <AsrSettingsModal
      v-if="showAsrSettingsModal"
      :selected-provider="selectedAsrProvider"
      :asr-config="form.asrConfig"
      @close="showAsrSettingsModal = false"
      @save="handleAsrSettingsSave"
    />

    <!-- Server VAD Settings Modal -->
    <ServerVadSettingsModal
      v-if="showServerVadModal"
      :config="form.asrConfig.serverVad"
      @close="showServerVadModal = false"
      @save="handleServerVadSettingsSave"
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
