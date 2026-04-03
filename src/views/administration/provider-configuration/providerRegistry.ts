import type { Component } from 'vue'
import type { ParsedError, ApiErrorDetail } from '@/api/types'
import type { ProviderConfig } from './providerPresets'
import OpenAIConfig from './OpenAIConfig.vue'
import FireworksConfig from './FireworksConfig.vue'
import TogetherConfig from './TogetherConfig.vue'
import AnthropicConfig from './AnthropicConfig.vue'
import GeminiConfig from './GeminiConfig.vue'
import ElevenLabsConfig from './ElevenLabsConfig.vue'
import DeepgramConfig from './DeepgramConfig.vue'
import CartesiaConfig from './CartesiaConfig.vue'
import AssemblyAIConfig from './AssemblyAIConfig.vue'
import AzureASRConfig from './AzureASRConfig.vue'
import SpeechmaticsConfig from './SpeechmaticsConfig.vue'
import AzureTTSConfig from './AzureTTSConfig.vue'
import AmazonPollyConfig from './AmazonPollyConfig.vue'
import S3Config from './S3Config.vue'
import AzureBlobConfig from './AzureBlobStorageConfig.vue'
import GCSConfig from './GoogleCloudStorageConfig.vue'
import LocalStorageConfig from './LocalStorageConfig.vue'
import TwilioMessagingChannelConfig from './TwilioMessagingChannelConfig.vue'
import TwilioVoiceChannelConfig from './TwilioVoiceChannelConfig.vue'

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

  'fireworks-ai:*': apiKeyBaseUrl(FireworksConfig),
  'together-ai:*': apiKeyBaseUrl(TogetherConfig),
  'anthropic:*': apiKeyBaseUrl(AnthropicConfig),

  'gemini:*': apiKeyOnly(GeminiConfig),
  'elevenlabs:*': apiKeyOnly(ElevenLabsConfig),
  'deepgram:*': apiKeyOnly(DeepgramConfig),
  'cartesia:*': apiKeyOnly(CartesiaConfig),

  'assemblyai:*': {
    component: AssemblyAIConfig,
    init(c) { if (!c.region) c.region = 'eu' },
    buildConfig(c) { return { apiKey: c.apiKey, region: c.region || 'eu' } },
    validate(c) { return c.apiKey ? null : { message: 'API Key is required', details: [{ path: ['apiKey'], message: 'API Key is required', code: 'REQUIRED' }] } },
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
    buildConfig(c) { return { projectId: c.projectId, keyFileJson: c.keyFileJson } },
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
    buildConfig(c) { return { accountSid: c.accountSid, authToken: c.authToken, fromNumber: c.fromNumber } },
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
}

export function lookupProvider(apiType: string, providerType: string): ProviderEntry | null {
  return registry[`${apiType}:${providerType}`] ?? registry[`${apiType}:*`] ?? null
}
