<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgentsStore, useProvidersStore, useProviderCatalogStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useLlmProviderSelect } from '@/composables/useLlmProviderSelect'
import { ArrowLeft, Save, Check, Settings, FlaskConical } from 'lucide-vue-next'
import type { AgentResponse, ElevenLabsTtsSettings, OpenAiTtsSettings, DeepgramTtsSettings, CartesiaTtsSettings, AzureTtsSettings, AmazonPollyTtsSettings, FillerSettings, LlmSettings, ParsedError, ApiErrorDetail } from '@/api/types'
import { parseApiError } from '@/utils/errors'

type TtsSettings = ElevenLabsTtsSettings | OpenAiTtsSettings | DeepgramTtsSettings | CartesiaTtsSettings | AzureTtsSettings | AmazonPollyTtsSettings
import MetadataTab from '@/components/MetadataTab.vue'
import TtsProviderSettingsPanel from '@/components/TtsProviderSettingsPanel.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const agentsStore = useAgentsStore()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'voice' | 'filler' | 'metadata' | 'history'>('basic')
const showFillerLLMSettingsModal = ref(false)
const form = ref<{
  id: string
  name: string
  description: string
  tags: string[]
  prompt: string
  ttsProviderId: string
  ttsSettings: TtsSettings
  metadata: Record<string, any>
  fillerLlmProviderId: string
  fillerLlmSettings: LlmSettings | null
  fillerPrompt: string
}>({
  id: '',
  name: '',
  description: '',
  tags: [],
  prompt: '',
  ttsProviderId: '',
  ttsSettings: {} as TtsSettings,
  metadata: {},
  fillerLlmProviderId: '',
  fillerLlmSettings: null,
  fillerPrompt: ''
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const agentId = computed(() => route.params.agentId as string | undefined)
const isEditMode = computed(() => !!agentId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'voice', label: 'Voice' },
  { key: 'filler', label: () => [
    'Filler Responses',
    h('span', { class: 'ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
      h(FlaskConical, { class: 'w-3 h-3' })
    )
  ] },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentAgent = ref<AgentResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentAgent)
const isReadOnly = computed(() => projectIsArchived.value || !!currentAgent.value?.archived)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const ttsProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'tts')
)

const llmProviders = computed(() =>
  providersStore.items.filter(p => p.providerType === 'llm')
)

const selectedProvider = computed(() => 
  providersStore.items.find(p => p.id === form.value.ttsProviderId)
)

const selectedProviderCatalogInfo = computed(() => {
  if (!selectedProvider.value) return null
  const info = providerCatalogStore.getProviderByApiType('tts', selectedProvider.value.apiType)
  // Type guard to ensure we're dealing with TTS provider info
  if (info && 'models' in info && 'voices' in info) {
    return info
  }
  return null
})

const selectedProviderApiType = computed(() => selectedProvider.value?.apiType || '')
const isAmazonPolly = computed(() => selectedProviderApiType.value === 'amazon-polly')

const isModelSelected = computed(() => !!(form.value.ttsSettings as any).model || (isAmazonPolly.value && !!(form.value.ttsSettings as AmazonPollyTtsSettings).engine))

const availableModels = computed(() => 
  selectedProviderCatalogInfo.value?.models || []
)

const availableVoices = computed(() => {
  if (!selectedProviderCatalogInfo.value) return []
  
  // If a model is selected, check for model-specific voices first
  const modelId = (form.value.ttsSettings as any).model || (isAmazonPolly.value ? (form.value.ttsSettings as AmazonPollyTtsSettings).engine : undefined)
  if (modelId) {
    const selectedModel = selectedProviderCatalogInfo.value.models.find(
      m => m.id === modelId
    )
    // If model has specific voices, use those; otherwise fall back to provider voices
    if (selectedModel?.voices && selectedModel.voices.length > 0) {
      return selectedModel.voices
    }
  }
  
  // Fall back to provider-level voices
  return selectedProviderCatalogInfo.value.voices || []
})

