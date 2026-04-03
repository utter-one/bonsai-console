export interface ProviderConfig {
  apiKey: string
  organizationId: string
  baseUrl: string
  region: string
  subscriptionKey: string
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  accountName: string
  accountKey: string
  projectId: string
  keyFileJson: string
  basePath: string
  // Channel config fields
  accountSid: string
  authToken: string
  fromNumber: string
  phoneNumber: string
}

export interface ProviderPreset {
  name: string
  displayName: string
  baseUrl: string
  urlPattern: RegExp
  color: string
}

export const providerPresets: ProviderPreset[] = [
  {
    name: 'ai21',
    displayName: 'AI21 Labs',
    baseUrl: 'https://api.ai21.com/studio/v1',
    urlPattern: /ai21\.com/i,
    color: '#4a9eff'
  },
  {
    name: 'cerebras',
    displayName: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    urlPattern: /cerebras\.ai/i,
    color: '#0066cc'
  },
  {
    name: 'cohere',
    displayName: 'Cohere',
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    urlPattern: /cohere\.ai/i,
    color: '#d18ee2'
  },
  {
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    urlPattern: /deepseek\.com/i,
    color: '#1a73e8'
  },
  {
    name: 'fireworks',
    displayName: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    urlPattern: /fireworks\.ai/i,
    color: '#ff6b35'
  },
  {
    name: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    urlPattern: /groq\.com/i,
    color: '#f55036'
  },
  {
    name: 'lepton',
    displayName: 'Lepton AI',
    baseUrl: 'https://api.lepton.ai/api/v1',
    urlPattern: /lepton\.ai/i,
    color: '#8b5cf6'
  },
  {
    name: 'mistral',
    displayName: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai',
    urlPattern: /mistral\.ai/i,
    color: '#f2773d'
  },
  {
    name: 'novita',
    displayName: 'Novita AI',
    baseUrl: 'https://api.novita.ai/v3/openai',
    urlPattern: /novita\.ai/i,
    color: '#22c55e'
  },
  {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    urlPattern: /openai\.com/i,
    color: '#10a37f'
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    urlPattern: /openrouter\.ai/i,
    color: '#8b5cf6'
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity AI',
    baseUrl: 'https://api.perplexity.ai',
    urlPattern: /perplexity\.ai/i,
    color: '#20808d'
  },
  {
    name: 'together',
    displayName: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    urlPattern: /together\.xyz/i,
    color: '#6366f1'
  },
  {
    name: 'xai',
    displayName: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    urlPattern: /x\.ai/i,
    color: '#000000'
  }
]
