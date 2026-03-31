<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useAuthStore } from '@/stores'
import { Plus, X, Play, ChevronRight, ChevronDown, Bookmark, BookmarkCheck, RefreshCw, Check, CalendarDays } from 'lucide-vue-next'
import type { SourceEntry, SourceMetric, SliceQueryRow, SavedSliceQuery, SliceQuery, RelativeTime } from '@/api/generated/data-contracts'
import { formatEnum } from '@/composables'

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()
const authStore = useAuthStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const canEditSavedQuery = (q: SavedSliceQuery) =>
  q.operatorId === authStore.currentOperator?.id ||
  (authStore.currentOperator?.roles.includes('super_admin') ?? false)

type AggFn = 'count' | 'sum' | 'avg' | 'p50' | 'p95' | 'p99' | 'min' | 'max'

interface SelectedMetric {
  spec: string
  label: string
}

interface DimensionFilter {
  dimensionId: string
  value: string
}

const selectedSource = ref<string>('turns')
const selectedDimensions = ref<string[]>([])
const selectedNormalizeBy = ref<string>('')
const selectedMetrics = ref<SelectedMetric[]>([{ spec: 'count', label: 'Count' }])
const filterInterval = ref<'hour' | 'day' | 'week' | 'month' | ''>('day')
const dimensionFilters = ref<DimensionFilter[]>([])
const queryLimit = ref(1000)

// Time range state
type TimeRangeMode = 'relative' | 'absolute' | 'all'
const timeRangeMode = ref<TimeRangeMode>('relative')
const relativeTimeAmount = ref(7)
const relativeTimeUnit = ref<RelativeTime['unit']>('days')
const absoluteFrom = ref('')
const absoluteTo = ref('')
const showTimeRangePicker = ref(false)
const timeRangePickerRef = useTemplateRef<HTMLElement>('timeRangePickerRef')

// Saved queries state
const activeQuery = ref<SavedSliceQuery | null>(null)
const isSaving = ref(false)
const saveError = ref<string | null>(null)

// Query selector dropdown
const showQuerySelector = ref(false)
const querySelectorRef = useTemplateRef<HTMLElement>('querySelectorRef')

// Save-as dialog
const showSaveDialog = ref(false)
const saveDialogName = ref('')
const saveDialogShared = ref(false)
const saveDialogRef = useTemplateRef<HTMLElement>('saveDialogRef')

// Rename dialog
const showRenameDialog = ref(false)
const renameDialogName = ref('')

// Save split-button overflow menu
const showSaveMenu = ref(false)
const saveMenuRef = useTemplateRef<HTMLElement>('saveMenuRef')

// Metric builder state
const showMetricPicker = ref(false)
const pickerMetricId = ref<string>('')
const pickerAggFn = ref<AggFn>('avg')

// Dimension picker state
const showDimPicker = ref(false)

// Dimension filter add state
const showFilterPicker = ref(false)
const filterPickerDimensionId = ref<string>('')
const filterPickerValue = ref<string>('')

// Click-outside refs
const dimPickerRef = useTemplateRef<HTMLElement>('dimPickerRef')
const metricPickerRef = useTemplateRef<HTMLElement>('metricPickerRef')
const filterPickerRef = useTemplateRef<HTMLElement>('filterPickerRef')

function handleDocumentMousedown(e: MouseEvent) {
  const target = e.target as Node
  if (showDimPicker.value && dimPickerRef.value && !dimPickerRef.value.contains(target)) {
    showDimPicker.value = false
  }
  if (showMetricPicker.value && metricPickerRef.value && !metricPickerRef.value.contains(target)) {
    showMetricPicker.value = false
  }
  if (showFilterPicker.value && filterPickerRef.value && !filterPickerRef.value.contains(target)) {
    showFilterPicker.value = false
  }
  if (showTimeRangePicker.value && timeRangePickerRef.value && !timeRangePickerRef.value.contains(target)) {
    showTimeRangePicker.value = false
  }
  if (showQuerySelector.value && querySelectorRef.value && !querySelectorRef.value.contains(target)) {
    showQuerySelector.value = false
  }
  if (showSaveMenu.value && saveMenuRef.value && !saveMenuRef.value.contains(target)) {
    showSaveMenu.value = false
  }
  if (showSaveDialog.value && saveDialogRef.value && !saveDialogRef.value.contains(target)) {
    showSaveDialog.value = false
    showRenameDialog.value = false
  }
}

const sources = computed(() => analyticsStore.sourceCatalog?.sources ?? [])

const currentSource = computed<SourceEntry | null>(
  () => sources.value.find(s => s.id === selectedSource.value) ?? null
)

const availableDimensions = computed(() => currentSource.value?.dimensions ?? [])
const availableMetrics = computed(() => currentSource.value?.metrics ?? [])

const unselectedDimensions = computed(() =>
  availableDimensions.value.filter(d => !selectedDimensions.value.includes(d.id))
)

const unselectedFilterDimensions = computed(() =>
  availableDimensions.value.filter(d => !dimensionFilters.value.some(f => f.dimensionId === d.id))
)

function aggFnsForMetric(metric: SourceMetric): AggFn[] {
  switch (metric.unit) {
    case 'ms': return ['avg', 'p50', 'p95', 'p99', 'min', 'max']
    case 'tokens': return ['sum', 'avg', 'p95']
    default: return ['count']
  }
}

const pickerMetric = computed<SourceMetric | null>(
  () => availableMetrics.value.find(m => m.id === pickerMetricId.value) ?? null
)

