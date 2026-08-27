import type { Component } from 'vue'
import type { ParsedError, ApiErrorDetail } from '@/api/types'
import type { ProviderConfig } from './providerPresets'
import OpenAIConfig from './OpenAIConfig.vue'
import FireworksConfig from './FireworksConfig.vue'
import TogetherConfig from './TogetherConfig.vue'
import AnthropicConfig from './AnthropicConfig.vue'
import GeminiConfig from './GeminiConfig.vue'
import OllamaConfig from './OllamaConfig.vue'
import ElevenLabsConfig from './ElevenLabsConfig.vue'
import DeepgramConfig from './DeepgramConfig.vue'
import CartesiaConfig from './CartesiaConfig.vue'
import AssemblyAIConfig from './AssemblyAIConfig.vue'
import AzureASRConfig from './AzureASRConfig.vue'
import SpeechmaticsConfig from './SpeechmaticsConfig.vue'
import SonioxConfig from './SonioxConfig.vue'
import AzureTTSConfig from './AzureTTSConfig.vue'
import AmazonPollyConfig from './AmazonPollyConfig.vue'
import S3Config from './S3Config.vue'
import AzureBlobConfig from './AzureBlobStorageConfig.vue'
import GCSConfig from './GoogleCloudStorageConfig.vue'
import LocalStorageConfig from './LocalStorageConfig.vue'
import TwilioMessagingChannelConfig from './TwilioMessagingChannelConfig.vue'
import TwilioVoiceChannelConfig from './TwilioVoiceChannelConfig.vue'
import WhatsAppChannelConfig from './WhatsAppChannelConfig.vue'
import TelegramChannelConfig from './TelegramChannelConfig.vue'
// import SendGridChannelConfig from './SendGridChannelConfig.vue'
// import SesChannelConfig from './SesChannelConfig.vue'
import SmtpImapChannelConfig from './SmtpImapChannelConfig.vue'

export interface ProviderEntry {
  component: Component
  // Extra static props to pass to the component (e.g. apiType for OpenAIConfig)
  componentProps?: (apiType: string) => Record<string, unknown>
  // Called when the API type changes; sets provider-specific config defaults
  init?: (config: ProviderConfig) => void
  // Builds the clean payload object to submit to the API
  buildConfig(config: ProviderConfig): Record<string, unknown>
  // Returns a ParsedError with field-level details, or null if valid
  validate(config: ProviderConfig): ParsedError | null
}

function validateApiKey(config: ProviderConfig): ParsedError | null {
  return config.apiKey ? null : { message: 'API Key is required', details: [{ path: ['apiKey'], message: 'API Key is required', code: 'REQUIRED' }] }
}

const openAIEntry: ProviderEntry = {
  component: OpenAIConfig,
  componentProps: (apiType) => ({ apiType }),
  buildConfig(c) {
    const cfg: Record<string, unknown> = { apiKey: c.apiKey }
    if (c.organizationId) cfg.organizationId = c.organizationId
    if (c.baseUrl) cfg.baseUrl = c.baseUrl
    return cfg
  },
  validate: validateApiKey,
}

function apiKeyBaseUrl(component: Component): ProviderEntry {
  return {
    component,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { apiKey: c.apiKey }
      if (c.baseUrl) cfg.baseUrl = c.baseUrl
      return cfg
    },
    validate: validateApiKey,
  }
}

function apiKeyOnly(component: Component): ProviderEntry {
  return {
    component,
    buildConfig(c) {
      return { apiKey: c.apiKey }
    },
    validate: validateApiKey,
  }
}

