import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import type {
  LoginRequest,
  ProfileResponse,
  InitialOperatorSetupRequest,
  UpdateProfileRequest,
} from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const currentOperator = ref<ProfileResponse | null>(null)
  const permissions = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.authLoginCreate(credentials)
      const { accessToken: token, refreshToken: refresh, operatorId, displayName, roles, permissions: perms } = response

      accessToken.value = token
      refreshToken.value = refresh
      permissions.value = perms

      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      currentOperator.value = {
        id: operatorId,
        name: displayName,
        roles,
        version: 0,
        createdAt: null,
        updatedAt: null,
      }

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
      const { accessToken: token, roles, permissions: perms } = response

      accessToken.value = token
      permissions.value = perms
      localStorage.setItem('accessToken', token)

      if (currentOperator.value) {
        currentOperator.value = { ...currentOperator.value, roles }
      }

      return response
    } catch (err) {
      logout()
      throw err
    }
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    currentOperator.value = null
    permissions.value = []

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Clear project selection on logout
    localStorage.removeItem('selectedProjectId')
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

  async function createInitialOperator(data: InitialOperatorSetupRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.setupInitialOperatorCreate(data)
      const { operator, accessToken: token, refreshToken: refresh } = response

      accessToken.value = token
      refreshToken.value = refresh
      currentOperator.value = {
        id: operator.id,
        name: operator.name,
        roles: operator.roles,
        version: 1,
        createdAt: null,
        updatedAt: null,
      }

      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create initial operator'
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
      currentOperator.value = response
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
    if (accessToken.value && !currentOperator.value) {
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
      
      // Update current operator with new profile data
      if (currentOperator.value) {
        currentOperator.value = {
          ...currentOperator.value,
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
    currentOperator,
    permissions,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshAccessToken,
    checkSetupStatus,
    createInitialOperator,
    fetchProfile,
    ensureProfile,
    updateProfile,
  }
})
