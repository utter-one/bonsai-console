import axios from 'axios'
import { Api } from './generated/Api'

// Create base axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
          const response = await axios.post(`${baseURL}/api/auth/refresh`, {
            refreshToken,
          })

          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Token refresh failed, clear storage and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
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
