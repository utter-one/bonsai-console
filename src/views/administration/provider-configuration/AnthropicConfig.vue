<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Anthropic Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        API Key <span class="required">*</span>
      </label>
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="sk-ant-..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your Anthropic API key</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Base URL <span class="text-gray-500">(optional)</span>
      </label>
      <input
        v-model="config.baseUrl"
        type="url"
        placeholder="https://api.anthropic.com"
        class="form-input-mono"
      />
      <p class="form-help-text">Optional base URL for custom endpoints</p>
    </div>
  </div>
</template>