const currentVoiceValue = computed(() => {
  const settings = form.value.ttsSettings as any
  return settings.voiceId
})

const availableAudioFormats = computed(() => {
  if (!selectedProviderCatalogInfo.value) return []
  
  // Get formats from the selected model
  const modelId = (form.value.ttsSettings as any).model || (isAmazonPolly.value ? (form.value.ttsSettings as AmazonPollyTtsSettings).engine : undefined)
  if (modelId) {
    const selectedModel = selectedProviderCatalogInfo.value.models.find(
      m => m.id === modelId
    )
    return selectedModel?.supportedAudioFormats || []
  }
  
  // If no model is selected, collect all unique formats from all models
  const allFormats = new Set<string>()
  selectedProviderCatalogInfo.value.models.forEach(model => {
    model.supportedAudioFormats?.forEach(format => allFormats.add(format))
  })
  return Array.from(allFormats)
})

// Computed properties for select bindings to handle undefined values
const modelValue = computed({
  get: () => {
    const settings = form.value.ttsSettings as any
    if (isAmazonPolly.value) {
      return settings.model ?? (settings as AmazonPollyTtsSettings).engine ?? ''
    }
    return settings.model ?? ''
  },
  set: (value) => {
    (form.value.ttsSettings as any).model = value
    if (isAmazonPolly.value) {
      (form.value.ttsSettings as AmazonPollyTtsSettings).engine = value as AmazonPollyTtsSettings['engine']
    }
  }
})

const audioFormatValue = computed({
  get: () => (form.value.ttsSettings as any).audioFormat ?? '',
  set: (value) => {
    const settings = form.value.ttsSettings as any
    settings.audioFormat = value || undefined
  }
})

function handleTtsProviderChange() {
  const newApiType = selectedProvider.value?.apiType
  switch (newApiType) {
    case 'elevenlabs':
      form.value.ttsSettings = {
        provider: 'elevenlabs',
        model: '',
        voiceId: '',
        noSpeechMarkers: [],
        removeExclamationMarks: false,
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
        speed: 1.0,
        useGlobalPreview: false,
        inactivityTimeout: 180,
        useSentenceSplitter: true
      }
      break;
    case 'openai':
      form.value.ttsSettings = {
        provider: 'openai',
        model: '',
        voiceId: '',
        speed: 1.0,
        instructions: '',
        noSpeechMarkers: [],
        removeExclamationMarks: false,
        useSentenceSplitter: true
      }
      break;
    case 'deepgram':
      form.value.ttsSettings = {
        provider: 'deepgram',
        model: undefined,
        voiceId: '',
        audioFormat: 'pcm_16000',
        sampleRate: 24000,
        container: 'none',
        noSpeechMarkers: [],
        removeExclamationMarks: false,
        useSentenceSplitter: true
      }
      break;
    case 'cartesia':
      form.value.ttsSettings = {
        provider: 'cartesia',
        model: '',
        voiceId: '',
        language: 'en',
        audioFormat: 'pcm_24000',
        speed: 'normal',
        emotion: [],
        maxBufferDelayMs: 3000,
        useSentenceSplitter: false,
        noSpeechMarkers: [],
        removeExclamationMarks: false
      }
      break;
    case 'azure':
      form.value.ttsSettings = {
        provider: 'azure',
        model: 'neural',
        voiceId: '',
        audioFormat: 'pcm_24000',
        style: '',
        rate: '1.0',
        pitch: '0%',
        useSentenceSplitter: true,
        noSpeechMarkers: [],
        removeExclamationMarks: false
      }
      break;
    case 'amazon-polly':
      form.value.ttsSettings = {
        provider: 'amazon-polly',
        voiceId: '',
        noSpeechMarkers: [],
        removeExclamationMarks: false,
        useSentenceSplitter: false
      }
      break;
    default:
      form.value.ttsSettings = {} as TtsSettings
  }
}

