<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, useApiKeysStore, useProvidersStore, useProjectSelectionStore, useStagesStore } from '@/stores'
import TimezoneSelector from '@/components/TimezoneSelector.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { ArrowLeft, Save, Plus, Trash2, X, Settings, Check, Pencil, Eye } from 'lucide-vue-next'
import type { ProjectResponse, ApiKeyResponse, AsrConfig, RecordingConfig, CostManagementConfig, ProviderModelLimits, RequestTypeLimits, ParsedError, ApiErrorDetail, ServerVadConfig } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import apiClient from '@/api/client'
import type { CostLimitEntry } from '@/components/modals/CostLimitEntryModal.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import CostLimitEntryModal from '@/components/modals/CostLimitEntryModal.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import { PROJECT_COLOR_FAMILIES, getProjectColorHex } from '@/assets/projectColors'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'
import StorageSettingsModal from '@/components/modals/StorageSettingsModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import AsrSettingsModal from '@/components/modals/AsrSettingsModal.vue'
import ServerVadSettingsModal from '@/components/modals/ServerVadSettingsModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()
const stagesStore = useStagesStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'voice' | 'recording' | 'storage' | 'costs' | 'apiKeys' | 'metadata' | 'history' | 'danger'>('basic')

const form = ref({
  name: '',
  description: '',
  asrConfig: {
    asrProviderId: '',
    settings: {} as any,
    unintelligiblePlaceholder: '',
    voiceActivityDetection: false,
    silenceDetectionEnabled: false,
    silenceTimeoutMs: null as number | null,
    maxSilences: null as number | null,
    silencePlaceholder: '',
    serverVadEnabled: false,
    serverVad: {
      algorithm: 'legacy' as 'legacy' | 'silero',
      mode: undefined as number | undefined,
      frameDurationMs: undefined as (10 | 20 | 30) | undefined,
      silencePaddingMs: undefined as number | undefined,
      autoEndSilenceDurationMs: undefined as number | undefined,
      gracePeriodMs: undefined as number | undefined,
      model: undefined as "v5" | "legacy" | undefined,
      positiveSpeechThreshold: undefined as number | undefined,
      negativeSpeechThreshold: undefined as number | undefined,
      frameSamples: undefined as number | undefined,
      redemptionFrames: undefined as number | undefined,
      preSpeechPadFrames: undefined as number | undefined,
      minSpeechFrames: undefined as number | undefined,
      submitUserSpeechOnPause: undefined as boolean | undefined,
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
  startingStageId: null as string | null,
  recordingConfig: {
    enabled: false,
    recordInput: true,
    recordOutput: true,
    format: 'opus' as RecordingConfig['format'],
  },
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
  { key: 'recording', label: 'Recording' },
  { key: 'storage', label: 'Storage' },
  { key: 'costs', label: 'Cost Management' },
  { key: 'apiKeys', label: 'API Keys', show: isEditMode.value },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
  { key: 'danger', label: 'Danger Zone', show: isEditMode.value },
])
const currentProject = ref<ProjectResponse | null>(null)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

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

function costLimitSortKey(entry: CostLimitEntry): [string, string] {
  const provider = entry.providerId === '*' ? '' : providerNameForId(entry.providerId).toLowerCase()
  const model = entry.modelName === '*' ? '' : (modelDisplayNames.value[entry.providerId]?.[entry.modelName] ?? entry.modelName).toLowerCase()
  return [provider, model]
}

const sortedCostLimitEntries = computed(() =>
  form.value.costLimitEntries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .sort((a, b) => {
      const [ap, am] = costLimitSortKey(a.entry)
      const [bp, bm] = costLimitSortKey(b.entry)
      return ap !== bp ? ap.localeCompare(bp) : am.localeCompare(bm)
    })
)

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

const sortedStages = computed(() =>
  [...stagesStore.items].sort((a, b) => a.name.localeCompare(b.name))
)

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

function toggleSilenceDetection(enabled: boolean) {
  if (enabled) {
    if (!form.value.asrConfig.voiceActivityDetection) return
    form.value.asrConfig.silenceDetectionEnabled = true
    form.value.asrConfig.silenceTimeoutMs = 8000
  } else {
    form.value.asrConfig.silenceDetectionEnabled = false
    form.value.asrConfig.silenceTimeoutMs = null
    form.value.asrConfig.maxSilences = null
    form.value.asrConfig.silencePlaceholder = ''
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
          silenceDetectionEnabled: !!currentProject.value.asrConfig?.silenceTimeoutMs,
          silenceTimeoutMs: currentProject.value.asrConfig?.silenceTimeoutMs ?? null,
          maxSilences: currentProject.value.asrConfig?.maxSilences ?? null,
          silencePlaceholder: currentProject.value.asrConfig?.silencePlaceholder || '',
          serverVadEnabled: !!currentProject.value.asrConfig?.serverVad,
          serverVad: parseServerVadConfig(currentProject.value.asrConfig?.serverVad),
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
        startingStageId: currentProject.value.startingStageId ?? null,
        recordingConfig: {
          enabled: currentProject.value.recordingConfig?.enabled ?? false,
          recordInput: currentProject.value.recordingConfig?.recordInput ?? true,
          recordOutput: currentProject.value.recordingConfig?.recordOutput ?? true,
          format: currentProject.value.recordingConfig?.format ?? 'opus',
        },
      }

      // Load model display names for configured entries
      for (const entry of form.value.costLimitEntries) {
        ensureModelsLoaded(entry.providerId)
      }

      // Load stages for starting stage selector
      await stagesStore.fetchAll(projectId.value!)

      // Load API keys for edit mode
      await loadApiKeys()
    }
  } catch (err: any) {
    error.value = parseApiError(err)
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

  const errorDetails: ApiErrorDetail[] = []

  if (form.value.name.trim() === '')
    errorDetails.push({ path: ['name'], message: 'Project name is required', code: 'REQUIRED_FIELD' })

 if (form.value.acceptVoice && !form.value.asrConfig.asrProviderId)
       errorDetails.push({ path: ['asrConfig', 'asrProviderId'], message: 'ASR provider is required when Speech Input is enabled', code: 'REQUIRED_FIELD' })

   if (form.value.asrConfig.silenceDetectionEnabled && !form.value.asrConfig.voiceActivityDetection)
     errorDetails.push({ path: ['asrConfig', 'voiceActivityDetection'], message: 'Voice Activity Detection is required when Silence Detection is enabled', code: 'REQUIRED_FIELD' })
   else if (form.value.asrConfig.silenceDetectionEnabled && (form.value.asrConfig.silenceTimeoutMs === null || form.value.asrConfig.silenceTimeoutMs === undefined))
     errorDetails.push({ path: ['asrConfig', 'silenceTimeoutMs'], message: 'Silence timeout is required when Silence Detection is enabled', code: 'REQUIRED_FIELD' })

   if (form.value.recordingConfig.enabled && !form.value.recordingConfig.recordInput && !form.value.recordingConfig.recordOutput)
    errorDetails.push({ path: ['recordingConfig', 'recordInput'], message: 'At least one of Record User Input or Record AI Output must be enabled', code: 'REQUIRED_FIELD' })
    
  if (errorDetails.length > 0) {
    error.value = { message: 'Please fix the errors below', details: errorDetails }
    switchToFirstErrorTab(error.value)
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
      ...(form.value.asrConfig.silenceTimeoutMs !== null && { silenceTimeoutMs: form.value.asrConfig.silenceTimeoutMs }),
      ...(form.value.asrConfig.maxSilences !== null && { maxSilences: form.value.asrConfig.maxSilences }),
      ...(form.value.asrConfig.silencePlaceholder && { silencePlaceholder: form.value.asrConfig.silencePlaceholder }),
      ...(form.value.asrConfig.serverVadEnabled && {
        serverVad: buildServerVadConfig()
      })
    } : undefined

    // Build recording config only if enabled
    const recordingConfig = form.value.recordingConfig.enabled ? {
      enabled: true,
      recordInput: form.value.recordingConfig.recordInput,
      recordOutput: form.value.recordingConfig.recordOutput,
      format: form.value.recordingConfig.format,
    } : null

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
        asrConfig: asrConfig ?? undefined,
        storageConfig: storageConfig || null,
        acceptVoice: form.value.acceptVoice,
        generateVoice: form.value.generateVoice,
        timezone: form.value.timezone,
        languageCode: form.value.languageCode,
        conversationTimeoutSeconds: form.value.conversationTimeoutSeconds ?? undefined,
        metadata,
        costManagementConfig: buildCostManagementConfig(),
        startingStageId: form.value.startingStageId,
        recordingConfig,
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
        ...(form.value.startingStageId && { startingStageId: form.value.startingStageId }),
        ...(recordingConfig && { recordingConfig }),
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
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.projects' })
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


function handleAsrSettingsSave(data: { settings: any; voiceActivityDetection: boolean }) {
  form.value.asrConfig.settings = data.settings
  form.value.asrConfig.voiceActivityDetection = data.voiceActivityDetection
  if (!data.voiceActivityDetection && form.value.asrConfig.silenceDetectionEnabled) {
    form.value.asrConfig.silenceDetectionEnabled = false
    form.value.asrConfig.silenceTimeoutMs = null
    form.value.asrConfig.maxSilences = null
    form.value.asrConfig.silencePlaceholder = ''
  }
  showAsrSettingsModal.value = false
}

function handleServerVadSettingsSave(config: ServerVadConfig) {
  form.value.asrConfig.serverVad = config as typeof form.value.asrConfig.serverVad
  showServerVadModal.value = false
}

function parseServerVadConfig(serverVad: ServerVadConfig | undefined): typeof form.value.asrConfig.serverVad {
  if (!serverVad) {
    return {
      algorithm: 'legacy',
      mode: undefined,
      frameDurationMs: undefined,
      silencePaddingMs: undefined,
      autoEndSilenceDurationMs: undefined,
      gracePeriodMs: undefined,
      model: undefined,
      positiveSpeechThreshold: undefined,
      negativeSpeechThreshold: undefined,
      frameSamples: undefined,
      redemptionFrames: undefined,
      preSpeechPadFrames: undefined,
      minSpeechFrames: undefined,
      submitUserSpeechOnPause: undefined,
    }
  }

  if (serverVad.algorithm === 'legacy') {
    return {
      algorithm: 'legacy',
      mode: serverVad.mode,
      frameDurationMs: serverVad.frameDurationMs,
      silencePaddingMs: serverVad.silencePaddingMs,
      autoEndSilenceDurationMs: serverVad.autoEndSilenceDurationMs,
      gracePeriodMs: serverVad.gracePeriodMs,
      model: undefined,
      positiveSpeechThreshold: undefined,
      negativeSpeechThreshold: undefined,
      frameSamples: undefined,
      redemptionFrames: undefined,
      preSpeechPadFrames: undefined,
      minSpeechFrames: undefined,
      submitUserSpeechOnPause: undefined,
    }
  }

  return {
    algorithm: 'silero',
    mode: undefined,
    frameDurationMs: undefined,
    silencePaddingMs: undefined,
    autoEndSilenceDurationMs: undefined,
    gracePeriodMs: serverVad.gracePeriodMs,
    model: serverVad.model,
    positiveSpeechThreshold: serverVad.positiveSpeechThreshold,
    negativeSpeechThreshold: serverVad.negativeSpeechThreshold,
    frameSamples: serverVad.frameSamples,
    redemptionFrames: serverVad.redemptionFrames,
    preSpeechPadFrames: serverVad.preSpeechPadFrames,
    minSpeechFrames: serverVad.minSpeechFrames,
    submitUserSpeechOnPause: serverVad.submitUserSpeechOnPause,
  }
}

function buildServerVadConfig(): ServerVadConfig | undefined {
  const vad = form.value.asrConfig.serverVad
  if (vad.algorithm === 'legacy') {
    return {
      algorithm: 'legacy',
      ...(vad.mode !== undefined && { mode: vad.mode }),
      ...(vad.frameDurationMs !== undefined && { frameDurationMs: vad.frameDurationMs }),
      ...(vad.silencePaddingMs !== undefined && { silencePaddingMs: vad.silencePaddingMs }),
      ...(vad.autoEndSilenceDurationMs !== undefined && { autoEndSilenceDurationMs: vad.autoEndSilenceDurationMs }),
      ...(vad.gracePeriodMs !== undefined && { gracePeriodMs: vad.gracePeriodMs }),
    }
  } else {
    return {
      algorithm: 'silero',
      ...(vad.model !== undefined && { model: vad.model }),
      ...(vad.positiveSpeechThreshold !== undefined && { positiveSpeechThreshold: vad.positiveSpeechThreshold }),
      ...(vad.negativeSpeechThreshold !== undefined && { negativeSpeechThreshold: vad.negativeSpeechThreshold }),
      ...(vad.frameSamples !== undefined && { frameSamples: vad.frameSamples }),
      ...(vad.redemptionFrames !== undefined && { redemptionFrames: vad.redemptionFrames }),
      ...(vad.preSpeechPadFrames !== undefined && { preSpeechPadFrames: vad.preSpeechPadFrames }),
      ...(vad.minSpeechFrames !== undefined && { minSpeechFrames: vad.minSpeechFrames }),
      ...(vad.submitUserSpeechOnPause !== undefined && { submitUserSpeechOnPause: vad.submitUserSpeechOnPause }),
      ...(vad.gracePeriodMs !== undefined && { gracePeriodMs: vad.gracePeriodMs }),
    }
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
  <div class="flex-1 min-w-0">
  <div class="flex flex-col h-full border md:border-gray-200 md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-4 md:py-3 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to projects">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">{{ isEditMode ? 'Edit Project' : 'Create Project' }}</h1>
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
      <ErrorDisplay :error="error" />
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Projects
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
        <fieldset :disabled="isArchived" class="border-0 p-0 m-0 min-w-0 w-full">
        <!-- Error Message -->
        <ErrorDisplay :error="error" class="mx-4 mt-3" />

        <!-- General Tab -->
        <TabContent v-model="activeTab" tab="basic">
          <FormField label="Project Name" required :error="error" path="name" class="w-full" help="A descriptive name for your AI application project">
            <input
              v-model="form.name"
              type="text"
              placeholder="My AI Project"
              class="form-input"
              :disabled="isLoading"
            />
          </FormField>

          <FormField label="Description" :error="error" path="description" class="w-full" help="Provide additional context about the project's purpose">
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Optional description of what this project does"
              class="form-textarea"
              :disabled="isLoading"
            ></textarea>
          </FormField>

          <FormField label="Timezone" :error="error" path="timezone" class="min-w-60" help="IANA timezone used as the default for conversations in this project (e.g. Europe/Warsaw, America/New_York)">
            <TimezoneSelector
              v-model="form.timezone"
              width="override"
              placeholder="Default (UTC)"
              :disabled="isLoading"
              class="max-w-96"
            />
          </FormField>

          <FormField label="Language" :error="error" path="languageCode" class="min-w-60" help="Default language for this project. Exposed as project.languageCode and project.language in scripts and templates.">
            <LanguageSelector
              v-model="form.languageCode"
              width="override"
              placeholder="Not set"
              :disabled="isLoading"
              class="max-w-96"
            />
          </FormField>

          <FormField label="Conversation Timeout (seconds)" :error="error" path="conversationTimeoutSeconds" class="min-w-48" help="Automatically abort conversations with no activity after this many seconds (60–3600). Leave empty to disable.">
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
          </FormField>

          <FormField v-if="isEditMode" label="Default Starting Stage" :error="error" path="startingStageId" class="min-w-60 max-w-96" help="Stage to start new conversations at when no stage is specified. Leave empty to require explicit stage selection.">
            <select
              v-model="form.startingStageId"
              class="form-select max-w-96"
              :disabled="isLoading"
            >
              <option :value="null">None (require explicit selection)</option>
              <option v-for="stage in sortedStages" :key="stage.id" :value="stage.id">
                {{ stage.name }}
              </option>
            </select>
          </FormField>

          <!-- Project Color Picker -->
          <FormField label="Project Color" :error="error" path="primaryColor" help="Optional accent color shown in the top navigation bar when this project is active">
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
          </FormField>

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
          </TabContent>

          <!-- Voice Settings Tab -->
          <TabContent v-model="activeTab" tab="voice">
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
                  <CompositeFormField label="ASR Provider" required :error="error" help="Select the Automatic Speech Recognition provider for voice input.">
                    <div class="flex flex-col md:flex-row gap-2">
                      <FormField :path="['asrConfig', 'asrProviderId']">
                        <select
                          v-model="form.asrConfig.asrProviderId"
                          class="form-select-auto min-w-64"
                          :disabled="isLoading"
                          @change="handleAsrProviderChange"
                        >
                          <option value="">None</option>
                          <option v-for="provider in asrProviders" :key="provider.id" :value="provider.id">
                            {{ provider.name }}
                          </option>
                        </select>
                      </FormField>
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
                  </CompositeFormField>

                  <!-- Unintelligible Placeholder -->
                  <FormField label="Unintelligible Placeholder" :error="error" :path="['asrConfig', 'unintelligiblePlaceholder']" class="w-full" help="Text to use when speech is unintelligible or cannot be transcribed">
                    <input
                      v-model="form.asrConfig.unintelligiblePlaceholder"
                      type="text"
                      placeholder="e.g., [unintelligible]"
                      class="form-input"
                      :disabled="isLoading"
                    />
                  </FormField>

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

                  <!-- Silence Detection -->
                  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50" :class="{ 'opacity-50 pointer-events-none': !form.asrConfig.voiceActivityDetection }">
                      <input
                        :checked="form.asrConfig.silenceDetectionEnabled"
                        @change="(e) => toggleSilenceDetection((e.target as HTMLInputElement).checked)"
                        type="checkbox"
                        class="form-checkbox"
                        :disabled="isLoading || !form.asrConfig.voiceActivityDetection"
                      />
                      <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                        Enable Silence Detection
                      </span>
                      <span v-if="!form.asrConfig.voiceActivityDetection" class="ml-2 text-xs text-gray-400 dark:text-gray-500 italic">(requires VAD)</span>
                    </label>

                    <div v-if="form.asrConfig.silenceDetectionEnabled" class="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                      <p class="form-help-text">
                        Automatically trigger an AI response after a period of user silence.
                      </p>

                      <FormField label="Silence Timeout (ms)" required :error="error" :path="['asrConfig', 'silenceTimeoutMs']" class="w-full" help="Milliseconds of user silence before triggering an AI response.">
                        <input
                          :value="form.asrConfig.silenceTimeoutMs ?? ''"
                          @change="(e) => {
                            const raw = (e.target as HTMLInputElement).value
                            if (raw === '' || raw === null) { form.asrConfig.silenceTimeoutMs = null; return }
                            const n = parseInt(raw, 10)
                            if (isNaN(n) || n < 0) { form.asrConfig.silenceTimeoutMs = null; return }
                            form.asrConfig.silenceTimeoutMs = n;
                            (e.target as HTMLInputElement).value = String(form.asrConfig.silenceTimeoutMs)
                          }"
                          type="number"
                          min="0"
                          placeholder="8000"
                          class="form-input max-w-xs"
                          :disabled="isLoading"
                        />
                      </FormField>

                      <FormField label="Max Consecutive Silences" :error="error" :path="['asrConfig', 'maxSilences']" class="w-full" help="Maximum number of consecutive silence responses before ending the conversation. Set to 0 or leave empty for unlimited.">
                        <input
                          :value="form.asrConfig.maxSilences ?? ''"
                          @change="(e) => {
                            const raw = (e.target as HTMLInputElement).value
                            if (raw === '' || raw === null) { form.asrConfig.maxSilences = null; return }
                            const n = parseInt(raw, 10)
                            if (isNaN(n) || n < 0) { form.asrConfig.maxSilences = null; return }
                            form.asrConfig.maxSilences = n;
                            (e.target as HTMLInputElement).value = String(form.asrConfig.maxSilences)
                          }"
                          type="number"
                          min="0"
                          placeholder="Unlimited"
                          class="form-input max-w-xs"
                          :disabled="isLoading"
                        />
                      </FormField>

                      <FormField label="Silence Placeholder" :error="error" :path="['asrConfig', 'silencePlaceholder']" class="w-full" help="Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response.">
                        <input
                          v-model="form.asrConfig.silencePlaceholder"
                          type="text"
                          placeholder="e.g., [user is silent]"
                          class="form-input"
                          :disabled="isLoading"
                        />
                      </FormField>
                    </div>
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
          </TabContent>

          <!-- Recording Settings Tab -->
          <TabContent v-model="activeTab" tab="recording">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Audio Recording Configuration</h3>
                <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                  Configure audio recording for conversation debugging and analysis. Recorded audio is stored via the configured storage provider.
                </p>
              </div>

              <!-- Enable Recording Box -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <input
                    v-model="form.recordingConfig.enabled"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="isLoading"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                    Enable Audio Recording
                  </span>
                </label>

                <div v-if="form.recordingConfig.enabled" class="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                  <p class="form-help-text">
                    Record audio from conversations for debugging, quality assurance, and compliance purposes.
                  </p>

                  <div class="flex items-center gap-6">
                    <label class="flex items-center cursor-pointer">
                      <input
                        v-model="form.recordingConfig.recordInput"
                        type="checkbox"
                        class="form-checkbox"
                        :disabled="isLoading"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Record User Input
                      </span>
                    </label>
                    <label class="flex items-center cursor-pointer">
                      <input
                        v-model="form.recordingConfig.recordOutput"
                        type="checkbox"
                        class="form-checkbox"
                        :disabled="isLoading"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Record AI Output
                      </span>
                    </label>
                  </div>

                  <FormField label="Audio Format" :error="error" :path="['recordingConfig', 'format']" class="w-full" help="Audio format for saved recordings. PCM formats are uncompressed; compressed formats save storage space.">
                    <select
                      v-model="form.recordingConfig.format"
                      class="form-select-auto min-w-64"
                      :disabled="isLoading"
                    >
                      <option value="pcm_16000">PCM 16kHz (uncompressed)</option>
                      <option value="pcm_8000">PCM 8kHz (uncompressed)</option>
                      <option value="pcm_22050">PCM 22.05kHz (uncompressed)</option>
                      <option value="pcm_24000">PCM 24kHz (uncompressed)</option>
                      <option value="pcm_44100">PCM 44.1kHz (uncompressed)</option>
                      <option value="pcm_48000">PCM 48kHz (uncompressed)</option>
                      <option value="wav">WAV (uncompressed)</option>
                      <option value="flac">FLAC (lossless compressed)</option>
                      <option value="mp3">MP3 (lossy compressed)</option>
                      <option value="opus">Opus (default, lossy compressed)</option>
                      <option value="aac">AAC (lossy compressed)</option>
                      <option value="mulaw">mu-law (compressed, telephony)</option>
                      <option value="alaw">A-law (compressed, telephony)</option>
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </TabContent>


          <!-- Storage Tab -->
          <TabContent v-model="activeTab" tab="storage">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Storage Configuration</h3>
              <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                Configure storage for conversation artifacts such as audio recordings, transcripts, and other files. Storage providers allow conversations to persist data beyond the database.
              </p>
            </div>

            <FormField label="Storage Provider" :error="error" :path="['storageConfig', 'storageProviderId']" help="Select a storage provider to enable persistent storage of conversation artifacts">
              <select
                v-model="form.storageConfig.storageProviderId"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="">None</option>
                <option v-for="provider in storageProviders" :key="provider.id" :value="provider.id">
                  {{ provider.name }} ({{ provider.apiType }})
                </option>
              </select>
            </FormField>

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
          </TabContent>

          <!-- Cost Management Tab -->
          <TabContent v-model="activeTab" tab="costs">
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
                    <tr v-for="{ entry, originalIndex } in sortedCostLimitEntries" :key="originalIndex" class="table-row">
                      <td class="table-clickable-cell" @click="openEditCostLimitEntry(originalIndex)">{{ providerNameForId(entry.providerId) }}</td>
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
                          <button type="button" class="btn-icon-action" :disabled="isLoading" @click="openEditCostLimitEntry(originalIndex)" title="Edit">
                            <Pencil class="w-4 h-4" />
                          </button>
                          <button type="button" class="btn-icon-action-danger" :disabled="isLoading" @click="removeCostLimitEntry(originalIndex)" title="Delete">
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
          </TabContent>

          </fieldset>

          <!-- API Keys Tab (outside fieldset so delete buttons are never disabled) -->
          <TabContent v-model="activeTab" tab="apiKeys">
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
                    <td class="table-cell-muted"><RelativeDate v-if="apiKey.lastUsedAt" :date="apiKey.lastUsedAt" /><span v-else>Never</span></td>
                    <td class="table-cell-muted"><RelativeDate :date="apiKey.createdAt" /></td>
                    <td class="table-cell-right">
                      <div class="flex justify-end gap-2">
                        <button @click="handleEditApiKey(apiKey)" class="btn-icon-action" type="button" :title="isArchived ? 'View' : 'Edit'">
                          <Eye v-if="isArchived" class="w-4 h-4" />
                          <Pencil v-else class="w-4 h-4" />
                        </button>
                        <button @click="handleDeleteApiKey(apiKey)" class="btn-icon-action-danger" type="button" title="Delete">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </TabContent>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentProject"
            v-model="activeTab"
            tab="metadata"
            :fields="metadataFields"
          />
          <!-- History Tab -->
          <TabContent v-model="activeTab" tab="history">
            <EntityHistoryView
              v-if="isEditMode && currentProject"
              :load-history="() => projectsStore.fetchAuditLogs(currentProject!.id)"
            :current-version="currentProject.version"
            :current-object="currentProject"
            :active="activeTab === 'history'"
            :update-fn="(data) => projectsStore.update(currentProject!.id, data)"
            :create-fn="(data) => projectsStore.create(data)"
            :ignore-fields="['updatedAt', 'version', 'archivedAt', 'archivedBy']"
            @recover-success="loadProject"
          />
          </TabContent>
          <!-- Danger Zone Tab -->
          <TabContent v-if="isEditMode" v-model="activeTab" tab="danger">
          <h3 class="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Deleting a project will remove <strong>all</strong> related entities (agents, stages,
            classifiers, etc.). This cannot be undone. Type the project name below to confirm
            deletion.
          </p>
          <FormField label="Project name" class="w-full">
            <input v-model="deleteConfirmName" type="text" class="form-input" :disabled="isLoading" />
          </FormField>
          <button
            class="btn-danger"
            :disabled="isLoading || deleteConfirmName !== currentProject?.name"
            @click="handleDeleteProject"
          >
            Delete Project
          </button>
          </TabContent>
          </form>
      </div>
    </div>

    <!-- Cost Limit Entry Modal -->
    <CostLimitEntryModal
      v-if="showCostLimitModal"
      :entry="editingCostLimitEntry"
      :llm-providers="llmProviderOptions"
      :existing-entries="form.costLimitEntries"
      :editing-index="editingCostLimitIndex"
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
  </div>
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
