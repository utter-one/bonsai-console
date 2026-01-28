import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@/types/api'

export const useIssuesStore = defineStore('issues', () => {
  // Note: IssueResponse has numeric id, but we extend to convert for resource store compatibility
  const baseStore = createResourceStore<IssueResponse & { id: string }, CreateIssueRequest, UpdateIssueRequest>({
    endpoint: '/issues',
    resourceName: 'issue',
  })

  return baseStore
})
