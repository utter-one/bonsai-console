import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  EnvironmentResponse,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from '@/types/api'

export const useEnvironmentsStore = defineStore('environments', () => {
  const store = createResourceStore<EnvironmentResponse, CreateEnvironmentRequest, UpdateEnvironmentRequest>({
    endpoint: '/environments',
    resourceName: 'environment',
  })

  return store
})
