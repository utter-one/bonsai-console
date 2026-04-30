<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkConfigsStore, useBenchmarkProviderConfigsStore } from '@/stores'
import { ArrowLeft, Save, Check, Plus } from 'lucide-vue-next'
import type { BenchmarkConfigResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import BenchmarkInputEditor from '@/components/BenchmarkInputEditor.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const configsStore = useBenchmarkConfigsStore()
const providerConfigsStore = useBenchmarkProviderConfigsStore()

const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'general' | 'metadata'>('general')

const suiteId = computed(() => route.params.suiteId as string)
const configId = computed(() => route.params.configId as string | undefined)
const isEditMode = computed(() => !!configId.value)
const currentConfig = ref<BenchmarkConfigResponse | null>(null)
const fromTab = computed(() => route.query.fromTab as string | undefined)

const INPUT_TYPES = ['messages', 'text', 'audio'] as const
type InputType = typeof INPUT_TYPES[number]

const defaultInputData: Record<InputType, Record<string, any>> = {
  messages: { messages: [] },
  text: { text: '' },
  audio: { audioBase64: '', mimeType: '' },
}

const providerTypeToInputType: Record<string, InputType> = {
  llm: 'messages',
  tts: 'text',
  asr: 'audio',
}

const providerTypeLabels: Record<string, string> = {
  llm: 'LLM',
  tts: 'TTS',
  asr: 'ASR',
}

const form = ref({
  name: '',
  description: '',
  providerConfigId: '',
  inputType: 'messages' as InputType,
  inputData: { messages: [] } as Record<string, any>,
  repeats: 1,
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'general', label: 'General' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
])

const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const metadataFields = computed(() => {
  if (!currentConfig.value) return []
  return [
    { label: 'Config ID', value: currentConfig.value.id, format: 'mono' as const },
    { label: 'Version', value: String(currentConfig.value.version) },
    { label: 'Created', value: currentConfig.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentConfig.value.updatedAt, format: 'date' as const },
  ]
})

watch(() => form.value.providerConfigId, (newId) => {
  const pc = providerConfigsStore.items.find(p => p.id === newId)
  if (pc) {
    const inferredType = providerTypeToInputType[pc.providerType] ?? 'messages'
    if (inferredType !== form.value.inputType) {
      form.value.inputType = inferredType
      form.value.inputData = { ...defaultInputData[inferredType] }
    }
  }
})

function populateForm(config: BenchmarkConfigResponse) {
  form.value = {
    name: config.name,
    description: config.description ?? '',
    providerConfigId: config.providerConfigId,
    inputType: config.inputType as InputType,
    inputData: { ...(config.inputData as Record<string, any>) },
    repeats: config.repeats,
  }
}

onMounted(async () => {
  await providerConfigsStore.fetchAll()
  if (isEditMode.value) {
    const cached = configsStore.currentItem?.id === configId.value
      ? configsStore.currentItem
      : (configsStore.items.find(c => c.id === configId.value) ?? null)
    if (cached) {
      currentConfig.value = cached
      populateForm(cached)
    }
    await loadConfig(!cached)
  }
})

async function loadConfig(showLoading = true) {
  if (!configId.value) return
  if (showLoading) isLoading.value = true
  error.value = null
  try {
    currentConfig.value = await configsStore.fetchById(configId.value)
    if (currentConfig.value) {
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
      const updated = await configsStore.update(currentConfig.value.id, {
        version: currentConfig.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        providerConfigId: form.value.providerConfigId,
        inputData: form.value.inputData,
        repeats: form.value.repeats,
      })
      currentConfig.value = updated
      showSuccess.value = true
      setTimeout(() => (showSuccess.value = false), 2000)
    } else {
      const created = await configsStore.create({
        suiteId: suiteId.value,
        name: form.value.name,
        description: form.value.description || undefined,
        providerConfigId: form.value.providerConfigId,
        inputType: form.value.inputType,
        inputData: form.value.inputData,
        repeats: form.value.repeats,
      })
      router.push({ name: 'administration.benchmarkSuites.configs.edit', params: { suiteId: suiteId.value, configId: created.id } })
    }
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="router.push({ name: 'administration.benchmarkSuites.edit', params: { suiteId }, query: fromTab ? { tab: fromTab } : {} })" class="btn-icon mb-2 md:mb-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Config' : 'New Benchmark Config' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ isEditMode ? 'Edit benchmark test case' : 'Create a new benchmark test case' }}</p>
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
          <ErrorDisplay :error="error" class="mx-8 mt-4" />

          <TabContent v-model="activeTab" tab="general">
            <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this test case">
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g. Basic conversation test" :disabled="isLoading" />
            </FormField>

            <FormField label="Description" :error="error" path="description" class="w-full">
              <textarea v-model="form.description" class="form-textarea" rows="2" placeholder="What does this config test?" :disabled="isLoading" />
            </FormField>

            <FormField label="Provider Config" required :error="error" path="providerConfigId" class="w-full">
              <select v-model="form.providerConfigId" class="form-select" :disabled="isLoading">
                <option value="">Select a provider config...</option>
                <option v-for="pc in providerConfigsStore.items" :key="pc.id" :value="pc.id">
                  [{{ providerTypeLabels[pc.providerType] ?? pc.providerType }}] {{ pc.name }}
                </option>
              </select>
            </FormField>

            <FormField label="Input Data" required :error="error" path="inputData" class="w-full">
              <BenchmarkInputEditor v-model="form.inputData" :input-type="form.inputType" :disabled="isLoading" />
            </FormField>

            <FormField label="Repeats" required :error="error" path="repeats" class="w-32" help="Number of times to repeat this test case per run (1–100)">
              <input v-model.number="form.repeats" type="number" min="1" max="100" class="form-input" :disabled="isLoading" />
            </FormField>
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
  </AdministrationSectionLayout>
</template>
