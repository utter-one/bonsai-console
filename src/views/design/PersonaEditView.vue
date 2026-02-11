<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonasStore, useProvidersStore, useProviderCatalogStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Plus, X } from 'lucide-vue-next'
import type { PersonaResponse, VoiceConfig } from '@/api/types'

type NoSpeechMarker = NonNullable<VoiceConfig['noSpeechMarkers']>[number]
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
const activeTab = ref<'basic' | 'prompt' | 'voice' | 'metadata'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  ttsProviderId: '',
  voiceConfig: {
    model: '',
    voiceId: '',
    audioFormat: '' as '' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100',
    noSpeechMarkers: [] as NoSpeechMarker[],
    removeExclamationMarks: false,
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true,
    speed: 1.0,
    useGlobalPreview: false,
    inactivityTimeout: 180,
    useSentenceSplitter: true
  },
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

const availableModels = computed(() => 
  selectedProviderCatalogInfo.value?.models || []
)

const availableVoices = computed(() => 
  selectedProviderCatalogInfo.value?.voices || []
)

// Watch for provider changes to fetch catalog data
watch(() => form.value.ttsProviderId, async (newProviderId) => {
  if (newProviderId && selectedProvider.value) {
    // Fetch TTS provider catalog if not already loaded
    if (!providerCatalogStore.catalog) {
      await providerCatalogStore.fetchTtsProviders()
    }
  }
})

