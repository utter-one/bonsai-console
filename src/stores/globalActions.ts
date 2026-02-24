import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  GlobalActionResponse,
  CreateGlobalActionRequest,
  UpdateGlobalActionRequest,
} from '@/api/types'

export const useGlobalActionsStore = defineStore('globalActions', () => {
  const store = createProjectResourceStore<GlobalActionResponse, CreateGlobalActionRequest, UpdateGlobalActionRequest>({
    endpoint: '/global-actions',
    resourceName: 'global action',
    apiResourceName: 'globalActions',
  })

  return store
})
