<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Google Cloud Storage Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        GCP Project ID <span class="required">*</span>
      </label>
      <input
        v-model="config.projectId"
        type="text"
        required
        placeholder="my-project-id"
        class="form-input-mono"
      />
      <p class="form-help-text">Your Google Cloud project ID</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Service Account Key (JSON) <span class="required">*</span>
      </label>
      <textarea
        v-model="config.keyFileJson"
        rows="6"
        required
        placeholder='{"type": "service_account", "project_id": "...", ...}'
        class="form-textarea font-mono text-sm"
      ></textarea>
      <p class="form-help-text">The complete JSON content of your service account key file</p>
    </div>
  </div>
</template>
