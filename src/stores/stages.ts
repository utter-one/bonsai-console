import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type { StageResponse, CreateStageRequest, UpdateStageRequest, ListParams } from '@/api/types'

export const useStagesStore = defineStore('stages', () => {
  const items = ref<StageResponse[]>([])
  const currentItem = ref<StageResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ total: 0, offset: 0, limit: null as number | null })

  async function fetchAll(projectId: string, flowId: string, params?: ListParams) {
    if (!projectId || !flowId) {
      items.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const data = await (apiClient as any).projectsFlowsStagesList(projectId, flowId, params)
      items.value = data.items
      pagination.value = { total: data.total, offset: data.offset, limit: data.limit }
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch stages'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(projectId: string, flowId: string, id: string) {
    isLoading.value = true
    error.value = null
    try {
      const result = await (apiClient as any).projectsFlowsStagesDetail(projectId, flowId, id)
      currentItem.value = result
      return result as StageResponse
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch stage'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(projectId: string, flowId: string, data: CreateStageRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await (apiClient as any).projectsFlowsStagesCreate(projectId, flowId, data)
      items.value = [result, ...items.value]
      return result as StageResponse
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create stage'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(projectId: string, flowId: string, id: string, data: UpdateStageRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await (apiClient as any).projectsFlowsStagesUpdate(projectId, flowId, id, data)
      items.value = items.value.map(item => item.id === id ? result : item)
      if (currentItem.value?.id === id) currentItem.value = result
      return result as StageResponse
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update stage'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(projectId: string, flowId: string, id: string, version: number) {
    isLoading.value = true
    error.value = null
    try {
      await (apiClient as any).projectsFlowsStagesDelete(projectId, flowId, id, { version })
      items.value = items.value.filter(item => item.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete stage'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return { items, currentItem, isLoading, error, pagination, fetchAll, fetchById, create, update, remove }
})
