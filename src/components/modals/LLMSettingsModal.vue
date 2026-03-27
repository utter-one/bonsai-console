<template>
  <BaseModal title="LLM Settings" size="lg" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select an LLM provider first
        </div>

        <template v-else>
          <!-- Model Name (Required for all providers) -->
          <div class="form-group">
            <label class="form-label">
              Model <span class="required">*</span>
            </label>

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
          </div>

          <!-- Max Tokens -->
          <div class="form-group">
            <label class="form-label">
              Max Tokens <span class="text-gray-500">(optional)</span>
            </label>
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
          </div>

          <!-- OpenAI Reasoning Settings -->
          <template v-if="isOpenAI">
            <div class="form-group">
              <label class="form-label">
                Reasoning Effort <span class="text-gray-500">(optional)</span>
              </label>
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
            </div>

            <div v-if="form.reasoningEffort" class="form-group">
              <label class="form-label">
                Reasoning Summary <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.reasoningSummary" class="form-select">
                <option :value="null">Disabled</option>
                <option value="auto">Auto - Adapts to model</option>
                <option value="concise">Concise - Brief summary</option>
                <option value="detailed">Detailed - Comprehensive breakdown</option>
              </select>
              <p class="form-help-text">
                Generate a summary of the model's reasoning process for debugging
              </p>
            </div>
          </template>

          <!-- Anthropic Thinking Settings -->
          <template v-if="isAnthropic">
            <div class="form-group">
              <label class="form-label">
                Thinking Mode <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.thinkingMode" class="form-select">
                <option :value="null">Disabled</option>
                <option value="enabled">Enabled - Manual token budget</option>
                <option value="adaptive">Adaptive - Auto-adjusts (Claude Opus 4.6+)</option>
              </select>
              <p class="form-help-text">
                Enable Claude's extended thinking capability for internal reasoning
              </p>
            </div>

            <div v-if="form.thinkingMode === 'enabled'" class="form-group">
              <label class="form-label">
                Thinking Budget Tokens <span class="text-gray-500">(optional)</span>
              </label>
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
            </div>
          </template>

          <!-- Gemini Thinking Settings -->
          <template v-if="isGemini">
            <div class="form-group">
              <label class="form-label">
                Thinking Level <span class="text-gray-500">(Gemini 3 models)</span>
              </label>
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
            </div>

            <div class="form-group">
              <label class="form-label">
                Thinking Budget <span class="text-gray-500">(Gemini 2.5 models)</span>
              </label>
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
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.includeThoughts"
                  type="checkbox"
                  class="form-checkbox mr-2"
                />
                <span class="form-label mb-0">Include Thoughts</span>
              </label>
              <p class="form-help-text">
                Include thought summaries in the response for debugging and transparency
              </p>
            </div>
          </template>

          <!-- Temperature -->
          <div class="form-group" :class="{ 'opacity-50': isTemperatureDisabled }">
            <label class="form-label">
              Temperature <span class="text-gray-500">(optional)</span>
              <span v-if="isTemperatureDisabled" class="text-red-500 text-sm ml-2">
                (Disabled with reasoning/thinking)
              </span>
            </label>
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
          </div>

          <!-- Top P -->
          <div class="form-group" :class="{ 'opacity-50': isTopPDisabled }">
            <label class="form-label">
              Top P <span class="text-gray-500">(optional)</span>
              <span v-if="isTopPLimited" class="text-yellow-600 text-sm ml-2">
                (Limited to 0.95-1.0 with thinking)
              </span>
              <span v-else-if="isTopPDisabled" class="text-red-500 text-sm ml-2">
                (Disabled with reasoning)
              </span>
            </label>
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
          </div>

          <!-- Top K (Gemini only) -->
          <div v-if="isGemini" class="form-group">
            <label class="form-label">
              Top K <span class="text-gray-500">(optional)</span>
            </label>
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
          </div>

          <!-- Timeout -->
          <div class="form-group">
            <label class="form-label">
              Timeout <span class="text-gray-500">(optional)</span>
            </label>
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
          </div>

          <!-- Anthropic Version (Anthropic only) -->
          <div v-if="isAnthropic" class="form-group">
            <label class="form-label">
              Anthropic API Version <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.anthropicVersion"
              type="text"
              class="form-input"
              placeholder="e.g., 2023-06-01"
            />
            <p class="form-help-text">
              Anthropic API version to use
            </p>
          </div>
        </template>

        <div v-if="validationError" class="alert-error">
          {{ validationError }}
        </div>

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
import type { ProviderResponse, LlmSettings } from '@/api/types'
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
const validationError = ref<string | null>(null)

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
  
  if (!form.value.model) {
    validationError.value = 'Model name is required'
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
    // Validate topP range for Anthropic with thinking
    if (isTopPLimited.value && form.value.defaultTopP < 0.95) {
      validationError.value = 'Top P must be between 0.95 and 1.0 when using Anthropic thinking mode'
      return
    }
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
      if (form.value.thinkingBudgetTokens < 1024) {
        validationError.value = 'Thinking budget tokens must be at least 1024'
        return
      }
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
