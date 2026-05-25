import { defineStore } from 'pinia'
import type {
  BenchmarkSuiteResponse,
  CreateBenchmarkSuiteRequest,
  UpdateBenchmarkSuiteRequest,
} from '@/api/types'
import { createResourceStore } from './utils/resource'

export const useBenchmarkSuitesStore = defineStore('benchmarkSuites', () => {
  return createResourceStore<BenchmarkSuiteResponse, CreateBenchmarkSuiteRequest, UpdateBenchmarkSuiteRequest>({
    endpoint: '/benchmarks/suites',
    resourceName: 'benchmarkSuite',
    apiResourceName: 'benchmarksSuites',
  })
})
