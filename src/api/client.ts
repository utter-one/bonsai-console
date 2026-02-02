import axios from 'axios'
import { Api } from './generated/Api'

// Create base axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

// Track token refresh to prevent concurrent refresh requests
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      
      // If no refresh token, clear state and reject
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        // If a refresh is already in progress, wait for it
        if (isRefreshing && refreshPromise) {
          const newAccessToken = await refreshPromise
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return axiosInstance(originalRequest)
        }

        // Start a new refresh
        isRefreshing = true
        refreshPromise = (async () => {
          const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
          const response = await axios.post(`${baseURL}/api/auth/refresh`, {
            refreshToken,
          })

          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          return accessToken
        })()

        const newAccessToken = await refreshPromise
        
        // Reset refresh state
        isRefreshing = false
        refreshPromise = null

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Token refresh failed, clear storage and redirect to login
        isRefreshing = false
        refreshPromise = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        
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
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

// Replace the instance with our enhanced axios instance
apiClient.instance = axiosInstance

export default apiClient

// Also export the raw axios instance for backward compatibility if needed
export { axiosInstance }
