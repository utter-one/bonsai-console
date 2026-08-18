import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  HealthMonitoringResponse,
  HealthMonitoringListResponse,
  ProvidersMonitoringResponse,
  ProviderCallListResponse,
  ProviderStatsMonitoringResponse,
  MetricSeriesMonitoringResponse,
  ListFilterOperation,
} from '@/api/types'

/** Filters for the provider call log list */
export interface ProviderCallFilters {
  providerId?: string
  ok?: boolean
  errorCode?: string
  from?: string
  to?: string
  /** Page offset (defaults to 0) */
  offset?: number
  /** Page size (defaults to 100) */
  limit?: number
}

/** Query for provider call statistics buckets */
export interface ProviderStatsQuery {
  from: string | null
  to: string | null
  groupBy: 'hour' | 'day'
  providerId?: string
  operation?: string
}

/** Query for the metric series explorer */
export interface MetricsQuery {
  name: string
  labels?: Record<string, string>
  from: string | null
  to: string | null
  step?: '1m' | '15m' | '1h'
}

function toError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string; details?: unknown[] } }; message?: string }
  const data = e?.response?.data
  if (data?.details?.length) {
    const parts = data.details
      .map((d) => (typeof d === 'string' ? d : (d as { message?: string })?.message))
      .filter(Boolean)
    if (parts.length) return parts.join('; ')
  }
  return data?.error || data?.message || e?.message || fallback
}

/**
 * Read-only store for the platform monitoring endpoints
 * (GET /api/monitoring/*). Hand-written because these are query-only
 * surfaces with non-standard response shapes — the CRUD factory does not fit.
 */
export const useMonitoringStore = defineStore('monitoring', () => {
  // --- System health snapshot + history ---
  const health = ref<HealthMonitoringResponse | null>(null)
  const healthLoading = ref(false)
  const healthError = ref<string | null>(null)

  const healthHistory = ref<HealthMonitoringListResponse['items']>([])
  const healthHistoryPagination = ref({ total: 0, offset: 0, limit: null as number | null })
  const healthHistoryLoading = ref(false)
  const healthHistoryError = ref<string | null>(null)

  // --- Provider overview (probe status + rolling 15m window) ---
  const providers = ref<ProvidersMonitoringResponse['providers']>([])
  const providersLoading = ref(false)
  const providersError = ref<string | null>(null)

  // --- Provider call log ---
  const providerCalls = ref<ProviderCallListResponse['items']>([])
  const providerCallsPagination = ref({ total: 0, offset: 0, limit: null as number | null })
  const providerCallsLoading = ref(false)
  const providerCallsError = ref<string | null>(null)
  const providerCallFilters = ref<ProviderCallFilters>({})

  // --- Provider call statistics (bucketed) ---
  const providerStats = ref<ProviderStatsMonitoringResponse | null>(null)
  const providerStatsLoading = ref(false)
  const providerStatsError = ref<string | null>(null)

  // --- Metric series explorer ---
  const metrics = ref<MetricSeriesMonitoringResponse | null>(null)
  const metricsLoading = ref(false)
  const metricsError = ref<string | null>(null)

  async function fetchHealth() {
    healthLoading.value = true
    healthError.value = null
    try {
      health.value = await apiClient.monitoringHealthList()
      return health.value
    } catch (err) {
      healthError.value = toError(err, 'Failed to fetch system health')
      throw err
    } finally {
      healthLoading.value = false
    }
  }

  async function fetchHealthHistory(params?: {
    limit?: number
    offset?: number
    status?: string
  }) {
    healthHistoryLoading.value = true
    healthHistoryError.value = null
    try {
      const response = await apiClient.monitoringHealthHistoryList({
        limit: params?.limit,
        offset: params?.offset,
        orderBy: '-createdAt',
        filters: params?.status ? { status: params.status } : undefined,
      })
      healthHistory.value = response.items
      healthHistoryPagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      }
      return response
    } catch (err) {
      healthHistoryError.value = toError(err, 'Failed to fetch health history')
      throw err
    } finally {
      healthHistoryLoading.value = false
    }
  }

  async function fetchProviders() {
    providersLoading.value = true
    providersError.value = null
    try {
      const response = await apiClient.monitoringProvidersList()
      providers.value = response.providers
      return response
    } catch (err) {
      providersError.value = toError(err, 'Failed to fetch provider monitoring')
      throw err
    } finally {
      providersLoading.value = false
    }
  }

  async function fetchProviderCalls(filters?: ProviderCallFilters) {
    if (filters) {
      providerCallFilters.value = filters
    }
    const f = providerCallFilters.value
    providerCallsLoading.value = true
    providerCallsError.value = null
    try {
      const filters: Record<string, string | number | boolean | string[] | number[] | boolean[] | ListFilterOperation> = {}
      if (f.providerId) filters.providerId = f.providerId
      if (typeof f.ok === 'boolean') filters.ok = f.ok
      if (f.errorCode) filters.errorCode = f.errorCode
      if (f.from || f.to) {
        filters.createdAt = {
          op: 'between',
          value: [f.from ?? new Date(0).toISOString(), f.to ?? new Date().toISOString()],
        }
      }
      const response = await apiClient.monitoringProviderCallsList({
        limit: f.limit ?? 100,
        offset: f.offset ?? 0,
        orderBy: '-createdAt',
        filters: Object.keys(filters).length ? filters : undefined,
      })
      providerCalls.value = response.items
      providerCallsPagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      }
      return response
    } catch (err) {
      providerCallsError.value = toError(err, 'Failed to fetch provider calls')
      throw err
    } finally {
      providerCallsLoading.value = false
    }
  }

  async function fetchProviderStats(query: ProviderStatsQuery) {
    providerStatsLoading.value = true
    providerStatsError.value = null
    try {
      const response = await apiClient.monitoringProviderStatsList({
        from: query.from,
        to: query.to,
        groupBy: query.groupBy,
        providerId: query.providerId || undefined,
        operation: query.operation || undefined,
      })
      providerStats.value = response
      return response
    } catch (err) {
      providerStatsError.value = toError(err, 'Failed to fetch provider statistics')
      throw err
    } finally {
      providerStatsLoading.value = false
    }
  }

  async function fetchMetrics(query: MetricsQuery) {
    metricsLoading.value = true
    metricsError.value = null
    try {
      const response = await apiClient.monitoringMetricsList({
        name: query.name,
        labels: query.labels,
        from: query.from,
        to: query.to,
        step: query.step,
      })
      metrics.value = response
      return response
    } catch (err) {
      metricsError.value = toError(err, 'Failed to fetch metric series')
      throw err
    } finally {
      metricsLoading.value = false
    }
  }

  return {
    health,
    healthLoading,
    healthError,
    healthHistory,
    healthHistoryPagination,
    healthHistoryLoading,
    healthHistoryError,
    providers,
    providersLoading,
    providersError,
    providerCalls,
    providerCallsPagination,
    providerCallsLoading,
    providerCallsError,
    providerCallFilters,
    providerStats,
    providerStatsLoading,
    providerStatsError,
    metrics,
    metricsLoading,
    metricsError,
    fetchHealth,
    fetchHealthHistory,
    fetchProviders,
    fetchProviderCalls,
    fetchProviderStats,
    fetchMetrics,
  }
})
