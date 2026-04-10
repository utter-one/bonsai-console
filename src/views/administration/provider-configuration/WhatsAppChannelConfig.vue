<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">WhatsApp (Meta) Configuration</h3>

    <FormField label="Phone Number ID" required :error="error" path="phoneNumberId" class="w-full" help="Meta phone number ID used in the Graph API URL for outbound messages (e.g. 123456789012345)">
      <input
        v-model="config.phoneNumberId"
        type="text"
        required
        placeholder="123456789012345"
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Access Token" required :error="error" path="accessToken" class="w-full" help="Permanent Meta access token used as Bearer auth for outbound Graph API calls">
      <input
        v-model="config.accessToken"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="App Secret" required :error="error" path="appSecret" class="w-full" help="Meta app secret used to validate incoming webhook signatures via HMAC-SHA256">
      <input
        v-model="config.appSecret"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Verify Token" required :error="error" path="verifyToken" class="w-full" help="Static verification token echoed back during the one-time Meta webhook challenge/verification request">
      <input
        v-model="config.verifyToken"
        type="text"
        required
        placeholder="..."
        class="form-input-mono"
      />
    </FormField>
  </div>
</template>
