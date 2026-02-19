<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonasStore, useProvidersStore, useProviderCatalogStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Plus, X, Check } from 'lucide-vue-next'
import type { PersonaResponse, ElevenLabsTtsSettings, OpenAiTtsSettings, DeepgramTtsSettings, CartesiaTtsSettings, AzureTtsSettings } from '@/api/types'

type TtsSettings = ElevenLabsTtsSettings | OpenAiTtsSettings | DeepgramTtsSettings | CartesiaTtsSettings | AzureTtsSettings
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'

const route = useRoute()
const router = useRouter()
const personasStore = usePersonasStore()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'voice' | 'metadata'>('basic')
const form = ref<{
  id: string
  name: string
  description: string
  prompt: string
  ttsProviderId: string
  ttsSettings: TtsSettings
  metadata: Record<string, any>
}>({
  id: '',
  name: '',
  description: '',
  prompt: '',
  ttsProviderId: '',
  ttsSettings: {} as TtsSettings,
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const personaId = computed(() => route.params.personaId as string | undefined)
const isEditMode = computed(() => !!personaId.value)
const currentPersona = ref<PersonaResponse | null>(null)

const ttsProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'tts')
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
const isElevenLabs = computed(() => selectedProviderApiType.value === 'elevenlabs')
const isOpenAI = computed(() => selectedProviderApiType.value === 'openai')
const isDeepgram = computed(() => selectedProviderApiType.value === 'deepgram')
const isCartesia = computed(() => selectedProviderApiType.value === 'cartesia')
const isAzure = computed(() => selectedProviderApiType.value === 'azure')

const isModelSelected = computed(() => !!form.value.ttsSettings.model)

const availableModels = computed(() => 
  selectedProviderCatalogInfo.value?.models || []
)

const availableVoices = computed(() => {
  if (!selectedProviderCatalogInfo.value) return []
  
  // If a model is selected, check for model-specific voices first
  const modelId = (form.value.ttsSettings as any).model
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
  const modelId = (form.value.ttsSettings as any).model
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
const modelValue = computed({  get: () => (form.value.ttsSettings as any).model ?? '',
  set: (value) => {
    form.value.ttsSettings.model = value
  }
})

const audioFormatValue = computed({
  get: () => (form.value.ttsSettings as any).audioFormat ?? '',
  set: (value) => {
    const settings = form.value.ttsSettings as any
    settings.audioFormat = value || undefined
  }
})

// Computed property for Cartesia emotion tags (array <-> comma-separated string)
const emotionTagsInput = computed({
  get: () => {
    if (!isCartesia.value) return ''
    const emotion = (form.value.ttsSettings as CartesiaTtsSettings).emotion
    return emotion ? emotion.join(', ') : ''
  },
  set: (value: string) => {
    if (!isCartesia.value) return
    const settings = form.value.ttsSettings as CartesiaTtsSettings
    settings.emotion = value
      ? value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : []
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
        audioFormat: 'linear16',
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
    await loadPersona()
  }
})

// Methods
async function loadPersona() {
  if (!personaId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentPersona.value = await personasStore.fetchById(personaId.value)
    if (currentPersona.value) {
      form.value = {
        id: currentPersona.value.id,
        name: currentPersona.value.name,
        description: currentPersona.value.description || '',
        prompt: currentPersona.value.prompt,
        ttsProviderId: currentPersona.value.ttsProviderId || '',
        ttsSettings: currentPersona.value.ttsSettings || {} as TtsSettings,
        metadata: currentPersona.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load persona'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  // Validate required TTS fields when provider is selected
  if (form.value.ttsProviderId) {
    if (!form.value.ttsSettings.model) {
      error.value = 'Model is required when TTS provider is selected'
      isLoading.value = false
      activeTab.value = 'voice'
      return
    }
    const voiceValue = currentVoiceValue.value
    if (!voiceValue) {
      error.value = 'Voice is required when TTS provider is selected'
      isLoading.value = false
      activeTab.value = 'voice'
      return
    }
  }

  try {
    // Clean up ttsSettings - remove empty optional fields
    const ttsSettings = form.value.ttsProviderId && Object.keys(form.value.ttsSettings).length > 0
      ? form.value.ttsSettings
      : undefined

    if (isEditMode.value && currentPersona.value) {
      // Update existing persona
      const updatedPersona = await personasStore.update(currentPersona.value.id, {
        version: currentPersona.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        prompt: form.value.prompt,
        ...(form.value.ttsProviderId && { ttsProviderId: form.value.ttsProviderId }),
        ...(ttsSettings && { ttsSettings }),
        metadata: form.value.metadata
      })
      
      // Update currentPersona with the response to get the new version
      currentPersona.value = updatedPersona
    } else {
      // Create new persona
      const createData: any = {
        projectId: projectId.value,
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

      // Only include ttsProviderId if it's not empty
      if (form.value.ttsProviderId) {
        createData.ttsProviderId = form.value.ttsProviderId
      }

      // Only include ttsSettings if it has data
      if (ttsSettings) {
        createData.ttsSettings = ttsSettings
      }

      const createdPersona = await personasStore.create(createData)
      
      // Update currentPersona with the created persona (includes version and server-generated fields)
      currentPersona.value = createdPersona
      
      // Navigate to edit mode
      await router.push({
        name: 'design.personas.edit',
        params: { projectId: projectId.value, personaId: createdPersona.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} persona`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.personas', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentPersona.value) return []
  return [
    { label: 'Persona ID', value: currentPersona.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentPersona.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentPersona.value.version },
    { label: 'Created', value: currentPersona.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentPersona.value.updatedAt, format: 'date' as const },
  ]
})

function addNoSpeechMarker() {
  const settings = form.value.ttsSettings as any
  if (!settings.noSpeechMarkers) {
    settings.noSpeechMarkers = []
  }
  settings.noSpeechMarkers.push({ start: '', end: '' })
}

function removeNoSpeechMarker(index: number) {
  const settings = form.value.ttsSettings as any
  if (settings.noSpeechMarkers) {
    settings.noSpeechMarkers.splice(index, 1)
  }
}

</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2" title="Back to personas">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Persona' : 'Create Persona' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the persona configuration' : 'Define a new AI persona for this project' }}
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
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Persona')) }}
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
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt Configuration
        </button>
        <button
          @click="activeTab = 'voice'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'voice' }]"
          type="button"
        >
          Voice Configuration
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
      Loading persona...
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
              placeholder="My Persona"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A descriptive name for this persona</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Description <span class="text-gray-500">(optional)</span>
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-textarea"
              placeholder="Brief description of this persona's purpose..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              Optional description of what this persona is used for
            </p>
          </div>
        </div>

        <!-- Prompt Configuration Tab -->
        <div v-show="activeTab === 'prompt'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              System Prompt <span class="required">*</span>
            </label>
            <PromptEditor
              v-model="form.prompt"
              :disabled="isLoading"
              placeholder="You are a helpful assistant..."
              aria-label="Persona system prompt"
              min-height="28rem"
            />
            <p class="form-help-text">
              The system prompt that defines this persona's behavior, personality, and capabilities
            </p>
          </div>
        </div>

        <!-- Voice Configuration Tab -->
        <div v-show="activeTab === 'voice'" class="tab-content">
          <!-- TTS Provider -->
          <div class="form-group">
            <label class="form-label">
              TTS Provider <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="form.ttsProviderId"
              class="form-select"
              :disabled="isLoading"
              @change="handleTtsProviderChange"
            >
              <option value="">None</option>
              <option v-for="provider in ttsProviders" :key="provider.id" :value="provider.id">
                {{ provider.name }}
              </option>
            </select>
            <p class="form-help-text">
              Select a text-to-speech provider for this persona
            </p>
          </div>

          <!-- Model -->
          <div v-if="form.ttsProviderId" class="form-group">
            <label class="form-label">
              Model <span class="required">*</span>
            </label>
            <select
              v-if="availableModels.length > 0"
              v-model="modelValue"
              class="form-select"
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
            <p class="form-help-text">
              {{ availableModels.length > 0 
                ? 'Select a model for speech synthesis'
                : 'Model ID to use for speech synthesis' 
              }}
            </p>
          </div>

          <!-- Voice ID -->
          <div v-if="form.ttsProviderId" class="form-group">
            <label class="form-label">
              Voice ID <span class="required">*</span>
            </label>
            <select
              v-if="availableVoices.length > 0 && isModelSelected"
              v-model="form.ttsSettings.voiceId"
              class="form-select"
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
              class="form-input-disabled"
              placeholder="Select model first"
              disabled
            />
            <p class="form-help-text">
              {{ isModelSelected 
                ? (availableVoices.length > 0 
                  ? 'Select a voice for speech synthesis'
                  : 'Text-to-speech voice identifier')
                : 'Please select a model before choosing a voice'
              }}
            </p>
          </div>

          <!-- Audio Format -->
          <div v-if="form.ttsProviderId" class="form-group">
            <label class="form-label">
              Audio Format <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="audioFormatValue"
              class="form-select"
              :disabled="isLoading"
            >
              <option value="">Default</option>
              <option v-for="format in availableAudioFormats" :key="format" :value="format">
                {{ format }}
              </option>
            </select>
            <p class="form-help-text">
              Preferred audio output format for synthesized speech (supported formats depend on the selected TTS provider)
            </p>
          </div>

          <!-- Voice Settings Section (OpenAI) -->
          <div v-if="form.ttsProviderId && isOpenAI" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (OpenAI)</h3>

            <!-- Instructions -->
            <div class="form-group">
              <label class="form-label">
                Instructions <span class="text-gray-500">(optional, gpt-4o-mini-tts only)</span>
              </label>
              <textarea
                v-model="(form.ttsSettings as OpenAiTtsSettings).instructions"
                rows="3"
                class="form-textarea"
                placeholder="Controls accent, tone, emotion, speed, whispering, etc."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Voice control instructions for gpt-4o-mini-tts model. Only supported by gpt-4o-mini-tts.
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">
                Speed: {{ ((form.ttsSettings as any).speed ?? 1.0).toFixed(2) }}
              </label>
              <input
                v-model.number="(form.ttsSettings as any).speed"
                type="range"
                min="0.25"
                max="4.0"
                step="0.01"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speech speed (0.25-4.0), defaults to 1.0
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Deepgram) -->
          <div v-if="form.ttsProviderId && isDeepgram" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Deepgram)</h3>

            <!-- Sample Rate -->
            <div class="form-group">
              <label class="form-label">Sample Rate (Hz)</label>
              <select
                v-model.number="(form.ttsSettings as DeepgramTtsSettings).sampleRate"
                class="form-select"
                :disabled="isLoading"
              >
                <option :value="undefined">Default</option>
                <option :value="8000">8000 Hz</option>
                <option :value="16000">16000 Hz</option>
                <option :value="24000">24000 Hz (Recommended)</option>
                <option :value="48000">48000 Hz</option>
              </select>
              <p class="form-help-text">
                Audio sample rate in Hz. Higher values provide better quality but larger file sizes. Common values: 8000, 16000, 24000, 48000.
              </p>
            </div>

            <!-- Bit Rate -->
            <div class="form-group">
              <label class="form-label">
                Bit Rate <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model.number="(form.ttsSettings as DeepgramTtsSettings).bitRate"
                class="form-select"
                :disabled="isLoading"
              >
                <option :value="undefined">Default</option>
                <option :value="32000">32 kbps</option>
                <option :value="64000">64 kbps</option>
                <option :value="96000">96 kbps</option>
                <option :value="128000">128 kbps</option>
                <option :value="192000">192 kbps</option>
                <option :value="256000">256 kbps</option>
              </select>
              <p class="form-help-text">
                Bit rate for compressed formats (mp3, opus, aac). Higher values provide better quality.
              </p>
            </div>

            <!-- Container -->
            <div class="form-group">
              <label class="form-label">Container Format</label>
              <select
                v-model="(form.ttsSettings as DeepgramTtsSettings).container"
                class="form-select"
                :disabled="isLoading"
              >
                <option value="none">None (raw audio)</option>
                <option value="wav">WAV</option>
                <option value="ogg">Ogg</option>
              </select>
              <p class="form-help-text">
                Audio container format. Use "none" for raw audio, "wav" for WAV container, "ogg" for Ogg container
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Cartesia) -->
          <div v-if="form.ttsProviderId && isCartesia" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Cartesia)</h3>

            <!-- Language -->
            <div class="form-group">
              <label class="form-label">Language</label>
              <select
                v-model="(form.ttsSettings as CartesiaTtsSettings).language"
                class="form-select"
                :disabled="isLoading"
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="it">Italian (it)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="nl">Dutch (nl)</option>
                <option value="pl">Polish (pl)</option>
                <option value="ru">Russian (ru)</option>
                <option value="zh">Chinese (zh)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="ko">Korean (ko)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="tr">Turkish (tr)</option>
                <option value="sv">Swedish (sv)</option>
                <option value="da">Danish (da)</option>
                <option value="no">Norwegian (no)</option>
                <option value="fi">Finnish (fi)</option>
                <option value="cs">Czech (cs)</option>
              </select>
              <p class="form-help-text">
                Language code for speech synthesis (e.g., en, es, fr). Sonic-3 supports 42 languages.
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">Speed</label>
              <select
                v-model="(form.ttsSettings as CartesiaTtsSettings).speed"
                class="form-select"
                :disabled="isLoading"
              >
                <option value="slowest">Slowest</option>
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
                <option value="fastest">Fastest</option>
              </select>
              <p class="form-help-text">
                Speech speed control. Defaults to "normal".
              </p>
            </div>

            <!-- Emotion Tags -->
            <div class="form-group">
              <label class="form-label">
                Emotion Tags <span class="text-gray-500">(optional)</span>
              </label>
              <textarea
                v-model="emotionTagsInput"
                rows="2"
                class="form-textarea"
                placeholder="positivity:high, curiosity"
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Emotion tags for expressive speech (comma-separated, e.g., "positivity:high, curiosity"). See Cartesia emotion documentation.
              </p>
            </div>

            <!-- Max Buffer Delay -->
            <div class="form-group">
              <label class="form-label">
                Max Buffer Delay: {{ (form.ttsSettings as CartesiaTtsSettings).maxBufferDelayMs ?? 3000 }}ms
              </label>
              <input
                v-model.number="(form.ttsSettings as CartesiaTtsSettings).maxBufferDelayMs"
                type="range"
                min="0"
                max="5000"
                step="100"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Maximum time in milliseconds to buffer text chunks before sending to TTS (0-5000ms). Defaults to 3000ms. Set to 0 to disable buffering.
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (ElevenLabs) -->
          <div v-if="form.ttsProviderId && isElevenLabs" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (ElevenLabs)</h3>

            <!-- Stability -->
            <div class="form-group">
              <label class="form-label">
                Stability: {{ ((form.ttsSettings as ElevenLabsTtsSettings).stability ?? 0.5).toFixed(2) }}
              </label>
              <input
                v-model.number="(form.ttsSettings as ElevenLabsTtsSettings).stability"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Voice stability (0.0-1.0), defaults to 0.5
              </p>
            </div>

            <!-- Similarity Boost -->
            <div class="form-group">
              <label class="form-label">
                Similarity Boost: {{ ((form.ttsSettings as ElevenLabsTtsSettings).similarityBoost ?? 0.75).toFixed(2) }}
              </label>
              <input
                v-model.number="(form.ttsSettings as ElevenLabsTtsSettings).similarityBoost"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Similarity boost (0.0-1.0), defaults to 0.75
              </p>
            </div>

            <!-- Style -->
            <div class="form-group">
              <label class="form-label">
                Style: {{ ((form.ttsSettings as ElevenLabsTtsSettings).style ?? 0).toFixed(2) }}
              </label>
              <input
                v-model.number="(form.ttsSettings as ElevenLabsTtsSettings).style"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Style setting for V2+ models (0.0-1.0), defaults to 0
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">
                Speed: {{ ((form.ttsSettings as any).speed ?? 1.0).toFixed(2) }}
              </label>
              <input
                v-model.number="(form.ttsSettings as any).speed"
                type="range"
                min="0.7"
                max="1.2"
                step="0.01"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speech speed (0.7-1.2), defaults to 1.0
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Azure) -->
          <div v-if="form.ttsProviderId && isAzure" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Azure Speech)</h3>

            <!-- Style -->
            <div class="form-group">
              <label class="form-label">
                Style
              </label>
              <input
                v-model="(form.ttsSettings as AzureTtsSettings).style"
                type="text"
                placeholder="cheerful, sad, angry, friendly, etc."
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speaking style for voices that support it (e.g., "cheerful", "sad", "angry", "friendly"). Optional.
              </p>
            </div>

            <!-- Rate -->
            <div class="form-group">
              <label class="form-label">
                Rate
              </label>
              <input
                v-model="(form.ttsSettings as AzureTtsSettings).rate"
                type="text"
                placeholder="1.0 or +10% or -5%"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speaking rate adjustment. Can be decimal (0.5 to 2.0) or percentage ("+10%", "-5%"). Defaults to 1.0 (normal speed).
              </p>
            </div>

            <!-- Pitch -->
            <div class="form-group">
              <label class="form-label">
                Pitch
              </label>
              <input
                v-model="(form.ttsSettings as AzureTtsSettings).pitch"
                type="text"
                placeholder="0% or +5% or -10%"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Pitch adjustment. Can be percentage ("+5%", "-10%") or descriptive ("high", "low"). Range typically -50% to +50%.
              </p>
            </div>

            <!-- Inactivity Timeout (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="form-label">
                Inactivity Timeout (seconds)
              </label>
              <input
                v-model.number="(form.ttsSettings as ElevenLabsTtsSettings).inactivityTimeout"
                type="number"
                min="1"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                WebSocket inactivity timeout in seconds (defaults to 180)
              </p>
            </div>
          </div>

          <!-- Boolean Settings Section -->
          <div v-if="form.ttsProviderId" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Settings</h3>

            <!-- Use Speaker Boost (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(form.ttsSettings as ElevenLabsTtsSettings).useSpeakerBoost"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Speaker Boost
                </span>
              </label>
              <p class="form-help-text mt-1">
                Enable speaker boost for V2+ models (defaults to true)
              </p>
            </div>

            <!-- Remove Exclamation Marks -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(form.ttsSettings as any).removeExclamationMarks"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Remove Exclamation Marks
                </span>
              </label>
              <p class="form-help-text mt-1">
                Replace exclamation marks with periods (can reduce overly excited speech)
              </p>
            </div>

            <!-- Use Global Preview (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(form.ttsSettings as ElevenLabsTtsSettings).useGlobalPreview"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Use Global Preview
                </span>
              </label>
              <p class="form-help-text mt-1">
                Use global preview endpoint for geographic proximity optimization (can reduce latency)
              </p>
            </div>

            <!-- Use Sentence Splitter -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(form.ttsSettings as any).useSentenceSplitter"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Use Sentence Splitter
                </span>
              </label>
              <p v-if="isCartesia" class="form-help-text mt-1">
                Whether to use sentence splitter for text processing. Defaults to false (uses streaming with continuations instead).
              </p>
              <p v-else class="form-help-text mt-1">
                Send only full sentences to TTS (can introduce small latency)
              </p>
            </div>
          </div>

          <!-- No Speech Markers Section -->
          <div v-if="form.ttsProviderId" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No Speech Markers</h3>
              <button
                @click="addNoSpeechMarker"
                type="button"
                class="btn-secondary text-sm"
                :disabled="isLoading"
              >
                <Plus class="inline-block mr-1 w-4 h-4" />
                Add Marker
              </button>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Define start and end markers to identify text sections that should not be spoken
            </p>

            <div v-if="!((form.ttsSettings as any).noSpeechMarkers?.length)" class="text-center py-6 text-gray-500 text-sm">
              No speech markers defined
            </div>

            <div
              v-for="(marker, index) in ((form.ttsSettings as any).noSpeechMarkers || [])"
              :key="index"
              class="flex gap-3 mb-3 items-start"
            >
              <div class="flex-1">
                <input
                  v-model="marker.start"
                  type="text"
                  placeholder="Start marker"
                  class="form-input"
                  :disabled="isLoading"
                />
              </div>
              <div class="flex-1">
                <input
                  v-model="marker.end"
                  type="text"
                  placeholder="End marker"
                  class="form-input"
                  :disabled="isLoading"
                />
              </div>
              <button
                @click="removeNoSpeechMarker(Number(index))"
                type="button"
                class="btn-icon text-red-600 hover:bg-red-50 mt-1"
                title="Remove marker"
                :disabled="isLoading"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentPersona"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
