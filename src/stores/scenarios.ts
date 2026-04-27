import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  ScenarioResponse,
  CreateScenarioRequest,
  UpdateScenarioRequest,
} from '@/api/types'

export const useScenariosStore = defineStore('scenarios', () => {
  const store = createProjectResourceStore<ScenarioResponse, CreateScenarioRequest, UpdateScenarioRequest>({
    endpoint: '/scenarios',
    resourceName: 'scenario',
    apiResourceName: 'scenarios',
  })

  return store
})