const pickerAggFns = computed<AggFn[]>(() =>
  pickerMetric.value ? aggFnsForMetric(pickerMetric.value) : []
)

function openMetricPicker() {
  pickerMetricId.value = availableMetrics.value[0]?.id ?? ''
  if (pickerMetricId.value) {
    const first = availableMetrics.value[0]!
    pickerAggFn.value = aggFnsForMetric(first)[0] ?? 'avg'
  }
  showMetricPicker.value = true
}

watch(pickerMetricId, (id) => {
  const m = availableMetrics.value.find(m => m.id === id)
  if (m) pickerAggFn.value = aggFnsForMetric(m)[0] ?? 'avg'
})

function addMetric() {
  if (!pickerMetricId.value) return
  let spec: string
  let label: string
  if (pickerAggFn.value === 'count') {
    spec = 'count'
    label = 'Count'
  } else {
    spec = `${pickerAggFn.value}:${pickerMetricId.value}`
    const metricLabel = availableMetrics.value.find(m => m.id === pickerMetricId.value)?.label ?? pickerMetricId.value
    label = `${pickerAggFn.value.toUpperCase()}: ${metricLabel}`
  }
  if (!selectedMetrics.value.some(m => m.spec === spec)) {
    selectedMetrics.value.push({ spec, label })
  }
  showMetricPicker.value = false
}

function addCountMetric() {
  if (!selectedMetrics.value.some(m => m.spec === 'count')) {
    selectedMetrics.value.push({ spec: 'count', label: 'Count' })
  }
}

function removeMetric(spec: string) {
  selectedMetrics.value = selectedMetrics.value.filter(m => m.spec !== spec)
}

function addDimension(id: string) {
  if (selectedDimensions.value.length < 5 && !selectedDimensions.value.includes(id)) {
    selectedDimensions.value.push(id)
  }
}

function removeDimension(id: string) {
  selectedDimensions.value = selectedDimensions.value.filter(d => d !== id)
}

function getDimensionLabel(id: string): string {
  return availableDimensions.value.find(d => d.id === id)?.label ?? id
}

function openFilterPicker() {
  filterPickerDimensionId.value = unselectedFilterDimensions.value[0]?.id ?? ''
  filterPickerValue.value = ''
  showFilterPicker.value = true
}

function addFilter() {
  if (!filterPickerDimensionId.value || !filterPickerValue.value) return
  dimensionFilters.value.push({ dimensionId: filterPickerDimensionId.value, value: filterPickerValue.value })
  showFilterPicker.value = false
}

function removeFilter(dimensionId: string) {
  dimensionFilters.value = dimensionFilters.value.filter(f => f.dimensionId !== dimensionId)
}

const filterPickerDimension = computed(() =>
  availableDimensions.value.find(d => d.id === filterPickerDimensionId.value) ?? null
)

watch(filterPickerDimensionId, () => {
  filterPickerValue.value = filterPickerDimension.value?.values?.[0] ?? ''
})

function onSourceChange(newSource: string) {
  selectedSource.value = newSource
  selectedDimensions.value = []
  selectedNormalizeBy.value = ''
  selectedMetrics.value = [{ spec: 'count', label: 'Count' }]
  dimensionFilters.value = []
  showDimPicker.value = false
  showMetricPicker.value = false
  showFilterPicker.value = false
}

function buildCurrentSliceQuery(): SliceQuery {
  const filtersRecord: Record<string, string> = {}
  for (const f of dimensionFilters.value) {
    filtersRecord[f.dimensionId] = f.value
  }
  return {
    source: selectedSource.value as SliceQuery['source'],
    groupBy: selectedDimensions.value.length > 0 ? selectedDimensions.value : undefined,
    normalizeBy: selectedNormalizeBy.value || undefined,
    metrics: selectedMetrics.value.map(m => m.spec),
    interval: (filterInterval.value || undefined) as SliceQuery['interval'],
    relativeTime: timeRangeMode.value === 'relative'
      ? { amount: relativeTimeAmount.value, unit: relativeTimeUnit.value }
      : undefined,
    from: timeRangeMode.value === 'absolute' && absoluteFrom.value
      ? new Date(absoluteFrom.value).toISOString()
      : undefined,
    to: timeRangeMode.value === 'absolute' && absoluteTo.value
      ? new Date(absoluteTo.value).toISOString()
      : undefined,
    filters: Object.keys(filtersRecord).length > 0 ? filtersRecord : undefined,
    limit: queryLimit.value,
  }
}

async function runQuery() {
  if (!projectId.value) return
  if (selectedMetrics.value.length === 0) return
  await analyticsStore.runQuery(projectId.value, buildCurrentSliceQuery())
}

function resolveMetricLabel(spec: string): string {
  if (spec === 'count') return 'Count'
  const parts = spec.split(':')
  if (parts.length !== 2) return spec
  const [fn, metricId] = parts
  const metricLabel = availableMetrics.value.find(m => m.id === metricId)?.label ?? metricId
  return `${fn!.toUpperCase()}: ${metricLabel}`
}

function loadQuery(q: SavedSliceQuery) {
  const sq = q.query
  selectedSource.value = sq.source
  selectedDimensions.value = sq.groupBy ?? []
  selectedNormalizeBy.value = sq.normalizeBy ?? ''
  selectedMetrics.value = sq.metrics.map(spec => ({ spec, label: resolveMetricLabel(spec) }))
  filterInterval.value = (sq.interval ?? '') as typeof filterInterval.value
  dimensionFilters.value = Object.entries(sq.filters ?? {}).map(([dimensionId, value]) => ({ dimensionId, value }))
  queryLimit.value = sq.limit ?? 1000
  if (sq.relativeTime) {
    timeRangeMode.value = 'relative'
    relativeTimeAmount.value = sq.relativeTime.amount
    relativeTimeUnit.value = sq.relativeTime.unit
  } else if (sq.from || sq.to) {
    timeRangeMode.value = 'absolute'
    absoluteFrom.value = sq.from ? sq.from.slice(0, 16) : ''
    absoluteTo.value = sq.to ? sq.to.slice(0, 16) : ''
  } else {
    timeRangeMode.value = 'all'
  }
  activeQuery.value = q
  showQuerySelector.value = false
}

