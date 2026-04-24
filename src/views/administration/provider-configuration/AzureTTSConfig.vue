<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Speech Configuration</h3>

    <FormField label="Region" required :error="error" path="region" class="w-full" help="Azure region for the Speech service (e.g., eastus, westeurope)">
      <input
        v-model="config.region"
        type="text"
        required
        placeholder="eastus"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Subscription Key" required :error="error" path="subscriptionKey" class="w-full" help="Your Azure Speech service subscription key">
      <SecretPasswordInput
        v-model="config.subscriptionKey"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
