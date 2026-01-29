<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonasStore } from '@/stores'
import { ArrowLeft, Save, Plus, X } from 'lucide-vue-next'
import type { PersonaResponse, NoSpeechMarker, VoiceConfig } from '@/types/api'

const route = useRoute()
const router = useRouter()
const personasStore = usePersonasStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'prompt' | 'voice' | 'metadata'>('basic')
const form = ref({
  id: '',
  name: '',
  prompt: '',
  ttsProviderId: '',
  voiceConfig: {
    model: '',
    voiceId: '',
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
const projectId = computed(() => route.params.projectId as string)
const personaId = computed(() => route.params.personaId as string | undefined)
const isEditMode = computed(() => !!personaId.value)
const currentPersona = ref<PersonaResponse | null>(null)

// Lifecycle
onMounted(async () => {
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
        prompt: currentPersona.value.prompt,
        ttsProviderId: currentPersona.value.ttsProviderId || '',
        voiceConfig: {
          model: currentPersona.value.voiceConfig?.model || '',
          voiceId: currentPersona.value.voiceConfig?.voiceId || '',
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

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function addNoSpeechMarker() {
  form.value.voiceConfig.noSpeechMarkers.push({ start: '', end: '' })
}

function removeNoSpeechMarker(index: number) {
  form.value.voiceConfig.noSpeechMarkers.splice(index, 1)
}

</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to personas">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ isEditMode ? 'Edit Persona' : 'Create Persona' }}</h1>
          <p class="text-sm text-gray-600">
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
    <div v-else class="flex-1 overflow-y-auto bg-gray-50">
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
              ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.id"
              type="text"
              placeholder="custom-persona-id"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The persona ID cannot be changed after creation' 
                : 'Leave empty to auto-generate. Use lowercase letters, numbers, and hyphens only.' 
              }}
            </p>
          </div>
        </div>

        <!-- Prompt Configuration Tab -->
        <div v-show="activeTab === 'prompt'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              System Prompt <span class="required">*</span>
            </label>
            <textarea
              v-model="form.prompt"
              required
              rows="20"
              class="form-textarea"
              placeholder="You are a helpful assistant..."
              :disabled="isLoading"
            ></textarea>
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
              TTS Provider ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.ttsProviderId"
              type="text"
              class="form-input-mono"
              placeholder="e.g., eleven-labs"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              TTS provider identifier (e.g., "eleven-labs")
            </p>
          </div>

          <!-- Model -->
          <div class="form-group">
            <label class="form-label">
              Model <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.voiceConfig.model"
              type="text"
              class="form-input-mono"
              placeholder="e.g., eleven_flash_v2_5, eleven_multilingual_v2"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              Model ID to use for speech synthesis
            </p>
          </div>

          <!-- Voice ID -->
          <div class="form-group">
            <label class="form-label">
              Voice ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.voiceConfig.voiceId"
              type="text"
              class="form-input-mono"
              placeholder="voice-identifier"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              Text-to-speech voice identifier
            </p>
          </div>

          <!-- Voice Settings Section -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Voice Settings</h3>

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
          <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>

            <!-- Use Speaker Boost -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.voiceConfig.useSpeakerBoost"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700">
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
                <span class="ml-2 text-sm font-medium text-gray-700">
                  Remove Exclamation Marks
                </span>
              </label>
              <p class="form-help-text mt-1">
                Replace exclamation marks with periods
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
                <span class="ml-2 text-sm font-medium text-gray-700">
                  Use Global Preview
                </span>
              </label>
              <p class="form-help-text mt-1">
                Use global preview endpoint for geographic proximity optimization
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
                <span class="ml-2 text-sm font-medium text-gray-700">
                  Use Sentence Splitter
                </span>
              </label>
              <p class="form-help-text mt-1">
                Enable sentence splitter for text processing (defaults to true)
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
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">No Speech Markers</h3>
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
        <div v-if="isEditMode && currentPersona" v-show="activeTab === 'metadata'" class="tab-content">
          <div class="metadata-container">
            <div class="metadata-item">
              <span class="metadata-label">Version</span>
              <span class="metadata-value">{{ currentPersona.version }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Created</span>
              <span class="metadata-value">{{ formatDate(currentPersona.createdAt) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Updated</span>
              <span class="metadata-value">{{ formatDate(currentPersona.updatedAt) }}</span>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