function clearActiveQuery() {
  selectedSource.value = 'turns'
  selectedDimensions.value = []
  selectedNormalizeBy.value = ''
  selectedMetrics.value = [{ spec: 'count', label: 'Count' }]
  dimensionFilters.value = []
  queryLimit.value = 1000
  filterInterval.value = 'day'
  timeRangeMode.value = 'relative'
  relativeTimeAmount.value = 7
  relativeTimeUnit.value = 'days'
  activeQuery.value = null
  showQuerySelector.value = false
}

const relativePresets: { label: string; amount: number; unit: RelativeTime['unit'] }[] = [
  { label: '1h', amount: 1, unit: 'hours' },
  { label: '24h', amount: 24, unit: 'hours' },
  { label: '7d', amount: 7, unit: 'days' },
  { label: '30d', amount: 30, unit: 'days' },
  { label: '3mo', amount: 3, unit: 'months' },
]

function setRelativePreset(p: { amount: number; unit: RelativeTime['unit'] }) {
  relativeTimeAmount.value = p.amount
  relativeTimeUnit.value = p.unit
}

function relativeToMs(amount: number, unit: RelativeTime['unit']): number {
  const ms = { hours: 3600_000, days: 86400_000, weeks: 604800_000, months: 30 * 86400_000 }
  return amount * ms[unit]
}

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function switchTimeRangeMode(mode: TimeRangeMode) {
  if (mode === 'absolute' && timeRangeMode.value === 'relative') {
    const now = new Date()
    const from = new Date(now.getTime() - relativeToMs(relativeTimeAmount.value, relativeTimeUnit.value))
    absoluteFrom.value = toLocalDatetimeInput(from)
    absoluteTo.value = toLocalDatetimeInput(now)
  }
  timeRangeMode.value = mode
}

const timeRangeLabel = computed<string>(() => {
  if (timeRangeMode.value === 'all') return 'All time'
  if (timeRangeMode.value === 'relative') {
    return `Last ${relativeTimeAmount.value} ${relativeTimeUnit.value}`
  }
  const from = absoluteFrom.value ? new Date(absoluteFrom.value).toLocaleDateString() : '?'
  const to = absoluteTo.value ? new Date(absoluteTo.value).toLocaleDateString() : '?'
  return `${from} – ${to}`
})

function openSaveDialog() {
  saveDialogName.value = ''
  saveDialogShared.value = false
  saveError.value = null
  showSaveMenu.value = false
  showRenameDialog.value = false
  showSaveDialog.value = true
}

function openRenameDialog() {
  if (!activeQuery.value) return
  renameDialogName.value = activeQuery.value.name
  saveError.value = null
  showSaveMenu.value = false
  showSaveDialog.value = false
  showRenameDialog.value = true
}

