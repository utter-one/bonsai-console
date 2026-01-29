import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  ProviderCatalogResponse,
  AsrProviderInfo,
  TtsProviderInfo,
  LlmProviderInfo,
} from '@/types/api'

export const useProviderCatalogStore = defineStore('providerCatalog', () => {
  const catalog = ref<ProviderCatalogResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCatalog() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<ProviderCatalogResponse>('/provider-catalog')
      catalog.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch provider catalog'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAsrProviders() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<{ providers: AsrProviderInfo[] }>('/provider-catalog/asr')
      if (catalog.value) {
        catalog.value.asr = response.data.providers
      }
      return response.data.providers
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch ASR providers'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTtsProviders() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<{ providers: TtsProviderInfo[] }>('/provider-catalog/tts')
      if (!catalog.value) {
        catalog.value = { asr: [], tts: response.data.providers, llm: [] }
      } else {
        catalog.value.tts = response.data.providers
      }
      return response.data.providers
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch TTS providers'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLlmProviders() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<{ providers: LlmProviderInfo[] }>('/provider-catalog/llm')
      if (catalog.value) {
        catalog.value.llm = response.data.providers
      }
      return response.data.providers
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch LLM providers'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProviderDetails(type: 'asr' | 'tts' | 'llm', apiType: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<AsrProviderInfo | TtsProviderInfo | LlmProviderInfo>(
        `/provider-catalog/${type}/${apiType}`
      )
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch provider details'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getAsrProviders() {
    return catalog.value?.asr || []
  }

  function getTtsProviders() {
    return catalog.value?.tts || []
  }

  function getLlmProviders() {
    return catalog.value?.llm || []
  }

  function getProviderByApiType(type: 'asr' | 'tts' | 'llm', apiType: string) {
    return catalog.value?.[type]?.find(provider => provider.apiType === apiType) || null
  }

  return {
    catalog,
    isLoading,
    error,
    fetchCatalog,
    fetchAsrProviders,
    fetchTtsProviders,
    fetchLlmProviders,
    fetchProviderDetails,
    getAsrProviders,
    getTtsProviders,
    getLlmProviders,
    getProviderByApiType,
  }
})
