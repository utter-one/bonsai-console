<script setup lang="ts">
import { computed } from 'vue'
import { providerPresets } from './providerPresets'
import type { ProviderConfig, ProviderPreset } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

const props = defineProps<{
  apiType: string
  error?: ParsedError | null
}>()

const config = defineModel<ProviderConfig>('config', { required: true })

const defaultBaseUrl = computed(() => {
  const preset = providerPresets.find(p => p.name === props.apiType)
  return preset?.baseUrl ?? null
})

const detectedProvider = computed(() => {
  if (!config.value.baseUrl) return null
  return providerPresets.find(preset => preset.urlPattern.test(config.value.baseUrl))
})

function selectProviderPreset(preset: ProviderPreset) {
  config.value.baseUrl = preset.baseUrl
}

function resetBaseUrl() {
  if (defaultBaseUrl.value) {
    config.value.baseUrl = defaultBaseUrl.value
  }
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">OpenAI Configuration</h3>
    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your OpenAI API key">
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="sk-..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Organization ID" class="w-full" help="Optional organization ID for OpenAI">
      <input
        v-model="config.organizationId"
        type="text"
        placeholder="org-..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Base URL" class="w-full">
      <div class="flex gap-2">
        <div class="flex-1">
          <input
            v-model="config.baseUrl"
            type="url"
            :placeholder="defaultBaseUrl ?? 'https://api.openai.com/v1'"
            class="form-input-mono"
          />
        </div>
        <div v-if="apiType === 'openai-legacy'" class="relative">
          <select
            @change="(e) => { const preset = providerPresets.find(p => p.name === (e.target as HTMLSelectElement).value); if (preset) { selectProviderPreset(preset); (e.target as HTMLSelectElement).value = ''; } }"
            class="form-select min-w-40"
          >
            <option value="">{{ detectedProvider ? detectedProvider.displayName : 'Quick Select...' }}</option>
            <option v-for="preset in providerPresets" :key="preset.name" :value="preset.name">
              {{ preset.displayName }}
            </option>
          </select>
        </div>
        <button
          v-else-if="defaultBaseUrl"
          type="button"
          @click="resetBaseUrl"
          class="btn-secondary whitespace-nowrap"
          :disabled="config.baseUrl === defaultBaseUrl"
          title="Restore default URL"
        >
          Reset
        </button>
      </div>
      <p class="form-help-text">
        <template v-if="apiType === 'openai-legacy'">Optional base URL for OpenAI-compatible APIs. Use the dropdown to quick-select popular providers.</template>
        <template v-else-if="defaultBaseUrl">Override the default endpoint URL. Click Reset to restore the default.</template>
        <template v-else>Optional custom base URL for this provider.</template>
      </p>
    </FormField>
  </div>
</template>
