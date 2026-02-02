import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  StageResponse,
  CreateStageRequest,
  UpdateStageRequest,
} from '@/api/types'

export const useStagesStore = defineStore('stages', () => {
  const store = createResourceStore<StageResponse, CreateStageRequest, UpdateStageRequest>({
    endpoint: '/stages',
    resourceName: 'stage',
    apiResourceName: 'stages',
  })

  return store
})
