import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@/api/types'

export const useIssuesStore = defineStore('issues', () => {
  const baseStore = createProjectResourceStore<IssueResponse & { id: string }, CreateIssueRequest, UpdateIssueRequest>({
    endpoint: '/issues',
    resourceName: 'issue',
    apiResourceName: 'issues',
  })

  return baseStore
})
