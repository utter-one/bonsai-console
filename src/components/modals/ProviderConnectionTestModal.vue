<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import apiClient from '@/api/client'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import { useProviderCatalogStore } from '@/stores'
import type {
  ProviderResponse,
  ConnectionTestResult,
  LlmProviderInfo,
  VoiceInfo,
} from '@/api/types'
import { CheckCircle2, XCircle, Loader2, PlugZap, RefreshCw } from 'lucide-vue-next'
import { formatMs } from '@/utils/monitoring'

/** Draft (unsaved) configuration to test. `config` is the already-built provider config payload. */
export interface ConnectionTestDraft {
  providerType: 'asr' | 'tts' | 'llm' | 'embeddings' | 'storage' | 'channel'
  apiType: string
  config: Record<string, any>
}

const props = defineProps<{
  /** Saved provider to test (uses the stored configuration). */
  provider?: ProviderResponse
  /** Draft configuration to test instead of a saved provider. */
  draft?: ConnectionTestDraft
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isDraftMode = computed(() => !!props.draft && !props.provider)
const providerType = computed(() => props.provider?.providerType ?? props.draft?.providerType ?? '')
const apiType = computed(() => props.provider?.apiType ?? props.draft?.apiType ?? '')
const title = computed(() =>
  isDraftMode.value ? 'Test Connection (Draft)' : 'Test Connection'
)

const isLlm = computed(() => providerType.value === 'llm' || providerType.value === 'embeddings')
const isTts = computed(() => providerType.value === 'tts')
const isStorage = computed(() => providerType.value === 'storage')
/** Bucket only makes sense for S3/Azure Blob/GCS, not the local filesystem. */
const showBucket = computed(() => isStorage.value && apiType.value !== 'local')

// --- Catalog-backed options (models for LLM, voices for TTS) ---
const catalogStore = useProviderCatalogStore()
if (!catalogStore.catalog) {
  catalogStore.fetchCatalog().catch(() => {
    // non-fatal — selects degrade to custom input / default
  })
}

const llmInfo = computed<LlmProviderInfo | null>(() => {
  if (!isLlm.value) return null
  const info = catalogStore.getProviderByApiType('llm', apiType.value)
  return info && 'models' in info ? info : null
})

const ttsInfo = computed<{ voices?: VoiceInfo[] } | null>(() => {
  if (!isTts.value) return null
  const info = catalogStore.getProviderByApiType('tts', apiType.value)
  return info && 'voices' in info ? info : null
})

const modelOptions = computed(() => llmInfo.value?.models ?? [])
const voiceOptions = computed(() => ttsInfo.value?.voices ?? [])

// --- Test parameters ---
const CUSTOM = '__custom__'
const model = ref('')
const customModel = ref('')
const voice = ref('')
const write = ref(true)
const bucket = ref('')

// In draft LLM mode a model is required — preselect the first catalog model once it loads.
if (isDraftMode.value && isLlm.value) {
  watch(modelOptions, (opts) => {
    if (opts.length && !opts.some(m => m.id === model.value)) model.value = opts[0]!.id
  }, { immediate: true })
}

const modelValue = computed({
  get: () => model.value,
  set: (v: string) => {
    model.value = v
    if (v !== CUSTOM) customModel.value = ''
  },
})
const usingCustomModel = computed(() => model.value === CUSTOM)
const showModelSelect = computed(() => modelOptions.value.length > 0)

const effectiveModel = computed(() => {
  if (!showModelSelect.value || usingCustomModel.value) return customModel.value.trim()
  return model.value.trim()
})

const modelError = computed(() =>
  isLlm.value && isDraftMode.value && !effectiveModel.value ? 'Model is required to test an unsaved LLM configuration' : null
)

// --- Test state ---
const isTesting = ref(false)
const guardError = ref<string | null>(null)
const cooldownSeconds = ref<number | null>(null)
const result = ref<ConnectionTestResult | null>(null)

function resetResult() {
  result.value = null
  guardError.value = null
  cooldownSeconds.value = null
}

async function runTest() {
  if (modelError.value) return
  resetResult()
  isTesting.value = true

  const extra: Record<string, unknown> = {}
  if (isLlm.value && effectiveModel.value) extra.model = effectiveModel.value
  if (isTts.value && voice.value) extra.voice = voice.value
  if (isStorage.value) {
    extra.write = write.value
    if (showBucket.value && bucket.value.trim()) extra.bucket = bucket.value.trim()
  }

  try {
    if (isDraftMode.value && props.draft) {
      const res = await apiClient.providersTestConnectionCreate({
        providerType: props.draft.providerType,
        apiType: props.draft.apiType,
        config: props.draft.config,
        ...extra,
      })
      result.value = res
    } else if (props.provider) {
      const res = await apiClient.providersTestConnectionCreate({
        providerId: props.provider.id,
        ...extra,
      })
      result.value = res
    }
  } catch (err: any) {
    // Guard errors (400/404/429) — vendor failures come back as a 200 structured result.
    const status = err.response?.status
    if (status === 429) {
      const retryAfter = err.response?.headers?.['retry-after']
      cooldownSeconds.value = retryAfter ? parseInt(retryAfter, 10) || 5 : 5
      guardError.value = `Provider is on cooldown after a recent test (about ${cooldownSeconds.value}s). Wait a moment and try again.`
    } else {
      guardError.value = err.response?.data?.message || 'Connection test could not be started. Please check the configuration.'
    }
  } finally {
    isTesting.value = false
  }
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const detailEntries = computed(() =>
  Object.entries(result.value?.detail ?? {})
)

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal :title="title" size="md" @close="handleClose">
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Runs an on-demand connection test against
      <span class="font-medium text-gray-700 dark:text-gray-300">
        {{ isDraftMode ? 'this unsaved configuration' : provider?.name }}
      </span>
      ({{ apiType }}), exercising the provider's own protocol at minimum size.
      Vendor failures are reported as a structured result — your credentials are never echoed back.
    </p>

    <!-- Parameters + test button -->
    <div v-if="!result" class="space-y-4">
      <FormField
        v-if="isLlm && showModelSelect"
        label="Model"
        :required="isDraftMode"
        :error="modelError ? { message: modelError, details: [{ path: ['model'], message: modelError, code: 'REQUIRED' }] } : null"
        path="model"
        class="w-full"
        :help="isDraftMode
          ? 'The model to test. Required for an unsaved configuration.'
          : 'Defaults to the first model from the provider catalog when left empty.'"
      >
        <select v-model="modelValue" class="form-select" :disabled="isTesting">
          <option v-if="!isDraftMode" value="">Default (first catalog model)</option>
          <option v-for="m in modelOptions" :key="m.id" :value="m.id">{{ m.displayName || m.id }}</option>
          <option :value="CUSTOM">Custom model…</option>
        </select>
      </FormField>
      <FormField
        v-else-if="isLlm"
        label="Model"
        :required="isDraftMode"
        :error="modelError ? { message: modelError, details: [{ path: ['model'], message: modelError, code: 'REQUIRED' }] } : null"
        path="model"
        class="w-full"
        help="No models in the provider catalog for this API type — enter the exact model identifier"
      >
        <input
          v-model="customModel"
          type="text"
          class="form-input-mono"
          placeholder="gpt-4o-mini"
          :disabled="isTesting"
        />
      </FormField>
      <FormField
        v-if="usingCustomModel"
        label="Custom model"
        required
        path="customModel"
        class="w-full"
        help="Enter the exact model identifier"
      >
        <input
          v-model="customModel"
          type="text"
          class="form-input-mono"
          placeholder="gpt-4o-mini"
          :disabled="isTesting"
        />
      </FormField>

      <FormField
        v-if="isTts"
        label="Voice"
        :error="null"
        path="voice"
        class="w-full"
        help="Optional — defaults to the provider's default voice when left empty"
      >
        <select v-model="voice" class="form-select" :disabled="isTesting || voiceOptions.length === 0">
          <option value="">Default voice</option>
          <option v-for="v in voiceOptions" :key="v.id" :value="v.id">{{ v.displayName || v.id }}</option>
        </select>
      </FormField>

      <template v-if="isStorage">
        <FormField label="Bucket" :error="null" path="bucket" class="w-full" v-if="showBucket" help="Storage bucket/container to verify (s3 / azure-blob / gcs)">
          <input
            v-model="bucket"
            type="text"
            class="form-input-mono"
            placeholder="my-bucket"
            :disabled="isTesting"
          />
        </FormField>
        <FormField label="Full write test" :error="null" path="write" class="w-full" help="Run a full upload/download/delete round trip on a throwaway key (uncheck to only verify credentials)">
          <label class="checkbox-label flex items-center gap-2">
            <input v-model="write" type="checkbox" class="form-checkbox" :disabled="isTesting" />
            <span>Verify write access</span>
          </label>
        </FormField>
      </template>

      <div v-if="guardError" class="alert-error flex items-start gap-2">
        <XCircle class="w-4 h-4 mt-0.5 shrink-0" />
        <div class="text-sm">
          {{ guardError }}
          <div v-if="cooldownSeconds" class="mt-1">
            <button type="button" class="btn-secondary btn-sm mt-1" :disabled="isTesting" @click="runTest">
              <Loader2 v-if="isTesting" class="inline-block mr-1.5 w-4 h-4 animate-spin" />
              <RefreshCw v-else class="inline-block mr-1.5 w-4 h-4" />
              Retry now
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-else class="space-y-4">
      <div :class="result.ok ? 'alert-success' : 'alert-error'" class="flex items-start gap-3">
        <CheckCircle2 v-if="result.ok" class="w-5 h-5 mt-0.5 shrink-0" />
        <XCircle v-else class="w-5 h-5 mt-0.5 shrink-0" />
        <div class="min-w-0">
          <p class="font-medium">{{ result.ok ? 'Connection established' : 'Connection failed' }}</p>
          <p class="text-sm mt-1">
            {{ result.apiType }} · {{ result.protocol }} · phase: {{ result.phase }} · {{ formatMs(result.latencyMs) }}
          </p>
          <template v-if="!result.ok">
            <p v-if="result.errorCode" class="text-sm mt-1">
              Error code: <code class="font-mono text-xs">{{ result.errorCode }}</code>
            </p>
            <p v-if="result.errorText" class="text-sm mt-1 break-words">{{ result.errorText }}</p>
          </template>
        </div>
      </div>

      <div v-if="detailEntries.length" class="section-card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Details</p>
        <div class="space-y-1">
          <div v-for="[key, value] in detailEntries" :key="key" class="flex justify-between gap-4 text-sm">
            <span class="text-gray-600 dark:text-gray-400 shrink-0">{{ key }}</span>
            <span class="font-mono text-xs break-all text-right">{{ formatDetailValue(value) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-500 dark:text-gray-400">
        Tested via <span class="font-mono text-xs">{{ result.protocol }}</span> protocol; the test reached the
        <span class="font-medium">{{ result.phase }}</span> phase.
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <button v-if="result" type="button" class="btn-secondary" :disabled="isTesting" @click="resetResult()">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Test again
        </button>
        <div class="flex-1" />
        <button type="button" class="btn-secondary" @click="handleClose">Close</button>
        <button
          v-if="!result"
          type="button"
          class="btn-primary"
          :disabled="isTesting || !!modelError"
          @click="runTest"
        >
          <Loader2 v-if="isTesting" class="inline-block mr-1.5 w-4 h-4 animate-spin" />
          <PlugZap v-else class="inline-block mr-1.5 w-4 h-4" />
          {{ isTesting ? 'Testing…' : 'Test Connection' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
