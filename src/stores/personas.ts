import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  PersonaResponse,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from '@/api/types'

export const usePersonasStore = defineStore('personas', () => {
  const store = createProjectResourceStore<PersonaResponse, CreatePersonaRequest, UpdatePersonaRequest>({
    endpoint: '/personas',
    resourceName: 'persona',
    apiResourceName: 'personas',
  })

  return store
})
