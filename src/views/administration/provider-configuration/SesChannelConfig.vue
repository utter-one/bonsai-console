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
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Amazon SES Configuration</h3>

    <FormField label="Access Key ID" required :error="error" path="accessKeyId" class="w-full" help="Your AWS Access Key ID for SES access">
      <SecretPasswordInput
        v-model="config.accessKeyId"
        required
        placeholder="AKIAxxxxxxxxxxxxxxxxxx"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Secret Access Key" required :error="error" path="secretAccessKey" class="w-full" help="Your AWS Secret Access Key for SES access">
      <SecretPasswordInput
        v-model="config.secretAccessKey"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Region" required :error="error" path="region" class="w-full" help="AWS region where SES is configured (e.g. us-east-1)">
      <input
        v-model="config.region"
        type="text"
        required
        placeholder="us-east-1"
        class="form-input"
      />
    </FormField>

    <FormField label="From Address" required :error="error" path="fromAddress" class="w-full" help="Verified email address that will appear as the sender">
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
