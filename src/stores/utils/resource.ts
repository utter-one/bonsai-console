import { ref } from 'vue'
import apiClient from '@/api/client'
import type { ListParams } from '@/api/types'

export interface ResourceStoreOptions {
  endpoint: string
  resourceName: string
  // Resource name in camelCase for the generated API methods (e.g., 'admins', 'projects')
  apiResourceName: string
}

export interface ProjectResourceStoreOptions {
  endpoint: string
  resourceName: string
  // Resource name in camelCase for the generated API methods (e.g., 'personas', 'classifiers')
  // Methods will be looked up as projects{Capitalized}List, projects{Capitalized}Create, etc.
  apiResourceName: string
}

export function createProjectResourceStore<T extends { id: string }, CreateRequest, UpdateRequest>(
  options: ProjectResourceStoreOptions
) {
  const { resourceName, apiResourceName } = options

  // Build method prefix: e.g., 'personas' -> 'projectsPersonas'
  const prefix = `projects${apiResourceName.charAt(0).toUpperCase()}${apiResourceName.slice(1)}`

  const items = ref<T[]>([])
  const currentItem = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  const apiMethods = {
    list: (apiClient as any)[`${prefix}List`],
    detail: (apiClient as any)[`${prefix}Detail`],
    create: (apiClient as any)[`${prefix}Create`],
    update: (apiClient as any)[`${prefix}Update`],
    delete: (apiClient as any)[`${prefix}Delete`],
    auditLogs: (apiClient as any)[`${prefix}AuditLogsList`],
  }

  async function fetchAll(projectId: string, params?: ListParams) {
    if (!projectId) {
      items.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.list(projectId, { ...params })
      const data = response as { items: T[]; total: number; offset: number; limit: number | null }
      items.value = data.items
      pagination.value = {
        total: data.total,
        offset: data.offset,
        limit: data.limit,
      }
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch ${resourceName}s`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(projectId: string, id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.detail(projectId, id)
      currentItem.value = response as T
      return response as T
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(projectId: string, data: CreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.create(projectId, data)
      const result = response as T
      items.value = ([result, ...items.value] as any)
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to create ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(projectId: string, id: string, data: UpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.update(projectId, id, data)
      const result = response as T
      if (items.value.findIndex((item: any) => item.id === id) !== -1) {
        items.value = items.value.map((item: any) =>
          item.id === id ? result : item
        )
      }
      if (currentItem.value && (currentItem.value as any).id === id) {
        currentItem.value = result
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to update ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(projectId: string, id: string, version?: number) {
    isLoading.value = true
    error.value = null

    try {
      if (version !== undefined) {
        await apiMethods.delete(projectId, id, { version })
      } else {
        await apiMethods.delete(projectId, id)
      }
      items.value = items.value.filter((item: any) => item.id !== id)
      if (currentItem.value && (currentItem.value as any).id === id) {
        currentItem.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to delete ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuditLogs(projectId: string, id: string, params?: ListParams) {
    try {
      const response = await apiMethods.auditLogs(projectId, id, { ...params })
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch audit logs`
      throw err
    }
  }

  return {
    items,
    currentItem,
    isLoading,
    error,
    pagination,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    fetchAuditLogs,
  }
}

export function createResourceStore<T extends { id: string }, CreateRequest, UpdateRequest>(
  options: ResourceStoreOptions
) {
  const { resourceName, apiResourceName } = options

  const items = ref<T[]>([])
  const currentItem = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  // Helper to get the API methods dynamically
  const apiMethods = {
    list: (apiClient as any)[`${apiResourceName}List`],
    detail: (apiClient as any)[`${apiResourceName}Detail`],
    create: (apiClient as any)[`${apiResourceName}Create`],
    update: (apiClient as any)[`${apiResourceName}Update`],
    delete: (apiClient as any)[`${apiResourceName}Delete`],
    auditLogs: (apiClient as any)[`${apiResourceName}AuditLogsList`],
  }

  async function fetchAll(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.list({ ...params })
      const data = response as { items: T[]; total: number; offset: number; limit: number | null }
      items.value = data.items
      pagination.value = {
        total: data.total,
        offset: data.offset,
        limit: data.limit,
      }
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch ${resourceName}s`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.detail(id)
      currentItem.value = response as T
      return response as T
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(data: CreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.create(data)
      const result = response as T
      items.value = ([result, ...items.value] as any)
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to create ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(id: string, data: UpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiMethods.update(id, data)
      const result = response as T
      const index = items.value.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        items.value = items.value.map((item: any) =>
          item.id === id ? result : item
        )
      }
      if (currentItem.value && (currentItem.value as any).id === id) {
        currentItem.value = result
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to update ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: string, version?: number) {
    isLoading.value = true
    error.value = null

    try {
      // For resources that require optimistic locking, pass version in the delete request
      if (version !== undefined) {
        await apiMethods.delete(id, { version })
      } else {
        await apiMethods.delete(id)
      }
      items.value = items.value.filter((item: any) => item.id !== id)
      if (currentItem.value && (currentItem.value as any).id === id) {
        currentItem.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to delete ${resourceName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuditLogs(id: string, params?: ListParams) {
    try {
      const response = await apiMethods.auditLogs(id, { ...params })
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || `Failed to fetch audit logs`
      throw err
    }
  }

  return {
    items,
    currentItem,
    isLoading,
    error,
    pagination,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    fetchAuditLogs,
  }
}
