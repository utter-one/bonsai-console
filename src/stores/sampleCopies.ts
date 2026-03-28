import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  SampleCopyResponse,
  CreateSampleCopyRequest,
  UpdateSampleCopyRequest,
} from '@/api/types'

export const useSampleCopiesStore = defineStore('sampleCopies', () => {
  return createProjectResourceStore<SampleCopyResponse, CreateSampleCopyRequest, UpdateSampleCopyRequest>({
    endpoint: '/sample-copies',
    resourceName: 'sampleCopy',
    apiResourceName: 'sampleCopies',
  })
})
