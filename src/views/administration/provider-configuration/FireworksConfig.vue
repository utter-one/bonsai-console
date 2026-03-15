<script setup lang="ts">
import { computed } from 'vue'
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })

const defaultUrl = 'https://api.fireworks.ai/inference/v1'

const isDefaultUrl = computed(() => config.value.baseUrl === defaultUrl || config.value.baseUrl === '')

function resetBaseUrl() {
  config.value.baseUrl = defaultUrl
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Fireworks AI Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        API Key <span class="required">*</span>
      </label>
      <input
        v-model="config.apiKey"
        type="password"
        required
        placeholder="fw-..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your Fireworks AI API key</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Base URL <span class="text-gray-500">(optional)</span>
      </label>
      <div class="flex gap-2">
        <div class="flex-1">
          <input
            v-model="config.baseUrl"
            type="url"
            :placeholder="defaultUrl"
            class="form-input-mono"
          />
        </div>
        <button
          v-if="!isDefaultUrl"
          type="button"
          @click="resetBaseUrl"
          class="btn-secondary whitespace-nowrap"
          title="Restore default URL"
        >
          Reset
        </button>
      </div>
      <p class="form-help-text">Override the default Fireworks AI endpoint URL.</p>
    </div>
  </div>
</template>
