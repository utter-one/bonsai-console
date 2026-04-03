<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-vue-next'
import apiClient from '@/api/client'
import type { LlmModelInfo, ParsedError } from '@/api/types'

interface ProviderOption {
  id: string
  name: string
}

export interface CostLimitEntry {
  providerId: string
  modelName: string
  outputTokensLimits: {
    completion?: number
    classification?: number
    tool?: number
    transformation?: number
    filler?: number
  }
  inputTokensLimits: {
    completion?: number
    classification?: number
    tool?: number
    transformation?: number
    filler?: number
  }
}

const props = defineProps<{
  entry: CostLimitEntry | null
  llmProviders: ProviderOption[]
  existingEntries: CostLimitEntry[]
  editingIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', entry: CostLimitEntry): void
}>()

const requestTypes = [
  { key: 'completion' as const, label: 'Completion' },
  { key: 'classification' as const, label: 'Classification' },
  { key: 'tool' as const, label: 'Tool' },
  { key: 'transformation' as const, label: 'Transformation' },
  { key: 'filler' as const, label: 'Filler' },
]

function cloneEntry(e: CostLimitEntry): CostLimitEntry {
  return {
    providerId: e.providerId,
    modelName: e.modelName,
    outputTokensLimits: { ...e.outputTokensLimits },
    inputTokensLimits: { ...e.inputTokensLimits },
  }
}

const form = ref<CostLimitEntry>(
  props.entry ? cloneEntry(props.entry) : { providerId: '', modelName: '', outputTokensLimits: {}, inputTokensLimits: {} }
)

const modelsList = ref<LlmModelInfo[]>([])
const isLoadingModels = ref(false)

async function loadModels(providerId: string) {
  if (!providerId || providerId === '*') {
    modelsList.value = []
    return
  }
  isLoadingModels.value = true
  try {
    const response = await apiClient.providersModelsList(providerId)
    modelsList.value = [...response.models].sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (err) {
    console.error('Failed to load provider models:', err)
    modelsList.value = []
  } finally {
    isLoadingModels.value = false
  }
}

if (form.value.providerId) {
  loadModels(form.value.providerId)
}

function handleProviderChange() {
  if (form.value.providerId === '*') {
    form.value.modelName = '*'
    modelsList.value = []
  } else {
    form.value.modelName = ''
    loadModels(form.value.providerId)
  }
}

function handleSave() {
  emit('save', cloneEntry(form.value))
}

const isDuplicate = computed(() => {
  if (!form.value.providerId || !form.value.modelName) return false
  return props.existingEntries.some((e, i) => {
    if (i === props.editingIndex) return false
    return e.providerId === form.value.providerId && e.modelName === form.value.modelName
  })
})

const hasAtLeastOneLimit = computed(() => {
  const isSet = (limits: Record<string, any>) =>
    Object.values(limits).some(v => v != null && Number.isFinite(v) && (v as number) > 0)
  return isSet(form.value.inputTokensLimits) || isSet(form.value.outputTokensLimits)
})

const isValid = computed(() => !!form.value.providerId && !!form.value.modelName && !isDuplicate.value && hasAtLeastOneLimit.value)
const isEditMode = computed(() => !!props.entry)

const validationError = computed<ParsedError | null>(() => {
  if (!isDuplicate.value) return null
  return {
    message: 'A rule for this provider & model already exists.',
    details: [
      { path: ['providerId'], message: 'Combination already in use', code: 'DUPLICATE' },
      { path: ['modelName'], message: 'Combination already in use', code: 'DUPLICATE' },
    ]
  }
})
</script>

<template>
  <BaseModal :title="isEditMode ? 'Edit Token Limit Rule' : 'Add Token Limit Rule'" size="lg" @close="$emit('close')">
    <div class="space-y-6">
      <!-- Provider + Model -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Provider" required :error="validationError" path="providerId">
          <select v-model="form.providerId" class="form-select" @change="handleProviderChange">
            <option value="">— select —</option>
            <option value="*">* (Any provider)</option>
            <option v-for="p in llmProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </FormField>
        <FormField label="Model" required :error="validationError" path="modelName">
          <select
            v-model="form.modelName"
            class="form-select"
            :disabled="!form.providerId || isLoadingModels || form.providerId === '*'"
          >
            <option value="">{{ isLoadingModels ? 'Loading models…' : '— select —' }}</option>
            <option value="*">* (Any model)</option>
            <option v-for="m in modelsList" :key="m.id" :value="m.id">{{ m.displayName }}</option>
          </select>
        </FormField>
      </div>
      <ErrorDisplay :error="validationError" />

      <!-- Input + Output limits -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Input Limits -->
        <div>
          <h4 class="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            <ArrowDownToLine class="w-4 h-4 text-blue-500" />
            Input Token Limits
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Oldest messages are trimmed when context exceeds this per call type. Leave blank for no limit.
          </p>
          <div class="space-y-2">
            <div v-for="rtype in requestTypes" :key="rtype.key" class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0">{{ rtype.label }}</label>
              <input
                v-model.number="form.inputTokensLimits[rtype.key]"
                type="number"
                min="1"
                placeholder="No limit"
                class="form-input text-sm w-36"
              />
              <button
                v-if="form.inputTokensLimits[rtype.key] != null"
                type="button"
                @click="form.inputTokensLimits[rtype.key] = undefined"
                class="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
                title="Remove limit"
              >
                <X class="w-3.5 h-3.5" />
              </button>
              <span v-else class="w-6 shrink-0" />
            </div>
          </div>
        </div>

        <!-- Output Limits -->
        <div>
          <h4 class="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            <ArrowUpFromLine class="w-4 h-4 text-orange-500" />
            Output Token Limits
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Hard ceiling for generated tokens per call type. Leave blank for no limit.
          </p>
          <div class="space-y-2">
            <div v-for="rtype in requestTypes" :key="rtype.key" class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0">{{ rtype.label }}</label>
              <input
                v-model.number="form.outputTokensLimits[rtype.key]"
                type="number"
                min="1"
                placeholder="No limit"
                class="form-input text-sm w-36"
              />
              <button
                v-if="form.outputTokensLimits[rtype.key] != null"
                type="button"
                @click="form.outputTokensLimits[rtype.key] = undefined"
                class="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
                title="Remove limit"
              >
                <X class="w-3.5 h-3.5" />
              </button>
              <span v-else class="w-6 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p v-if="!isEditMode && form.providerId && form.modelName && !hasAtLeastOneLimit" class="text-xs text-amber-600 dark:text-amber-400">At least one token limit must be set.</p>
        <div v-else />
        <div class="flex gap-3">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="button" class="btn-primary" :disabled="!isValid" @click="handleSave">
            {{ isEditMode ? 'Save Changes' : 'Add Rule' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
