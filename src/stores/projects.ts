import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import apiClient from '@/api/client'
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

  const count = ref<number | null>(null)

  async function fetchCount() {
    try {
      const response = await (apiClient as any).projectsList({ limit: 1 })
      count.value = response?.total ?? 0
    } catch {
      count.value = null
    }
  }

  // Dedicated project list for navigation/layout use — unaffected by view-level fetchAll() calls
  const navProjects = ref<ProjectResponse[]>([])
  const navProjectsLoaded = ref(false)

  async function fetchNavProjects() {
    try {
      const response = await (apiClient as any).projectsList({ offset: 0, limit: 1000, orderBy: 'name' })
      navProjects.value = response?.items ?? []
      navProjectsLoaded.value = true
    } catch {
      navProjects.value = []
    }
  }

  return { ...store, count, fetchCount, navProjects, navProjectsLoaded, fetchNavProjects }
})
