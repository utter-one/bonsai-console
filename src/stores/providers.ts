import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ProviderResponse,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@/types/api'

export const useProvidersStore = defineStore('providers', () => {
  const store = createResourceStore<ProviderResponse, CreateProviderRequest, UpdateProviderRequest>({
    endpoint: '/providers',
    resourceName: 'provider',
  })

  return store
})
