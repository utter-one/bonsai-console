import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  SnapshotResponse,
  SnapshotFullResponse,
  SnapshotListResponse,
  CreateSnapshotRequest,
  UpdateSnapshotNameRequest,
  SnapshotComparisonResponse,
  SnapshotRestoreResponse,
} from '@/api/types'
import { parseApiError } from '@/utils/errors'
import type { ParsedError } from '@/api/types'

export const useSnapshotsStore = defineStore('snapshots', () => {
  const items = ref<SnapshotResponse[]>([])
  const currentItem = ref<SnapshotFullResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<ParsedError | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  const comparison = ref<SnapshotComparisonResponse | null>(null)
  const isComparing = ref(false)
  const comparisonError = ref<ParsedError | null>(null)

  const restoreResult = ref<SnapshotRestoreResponse | null>(null)
  const isRestoring = ref(false)
  const restoreError = ref<ParsedError | null>(null)

  async function fetchAll(projectId: string, params?: { offset?: number; limit?: number; textSearch?: string | null }) {
    if (!projectId) {
      items.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsSnapshotsList(projectId, { ...params })
      const data = response as SnapshotListResponse
      items.value = data.items
      pagination.value = {
        total: data.total,
        offset: data.offset,
        limit: data.limit,
      }
      return data
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(projectId: string, snapshotId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsSnapshotsDetail(projectId, snapshotId)
      currentItem.value = response as SnapshotFullResponse
      return response as SnapshotFullResponse
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchByVersion(projectId: string, version: number) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsSnapshotsVersionDetail(projectId, String(version))
      currentItem.value = response as SnapshotFullResponse
      return response as SnapshotFullResponse
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(projectId: string, data: CreateSnapshotRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsSnapshotsCreate(projectId, data)
      const result = response as SnapshotResponse
      items.value = [result, ...items.value]
      return result
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateName(projectId: string, snapshotId: string, data: UpdateSnapshotNameRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsSnapshotsPartialUpdate(projectId, snapshotId, data)
      const result = response as SnapshotResponse
      const index = items.value.findIndex((item) => item.id === snapshotId)
      if (index !== -1) {
        items.value[index] = result
      }
      if (currentItem.value && currentItem.value.id === snapshotId) {
        currentItem.value = { ...currentItem.value, name: result.name }
      }
      return result
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(projectId: string, snapshotId: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.projectsSnapshotsDelete(projectId, snapshotId)
      items.value = items.value.filter((item) => item.id !== snapshotId)
      if (currentItem.value && currentItem.value.id === snapshotId) {
        currentItem.value = null
      }
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function compare(projectId: string, fromVersion: number, toVersion: number) {
    isComparing.value = true
    comparisonError.value = null
    comparison.value = null

    try {
      const response = await apiClient.projectsSnapshotsCompareList(projectId, { fromVersion, toVersion })
      comparison.value = response as SnapshotComparisonResponse
      return comparison.value
    } catch (err: any) {
      comparisonError.value = parseApiError(err)
      throw err
    } finally {
      isComparing.value = false
    }
  }

  async function restore(projectId: string, snapshotId: string) {
    isRestoring.value = true
    restoreError.value = null
    restoreResult.value = null

    try {
      const response = await apiClient.projectsSnapshotsRestoreCreate(projectId, snapshotId)
      restoreResult.value = response as SnapshotRestoreResponse
      return restoreResult.value
    } catch (err: any) {
      restoreError.value = parseApiError(err)
      throw err
    } finally {
      isRestoring.value = false
    }
  }

  function resetComparison() {
    comparison.value = null
    comparisonError.value = null
  }

  function resetRestore() {
    restoreResult.value = null
    restoreError.value = null
  }

  return {
    items,
    currentItem,
    isLoading,
    error,
    pagination,
    comparison,
    isComparing,
    comparisonError,
    restoreResult,
    isRestoring,
    restoreError,
    fetchAll,
    fetchById,
    fetchByVersion,
    create,
    updateName,
    remove,
    compare,
    restore,
    resetComparison,
    resetRestore,
  }
})
