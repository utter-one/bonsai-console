import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  ToolResponse,
  CreateToolRequest,
  UpdateToolRequest,
} from '@/api/types'

export const useToolsStore = defineStore('tools', () => {
  const store = createProjectResourceStore<ToolResponse, CreateToolRequest, UpdateToolRequest>({
    endpoint: '/tools',
    resourceName: 'tool',
    apiResourceName: 'tools',
  })

  return store
})
