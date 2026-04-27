import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  ScenarioRunResponse,
  CreateScenarioRunRequest,
} from '@/api/types'

export const useScenarioRunsStore = defineStore('scenarioRuns', () => {
  return createProjectResourceStore<ScenarioRunResponse, CreateScenarioRunRequest, never>({
    endpoint: '/scenario-runs',
    resourceName: 'scenarioRun',
    apiResourceName: 'scenarioRuns',
  })
})
