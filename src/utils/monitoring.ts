import type { ProviderMonitoringItem } from '@/api/types'

/**
 * Display-name and formatting helpers for monitoring surfaces.
 */

const PROBE_BADGE: Record<string, string> = {
  ok: 'badge-success',
  degraded: 'badge-warning',
  down: 'badge-danger',
  unknown: 'badge-secondary',
}

/** Badge class for a provider probe status (null = not probed yet). */
export function probeBadgeClass(status: string | null): string {
  return status ? (PROBE_BADGE[status] ?? 'badge-secondary') : 'badge-secondary'
}

/** Label for a provider probe status (null = not probed yet). */
export function probeLabel(status: string | null): string {
  return status ?? 'not probed'
}

/** Format a 0–1 ok rate as a percentage (null = no data). */
export function formatOkRate(rate: number | null): string {
  return rate == null ? '—' : `${Math.round(rate * 100)}%`
}

/** Format a duration in ms (null = no data). */
export function formatMs(ms: number | null): string {
  return ms == null ? '—' : `${Math.round(ms)} ms`
}

/** Top error-code chips from the rolling window, as {code, count} pairs. */
export function topErrorChips(provider: ProviderMonitoringItem): { code: string; count: number }[] {
  return (provider.rolling.topErrorCodes ?? []).map((pair) => ({
    code: String(pair[0] ?? ''),
    count: Number(pair[1] ?? 0),
  }))
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** True when a health check is a per-provider probe (`provider:<id>`). */
export function isProviderCheck(name: string): boolean {
  return name.startsWith('provider:')
}

/**
 * Human-readable name for a health check.
 *
 * - `db` → "Database"
 * - `process` → "Process"
 * - `service_heartbeat:benchmark-executor` → "Benchmark executor"
 * - `provider:<id>` → the provider's name (falls back to the id)
 */
export function formatHealthCheckName(name: string, providerNames?: Record<string, string>): string {
  if (name.startsWith('provider:')) {
    const providerId = name.slice('provider:'.length)
    return providerNames?.[providerId] ?? `Provider ${providerId}`
  }
  if (name.startsWith('service_heartbeat:')) {
    return humanizeSlug(name.slice('service_heartbeat:'.length))
  }
  switch (name) {
    case 'db':
      return 'Database'
    case 'process':
      return 'Process'
    default:
      return humanizeSlug(name)
  }
}
