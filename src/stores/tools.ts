import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ToolResponse,
  CreateToolRequest,
  UpdateToolRequest,
} from '@/types/api'

export const useToolsStore = defineStore('tools', () => {
  const store = createResourceStore<ToolResponse, CreateToolRequest, UpdateToolRequest>({
    endpoint: '/tools',
    resourceName: 'tool',
  })

  return store
})
