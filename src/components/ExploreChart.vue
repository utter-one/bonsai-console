<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Line, Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { TrendingUp, BarChart2, Layers, PieChart, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { SliceQueryResponse, SliceQueryRow, SourceMetric } from '@/api/generated/data-contracts'
import { fmtMs, fmtMetric, formatBucket } from '@/utils/analyticsFormatters'
import { formatEnum } from '@/composables'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

const props = defineProps<{
  result: SliceQueryResponse
  availableMetrics: SourceMetric[]
}>()

type ChartShape = 'timeSeries' | 'timeSeriesGrouped' | 'groupOnly' | 'aggregate'
type ChartType = 'line' | 'bar' | 'stackedBar' | 'pie'

const PALETTE = [
  { border: 'rgb(59, 130, 246)',  bg: 'rgba(59, 130, 246, 0.15)',  solid: 'rgba(59, 130, 246, 0.85)' },
  { border: 'rgb(16, 185, 129)',  bg: 'rgba(16, 185, 129, 0.15)',  solid: 'rgba(16, 185, 129, 0.85)' },
  { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.15)', solid: 'rgba(139, 92, 246, 0.85)' },
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.15)', solid: 'rgba(249, 115, 22, 0.85)' },
  { border: 'rgb(239, 68, 68)',   bg: 'rgba(239, 68, 68, 0.15)',   solid: 'rgba(239, 68, 68, 0.85)' },
  { border: 'rgb(20, 184, 166)',  bg: 'rgba(20, 184, 166, 0.15)',  solid: 'rgba(20, 184, 166, 0.85)' },
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.15)', solid: 'rgba(236, 72, 153, 0.85)' },
  { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.15)', solid: 'rgba(245, 158, 11, 0.85)' },
  { border: 'rgb(6, 182, 212)',   bg: 'rgba(6, 182, 212, 0.15)',   solid: 'rgba(6, 182, 212, 0.85)' },
  { border: 'rgb(244, 63, 94)',   bg: 'rgba(244, 63, 94, 0.15)',   solid: 'rgba(244, 63, 94, 0.85)' },
  { border: 'rgb(99, 102, 241)',  bg: 'rgba(99, 102, 241, 0.15)',  solid: 'rgba(99, 102, 241, 0.85)' },
  { border: 'rgb(132, 204, 22)',  bg: 'rgba(132, 204, 22, 0.15)',  solid: 'rgba(132, 204, 22, 0.85)' },
]

const shape = computed<ChartShape>(() => {
  const hasInterval = !!props.result.interval
  const hasGroupBy = props.result.groupBy.length > 0
  if (hasInterval && !hasGroupBy) return 'timeSeries'
  if (hasInterval && hasGroupBy) return 'timeSeriesGrouped'
  if (!hasInterval && hasGroupBy) return 'groupOnly'
  return 'aggregate'
})

const availableChartTypes = computed<ChartType[]>(() => {
  if (shape.value === 'timeSeries') return ['line', 'bar']
  if (shape.value === 'timeSeriesGrouped') return ['line', 'stackedBar']
  if (shape.value === 'groupOnly') return ['bar', 'pie']
  return []
})

const defaultChartType = computed<ChartType>(() => {
  if (shape.value === 'timeSeries') return 'line'
  if (shape.value === 'timeSeriesGrouped') return 'line'
  return 'bar'
})

const activeChartType = ref<ChartType>('line')
const selectedChartMetricSpec = ref<string>('')
const showSeriesPicker = ref(false)
const selectedSeriesKeys = ref<Set<string>>(new Set())

function getMetricUnit(metricSpec: string): string {
  if (metricSpec === 'count') return 'count'
  const metricId = metricSpec.split(':')[1]
  return props.availableMetrics.find(m => m.id === metricId)?.unit ?? 'count'
}

function metricLabel(spec: string): string {
  if (spec === 'count') return 'Count'
  const parts = spec.split(':')
  const aggFn = parts[0]
  const metricId = parts[1]
  const entry = props.availableMetrics.find(m => m.id === metricId)
  return `${aggFn.toUpperCase()} ${entry?.label ?? metricId}`
}

function seriesKeyForRow(row: SliceQueryRow): string {
  return props.result.groupBy
    .map(dimId => {
      const v = row.dimensions[dimId]
      return v != null ? formatEnum(String(v)) : '(none)'
    })
    .join(' · ')
}

const allSeriesKeys = computed<string[]>(() => {
  if (props.result.groupBy.length === 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of props.result.rows) {
    const k = seriesKeyForRow(row)
    if (!seen.has(k)) { seen.add(k); out.push(k) }
  }
  return out
})

