import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  AgentResponse,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '@/api/types'

export const useAgentsStore = defineStore('agents', () => {
  const store = createProjectResourceStore<AgentResponse, CreateAgentRequest, UpdateAgentRequest>({
    endpoint: '/agents',
    resourceName: 'agent',
    apiResourceName: 'agents',
  })

  return store
})
