import type { RuleOverride } from '@/api/types'

/**
 * Curated catalog of alert rule ids defined by the backend alert engine (P2-01).
 * Mirrors the METRIC_CATALOG pattern: the backend ships new rule ids in
 * config/alert payloads, so unknown ids fall back to a humanized label.
 */
export interface RuleDefinition {
  /** Stable rule id (key in the monitoring config `rules` map) */
  id: string
  /** Human-readable label for UI */
  label: string
  /** What the rule watches for */
  description: string
  /** Semantics of the rule's threshold — drives the unit suffix in the override editor */
  thresholdUnit?: 'rate' | 'count' | 'ms'
  /** Severity the rule fires at when no override sets one */
  defaultSeverity?: 'info' | 'warning' | 'critical'
}

export const RULE_CATALOG: RuleDefinition[] = [
  {
    id: 'provider-down',
    label: 'Provider down',
    description:
      'Fires when a provider\'s health probes keep failing — the provider is treated as down. Scope: one event per provider.',
    thresholdUnit: 'count',
    defaultSeverity: 'critical',
  },
]

export const RULE_CATALOG_BY_ID: Record<string, RuleDefinition> = Object.fromEntries(
  RULE_CATALOG.map((r) => [r.id, r])
)

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Human-readable label for a rule id (catalog label, or humanized slug for unknown rules). */
export function ruleLabel(ruleId: string): string {
  return RULE_CATALOG_BY_ID[ruleId]?.label ?? humanizeSlug(ruleId)
}

/** True when the id is a known catalog rule. */
export function isKnownRule(ruleId: string): boolean {
  return ruleId in RULE_CATALOG_BY_ID
}

/** Unit suffix for a rule's threshold field (empty when unknown). */
export function thresholdUnitSuffix(ruleId: string): string {
  switch (RULE_CATALOG_BY_ID[ruleId]?.thresholdUnit) {
    case 'rate':
      return '/min'
    case 'count':
      return 'failures'
    case 'ms':
      return 'ms'
    default:
      return ''
  }
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
