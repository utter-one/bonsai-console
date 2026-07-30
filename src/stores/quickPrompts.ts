import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/api/client'
import { useAuthStore } from '@/stores'

export type QuickPromptCategory =
  | 'agent'
  | 'filler'
  | 'stage'
  | 'classifier'
  | 'transformer'
  | 'tester'
  | 'tool'
  | 'summarization'

export interface QuickPromptCreateRequest {
  name: string
  description?: string | null
  categoryId: QuickPromptCategory
  content: string
  tags?: string[]
  isPublic?: boolean
}

export interface QuickPromptUpdateRequest {
  name?: string
  description?: string | null
  categoryId?: QuickPromptCategory
  content?: string
  tags?: string[]
  isPublic?: boolean
}

export interface QuickPromptResponse {
  id: string
  name: string
  description: string | null
  categoryId: QuickPromptCategory
  content: string
  tags: string[]
  isPublic: boolean
  isSystem: boolean
  ownerId: string | null
  projectId: string | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface QuickPromptWithSource extends QuickPromptResponse {
  _source: 'global' | 'project'
}

export interface QuickPromptListResponse {
  items: QuickPromptResponse[]
  total: number
  offset: number
  limit: number | null
}

export const QUICK_PROMPT_CATEGORIES: QuickPromptCategory[] = [
  'agent',
  'filler',
  'stage',
  'classifier',
  'transformer',
  'tester',
  'tool',
  'summarization',
]

export const QUICK_PROMPT_CATEGORY_LABELS: Record<QuickPromptCategory, string> = {
  agent: 'Agent',
  filler: 'Filler',
  stage: 'Stage',
  classifier: 'Classifier',
  transformer: 'Transformer',
  tester: 'Tester',
  tool: 'Tool',
  summarization: 'Summarization',
}

export const useQuickPromptsStore = defineStore('quickPrompts', () => {
  const authStore = useAuthStore()

  const globalPrompts = ref<QuickPromptResponse[]>([])
  const projectPrompts = ref<QuickPromptResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  const allPrompts = computed<QuickPromptWithSource[]>(() => {
    const globalWithSource = globalPrompts.value.map(p => ({ ...p, _source: 'global' as const }))
    const projectWithSource = projectPrompts.value.map(p => ({ ...p, _source: 'project' as const }))
    return [...projectWithSource, ...globalWithSource]
  })

  function canManage(prompt: QuickPromptResponse): boolean {
    if (prompt.isSystem) return false
    if (prompt.projectId) return true
    return prompt.ownerId === authStore.currentOperator?.id
  }

  async function fetchAll(
    projectId: string,
    categoryId?: string,
    textSearch?: string
  ) {
    isLoading.value = true
    error.value = null

    try {
      const params: Record<string, string | number> = {}
      if (categoryId) params.categoryId = categoryId
      if (textSearch) params.textSearch = textSearch

      const [globalRes, projectRes] = await Promise.all([
        axiosInstance.get<QuickPromptListResponse>('/api/quick-prompts', { params }).then(r => r.data),
        axiosInstance
          .get<QuickPromptListResponse>(`/api/projects/${projectId}/quick-prompts`, { params })
          .then(r => r.data),
      ])

      globalPrompts.value = globalRes.items
      projectPrompts.value = projectRes.items
      pagination.value = {
        total: globalRes.total + projectRes.total,
        offset: 0,
        limit: null,
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch quick prompts'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Global CRUD
  async function createGlobal(data: QuickPromptCreateRequest): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post<QuickPromptResponse>('/api/quick-prompts', data)
      globalPrompts.value.unshift(response.data)
      pagination.value.total += 1
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateGlobal(
    id: string,
    version: number,
    data: QuickPromptUpdateRequest
  ): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put<QuickPromptResponse>(
        `/api/quick-prompts/${id}`,
        { ...data, version }
      )
      const idx = globalPrompts.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        globalPrompts.value[idx] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteGlobal(id: string, version: number): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/api/quick-prompts/${id}`, { data: { version } })
      globalPrompts.value = globalPrompts.value.filter(p => p.id !== id)
      pagination.value.total -= 1
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function cloneGlobal(id: string): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post<QuickPromptResponse>(
        `/api/quick-prompts/${id}/clone`
      )
      globalPrompts.value.unshift(response.data)
      pagination.value.total += 1
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to clone quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Project CRUD
  async function createProject(
    projectId: string,
    data: QuickPromptCreateRequest
  ): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post<QuickPromptResponse>(
        `/api/projects/${projectId}/quick-prompts`,
        data
      )
      projectPrompts.value.unshift(response.data)
      pagination.value.total += 1
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(
    projectId: string,
    id: string,
    version: number,
    data: QuickPromptUpdateRequest
  ): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put<QuickPromptResponse>(
        `/api/projects/${projectId}/quick-prompts/${id}`,
        { ...data, version }
      )
      const idx = projectPrompts.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        projectPrompts.value[idx] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProject(
    projectId: string,
    id: string,
    version: number
  ): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/quick-prompts/${id}`, { data: { version } })
      projectPrompts.value = projectPrompts.value.filter(p => p.id !== id)
      pagination.value.total -= 1
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function cloneProject(
    projectId: string,
    id: string
  ): Promise<QuickPromptResponse> {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post<QuickPromptResponse>(
        `/api/projects/${projectId}/quick-prompts/${id}/clone`
      )
      projectPrompts.value.unshift(response.data)
      pagination.value.total += 1
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to clone quick prompt'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    globalPrompts,
    projectPrompts,
    allPrompts,
    isLoading,
    error,
    pagination,
    canManage,
    fetchAll,
    createGlobal,
    updateGlobal,
    deleteGlobal,
    cloneGlobal,
    createProject,
    updateProject,
    deleteProject,
    cloneProject,
  }
})
