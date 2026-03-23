<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Speechmatics Configuration</h3>

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
      <p class="form-help-text">Your Speechmatics API key for authentication</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Region <span class="required">*</span>
      </label>
      <select
        v-model="config.region"
        class="form-select-auto min-w-64"
        required
      >
        <option value="us">US (neu.rt.speechmatics.com)</option>
        <option value="eu">EU (eu2.rt.speechmatics.com)</option>
        <option value="apac">APAC (au.rt.speechmatics.com)</option>
      </select>
      <p class="form-help-text">Speechmatics region endpoint (default: US)</p>
    </div>
  </div>
</template>
