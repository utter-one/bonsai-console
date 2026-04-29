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
  </div>
</template>
