import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  HealthMonitoringListResponse,
  ProvidersMonitoringResponse,
  ProviderCallListResponse,
  ProviderStatsMonitoringResponse,
  MetricSeriesMonitoringResponse,
  AlertNotification,
  AlertRuleCatalogItem,
  NotifierConfig,
  RuleOverride,
  ProbeSettings,
  AlertingSettings,
  CircuitBreakerSettings,
  ListFilterOperation,
  ParsedError,
  StatusPageResponse,
  StatusPageQuery,
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

/** One failover transition row as returned by GET /api/monitoring/fallback-events */
export interface FallbackEvent {
  id: string
  /** The failed (primary-side) provider */
  providerId: string
  /** The provider the request fell over to */
  fallbackProviderId: string
  providerType: string
  operation: string
  /** Error class of the failed attempt (auth | rate_limited | timeout | server_error | ...) */
  reason: string
  projectId: string | null
  conversationId: string | null
  /** Whether the fallback ultimately served the request */
  success: boolean | null
  createdAt: string | null
}

/** Filters for the fallback event list */
export interface FallbackEventFilters {
  providerId?: string
  fallbackProviderId?: string
  providerType?: string
  operation?: string
  reason?: string
  success?: boolean
  /** Inclusive lower bound for createdAt */
  from?: string
  /** Inclusive upper bound for createdAt */
  to?: string
  textSearch?: string
  offset?: number
  limit?: number
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
  circuitBreaker?: CircuitBreakerSettings
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
  // --- System health check history ---
  const healthHistory = ref<HealthMonitoringListResponse['items']>([])
  const healthHistoryPagination = ref({ total: 0, offset: 0, limit: null as number | null })
  const healthHistoryLoading = ref(false)
  const healthHistoryError = ref<string | null>(null)

  // --- Status page (GET /api/monitoring/status) ---
  // Aggregated current state of checks + providers with per-check window
  // counts, plus optional per-day aggregates (?days=N).
  const status = ref<StatusPageResponse | null>(null)
  const statusLoading = ref(false)
  const statusError = ref<string | null>(null)

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

  // --- Fallback events (failover transitions) ---
  const fallbackEvents = ref<FallbackEvent[]>([])
  const fallbackEventsPagination = ref({ total: 0, offset: 0, limit: null as number | null })
  const fallbackEventsLoading = ref(false)
  const fallbackEventsError = ref<string | null>(null)
  const fallbackEventFilters = ref<FallbackEventFilters>({})

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
  const deleteAlertError = ref<ParsedError | null>(null)

  // --- Alert rule catalog (GET /api/monitoring/rules) ---
  // Served live from the engine's rule registry — the same source the
  // evaluators run from, so it never drifts from the keys the config
  // accepts under `rules`.
  const ruleCatalog = ref<AlertRuleCatalogItem[]>([])
  const ruleCatalogLoading = ref(false)
  const ruleCatalogError = ref<string | null>(null)

  // --- Monitoring config (optimistic-locked full replace) ---
  const monitoringConfig = ref<MonitoringConfig | null>(null)
  const monitoringConfigVersion = ref<number | null>(null)
  const monitoringConfigUpdatedAt = ref<string | null>(null)
  const monitoringConfigLoading = ref(false)
  const monitoringConfigError = ref<string | null>(null)
  const monitoringConfigSaving = ref(false)
  const monitoringConfigSaveError = ref<ParsedError | null>(null)

  async function fetchStatus(query?: StatusPageQuery) {
    statusLoading.value = true
    statusError.value = null
    try {
      status.value = await apiClient.monitoringStatusList(query)
      return status.value
    } catch (err) {
      statusError.value = toError(err, 'Failed to fetch the status page')
      throw err
    } finally {
      statusLoading.value = false
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
      // Mutate in place: views capture this object by reference at setup, so
      // replacing the ref's value would leave their totals frozen at 0
      Object.assign(healthHistoryPagination.value, {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      })
      return response
    } catch (err) {
      healthHistoryError.value = toError(err, 'Failed to fetch health history')
      throw err
    } finally {
      healthHistoryLoading.value = false
    }
  }

