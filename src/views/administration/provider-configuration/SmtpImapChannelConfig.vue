<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
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

    <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Outbound (SMTP) <span class="required">*</span></h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">SMTP server settings for sending emails</p>

      <div class="flex flex-col md:flex-row gap-3 mt-4">
        <FormField :error="error" path="smtpHost" class="w-full">
          <label class="form-label">Host <span class="required">*</span></label>
          <input
            v-model="config.smtpHost"
            type="text"
            required
            placeholder="smtp.example.com"
            class="form-input"
          />
          <p class="form-help-text">SMTP server hostname</p>
        </FormField>

        <FormField :error="error" path="smtpPort" class="w-full">
          <label class="form-label">Port <span class="required">*</span></label>
          <input
            v-model="config.smtpPort"
            type="number"
            required
            placeholder="587"
            min="1"
            max="65535"
            class="form-input"
          />
          <p class="form-help-text">587 for STARTTLS, 465 for implicit TLS</p>
        </FormField>
      </div>

      <div class="mt-3">
        <FormField :error="error" path="smtpSecure">
          <label class="checkbox-label">
            <input
              v-model="config.smtpSecure"
              type="checkbox"
              class="form-checkbox"
            />
            Implicit TLS
          </label>
          <p class="form-help-text">Enable for port 465 (TLS from start). Disable for port 587 with STARTTLS upgrade.</p>
        </FormField>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mt-3">
        <FormField :error="error" path="smtpAuthUser" class="w-full">
          <label class="form-label">Login <span class="required">*</span></label>
          <input
            v-model="config.smtpAuthUser"
            type="text"
            required
            placeholder="user@example.com"
            class="form-input"
          />
          <p class="form-help-text">Username for SMTP authentication</p>
        </FormField>

        <FormField :error="error" path="smtpAuthPass" class="w-full">
          <label class="form-label">Password <span class="required">*</span></label>
          <SecretPasswordInput
            v-model="config.smtpAuthPass"
            required
            placeholder="..."
            class="form-input-mono"
          />
          <p class="form-help-text">Password or application-specific password</p>
        </FormField>
      </div>
    </div>

    <div class="pt-8 mt-6 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Inbound (IMAP) <span class="text-gray-500 font-normal">(optional)</span></h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">IMAP server settings for receiving replies. Leave empty to disable inbound email.</p>

      <div class="flex flex-col md:flex-row gap-3 mt-4">
        <FormField :error="error" path="imapHost" class="w-full">
          <label class="form-label">Host <span class="text-gray-500 font-normal">(optional)</span></label>
          <input
            v-model="config.imapHost"
            type="text"
            placeholder="imap.example.com"
            class="form-input"
          />
          <p class="form-help-text">IMAP server hostname</p>
        </FormField>

        <FormField :error="error" path="imapPort" class="w-full">
          <label class="form-label">Port <span class="text-gray-500 font-normal">(optional)</span></label>
          <input
            v-model="config.imapPort"
            type="number"
            placeholder="993"
            min="1"
            max="65535"
            class="form-input"
          />
          <p class="form-help-text">993 for TLS, 143 for STARTTLS</p>
        </FormField>
      </div>

      <div class="mt-3">
        <FormField :error="error" path="imapSecure">
          <label class="checkbox-label">
            <input
              v-model="config.imapSecure"
              type="checkbox"
              class="form-checkbox"
            />
            Implicit TLS
          </label>
          <p class="form-help-text">Enable for port 993 (TLS from start). Disable for port 143 with STARTTLS upgrade.</p>
        </FormField>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mt-3">
        <FormField :error="error" path="imapAuthUser" class="w-full">
          <label class="form-label">Login <span class="text-gray-500 font-normal">(optional)</span></label>
          <input
            v-model="config.imapAuthUser"
            type="text"
            placeholder="mailbox@example.com"
            class="form-input"
          />
          <p class="form-help-text">Username for IMAP authentication</p>
        </FormField>

        <FormField :error="error" path="imapAuthPass" class="w-full">
          <label class="form-label">Password <span class="text-gray-500 font-normal">(optional)</span></label>
          <SecretPasswordInput
            v-model="config.imapAuthPass"
            placeholder="..."
            class="form-input-mono"
          />
          <p class="form-help-text">Password or application-specific password</p>
        </FormField>
      </div>

      <div class="mt-3">
        <FormField :error="error" path="imapPollingIntervalMs" class="w-full">
          <label class="form-label">Polling Interval <span class="text-gray-500 font-normal">(optional)</span></label>
          <input
            v-model="config.imapPollingIntervalMs"
            type="number"
            placeholder="30000"
            min="1000"
            class="form-input"
          />
          <p class="form-help-text">Fallback polling interval in milliseconds when IMAP IDLE is unavailable (default: 30000)</p>
        </FormField>
      </div>
    </div>
  </div>
</template>