async function renameActiveQuery() {
  if (!activeQuery.value || !projectId.value || !renameDialogName.value.trim()) return
  isSaving.value = true
  saveError.value = null
  try {
    const updated = await analyticsStore.updateSavedQuery(projectId.value, activeQuery.value.id, {
      name: renameDialogName.value.trim(),
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
    showRenameDialog.value = false
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to rename query'
  } finally {
    isSaving.value = false
  }
}

async function toggleShareActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  isSaving.value = true
  saveError.value = null
  showSaveMenu.value = false
  try {
    const updated = await analyticsStore.updateSavedQuery(projectId.value, activeQuery.value.id, {
      isShared: !activeQuery.value.isShared,
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to update query'
  } finally {
    isSaving.value = false
  }
}

async function saveAsNew() {
  if (!projectId.value || !saveDialogName.value.trim()) return
  isSaving.value = true
  saveError.value = null
  try {
    const created = await analyticsStore.createSavedQuery(projectId.value, {
      name: saveDialogName.value.trim(),
      query: buildCurrentSliceQuery(),
      isShared: saveDialogShared.value,
    })
    activeQuery.value = created
    showSaveDialog.value = false
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to save query'
  } finally {
    isSaving.value = false
  }
}

async function updateActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  isSaving.value = true
  saveError.value = null
  try {
    const updated = await analyticsStore.updateSavedQuery(projectId.value, activeQuery.value.id, {
      query: buildCurrentSliceQuery(),
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to update query'
  } finally {
    isSaving.value = false
  }
}

async function deleteActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  if (!confirm(`Delete saved query "${activeQuery.value.name}"?`)) return
  isSaving.value = true
  saveError.value = null
  try {
    await analyticsStore.deleteSavedQuery(projectId.value, activeQuery.value.id, activeQuery.value.version)
    activeQuery.value = null
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to delete query'
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (projectId.value) {
    await Promise.all([
      analyticsStore.fetchSourceCatalog(projectId.value),
      analyticsStore.fetchSavedQueries(projectId.value),
    ])
  }
  document.addEventListener('mousedown', handleDocumentMousedown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown)
})

watch(projectId, async (newId) => {
  if (newId) {
    activeQuery.value = null
    await Promise.all([
      analyticsStore.fetchSourceCatalog(newId),
      analyticsStore.fetchSavedQueries(newId),
    ])
  }
})

const result = computed(() => analyticsStore.sliceResult)

const tableColumns = computed(() => {
  if (!result.value) return []
  const cols: { key: string; label: string; numeric: boolean }[] = []
  if (result.value.interval) {
    cols.push({ key: '__bucket', label: 'Time', numeric: false })
  }
  for (const dimId of result.value.groupBy) {
    const label = availableDimensions.value.find(d => d.id === dimId)?.label ?? dimId
    cols.push({ key: `dim:${dimId}`, label, numeric: false })
  }
  for (const metricSpec of result.value.metrics) {
    const selectedM = selectedMetrics.value.find(m => m.spec === metricSpec)
    const label = selectedM?.label ?? metricSpec
    cols.push({ key: `metric:${metricSpec}`, label, numeric: true })
  }
  return cols
})

function formatBucket(bucket: string | null, interval: string): string {
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

function getMetricUnit(metricSpec: string): string {
  if (metricSpec === 'count') return 'count'
  const metricId = metricSpec.split(':')[1]
  return availableMetrics.value.find(m => m.id === metricId)?.unit ?? 'count'
}

function fmtMs(ms: number): string {
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

function fmtMetric(value: number | null | undefined, metricSpec: string): string {
  if (value === null || value === undefined) return '—'
  const unit = getMetricUnit(metricSpec)
  if (unit === 'ms') return fmtMs(value)
  return value.toLocaleString()
}

function getCellValue(row: SliceQueryRow, colKey: string): string {
  if (colKey === '__bucket') return formatBucket(row.bucket, result.value?.interval ?? '')
  if (colKey.startsWith('dim:')) {
    const dimId = colKey.slice(4)
    const val = row.dimensions[dimId]
    return val != null ? formatEnum(String(val)) : '—'
  }
  if (colKey.startsWith('metric:')) {
    const spec = colKey.slice(7)
    return fmtMetric(row.metrics[spec], spec)
  }
  return '—'
}

const atLimit = computed(
  () => result.value !== null && result.value.rows.length >= queryLimit.value
)

const spacerIndex = computed(() => {
  const idx = tableColumns.value.findIndex(c => c.numeric)
  return idx === -1 ? tableColumns.value.length : idx
})

// Drill-down
type DimSpec = { kind: 'bucket' } | { kind: 'dim'; id: string }

interface DrillDisplayRow {
  kind: 'group' | 'leaf'
  key: string
  depth: number
  levelKind?: 'bucket' | 'dim'
  dimId?: string
  dimValue?: string | null
  isExpanded?: boolean
  rollup?: Record<string, number | null>
  rowCount?: number
  row?: SliceQueryRow
}

const expandedKeys = ref(new Set<string>())

watch(result, () => {
  expandedKeys.value = new Set()
})

const drillLevels = computed<DimSpec[]>(() => {
  if (!result.value) return []
  const levels: DimSpec[] = []
  if (result.value.interval) levels.push({ kind: 'bucket' })
  for (const dimId of result.value.groupBy) {
    levels.push({ kind: 'dim', id: dimId })
  }
  return levels
})

const useDrilldown = computed(() => drillLevels.value.length >= 2)

const levelColKeys = computed<string[]>(() =>
  drillLevels.value.map(l => l.kind === 'bucket' ? '__bucket' : `dim:${l.id}`)
)

function rollupForMetricSpec(spec: string, rows: SliceQueryRow[]): number | null {
  const values = rows.map(r => r.metrics[spec]).filter((v): v is number => v !== null)
  if (values.length === 0) return null
  if (spec === 'count' || spec.startsWith('sum:')) return values.reduce((a, b) => a + b, 0)
  if (spec.startsWith('min:')) return Math.min(...values)
  if (spec.startsWith('max:')) return Math.max(...values)
  return null
}

function buildDrillRows(
  rows: SliceQueryRow[],
  levels: DimSpec[],
  levelIdx: number,
  metrics: string[],
  parentKey: string,
  output: DrillDisplayRow[],
) {
  const level = levels[levelIdx]!
  const isLastLevel = levelIdx === levels.length - 1

  if (isLastLevel) {
    for (const row of rows) {
      output.push({ kind: 'leaf', key: `${parentKey}/leaf-${output.length}`, depth: levelIdx, row })
    }
    return
  }

  const groups = new Map<string | null, SliceQueryRow[]>()
  for (const row of rows) {
    const v = level.kind === 'bucket' ? row.bucket : (row.dimensions[level.id] ?? null)
    const existing = groups.get(v)
    if (existing) existing.push(row)
    else groups.set(v, [row])
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return String(a).localeCompare(String(b))
  })

  for (const [dimVal, childRows] of sorted) {
    const levelKey = level.kind === 'bucket' ? '__bucket' : level.id
    const key = `${parentKey}/${levelKey}:${dimVal ?? '__null__'}`
    const isExpanded = expandedKeys.value.has(key)
    const rollup: Record<string, number | null> = {}
    for (const spec of metrics) {
      rollup[spec] = rollupForMetricSpec(spec, childRows)
    }
    output.push({
      kind: 'group', key, depth: levelIdx,
      levelKind: level.kind,
      dimId: level.kind === 'dim' ? level.id : undefined,
      dimValue: dimVal, isExpanded, rollup, rowCount: childRows.length,
    })
    if (isExpanded) {
      buildDrillRows(childRows, levels, levelIdx + 1, metrics, key, output)
    }
  }
}

const drillDisplayRows = computed<DrillDisplayRow[]>(() => {
  if (!result.value || !useDrilldown.value) return []
  const output: DrillDisplayRow[] = []
  buildDrillRows(result.value.rows, drillLevels.value, 0, result.value.metrics, '', output)
  return output
})

function toggleExpand(key: string) {
  const next = new Set(expandedKeys.value)
  if (next.has(key)) {
    for (const k of next) {
      if (k === key || k.startsWith(key + '/')) next.delete(k)
    }
  } else {
    next.add(key)
  }
  expandedKeys.value = next
}
</script>

<template>
  <!-- Query Box -->
  <div class="bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-6">
  <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">

    <!-- Left: query selector -->
    <div ref="querySelectorRef" class="relative items-center hidden sm:flex gap-2 flex-1 min-w-0">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Query</span>
      <button
        @click="showQuerySelector = !showQuerySelector"
        :disabled="!projectId"
        :class="[
          'btn-secondary text-sm py-2 px-3 gap-2 min-w-[160px] w-full justify-start',
          activeQuery
            ? 'border-violet-400 text-violet-700 dark:border-violet-500 dark:text-violet-300'
            : 'text-gray-500 dark:text-gray-400'
        ]"
      >
        <BookmarkCheck v-if="activeQuery" class="w-4 h-4 shrink-0" />
        <Bookmark v-else class="w-4 h-4 shrink-0" />
        <span class="truncate flex-1 text-left">{{ activeQuery?.name ?? 'New query' }}</span>
        <ChevronDown class="w-3.5 h-3.5 shrink-0 ml-1 opacity-60" />
      </button>

      <div
        v-if="showQuerySelector"
        class="absolute left-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[220px] max-h-72 overflow-y-auto"
      >
        <!-- New query option -->
        <button
          @click="clearActiveQuery"
          class="w-full text-left text-sm px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          :class="{ 'bg-gray-50 dark:bg-gray-700/60': !activeQuery }"
        >
          <Bookmark class="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span class="italic text-gray-400 dark:text-gray-500">New query</span>
          <Check v-if="!activeQuery" class="w-3.5 h-3.5 text-violet-500 ml-auto shrink-0" />
        </button>

        <template v-if="analyticsStore.savedQueries.length > 0">
          <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
          <button
            v-for="q in analyticsStore.savedQueries"
            :key="q.id"
            @click="loadQuery(q)"
            class="w-full text-left text-sm px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            :class="{ 'bg-violet-50 dark:bg-violet-900/20': q.id === activeQuery?.id }"
          >
            <BookmarkCheck v-if="q.id === activeQuery?.id" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <Bookmark v-else class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="flex-1 truncate">{{ q.name }}</span>
            <span v-if="q.isShared" class="text-xs text-gray-400 dark:text-gray-500 shrink-0">shared</span>
            <Check v-if="q.id === activeQuery?.id" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
          </button>
        </template>
        <div v-else-if="!analyticsStore.isLoadingSavedQueries" class="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500">
          No saved queries yet
        </div>

        <!-- Footer: refresh -->
        <div class="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
          <button
            @click="analyticsStore.fetchSavedQueries(projectId); showQuerySelector = false"
            class="w-full text-left text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5"
            :disabled="analyticsStore.isLoadingSavedQueries"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': analyticsStore.isLoadingSavedQueries }" />
            {{ analyticsStore.isLoadingSavedQueries ? 'Refreshing…' : 'Refresh list' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Right: contextual save area -->
    <div ref="saveDialogRef" class="relative flex items-center">

      <!-- No active query or viewer of shared query: single Save as… -->
      <button
        v-if="!activeQuery || !canEditSavedQuery(activeQuery)"
        @click="openSaveDialog"
        class="btn-alt !py-2 !px-3 text-sm gap-1.5"
        :disabled="!projectId || isSaving"
      >
        <Bookmark class="w-3.5 h-3.5" />
        Save as…
      </button>

      <!-- Owner of active query: split Save | ▾ -->
      <template v-else>
        <div class="flex">
          <button
            @click="updateActiveQuery"
            class="btn-alt-hardright !py-2 !px-3 text-sm"
            :disabled="isSaving"
            title="Overwrite this saved query with current settings"
          >
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
          <div ref="saveMenuRef" class="relative flex">
            <button
              @click="showSaveDialog = false; showSaveMenu = !showSaveMenu"
              class="btn-alt-hardleft !py-2 !px-2 text-sm border-l border-violet-500 dark:border-violet-600"
              :disabled="isSaving"
              title="More options"
            >
            <ChevronDown class="w-3.5 h-3.5" />
          </button>
          <div
            v-if="showSaveMenu"
            class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[190px]"
          >
            <button
              @click="openSaveDialog"
              class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Save as new copy…
            </button>
            <button
              @click="openRenameDialog"
              class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Rename…
            </button>
            <button
              @click="toggleShareActiveQuery"
              class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
              :disabled="isSaving"
            >
              {{ activeQuery?.isShared ? 'Unshare' : 'Share with project' }}
            </button>
            <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button
              @click="deleteActiveQuery(); showSaveMenu = false"
              class="w-full text-left text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              :disabled="isSaving"
            >
              Delete this query
            </button>
          </div>
        </div>
        </div>
      </template>

      <!-- Rename popover -->
      <div
        v-if="showRenameDialog"
        class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[280px]"
      >
        <div class="mb-3">
          <label class="form-label text-xs mb-1">New name</label>
          <input
            v-model="renameDialogName"
            type="text"
            class="form-input text-sm w-full"
            placeholder="Query name…"
            maxlength="255"
            @keydown.enter="renameActiveQuery"
            autofocus
          />
        </div>
        <div v-if="saveError" class="text-xs text-red-500 dark:text-red-400 mb-2">{{ saveError }}</div>
        <div class="flex justify-end gap-2">
          <button @click="showRenameDialog = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
          <button
            @click="renameActiveQuery"
            class="btn-primary text-xs py-1 px-2"
            :disabled="!renameDialogName.trim() || isSaving"
          >
            {{ isSaving ? 'Saving…' : 'Rename' }}
          </button>
        </div>
      </div>

      <!-- Save-as popover (shared between both branches) -->
      <div
        v-if="showSaveDialog"
        class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[280px]"
      >
        <div class="mb-2">
          <label class="form-label text-xs mb-1">Name</label>
          <input
            v-model="saveDialogName"
            type="text"
            class="form-input text-sm w-full"
            placeholder="My query…"
            maxlength="255"
            @keydown.enter="saveAsNew"
            autofocus
          />
        </div>
        <div class="flex items-center gap-2 mb-3">
          <input id="save-shared" v-model="saveDialogShared" type="checkbox" class="form-checkbox" />
          <label for="save-shared" class="text-sm text-gray-700 dark:text-gray-300">Share with all project operators</label>
        </div>
        <div v-if="saveError" class="text-xs text-red-500 dark:text-red-400 mb-2">{{ saveError }}</div>
        <div class="flex justify-end gap-2">
          <button @click="showSaveDialog = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
          <button
            @click="saveAsNew"
            class="btn-primary text-xs py-1 px-2"
            :disabled="!saveDialogName.trim() || isSaving"
          >
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Query Builder -->
  <div class="p-4 space-y-4">
    <!-- Row 1: Source + interval + date range -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Source -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Source</span>
        <select
          :value="selectedSource"
          @change="onSourceChange(($event.target as HTMLSelectElement).value)"
          class="form-select-auto !py-2"
          :disabled="analyticsStore.isLoadingCatalog"
        >
          <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>

      <!-- Interval -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Interval</span>
        <select v-model="filterInterval" class="form-select-auto !py-2">
          <option value="">None (aggregate)</option>
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      <!-- Time range picker -->
      <div ref="timeRangePickerRef" class="relative">
        <button
          @click="showTimeRangePicker = !showTimeRangePicker"
          class="btn-secondary text-sm !py-2 !px-3 gap-2"
        >
          <CalendarDays class="w-4 h-4 shrink-0" />
          <span>{{ timeRangeLabel }}</span>
          <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
        </button>

        <div
          v-if="showTimeRangePicker"
          class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[300px]"
        >
          <!-- Mode tabs -->
          <div class="flex gap-1 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
            <button
              v-for="tab in [{ mode: 'relative', label: 'Relative' }, { mode: 'absolute', label: 'Absolute' }, { mode: 'all', label: 'All time' }]"
              :key="tab.mode"
              @click="switchTimeRangeMode(tab.mode as TimeRangeMode)"
              class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
              :class="timeRangeMode === tab.mode
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            >{{ tab.label }}</button>
          </div>

          <!-- Relative -->
          <template v-if="timeRangeMode === 'relative'">
            <div class="flex flex-wrap gap-1 mb-3">
              <button
                v-for="p in relativePresets"
                :key="p.label"
                @click="setRelativePreset(p)"
                class="text-xs px-2 py-1 rounded border transition-colors"
                :class="relativeTimeAmount === p.amount && relativeTimeUnit === p.unit
                  ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:border-violet-500 dark:text-violet-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-400'"
              >{{ p.label }}</button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">Last</span>
              <input
                v-model.number="relativeTimeAmount"
                type="number"
                min="1"
                max="100000"
                class="w-20 shrink-0 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-primary-400"
              />
              <select v-model="relativeTimeUnit" class="form-select-auto text-sm !py-1.5 min-w-[100px]">
                <option value="hours">hours</option>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
              </select>
            </div>
          </template>

          <!-- Absolute -->
          <template v-else-if="timeRangeMode === 'absolute'">
            <div class="space-y-2">
              <div>
                <label class="form-label text-xs mb-1">From</label>
                <input v-model="absoluteFrom" type="datetime-local" class="form-input text-sm w-full" />
              </div>
              <div>
                <label class="form-label text-xs mb-1">To</label>
                <input v-model="absoluteTo" type="datetime-local" class="form-input text-sm w-full" />
              </div>
            </div>
          </template>

          <!-- All time -->
          <template v-else>
            <p class="text-xs text-gray-400 dark:text-gray-500">No time filter — all data will be included.</p>
          </template>

          <div class="flex justify-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button @click="showTimeRangePicker = false" class="btn-secondary text-xs py-1 px-2">Done</button>
          </div>
        </div>
      </div>

      <!-- Run button -->
      <button
        @click="runQuery"
        class="btn-primary flex items-center gap-2 !py-2"
        :disabled="analyticsStore.isLoadingQuery || selectedMetrics.length === 0 || !projectId"
      >
        <Play class="w-3.5 h-3.5" />
        {{ analyticsStore.isLoadingQuery ? 'Running…' : 'Run' }}
      </button>
    </div>

    <!-- Row 2: Group By -->
    <div class="flex items-start gap-3">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400 pt-1 shrink-0">Group By</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="dimId in selectedDimensions"
          :key="dimId"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
        >
          {{ getDimensionLabel(dimId) }}
          <button @click="removeDimension(dimId)" class="ml-0.5 hover:text-blue-600">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Dimension picker -->
        <div
          v-if="unselectedDimensions.length > 0 && selectedDimensions.length < 5"
          ref="dimPickerRef"
          class="relative"
        >
          <button
            @click="showDimPicker = !showDimPicker"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-600"
          >
            <Plus class="w-3 h-3" /> Add dimension
          </button>
          <div
            v-if="showDimPicker"
            class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px]"
          >
            <button
              v-for="d in unselectedDimensions"
              :key="d.id"
              @click="addDimension(d.id); showDimPicker = false"
              class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <span v-else-if="unselectedDimensions.length === 0 && availableDimensions.length > 0" class="text-xs text-gray-400 dark:text-gray-500 pt-1">All dimensions selected</span>
        <span v-else-if="availableDimensions.length === 0 && !analyticsStore.isLoadingCatalog" class="text-xs text-gray-400 dark:text-gray-500 pt-1">No dimensions available for this source</span>
      </div>
    </div>

    <!-- Row 2b: Normalize By -->
    <div v-if="availableDimensions.length > 0" class="flex items-center gap-3">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">Normalize By</span>
      <select v-model="selectedNormalizeBy" class="form-select-auto !py-2 text-sm">
        <option value="">None</option>
        <option v-for="d in availableDimensions" :key="d.id" :value="d.id">{{ d.label }}</option>
      </select>
      <span class="text-xs text-gray-400 dark:text-gray-500">Aggregate metrics per unit before final aggregation</span>
    </div>

    <!-- Row 3: Metrics -->
    <div class="flex items-start gap-3">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400 pt-1 shrink-0">Metrics</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="m in selectedMetrics"
          :key="m.spec"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
        >
          {{ m.label }}
          <button @click="removeMetric(m.spec)" class="ml-0.5 hover:text-violet-600">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Metric picker -->
        <div ref="metricPickerRef" class="relative">
          <button
            @click="openMetricPicker()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-600"
          >
            <Plus class="w-3 h-3" /> Add metric
          </button>
          <div
            v-if="showMetricPicker"
            class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[260px]"
          >
            <!-- Count (always available) -->
            <button
              @click="addCountMetric(); showMetricPicker = false"
              class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2"
              :disabled="selectedMetrics.some(m => m.spec === 'count')"
              :class="{ 'opacity-40 cursor-not-allowed': selectedMetrics.some(m => m.spec === 'count') }"
            >
              Count (row count)
            </button>

            <template v-if="availableMetrics.length > 0">
              <div class="flex gap-2 mb-3">
                <select v-model="pickerMetricId" class="form-select-auto text-xs flex-1">
                  <option v-for="m in availableMetrics" :key="m.id" :value="m.id">{{ m.label }}</option>
                </select>
                <select v-model="pickerAggFn" class="form-select-auto text-xs w-24">
                  <option v-for="fn in pickerAggFns" :key="fn" :value="fn">{{ fn.toUpperCase() }}</option>
                </select>
              </div>
            </template>

            <div class="flex justify-end gap-2">
              <button @click="showMetricPicker = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
              <button v-if="availableMetrics.length > 0" @click="addMetric" class="btn-primary text-xs py-1 px-2">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 4: Filters -->
    <div v-if="availableDimensions.length > 0" class="flex items-start gap-3">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400 pt-1 shrink-0">Filters</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="f in dimensionFilters"
          :key="f.dimensionId"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        >
          {{ getDimensionLabel(f.dimensionId) }}: {{ formatEnum(f.value) }}
          <button @click="removeFilter(f.dimensionId)" class="ml-0.5 hover:text-amber-600">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Filter picker -->
        <div v-if="unselectedFilterDimensions.length > 0" ref="filterPickerRef" class="relative">
          <button
            @click="openFilterPicker()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-600"
          >
            <Plus class="w-3 h-3" /> Add filter
          </button>
          <div
            v-if="showFilterPicker"
            class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[280px]"
          >
            <div class="flex gap-2 mb-2">
              <select v-model="filterPickerDimensionId" class="form-select-auto text-xs flex-1" @click.stop>
                <option v-for="d in unselectedFilterDimensions" :key="d.id" :value="d.id">{{ d.label }}</option>
              </select>
            </div>
            <div class="mb-2">
              <select
                v-if="filterPickerDimension?.values?.length"
                v-model="filterPickerValue"
                class="form-select-auto text-xs w-full"
                @click.stop
              >
                <option v-for="v in filterPickerDimension.values" :key="v" :value="v">{{ formatEnum(v) }}</option>
              </select>
              <input
                v-else
                v-model="filterPickerValue"
                type="text"
                class="form-input text-xs w-full"
                placeholder="Value…"
                @click.stop
              />
            </div>
            <div class="flex justify-end gap-2">
              <button @click="showFilterPicker = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
              <button
                @click="addFilter"
                class="btn-primary text-xs py-1 px-2"
                :disabled="!filterPickerValue"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <!-- Catalog loading -->
  <div v-if="analyticsStore.isLoadingCatalog" class="loading-state">
    Loading source catalog…
  </div>

  <!-- Catalog error -->
  <div v-else-if="analyticsStore.catalogError" class="error-state mb-6">
    {{ analyticsStore.catalogError }}
  </div>

  <!-- Query error -->
  <div v-if="analyticsStore.queryError" class="error-state mb-6">
    {{ analyticsStore.queryError }}
  </div>

  <!-- Running -->
  <div v-if="analyticsStore.isLoadingQuery" class="loading-state">
    Running query…
  </div>

  <!-- Idle -->
  <div v-else-if="!result" class="empty-state">
    <p class="empty-state-title">No data yet</p>
    <p>Configure your query and click <span class="font-semibold">Run</span> to explore analytics data.</p>
  </div>

  <template v-else>
    <hr class="border-gray-200 dark:border-gray-700 mb-5" />

    <!-- Results heading -->
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Results</h2>
      <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        {{ result.rows.length.toLocaleString() }} row{{ result.rows.length !== 1 ? 's' : '' }}
      </span>
      <span v-if="atLimit" class="text-xs text-amber-600 dark:text-amber-400">
        Results capped at {{ queryLimit.toLocaleString() }} — narrow your filters for complete data.
      </span>
    </div>

    <!-- Results table -->
    <div v-if="result.rows.length > 0" class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <template v-for="(col, i) in tableColumns" :key="col.key">
                <th v-if="i === spacerIndex" class="table-header-cell w-full" key="__spacer"></th>
                <th :class="[col.numeric ? 'table-header-cell-right' : 'table-header-cell', 'whitespace-nowrap']">{{ col.label }}</th>
              </template>
              <th v-if="spacerIndex === tableColumns.length" class="table-header-cell w-full" key="__spacer"></th>
            </tr>
          </thead>

          <!-- Drill-down table body (bucket+dims or multiple dims) -->
          <tbody v-if="useDrilldown" class="table-body">
            <template v-for="drow in drillDisplayRows" :key="drow.key">
              <!-- Group row -->
              <tr
                v-if="drow.kind === 'group'"
                class="table-row cursor-pointer select-none"
                @click="toggleExpand(drow.key)"
              >
                <template v-for="(col, i) in tableColumns" :key="col.key">
                  <td v-if="i === spacerIndex" class="table-cell" key="__spacer"></td>
                  <td :class="['table-cell whitespace-nowrap', col.numeric ? 'text-right tabular-nums text-gray-400 dark:text-gray-500' : '']">
                    <!-- Bucket group: owning column is __bucket -->
                    <template v-if="drow.levelKind === 'bucket' && col.key === '__bucket'">
                      <span class="inline-flex items-center gap-1.5" :style="{ paddingLeft: `${drow.depth * 20}px` }">
                        <ChevronDown v-if="drow.isExpanded" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <ChevronRight v-else class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span class="font-medium">{{ drow.dimValue != null ? formatBucket(String(drow.dimValue), result?.interval ?? '') : '—' }}</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ drow.rowCount }} row{{ drow.rowCount !== 1 ? 's' : '' }}</span>
                      </span>
                    </template>
                    <!-- Dim group: owning column is dim:{dimId} -->
                    <template v-else-if="drow.levelKind === 'dim' && col.key === `dim:${drow.dimId}`">
                      <span class="inline-flex items-center gap-1.5" :style="{ paddingLeft: `${drow.depth * 20}px` }">
                        <ChevronDown v-if="drow.isExpanded" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <ChevronRight v-else class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span class="font-medium">{{ drow.dimValue != null ? formatEnum(String(drow.dimValue)) : '—' }}</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ drow.rowCount }} row{{ drow.rowCount !== 1 ? 's' : '' }}</span>
                      </span>
                    </template>
                    <!-- Metric rollup -->
                    <template v-else-if="col.numeric">
                      {{ drow.rollup && drow.rollup[col.key.slice(7)] != null ? fmtMetric(drow.rollup[col.key.slice(7)], col.key.slice(7)) : '' }}
                    </template>
                    <!-- Other columns (non-owning, non-metric): blank -->
                  </td>
                </template>
                <td v-if="spacerIndex === tableColumns.length" class="table-cell" key="__spacer"></td>
              </tr>

              <!-- Leaf row -->
              <tr v-else class="table-row">
                <template v-for="(col, i) in tableColumns" :key="col.key">
                  <td v-if="i === spacerIndex" class="table-cell" key="__spacer"></td>
                  <td :class="['table-cell whitespace-nowrap', col.numeric ? 'text-right font-medium tabular-nums' : '']">
                    <!-- Blank out ancestor-level label columns -->
                    <template v-if="levelColKeys.indexOf(col.key) >= 0 && levelColKeys.indexOf(col.key) < drow.depth">
                    </template>
                    <!-- Owning column (last level): indented -->
                    <template v-else-if="col.key === levelColKeys[drow.depth]">
                      <span class="inline-flex" :style="{ paddingLeft: `${drow.depth * 20 + 22}px` }">
                        {{ drow.row ? getCellValue(drow.row, col.key) : '—' }}
                      </span>
                    </template>
                    <!-- Metrics and other remaining columns -->
                    <template v-else>
                      {{ drow.row ? getCellValue(drow.row, col.key) : '—' }}
                    </template>
                  </td>
                </template>
                <td v-if="spacerIndex === tableColumns.length" class="table-cell" key="__spacer"></td>
              </tr>
            </template>
          </tbody>

          <!-- Flat table body -->
          <tbody v-else class="table-body">
            <tr v-for="(row, i) in result.rows" :key="i" class="table-row">
              <template v-for="(col, j) in tableColumns" :key="col.key">
                <td v-if="j === spacerIndex" class="table-cell" key="__spacer"></td>
                <td :class="['table-cell whitespace-nowrap', col.numeric ? 'text-right font-medium tabular-nums' : '']">
                  {{ getCellValue(row, col.key) }}
                </td>
              </template>
              <td v-if="spacerIndex === tableColumns.length" class="table-cell" key="__spacer"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="empty-state">
      <p class="empty-state-title">No results</p>
      <p>No data matched your query. Try adjusting your filters or date range.</p>
    </div>
  </template>
</template>
