import type { Component } from 'vue'
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

export interface ProviderEntry {
  component: Component
  // Extra static props to pass to the component (e.g. apiType for OpenAIConfig)
  componentProps?: (apiType: string) => Record<string, unknown>
  // Called when the API type changes; sets provider-specific config defaults
  init?: (config: ProviderConfig) => void
  // Builds the clean payload object to submit to the API
  buildConfig(config: ProviderConfig): Record<string, unknown>
  // Returns a validation error message, or null if valid
  validate(config: ProviderConfig): string | null
}

function validateApiKey(config: ProviderConfig): string | null {
  return config.apiKey ? null : 'API Key is required'
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
    validate(c) { return c.apiKey ? null : 'API Key is required for AssemblyAI' },
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
      return !c.region || !c.subscriptionKey
        ? 'Region and Subscription Key are required for Azure Speech'
        : null
    },
  },

  'azure:tts': {
    component: AzureTTSConfig,
    buildConfig(c) { return { region: c.region, subscriptionKey: c.subscriptionKey } },
    validate(c) {
      return !c.region || !c.subscriptionKey
        ? 'Region and Subscription Key are required for Azure Speech'
        : null
    },
  },

  'amazon-polly:tts': {
    component: AmazonPollyConfig,
    buildConfig(c) {
      return { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, region: c.region }
    },
    validate(c) {
      return !c.accessKeyId || !c.secretAccessKey || !c.region
        ? 'Access Key ID, Secret Access Key, and Region are required for Amazon Polly'
        : null
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
      return !c.accessKeyId || !c.secretAccessKey || !c.region
        ? 'Access Key ID, Secret Access Key, and Region are required for S3'
        : null
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
      return !c.accountName || !c.accountKey
        ? 'Account Name and Account Key are required for Azure Blob Storage'
        : null
    },
  },

  'gcs:storage': {
    component: GCSConfig,
    buildConfig(c) { return { projectId: c.projectId, keyFileJson: c.keyFileJson } },
    validate(c) {
      return !c.projectId || !c.keyFileJson
        ? 'Project ID and Key File JSON are required for Google Cloud Storage'
        : null
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
      return c.basePath ? null : 'Base Path is required for Local Storage'
    },
  },
}

export function lookupProvider(apiType: string, providerType: string): ProviderEntry | null {
  return registry[`${apiType}:${providerType}`] ?? registry[`${apiType}:*`] ?? null
}
