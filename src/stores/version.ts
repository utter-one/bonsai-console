import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '@/api/client'
import type { VersionResponse } from '@/api/types'

export const useVersionStore = defineStore('version', () => {
  const versionData = ref<VersionResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchVersion() {
    if (versionData.value) return
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get<VersionResponse>('/version')
      versionData.value = response.data
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Failed to fetch version'
    } finally {
      isLoading.value = false
    }
  }

  return { versionData, isLoading, error, fetchVersion }
})
