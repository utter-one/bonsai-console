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

  // archive/unarchive helpers -------------------------------------------------
  async function archive(id: string, version: number) {
    try {
      const response = await (apiClient as any).projectsArchiveCreate(id, { version })
      // update stored item if present
      const idx = store.items.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        store.items.value[idx] = response
      }
      if (store.currentItem.value?.id === id) {
        store.currentItem.value = response
      }

      // refresh navigation list after archive
      await fetchUnfilteredProjects()
      return response
    } catch (err: any) {
      throw err
    }
  }

  async function unarchive(id: string, version: number) {
    try {
      const response = await (apiClient as any).projectsUnarchiveCreate(id, { version })
      const idx = store.items.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        store.items.value[idx] = response
      }
      if (store.currentItem.value?.id === id) {
        store.currentItem.value = response
      }

      // refresh navigation list after unarchive
      await fetchUnfilteredProjects()
      return response
    } catch (err: any) {
      throw err
    }
  }

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
  const unfilteredProjects = ref<ProjectResponse[]>([])
  const unfilteredProjectsLoaded = ref(false)
  const activeProjects = ref<ProjectResponse[]>([])
  const archivedProjects = ref<ProjectResponse[]>([])

  async function fetchUnfilteredProjects() {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        (apiClient as any).projectsList({ offset: 0, limit: 1000, orderBy: 'name', archived: false }),
        (apiClient as any).projectsList({ offset: 0, limit: 1000, orderBy: 'name', archived: true }),
      ])
      activeProjects.value = activeRes?.items ?? []
      archivedProjects.value = archivedRes?.items ?? []
      unfilteredProjects.value = [...activeProjects.value, ...archivedProjects.value]
      unfilteredProjectsLoaded.value = true
    } catch {
      unfilteredProjects.value = []
    }
  }

  // Wrap create/remove so we also refresh the unfiltered project cache
  async function createProject(data: CreateProjectRequest) {
    const result = await store.create(data)
    await fetchUnfilteredProjects()
    return result
  }

  async function removeProject(id: string, version?: number) {
    const result = await store.remove(id, version)
    await fetchUnfilteredProjects()
    return result
  }

  return {
    ...store,
    count,
    fetchCount,
    activeProjects,
    archivedProjects,
    unfilteredProjects,
    unfilteredProjectsLoaded,
    fetchUnfilteredProjects,
    archive,
    unarchive,
    create: createProject,
    remove: removeProject,
  }
})