// Lifecycle
onMounted(async () => {
  // Load providers for dropdown
  await providersStore.fetchAll()
  
  // Load complete provider catalog
  await providerCatalogStore.fetchCatalog()
  
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
        voiceConfig: {
          model: currentPersona.value.voiceConfig?.model || '',
          voiceId: currentPersona.value.voiceConfig?.voiceId || '',
          audioFormat: (currentPersona.value.voiceConfig?.audioFormat || '') as '' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100',
          noSpeechMarkers: currentPersona.value.voiceConfig?.noSpeechMarkers || [],
          removeExclamationMarks: currentPersona.value.voiceConfig?.removeExclamationMarks || false,
          stability: currentPersona.value.voiceConfig?.stability ?? 0.5,
          similarityBoost: currentPersona.value.voiceConfig?.similarityBoost ?? 0.75,
          style: currentPersona.value.voiceConfig?.style ?? 0,
          useSpeakerBoost: currentPersona.value.voiceConfig?.useSpeakerBoost ?? true,
          speed: currentPersona.value.voiceConfig?.speed ?? 1.0,
          useGlobalPreview: currentPersona.value.voiceConfig?.useGlobalPreview || false,
          inactivityTimeout: currentPersona.value.voiceConfig?.inactivityTimeout ?? 180,
          useSentenceSplitter: currentPersona.value.voiceConfig?.useSentenceSplitter ?? true
        },
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

  try {
    // Build voice config only if some fields are filled
    const hasVoiceConfig = form.value.ttsProviderId || 
                          form.value.voiceConfig.model || 
                          form.value.voiceConfig.voiceId ||
                          form.value.voiceConfig.noSpeechMarkers.length > 0

    const voiceConfig: VoiceConfig | undefined = hasVoiceConfig ? {
      ...(form.value.voiceConfig.model && { model: form.value.voiceConfig.model }),
      ...(form.value.voiceConfig.voiceId && { voiceId: form.value.voiceConfig.voiceId }),
      ...(form.value.voiceConfig.audioFormat && { audioFormat: form.value.voiceConfig.audioFormat }),
      ...(form.value.voiceConfig.noSpeechMarkers.length > 0 && { noSpeechMarkers: form.value.voiceConfig.noSpeechMarkers }),
      removeExclamationMarks: form.value.voiceConfig.removeExclamationMarks,
      stability: form.value.voiceConfig.stability,
      similarityBoost: form.value.voiceConfig.similarityBoost,
      style: form.value.voiceConfig.style,
      useSpeakerBoost: form.value.voiceConfig.useSpeakerBoost,
      speed: form.value.voiceConfig.speed,
      useGlobalPreview: form.value.voiceConfig.useGlobalPreview,
      inactivityTimeout: form.value.voiceConfig.inactivityTimeout,
      useSentenceSplitter: form.value.voiceConfig.useSentenceSplitter
    } : undefined

    if (isEditMode.value && currentPersona.value) {
      // Update existing persona
      await personasStore.update(currentPersona.value.id, {
        version: currentPersona.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        prompt: form.value.prompt,
        ...(form.value.ttsProviderId && { ttsProviderId: form.value.ttsProviderId }),
        ...(voiceConfig && { voiceConfig }),
        metadata: form.value.metadata
      })
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

      // Only include voiceConfig if it has data
      if (voiceConfig) {
        createData.voiceConfig = voiceConfig
      }

      await personasStore.create(createData)
    }

    // Navigate back to personas list
    router.push({ name: 'design.personas', params: { projectId: projectId.value } })
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
  form.value.voiceConfig.noSpeechMarkers.push({ start: '', end: '' })
}

function removeNoSpeechMarker(index: number) {
  form.value.voiceConfig.noSpeechMarkers.splice(index, 1)
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
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Persona') }}
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

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Personas
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
              v-model="form.voiceConfig.model"
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
              v-model="form.voiceConfig.model"
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
              v-if="availableVoices.length > 0"
              v-model="form.voiceConfig.voiceId"
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
              v-else
              v-model="form.voiceConfig.voiceId"
              type="text"
              class="form-input-mono"
              placeholder="voice-identifier"
              :disabled="isLoading"
              required
            />
            <p class="form-help-text">
              {{ availableVoices.length > 0 
                ? 'Select a voice for speech synthesis'
                : 'Text-to-speech voice identifier' 
              }}
            </p>
          </div>

          <!-- Audio Format -->
          <div v-if="form.ttsProviderId" class="form-group">
            <label class="form-label">
              Audio Format <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="form.voiceConfig.audioFormat"
              class="form-select"
              :disabled="isLoading"
            >
              <option value="">Default</option>
              <option value="pcm_16000">PCM 16kHz</option>
              <option value="pcm_22050">PCM 22.05kHz</option>
              <option value="pcm_44100">PCM 44.1kHz</option>
            </select>
            <p class="form-help-text">
              Preferred audio output format for synthesized speech
            </p>
          </div>

          <!-- Voice Settings Section -->
          <div v-if="form.ttsProviderId" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings</h3>

            <!-- Stability -->
            <div class="form-group">
              <label class="form-label">
                Stability: {{ form.voiceConfig.stability?.toFixed(2) }}
              </label>
              <input
                v-model.number="form.voiceConfig.stability"
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
                Similarity Boost: {{ form.voiceConfig.similarityBoost?.toFixed(2) }}
              </label>
              <input
                v-model.number="form.voiceConfig.similarityBoost"
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
                Style: {{ form.voiceConfig.style?.toFixed(2) }}
              </label>
              <input
                v-model.number="form.voiceConfig.style"
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
                Speed: {{ form.voiceConfig.speed?.toFixed(2) }}
              </label>
              <input
                v-model.number="form.voiceConfig.speed"
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

          <!-- Boolean Settings Section -->
          <div v-if="form.ttsProviderId" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Settings</h3>

            <!-- Use Speaker Boost -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.voiceConfig.useSpeakerBoost"
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
                  v-model="form.voiceConfig.removeExclamationMarks"
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

            <!-- Use Global Preview -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.voiceConfig.useGlobalPreview"
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
                  v-model="form.voiceConfig.useSentenceSplitter"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Use Sentence Splitter
                </span>
              </label>
              <p class="form-help-text mt-1">
                Send only full sentences to TTS (can introduce small latency)
              </p>
            </div>

            <!-- Inactivity Timeout -->
            <div class="form-group">
              <label class="form-label">
                Inactivity Timeout (seconds)
              </label>
              <input
                v-model.number="form.voiceConfig.inactivityTimeout"
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

            <div v-if="form.voiceConfig.noSpeechMarkers.length === 0" class="text-center py-6 text-gray-500 text-sm">
              No speech markers defined
            </div>

            <div
              v-for="(marker, index) in form.voiceConfig.noSpeechMarkers"
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
                @click="removeNoSpeechMarker(index)"
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
