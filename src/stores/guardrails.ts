import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  GuardrailResponse,
  CreateGuardrailRequest,
  UpdateGuardrailRequest,
} from '@/api/types'

export const useGuardrailsStore = defineStore('guardrails', () => {
  const store = createProjectResourceStore<GuardrailResponse, CreateGuardrailRequest, UpdateGuardrailRequest>({
    endpoint: '/guardrails',
    resourceName: 'guardrail',
    apiResourceName: 'guardrails',
  })

  return store
})
