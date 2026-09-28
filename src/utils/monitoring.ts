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

const BREAKER_BADGE: Record<string, string> = {
  closed: 'badge-secondary',
  'half-open': 'badge-warning',
  open: 'badge-danger',
}

/** Badge class for a circuit breaker state (null = no calls recorded yet). */
export function breakerBadgeClass(state: string | null): string {
  return state ? (BREAKER_BADGE[state] ?? 'badge-secondary') : 'badge-secondary'
}

/** Label for a circuit breaker state (null = no calls recorded yet). */
export function breakerLabel(state: string | null): string {
  if (!state) return 'no calls yet'
  return state === 'half-open' ? 'Half-open' : state.charAt(0).toUpperCase() + state.slice(1)
}

/** Format a 0–1 ok rate as a percentage (null = no data). */
export function formatOkRate(rate: number | null): string {
  return rate == null ? '—' : `${Math.round(rate * 100)}%`
}

/** Format a duration in ms (null = no data). */
export function formatMs(ms: number | null): string {
  return ms == null ? '—' : `${Math.round(ms)} ms`
}

/**
 * Worst non-unknown status among items (down > degraded > ok),
 * mirroring the backend's `overall` semantics: unknown items are ignored,
 * so a healthy set with not-yet-known items still reports `ok`.
 * Returns `unknown` when there are no known items, `null` when the list is empty.
 */
export function worstNonUnknownStatus(items: { status: string }[]): string | null {
  if (items.length === 0) return null
  const known = items.filter((i) => i.status !== 'unknown')
  if (known.length === 0) return 'unknown'
  if (known.some((i) => i.status === 'down')) return 'down'
  if (known.some((i) => i.status === 'degraded')) return 'degraded'
  return 'ok'
}

/** Badge class for a health-check status (ok / degraded / down / unknown). */
export function healthStatusClass(status: string): string {
  switch (status) {
    case 'ok': return 'badge-success'
    case 'degraded': return 'badge-warning'
    case 'down': return 'badge-danger'
    default: return 'badge-secondary'
  }
}

/** Label for a provider type (asr / tts / llm / embeddings / storage / channel). */
export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  llm: 'LLM',
  asr: 'ASR',
  tts: 'TTS',
  embeddings: 'Embeddings',
  storage: 'Storage',
  channel: 'Channel',
}

/** Fixed display order for provider-type groups. */
export const PROVIDER_TYPE_ORDER = ['llm', 'asr', 'tts', 'embeddings', 'storage', 'channel']

/** Aggregates of history rows bucketed into one bar segment (time slice). */
export interface SegmentStats {
  total: number
  ok: number
  degraded: number
  down: number
  unknown: number
}

/**
 * "One worse wins" per segment: down > degraded > unknown > ok.
 * unknown beats ok so a partially probed slice is never painted green.
 * `null` when the slice has no rows at all.
 */
export function segmentWorst(s: SegmentStats): 'ok' | 'degraded' | 'down' | 'unknown' | null {
  if (s.total === 0) return null
  if (s.down > 0) return 'down'
  if (s.degraded > 0) return 'degraded'
  if (s.unknown > 0) return 'unknown'
  return 'ok'
}

/** Compact per-segment counts, e.g. "1 down · 4 ok" (worst first). */
export function segmentCountsLabel(s: SegmentStats): string {
  if (s.total === 0) return 'no data'
  const parts: string[] = []
  if (s.down > 0) parts.push(`${s.down} down`)
  if (s.degraded > 0) parts.push(`${s.degraded} degraded`)
  if (s.ok > 0) parts.push(`${s.ok} ok`)
  if (s.unknown > 0) parts.push(`${s.unknown} unknown`)
  return parts.join(' · ')
}

/**
 * Bucket history rows into `segmentCount` time segments spanning
 * [sinceMs, endMs). Segment 0 is the oldest; segment order matches
 * left-to-right bar order. Rows outside the range or with a missing /
 * unparseable timestamp are ignored; status values outside the known
 * set are counted as unknown.
 */
export function bucketRowsToSegments(
  rows: { createdAt: string | null; status: string }[],
  segmentCount: number,
  sinceMs: number,
  endMs: number,
): SegmentStats[] {
  const sliceMs = (endMs - sinceMs) / segmentCount
  const segments: SegmentStats[] = Array.from({ length: segmentCount }, () => ({
    total: 0,
    ok: 0,
    degraded: 0,
    down: 0,
    unknown: 0,
  }))
  for (const row of rows) {
    if (!row.createdAt) continue
    const t = new Date(row.createdAt).getTime()
    if (Number.isNaN(t) || t < sinceMs || t > endMs) continue
    let idx = Math.floor((t - sinceMs) / sliceMs)
    if (idx < 0) idx = 0
    if (idx >= segmentCount) idx = segmentCount - 1
    const s = segments[idx]
    if (!s) continue
    s.total++
    if (row.status === 'down') s.down++
    else if (row.status === 'degraded') s.degraded++
    else if (row.status === 'ok') s.ok++
    else s.unknown++
  }
  return segments
}

/** Count summary for a status window, e.g. "58 ok · 1 degraded" (unknown omitted when 0). */
export function windowCountsLabel(w: { ok: number; degraded: number; down: number; unknown: number; total: number }): string {
  if (w.total === 0) return 'no data in window'
  const parts = [`${w.ok} ok`]
  if (w.degraded > 0) parts.push(`${w.degraded} degraded`)
  if (w.down > 0) parts.push(`${w.down} down`)
  if (w.unknown > 0) parts.push(`${w.unknown} unknown`)
  return parts.join(' · ')
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
