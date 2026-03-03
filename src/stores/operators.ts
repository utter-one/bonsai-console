import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  OperatorResponse,
  CreateOperatorRequest,
  UpdateOperatorRequest,
} from '@/api/types'

export const useOperatorsStore = defineStore('operators', () => {
  const store = createResourceStore<OperatorResponse, CreateOperatorRequest, UpdateOperatorRequest>({
    endpoint: '/operators',
    resourceName: 'operator',
    apiResourceName: 'operators',
  })

  return store
})
