import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  ProviderCatalog,
  AsrProviderInfo,
  TtsProviderInfo,
  LlmProviderInfo,
} from '@/api/types'

export const useProviderCatalogStore = defineStore('providerCatalog', () => {
  const catalog = ref<ProviderCatalog | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCatalog() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.providerCatalogList()
      catalog.value = response
      return response
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
      const response = await apiClient.providerCatalogAsrList()
      if (catalog.value) {
        catalog.value.asr = response.providers
      }
      return response.providers
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
      const response = await apiClient.providerCatalogTtsList()
      if (!catalog.value) {
        catalog.value = { asr: [], tts: response.providers, llm: [] }
      } else {
        catalog.value.tts = response.providers
      }
      return response.providers
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
      const response = await apiClient.providerCatalogLlmList()
      if (catalog.value) {
        catalog.value.llm = response.providers
      }
      return response.providers
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
      const response = await apiClient.providerCatalogDetail(type, apiType)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch provider details'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getAsrProviders(): AsrProviderInfo[] {
    return catalog.value?.asr || []
  }

  function getTtsProviders(): TtsProviderInfo[] {
    return catalog.value?.tts || []
  }

  function getLlmProviders(): LlmProviderInfo[] {
    return catalog.value?.llm || []
  }

  function getProviderByApiType(type: 'asr', apiType: string): AsrProviderInfo | null
  function getProviderByApiType(type: 'tts', apiType: string): TtsProviderInfo | null
  function getProviderByApiType(type: 'llm', apiType: string): LlmProviderInfo | null
  function getProviderByApiType(type: 'asr' | 'tts' | 'llm', apiType: string): AsrProviderInfo | TtsProviderInfo | LlmProviderInfo | null {
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
