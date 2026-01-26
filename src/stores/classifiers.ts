import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ClassifierResponse,
  CreateClassifierRequest,
  UpdateClassifierRequest,
} from '@/types/api'

export const useClassifiersStore = defineStore('classifiers', () => {
  const store = createResourceStore<ClassifierResponse, CreateClassifierRequest, UpdateClassifierRequest>({
    endpoint: '/classifiers',
    resourceName: 'classifier',
  })

  return store
})
