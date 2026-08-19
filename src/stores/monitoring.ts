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
  AlertNotification,
  NotifierConfig,
  RuleOverride,
  ProbeSettings,
  AlertingSettings,
  ListFilterOperation,
  ParsedError,
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

/** Alert event as returned by GET /api/monitoring/alerts[/{id}] */
export interface AlertEvent {
  id: string
  ruleId: string
  scopeKey: string
  scope: Record<string, unknown>
  severity: 'info' | 'warning' | 'critical'
  status: 'firing' | 'resolved'
  message: string
  context: Record<string, unknown>
  notifications: AlertNotification[]
  firedAt: string | null
  resolvedAt: string | null
  ackedAt: string | null
  ackedBy: string | null
}

/** Filters for the alert event list */
export interface AlertFilters {
  ruleId?: string
  scopeKey?: string
  severity?: 'info' | 'warning' | 'critical'
  status?: 'firing' | 'resolved'
  /** Inclusive lower bound for firedAt */
  firedFrom?: string
  /** Inclusive upper bound for firedAt */
  firedTo?: string
  /** Text search over message, scopeKey, ruleId */
  textSearch?: string
  offset?: number
  limit?: number
}

/** The monitoring config payload (full-replace on PUT) */
export interface MonitoringConfig {
  notifiers?: NotifierConfig[]
  rules?: Record<string, RuleOverride>
  retentionDays?: number
  probeSettings?: ProbeSettings
  alerting?: AlertingSettings
}

/** Response of GET /api/monitoring/config */
export interface MonitoringConfigResponse {
  config: MonitoringConfig
  version: number
  updatedAt: string | null
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

  // --- Alert events ---
  const alerts = ref<AlertEvent[]>([])
  const alertsPagination = ref({ total: 0, offset: 0, limit: null as number | null })
  const alertsLoading = ref(false)
  const alertsError = ref<string | null>(null)

  const alert = ref<AlertEvent | null>(null)
  const alertLoading = ref(false)
  const alertError = ref<string | null>(null)

  const ackError = ref<ParsedError | null>(null)

  // --- Monitoring config (optimistic-locked full replace) ---
  const monitoringConfig = ref<MonitoringConfig | null>(null)
  const monitoringConfigVersion = ref<number | null>(null)
  const monitoringConfigUpdatedAt = ref<string | null>(null)
  const monitoringConfigLoading = ref(false)
  const monitoringConfigError = ref<string | null>(null)
  const monitoringConfigSaving = ref(false)
  const monitoringConfigSaveError = ref<ParsedError | null>(null)

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

