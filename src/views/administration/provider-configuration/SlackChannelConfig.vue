<script setup lang="ts">
import { computed } from 'vue'
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
const socket = computed(() => config.value.mode === 'socket_mode')
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Slack Configuration</h3>

    <FormField label="Mode" required :error="error" path="mode" class="w-full" help="Events API receives signed HTTP webhook events (production, requires a public URL). Socket Mode opens an outbound WebSocket via an app-level token (local development, no public URL needed).">
      <select
        v-model="config.mode"
        class="form-select-auto min-w-64"
        required
      >
        <option value="events_api">Events API (webhook)</option>
        <option value="socket_mode">Socket Mode (WebSocket)</option>
      </select>
    </FormField>

    <FormField label="Bot Token" required :error="error" path="botToken" class="w-full" help="Slack bot token (xoxb-). Required in both modes: authenticates replies (chat.postMessage) and resolves the bot user id (auth.test) for @-mention detection/stripping in channels.">
      <SecretPasswordInput
        v-model="config.botToken"
        required
        placeholder="xoxb-..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Signing Secret" :required="!socket" :error="error" path="signingSecret" class="w-full" :help="socket ? 'Slack app signing secret (SEC...). Used only in Events API mode (verifies X-Slack-Signature on inbound webhook requests); unused in Socket Mode.' : 'Slack app signing secret (SEC...) used to verify X-Slack-Signature on inbound webhook requests.'">
      <SecretPasswordInput
        v-model="config.signingSecret"
        :required="!socket"
        placeholder="SEC1234567890abcdef..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="App Token" :required="socket" :error="error" path="appToken" class="w-full" :help="socket ? 'Slack app-level token (xapp-) with the connections:write scope. Used only in Socket Mode.' : 'Slack app-level token (xapp-) with the connections:write scope. Used only in Socket Mode; not needed for Events API.'">
      <SecretPasswordInput
        v-model="config.appToken"
        :required="socket"
        placeholder="xapp-1-..."
        class="form-input-mono"
      />
    </FormField>

    <FormField label="Project" :required="socket" :error="error" path="projectId" class="w-full" :help="socket ? 'Bonsai project this provider serves. Used only in Socket Mode.' : 'Bonsai project this provider serves. Used only in Socket Mode; in Events API mode the project is instead chosen per-request via the webhook API key.'">
      <ProjectSelect v-model="config.projectId" :required="socket" />
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
