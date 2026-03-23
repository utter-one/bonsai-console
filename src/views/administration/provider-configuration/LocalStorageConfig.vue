<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Local Storage Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        Base Path <span class="required">*</span>
      </label>
      <input
        v-model="config.basePath"
        type="text"
        required
        placeholder="/var/data/storage"
        class="form-input-mono"
      />
      <p class="form-help-text">Base directory path for local file storage</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Base URL <span class="text-gray-500">(optional)</span>
      </label>
      <input
        v-model="config.baseUrl"
        type="url"
        placeholder="https://storage.example.com"
        class="form-input-mono"
      />
      <p class="form-help-text">Base URL for generating file URLs (if files are served via HTTP)</p>
    </div>
  </div>
</template>
