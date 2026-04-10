<template>
  <BaseModal title="LLM Settings" size="lg" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select an LLM provider first
        </div>

        <template v-else>
          <!-- Model Name (Required for all providers) -->
          <FormField label="Model" required :error="validationError" path="model" class="w-full">

            <!-- Custom model toggle -->
            <div class="mb-3">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="useCustomModel"
                  type="checkbox"
                  class="form-checkbox mr-2"
                  @change="onCustomModelToggle"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Use custom model name</span>
              </label>
            </div>

            <!-- Model dropdown (catalog) -->
            <select
              v-if="!useCustomModel"
              v-model="form.model"
              required
              class="form-select"
              :disabled="isLoadingModels"
            >
              <option value="">{{ isLoadingModels ? 'Loading models...' : 'Select a model' }}</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.displayName }}{{ model.recommended ? ' (Recommended)' : '' }}
              </option>
            </select>

            <!-- Custom model input -->
            <input
              v-else
              v-model="form.model"
              type="text"
              required
              class="form-input"
              placeholder="e.g., custom-model-name"
            />

            <p v-if="!useCustomModel && form.model && availableModels.find(m => m.id === form.model)?.description" class="form-help-text">
              {{ availableModels.find(m => m.id === form.model)?.description }}
            </p>
            <p v-else-if="!useCustomModel" class="form-help-text">
              Select the model to use for this stage
            </p>
            <p v-else class="form-help-text">
              Enter the exact model name as expected by the provider
            </p>
            
            <!-- Model Capabilities (only show for catalog models) -->
            <div v-if="!useCustomModel && selectedModelInfo" class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="selectedModelInfo.supportsImageGeneration"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                title="Supports image generation output"
              >
                <Image class="w-3.5 h-3.5" />
                Image Generation
              </span>
              <span
                v-if="selectedModelInfo.supportsVision"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                title="Supports vision/image input"
              >
                <Eye class="w-3.5 h-3.5" />
                Vision
              </span>
              <span
                v-if="selectedModelInfo.supportsToolCalling"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                title="Supports tool calling (function calling)"
              >
                <Wrench class="w-3.5 h-3.5" />
                Tool Calling
              </span>
              <span
                v-if="selectedModelInfo.supportsJsonOutput"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                title="Supports structured JSON output"
              >
                <FileJson class="w-3.5 h-3.5" />
                JSON Output
              </span>
              <span
                v-if="selectedModelInfo.supportsStreaming"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                title="Supports streaming responses"
              >
                <Zap class="w-3.5 h-3.5" />
                Streaming
              </span>
              <span
                v-if="selectedModelInfo.supportsReasoning"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                title="Supports reasoning/thinking modes for deeper analysis"
              >
                <Brain class="w-3.5 h-3.5" />
                Reasoning
              </span>
              <span
                v-if="selectedModelInfo.contextWindow"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                title="Context window size"
              >
                {{ selectedModelInfo.contextWindow.toLocaleString() }} tokens
              </span>
            </div>
          </FormField>

          <!-- Max Tokens -->
          <FormField label="Max Tokens" class="w-full">
            <input
              v-model.number="form.defaultMaxTokens"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g., 2000"
            />
            <p class="form-help-text">
              Maximum output tokens{{ hasReasoningCapability ? ' (includes reasoning/thinking tokens)' : '' }}
            </p>
          </FormField>

          <!-- OpenAI Reasoning Settings -->
          <template v-if="isOpenAI">
            <FormField label="Reasoning Effort" class="w-full">
              <select v-model="form.reasoningEffort" class="form-select">
                <option :value="null">None (use temperature/topP)</option>
                <option value="minimal">Minimal</option>
                <option value="low">Low - Fast, economical</option>
                <option value="medium">Medium - Balanced (default)</option>
                <option value="high">High - Complex problems</option>
                <option value="xhigh">Extra High - Extreme reasoning</option>
              </select>
              <p class="form-help-text">
                Controls internal reasoning depth. When set, temperature and topP are disabled.
              </p>
            </FormField>

            <FormField v-if="form.reasoningEffort" label="Reasoning Summary" class="w-full">
              <select v-model="form.reasoningSummary" class="form-select">
                <option :value="null">Disabled</option>
                <option value="auto">Auto - Adapts to model</option>
                <option value="concise">Concise - Brief summary</option>
                <option value="detailed">Detailed - Comprehensive breakdown</option>
              </select>
              <p class="form-help-text">
                Generate a summary of the model's reasoning process for debugging
              </p>
            </FormField>
          </template>

          <!-- Anthropic Thinking Settings -->
          <template v-if="isAnthropic">
            <FormField label="Thinking Mode" class="w-full">
              <select v-model="form.thinkingMode" class="form-select">
                <option :value="null">Disabled</option>
                <option value="enabled">Enabled - Manual token budget</option>
                <option value="adaptive">Adaptive - Auto-adjusts (Claude Opus 4.6+)</option>
              </select>
              <p class="form-help-text">
                Enable Claude's extended thinking capability for internal reasoning
              </p>
            </FormField>

            <FormField v-if="form.thinkingMode === 'enabled'" label="Thinking Budget Tokens" :error="validationError" path="thinkingBudgetTokens" class="w-full">
              <input
                v-model.number="form.thinkingBudgetTokens"
                type="number"
                min="1024"
                class="form-input"
                placeholder="e.g., 10000"
              />
              <p class="form-help-text">
                Maximum tokens for internal reasoning (min: 1024). Recommended: 4096-16384 for most tasks.
              </p>
            </FormField>
          </template>

          <!-- Gemini Thinking Settings -->
          <template v-if="isGemini">
            <FormField label="Thinking Level" hint="Gemini 3 models" class="w-full">
              <select v-model="form.thinkingLevel" class="form-select">
                <option :value="null">Not set</option>
                <option value="minimal">Minimal - Best for chat/high-throughput</option>
                <option value="low">Low - Basic reasoning</option>
                <option value="medium">Medium - Balanced</option>
                <option value="high">High - Maximum reasoning (default for Gemini 3)</option>
              </select>
              <p class="form-help-text">
                Controls reasoning depth using predefined levels (for gemini-3-pro, gemini-3-flash)
              </p>
            </FormField>

            <FormField label="Thinking Budget" hint="Gemini 2.5 models" class="w-full">
              <input
                v-model.number="form.thinkingBudget"
                type="number"
                min="-1"
                class="form-input"
                placeholder="e.g., -1 for dynamic"
              />
              <p class="form-help-text">
                Token budget for thinking. -1: Dynamic (default), 0: Disabled, 128-32768: Specific budget (for gemini-2.5-pro, gemini-2.5-flash)
              </p>
            </FormField>

            <FormField label="Include Thoughts" class="w-full">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.includeThoughts"
                  type="checkbox"
                  class="form-checkbox mr-2"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Include thought summaries in the response</span>
              </label>
              <p class="form-help-text mt-1">
                Include thought summaries in the response for debugging and transparency
              </p>
            </FormField>
          </template>

          <!-- Temperature -->
          <div :class="{ 'opacity-50': isTemperatureDisabled }">
            <FormField
              label="Temperature"
              :hint="isTemperatureDisabled ? 'Disabled with reasoning/thinking' : undefined"
              class="w-full"
            >
            <input
              v-model.number="form.defaultTemperature"
              type="number"
              step="0.1"
              :min="0"
              :max="temperatureMax"
              class="form-input"
              :disabled="isTemperatureDisabled"
              placeholder="e.g., 0.7"
            />
            <p class="form-help-text">
              Sampling temperature ({{ temperatureRange }}){{ isTemperatureDisabled ? ' - Not compatible with reasoning/thinking' : '' }}
              </p>
            </FormField>
          </div>

          <!-- Top P -->
          <div :class="{ 'opacity-50': isTopPDisabled }">
            <FormField
              label="Top P"
              :hint="isTopPDisabled ? 'Disabled with reasoning' : isTopPLimited ? 'Limited to 0.95-1.0 with thinking' : undefined"
              :error="validationError"
              path="defaultTopP"
              class="w-full"
            >
            <input
              v-model.number="form.defaultTopP"
              type="number"
              step="0.1"
              :min="isTopPLimited ? 0.95 : 0"
              max="1"
              class="form-input"
              :disabled="isTopPDisabled"
              placeholder="e.g., 1.0"
            />
            <p class="form-help-text">
              Nucleus sampling threshold{{ isTopPLimited ? ' (0.95-1.0 with thinking enabled)' : ' (0-1)' }}
              </p>
            </FormField>
          </div>

          <!-- Top K (Gemini only) -->
          <FormField v-if="isGemini" label="Top K" class="w-full">
            <input
              v-model.number="form.defaultTopK"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g., 40"
            />
            <p class="form-help-text">
              Top-k sampling parameter
              </p>
          </FormField>

          <!-- Timeout -->
          <FormField label="Timeout" class="w-full">
            <input
              v-model.number="form.timeout"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g., 30000"
            />
            <p class="form-help-text">
              Request timeout in milliseconds
              </p>
          </FormField>

          <!-- Anthropic Version (Anthropic only) -->
          <FormField v-if="isAnthropic" label="Anthropic API Version" class="w-full">
            <input
              v-model="form.anthropicVersion"
              type="text"
              class="form-input"
              placeholder="e.g., 2023-06-01"
            />
            <p class="form-help-text">
              Anthropic API version to use
              </p>
          </FormField>
        </template>

        <ErrorDisplay :error="validationError" />

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="!selectedProvider">
            Save Settings
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import type { ProviderResponse, LlmSettings, ParsedError } from '@/api/types'
import type { LlmModelInfo } from '@/api/generated/data-contracts'
import apiClient from '@/api/client'
import { Wrench, Eye, FileJson, Zap, Brain, Image } from 'lucide-vue-next'

