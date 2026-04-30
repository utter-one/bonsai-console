import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  BenchmarkConfigResponse,
  CreateBenchmarkConfigRequest,
  UpdateBenchmarkConfigRequest,
  ParsedError,
} from '@/api/types'
import { parseApiError } from '@/utils/errors'

export const useBenchmarkConfigsStore = defineStore('benchmarkConfigs', () => {
  const items = ref<BenchmarkConfigResponse[]>([])
  const currentItem = ref<BenchmarkConfigResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<ParsedError | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchBySuite(suiteId: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.benchmarksSuitesConfigsList(suiteId)
      const data = response as { items: BenchmarkConfigResponse[]; total: number; offset: number; limit: number | null }
      items.value = data.items
      pagination.value = { total: data.total, offset: data.offset, limit: data.limit }
    } catch (err) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.benchmarksConfigsDetail(id)
      currentItem.value = response as BenchmarkConfigResponse
      return currentItem.value
    } catch (err) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(data: CreateBenchmarkConfigRequest) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.benchmarksConfigsCreate(data)
      const result = response as BenchmarkConfigResponse
      items.value = [result, ...items.value]
      return result
    } catch (err) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(id: string, data: UpdateBenchmarkConfigRequest) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.benchmarksConfigsUpdate(id, data)
      const result = response as BenchmarkConfigResponse
      items.value = items.value.map(item => item.id === id ? result : item)
      if (currentItem.value?.id === id) currentItem.value = result
      return result
    } catch (err) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await apiClient.benchmarksConfigsDelete(id)
      items.value = items.value.filter(item => item.id !== id)
      if (currentItem.value?.id === id) currentItem.value = null
    } catch (err) {
      error.value = parseApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return { items, currentItem, isLoading, error, pagination, fetchBySuite, fetchById, create, update, remove }
})
