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
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Blob Storage Configuration</h3>

    <FormField label="Storage Account Name" required :error="error" path="accountName" class="w-full" help="Your Azure Storage account name">
      <input
        v-model="config.accountName"
        type="text"
        required
        placeholder="mystorageaccount"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Storage Account Key" required :error="error" path="accountKey" class="w-full" help="Your Azure Storage account key">
      <SecretPasswordInput
        v-model="config.accountKey"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Custom Endpoint" class="w-full" help="Optional custom endpoint for Azure Blob Storage">
      <input
        v-model="config.endpoint"
        type="url"
        placeholder="https://mystorageaccount.blob.core.windows.net"
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
