import { defineStore } from 'pinia'
import type {
  BenchmarkProviderConfigResponse,
  CreateBenchmarkProviderConfigRequest,
  UpdateBenchmarkProviderConfigRequest,
} from '@/api/types'
import { createResourceStore } from './utils/resource'

export const useBenchmarkProviderConfigsStore = defineStore('benchmarkProviderConfigs', () => {
  return createResourceStore<BenchmarkProviderConfigResponse, CreateBenchmarkProviderConfigRequest, UpdateBenchmarkProviderConfigRequest>({
    endpoint: '/benchmarks/provider-configs',
    resourceName: 'benchmarkProviderConfig',
    apiResourceName: 'benchmarksProviderConfigs',
  })
})
