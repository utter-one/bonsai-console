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
