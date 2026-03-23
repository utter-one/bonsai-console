<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Azure Speech Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        Region <span class="required">*</span>
      </label>
      <input
        v-model="config.region"
        type="text"
        required
        placeholder="eastus"
        class="form-input-mono"
      />
      <p class="form-help-text">Azure region for the Speech service (e.g., eastus, westeurope)</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Subscription Key <span class="required">*</span>
      </label>
      <input
        v-model="config.subscriptionKey"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your Azure Speech service subscription key</p>
    </div>
  </div>
</template>
