import axios from 'axios'
import { Api } from './generated/Api'
import {
  clearSession,
  notifySessionUpdated,
  readAccessToken,
  readSession,
  saveOperator,
  savePermissions,
  saveTokens,
} from './session'
import type { RefreshTokenResponse } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

// Create base axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Single-flight refresh: concurrent 401s share one /api/auth/refresh round trip.
let refreshPromise: Promise<RefreshTokenResponse> | null = null

/**
 * Exchange the stored refresh token for a new access token and persist the
 * result. Deliberately uses a bare axios call rather than `apiClient`: routing
 * this through the intercepted instance would make a rejected refresh token
 * re-enter the 401 handler. Both the interceptor and the auth store go through
 * here so a refresh is never issued twice.
 *
 * The response also carries up-to-date roles/permissions, so a passive refresh
 * keeps navigation gating in sync with the server.
 */
export function requestTokenRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await axios.post<RefreshTokenResponse>(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      })
      const { accessToken, expiresIn, roles, permissions } = response.data

      saveTokens({ accessToken, expiresIn })
      if (Array.isArray(permissions)) {
        savePermissions(permissions)
      }
      if (Array.isArray(roles)) {
        // Keep the cached profile's roles in step with the new token.
        const cached = readSession().operator
        if (cached) saveOperator({ ...cached, roles })
      }
      // The auth store cannot be imported here (it imports this module), so let it
      // pick up the new token and permissions through the session listener.
      notifySessionUpdated()

      return response.data
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = readAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Client-generated correlation id; the backend echoes it back as X-Request-Id on
    // every response so failures can be matched against server logs (support tickets).
    config.headers['X-Request-Id'] = crypto.randomUUID()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check if this is a 401 error and not already a retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const { refreshToken } = readSession()

      // If no refresh token, clear state and reject
      if (!refreshToken) {
        clearSession()
        notifySessionUpdated()
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const { accessToken: newAccessToken } = await requestTokenRefresh(refreshToken)

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Token refresh failed, clear storage and redirect to login
        clearSession()
        notifySessionUpdated()

        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Create and export the generated API client with the configured axios instance
const apiClient = new Api({
  baseURL: API_BASE_URL,
})

// Replace the instance with our enhanced axios instance
apiClient.instance = axiosInstance

export default apiClient

// Also export the raw axios instance for backward compatibility if needed
export { axiosInstance }
