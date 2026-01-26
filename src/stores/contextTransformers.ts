import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ContextTransformerResponse,
  CreateContextTransformerRequest,
  UpdateContextTransformerRequest,
} from '@/types/api'

export const useContextTransformersStore = defineStore('contextTransformers', () => {
  const store = createResourceStore<
    ContextTransformerResponse,
    CreateContextTransformerRequest,
    UpdateContextTransformerRequest
  >({
    endpoint: '/context-transformers',
    resourceName: 'context transformer',
  })

  return store
})
