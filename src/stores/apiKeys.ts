import { defineStore } from 'pinia'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import { createResourceStore } from './utils/resource'

export const useApiKeysStore = defineStore('apiKeys', () => {
  return createResourceStore<ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest>({
    endpoint: '/api-keys',
    resourceName: 'API key',
    apiResourceName: 'apiKeys',
  })
})
