import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type { DeferredProcessingEntry, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'

export interface DeferredProcessingListParams {
  offset?: number
  limit?: number
  status?: 'pending' | 'processed' | 'failed' | 'cancelled'
  conversationId?: string
  channelType?: string
}

export const useDeferredProcessingStore = defineStore('deferredProcessing', () => {
  const items = ref<DeferredProcessingEntry[]>([])
  const currentItem = ref<DeferredProcessingEntry | null>(null)
  const isLoading = ref(false)
  const error = ref<ParsedError | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchAll(projectId: string, params?: DeferredProcessingListParams) {
    if (!projectId) {
      items.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsDeferredProcessingList(projectId, params)
      const data = response as { items: DeferredProcessingEntry[]; total: number; offset: number; limit: number | null }
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

  async function fetchById(projectId: string, id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsDeferredProcessingDetail(projectId, id)
      currentItem.value = response as DeferredProcessingEntry
      return response as DeferredProcessingEntry
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function reschedule(projectId: string, id: string, processAt: string | null) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsDeferredProcessingRescheduleCreate(
        projectId,
        id,
        { processAt }
      )
      const result = response as DeferredProcessingEntry
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = result
      }
      if (currentItem.value && currentItem.value.id === id) {
        currentItem.value = result
      }
      return result
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function cancel(projectId: string, id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsDeferredProcessingCancelCreate(
        projectId,
        id,
        {}
      )
      const result = response as DeferredProcessingEntry
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = result
      }
      if (currentItem.value && currentItem.value.id === id) {
        currentItem.value = result
      }
      return result
    } catch (err: any) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
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
    reschedule,
    cancel,
  }
})
