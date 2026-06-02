<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">SMTP/IMAP Configuration</h3>

    <FormField label="From Address" required :error="error" path="fromAddress" class="w-full" help="Sender email address for outbound messages">
      <input
        v-model="config.fromAddress"
        type="email"
        required
        placeholder="noreply@example.com"
        class="form-input"
      />
    </FormField>

    <FormField label="Project" required :error="error" path="projectId" class="w-full" help="Bonsai project that will receive inbound emails">
      <ProjectSelect v-model="config.projectId" required />
    </FormField>

    <FormField label="Threading Strategy" :error="error" path="threadingStrategy" class="w-full" help="How conversation threads are tracked: messageId uses Message-Id headers, senderSubject matches on sender + subject">
      <select v-model="config.threadingStrategy" class="form-select-auto">
        <option value="messageId">Message-Id (default)</option>
        <option value="senderSubject">Sender + Subject</option>
      </select>
    </FormField>

    <CompositeFormField label="Outbound (SMTP)" required :error="error ?? null" help="SMTP server settings for sending emails">
      <div class="flex flex-col md:flex-row gap-3">
        <FormField label="Host" required :error="error" path="smtpHost" class="w-full" help="SMTP server hostname">
          <input
            v-model="config.smtpHost"
            type="text"
            required
            placeholder="smtp.example.com"
            class="form-input"
          />
        </FormField>

        <FormField label="Port" required :error="error" path="smtpPort" class="w-full" help="587 for STARTTLS, 465 for implicit TLS">
          <input
            v-model="config.smtpPort"
            type="number"
            required
            placeholder="587"
            min="1"
            max="65535"
            class="form-input"
          />
        </FormField>
      </div>

      <div class="mt-3">
        <label class="checkbox-label">
          <input
            v-model="config.smtpSecure"
            type="checkbox"
            class="form-checkbox"
          />
          Implicit TLS (uncheck for STARTTLS)
        </label>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mt-3">
        <FormField label="Login" required :error="error" path="smtpAuthUser" class="w-full" help="Username for SMTP authentication">
          <input
            v-model="config.smtpAuthUser"
            type="text"
            required
            placeholder="user@example.com"
            class="form-input"
          />
        </FormField>

        <FormField label="Password" required :error="error" path="smtpAuthPass" class="w-full" help="Password or application-specific password">
          <SecretPasswordInput
            v-model="config.smtpAuthPass"
            required
            placeholder="..."
            class="form-input-mono"
          />
        </FormField>
      </div>
    </CompositeFormField>

    <CompositeFormField label="Inbound (IMAP)" :error="error ?? null" help="IMAP server settings for receiving replies. Leave empty to disable inbound email.">
      <div class="flex flex-col md:flex-row gap-3">
        <FormField label="Host" :error="error" path="imapHost" class="w-full" help="IMAP server hostname">
          <input
            v-model="config.imapHost"
            type="text"
            placeholder="imap.example.com"
            class="form-input"
          />
        </FormField>

        <FormField label="Port" :error="error" path="imapPort" class="w-full" help="993 for TLS, 143 for STARTTLS">
          <input
            v-model="config.imapPort"
            type="number"
            placeholder="993"
            min="1"
            max="65535"
            class="form-input"
          />
        </FormField>
      </div>

      <div class="mt-3">
        <label class="checkbox-label">
          <input
            v-model="config.imapSecure"
            type="checkbox"
            class="form-checkbox"
          />
          Implicit TLS (uncheck for STARTTLS)
        </label>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mt-3">
        <FormField label="Login" :error="error" path="imapAuthUser" class="w-full" help="Username for IMAP authentication">
          <input
            v-model="config.imapAuthUser"
            type="text"
            placeholder="mailbox@example.com"
            class="form-input"
          />
        </FormField>

        <FormField label="Password" :error="error" path="imapAuthPass" class="w-full" help="Password or application-specific password">
          <SecretPasswordInput
            v-model="config.imapAuthPass"
            placeholder="..."
            class="form-input-mono"
          />
        </FormField>
      </div>

      <div class="mt-3">
        <FormField label="Polling Interval" :error="error" path="imapPollingIntervalMs" class="w-full" help="Fallback polling interval in milliseconds when IMAP IDLE is unavailable (default: 30000)">
          <input
            v-model="config.imapPollingIntervalMs"
            type="number"
            placeholder="30000"
            min="1000"
            class="form-input"
          />
        </FormField>
      </div>
    </CompositeFormField>
  </div>
</template>
