import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  BenchmarkRunResponse,
  BenchmarkResultResponse,
} from '@/api/types'
import { createResourceStore } from './utils/resource'

export const useBenchmarkRunsStore = defineStore('benchmarkRuns', () => {
  const base = createResourceStore<BenchmarkRunResponse, { suiteId: string }, never>({
    endpoint: '/benchmarks/runs',
    resourceName: 'benchmarkRun',
    apiResourceName: 'benchmarksRuns',
  })

  const executionResults = ref<BenchmarkResultResponse[]>([])
  const isLoadingResults = ref(false)

  async function fetchAll(suiteId?: string) {
    return base.fetchAll(suiteId ? { suiteId } as any : undefined)
  }

  async function triggerRun(suiteId: string) {
    return base.create({ suiteId })
  }

  async function pollSilent(suiteId: string): Promise<boolean> {
    try {
      const response = await apiClient.benchmarksRunsList({ suiteId })
      const freshRuns = ((response as any).items ?? []) as BenchmarkRunResponse[]

      let anyChanged = false

      for (const fresh of freshRuns) {
        const idx = base.items.value.findIndex((r: BenchmarkRunResponse) => r.id === fresh.id)
        if (idx === -1) {
          base.items.value.unshift(fresh)
          anyChanged = true
        } else if (base.items.value[idx]?.status !== fresh.status) {
          base.items.value.splice(idx, 1, fresh)
          anyChanged = true
        }
      }

      return anyChanged
    } catch {
      return false
    }
  }

  async function fetchExecutionResults(executionId: string) {
    isLoadingResults.value = true
    try {
      const response = await apiClient.benchmarksExecutionsResultsList(executionId)
      executionResults.value = response as BenchmarkResultResponse[]
      return executionResults.value
    } catch (err) {
      throw err
    } finally {
      isLoadingResults.value = false
    }
  }

  return {
    ...base,
    executionResults,
    isLoadingResults,
    fetchAll,
    triggerRun,
    pollSilent,
    fetchExecutionResults,
  }
})