function resetToTop10() {
  const keys = allSeriesKeys.value
  const firstMetric = props.result.metrics[0]
  if (!firstMetric || keys.length === 0) {
    selectedSeriesKeys.value = new Set(keys.slice(0, 10))
    return
  }
  const sums = new Map<string, number>()
  for (const row of props.result.rows) {
    const k = seriesKeyForRow(row)
    sums.set(k, (sums.get(k) ?? 0) + (row.metrics[firstMetric] ?? 0))
  }
  const sorted = [...keys].sort((a, b) => (sums.get(b) ?? 0) - (sums.get(a) ?? 0))
  selectedSeriesKeys.value = new Set(sorted.slice(0, 10))
}

function toggleSeries(key: string) {
  const next = new Set(selectedSeriesKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedSeriesKeys.value = next
}

function selectAllSeries() {
  selectedSeriesKeys.value = new Set(allSeriesKeys.value)
}

watch(
  () => props.result,
  () => {
    activeChartType.value = defaultChartType.value
    selectedChartMetricSpec.value = props.result.metrics[0] ?? ''
    showSeriesPicker.value = false
    if (props.result.groupBy.length > 0) resetToTop10()
  },
  { immediate: true },
)

const showMetricSelector = computed(
  () =>
    (shape.value === 'timeSeriesGrouped' || shape.value === 'groupOnly') &&
    props.result.metrics.length > 1,
)

const showSeriesPickerBtn = computed(() => props.result.groupBy.length > 0)

const chartData = computed(() => {
  const rows = props.result.rows
  if (rows.length === 0) return null
  const interval = props.result.interval ?? ''
  const s = shape.value

  if (s === 'timeSeries') {
    const labels = rows.map(r => formatBucket(r.bucket, interval))
    const datasets = props.result.metrics.map((spec, i) => {
      const c = PALETTE[i % PALETTE.length]
      return {
        label: metricLabel(spec),
        data: rows.map(r => r.metrics[spec] ?? null),
        borderColor: c.border,
        backgroundColor: c.bg,
        tension: 0.3,
        spanGaps: true,
        fill: false,
      }
    })
    return { labels, datasets }
  }

  if (s === 'timeSeriesGrouped') {
    const metricSpec = selectedChartMetricSpec.value
    const buckets = [...new Set(rows.map(r => r.bucket))]
      .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
    const labels = buckets.map(b => formatBucket(b, interval))
    const series = allSeriesKeys.value.filter(k => selectedSeriesKeys.value.has(k))
    const datasets = series.map((seriesKey, i) => {
      const c = PALETTE[i % PALETTE.length]
      const seriesRows = rows.filter(r => seriesKeyForRow(r) === seriesKey)
      const byBucket = new Map(seriesRows.map(r => [r.bucket, r.metrics[metricSpec] ?? null]))
      return {
        label: seriesKey,
        data: buckets.map(b => byBucket.get(b) ?? null),
        borderColor: c.border,
        backgroundColor: activeChartType.value === 'stackedBar' ? c.solid : c.bg,
        tension: 0.3,
        spanGaps: true,
        fill: false,
        ...(activeChartType.value === 'stackedBar' ? { stack: 'series' } : {}),
      }
    })
    return { labels, datasets }
  }

  if (s === 'groupOnly') {
    const metricSpec = selectedChartMetricSpec.value
    const filteredKeys = allSeriesKeys.value.filter(k => selectedSeriesKeys.value.has(k))
    const byKey = new Map<string, SliceQueryRow>()
    for (const row of rows) {
      const k = seriesKeyForRow(row)
      if (!byKey.has(k)) byKey.set(k, row)
    }
    if (activeChartType.value === 'pie') {
      return {
        labels: filteredKeys,
        datasets: [
          {
            data: filteredKeys.map(k => byKey.get(k)?.metrics[metricSpec] ?? null),
            backgroundColor: filteredKeys.map((_, i) => PALETTE[i % PALETTE.length].solid),
            borderColor: filteredKeys.map((_, i) => PALETTE[i % PALETTE.length].border),
            borderWidth: 1,
          },
        ],
      }
    }
    return {
      labels: filteredKeys,
      datasets: [
        {
          label: metricLabel(metricSpec),
          data: filteredKeys.map(k => byKey.get(k)?.metrics[metricSpec] ?? null),
          backgroundColor: filteredKeys.map((_, i) => PALETTE[i % PALETTE.length].solid),
          borderColor: filteredKeys.map((_, i) => PALETTE[i % PALETTE.length].border),
          borderWidth: 1,
        },
      ],
    }
  }

  return null
})

const chartOptions = computed(() => {
  const isPie = activeChartType.value === 'pie'
  const isStacked = activeChartType.value === 'stackedBar'

  const primaryMetricSpec =
    shape.value === 'timeSeries'
      ? (props.result.metrics[0] ?? 'count')
      : selectedChartMetricSpec.value
  const primaryUnit = getMetricUnit(primaryMetricSpec)

  const tickCallback = (value: any) => {
    if (primaryUnit === 'ms') return fmtMs(Number(value))
    return Number(value).toLocaleString()
  }

  const tooltipLabel = (ctx: any) => {
    if (isPie) {
      const u = getMetricUnit(selectedChartMetricSpec.value)
      return `${ctx.label}: ${fmtMetric(ctx.parsed, u)}`
    }
    const num: number | null = ctx.parsed.y
    if (num === null || num === undefined) return null
    if (shape.value === 'timeSeries') {
      const spec = props.result.metrics[ctx.datasetIndex]
      const u = spec ? getMetricUnit(spec) : primaryUnit
      return `${ctx.dataset.label}: ${fmtMetric(num, u)}`
    }
    return `${ctx.dataset.label}: ${fmtMetric(num, primaryUnit)}`
  }

  const base: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: { callbacks: { label: tooltipLabel } },
    },
  }

  if (isPie) return base

  if (isStacked) {
    return {
      ...base,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { callback: tickCallback } },
      },
    }
  }

  return {
    ...base,
    scales: {
      y: { beginAtZero: true, ticks: { callback: tickCallback } },
    },
  }
})
</script>

