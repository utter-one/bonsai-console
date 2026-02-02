import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/api/types'

export const useProjectsStore = defineStore('projects', () => {
  const store = createResourceStore<ProjectResponse, CreateProjectRequest, UpdateProjectRequest>({
    endpoint: '/projects',
    resourceName: 'project',
    apiResourceName: 'projects',
  })

  return store
})
