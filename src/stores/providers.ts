import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ProviderResponse,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@/api/types'

export const useProvidersStore = defineStore('providers', () => {
  const store = createResourceStore<ProviderResponse, CreateProviderRequest, UpdateProviderRequest>({
    endpoint: '/providers',
    resourceName: 'provider',
    apiResourceName: 'providers',
  })

  return store
})
