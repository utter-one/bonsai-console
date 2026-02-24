import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  StageResponse,
  CreateStageRequest,
  UpdateStageRequest,
} from '@/api/types'

export const useStagesStore = defineStore('stages', () => {
  const store = createProjectResourceStore<StageResponse, CreateStageRequest, UpdateStageRequest>({
    endpoint: '/stages',
    resourceName: 'stage',
    apiResourceName: 'stages',
  })

  return store
})
