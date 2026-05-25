<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkConfigsStore, useBenchmarkProviderConfigsStore } from '@/stores'
import { ArrowLeft, Plus, CheckCircle, AlertCircle } from 'lucide-vue-next'
import type { ApiErrorDetail, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import BenchmarkInputEditor from '@/components/BenchmarkInputEditor.vue'

const route = useRoute()
const router = useRouter()
const configsStore = useBenchmarkConfigsStore()
const providerConfigsStore = useBenchmarkProviderConfigsStore()

const suiteId = computed(() => route.params.suiteId as string)
const fromTab = computed(() => route.query.fromTab as string | undefined)

type ProviderType = 'llm' | 'tts' | 'asr'
type InputType = 'messages' | 'text' | 'audio'

const providerTypeToInputType: Record<ProviderType, InputType> = {
  llm: 'messages',
  tts: 'text',
  asr: 'audio',
}

const providerTypeLabels: Record<ProviderType, string> = {
  llm: 'LLM',
  tts: 'TTS',
  asr: 'ASR',
}

const defaultInputData: Record<InputType, Record<string, any>> = {
  messages: { messages: [] },
  text: { text: '' },
  audio: { audioBase64: '', mimeType: '', fileName: '' },
}

const form = ref({
  namePrefix: '',
  description: '',
  providerType: 'llm' as ProviderType,
  selectedProviderConfigIds: [] as string[],
  inputData: { messages: [] } as Record<string, any>,
  repeats: 1,
})

const inputType = computed<InputType>(() => providerTypeToInputType[form.value.providerType])

const filteredProviderConfigs = computed(() =>
  providerConfigsStore.items.filter(p => p.providerType === form.value.providerType)
)

watch(() => form.value.providerType, () => {
  form.value.selectedProviderConfigIds = []
  form.value.inputData = { ...defaultInputData[inputType.value] }
})

const validationError = ref<ParsedError | null>(null)

type PhaseState = 'form' | 'progress' | 'done'
const phase = ref<PhaseState>('form')

interface ProgressItem {
  providerConfigId: string
  providerConfigName: string
  status: 'pending' | 'done' | 'error'
  errorMessage?: string
}

const progressItems = ref<ProgressItem[]>([])
const doneCount = computed(() => progressItems.value.filter(p => p.status === 'done').length)
const errorCount = computed(() => progressItems.value.filter(p => p.status === 'error').length)
const processedCount = computed(() => progressItems.value.filter(p => p.status !== 'pending').length)
const progressPercent = computed(() => {
  const total = progressItems.value.length
  if (total === 0) return 0
  return Math.round((processedCount.value / total) * 100)
})

function validate(): boolean {
  const details: ApiErrorDetail[] = []
  if (!form.value.namePrefix.trim()) {
    details.push({ path: ['namePrefix'], message: 'Name prefix is required', code: 'REQUIRED' })
  }
  if (form.value.selectedProviderConfigIds.length === 0) {
    details.push({ path: ['selectedProviderConfigIds'], message: 'Select at least one provider config', code: 'REQUIRED' })
  }
  if (form.value.inputData !== undefined) {
    if (inputType.value === 'messages') {
      const nonSystem = ((form.value.inputData.messages ?? []) as any[]).filter((m: any) => m.role !== 'system')
      if (nonSystem.length === 0 || nonSystem.every((m: any) => !m.content?.trim())) {
        details.push({ path: ['inputData'], message: 'At least one conversation message with content is required', code: 'REQUIRED' })
      }
    } else if (inputType.value === 'text') {
      if (!form.value.inputData.text?.trim()) {
        details.push({ path: ['inputData'], message: 'Input text is required', code: 'REQUIRED' })
      }
    } else if (inputType.value === 'audio') {
      if (!form.value.inputData.audioBase64) {
        details.push({ path: ['inputData'], message: 'An audio file is required', code: 'REQUIRED' })
      }
    }
  }
  if (details.length > 0) {
    validationError.value = { message: 'Please correct the following errors', details }
    return false
  }
  validationError.value = null
  return true
}

async function handleSubmit() {
  if (!validate()) return

  const selected = form.value.selectedProviderConfigIds.map(id => {
    const pc = providerConfigsStore.items.find(p => p.id === id)
    return { id, name: pc?.name ?? id }
  })

  progressItems.value = selected.map(s => ({
    providerConfigId: s.id,
    providerConfigName: s.name,
    status: 'pending' as const,
  }))

  phase.value = 'progress'

  for (let i = 0; i < progressItems.value.length; i++) {
    const item = progressItems.value[i]!
    const finalName = `${form.value.namePrefix.trim()} - ${item.providerConfigName}`
    try {
      await configsStore.create({
        suiteId: suiteId.value,
        name: finalName,
        description: form.value.description || undefined,
        providerConfigId: item.providerConfigId,
        inputType: inputType.value,
        inputData: form.value.inputData,
        repeats: form.value.repeats,
      })
      progressItems.value[i] = { providerConfigId: item.providerConfigId, providerConfigName: item.providerConfigName, status: 'done' }
    } catch (err: any) {
      const parsed = parseApiError(err)
      progressItems.value[i] = { providerConfigId: item.providerConfigId, providerConfigName: item.providerConfigName, status: 'error', errorMessage: parsed.message }
    }
  }

  phase.value = 'done'
}

function goBack() {
  router.push({
    name: 'administration.benchmarkSuites.edit',
    params: { suiteId: suiteId.value },
    query: fromTab.value ? { tab: fromTab.value } : {},
  })
}

onMounted(async () => {
  await providerConfigsStore.fetchAll()
})
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">

      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-4 md:py-3 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="page-title">Batch Create Configs</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">Create multiple benchmark configs at once, one per provider config</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            v-if="phase === 'form'"
            @click="handleSubmit"
            :disabled="form.selectedProviderConfigIds.length === 0"
            class="btn-primary"
          >
            <Plus class="inline-block mr-2 w-4 h-4" />
            Create {{ form.selectedProviderConfigIds.length > 0 ? form.selectedProviderConfigIds.length : '' }} Config{{ form.selectedProviderConfigIds.length !== 1 ? 's' : '' }}
          </button>
          <button
            v-if="phase === 'done'"
            @click="goBack"
            class="btn-primary"
          >
            OK
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
        <div class="mx-auto">

          <!-- FORM STATE -->
          <template v-if="phase === 'form'">
            <ErrorDisplay :error="validationError" class="mx-4 mt-3" />

            <form @submit.prevent="handleSubmit" class="p-4 flex flex-col gap-4">

              <FormField label="Name Prefix" required :error="validationError" path="namePrefix" class="w-full" help="Final name will be: [Prefix] - [Provider config name]">
                <input v-model="form.namePrefix" type="text" class="form-input" placeholder="e.g. Response Quality" />
              </FormField>

              <FormField label="Description" :error="validationError" path="description" class="w-full">
                <textarea v-model="form.description" class="form-textarea" rows="2" placeholder="What does this config batch test?" />
              </FormField>

              <FormField label="Provider Type" required :error="validationError" path="providerType" class="w-48">
                <select v-model="form.providerType" class="form-select">
                  <option value="llm">LLM</option>
                  <option value="tts">TTS</option>
                  <option value="asr">ASR</option>
                </select>
              </FormField>

              <FormField label="Provider Configs" required :error="validationError" path="selectedProviderConfigIds" class="w-full" help="A config will be created for each selected provider.">
                <div v-if="filteredProviderConfigs.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">
                  No {{ providerTypeLabels[form.providerType] }} provider configs available.
                </div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-w-3xl py-1">
                  <label
                    v-for="pc in filteredProviderConfigs"
                    :key="pc.id"
                    class="flex items-center gap-2.5 cursor-pointer select-none rounded-md border px-3 py-2 transition-colors"
                    :class="form.selectedProviderConfigIds.includes(pc.id)
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/25'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'"
                  >
                    <input
                      type="checkbox"
                      :value="pc.id"
                      v-model="form.selectedProviderConfigIds"
                      class="sr-only"
                    />
                    <span
                      class="w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors"
                      :class="form.selectedProviderConfigIds.includes(pc.id)
                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'"
                    >
                      <svg v-if="form.selectedProviderConfigIds.includes(pc.id)" class="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span class="text-sm text-gray-700 dark:text-gray-300 truncate" :title="pc.name">{{ pc.name }}</span>
                  </label>
                </div>
              </FormField>

              <FormField label="Input Data" required :error="validationError" path="inputData" class="w-full" help="Shared input data used for all created configs">
                <BenchmarkInputEditor v-model="form.inputData" :input-type="inputType" />
              </FormField>

              <FormField label="Repeats" required :error="validationError" path="repeats" class="w-32" help="Number of times to repeat each test case per run (1–100)">
                <input v-model.number="form.repeats" type="number" min="1" max="100" class="form-input" />
              </FormField>

            </form>
          </template>

          <!-- PROGRESS STATE -->
          <template v-if="phase === 'progress'">
            <div class="p-6 flex flex-col gap-6">
              <div>
                <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span>Creating configs...</span>
                  <span>{{ processedCount }} / {{ progressItems.length }}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    class="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    :style="{ width: progressPercent + '%' }"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <div
                  v-for="item in progressItems"
                  :key="item.providerConfigId"
                  class="flex items-center gap-3 text-sm"
                >
                  <span v-if="item.status === 'pending'" class="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                  <span v-else-if="item.status === 'done'" class="flex-shrink-0">
                    <CheckCircle class="w-4 h-4 text-green-500" />
                  </span>
                  <span v-else class="flex-shrink-0">
                    <AlertCircle class="w-4 h-4 text-red-500" />
                  </span>
                  <span :class="item.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'">
                    {{ item.providerConfigName }}
                    <span v-if="item.status === 'error'" class="ml-1 text-red-500 dark:text-red-400">— {{ item.errorMessage }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- DONE STATE -->
          <template v-if="phase === 'done'">
            <div class="p-6 flex flex-col gap-6">
              <div>
                <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span>{{ errorCount === 0 ? 'All done!' : `Completed with ${errorCount} error${errorCount !== 1 ? 's' : ''}` }}</span>
                  <span>{{ doneCount }} / {{ progressItems.length }} created</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    class="h-3 rounded-full"
                    :class="errorCount === 0 ? 'bg-green-500' : 'bg-yellow-500'"
                    style="width: 100%"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <div
                  v-for="item in progressItems"
                  :key="item.providerConfigId"
                  class="flex items-center gap-3 text-sm"
                >
                  <span v-if="item.status === 'done'" class="flex-shrink-0">
                    <CheckCircle class="w-4 h-4 text-green-500" />
                  </span>
                  <span v-else class="flex-shrink-0">
                    <AlertCircle class="w-4 h-4 text-red-500" />
                  </span>
                  <span :class="item.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'">
                    {{ item.providerConfigName }}
                    <span v-if="item.status === 'error'" class="ml-1 text-red-500 dark:text-red-400">— {{ item.errorMessage }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>
  </div>
</template>
