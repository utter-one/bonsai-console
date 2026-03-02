import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@/api/types'

export const useIssuesStore = defineStore('issues', () => {
  const baseStore = createResourceStore<IssueResponse, CreateIssueRequest, UpdateIssueRequest>({
    endpoint: '/issues',
    resourceName: 'issue',
    apiResourceName: 'issues',
  })

  return baseStore
})
