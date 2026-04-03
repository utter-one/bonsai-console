<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Speechmatics Configuration</h3>

    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your Speechmatics API key for authentication">
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Region" required :error="error" path="region" class="w-full" help="Speechmatics region endpoint (default: US)">
      <select
        v-model="config.region"
        class="form-select-auto min-w-64"
        required
      >
        <option value="us">US (neu.rt.speechmatics.com)</option>
        <option value="eu">EU (eu2.rt.speechmatics.com)</option>
        <option value="apac">APAC (au.rt.speechmatics.com)</option>
      </select>
    </FormField>
  </div>
</template>
