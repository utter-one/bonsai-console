<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SecretPasswordInput from '@/components/SecretPasswordInput.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import apiClient from '@/api/client'
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  error?: ParsedError | null
  providerId?: string
}>()

const config = defineModel<ProviderConfig>('config', { required: true })

const oauth2Loading = ref(false)
const oauth2Refreshing = ref(false)
const oauth2Result = ref<{ success: boolean; message: string } | null>(null)

const isOAuth2Mode = computed(() => config.value.oauth2Enabled)

const tokenExpiryDate = computed(() => {
  if (!config.value.oauth2AccessTokenExpiry) return null
  const ts = parseInt(config.value.oauth2AccessTokenExpiry, 10)
  if (isNaN(ts)) return null
  return new Date(ts)
})

const isTokenValid = computed(() => {
  if (!tokenExpiryDate.value) return false
  return tokenExpiryDate.value.getTime() > Date.now()
})

const tokenExpiryRelative = computed(() => {
  if (!tokenExpiryDate.value) return ''
  const diff = tokenExpiryDate.value.getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
})

function getRedirectUrl(): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '')
  return `${baseUrl}/api/email/smtp-imap/oauth2/callback`
}

async function handleOAuth2Authorize() {
  oauth2Loading.value = true
  oauth2Result.value = null

  try {
    const res = await apiClient.emailSmtpImapOauth2AuthorizeCreate({
      providerId: props.providerId!,
      tokenUrl: config.value.oauth2TokenUrl,
      authorizationUrl: config.value.oauth2AuthorizationUrl,
      clientId: config.value.oauth2ClientId,
      clientSecret: config.value.oauth2ClientSecret,
      scope: config.value.oauth2Scope,
      redirectUrl: getRedirectUrl(),
    })

    window.open(res.authorizationUrl, '_blank', 'width=600,height=700')
  } catch (err: any) {
    console.error('OAuth2 authorize failed:', err)
    oauth2Result.value = { success: false, message: err.response?.data?.message || 'Failed to start OAuth2 flow' }
  } finally {
    oauth2Loading.value = false
  }
}

async function handleOAuth2Refresh() {
  if (!props.providerId) return
  oauth2Refreshing.value = true
  oauth2Result.value = null

  try {
    const res = await apiClient.emailSmtpImapOauth2RefreshCreate({
      providerId: props.providerId,
    })

    if (res.success && res.accessTokenExpiry) {
      config.value.oauth2AccessTokenExpiry = String(res.accessTokenExpiry)
    }
    oauth2Result.value = { success: res.success, message: res.success ? 'Token refreshed successfully' : 'Failed to refresh token' }
    setTimeout(() => { oauth2Result.value = null }, 5000)
  } catch (err: any) {
    console.error('OAuth2 refresh failed:', err)
    oauth2Result.value = { success: false, message: err.response?.data?.message || 'Failed to refresh token' }
    setTimeout(() => { oauth2Result.value = null }, 5000)
  } finally {
    oauth2Refreshing.value = false
  }
}

function fillGmailDefaults() {
  if (!config.value.oauth2TokenUrl) {
    config.value.oauth2TokenUrl = 'https://oauth2.googleapis.com/token'
  }
  if (!config.value.oauth2AuthorizationUrl) {
    config.value.oauth2AuthorizationUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  }
  if (!config.value.oauth2Scope) {
    config.value.oauth2Scope = 'https://mail.google.com/'
  }
}

