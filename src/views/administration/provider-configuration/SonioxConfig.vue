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
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Soniox Configuration</h3>

    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your Soniox API key">
      <SecretPasswordInput
        v-model="config.apiKey"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Region" required :error="error" path="region" class="w-full" help="Soniox region endpoint (default: US)">
      <select
        v-model="config.region"
        class="form-select-auto min-w-64"
        required
      >
        <option value="us">US (stt-rt.soniox.com)</option>
        <option value="eu">EU (stt-rt.eu.soniox.com)</option>
        <option value="jp">JP (stt-rt.jp.soniox.com)</option>
      </select>
    </FormField>
  </div>
</template>
