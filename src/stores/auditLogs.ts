import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  AuditLogResponse,
  ListParams,
} from '@/api/types'

export const useAuditLogsStore = defineStore('auditLogs', () => {
  const logs = ref<AuditLogResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchAll(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.auditLogsList(params)
      logs.value = response.items
      pagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch audit logs'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    logs,
    isLoading,
    error,
    pagination,
    fetchAll,
  }
})
