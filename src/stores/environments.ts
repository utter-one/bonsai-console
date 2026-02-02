import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  EnvironmentResponse,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from '@/api/types'

export const useEnvironmentsStore = defineStore('environments', () => {
  const store = createResourceStore<EnvironmentResponse, CreateEnvironmentRequest, UpdateEnvironmentRequest>({
    endpoint: '/environments',
    resourceName: 'environment',
    apiResourceName: 'environments',
  })

  return store
})