// Watch for model changes to reset voice selection if it's not valid for new model
watch(() => (form.value.ttsSettings as any).model, (newModel, oldModel) => {
  // Only reset if actually changing models (not initial load)
  if (oldModel && newModel !== oldModel) {
    // Check if current voice is valid for the new model
    const currentVoice = currentVoiceValue.value
    if (currentVoice) {
      const isVoiceAvailable = availableVoices.value.some(v => v.id === currentVoice)
      if (!isVoiceAvailable) {
        // Current voice not available for this model, reset it
        const settings = form.value.ttsSettings as any
        settings.voiceId = ''
      }
    }
  }
})

// Lifecycle
onMounted(async () => {
  // Load providers for dropdown
  await providersStore.fetchAll()
  
  // Load complete provider catalog
  await providerCatalogStore.fetchCatalog()

  // Load TTS providers
  await providerCatalogStore.fetchTtsProviders()
  
  if (isEditMode.value) {
    await loadAgent()
  }
})

// Methods
async function loadAgent() {
  if (!agentId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentAgent.value = await agentsStore.fetchById(projectId.value, agentId.value)
    if (currentAgent.value) {
      form.value = {
        id: currentAgent.value.id,
        name: currentAgent.value.name,
        description: currentAgent.value.description || '',
        tags: currentAgent.value.tags || [],
        prompt: currentAgent.value.prompt,
        ttsProviderId: currentAgent.value.ttsProviderId || '',
        ttsSettings: currentAgent.value.ttsSettings || {} as TtsSettings,
        metadata: currentAgent.value.metadata || {},
        fillerLlmProviderId: currentAgent.value.fillerSettings?.llmProviderId || '',
        fillerLlmSettings: currentAgent.value.fillerSettings?.llmSettings || null,
        fillerPrompt: currentAgent.value.fillerSettings?.prompt || ''
      }
    }
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  const validationDetails: ApiErrorDetail[] = []

  if(!form.value.name.trim())
    validationDetails.push({ path: ['name'], message: 'Name is required', code: 'required' })

  if(!form.value.prompt.trim())
    validationDetails.push({ path: ['prompt'], message: 'Prompt is required', code: 'required' })

  if (form.value.ttsProviderId) {
    if (!(form.value.ttsSettings as any).model && !isAmazonPolly.value) {
      validationDetails.push({ path: ['ttsSettings', 'model'], message: 'Model is required when a TTS provider is selected.', code: 'required' })
    } else if (isAmazonPolly.value && !(form.value.ttsSettings as AmazonPollyTtsSettings).engine) {
      validationDetails.push({ path: ['ttsSettings', 'engine'], message: 'Engine is required for Amazon Polly when it is selected as the TTS provider.', code: 'required' })
    }
    if (!currentVoiceValue.value) {
      validationDetails.push({ path: ['ttsSettings', 'voiceId'], message: 'Voice is required when a TTS provider is selected.', code: 'required' })
    }
  }

  if (form.value.fillerLlmProviderId) {
    if (!form.value.fillerLlmSettings) {
      validationDetails.push({ path: ['fillerLlmSettings'], message: 'LLM settings are required when a provider is selected.', code: 'required' })
    }
    if (!form.value.fillerPrompt) {
      validationDetails.push({ path: ['fillerPrompt'], message: 'Filler prompt is required when a provider is selected.', code: 'required' })
    }
  }

  if (validationDetails.length > 0) {
    error.value = { message: 'Please correct the following errors', details: validationDetails }
    switchToFirstErrorTab(error.value)
    return
  }

  try {
    // Clean up ttsSettings - only send if provider is set and settings have data
    const ttsSettings = form.value.ttsProviderId && Object.keys(form.value.ttsSettings).length > 0
      ? form.value.ttsSettings
      : null

    const fillerSettings: FillerSettings | undefined =
      form.value.fillerLlmProviderId && form.value.fillerPrompt
        ? {
            llmProviderId: form.value.fillerLlmProviderId,
            ...(form.value.fillerLlmSettings ? { llmSettings: form.value.fillerLlmSettings } : {}),
            prompt: form.value.fillerPrompt
          }
        : undefined

    if (isEditMode.value && currentAgent.value) {
      // Update existing agent
      const updatedAgent = await agentsStore.update(projectId.value, currentAgent.value.id, {
        version: currentAgent.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        tags: form.value.tags,
        ttsProviderId: form.value.ttsProviderId || null,
        ttsSettings,
        metadata: form.value.metadata,
        ...(fillerSettings ? { fillerSettings } : {})
      })
      
      // Update currentAgent with the response to get the new version
      currentAgent.value = updatedAgent
    } else {
      // Create new agent
      const createData: any = {
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

      // Only include tags if not empty
      if (form.value.tags.length > 0) {
        createData.tags = form.value.tags
      }

      // Only include ttsProviderId if it's not empty
      if (form.value.ttsProviderId) {
        createData.ttsProviderId = form.value.ttsProviderId
      }

      // Only include ttsSettings if it has data
      if (ttsSettings) {
        createData.ttsSettings = ttsSettings
      }

      // Include filler settings if configured
      if (fillerSettings) {
        createData.fillerSettings = fillerSettings
      }

      const createdAgent = await agentsStore.create(projectId.value, createData)
      
      // Update currentAgent with the created agent (includes version and server-generated fields)
      currentAgent.value = createdAgent
      
      // Navigate to edit mode
      await router.push({
        name: 'design.agents.edit',
        params: { projectId: projectId.value, agentId: createdAgent.id }
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
  router.push({ name: 'design.agents', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentAgent.value) return []
  return [
    { label: 'Agent ID', value: currentAgent.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentAgent.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentAgent.value.version },
    { label: 'Created', value: currentAgent.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentAgent.value.updatedAt, format: 'date' as const },
  ]
})

function handleFillerLLMSettingsSave(settings: Record<string, any>) {
  form.value.fillerLlmSettings = settings as LlmSettings
  showFillerLLMSettingsModal.value = false
}

const { handleProviderChange: handleFillerLlmProviderChange } = useLlmProviderSelect(
  () => form.value.fillerLlmProviderId,
  (v) => { form.value.fillerLlmProviderId = v },
  () => form.value.fillerLlmSettings,
  (v) => { form.value.fillerLlmSettings = v }
)

</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2" title="Back to agents">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Agent' : 'Create Agent' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the agent configuration' : 'Define a new AI agent for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="!isReadOnly" @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Agent')) }}
        </button>
      </div>
    </div>
    
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This agent is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading agent...
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
        <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
        <!-- Error Message -->
        <ErrorDisplay :error="error" class="mx-8 mt-4"/>

        <!-- General Tab -->
        <TabContent v-model="activeTab" tab="basic">
          <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this agent">
            <input
              v-model="form.name"
              type="text"
              placeholder="My Agent"
              class="form-input"
              :disabled="isLoading"
            />
          </FormField>

          <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description of what this agent is used for">
            <textarea
              v-model="form.description"
              rows="3"
              class="form-textarea"
              placeholder="Brief description of this agent's purpose..."
              :disabled="isLoading"
            ></textarea>
          </FormField>

          <TagsEditor v-model="form.tags" :disabled="isLoading" />
        </TabContent>

        <!-- Prompt Tab -->
        <TabContent v-model="activeTab" tab="prompt">
          <FormField label="System Prompt" required :error="error" path="prompt" class="w-full" help="The system prompt that defines this agent's behavior, personality, and capabilities">
            <PromptEditor
              v-model="form.prompt"
              :disabled="isLoading || isReadOnly"
              show-toolbar
              placeholder="You are a helpful assistant..."
              aria-label="Agent system prompt"
              min-height="28rem"
            />
          </FormField>
        </TabContent>
        <TabContent v-model="activeTab" tab="voice">
          <!-- TTS Provider -->
          <FormField label="TTS Provider" :error="error" path="ttsProviderId" help="Select a text-to-speech provider for this agent">
            <select
              v-model="form.ttsProviderId"
              class="form-select-auto min-w-64"
              :disabled="isLoading"
              @change="handleTtsProviderChange"
            >
              <option value="">None</option>
              <option v-for="provider in ttsProviders" :key="provider.id" :value="provider.id">
                {{ provider.name }}
              </option>
            </select>
          </FormField>

          <!-- Model / Engine -->
          <FormField v-if="form.ttsProviderId && !isAmazonPolly" label="Model" required :error="error" :path="['ttsSettings', 'model']" help="Select a model for speech synthesis">
            <select
              v-if="availableModels.length > 0"
              v-model="modelValue"
              class="form-select-auto min-w-64"
              :disabled="isLoading"
              required
            >
              <option value="">Select a model</option>
              <option v-for="model in availableModels" :key="model.id" :value="model.id">
                {{ model.displayName }}{{ model.recommended ? ' (recommended)' : '' }}
              </option>
            </select>
            <input
              v-else
              v-model="modelValue"
              type="text"
              class="form-input-mono"
              placeholder="e.g., eleven_flash_v2_5, eleven_multilingual_v2"
              :disabled="isLoading"
              required
            />
          </FormField>

          <FormField v-if="form.ttsProviderId && isAmazonPolly" label="Engine" required :error="error" :path="['ttsSettings', 'engine']" help="Select an engine for Amazon Polly">
            <select
              v-if="availableModels.length > 0"
              v-model="modelValue"
              class="form-select-auto min-w-64"
              :disabled="isLoading"
              required
            >
              <option value="">Select a model</option>
              <option v-for="model in availableModels" :key="model.id" :value="model.id">
                {{ model.displayName }}{{ model.recommended ? ' (recommended)' : '' }}
              </option>
            </select>
            <input
              v-else
              v-model="modelValue"
              type="text"
              class="form-input-mono"
              placeholder="e.g., eleven_flash_v2_5, eleven_multilingual_v2"
              :disabled="isLoading"
              required
            />
          </FormField>

          <!-- Voice ID -->
          <FormField v-if="form.ttsProviderId" label="Voice ID" required :error="error" :path="['ttsSettings', 'voiceId']" help="Text-to-speech voice identifier">
            <select
              v-if="availableVoices.length > 0 && isModelSelected"
              v-model="form.ttsSettings.voiceId"
              class="form-select-auto min-w-64"
              :disabled="isLoading"
              required
            >
              <option value="">Select a voice</option>
              <option v-for="voice in availableVoices" :key="voice.id" :value="voice.id">
                {{ voice.displayName }}{{ voice.gender ? ` (${voice.gender})` : '' }}
              </option>
            </select>
            <input
              v-else-if="isModelSelected"
              v-model="form.ttsSettings.voiceId"
              type="text"
              class="form-input-mono"
              placeholder="voice-identifier"
              :disabled="isLoading"
              required
            />
            <input
              v-else
              type="text"
              class="form-input-disabled max-w-64"
              placeholder="Select model first"
              disabled
            />
          </FormField>
          <template v-if="isAmazonPolly && availableVoices.length > 0">
            <p class="form-help-text -mt-3">
              * This voice is bilingual. For more information, see
              <a href="https://docs.aws.amazon.com/polly/latest/dg/bilingual-voices.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Bilingual voices</a>.
            </p>
            <p class="form-help-text mt-1">
              ** These voices can be used with Newscaster speaking styles when used with the Neural format. For more information, see
              <a href="https://docs.aws.amazon.com/polly/latest/dg/ntts-newscaster-style.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Applying the newscaster voice</a>.
            </p>
          </template>

          <!-- Audio Format -->
          <FormField v-if="form.ttsProviderId" label="Audio Format" :error="error" path="ttsSettings" help="Preferred audio output format (supported formats depend on the selected TTS provider)">
            <select
              v-model="audioFormatValue"
              class="form-select-auto min-w-64"
              :disabled="isLoading"
            >
              <option value="">Default</option>
              <option v-for="format in availableAudioFormats" :key="format" :value="format">
                {{ format }}
              </option>
            </select>
          </FormField>

          <TtsProviderSettingsPanel
            v-if="form.ttsProviderId"
            v-model="form.ttsSettings"
            :api-type="selectedProviderApiType"
            :is-loading="isLoading"
          />

        </TabContent>
        <TabContent v-model="activeTab" tab="filler">
          <div class="flex items-start gap-3 p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <FlaskConical class="shrink-0 mt-0.5 w-4 h-4" />
            <p class="text-sm">
              <span class="font-semibold">Experimental feature</span> — Filler Responses are under active development. Behaviour may change in future releases.
            </p>
          </div>
          <CompositeFormField label="LLM Provider" required :error="error" help="The LLM provider used to generate the filler sentence. Leave empty to disable filler responses.">
            <div class="flex flex-col md:flex-row gap-2 items-center">
              <FormField path="fillerLlmProviderId">
                <select
                  :value="form.fillerLlmProviderId"
                  @change="handleFillerLlmProviderChange"
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">Disabled (no filler responses)</option>
                  <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
              </FormField>
              <FormField path="fillerLlmSettings">
                <button
                  type="button"
                  @click="showFillerLLMSettingsModal = true"
                  class="btn-secondary whitespace-nowrap"
                  :disabled="isLoading || !form.fillerLlmProviderId"
                >
                  <Settings class="inline-block mr-1 w-4 h-4" />
                  Settings...
                </button>
              </FormField>
              <LLMModelBadge :settings="form.fillerLlmSettings" />
            </div>
          </CompositeFormField>

          <FormField label="Filler Prompt" required :error="error" path="fillerPrompt" class="w-full" help="Prompt instructing the LLM to produce a short neutral filler sentence spoken through TTS while the agent processes the request">
            <PromptEditor
              v-model="form.fillerPrompt"
              :disabled="isLoading || !form.fillerLlmProviderId"
              show-toolbar
              placeholder='Generate a single short neutral sentence to fill silence while processing, like "Hmm, let me think about that."'
              aria-label="Filler response prompt"
              min-height="20rem"
            />
          </FormField>
        </TabContent>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentAgent"
          v-model="activeTab"
          tab="metadata"
          :fields="metadataFields"
        />
        <TabContent v-model="activeTab" tab="history">
          <!-- History Tab -->
          <EntityHistoryView
            v-if="isEditMode && currentAgent"
            :load-history="() => agentsStore.fetchAuditLogs(projectId, currentAgent!.id)"
            :current-version="currentAgent.version"
            :current-object="currentAgent"
            :active="activeTab === 'history'"
            :update-fn="(data) => agentsStore.update(projectId, currentAgent!.id, data)"
            :create-fn="(data) => agentsStore.create(projectId, data)"
            :ignore-fields="['createdAt', 'archived', 'updatedAt', 'version']"
            @recover-success="() => router.go(0)"
          />
        </TabContent>
        </fieldset>
        </form>
      </div>
    </div>
  </div>

  <!-- Filler LLM Settings Modal -->
  <LLMSettingsModal
    v-if="showFillerLLMSettingsModal"
    :settings="form.fillerLlmSettings"
    :selected-provider-id="form.fillerLlmProviderId"
    :providers="llmProviders"
    @close="showFillerLLMSettingsModal = false"
    @save="handleFillerLLMSettingsSave"
  />
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
