<script setup lang="ts">
import { computed } from 'vue'
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })

const defaultLocalUrl = 'http://localhost:11434'

const isDefaultUrl = computed(() => config.value.baseUrl === defaultLocalUrl || config.value.baseUrl === '')

function resetBaseUrl() {
  config.value.baseUrl = defaultLocalUrl
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Ollama Configuration</h3>

    <FormField label="Base URL" class="w-full" help="URL of the Ollama server. Use the default for a local instance, or https://ollama.com for Ollama Cloud.">
      <div class="flex gap-2">
        <div class="flex-1">
          <input
            v-model="config.baseUrl"
            type="url"
            :placeholder="defaultLocalUrl"
            class="form-input-mono"
          />
        </div>
        <button
          v-if="!isDefaultUrl"
          type="button"
          @click="resetBaseUrl"
          class="btn-secondary whitespace-nowrap"
          title="Restore default local URL"
        >
          Reset
        </button>
      </div>
    </FormField>

    <FormField label="API Key" class="w-full" help="Required for Ollama Cloud (ollama.com). Leave empty for local Ollama instances.">
      <SecretPasswordInput
        v-model="config.apiKey"
        placeholder="ollama-..."
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
