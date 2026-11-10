/**
 * Session storage layer for the operator's authentication state.
 *
 * Owns every localStorage key related to the session so that both the axios
 * interceptor (`src/api/client.ts`) and the auth store (`src/stores/auth.ts`)
 * write the same shape. Keeping it dependency-free avoids an import cycle
 * between those two modules — the interceptor needs to update the store after a
 * passive 401 refresh, but the store already imports the API client.
 *
 * The access token alone is not enough to render the app: `permissions` drive
 * navigation gating and are only returned by /api/auth/login and
 * /api/auth/refresh. Caching the profile + permissions here means a page reload
 * can restore the session from localStorage instead of forcing a token refresh
 * on every boot.
 */
import type { ProfileResponse } from './types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const EXPIRES_AT_KEY = 'tokenExpiresAt'
const OPERATOR_KEY = 'sessionOperator'
const PERMISSIONS_KEY = 'sessionPermissions'

/** Treat the token as expired this long before it actually expires. */
export const TOKEN_EXPIRY_SKEW_MS = 60_000

export interface SessionSnapshot {
  accessToken: string | null
  refreshToken: string | null
  /** Epoch ms when the access token expires, null when unknown */
  expiresAt: number | null
  operator: ProfileResponse | null
  /** null means "never stored" (session from an older build), [] means "no permissions" */
  permissions: string[] | null
}

export interface SessionListener {
  (session: SessionSnapshot): void
}

const listeners = new Set<SessionListener>()

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // Private browsing modes can throw on storage access
    return null
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage full or unavailable — in-memory state still works for this tab
  }
}

function readJson<T>(key: string): T | null {
  const raw = safeGet(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    safeSet(key, null)
    return null
  }
}

/**
 * Read the `exp` claim (epoch ms) out of a JWT without verifying it.
 * Used as a fallback for sessions stored before we tracked `expiresIn`, so an
 * existing valid token is still recognised as valid after a deploy.
 */
export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

/** Cheap hot-path read for the request interceptor (no JSON parsing). */
export function readAccessToken(): string | null {
  return safeGet(ACCESS_TOKEN_KEY)
}

export function readSession(): SessionSnapshot {
  const accessToken = readAccessToken()
  const storedExpiry = readJson<number>(EXPIRES_AT_KEY)
  const decodedExpiry = accessToken ? decodeJwtExpiryMs(accessToken) : null
  const permissions = readJson<string[]>(PERMISSIONS_KEY)
  return {
    accessToken,
    refreshToken: safeGet(REFRESH_TOKEN_KEY),
    expiresAt: decodedExpiry ?? storedExpiry,
    operator: readJson<ProfileResponse>(OPERATOR_KEY),
    permissions: Array.isArray(permissions) ? permissions : null,
  }
}

/** True when an access token exists and is not within the expiry skew window. */
export function isAccessTokenValid(accessToken: string | null, expiresAt: number | null): boolean {
  if (!accessToken) return false
  if (expiresAt === null) return false
  return Date.now() < expiresAt - TOKEN_EXPIRY_SKEW_MS
}

/**
 * Persist the outcome of a login or refresh.
 * `expiresIn` is the lifetime in seconds the backend reports for the new access
 * token; `refreshToken` is omitted because /api/auth/refresh does not rotate it.
 *
 * The token's own `exp` claim wins over `expiresIn` because it is set by the
 * server and therefore immune to client clock skew.
 *
 * Returns the resolved expiry (epoch ms), or null when neither source is known.
 */
export function saveTokens(tokens: {
  accessToken: string
  expiresIn?: number
  refreshToken?: string | null
}): number | null {
  const expiresAt =
    decodeJwtExpiryMs(tokens.accessToken) ??
    (tokens.expiresIn != null ? Date.now() + tokens.expiresIn * 1000 : null)

  safeSet(ACCESS_TOKEN_KEY, tokens.accessToken)
  if (tokens.refreshToken !== undefined && tokens.refreshToken !== null) {
    safeSet(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }
  safeSet(EXPIRES_AT_KEY, expiresAt === null ? null : JSON.stringify(expiresAt))
  return expiresAt
}

export function saveOperator(operator: ProfileResponse | null) {
  safeSet(OPERATOR_KEY, operator ? JSON.stringify(operator) : null)
}

export function savePermissions(permissions: string[]) {
  safeSet(PERMISSIONS_KEY, JSON.stringify(permissions ?? []))
}

export function clearSession() {
  safeSet(ACCESS_TOKEN_KEY, null)
  safeSet(REFRESH_TOKEN_KEY, null)
  safeSet(EXPIRES_AT_KEY, null)
  safeSet(OPERATOR_KEY, null)
  safeSet(PERMISSIONS_KEY, null)
}

/** Subscribe to session changes made outside the store (i.e. by the 401 interceptor). */
export function onSessionUpdated(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifySessionUpdated() {
  const snapshot = readSession()
  listeners.forEach((listener) => listener(snapshot))
}
