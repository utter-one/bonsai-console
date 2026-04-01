export function fmtMs(ms: number): string {
  if (ms < 10_000) return `${Math.round(ms).toLocaleString()} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`
  if (ms < 3_600_000) {
    const mins = Math.floor(ms / 60_000)
    const secs = Math.floor((ms % 60_000) / 1000)
    return `${mins}m ${secs}s`
  }
  const hours = Math.floor(ms / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const secs = Math.floor((ms % 60_000) / 1000)
  return `${hours}h ${mins}m ${secs}s`
}

export function fmtMetric(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '—'
  if (unit === 'ms') return fmtMs(value)
  return value.toLocaleString()
}

export function formatBucket(bucket: string | null, interval: string): string {
  if (!bucket) return '—'
  const date = new Date(bucket)
  if (interval === 'hour') {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  if (interval === 'month') {
    return date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
  }
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric' })
}
