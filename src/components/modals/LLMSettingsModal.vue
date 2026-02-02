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
              Maximum number of tokens to generate
            </p>
          </div>

          <!-- Temperature -->
          <div class="form-group">
            <label class="form-label">
              Temperature <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model.number="form.defaultTemperature"
              type="number"
              step="0.1"
              :min="0"
              :max="temperatureMax"
              class="form-input"
              placeholder="e.g., 0.7"
            />
            <p class="form-help-text">
              Sampling temperature ({{ temperatureRange }})
            </p>
          </div>

          <!-- Top P -->
          <div class="form-group">
            <label class="form-label">
              Top P <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model.number="form.defaultTopP"
              type="number"
              step="0.1"
              min="0"
              max="1"
              class="form-input"
              placeholder="e.g., 1.0"
            />
            <p class="form-help-text">
              Nucleus sampling threshold (0-1)
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
}

const form = ref<LLMSettingsForm>({
  model: '',
  defaultMaxTokens: null,
  defaultTemperature: null,
  defaultTopP: null,
  defaultTopK: null,
  timeout: null,
  anthropicVersion: null
})

const validationError = ref<string | null>(null)

const selectedProvider = computed(() => 
  props.providers.find(p => p.id === props.selectedProviderId)
)

const providerApiType = computed(() => selectedProvider.value?.apiType?.toLowerCase() || '')

const isAnthropic = computed(() => 
  providerApiType.value === 'anthropic'
)

const isGemini = computed(() => 
  providerApiType.value === 'google'
)

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
      defaultTopK: ('defaultTopK' in settings ? settings.defaultTopK : null) ?? null,
      timeout: settings.timeout ?? null,
      anthropicVersion: ('anthropicVersion' in settings ? settings.anthropicVersion : null) ?? null
    }
  } else {
    form.value = {
      model: '',
      defaultMaxTokens: null,
      defaultTemperature: null,
      defaultTopP: null,
      defaultTopK: null,
      timeout: null,
      anthropicVersion: null
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
  if (form.value.defaultTemperature !== null) {
    settings.defaultTemperature = form.value.defaultTemperature
  }
  if (form.value.defaultTopP !== null) {
    settings.defaultTopP = form.value.defaultTopP
  }
  if (form.value.timeout !== null) {
    settings.timeout = form.value.timeout
  }

  // Provider-specific fields
  if (isGemini.value && form.value.defaultTopK !== null) {
    settings.defaultTopK = form.value.defaultTopK
  }
  if (isAnthropic.value && form.value.anthropicVersion) {
    settings.anthropicVersion = form.value.anthropicVersion
  }

  emit('save', settings)
}
</script>
