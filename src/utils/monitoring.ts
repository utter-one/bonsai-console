/**
 * Display-name helpers for monitoring surfaces.
 */

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