const props = defineProps<{
  settings: LlmSettings | null
  selectedProviderId: string | null
  providers: ProviderResponse[]
}>()

const emit = defineEmits<{
  close: []
  save: [settings: Record<string, any>]
}>()

const isLoadingModels = ref(false)
const availableModels = ref<LlmModelInfo[]>([])

interface LLMSettingsForm {
  model: string
  defaultMaxTokens: number | null
  defaultTemperature: number | null
  defaultTopP: number | null
  defaultTopK: number | null
  timeout: number | null
  anthropicVersion: string | null
  // OpenAI reasoning settings
  reasoningEffort: string | null
  reasoningSummary: string | null
  // Anthropic thinking settings
  thinkingMode: string | null
  thinkingBudgetTokens: number | null
  // Gemini thinking settings
  thinkingLevel: string | null
  thinkingBudget: number | null
  includeThoughts: boolean | null
}

const form = ref<LLMSettingsForm>({
  model: '',
  defaultMaxTokens: null,
  defaultTemperature: null,
  defaultTopP: null,
  defaultTopK: null,
  timeout: null,
  anthropicVersion: null,
  reasoningEffort: null,
  reasoningSummary: null,
  thinkingMode: null,
  thinkingBudgetTokens: null,
  thinkingLevel: null,
  thinkingBudget: null,
  includeThoughts: null
})

