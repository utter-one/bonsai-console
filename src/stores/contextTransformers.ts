import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ContextTransformerResponse,
  CreateContextTransformerRequest,
  UpdateContextTransformerRequest,
} from '@/api/types'

export const useContextTransformersStore = defineStore('contextTransformers', () => {
  const store = createResourceStore<
    ContextTransformerResponse,
    CreateContextTransformerRequest,
    UpdateContextTransformerRequest
  >({
    endpoint: '/context-transformers',
    resourceName: 'context transformer',
    apiResourceName: 'contextTransformers',
  })

  return store
})
