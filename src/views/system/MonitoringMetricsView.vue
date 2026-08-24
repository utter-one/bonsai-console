<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import type { MetricSeriesPoint } from '@/api/types'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import { METRIC_CATALOG, METRIC_CATALOG_BY_NAME, type MetricKind } from '@/utils/monitoringMetrics'
import { Search } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

// Label values that are provider IDs (e.g. provider_id, fallback_provider_id)
// are shown as provider names
const providerNameMap = computed(() => {
  const map: Record<string, string> = {}
  providersStore.items.forEach((p) => (map[p.id] = p.name))
  return map
})

// --- Query state ---
const metricName = ref('provider_calls_total')
const dateTimeRange = ref<DateTimeRange>({
  op: 'between',
  value: [
    new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
  ],
})
const step = ref<'1m' | '15m' | '1h'>('15m')

const selectedMetric = computed(() => METRIC_CATALOG_BY_NAME[metricName.value])

const KIND_HINTS: Record<MetricKind, string> = {
  counter: 'Counters chart per-bucket deltas of increments.',
  gauge: 'Gauges chart the average sampled value per bucket.',
  histogram: 'Histograms chart sample count and average (sum / count) per bucket.',
}

// --- Chart value selection ---
type ChartValue = 'count' | 'average' | 'min' | 'max'
const chartValue = ref<ChartValue>(defaultChartValueFor(METRIC_CATALOG_BY_NAME[metricName.value]?.kind ?? 'gauge'))

function defaultChartValueFor(kind: MetricKind): ChartValue {
  if (kind === 'counter') return 'count'
  return 'average'
}

function pointValue(point: MetricSeriesPoint, value: ChartValue): number | null {
  switch (value) {
    case 'count':
      return point.count
    case 'average':
      return point.sum != null && point.count > 0 ? point.sum / point.count : null
    case 'min':
      return point.min
    case 'max':
      return point.max
  }
}

// --- Chart data ---
const CHART_COLORS = [
  'rgb(99, 102, 241)', 'rgb(236, 72, 153)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)',
  'rgb(14, 165, 233)', 'rgb(168, 85, 247)', 'rgb(239, 68, 68)', 'rgb(20, 184, 164)',
  'rgb(217, 119, 6)', 'rgb(101, 163, 13)', 'rgb(190, 24, 93)', 'rgb(79, 70, 229)',
]

// Friendly label rendering: human key names, fixed meaningful order, "key: value" pairs.
// Unknown keys pass through verbatim (sorted after the known ones).
const LABEL_KEY_NAMES: Record<string, string> = {
  provider_id: 'provider',
  provider_type: 'type',
  ok: 'outcome',
  error_code: 'error',
  route_group: 'route',
  status_class: 'status',
}
const LABEL_KEY_ORDER = ['provider_id', 'provider_type', 'operation', 'ok', 'error_code', 'route_group', 'status_class']

function formatLabelValue(key: string, value: string): string {
  if (key === 'ok') {
    if (value === 'true') return 'ok'
    if (value === 'false') return 'failed'
  }
  return value
}

function labelSummary(labels: Record<string, string>): string {
  const entries = Object.entries(labels)
  if (entries.length === 0) return '(no labels)'
  const order = (key: string) => {
    const i = LABEL_KEY_ORDER.indexOf(key)
    return i === -1 ? LABEL_KEY_ORDER.length : i
  }
  entries.sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0]))
  return entries
    .map(([k, v]) => `${LABEL_KEY_NAMES[k] ?? k}: ${formatLabelValue(k, providerNameMap.value[v] ?? v)}`)
    .join(' · ')
}

const chartLabels = computed<string[]>(() => {
  const buckets = new Set<string>()
  for (const series of monitoringStore.metrics?.series ?? []) {
    for (const point of series.points) {
      if (point.bucket) buckets.add(point.bucket)
    }
  }
  return Array.from(buckets).sort()
})

const chartData = computed(() => {
  const response = monitoringStore.metrics
  if (!response || response.series.length === 0) return null
  const labels = chartLabels.value
  if (labels.length === 0) return null

  return {
    labels,
    datasets: response.series.slice(0, 12).map((series, i) => {
      const color = CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0]!
      const valueByBucket = new Map<string, number | null>()
      for (const point of series.points) {
        if (point.bucket) valueByBucket.set(point.bucket, pointValue(point, chartValue.value))
      }
      return {
        label: labelSummary(series.labels),
        data: labels.map((label) => valueByBucket.get(label) ?? null),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.08'),
        fill: response.series.length === 1,
        spanGaps: true,
        pointRadius: labels.length > 60 ? 0 : 2,
        borderWidth: 2,
      }
    }),
  }
})

const lineData = computed(() => {
  if (chartData.value) return chartData.value
  return { labels: [], datasets: [] }
})

const chartOptions = computed((): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { boxWidth: 12 },
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 12,
        callback(this: any, _value: any, index: number) {
          const label = this.getLabelForValue(index)
          return formatBucket(String(label))
        },
      },
    },
    y: { beginAtZero: chartValue.value === 'count' },
  },
}))

