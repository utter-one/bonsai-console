import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  LatencyStatsResponse,
  LatencyPercentilesResponse,
  LatencyTrendResponse,
  ConversationTimelineResponse,
  TokenUsageStatsResponse,
  TokenUsageTrendResponse,
  SourceCatalogResponse,
  SliceQueryResponse,
  SavedSliceQuery,
  SliceQuery,
  FunnelQuery,
  FunnelQueryResponse,
  SavedFunnelQuery,
} from '@/api/generated/data-contracts'

type LatencyFilterQuery = {
  from?: string | null
  to?: string | null
  stageId?: string
  source?: 'text' | 'voice'
}

type TrendFilterQuery = LatencyFilterQuery & {
  interval?: 'hour' | 'day' | 'week'
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const latencyStats = ref<LatencyStatsResponse | null>(null)
  const latencyPercentiles = ref<LatencyPercentilesResponse | null>(null)
  const latencyTrend = ref<LatencyTrendResponse | null>(null)
  const conversationTimeline = ref<ConversationTimelineResponse | null>(null)
  const isLoading = ref(false)
  const isLoadingTimeline = ref(false)
  const error = ref<string | null>(null)
  const timelineError = ref<string | null>(null)

  async function fetchLatencyStats(projectId: string, query?: LatencyFilterQuery) {
    isLoading.value = true
    error.value = null
    try {
      latencyStats.value = await apiClient.projectsAnalyticsLatencyList(projectId, query)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load latency statistics'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLatencyPercentiles(projectId: string, query?: LatencyFilterQuery) {
    try {
      latencyPercentiles.value = await apiClient.projectsAnalyticsLatencyPercentilesList(projectId, query)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load latency percentiles'
      throw err
    }
  }

  async function fetchLatencyTrend(projectId: string, query?: TrendFilterQuery) {
    try {
      latencyTrend.value = await apiClient.projectsAnalyticsLatencyTrendList(projectId, query)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load latency trend'
      throw err
    }
  }

  async function fetchAll(projectId: string, query?: TrendFilterQuery) {
    isLoading.value = true
    error.value = null
    try {
      const { interval: _interval, ...latencyQuery } = query || {}
      await Promise.all([
        fetchLatencyStats(projectId, latencyQuery),
        fetchLatencyPercentiles(projectId, latencyQuery),
        fetchLatencyTrend(projectId, query),
      ])
    } catch {
      // individual errors already set
    } finally {
      isLoading.value = false
    }
  }

  async function fetchConversationTimeline(projectId: string, conversationId: string) {
    isLoadingTimeline.value = true
    timelineError.value = null
    try {
      conversationTimeline.value = await apiClient.projectsAnalyticsConversationsTimelineList(projectId, conversationId)
    } catch (err: any) {
      timelineError.value = err.response?.data?.message || 'Failed to load conversation timeline'
      throw err
    } finally {
      isLoadingTimeline.value = false
    }
  }

  function clearTimeline() {
    conversationTimeline.value = null
    timelineError.value = null
  }

  const tokenUsageStats = ref<TokenUsageStatsResponse | null>(null)
  const tokenUsageTrend = ref<TokenUsageTrendResponse | null>(null)
  const isLoadingTokenUsage = ref(false)
  const tokenUsageError = ref<string | null>(null)

  async function fetchTokenUsageStats(projectId: string, query?: LatencyFilterQuery) {
    try {
      tokenUsageStats.value = await apiClient.projectsAnalyticsUsageList(projectId, query)
    } catch (err: any) {
      tokenUsageError.value = err.response?.data?.message || 'Failed to load token usage statistics'
      throw err
    }
  }

  async function fetchTokenUsageTrend(projectId: string, query?: TrendFilterQuery) {
    try {
      tokenUsageTrend.value = await apiClient.projectsAnalyticsUsageTrendList(projectId, query)
    } catch (err: any) {
      tokenUsageError.value = err.response?.data?.message || 'Failed to load token usage trend'
      throw err
    }
  }

  async function fetchAllTokenUsage(projectId: string, query?: TrendFilterQuery) {
    isLoadingTokenUsage.value = true
    tokenUsageError.value = null
    try {
      const { interval: _interval, ...statsQuery } = query || {}
      await Promise.all([
        fetchTokenUsageStats(projectId, statsQuery),
        fetchTokenUsageTrend(projectId, query),
      ])
    } catch {
      // individual errors already set
    } finally {
      isLoadingTokenUsage.value = false
    }
  }

  const sourceCatalog = ref<SourceCatalogResponse | null>(null)
  const isLoadingCatalog = ref(false)
  const catalogError = ref<string | null>(null)

  async function fetchSourceCatalog(projectId: string) {
    isLoadingCatalog.value = true
    catalogError.value = null
    try {
      sourceCatalog.value = await apiClient.projectsAnalyticsSourcesList(projectId)
    } catch (err: any) {
      catalogError.value = err.response?.data?.message || 'Failed to load analytics sources'
      throw err
    } finally {
      isLoadingCatalog.value = false
    }
  }

  const sliceResult = ref<SliceQueryResponse | null>(null)
  const isLoadingQuery = ref(false)
  const queryError = ref<string | null>(null)

  async function runQuery(projectId: string, params: Parameters<typeof apiClient.projectsAnalyticsQueryList>[1]) {
    isLoadingQuery.value = true
    queryError.value = null
    sliceResult.value = null
    try {
      sliceResult.value = await apiClient.projectsAnalyticsQueryList(projectId, params)
    } catch (err: any) {
      const data = err.response?.data
      if (data?.message) {
        queryError.value = data.message
      } else if (data?.error) {
        queryError.value = data.error
      } else if (typeof data === 'string' && data) {
        queryError.value = data
      } else {
        queryError.value = `Query failed (HTTP ${err.response?.status ?? 'unknown'})`
      }
      throw err
    } finally {
      isLoadingQuery.value = false
    }
  }

  function clearResult() {
    sliceResult.value = null
    queryError.value = null
  }

  const savedQueries = ref<SavedSliceQuery[]>([])
  const isLoadingSavedQueries = ref(false)
  const savedQueriesError = ref<string | null>(null)

  async function fetchSavedQueries(projectId: string) {
    isLoadingSavedQueries.value = true
    savedQueriesError.value = null
    try {
      savedQueries.value = await apiClient.projectsAnalyticsSavedQueriesList(projectId)
    } catch (err: any) {
      savedQueriesError.value = err.response?.data?.message || 'Failed to load saved queries'
      throw err
    } finally {
      isLoadingSavedQueries.value = false
    }
  }

  async function createSavedQuery(projectId: string, data: { name: string; query: SliceQuery; isShared?: boolean; metadata?: Record<string, any> }) {
    const created = await apiClient.projectsAnalyticsSavedQueriesCreate(projectId, data)
    savedQueries.value = [...savedQueries.value, created]
    return created
  }

  async function updateSavedQuery(projectId: string, id: string, data: { name?: string; query?: SliceQuery; isShared?: boolean; metadata?: Record<string, any>; version: number }) {
    const updated = await apiClient.projectsAnalyticsSavedQueriesUpdate(projectId, id, data)
    savedQueries.value = savedQueries.value.map(q => q.id === id ? updated : q)
    return updated
  }

  async function deleteSavedQuery(projectId: string, id: string, version: number) {
    await apiClient.projectsAnalyticsSavedQueriesDelete(projectId, id, { version })
    savedQueries.value = savedQueries.value.filter(q => q.id !== id)
  }

  const funnelResult = ref<FunnelQueryResponse | null>(null)
  const isLoadingFunnel = ref(false)
  const funnelError = ref<string | null>(null)
  const savedFunnelQueries = ref<SavedFunnelQuery[]>([])
  const isLoadingSavedFunnelQueries = ref(false)

  async function runFunnelQuery(projectId: string, data: FunnelQuery) {
    isLoadingFunnel.value = true
    funnelError.value = null
    funnelResult.value = null
    try {
      funnelResult.value = await apiClient.projectsAnalyticsFunnelsQueryCreate(projectId, data)
    } catch (err: any) {
      const data = err.response?.data
      if (data?.message) {
        funnelError.value = data.message
      } else if (data?.error) {
        funnelError.value = data.error
      } else if (typeof data === 'string' && data) {
        funnelError.value = data
      } else {
        funnelError.value = `Funnel query failed (HTTP ${err.response?.status ?? 'unknown'})`
      }
      throw err
    } finally {
      isLoadingFunnel.value = false
    }
  }

  function clearFunnelResult() {
    funnelResult.value = null
    funnelError.value = null
  }

  async function fetchSavedFunnelQueries(projectId: string) {
    isLoadingSavedFunnelQueries.value = true
    try {
      savedFunnelQueries.value = await apiClient.projectsAnalyticsFunnelsSavedQueriesList(projectId)
    } catch (err: any) {
      throw err
    } finally {
      isLoadingSavedFunnelQueries.value = false
    }
  }

  async function createSavedFunnelQuery(projectId: string, data: { name: string; query: FunnelQuery; isShared?: boolean }) {
    const created = await apiClient.projectsAnalyticsFunnelsSavedQueriesCreate(projectId, data)
    savedFunnelQueries.value = [...savedFunnelQueries.value, created]
    return created
  }

  async function updateSavedFunnelQuery(projectId: string, id: string, data: { name?: string; query?: FunnelQuery; isShared?: boolean; version: number }) {
    const updated = await apiClient.projectsAnalyticsFunnelsSavedQueriesUpdate(projectId, id, data)
    savedFunnelQueries.value = savedFunnelQueries.value.map(q => q.id === id ? updated : q)
    return updated
  }

  async function deleteSavedFunnelQuery(projectId: string, id: string, version: number) {
    await apiClient.projectsAnalyticsFunnelsSavedQueriesDelete(projectId, id, { version })
    savedFunnelQueries.value = savedFunnelQueries.value.filter(q => q.id !== id)
  }

  return {
    latencyStats,
    latencyPercentiles,
    latencyTrend,
    conversationTimeline,
    isLoading,
    isLoadingTimeline,
    error,
    timelineError,
    fetchLatencyStats,
    fetchLatencyPercentiles,
    fetchLatencyTrend,
    fetchAll,
    fetchConversationTimeline,
    clearTimeline,
    tokenUsageStats,
    tokenUsageTrend,
    isLoadingTokenUsage,
    tokenUsageError,
    fetchTokenUsageStats,
    fetchTokenUsageTrend,
    fetchAllTokenUsage,
    sourceCatalog,
    isLoadingCatalog,
    catalogError,
    fetchSourceCatalog,
    sliceResult,
    isLoadingQuery,
    queryError,
    runQuery,
    clearResult,
    savedQueries,
    isLoadingSavedQueries,
    savedQueriesError,
    fetchSavedQueries,
    createSavedQuery,
    updateSavedQuery,
    deleteSavedQuery,
    funnelResult,
    isLoadingFunnel,
    funnelError,
    savedFunnelQueries,
    isLoadingSavedFunnelQueries,
    runFunnelQuery,
    clearFunnelResult,
    fetchSavedFunnelQueries,
    createSavedFunnelQuery,
    updateSavedFunnelQuery,
    deleteSavedFunnelQuery,
  }
})