const useCustomModel = ref(false)
const validationError = ref<ParsedError | null>(null)

const selectedProvider = computed(() => 
  props.providers.find(p => p.id === props.selectedProviderId)
)

const providerApiType = computed(() => selectedProvider.value?.apiType?.toLowerCase() || '')

const isOpenAI = computed(() => 
  providerApiType.value === 'openai'
)

const isAnthropic = computed(() => 
  providerApiType.value === 'anthropic'
)

const isGemini = computed(() => 
  providerApiType.value === 'gemini' || providerApiType.value === 'google'
)

const hasReasoningCapability = computed(() => {
  return isOpenAI.value || isAnthropic.value || isGemini.value
})

const isTemperatureDisabled = computed(() => {
  // OpenAI: temperature disabled when reasoning is enabled
  if (isOpenAI.value && form.value.reasoningEffort) return true
  // Anthropic: temperature not allowed with thinking
  if (isAnthropic.value && form.value.thinkingMode) return true
  return false
})

const isTopPDisabled = computed(() => {
  // OpenAI: topP disabled when reasoning is enabled
  if (isOpenAI.value && form.value.reasoningEffort) return true
  return false
})

const isTopPLimited = computed(() => {
  // Anthropic: topP limited to 0.95-1.0 when thinking is enabled
  return isAnthropic.value && form.value.thinkingMode !== null
})

const temperatureMax = computed(() => {
  // Anthropic supports 0-1, OpenAI and Gemini support 0-2
  return isAnthropic.value ? 1 : 2
})

const temperatureRange = computed(() => {
  return isAnthropic.value ? '0-1' : '0-2'
})

// Get selected model info for capability display
const selectedModelInfo = computed(() => {
  if (!form.value.model) return null
  return availableModels.value.find(m => m.id === form.value.model)
})

