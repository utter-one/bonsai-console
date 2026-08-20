import type { RuleOverride } from '@/api/types'

/**
 * Display helpers for platform monitoring alerts and rule overrides.
 *
 * The rule *catalog* itself (ids, summaries, scope, default severity, default
 * params) is served live by the backend at GET /api/monitoring/rules
 * (`monitoringStore.ruleCatalog`) — the same registry the alert engine
 * evaluates from, so it never drifts from the keys `rules` accepts. This
 * module only holds pure display helpers that work without a server
 * round-trip (label fallbacks, badge classes, filter options).
 */

/** Human-readable label for a rule id ("stream-slow-ttft" → "Stream Slow TTFT"). */
const ACRONYMS: Record<string, string> = {
  api: 'API',
  db: 'DB',
  imap: 'IMAP',
  llm: 'LLM',
  oauth: 'OAuth',
  asr: 'ASR',
  tts: 'TTS',
  ttft: 'TTFT',
  rtf: 'RTF',
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function ruleLabel(ruleId: string): string {
  return humanizeSlug(ruleId) || ruleId
}

/**
 * Display areas for grouping the live rule catalog in the config editor.
 * Derived from rule id prefixes — rules from a newer engine that don't match
 * any prefix fall through to RULE_AREA_OTHER, so nothing is ever hidden.
 */
export const RULE_AREAS: { label: string; prefixes: string[] }[] = [
  { label: 'Database', prefixes: ['db-'] },
  { label: 'Background services', prefixes: ['service-'] },
  { label: 'Upstream providers', prefixes: ['provider-'] },
  { label: 'API surface', prefixes: ['api-', 'auth-'] },
  { label: 'Background service failures', prefixes: ['oauth-', 'imap-'] },
  { label: 'Process health', prefixes: ['high-memory', 'event-loop'] },
  { label: 'Streaming quality', prefixes: ['stream-'] },
  { label: 'TTS / ASR quality', prefixes: ['tts-', 'asr-'] },
  { label: 'Failover', prefixes: ['fallback-'] },
]

export const RULE_AREA_OTHER = 'Other'

/** Group label for a rule id (prefix match, 'Other' fallback). */
export function ruleArea(ruleId: string): string {
  for (const area of RULE_AREAS) {
    if (area.prefixes.some((p) => ruleId.startsWith(p))) return area.label
  }
  return RULE_AREA_OTHER
}

export type RuleSeverity = 'info' | 'warning' | 'critical'

const SEVERITY_BADGE: Record<RuleSeverity, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  critical: 'badge-danger',
}

/** Badge class for an alert/rule severity. */
export function severityBadgeClass(severity: string): string {
  return SEVERITY_BADGE[severity as RuleSeverity] ?? 'badge-secondary'
}

export const SEVERITY_OPTIONS: { value: '' | RuleSeverity; label: string }[] = [
  { value: '', label: 'All severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
]

export const ALERT_STATUS_OPTIONS: { value: '' | 'firing' | 'resolved'; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'firing', label: 'Firing' },
  { value: 'resolved', label: 'Resolved' },
]

const STATUS_BADGE: Record<string, string> = {
  firing: 'badge-danger',
  resolved: 'badge-success',
}

/** Badge class for an alert status. */
export function alertStatusBadgeClass(status: string): string {
  return STATUS_BADGE[status] ?? 'badge-secondary'
}

/** Which override fields are set to non-default values (used for the "Overridden" badge). */
export function overrideFieldCount(override: RuleOverride | undefined): number {
  if (!override) return 0
  return Object.values(override).filter((v) => v !== undefined && v !== null && v !== '').length
}
