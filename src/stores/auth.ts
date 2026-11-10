import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient, { requestTokenRefresh } from '@/api/client'
import {
  clearSession,
  isAccessTokenValid,
  onSessionUpdated,
  readSession,
  saveOperator,
  savePermissions,
  saveTokens,
} from '@/api/session'
import type {
  LoginRequest,
  ProfileResponse,
  InitialOperatorSetupRequest,
  UpdateProfileRequest,
} from '@/api/types'

/**
 * Unsubscribe hook for the interceptor-driven session updates. Kept at module
 * scope so re-creating the Pinia instance (tests, HMR) cannot stack listeners.
 */
let unsubscribeSession: (() => void) | null = null

/**
 * A rejected session: the backend refused the access token (and the interceptor's
 * refresh retry) or the refresh token itself. Anything else — network errors,
 * timeouts, 5xx — means the session may still be perfectly good and must not be
 * thrown away.
 */
function isSessionRejected(err: unknown): boolean {
  const status = (err as any)?.response?.status
  return status === 401 || status === 403
}

export const useAuthStore = defineStore('auth', () => {
  // Restore the whole session, not just the tokens: `permissions` gate navigation
  // and are only ever handed out by /api/auth/login and /api/auth/refresh, so a
  // reload that only restores tokens has to pick them back up from here.
  const stored = readSession()

  const accessToken = ref<string | null>(stored.accessToken)
  const refreshToken = ref<string | null>(stored.refreshToken)
  const tokenExpiresAt = ref<number | null>(stored.expiresAt)
  const currentOperator = ref<ProfileResponse | null>(stored.operator)
  const permissions = ref<string[]>(stored.permissions ?? [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * False when localStorage holds no permissions at all — which is the case for a
   * session stored by an older build, and the only reason to spend a refresh on
   * them at boot. An operator who genuinely has no permissions has `[]` stored,
   * so this stays true and no refresh loop happens.
   */
  let hasPermissionsSnapshot = stored.permissions !== null

  const isAuthenticated = computed(() => !!accessToken.value)

  /**
   * Whether the stored access token can still be used as-is. A reload with a valid
   * token must not spend a round trip on /api/auth/refresh.
   */
  const isTokenValid = computed(() => isAccessTokenValid(accessToken.value, tokenExpiresAt.value))

  // The axios interceptor refreshes tokens passively on a 401 and cannot import
  // this store (cycle), so it publishes the new session instead.
  if (unsubscribeSession) unsubscribeSession()
  unsubscribeSession = onSessionUpdated((session) => {
    accessToken.value = session.accessToken
    refreshToken.value = session.refreshToken
    tokenExpiresAt.value = session.expiresAt
    if (session.permissions) {
      permissions.value = session.permissions
      hasPermissionsSnapshot = true
    }
    if (session.operator && currentOperator.value) {
      currentOperator.value = { ...currentOperator.value, roles: session.operator.roles }
    }
  })

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.authLoginCreate(credentials)
      const {
        accessToken: token,
        refreshToken: refresh,
        expiresIn,
        operatorId,
        displayName,
        roles,
        permissions: perms,
      } = response

      const operator: ProfileResponse = {
        id: operatorId,
        name: displayName,
        roles,
        version: 0,
        createdAt: null,
        updatedAt: null,
      }

      accessToken.value = token
      refreshToken.value = refresh
      permissions.value = perms
      currentOperator.value = operator
      hasPermissionsSnapshot = true
      tokenExpiresAt.value = saveTokens({ accessToken: token, expiresIn, refreshToken: refresh })
      saveOperator(operator)
      savePermissions(perms)

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
      // Nothing to refresh with — the session is unrecoverable.
      logout()
      throw new Error('No refresh token available')
    }

    try {
      // Goes through the shared, non-intercepted refresh call so a rejected
      // refresh token cannot re-enter the 401 handler. That call owns persistence
      // (tokens, expiry, permissions, cached roles), so this only mirrors the
      // result into reactive state.
      const response = await requestTokenRefresh(refreshToken.value)

      accessToken.value = response.accessToken
      permissions.value = response.permissions
      tokenExpiresAt.value = readSession().expiresAt

      if (currentOperator.value) {
        currentOperator.value = { ...currentOperator.value, roles: response.roles }
      }

      return response
    } catch (err) {
      // Only a rejected refresh token ends the session. A timeout or a 5xx from
      // /api/auth/refresh must not log out an operator holding a valid token.
      if (isSessionRejected(err)) {
        logout()
      }
      throw err
    }
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    tokenExpiresAt.value = null
    currentOperator.value = null
    permissions.value = []
    hasPermissionsSnapshot = false

    clearSession()

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
      const { operator, accessToken: token, refreshToken: refresh, expiresIn } = response

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

      tokenExpiresAt.value = saveTokens({ accessToken: token, expiresIn, refreshToken: refresh })
      saveOperator(currentOperator.value)
      // The setup response carries no permissions, so the first protected
      // navigation refreshes once to obtain them.
      hasPermissionsSnapshot = false

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
      saveOperator(response)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch profile'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Make the session usable before rendering a protected route.
   *
   * After a reload the tokens, profile and permissions all come back from
   * localStorage, so the common case is a no-op — no /api/auth/refresh and no
   * /api/profile round trip blocking the router guard. We only pay for what is
   * actually missing:
   * - a refresh when the access token is expired (or about to be), or when no
   *   permissions were cached (sessions stored by an older build);
   * - a profile fetch when there is no cached profile to render.
   *
   * A token that expires mid-session is still handled by the 401 retry in
   * `src/api/client.ts`.
   */
  async function ensureProfile() {
    if (!accessToken.value) return

    try {
      if (!isTokenValid.value || !hasPermissionsSnapshot) {
        await refreshAccessToken()
      }
      if (!currentOperator.value) {
        await fetchProfile()
      }
    } catch (err) {
      if (isSessionRejected(err)) {
        logout()
      }
      throw err
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
        saveOperator(currentOperator.value)
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
    tokenExpiresAt,
    currentOperator,
    permissions,
    isLoading,
    error,
    isAuthenticated,
    isTokenValid,
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
