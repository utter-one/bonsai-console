import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import type {
  LoginRequest,
  AdminResponse,
  InitialAdminSetupRequest,
  UpdateProfileRequest,
} from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const currentAdmin = ref<AdminResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.authLoginCreate(credentials)
      const { accessToken: token, refreshToken: refresh } = response

      accessToken.value = token
      refreshToken.value = refresh

      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      // Fetch full profile after login
      await fetchProfile()

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await apiClient.authRefreshCreate({
        refreshToken: refreshToken.value,
      })
      const { accessToken: token } = response

      accessToken.value = token
      localStorage.setItem('accessToken', token)

      return response
    } catch (err) {
      logout()
      throw err
    }
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    currentAdmin.value = null

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async function checkSetupStatus() {
    try {
      const response = await apiClient.setupStatusList()
      console.log('Setup status response:', response)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to check setup status'
      throw err
    }
  }

  async function createInitialAdmin(data: InitialAdminSetupRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.setupInitialAdminCreate(data)
      const { admin, accessToken: token, refreshToken: refresh } = response

      accessToken.value = token
      refreshToken.value = refresh
      currentAdmin.value = {
        id: admin.id,
        name: admin.name,
        roles: admin.roles,
        version: 1,
        createdAt: null,
        updatedAt: null,
      }

      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create initial admin'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.profileList()
      currentAdmin.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch profile'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function ensureProfile() {
    // If we have a token but no profile data, fetch it
    if (accessToken.value && !currentAdmin.value) {
      try {
        await fetchProfile()
      } catch (err) {
        // If profile fetch fails, clear auth state
        logout()
        throw err
      }
    }
  }

  async function updateProfile(data: UpdateProfileRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.profileCreate(data)
      
      // Update current admin with new profile data
      if (currentAdmin.value) {
        currentAdmin.value = {
          ...currentAdmin.value,
          name: response.name,
          version: response.version,
          updatedAt: response.updatedAt,
        }
      }

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Profile update failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    accessToken,
    refreshToken,
    currentAdmin,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshAccessToken,
    checkSetupStatus,
    createInitialAdmin,
    fetchProfile,
    ensureProfile,
    updateProfile,
  }
})
