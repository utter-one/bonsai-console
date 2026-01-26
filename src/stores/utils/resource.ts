import { ref } from 'vue'
import apiClient from '@/api/client'
import type { PaginationParams, PaginatedResponse } from '@/types/api'

export interface ResourceStoreOptions {
  endpoint: string
  resourceName: string
}

export function createResourceStore<T extends { id: string }, CreateRequest, UpdateRequest>(
  options: ResourceStoreOptions
) {
  const { endpoint, resourceName } = options

  const items = ref<T[]>([])
  const currentItem = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchAll(params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<T>>(endpoint, { params })
      items.value = response.data.items
      pagination.value = {
        total: response.data.total,
        offset: response.data.offset,
        limit: response.data.limit,
      }
      return response.data
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
      const response = await apiClient.get<T>(`${endpoint}/${id}`)
      currentItem.value = response.data
      return response.data
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
      const response = await apiClient.post<T>(endpoint, data)
      items.value = [response.data, ...items.value] as any
      return response.data
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
      const response = await apiClient.put<T>(`${endpoint}/${id}`, data)
      const index = items.value.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        items.value = items.value.map((item: any) => 
          item.id === id ? response.data : item
        )
      }
      if (currentItem.value && (currentItem.value as any).id === id) {
        currentItem.value = response.data
      }
      return response.data
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
      // For resources that require optimistic locking, send version in body
      if (version !== undefined) {
        await apiClient.delete(`${endpoint}/${id}`, { data: { version } })
      } else {
        await apiClient.delete(`${endpoint}/${id}`)
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

  async function fetchAuditLogs(id: string, params?: PaginationParams) {
    try {
      const response = await apiClient.get(`${endpoint}/${id}/audit-logs`, { params })
      return response.data
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
