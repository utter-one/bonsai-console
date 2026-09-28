<script setup lang="ts">
import { computed } from 'vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { breakerBadgeClass, breakerLabel } from '@/utils/monitoring'

const props = defineProps<{
  detail: Record<string, unknown> | null | undefined
}>()

type EntryKind = 'null' | 'bool' | 'number' | 'string' | 'date' | 'breaker' | 'json'

interface Entry {
  key: string
  label: string
  kind: EntryKind
  text?: string
  date?: string
  breaker?: string
  /** Spans the full grid width (long strings, nested payloads). */
  wide: boolean
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const BREAKER_STATES = new Set(['closed', 'half-open', 'open'])

/** `poolTotal` → "Pool total" — unit suffixes (Ms/Sec/Bytes/At) are dropped since the value carries them. */
function humanizeKey(key: string): string {
  const stripped = key.replace(/(Ms|Secs?|Bytes|At)$/, '')
  const spaced = stripped
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!spaced) return key
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let value = n / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

function formatDuration(n: number): string {
  if (n < 60) return `${n}s`
  if (n < 3600) return `${Math.floor(n / 60)}m ${Math.floor(n % 60)}s`
  if (n < 86400) return `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`
  return `${Math.floor(n / 86400)}d ${Math.floor((n % 86400) / 3600)}h`
}

function formatNumber(key: string, n: number): string {
  if (/Bytes$/.test(key)) return formatBytes(n)
  if (/Ms$/.test(key)) return `${Math.round(n)} ms`
  if (/Secs?$/.test(key)) return formatDuration(n)
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toFixed(1)
}

function makeEntry(key: string, value: unknown): Entry {
  const label = humanizeKey(key)
  if (value == null) return { key, label, kind: 'null', text: '—', wide: false }
  if (typeof value === 'boolean') return { key, label, kind: 'bool', text: value ? 'Yes' : 'No', wide: false }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { key, label, kind: 'null', text: '—', wide: false }
    return { key, label, kind: 'number', text: formatNumber(key, value), wide: false }
  }
  if (typeof value === 'string') {
    if (ISO_DATE_RE.test(value)) return { key, label, kind: 'date', date: value, wide: false }
    if (key === 'circuitBreaker' && BREAKER_STATES.has(value)) {
      return { key, label, kind: 'breaker', breaker: value, wide: false }
    }
    return { key, label, kind: 'string', text: value, wide: value.length > 60 }
  }
  // Nested objects/arrays are not expected — fall back to pretty JSON.
  return { key, label, kind: 'json', text: JSON.stringify(value, null, 2), wide: true }
}

const entries = computed<Entry[]>(() => {
  const src = props.detail
  if (!src || typeof src !== 'object') return []
  return Object.entries(src).map(([key, value]) => makeEntry(key, value))
})
</script>

<template>
  <div class="@container">
    <div class="grid grid-cols-1 @md:grid-cols-2 gap-x-6 gap-y-3">
      <div
        v-for="entry in entries"
        :key="entry.key"
        :class="{ '@md:col-span-2': entry.wide }"
      >
        <div class="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {{ entry.label }}
        </div>
        <div class="mt-0.5 text-sm break-words text-gray-800 dark:text-gray-200">
          <RelativeDate v-if="entry.kind === 'date'" :date="entry.date" />
          <span
            v-else-if="entry.kind === 'breaker'"
            class="badge capitalize"
            :class="breakerBadgeClass(entry.breaker ?? null)"
          >
            {{ breakerLabel(entry.breaker ?? null) }}
          </span>
          <pre v-else-if="entry.kind === 'json'" class="font-mono text-xs whitespace-pre-wrap">{{ entry.text }}</pre>
          <span v-else :class="{ 'text-gray-400 dark:text-gray-500': entry.kind === 'null' }">{{ entry.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
