<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Twilio Voice Configuration</h3>

    <FormField label="Account SID" required :error="error" path="accountSid" class="w-full" help="Your Twilio Account SID (starts with AC)">
      <input
        v-model="config.accountSid"
        type="text"
        required
        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Auth Token" required :error="error" path="authToken" class="w-full" help="Your Twilio Auth Token used for webhook signature validation">
      <input
        v-model="config.authToken"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Phone Number" required :error="error" path="phoneNumber" class="w-full" help="Twilio phone number in E.164 format (e.g. +15551234567)">
      <input
        v-model="config.phoneNumber"
        type="text"
        required
        placeholder="+15551234567"
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
