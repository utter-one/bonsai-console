<script setup lang="ts">
import { computed } from 'vue'
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })

const defaultUrl = 'https://api.fireworks.ai/inference/v1'

const isDefaultUrl = computed(() => config.value.baseUrl === defaultUrl || config.value.baseUrl === '')

function resetBaseUrl() {
  config.value.baseUrl = defaultUrl
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Fireworks AI Configuration</h3>
    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your Fireworks AI API key">
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="fw-..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Base URL" class="w-full" help="Override the default Fireworks AI endpoint URL.">
      <div class="flex gap-2">
        <div class="flex-1">
          <input
            v-model="config.baseUrl"
            type="url"
            :placeholder="defaultUrl"
            class="form-input-mono"
          />
        </div>
        <button
          v-if="!isDefaultUrl"
          type="button"
          @click="resetBaseUrl"
          class="btn-secondary whitespace-nowrap"
          title="Restore default URL"
        >
          Reset
        </button>
      </div>
    </FormField>
  </div>
</template>
