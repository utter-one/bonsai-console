import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@/types/api'

export const useIssuesStore = defineStore('issues', () => {
  const store = createResourceStore<IssueResponse, CreateIssueRequest, UpdateIssueRequest>({
    endpoint: '/issues',
    resourceName: 'issue',
  })

  return store
})
