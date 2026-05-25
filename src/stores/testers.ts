import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  TesterResponse,
  CreateTesterRequest,
  UpdateTesterRequest,
} from '@/api/types'

export const useTestersStore = defineStore('testers', () => {
  const store = createProjectResourceStore<TesterResponse, CreateTesterRequest, UpdateTesterRequest>({
    endpoint: '/testers',
    resourceName: 'tester',
    apiResourceName: 'testers',
  })

  return store
})
