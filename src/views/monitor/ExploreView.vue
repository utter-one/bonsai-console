<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore } from '@/stores'
import { Plus, X, Play, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import type { SourceEntry, SourceMetric, SliceQueryRow } from '@/api/generated/data-contracts'
import { formatEnum } from '@/composables'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

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
const selectedMetrics = ref<SelectedMetric[]>([{ spec: 'count', label: 'Count' }])
const dateTimeRange = ref<DateTimeRange>({
  op: 'between',
  value: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString()],
})
const filterInterval = ref<'hour' | 'day' | 'week' | 'month' | ''>('day')
const dimensionFilters = ref<DimensionFilter[]>([])
const queryLimit = ref(1000)

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
  selectedMetrics.value = [{ spec: 'count', label: 'Count' }]
  dimensionFilters.value = []
  showDimPicker.value = false
  showMetricPicker.value = false
  showFilterPicker.value = false
}

async function runQuery() {
  if (!projectId.value) return
  if (selectedMetrics.value.length === 0) return

  const filtersRecord: Record<string, string> = {}
  for (const f of dimensionFilters.value) {
    filtersRecord[f.dimensionId] = f.value
  }

  await analyticsStore.runQuery(projectId.value, {
    source: selectedSource.value as any,
    groupBy: selectedDimensions.value.length > 0 ? selectedDimensions.value : undefined,
    metrics: selectedMetrics.value.map(m => m.spec),
    interval: filterInterval.value || undefined,
    from: dateTimeRange.value?.value[0] ?? undefined,
    to: dateTimeRange.value?.value[1] ?? undefined,
    filters: Object.keys(filtersRecord).length > 0 ? filtersRecord : undefined,
    limit: queryLimit.value,
  })
}

onMounted(async () => {
  if (projectId.value) {
    await analyticsStore.fetchSourceCatalog(projectId.value)
  }
  document.addEventListener('mousedown', handleDocumentMousedown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown)
})

watch(projectId, async (newId) => {
  if (newId) {
    await analyticsStore.fetchSourceCatalog(newId)
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

function fmtMetric(value: number | null | undefined, metricSpec: string): string {
  if (value === null || value === undefined) return '—'
  const unit = getMetricUnit(metricSpec)
  if (unit === 'ms') return `${Math.round(value).toLocaleString()} ms`
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

const CHART_COLORS = [
  { border: 'rgb(59,130,246)', bg: 'rgba(59,130,246,0.15)' },
  { border: 'rgb(16,185,129)', bg: 'rgba(16,185,129,0.15)' },
  { border: 'rgb(139,92,246)', bg: 'rgba(139,92,246,0.15)' },
  { border: 'rgb(249,115,22)', bg: 'rgba(249,115,22,0.15)' },
  { border: 'rgb(236,72,153)', bg: 'rgba(236,72,153,0.15)' },
]

const showLineChart = computed(() => !!result.value?.interval && result.value.groupBy.length === 0 && result.value.rows.length > 0)
const showBarChart = computed(() => !result.value?.interval && (result.value?.groupBy.length ?? 0) > 0 && result.value!.rows.length > 0)

const lineChartData = computed(() => {
  if (!showLineChart.value || !result.value) return null
  const metricSpecs = result.value.metrics
  const interval = result.value.interval!
  const rows = result.value.rows
  return {
    labels: rows.map(r => formatBucket(r.bucket, interval)),
    datasets: metricSpecs.map((spec, i) => {
      const m = selectedMetrics.value.find(m => m.spec === spec)
      const color = CHART_COLORS[i % CHART_COLORS.length]!
      return {
        label: m?.label ?? spec,
        data: rows.map(r => r.metrics[spec] ?? null),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        spanGaps: true,
      }
    }),
  }
})

const barChartData = computed(() => {
  if (!showBarChart.value || !result.value) return null
  const firstDim = result.value.groupBy[0]
  if (!firstDim) return null
  const metricSpecs = result.value.metrics
  const rows = result.value.rows
  return {
    labels: rows.map(r => {
      const v = r.dimensions[firstDim]
      return v != null ? formatEnum(String(v)) : '—'
    }),
    datasets: metricSpecs.map((spec, i) => {
      const m = selectedMetrics.value.find(m => m.spec === spec)
      const color = CHART_COLORS[i % CHART_COLORS.length]!
      return {
        label: m?.label ?? spec,
        data: rows.map(r => r.metrics[spec] ?? null),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1.5,
      }
    }),
  }
})

const sharedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const v = ctx.parsed.y
          if (v === null) return `${ctx.dataset.label}: N/A`
          const spec = result.value?.metrics[ctx.datasetIndex] ?? ''
          return `${ctx.dataset.label}: ${fmtMetric(v, spec)}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (v: any) => v.toLocaleString() },
    },
  },
}

const atLimit = computed(
  () => result.value !== null && result.value.rows.length >= queryLimit.value
)

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
  <!-- Query Builder -->
  <div class="mb-6 space-y-4">
    <!-- Row 1: Source + interval + date range -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Source -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Source</span>
        <select
          :value="selectedSource"
          @change="onSourceChange(($event.target as HTMLSelectElement).value)"
          class="form-select-auto"
          :disabled="analyticsStore.isLoadingCatalog"
        >
          <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>

      <!-- Interval -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Interval</span>
        <select v-model="filterInterval" class="form-select-auto">
          <option value="">None (aggregate)</option>
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      <!-- Date range -->
      <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" />

      <!-- Run button -->
      <button
        @click="runQuery"
        class="btn-primary flex items-center gap-2"
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
    <!-- Row count badge -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ result.rows.length.toLocaleString() }} row{{ result.rows.length !== 1 ? 's' : '' }}
      </span>
      <span v-if="atLimit" class="text-xs text-amber-600 dark:text-amber-400">
        Results limited to {{ queryLimit.toLocaleString() }} rows — narrow your filters for complete data.
      </span>
    </div>

    <!-- Chart -->
    <div v-if="showLineChart || showBarChart" class="card mb-6">
      <div class="relative h-72">
        <Line v-if="showLineChart && lineChartData" :data="lineChartData" :options="sharedChartOptions" />
        <Bar v-else-if="showBarChart && barChartData" :data="barChartData" :options="sharedChartOptions" />
      </div>
    </div>

    <!-- Results table -->
    <div v-if="result.rows.length > 0" class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th
                v-for="col in tableColumns"
                :key="col.key"
                :class="col.numeric ? 'table-header-cell-right' : 'table-header-cell'"
              >
                {{ col.label }}
              </th>
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
                <td
                  v-for="col in tableColumns"
                  :key="col.key"
                  :class="['table-cell', col.numeric ? 'text-right tabular-nums text-gray-400 dark:text-gray-500' : '']"
                >
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
              </tr>

              <!-- Leaf row -->
              <tr v-else class="table-row">
                <td
                  v-for="col in tableColumns"
                  :key="col.key"
                  :class="['table-cell', col.numeric ? 'text-right font-medium tabular-nums' : '']"
                >
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
              </tr>
            </template>
          </tbody>

          <!-- Flat table body -->
          <tbody v-else class="table-body">
            <tr v-for="(row, i) in result.rows" :key="i" class="table-row">
              <td
                v-for="col in tableColumns"
                :key="col.key"
                :class="['table-cell', col.numeric ? 'text-right font-medium tabular-nums' : '']"
              >
                {{ getCellValue(row, col.key) }}
              </td>
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
