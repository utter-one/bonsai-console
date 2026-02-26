import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  FlowResponse,
  CreateFlowRequest,
  UpdateFlowRequest,
} from '@/api/types'

export const useFlowsStore = defineStore('flows', () => {
  const store = createProjectResourceStore<FlowResponse, CreateFlowRequest, UpdateFlowRequest>({
    endpoint: '/flows',
    resourceName: 'flow',
    apiResourceName: 'flows',
  })

  return store
})