function formatBucket(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// --- Series summary table ---
interface SeriesSummary {
  labels: Record<string, string>
  points: number
  min: number | null
  max: number | null
  avg: number | null
}

const seriesSummaries = computed<SeriesSummary[]>(() => {
  return (monitoringStore.metrics?.series ?? []).map((series) => {
    const values = series.points
      .map((p) => pointValue(p, chartValue.value))
      .filter((v): v is number => v != null)
    if (values.length === 0) {
      return { labels: series.labels, points: series.points.length, min: null, max: null, avg: null }
    }
    return {
      labels: series.labels,
      points: series.points.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  })
})

function formatNum(v: number | null): string {
  if (v == null) return '—'
  return Math.abs(v) >= 1000 ? v.toLocaleString() : Number(v.toFixed(2)).toString()
}

// --- Actions ---
async function load() {
  try {
    await monitoringStore.fetchMetrics({
      name: metricName.value,
      from: dateTimeRange.value?.value[0] ?? null,
      to: dateTimeRange.value?.value[1] ?? null,
      step: step.value,
    })
  } catch {
    // error surfaced via monitoringStore.metricsError
  }
}

function onMetricChange() {
  const kind = selectedMetric.value?.kind
  if (kind) chartValue.value = defaultChartValueFor(kind)
}

onMounted(() => {
  providersStore.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Metrics</h1>
          <p class="page-subtitle">Explore platform metric time series</p>
        </div>
      </div>

      <!-- Query form -->
      <div class="section-card mb-6">
        <div class="flex flex-wrap items-end gap-4">
          <div class="form-group w-full md:w-96">
            <label class="form-label">Metric</label>
            <select v-model="metricName" @change="onMetricChange" class="form-select">
              <option v-for="metric in METRIC_CATALOG" :key="metric.name" :value="metric.name" :title="metric.name">
                {{ metric.label }} — {{ metric.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Range</label>
            <DateTimeRangePicker v-model="dateTimeRange" placeholder="Select range" />
          </div>

          <div class="form-group">
            <label class="form-label">Step</label>
            <select v-model="step" class="form-select-auto">
              <option value="1m">1m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Chart value</label>
            <select v-model="chartValue" class="form-select-auto">
              <option value="count">Count</option>
              <option value="average">Average</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
          </div>

          <!-- mb-3 matches .form-group's margin so items-end aligns the button with the selects -->
          <button @click="load" :disabled="monitoringStore.metricsLoading" class="btn-primary mb-3">
            <Search class="inline-block mr-2 w-4 h-4" />
            Load series
          </button>
        </div>

        <p v-if="selectedMetric" class="form-help-text">{{ KIND_HINTS[selectedMetric.kind] }}</p>
      </div>

      <!-- Results -->
      <div class="section-card">
        <div v-if="monitoringStore.metricsLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.metricsError" class="alert-error">{{ monitoringStore.metricsError }}</div>

        <template v-else-if="monitoringStore.metrics">
          <div class="section-header">
            <div class="flex items-center gap-2">
              <h2 class="section-title">{{ METRIC_CATALOG_BY_NAME[monitoringStore.metrics.name]?.label ?? monitoringStore.metrics.name }}</h2>
              <span class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ monitoringStore.metrics.name }}</span>
              <span class="badge badge-info">{{ monitoringStore.metrics.series.length }} series</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                step {{ monitoringStore.metrics.step }}
              </span>
            </div>
          </div>

          <div v-if="monitoringStore.metrics.series.length === 0" class="empty-state py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">No series found for this query in the selected window.</p>
          </div>

          <template v-else>
            <div v-if="chartData" class="h-80 mb-4">
              <Line :data="lineData" :options="chartOptions" />
            </div>
            <p v-if="monitoringStore.metrics.series.length > 12" class="text-xs text-gray-400 dark:text-gray-500 mb-2">
              Chart shows the first 12 series — the table lists all of them.
            </p>

            <div class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Labels</th>
                      <th class="table-header-cell table-cell-right">Points</th>
                      <th class="table-header-cell table-cell-right">Min</th>
                      <th class="table-header-cell table-cell-right">Avg</th>
                      <th class="table-header-cell table-cell-right">Max</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-for="(summary, i) in seriesSummaries" :key="i" class="table-row">
                      <td class="table-cell">
                        <span class="badge badge-secondary mr-1">
                          {{ labelSummary(summary.labels) }}
                        </span>
                      </td>
                      <td class="table-cell-right tabular-nums">{{ summary.points }}</td>
                      <td class="table-cell-right tabular-nums">{{ formatNum(summary.min) }}</td>
                      <td class="table-cell-right tabular-nums">{{ formatNum(summary.avg) }}</td>
                      <td class="table-cell-right tabular-nums">{{ formatNum(summary.max) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>

        <div v-else class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">Pick a metric and load its series to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>
