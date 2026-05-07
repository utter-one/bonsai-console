<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkProviderConfigsStore, useProvidersStore, useProviderCatalogStore } from '@/stores'
import { ArrowLeft, Save, Check, Settings, Plus } from 'lucide-vue-next'
import type { BenchmarkProviderConfigResponse, LlmSettings, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import AsrSettingsModal from '@/components/modals/AsrSettingsModal.vue'
import BaseModal from '@/components/BaseModal.vue'
import TtsProviderSettingsPanel from '@/components/TtsProviderSettingsPanel.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const store = useBenchmarkProviderConfigsStore()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'general' | 'metadata'>('general')
const showSettingsModal = ref(false)

const providerConfigId = computed(() => route.params.providerConfigId as string | undefined)
const isEditMode = computed(() => !!providerConfigId.value)
const currentConfig = ref<BenchmarkProviderConfigResponse | null>(null)

const PROVIDER_TYPES = ['llm', 'tts', 'asr'] as const
type ProviderType = typeof PROVIDER_TYPES[number]

const form = ref({
  name: '',
  providerType: 'llm' as ProviderType,
  providerId: '',
  settings: {} as Record<string, any>,
  providerSettings: {} as Record<string, any>,
})

const selectedProvider = computed(() =>
  providersStore.items.find(p => p.id === form.value.providerId) ?? null
)

const llmProviders = computed(() => providersStore.items.filter(p => p.providerType === 'llm'))

const ttsIsAmazonPolly = computed(() => selectedProvider.value?.apiType === 'amazon-polly')

const selectedTtsCatalogInfo = computed(() => {
  if (!selectedProvider.value || form.value.providerType !== 'tts') return null
  const info = providerCatalogStore.getProviderByApiType('tts', selectedProvider.value.apiType)
  if (info && 'models' in info && 'voices' in info) return info
  return null
})

const ttsAvailableModels = computed(() => selectedTtsCatalogInfo.value?.models || [])

const ttsAvailableVoices = computed(() => {
  if (!selectedTtsCatalogInfo.value) return []
  const modelId = (form.value.providerSettings as any).model ??
    (ttsIsAmazonPolly.value ? (form.value.providerSettings as any).engine : undefined)
  if (modelId) {
    const m = selectedTtsCatalogInfo.value.models.find(m => m.id === modelId)
    if (m?.voices?.length) return m.voices
  }
  return selectedTtsCatalogInfo.value.voices || []
})

const ttsAvailableAudioFormats = computed(() => {
  if (!selectedTtsCatalogInfo.value) return []
  const modelId = (form.value.providerSettings as any).model ??
    (ttsIsAmazonPolly.value ? (form.value.providerSettings as any).engine : undefined)
  if (modelId) {
    const m = selectedTtsCatalogInfo.value.models.find(m => m.id === modelId)
    return m?.supportedAudioFormats || []
  }
  const all = new Set<string>()
  selectedTtsCatalogInfo.value.models.forEach(m => m.supportedAudioFormats?.forEach(f => all.add(f)))
  return Array.from(all)
})

const ttsModelValue = computed({
  get: () => {
    const s = form.value.providerSettings as any
    return ttsIsAmazonPolly.value ? (s.model ?? s.engine ?? '') : (s.model ?? '')
  },
  set: (value) => {
    const s = form.value.providerSettings as any
    s.model = value
    if (ttsIsAmazonPolly.value) s.engine = value
  },
})

const ttsAudioFormatValue = computed({
  get: () => (form.value.providerSettings as any).audioFormat ?? '',
  set: (value) => { (form.value.providerSettings as any).audioFormat = value || undefined },
})

const ttsVoiceId = computed({
  get: () => (form.value.providerSettings as any).voiceId ?? '',
  set: (value) => { (form.value.providerSettings as any).voiceId = value },
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'general', label: 'General' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
])

const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const filteredProviders = computed(() =>
  providersStore.items.filter(p => p.providerType === form.value.providerType)
)

function initTtsProviderSettings(apiType: string): Record<string, any> {
  switch (apiType) {
    case 'elevenlabs':
      return { provider: 'elevenlabs', model: '', voiceId: '', noSpeechMarkers: [], removeExclamationMarks: false, stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true, speed: 1.0, useGlobalPreview: false, inactivityTimeout: 180, useSentenceSplitter: true }
    case 'openai':
      return { provider: 'openai', model: '', voiceId: '', speed: 1.0, instructions: '', noSpeechMarkers: [], removeExclamationMarks: false, useSentenceSplitter: true }
    case 'deepgram':
      return { provider: 'deepgram', model: undefined, voiceId: '', audioFormat: 'pcm_16000', sampleRate: 24000, container: 'none', noSpeechMarkers: [], removeExclamationMarks: false, useSentenceSplitter: true }
    case 'cartesia':
      return { provider: 'cartesia', model: '', voiceId: '', language: 'en', audioFormat: 'pcm_24000', speed: 'normal', emotion: [], maxBufferDelayMs: 3000, useSentenceSplitter: false, noSpeechMarkers: [], removeExclamationMarks: false }
    case 'azure':
      return { provider: 'azure', model: 'neural', voiceId: '', audioFormat: 'pcm_24000', style: '', rate: '1.0', pitch: '0%', useSentenceSplitter: true, noSpeechMarkers: [], removeExclamationMarks: false }
    case 'amazon-polly':
      return { provider: 'amazon-polly', voiceId: '', noSpeechMarkers: [], removeExclamationMarks: false, useSentenceSplitter: false }
    default:
      return {}
  }
}

watch(() => form.value.providerType, () => {
  if (!isEditMode.value) {
    form.value.providerId = ''
    form.value.settings = {}
    form.value.providerSettings = {}
  }
})

watch(() => form.value.providerId, () => {
  if (!isEditMode.value) {
    form.value.settings = {}
    form.value.providerSettings = form.value.providerType === 'tts' && selectedProvider.value
      ? initTtsProviderSettings(selectedProvider.value.apiType)
      : {}
  }
})

watch(() => (form.value.providerSettings as any).model, (newModel, oldModel) => {
  if (oldModel && newModel !== oldModel) {
    const voiceId = (form.value.providerSettings as any).voiceId
    if (voiceId && !ttsAvailableVoices.value.some(v => v.id === voiceId)) {
      (form.value.providerSettings as any).voiceId = ''
    }
  }
})

const metadataFields = computed(() => {
  if (!currentConfig.value) return []
  return [
    { label: 'Config ID', value: currentConfig.value.id, format: 'mono' as const },
    { label: 'Version', value: String(currentConfig.value.version) },
    { label: 'Created', value: currentConfig.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentConfig.value.updatedAt, format: 'date' as const },
  ]
})

function populateForm(config: BenchmarkProviderConfigResponse) {
  form.value = {
    name: config.name,
    providerType: config.providerType as ProviderType,
    providerId: config.providerId,
    settings: { ...config.settings },
    providerSettings: { ...config.providerSettings },
  }
}

onMounted(async () => {
  await providersStore.fetchAll()
  await providerCatalogStore.fetchCatalog()
  await providerCatalogStore.fetchTtsProviders()
  if (isEditMode.value) {
    const cached = store.currentItem?.id === providerConfigId.value
      ? store.currentItem
      : (store.items.find(c => c.id === providerConfigId.value) ?? null)
    if (cached) {
      currentConfig.value = cached
      populateForm(cached)
    }
    await loadConfig(!cached)
  }
})

watch(providerConfigId, async (newId) => {
  if (newId && !currentConfig.value) {
    await loadConfig()
  }
})

async function loadConfig(showLoading = true) {
  if (!providerConfigId.value) return
  if (showLoading) isLoading.value = true
  error.value = null
  try {
    currentConfig.value = await store.fetchById(providerConfigId.value)
    if (showLoading && currentConfig.value) {
      populateForm(currentConfig.value)
    }
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    if (showLoading) isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true
  try {
    if (isEditMode.value && currentConfig.value) {
      const updated = await store.update(currentConfig.value.id, {
        name: form.value.name,
        providerId: form.value.providerId,
        settings: form.value.settings,
        providerSettings: form.value.providerSettings,
        version: currentConfig.value.version,
      })
      currentConfig.value = updated
      showSuccess.value = true
      setTimeout(() => (showSuccess.value = false), 2000)
    } else {
      const created = await store.create({
        name: form.value.name,
        providerType: form.value.providerType,
        providerId: form.value.providerId,
        settings: form.value.settings,
        providerSettings: Object.keys(form.value.providerSettings).length > 0 ? form.value.providerSettings : undefined,
      })
      router.push({ name: 'administration.benchmarkProviderConfigs.edit', params: { providerConfigId: created.id } })
    }
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

function handleLlmSettingsSave(settings: Record<string, any>) {
  form.value.settings = settings
  showSettingsModal.value = false
}

function handleAsrSettingsSave(config: { settings: Record<string, any>; voiceActivityDetection: boolean }) {
  form.value.settings = config.settings
  showSettingsModal.value = false
}
</script>

<template>
  <div class="flex-1 min-w-0">
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-4 md:py-3 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="router.push({ name: 'administration.benchmarkProviderConfigs' })" class="btn-icon mb-2 md:mb-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditMode ? 'Edit Provider Config' : 'New Provider Config' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ isEditMode ? 'Edit benchmark provider config' : 'Create a new benchmark provider config' }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button @click="handleSubmit" :disabled="isLoading || showSuccess" class="btn-primary">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Plus v-else-if="!isEditMode" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Config')) }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <ErrorDisplay :error="error" class="mx-4 mt-3" />

          <TabContent v-model="activeTab" tab="general">
            <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this provider config">
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g. GPT-4o Production" :disabled="isLoading" />
            </FormField>

            <FormField label="Provider Type" required :error="error" path="providerType" class="w-48" hint="Cannot be changed after creation">
              <select v-model="form.providerType" class="form-select" :disabled="isEditMode || isLoading">
                <option value="llm">LLM</option>
                <option value="tts">TTS</option>
                <option value="asr">ASR</option>
              </select>
            </FormField>

            <CompositeFormField label="Provider" required :error="error" help="The configured provider to use for benchmarks">
              <div class="flex flex-col md:flex-row gap-2 items-center">
                <FormField path="providerId">
                  <select v-model="form.providerId" class="form-select-auto min-w-64" :disabled="isLoading">
                    <option value="">Select a provider...</option>
                    <option v-for="p in filteredProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </FormField>
                <FormField path="settings">
                  <button
                    type="button"
                    @click="showSettingsModal = true"
                    class="btn-secondary whitespace-nowrap"
                    :disabled="!form.providerId || isLoading"
                  >
                    <Settings class="inline-block mr-1 w-4 h-4" />
                    Settings...
                  </button>
                </FormField>
                <LLMModelBadge v-if="form.providerType === 'llm'" :settings="form.settings as any" />
              </div>
            </CompositeFormField>
          </TabContent>
        </form>

        <MetadataTab
          v-if="isEditMode && currentConfig"
          v-model="activeTab"
          tab="metadata"
          :fields="metadataFields"
        />
      </div>
    </div>
  </div>
  </div>

  <!-- LLM Settings Modal -->
  <LLMSettingsModal
    v-if="showSettingsModal && form.providerType === 'llm'"
    :settings="form.settings as LlmSettings | null"
    :selected-provider-id="form.providerId"
    :providers="llmProviders"
    @close="showSettingsModal = false"
    @save="handleLlmSettingsSave"
  />

  <!-- ASR Settings Modal -->
  <AsrSettingsModal
    v-if="showSettingsModal && form.providerType === 'asr'"
    :selected-provider="selectedProvider"
    :asr-config="{ settings: form.settings as any, voiceActivityDetection: false }"
    @close="showSettingsModal = false"
    @save="handleAsrSettingsSave"
  />

  <!-- TTS Settings Modal -->
  <BaseModal
    v-if="showSettingsModal && form.providerType === 'tts'"
    title="TTS Settings"
    @close="showSettingsModal = false"
  >
    <div v-if="selectedProvider" class="p-6 space-y-0">
      <FormField v-if="!ttsIsAmazonPolly" label="Model" required :error="null" class="w-full" help="Select a model for speech synthesis">
        <select v-model="ttsModelValue" class="form-select" :disabled="isLoading">
          <option value="">Select a model...</option>
          <option v-for="m in ttsAvailableModels" :key="m.id" :value="m.id">{{ m.displayName }}</option>
        </select>
      </FormField>

      <FormField v-if="ttsIsAmazonPolly" label="Engine" required :error="null" class="w-full" help="Select an engine for Amazon Polly">
        <select v-model="ttsModelValue" class="form-select" :disabled="isLoading">
          <option value="">Select an engine...</option>
          <option value="standard">Standard</option>
          <option value="neural">Neural</option>
          <option value="long-form">Long-Form</option>
          <option value="generative">Generative</option>
        </select>
      </FormField>

      <FormField label="Voice" required :error="null" class="w-full" help="Select a voice">
        <select v-model="ttsVoiceId" class="form-select" :disabled="isLoading">
          <option value="">Select a voice...</option>
          <option v-for="v in ttsAvailableVoices" :key="v.id" :value="v.id">{{ v.displayName }}</option>
        </select>
      </FormField>

      <FormField v-if="ttsAvailableAudioFormats.length" label="Audio Format" :error="null" class="w-full" help="Output audio format">
        <select v-model="ttsAudioFormatValue" class="form-select" :disabled="isLoading">
          <option value="">Default</option>
          <option v-for="f in ttsAvailableAudioFormats" :key="f" :value="f">{{ f }}</option>
        </select>
      </FormField>

      <TtsProviderSettingsPanel
        v-model="form.providerSettings as any"
        :api-type="selectedProvider.apiType"
        :is-loading="isLoading"
      />
    </div>
    <div v-else class="alert-error p-6">Please select a TTS provider first.</div>
    <div class="modal-footer">
      <button type="button" @click="showSettingsModal = false" class="btn-secondary">Cancel</button>
      <button type="button" @click="showSettingsModal = false" class="btn-primary">Save Settings</button>
    </div>
  </BaseModal>
</template>
