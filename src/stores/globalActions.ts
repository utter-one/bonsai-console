import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  GlobalActionResponse,
  CreateGlobalActionRequest,
  UpdateGlobalActionRequest,
} from '@/types/api'

export const useGlobalActionsStore = defineStore('globalActions', () => {
  const store = createResourceStore<GlobalActionResponse, CreateGlobalActionRequest, UpdateGlobalActionRequest>({
    endpoint: '/global-actions',
    resourceName: 'global action',
  })

  return store
})
