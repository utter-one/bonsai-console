import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  ClassifierResponse,
  CreateClassifierRequest,
  UpdateClassifierRequest,
} from '@/api/types'

export const useClassifiersStore = defineStore('classifiers', () => {
  const store = createProjectResourceStore<ClassifierResponse, CreateClassifierRequest, UpdateClassifierRequest>({
    endpoint: '/classifiers',
    resourceName: 'classifier',
    apiResourceName: 'classifiers',
  })

  return store
})
