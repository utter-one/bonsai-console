<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Telegram Configuration</h3>

    <FormField label="Bot Token" required :error="error" path="botToken" class="w-full" help="Telegram Bot API token obtained from @BotFather">
      <SecretPasswordInput
        v-model="config.botToken"
        required
        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
        class="form-input-mono"
      />
    </FormField>

    <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-base font-semibold text-gray-900 dark:text-white">Incoming Message Processing</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Add a random delay before processing incoming messages to avoid triggering rate limits.</p>

      <div class="flex flex-col md:flex-row gap-3">
        <FormField :error="error" path="processingDelayMinMs" class="w-full">
          <label class="form-label">Min Delay (ms)</label>
          <input
            v-model.number="config.processingDelayMinMs"
            type="number"
            placeholder="0"
            min="0"
            class="form-input"
          />
          <p class="form-help-text">Minimum delay in milliseconds before processing a message (default: 0)</p>
        </FormField>

        <FormField :error="error" path="processingDelayMaxMs" class="w-full">
          <label class="form-label">Max Delay (ms)</label>
          <input
            v-model.number="config.processingDelayMaxMs"
            type="number"
            placeholder="0"
            min="0"
            class="form-input"
          />
          <p class="form-help-text">Maximum delay in milliseconds. A random value between min and max is used (default: 0)</p>
        </FormField>
      </div>
    </div>
  </div>
</template>
