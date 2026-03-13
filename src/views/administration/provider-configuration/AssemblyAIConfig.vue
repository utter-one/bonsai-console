<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">AssemblyAI Configuration</h3>

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
      <p class="form-help-text">Your AssemblyAI API key</p>
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
        <option value="eu">EU (streaming.eu.assemblyai.com)</option>
        <option value="us">US (streaming.assemblyai.com)</option>
      </select>
      <p class="form-help-text">AssemblyAI region endpoint (default: EU)</p>
    </div>
  </div>
</template>
