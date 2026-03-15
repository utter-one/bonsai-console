<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Blob Storage Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        Storage Account Name <span class="required">*</span>
      </label>
      <input
        v-model="config.accountName"
        type="text"
        required
        placeholder="mystorageaccount"
        class="form-input-mono"
      />
      <p class="form-help-text">Your Azure Storage account name</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Storage Account Key <span class="required">*</span>
      </label>
      <input
        v-model="config.accountKey"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your Azure Storage account key</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Custom Endpoint <span class="text-gray-500">(optional)</span>
      </label>
      <input
        v-model="config.endpoint"
        type="url"
        placeholder="https://mystorageaccount.blob.core.windows.net"
        class="form-input-mono"
      />
      <p class="form-help-text">Optional custom endpoint for Azure Blob Storage</p>
    </div>
  </div>
</template>
