import { defineStore } from 'pinia'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import { createProjectResourceStore, createResourceStore } from './utils/resource'

export const useApiKeysStore = defineStore('apiKeys', () => {
  return createProjectResourceStore<ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest>({
    endpoint: '/api-keys',
    resourceName: 'API key',
    apiResourceName: 'apiKeys',
  })
})

export const useAllApiKeysStore = defineStore('allApiKeys', () => {
  return createResourceStore<ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest>({
    endpoint: '/api-keys',
    resourceName: 'API key',
    apiResourceName: 'apiKeys',
  })
})
