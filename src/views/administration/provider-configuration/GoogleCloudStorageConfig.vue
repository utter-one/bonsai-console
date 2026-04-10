<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Google Cloud Storage Configuration</h3>

    <FormField label="GCP Project ID" required :error="error" path="projectId" class="w-full" help="Your Google Cloud project ID">
      <input
        v-model="config.projectId"
        type="text"
        required
        placeholder="my-project-id"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Service Account Key (JSON)" required :error="error" path="keyFileJson" class="w-full" help="The complete JSON content of your service account key file">
      <textarea
        v-model="config.keyFileJson"
        rows="6"
        required
        placeholder='{"type": "service_account", "project_id": "...", ...}'
        class="form-textarea font-mono text-sm"
      ></textarea>
    </FormField>
  </div>
</template>