<template>
  <div class="card p-4 mb-4">
    <!-- Aggregate: no interval or groupBy to visualize -->
    <template v-if="shape === 'aggregate'">
      <div class="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-gray-500">
        Add an interval or group by a dimension to visualize results as a chart.
      </div>
    </template>

    <template v-else>
      <!-- Card header -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">Chart</span>

        <!-- Series picker toggle -->
        <button
          v-if="showSeriesPickerBtn"
          @click="showSeriesPicker = !showSeriesPicker"
          class="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
        >
          <span>Series ({{ selectedSeriesKeys.size }}/{{ allSeriesKeys.length }})</span>
          <ChevronUp v-if="showSeriesPicker" class="w-3 h-3" />
          <ChevronDown v-else class="w-3 h-3" />
        </button>

        <!-- Chart metric selector -->
        <select
          v-if="showMetricSelector"
          v-model="selectedChartMetricSpec"
          class="form-select text-xs py-1 h-auto"
        >
          <option v-for="spec in result.metrics" :key="spec" :value="spec">
            {{ metricLabel(spec) }}
          </option>
        </select>

        <!-- Chart type toggle -->
        <div class="flex items-center rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
          <template v-for="t in availableChartTypes" :key="t">
            <button
              @click="activeChartType = t"
              :title="t === 'line' ? 'Line' : t === 'bar' ? 'Bar' : t === 'stackedBar' ? 'Stacked Bar' : 'Pie'"
              :class="[
                'p-1.5 transition-colors',
                activeChartType === t
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              ]"
            >
              <TrendingUp v-if="t === 'line'" class="w-3.5 h-3.5" />
              <BarChart2 v-else-if="t === 'bar'" class="w-3.5 h-3.5" />
              <Layers v-else-if="t === 'stackedBar'" class="w-3.5 h-3.5" />
              <PieChart v-else-if="t === 'pie'" class="w-3.5 h-3.5" />
            </button>
          </template>
        </div>
      </div>

      <!-- Series picker panel -->
      <div v-if="showSeriesPicker && showSeriesPickerBtn" class="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedSeriesKeys.size }} of {{ allSeriesKeys.length }} series selected
          </span>
          <button @click="selectAllSeries" class="btn-secondary text-xs py-0.5 px-2">Select all</button>
          <button @click="resetToTop10" class="btn-secondary text-xs py-0.5 px-2">Top 10</button>
        </div>
        <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          <button
            v-for="key in allSeriesKeys"
            :key="key"
            @click="toggleSeries(key)"
            :class="[
              'text-xs px-2 py-0.5 rounded-full border transition-colors',
              selectedSeriesKeys.has(key)
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400',
            ]"
          >
            {{ key }}
          </button>
        </div>
      </div>

      <!-- Chart area -->
      <div class="relative h-80">
        <div
          v-if="!chartData"
          class="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500"
        >
          No series selected — pick at least one series to display.
        </div>
        <template v-else>
          <Line
            v-if="activeChartType === 'line'"
            :data="(chartData as any)"
            :options="(chartOptions as any)"
            class="!absolute inset-0"
          />
          <Bar
            v-else-if="activeChartType === 'bar' || activeChartType === 'stackedBar'"
            :data="(chartData as any)"
            :options="(chartOptions as any)"
            class="!absolute inset-0"
          />
          <Pie
            v-else-if="activeChartType === 'pie'"
            :data="(chartData as any)"
            :options="(chartOptions as any)"
            class="!absolute inset-0"
          />
        </template>
      </div>
    </template>
  </div>
</template>
