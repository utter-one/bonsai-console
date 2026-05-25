import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  ScenarioRunResponse,
  CreateScenarioRunRequest,
} from '@/api/types'
import apiClient from '@/api/client'
import { parseApiError } from '@/utils/errors'

export const useScenarioRunsStore = defineStore('scenarioRuns', () => {
  const store = createProjectResourceStore<ScenarioRunResponse, CreateScenarioRunRequest, never>({
    endpoint: '/scenario-runs',
    resourceName: 'scenarioRun',
    apiResourceName: 'scenarioRuns',
  })

  async function cancel(projectId: string, id: string) {
    store.error.value = null
    try {
      const result = await (apiClient as any).projectsScenarioRunsCancelCreate(projectId, id) as ScenarioRunResponse
      store.items.value = store.items.value.map((item: any) => item.id === id ? result : item)
      return result
    } catch (err: any) {
      store.error.value = parseApiError(err)
      throw err
    }
  }

  return { ...store, cancel }
})
