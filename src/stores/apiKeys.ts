import { defineStore } from 'pinia'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import { createProjectResourceStore } from './utils/resource'

export const useApiKeysStore = defineStore('apiKeys', () => {
  return createProjectResourceStore<ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest>({
    endpoint: '/api-keys',
    resourceName: 'API key',
    apiResourceName: 'apiKeys',
  })
})