  /**
   * Bulk-fetch health history rows within [fromIso, toIso] (all pages,
   * limit 1000 per page) WITHOUT touching the Check History table state.
   * Used to build per-segment aggregates for the status bars.
   */
  async function fetchHistoryWindow(fromIso: string, toIso: string): Promise<HealthMonitoringListResponse['items']> {
    const items: HealthMonitoringListResponse['items'] = []
    let offset = 0
    for (;;) {
      const response = await apiClient.monitoringHealthHistoryList({
        limit: 1000,
        offset,
        orderBy: '-createdAt',
        filters: { createdAt: { op: 'between', value: [fromIso, toIso] } },
      })
      items.push(...response.items)
      if (response.items.length < 1000 || items.length >= response.total) break
      offset += response.items.length
    }
    return items
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
      // Mutate in place (see healthHistoryPagination above)
      Object.assign(providerCallsPagination.value, {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      })
      return response
    } catch (err) {
      providerCallsError.value = toError(err, 'Failed to fetch provider calls')
      throw err
    } finally {
      providerCallsLoading.value = false
    }
  }

  async function fetchFallbackEvents(filters?: FallbackEventFilters) {
    if (filters) {
      fallbackEventFilters.value = filters
    }
    const f = fallbackEventFilters.value
    fallbackEventsLoading.value = true
    fallbackEventsError.value = null
    try {
      const queryFilters: Record<string, string | number | boolean | string[] | number[] | boolean[] | ListFilterOperation> = {}
      if (f.providerId) queryFilters.providerId = f.providerId
      if (f.fallbackProviderId) queryFilters.fallbackProviderId = f.fallbackProviderId
      if (f.providerType) queryFilters.providerType = f.providerType
      if (f.operation) queryFilters.operation = f.operation
      if (f.reason) queryFilters.reason = f.reason
      if (typeof f.success === 'boolean') queryFilters.success = f.success
      if (f.from || f.to) {
        queryFilters.createdAt = {
          op: 'between',
          value: [f.from ?? new Date(0).toISOString(), f.to ?? new Date().toISOString()],
        }
      }
      const response = await apiClient.monitoringFallbackEventsList({
        limit: f.limit ?? 100,
        offset: f.offset ?? 0,
        orderBy: '-createdAt',
        textSearch: f.textSearch?.trim() ? f.textSearch.trim() : undefined,
        filters: Object.keys(queryFilters).length ? queryFilters : undefined,
      })
      fallbackEvents.value = response.items
      // Mutate in place (see healthHistoryPagination above)
      Object.assign(fallbackEventsPagination.value, {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      })
      return response
    } catch (err) {
      fallbackEventsError.value = toError(err, 'Failed to fetch fallback events')
      throw err
    } finally {
      fallbackEventsLoading.value = false
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
      // Mutate in place (see healthHistoryPagination above)
      Object.assign(alertsPagination.value, {
        total: response.total,
        offset: response.offset,
        limit: response.limit ?? null,
      })
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

  /**
   * Permanently deletes one alert event (stalled alerts, known situations
   * without an easy resolution). Removes the row from the list and
   * decrements the total. The engine may record a new event for the same
   * rule/scope later if the condition still holds.
   */
  async function deleteAlert(id: string): Promise<void> {
    deleteAlertError.value = null
    try {
      await apiClient.monitoringAlertsDelete(id)
      const idx = alerts.value.findIndex((a) => a.id === id)
      if (idx !== -1) {
        alerts.value.splice(idx, 1)
        // Mutate in place — views capture the pagination object by reference
        Object.assign(alertsPagination.value, { total: Math.max(0, alertsPagination.value.total - 1) })
      }
    } catch (err) {
      deleteAlertError.value = toParsedError(err)
      throw err
    }
  }

  async function fetchRuleCatalog() {
    ruleCatalogLoading.value = true
    ruleCatalogError.value = null
    try {
      const response = await apiClient.monitoringRulesList()
      ruleCatalog.value = response.rules
      return response
    } catch (err) {
      ruleCatalogError.value = toError(err, 'Failed to fetch the alert rule catalog')
      throw err
    } finally {
      ruleCatalogLoading.value = false
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
    fallbackEvents,
    fallbackEventsPagination,
    fallbackEventsLoading,
    fallbackEventsError,
    fallbackEventFilters,
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
    deleteAlertError,
    ruleCatalog,
    ruleCatalogLoading,
    ruleCatalogError,
    monitoringConfig,
    monitoringConfigVersion,
    monitoringConfigUpdatedAt,
    monitoringConfigLoading,
    monitoringConfigError,
    monitoringConfigSaving,
    monitoringConfigSaveError,
    fetchStatus,
    status,
    statusLoading,
    statusError,
    fetchHealthHistory,
    fetchHistoryWindow,
    fetchProviders,
    fetchProviderCalls,
    fetchFallbackEvents,
    fetchProviderStats,
    fetchMetrics,
    fetchAlerts,
    fetchAlert,
    acknowledgeAlert,
    deleteAlert,
    fetchRuleCatalog,
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
