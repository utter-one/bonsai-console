<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Local Storage Configuration</h3>

    <FormField label="Base Path" required :error="error" path="basePath" class="w-full" help="Base directory path for local file storage">
      <input
        v-model="config.basePath"
        type="text"
        required
        placeholder="/var/data/storage"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Base URL" class="w-full" help="Base URL for generating file URLs (if files are served via HTTP)">
      <input
        v-model="config.baseUrl"
        type="url"
        placeholder="https://storage.example.com"
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
