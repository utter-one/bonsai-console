import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  LatencyStatsResponse,
  LatencyPercentilesResponse,
  LatencyTrendResponse,
  ConversationTimelineResponse,
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
  }
})