// Registry is keyed by `${apiType}:${providerType}` or `${apiType}:*` for any provider type.
const registry: Record<string, ProviderEntry> = {
  'openai:*': openAIEntry,
  'openai-legacy:*': openAIEntry,
  'groq:*': openAIEntry,
  'mistral:*': openAIEntry,
  'deepseek:*': openAIEntry,
  'xai:*': openAIEntry,
  'openrouter:*': openAIEntry,
  'perplexity:*': openAIEntry,
  'cohere:*': openAIEntry,
  'ovh:*': openAIEntry,
  'scaleway:*': openAIEntry,

  'fireworks-ai:*': apiKeyBaseUrl(FireworksConfig),
  'together-ai:*': apiKeyBaseUrl(TogetherConfig),
  'anthropic:*': apiKeyBaseUrl(AnthropicConfig),

  'gemini:*': apiKeyOnly(GeminiConfig),

  'ollama:*': {
    component: OllamaConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = {}
      if (c.baseUrl) cfg.baseUrl = c.baseUrl
      if (c.apiKey) cfg.apiKey = c.apiKey
      return cfg
    },
    validate() { return null },
  },

  'elevenlabs:*': apiKeyOnly(ElevenLabsConfig),
  'deepgram:*': apiKeyOnly(DeepgramConfig),
  'cartesia:*': apiKeyOnly(CartesiaConfig),

  'assemblyai:*': {
    component: AssemblyAIConfig,
    init(c) { if (!c.region) c.region = 'eu' },
    buildConfig(c) { return { apiKey: c.apiKey, region: c.region || 'eu' } },
    validate(c) { return c.apiKey ? null : { message: 'API Key is required', details: [{ path: ['apiKey'], message: 'API Key is required', code: 'REQUIRED' }] } },
  },

  'soniox:*': {
    component: SonioxConfig,
    init(c) { if (!c.region) c.region = 'us' },
    buildConfig(c) { return { apiKey: c.apiKey, region: c.region || 'us' } },
    validate: validateApiKey,
  },

  'speechmatics:asr': {
    component: SpeechmaticsConfig,
    init(c) { if (!c.region) c.region = 'us' },
    buildConfig(c) { return { apiKey: c.apiKey, region: c.region } },
    validate: validateApiKey,
  },

  'azure:asr': {
    component: AzureASRConfig,
    buildConfig(c) { return { region: c.region, subscriptionKey: c.subscriptionKey } },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.region) details.push({ path: ['region'], message: 'Region is required', code: 'REQUIRED' })
      if (!c.subscriptionKey) details.push({ path: ['subscriptionKey'], message: 'Subscription Key is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'azure:tts': {
    component: AzureTTSConfig,
    buildConfig(c) { return { region: c.region, subscriptionKey: c.subscriptionKey } },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.region) details.push({ path: ['region'], message: 'Region is required', code: 'REQUIRED' })
      if (!c.subscriptionKey) details.push({ path: ['subscriptionKey'], message: 'Subscription Key is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'amazon-polly:tts': {
    component: AmazonPollyConfig,
    buildConfig(c) {
      return { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, region: c.region }
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.accessKeyId) details.push({ path: ['accessKeyId'], message: 'Access Key ID is required', code: 'REQUIRED' })
      if (!c.secretAccessKey) details.push({ path: ['secretAccessKey'], message: 'Secret Access Key is required', code: 'REQUIRED' })
      if (!c.region) details.push({ path: ['region'], message: 'Region is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  's3:storage': {
    component: S3Config,
    buildConfig(c) {
      const cfg: Record<string, unknown> = {
        accessKeyId: c.accessKeyId,
        secretAccessKey: c.secretAccessKey,
        region: c.region,
      }
      if (c.endpoint) cfg.endpoint = c.endpoint
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.accessKeyId) details.push({ path: ['accessKeyId'], message: 'Access Key ID is required', code: 'REQUIRED' })
      if (!c.secretAccessKey) details.push({ path: ['secretAccessKey'], message: 'Secret Access Key is required', code: 'REQUIRED' })
      if (!c.region) details.push({ path: ['region'], message: 'Region is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'azure-blob:storage': {
    component: AzureBlobConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { accountName: c.accountName, accountKey: c.accountKey }
      if (c.endpoint) cfg.endpoint = c.endpoint
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.accountName) details.push({ path: ['accountName'], message: 'Account Name is required', code: 'REQUIRED' })
      if (!c.accountKey) details.push({ path: ['accountKey'], message: 'Account Key is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'gcs:storage': {
    component: GCSConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { projectId: c.projectId, keyFileJson: c.keyFileJson }
      if (c.apiEndpoint) cfg.apiEndpoint = c.apiEndpoint
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.projectId) details.push({ path: ['projectId'], message: 'Project ID is required', code: 'REQUIRED' })
      if (!c.keyFileJson) details.push({ path: ['keyFileJson'], message: 'Key File JSON is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'local:storage': {
    component: LocalStorageConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { basePath: c.basePath }
      if (c.baseUrl) cfg.baseUrl = c.baseUrl
      return cfg
    },
    validate(c) {
      return c.basePath ? null : { message: 'Base Path is required', details: [{ path: ['basePath'], message: 'Base Path is required', code: 'REQUIRED' }] }
    },
  },

  'twilio_messaging:channel': {
    component: TwilioMessagingChannelConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { accountSid: c.accountSid, authToken: c.authToken, fromNumber: c.fromNumber }
      if (c.processingDelayMinMs) cfg.processingDelayMinMs = c.processingDelayMinMs
      if (c.processingDelayMaxMs) cfg.processingDelayMaxMs = c.processingDelayMaxMs
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.accountSid) details.push({ path: ['accountSid'], message: 'Account SID is required', code: 'REQUIRED' })
      if (!c.authToken) details.push({ path: ['authToken'], message: 'Auth Token is required', code: 'REQUIRED' })
      if (!c.fromNumber) details.push({ path: ['fromNumber'], message: 'From Number is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'twilio_voice:channel': {
    component: TwilioVoiceChannelConfig,
    buildConfig(c) { return { accountSid: c.accountSid, authToken: c.authToken, phoneNumber: c.phoneNumber } },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.accountSid) details.push({ path: ['accountSid'], message: 'Account SID is required', code: 'REQUIRED' })
      if (!c.authToken) details.push({ path: ['authToken'], message: 'Auth Token is required', code: 'REQUIRED' })
      if (!c.phoneNumber) details.push({ path: ['phoneNumber'], message: 'Phone Number is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'whatsapp:channel': {
    component: WhatsAppChannelConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { phoneNumberId: c.phoneNumberId, accessToken: c.accessToken, appSecret: c.appSecret, verifyToken: c.verifyToken }
      if (c.processingDelayMinMs) cfg.processingDelayMinMs = c.processingDelayMinMs
      if (c.processingDelayMaxMs) cfg.processingDelayMaxMs = c.processingDelayMaxMs
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.phoneNumberId) details.push({ path: ['phoneNumberId'], message: 'Phone Number ID is required', code: 'REQUIRED' })
      if (!c.accessToken) details.push({ path: ['accessToken'], message: 'Access Token is required', code: 'REQUIRED' })
      if (!c.appSecret) details.push({ path: ['appSecret'], message: 'App Secret is required', code: 'REQUIRED' })
      if (!c.verifyToken) details.push({ path: ['verifyToken'], message: 'Verify Token is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  'telegram:channel': {
    component: TelegramChannelConfig,
    buildConfig(c) {
      const cfg: Record<string, unknown> = { botToken: c.botToken }
      if (c.processingDelayMinMs) cfg.processingDelayMinMs = c.processingDelayMinMs
      if (c.processingDelayMaxMs) cfg.processingDelayMaxMs = c.processingDelayMaxMs
      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      if (!c.botToken) details.push({ path: ['botToken'], message: 'Bot Token is required', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },

  // SendGrid and SES channels removed from backend
  // 'sendgrid:channel': {
  //   component: SendGridChannelConfig,
  //   init(c) { if (!c.threadingStrategy) c.threadingStrategy = 'messageId' },
  //   buildConfig(c) {
  //     const cfg: Record<string, unknown> = { apiKey: c.apiKey, fromAddress: c.fromAddress }
  //     if (c.threadingStrategy) cfg.threadingStrategy = c.threadingStrategy
  //     return cfg
  //   },
  //   validate(c) {
  //     const details: ApiErrorDetail[] = []
  //     if (!c.apiKey) details.push({ path: ['apiKey'], message: 'API Key is required', code: 'REQUIRED' })
  //     if (!c.fromAddress) details.push({ path: ['fromAddress'], message: 'From Address is required', code: 'REQUIRED' })
  //     return details.length ? { message: 'Please correct the configuration errors', details } : null
  //   },
  // },

  // 'ses:channel': {
  //   component: SesChannelConfig,
  //   init(c) { if (!c.threadingStrategy) c.threadingStrategy = 'messageId' },
  //   buildConfig(c) {
  //     const cfg: Record<string, unknown> = { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, region: c.region, fromAddress: c.fromAddress }
  //     if (c.threadingStrategy) cfg.threadingStrategy = c.threadingStrategy
  //     return cfg
  //   },
  //   validate(c) {
  //     const details: ApiErrorDetail[] = []
  //     if (!c.accessKeyId) details.push({ path: ['accessKeyId'], message: 'Access Key ID is required', code: 'REQUIRED' })
  //     if (!c.secretAccessKey) details.push({ path: ['secretAccessKey'], message: 'Secret Access Key is required', code: 'REQUIRED' })
  //     if (!c.region) details.push({ path: ['region'], message: 'Region is required', code: 'REQUIRED' })
  //     if (!c.fromAddress) details.push({ path: ['fromAddress'], message: 'From Address is required', code: 'REQUIRED' })
  //     return details.length ? { message: 'Please correct the configuration errors', details } : null
  //   },
  // },

  'smtp_imap:channel': {
    component: SmtpImapChannelConfig,
    componentProps: () => ({}),
    init(c) { if (!c.threadingStrategy) c.threadingStrategy = 'messageId' },
    buildConfig(c) {
      const cfg: Record<string, unknown> = {
        projectId: c.projectId,
        fromAddress: c.fromAddress,
        smtp: {
          host: c.smtpHost,
          port: parseInt(c.smtpPort, 10),
          auth: {
            user: c.smtpAuthUser,
            pass: c.smtpAuthPass,
          },
        },
      }
      if (c.smtpSecure) (cfg.smtp as any)['secure'] = true

      // OAuth2 config
      if (c.oauth2Enabled && c.oauth2TokenUrl && c.oauth2ClientId && c.oauth2Scope) {
        const oauth2: Record<string, unknown> = {
          tokenUrl: c.oauth2TokenUrl,
          clientId: c.oauth2ClientId,
          clientSecret: c.oauth2ClientSecret,
          scope: c.oauth2Scope,
        }
        if (c.oauth2AuthorizationUrl) oauth2['authorizationUrl'] = c.oauth2AuthorizationUrl
        if (c.oauth2RefreshToken) oauth2['refreshToken'] = c.oauth2RefreshToken
        if (c.oauth2AccessToken) oauth2['accessToken'] = c.oauth2AccessToken
        if (c.oauth2AccessTokenExpiry) oauth2['accessTokenExpiry'] = parseInt(c.oauth2AccessTokenExpiry, 10)
        cfg.oauth2 = oauth2
      }

      // IMAP
      const hasImap = !!c.imapHost
      if (hasImap) {
        const imap: Record<string, unknown> = {
          host: c.imapHost,
          port: parseInt(c.imapPort, 10),
          auth: {
            user: c.imapAuthUser || c.smtpAuthUser,
            pass: c.imapAuthPass || c.smtpAuthPass,
          },
        }
        if (c.imapSecure) imap['secure'] = true
        if (c.imapPollingIntervalMs) imap['pollingIntervalMs'] = parseInt(c.imapPollingIntervalMs, 10)
        cfg.imap = imap
      }
      if (c.threadingStrategy) cfg.threadingStrategy = c.threadingStrategy
      if (c.processedFolder) cfg.processedFolder = c.processedFolder
      if (c.ccBccReplyAsHandOff !== undefined) cfg.ccBccReplyAsHandOff = c.ccBccReplyAsHandOff
      if (c.processingDelayMinMs) cfg.processingDelayMinMs = c.processingDelayMinMs
      if (c.processingDelayMaxMs) cfg.processingDelayMaxMs = c.processingDelayMaxMs

      // Email-to-project routing
      const routingEntries = Object.entries(c.emailToProject || {})
        .filter(([email, entry]) => {
          if (!email.trim() || email.startsWith('__new_')) return false
          if (typeof entry === 'string') return entry.length > 0
          return entry.projectId
        })
      if (routingEntries.length > 0) {
        cfg.emailToProject = Object.fromEntries(routingEntries)
      }

      return cfg
    },
    validate(c) {
      const details: ApiErrorDetail[] = []
      const hasRouting = Object.entries(c.emailToProject || {}).some(([email, entry]) => {
        if (!email.trim() || email.startsWith('__new_')) return false
        if (typeof entry === 'string') return entry.length > 0
        return !!entry.projectId
      })

      if (!c.projectId && !hasRouting) details.push({ path: ['projectId'], message: 'Project ID is required when no routing rules are configured', code: 'REQUIRED' })
      if (!c.fromAddress) details.push({ path: ['fromAddress'], message: 'From Address is required', code: 'REQUIRED' })
      if (!c.smtpHost) details.push({ path: ['smtpHost'], message: 'SMTP Host is required', code: 'REQUIRED' })
      if (!c.smtpPort) details.push({ path: ['smtpPort'], message: 'SMTP Port is required', code: 'REQUIRED' })
      if (!c.smtpAuthUser) details.push({ path: ['smtpAuthUser'], message: 'SMTP Auth User (email) is required', code: 'REQUIRED' })

      if (c.oauth2Enabled) {
        // OAuth2 mode
        if (!c.oauth2TokenUrl) details.push({ path: ['oauth2TokenUrl'], message: 'OAuth2 Token URL is required', code: 'REQUIRED' })
        if (!c.oauth2AuthorizationUrl) details.push({ path: ['oauth2AuthorizationUrl'], message: 'OAuth2 Authorization URL is required', code: 'REQUIRED' })
        if (!c.oauth2ClientId) details.push({ path: ['oauth2ClientId'], message: 'OAuth2 Client ID is required', code: 'REQUIRED' })
        if (!c.oauth2ClientSecret) details.push({ path: ['oauth2ClientSecret'], message: 'OAuth2 Client Secret is required', code: 'REQUIRED' })
        if (!c.oauth2Scope) details.push({ path: ['oauth2Scope'], message: 'OAuth2 Scope is required', code: 'REQUIRED' })
      } else {
        // Password mode
        if (!c.smtpAuthPass) details.push({ path: ['smtpAuthPass'], message: 'SMTP Auth Password is required', code: 'REQUIRED' })
      }

      // IMAP validation
      if (c.imapHost && !c.imapPort) details.push({ path: ['imapPort'], message: 'IMAP Port is required when IMAP host is set', code: 'REQUIRED' })
      if (c.imapPort && !c.imapHost) details.push({ path: ['imapHost'], message: 'IMAP Host is required when IMAP port is set', code: 'REQUIRED' })
      if (!c.oauth2Enabled && c.imapHost && !c.imapAuthUser) details.push({ path: ['imapAuthUser'], message: 'IMAP Auth User is required when IMAP host is set', code: 'REQUIRED' })
      if (!c.oauth2Enabled && c.imapHost && !c.imapAuthPass) details.push({ path: ['imapAuthPass'], message: 'IMAP Auth Password is required when IMAP host is set', code: 'REQUIRED' })
      return details.length ? { message: 'Please correct the configuration errors', details } : null
    },
  },
}

export function lookupProvider(apiType: string, providerType: string): ProviderEntry | null {
  return registry[`${apiType}:${providerType}`] ?? registry[`${apiType}:*`] ?? null
}
