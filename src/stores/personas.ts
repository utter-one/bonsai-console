import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  PersonaResponse,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from '@/types/api'

export const usePersonasStore = defineStore('personas', () => {
  const store = createResourceStore<PersonaResponse, CreatePersonaRequest, UpdatePersonaRequest>({
    endpoint: '/personas',
    resourceName: 'persona',
  })

  return store
})
