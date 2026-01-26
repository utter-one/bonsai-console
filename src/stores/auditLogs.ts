import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  AuditLogResponse,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api'

export const useAuditLogsStore = defineStore('auditLogs', () => {
  const logs = ref<AuditLogResponse[]>([])
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
      const response = await apiClient.get<PaginatedResponse<AuditLogResponse>>(
        '/audit-logs',
        { params }
      )
      logs.value = response.data.items
      pagination.value = {
        total: response.data.total,
        offset: response.data.offset,
        limit: response.data.limit,
      }
      return response.data
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
