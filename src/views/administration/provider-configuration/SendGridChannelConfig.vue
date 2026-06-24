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
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">SendGrid Configuration</h3>

    <FormField label="API Key" required :error="error" path="apiKey" class="w-full" help="Your SendGrid API key for sending emails">
      <SecretPasswordInput
        v-model="config.apiKey"
        required
        placeholder="SG.xxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="From Address" required :error="error" path="fromAddress" class="w-full" help="Email address that will appear as the sender">
      <input
        v-model="config.fromAddress"
        type="email"
        required
        placeholder="noreply@example.com"
        class="form-input"
      />
    </FormField>

    <FormField label="Threading Strategy" :error="error" path="threadingStrategy" class="w-full" help="How conversation threads are tracked: messageId uses Message-Id headers, senderSubject matches on sender + subject">
      <select v-model="config.threadingStrategy" class="form-select-auto">
        <option value="messageId">Message-Id (default)</option>
        <option value="senderSubject">Sender + Subject</option>
      </select>
    </FormField>
  </div>
</template>