function fillMicrosoftDefaults() {
  if (!config.value.oauth2TokenUrl) {
    config.value.oauth2TokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  }
  if (!config.value.oauth2AuthorizationUrl) {
    config.value.oauth2AuthorizationUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
  }
  if (!config.value.oauth2Scope) {
    config.value.oauth2Scope = 'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access'
  }
}
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
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Authentication Mode</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">Choose between password-based authentication or OAuth2 (recommended for Gmail)</p>

      <div class="flex gap-4 mb-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            v-model="config.oauth2Enabled"
            :value="false"
            class="form-checkbox"
            style="border-radius: 50%"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            v-model="config.oauth2Enabled"
            :value="true"
            class="form-checkbox"
            style="border-radius: 50%"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth2 (XOAUTH2)</span>
        </label>
      </div>
    </div>

    <!-- Password Auth Section -->
    <div v-if="!isOAuth2Mode" class="pt-6 border-t border-gray-200 dark:border-gray-700">
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

    <!-- OAuth2 Auth Section -->
    <div v-else class="pt-6 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">OAuth2 Configuration</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">Configure OAuth2 credentials, then connect to authorize access. Gmail is the primary supported provider.</p>

      <div class="mb-4">
        <div class="flex gap-2">
          <button
            type="button"
            @click="fillGmailDefaults"
            class="btn-sm btn-alt"
          >
            Use Gmail Defaults
          </button>
          <button
            type="button"
            @click="fillMicrosoftDefaults"
            class="btn-sm btn-alt"
          >
            Use Microsoft 365 Defaults
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Fills in the provider's token URL, authorization URL, and scope</p>
      </div>

      <div class="flex flex-col md:flex-row gap-3">
        <FormField :error="error" path="oauth2TokenUrl" class="w-full">
          <label class="form-label">Token URL <span class="required">*</span></label>
          <input
            v-model="config.oauth2TokenUrl"
            type="url"
            placeholder="https://oauth2.googleapis.com/token"
            class="form-input"
          />
          <p class="form-help-text">OAuth2 token endpoint URL</p>
        </FormField>

        <FormField :error="error" path="oauth2AuthorizationUrl" class="w-full">
          <label class="form-label">Authorization URL <span class="required">*</span></label>
          <input
            v-model="config.oauth2AuthorizationUrl"
            type="url"
            placeholder="https://accounts.google.com/o/oauth2/v2/auth"
            class="form-input"
          />
          <p class="form-help-text">OAuth2 authorization endpoint URL</p>
        </FormField>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mt-3">
        <FormField :error="error" path="oauth2ClientId" class="w-full">
          <label class="form-label">Client ID <span class="required">*</span></label>
          <input
            v-model="config.oauth2ClientId"
            type="text"
            placeholder="YOUR_CLIENT_ID.apps.googleusercontent.com"
            class="form-input"
          />
          <p class="form-help-text">OAuth2 client ID from Google Cloud Console</p>
        </FormField>

        <FormField :error="error" path="oauth2ClientSecret" class="w-full">
          <label class="form-label">Client Secret <span class="required">*</span></label>
          <SecretPasswordInput
            v-model="config.oauth2ClientSecret"
            placeholder="..."
            class="form-input-mono"
          />
          <p class="form-help-text">OAuth2 client secret (stored securely)</p>
        </FormField>
      </div>

      <div class="mt-3">
        <FormField :error="error" path="oauth2Scope" class="w-full">
          <label class="form-label">Scope <span class="required">*</span></label>
          <input
            v-model="config.oauth2Scope"
            type="text"
            placeholder="https://mail.google.com/"
            class="form-input"
          />
          <p class="form-help-text">OAuth2 scope: https://mail.google.com/ for full mailbox access</p>
        </FormField>
      </div>

      <div class="mt-5 flex flex-col md:flex-row gap-3 items-end">
        <button
          type="button"
          @click="handleOAuth2Authorize"
          class="btn-primary"
          :disabled="oauth2Loading || !config.oauth2ClientId || !config.oauth2ClientSecret || !config.oauth2TokenUrl"
        >
          <ExternalLink v-if="!oauth2Loading" class="inline-block mr-2 w-4 h-4" />
          <Loader2 v-else class="inline-block mr-2 w-4 h-4 animate-spin" />
          {{ oauth2Loading ? 'Opening...' : 'Connect with OAuth2' }}
        </button>
        <p class="text-xs text-gray-500 dark:text-gray-400">Opens a popup for the user to authorize access to their email account</p>
      </div>

      <!-- OAuth2 Result -->
      <div v-if="oauth2Result" :class="oauth2Result.success ? 'alert-success' : 'alert-error'" class="mt-4">
        <CheckCircle v-if="oauth2Result.success" class="inline-block mr-2 w-4 h-4" />
        <AlertCircle v-else class="inline-block mr-2 w-4 h-4" />
        {{ oauth2Result.message }}
      </div>

      <!-- Token Status -->
      <div v-if="config.oauth2AccessTokenExpiry" class="mt-5 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h5 class="text-sm font-semibold text-gray-900 dark:text-white">OAuth2 Token Status</h5>
            <div class="flex items-center gap-2 mt-1">
              <CheckCircle v-if="isTokenValid" class="w-4 h-4 text-green-500" />
              <AlertCircle v-else class="w-4 h-4 text-red-500" />
              <span class="text-sm" :class="isTokenValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                {{ isTokenValid ? 'Valid' : 'Expired' }} · {{ tokenExpiryRelative }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Expires: {{ tokenExpiryDate ? tokenExpiryDate.toLocaleString() : 'Unknown' }}
            </p>
          </div>
          <button
            type="button"
            @click="handleOAuth2Refresh"
            class="btn-sm btn-alt"
            :disabled="oauth2Refreshing"
          >
            <Loader2 v-if="oauth2Refreshing" class="inline-block mr-1 w-3 h-3 animate-spin" />
            <RefreshCw v-else class="inline-block mr-1 w-3 h-3" />
            {{ oauth2Refreshing ? 'Refreshing...' : 'Refresh Token' }}
          </button>
        </div>
      </div>

      <!-- SMTP server settings still needed for OAuth2 -->
      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h5 class="text-base font-semibold text-gray-900 dark:text-white">SMTP Server <span class="required">*</span></h5>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">SMTP server settings are still required for sending emails (authentication uses OAuth2)</p>

        <div class="flex flex-col md:flex-row gap-3">
          <FormField :error="error" path="smtpHost" class="w-full">
            <label class="form-label">Host <span class="required">*</span></label>
            <input
              v-model="config.smtpHost"
              type="text"
              required
              placeholder="smtp.gmail.com"
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

        <div class="mt-3">
          <FormField :error="error" path="smtpAuthUser" class="w-full">
            <label class="form-label">Login <span class="required">*</span></label>
            <input
              v-model="config.smtpAuthUser"
              type="text"
              required
              placeholder="user@example.com"
              class="form-input"
            />
            <p class="form-help-text">Email address for SMTP authentication (used as the OAuth2 identity)</p>
          </FormField>
        </div>
      </div>
    </div>

    <!-- IMAP Section (shared) -->
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

      <div v-if="!isOAuth2Mode" class="flex flex-col md:flex-row gap-3 mt-3">
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
