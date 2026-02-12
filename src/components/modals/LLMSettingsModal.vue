<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">LLM Settings</h2>
      
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
            <select
              v-model="form.model"
              required
              class="form-select"
              :disabled="catalogStore.isLoading"
            >
              <option value="">{{ catalogStore.isLoading ? 'Loading models...' : 'Select a model' }}</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.displayName }}{{ model.recommended ? ' (Recommended)' : '' }}
              </option>
            </select>
            <p v-if="form.model && availableModels.find(m => m.id === form.model)?.description" class="form-help-text">
              {{ availableModels.find(m => m.id === form.model)?.description }}
            </p>
            <p v-else class="form-help-text">
              Select the model to use for this stage
            </p>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { ProviderResponse, LlmSettings } from '@/api/types'
import { useProviderCatalogStore } from '@/stores'

const props = defineProps<{
  settings: LlmSettings | null
  selectedProviderId: string | null
  providers: ProviderResponse[]
}>()

const emit = defineEmits<{
  close: []
  save: [settings: Record<string, any>]
}>()

const catalogStore = useProviderCatalogStore()

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
  providerApiType.value === 'google'
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

// Get available models from catalog for the selected provider
const availableModels = computed(() => {
  if (!catalogStore.catalog || !providerApiType.value) return []
  
  const llmProvider = catalogStore.catalog.llm.find(
    p => p.apiType.toLowerCase() === providerApiType.value
  )
  
  return llmProvider?.models || []
})

// Load catalog on mount
onMounted(async () => {
  if (!catalogStore.catalog) {
    try {
      await catalogStore.fetchCatalog()
    } catch (err) {
      console.error('Failed to load provider catalog:', err)
    }
  }
})

// Initialize form when settings or provider changes
watch([() => props.settings, selectedProvider], ([settings]) => {
  if (settings && typeof settings === 'object') {
    form.value = {
      model: settings.model || '',
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
  }
}, { immediate: true })

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
