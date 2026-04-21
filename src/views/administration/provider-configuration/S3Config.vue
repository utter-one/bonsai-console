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
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">AWS S3 Configuration</h3>

    <FormField label="AWS Access Key ID" required :error="error" path="accessKeyId" class="w-full" help="Your AWS Access Key ID for S3 access">
      <input
        v-model="config.accessKeyId"
        type="text"
        required
        placeholder="AKIA..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="AWS Secret Access Key" required :error="error" path="secretAccessKey" class="w-full" help="Your AWS Secret Access Key for S3 access">
      <SecretPasswordInput
        v-model="config.secretAccessKey"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="AWS Region" required :error="error" path="region" class="w-full" help="AWS region for S3 (e.g., us-east-1, eu-west-1)">
      <input
        v-model="config.region"
        type="text"
        required
        placeholder="us-east-1"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Custom Endpoint" class="w-full" help="Optional custom endpoint for S3-compatible services (e.g., MinIO)">
      <input
        v-model="config.endpoint"
        type="url"
        placeholder="https://s3.example.com"
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