async function loadModels(providerId: string) {
  isLoadingModels.value = true
  availableModels.value = []
  try {
    const response = await apiClient.providersModelsList(providerId)
    availableModels.value = [...response.models].sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (err) {
    console.error('Failed to load provider models:', err)
  } finally {
    isLoadingModels.value = false
  }
}

// Load models when provider changes
watch(() => props.selectedProviderId, (providerId) => {
  if (providerId) {
    loadModels(providerId)
  } else {
    availableModels.value = []
  }
}, { immediate: true })

// Initialize form when settings or provider changes
watch([() => props.settings, selectedProvider, availableModels], ([settings]) => {
  if (settings && typeof settings === 'object') {
    const modelName = settings.model || ''
    form.value = {
      model: modelName,
      defaultMaxTokens: settings.defaultMaxTokens ?? null,
      defaultTemperature: settings.defaultTemperature ?? null,
      defaultTopP: settings.defaultTopP ?? null,
      defaultTopK: ('defaultTopK' in settings ? settings.defaultTopK as number | null : null) ?? null,
      timeout: settings.timeout ?? null,
      anthropicVersion: ('anthropicVersion' in settings ? settings.anthropicVersion as string | null : null) ?? null,
      reasoningEffort: ('reasoningEffort' in settings ? settings.reasoningEffort as string | null : null) ?? null,
      reasoningSummary: ('reasoningSummary' in settings ? settings.reasoningSummary as string | null : null) ?? null,
      thinkingMode: ('thinkingMode' in settings ? settings.thinkingMode as string | null : null) ?? null,
      thinkingBudgetTokens: ('thinkingBudgetTokens' in settings ? settings.thinkingBudgetTokens as number | null : null) ?? null,
      thinkingLevel: ('thinkingLevel' in settings ? settings.thinkingLevel as string | null : null) ?? null,
      thinkingBudget: ('thinkingBudget' in settings ? settings.thinkingBudget as number | null : null) ?? null,
      includeThoughts: ('includeThoughts' in settings ? settings.includeThoughts as boolean | null : null) ?? null
    }
    
    // Check if model is in catalog. If not, enable custom model mode
    if (modelName) {
      const isInCatalog = availableModels.value.some(m => m.id === modelName)
      useCustomModel.value = !isInCatalog
    } else {
      useCustomModel.value = false
    }
  } else {
    form.value = {
      model: '',
      defaultMaxTokens: null,
      defaultTemperature: null,
      defaultTopP: null,
      defaultTopK: null,
      timeout: null,
      anthropicVersion: null,
      reasoningEffort: null,
      reasoningSummary: null,
      thinkingMode: null,
      thinkingBudgetTokens: null,
      thinkingLevel: null,
      thinkingBudget: null,
      includeThoughts: null
    }
    useCustomModel.value = false
  }
}, { immediate: true })

// Clear model field only when user manually toggles between custom and catalog mode
function onCustomModelToggle() {
  form.value.model = ''
}

const handleSubmit = () => {
  validationError.value = null

  const validationDetails: import('@/api/types').ApiErrorDetail[] = []
  if (!form.value.model) {
    validationDetails.push({ path: ['model'], message: 'Model name is required', code: 'REQUIRED' })
  }
  if (form.value.defaultTopP !== null && !isTopPDisabled.value && isTopPLimited.value && form.value.defaultTopP < 0.95) {
    validationDetails.push({ path: ['defaultTopP'], message: 'Top P must be between 0.95 and 1.0 when using Anthropic thinking mode', code: 'INVALID_VALUE' })
  }
  if (isAnthropic.value && form.value.thinkingMode === 'enabled' && form.value.thinkingBudgetTokens !== null && form.value.thinkingBudgetTokens < 1024) {
    validationDetails.push({ path: ['thinkingBudgetTokens'], message: 'Thinking budget tokens must be at least 1024', code: 'INVALID_VALUE' })
  }
  if (validationDetails.length > 0) {
    validationError.value = { message: 'Please correct the following errors', details: validationDetails }
    return
  }

  // Build settings object with only non-null values
  const settings: Record<string, any> = {
    model: form.value.model
  }

  if (form.value.defaultMaxTokens !== null) {
    settings.defaultMaxTokens = form.value.defaultMaxTokens
  }
  
  // Temperature and TopP handling with reasoning/thinking constraints
  if (form.value.defaultTemperature !== null && !isTemperatureDisabled.value) {
    settings.defaultTemperature = form.value.defaultTemperature
  }
  if (form.value.defaultTopP !== null && !isTopPDisabled.value) {
    settings.defaultTopP = form.value.defaultTopP
  }
  
  if (form.value.timeout !== null) {
    settings.timeout = form.value.timeout
  }

  // OpenAI reasoning settings
  if (isOpenAI.value) {
    if (form.value.reasoningEffort) {
      settings.reasoningEffort = form.value.reasoningEffort
    }
    if (form.value.reasoningSummary) {
      settings.reasoningSummary = form.value.reasoningSummary
    }
  }

  // Anthropic settings
  if (isAnthropic.value) {
    if (form.value.anthropicVersion) {
      settings.anthropicVersion = form.value.anthropicVersion
    }
    if (form.value.thinkingMode) {
      settings.thinkingMode = form.value.thinkingMode
    }
    if (form.value.thinkingMode === 'enabled' && form.value.thinkingBudgetTokens !== null) {
      settings.thinkingBudgetTokens = form.value.thinkingBudgetTokens
    }
  }

  // Gemini settings
  if (isGemini.value) {
    if (form.value.defaultTopK !== null) {
      settings.defaultTopK = form.value.defaultTopK
    }
    if (form.value.thinkingLevel) {
      settings.thinkingLevel = form.value.thinkingLevel
    }
    if (form.value.thinkingBudget !== null && form.value.thinkingBudget !== undefined) {
      settings.thinkingBudget = form.value.thinkingBudget
    }
    if (form.value.includeThoughts !== null) {
      settings.includeThoughts = form.value.includeThoughts
    }
  }

  emit('save', settings)
}
</script>
