import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  CopyDecoratorResponse,
  CreateCopyDecoratorRequest,
  UpdateCopyDecoratorRequest,
} from '@/api/types'

export const useCopyDecoratorsStore = defineStore('copyDecorators', () => {
  return createProjectResourceStore<CopyDecoratorResponse, CreateCopyDecoratorRequest, UpdateCopyDecoratorRequest>({
    endpoint: '/copy-decorators',
    resourceName: 'copyDecorator',
    apiResourceName: 'copyDecorators',
  })
})
