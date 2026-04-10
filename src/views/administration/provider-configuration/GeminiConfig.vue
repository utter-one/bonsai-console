<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Google Configuration</h3>

    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your Google API key">
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="AIza..."
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
