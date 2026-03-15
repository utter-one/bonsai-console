<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Cartesia Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        API Key <span class="required">*</span>
      </label>
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your Cartesia API key</p>
    </div>
  </div>
</template>