  async function fetchAlerts(filters?: AlertFilters) {
    const f = filters ?? {}
    alertsLoading.value = true
    alertsError.value = null
    ackError.value = null
    try {
      const queryFilters: Record<string, string | number | boolean | string[] | number[] | boolean[] | ListFilterOperation> = {}
      if (f.ruleId) queryFilters.ruleId = f.ruleId
      if (f.scopeKey) queryFilters.scopeKey = f.scopeKey
      if (f.severity) queryFilters.severity = f.severity
      if (f.status) queryFilters.status = f.status
      if (f.firedFrom || f.firedTo) {
        queryFilters.firedAt = {
          op: 'between',
          value: [f.firedFrom ?? new Date(0).toISOString(), f.firedTo ?? new Date().toISOString()],
        }
      }
      const response = await apiClient.monitoringAlertsList({
        limit: f.limit ?? 100,
        offset: f.offset ?? 0,
        orderBy: '-firedAt',
        textSearch: f.textSearch?.trim() ? f.textSearch.trim() : undefined,
        filters: Object.keys(queryFilters).length ? queryFilters : undefined,
      })
      alerts.value = response.items
      alertsPagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      }
      return response
    } catch (err) {
      alertsError.value = toError(err, 'Failed to fetch alert events')
      throw err
    } finally {
      alertsLoading.value = false
    }
  }

  async function fetchAlert(id: string) {
    alertLoading.value = true
    alertError.value = null
    try {
      alert.value = await apiClient.monitoringAlertsDetail(id)
      return alert.value
    } catch (err) {
      alertError.value = toError(err, 'Failed to fetch alert event')
      throw err
    } finally {
      alertLoading.value = false
    }
  }

  /**
   * Acknowledge an alert (idempotent). Returns the updated event and, when the
   * acked row is present in the list, replaces it in place.
   */
  async function acknowledgeAlert(id: string): Promise<AlertEvent> {
    ackError.value = null
    try {
      const updated = await apiClient.monitoringAlertsAcknowledgeCreate(id)
      const idx = alerts.value.findIndex((a) => a.id === id)
      if (idx !== -1) {
        alerts.value[idx] = updated
      }
      if (alert.value?.id === id) {
        alert.value = updated
      }
      return updated
    } catch (err) {
      ackError.value = toParsedError(err)
      throw err
    }
  }

  async function fetchMonitoringConfig() {
    monitoringConfigLoading.value = true
    monitoringConfigError.value = null
    try {
      const response = await apiClient.monitoringConfigList()
      monitoringConfig.value = response.config
      monitoringConfigVersion.value = response.version
      monitoringConfigUpdatedAt.value = response.updatedAt
      return response
    } catch (err) {
      monitoringConfigError.value = toError(err, 'Failed to fetch monitoring config')
      throw err
    } finally {
      monitoringConfigLoading.value = false
    }
  }

  /**
   * Full-replace the monitoring config under optimistic lock.
   * The version is taken from the last GET; a 409 (version mismatch) is
   * surfaced via `monitoringConfigSaveError` with `statusCode === 409` so the
   * view can offer a reload.
   */
  async function saveMonitoringConfig(config: MonitoringConfig) {
    if (monitoringConfigVersion.value == null) {
      throw new Error('Monitoring config not loaded')
    }
    monitoringConfigSaving.value = true
    monitoringConfigSaveError.value = null
    try {
      const response = await apiClient.monitoringConfigUpdate({
        version: monitoringConfigVersion.value,
        config,
      })
      monitoringConfig.value = response.config
      monitoringConfigVersion.value = response.version
      monitoringConfigUpdatedAt.value = response.updatedAt
      return response
    } catch (err) {
      monitoringConfigSaveError.value = toParsedError(err)
      throw err
    } finally {
      monitoringConfigSaving.value = false
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
    alerts,
    alertsPagination,
    alertsLoading,
    alertsError,
    alert,
    alertLoading,
    alertError,
    ackError,
    monitoringConfig,
    monitoringConfigVersion,
    monitoringConfigUpdatedAt,
    monitoringConfigLoading,
    monitoringConfigError,
    monitoringConfigSaving,
    monitoringConfigSaveError,
    fetchHealth,
    fetchHealthHistory,
    fetchProviders,
    fetchProviderCalls,
    fetchProviderStats,
    fetchMetrics,
    fetchAlerts,
    fetchAlert,
    acknowledgeAlert,
    fetchMonitoringConfig,
    saveMonitoringConfig,
  }
})

/** Parse an API error into the ParsedError shape (keeps statusCode for 409 conflict UI). */
function toParsedError(err: unknown): ParsedError {
  const axiosErr = err as {
    response?: { status?: number; data?: { error?: string; message?: string; details?: { path: (string | number)[]; message: string }[] }; headers?: Record<string, string | undefined> }
    message?: string
  }
  const data = axiosErr.response?.data
  const requestId = axiosErr.response?.headers?.['x-request-id'] || undefined
  if (data?.error || axiosErr.response?.status) {
    return {
      message: data?.error || `Request failed with status ${axiosErr.response?.status}`,
      details: data?.details as ParsedError['details'],
      statusCode: axiosErr.response?.status,
      requestId,
    }
  }
  return { message: axiosErr.message ?? 'An unexpected error occurred' }
}
