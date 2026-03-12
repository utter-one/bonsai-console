<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useStagesStore } from '@/stores'
import { BarChart2, Calendar, ChevronDown } from 'lucide-vue-next'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import LatencyTrendChart from '@/components/LatencyTrendChart.vue'
import type { LatencyMetric, PercentileSet } from '@/api/generated/data-contracts'

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()
const stagesStore = useStagesStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

type TimeFilterValue = 'last-15m' | 'last-30m' | 'last-1h' | 'last-4h' | 'last-24h' | 'last-7d' | 'last-30d' | 'all'

const timeFilter = ref<TimeFilterValue>('last-7d')
const showTimeDropdown = ref(false)
const filterStageId = ref('')
const filterSource = ref<'' | 'text' | 'voice'>('')
const filterInterval = ref<'hour' | 'day' | 'week'>('day')

const timeFilterOptions: { value: TimeFilterValue; label: string }[] = [
  { value: 'last-15m', label: 'Last 15 minutes' },
  { value: 'last-30m', label: 'Last 30 minutes' },
  { value: 'last-1h', label: 'Last 1 hour' },
  { value: 'last-4h', label: 'Last 4 hours' },
  { value: 'last-24h', label: 'Last 24 hours' },
  { value: 'last-7d', label: 'Last 7 days' },
  { value: 'last-30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const currentTimeFilterLabel = computed(
  () => timeFilterOptions.find(o => o.value === timeFilter.value)?.label ?? 'Last 7 days'
)

const stages = computed(() => stagesStore.items)

function getFromDate(): string | null {
  const now = new Date()
  switch (timeFilter.value) {
    case 'last-15m': return new Date(now.getTime() - 15 * 60 * 1000).toISOString()
    case 'last-30m': return new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    case 'last-1h':  return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    case 'last-4h':  return new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    case 'last-24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case 'last-7d':  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'last-30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    default: return null
  }
}

function selectTimeFilter(value: TimeFilterValue) {
  timeFilter.value = value
  showTimeDropdown.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const dropdown = document.querySelector('.analytics-time-dropdown')
  const button = document.querySelector('.analytics-time-button')
  if (dropdown && !dropdown.contains(target) && !button?.contains(target)) {
    showTimeDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function buildQuery() {
  return {
    from: getFromDate() ?? undefined,
    stageId: filterStageId.value || undefined,
    source: (filterSource.value || undefined) as 'text' | 'voice' | undefined,
    interval: filterInterval.value,
  }
}

async function applyFilters() {
  if (!projectId.value) return
  await analyticsStore.fetchAll(projectId.value, buildQuery())
}

onMounted(async () => {
  if (projectId.value) {
    await Promise.all([
      stagesStore.fetchAll(projectId.value),
      analyticsStore.fetchAll(projectId.value, buildQuery()),
    ])
  }
})

watch(projectId, async (newId) => {
  if (newId) {
    await Promise.all([
      stagesStore.fetchAll(newId),
      analyticsStore.fetchAll(newId, buildQuery()),
    ])
  }
})

function fmtMs(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)} ms`
}

const statRows = computed(() => {
  const s = analyticsStore.latencyStats
  if (!s) return []
  const rows: { label: string; metric: LatencyMetric; voiceOnly?: boolean }[] = [
    { label: 'Total Turn Duration', metric: s.totalTurnDurationMs },
    { label: 'Time to First Token (from LLM start)', metric: s.timeToFirstTokenMs },
    { label: 'Time to First Token (from turn start)', metric: s.timeToFirstTokenFromTurnStartMs },
    { label: 'LLM Duration', metric: s.llmDurationMs },
    { label: 'Processing (Classification + Transforms)', metric: s.processingDurationMs },
    { label: 'Actions', metric: s.actionsDurationMs },
    { label: 'Moderation', metric: s.moderationDurationMs },
    { label: 'ASR (voice only)', metric: s.asrDurationMs, voiceOnly: true },
    { label: 'TTS (voice only)', metric: s.ttsDurationMs, voiceOnly: true },
    { label: 'Time to First Audio (voice only)', metric: s.timeToFirstAudioMs, voiceOnly: true },
  ]
  return rows
})

const percentileRows = computed(() => {
  const p = analyticsStore.latencyPercentiles
  if (!p) return []
  const rows: { label: string; set: PercentileSet }[] = [
    { label: 'Total Turn Duration', set: p.totalTurnDurationMs },
    { label: 'Time to First Token (from LLM start)', set: p.timeToFirstTokenMs },
    { label: 'Time to First Token (from turn start)', set: p.timeToFirstTokenFromTurnStartMs },
    { label: 'LLM Duration', set: p.llmDurationMs },
    { label: 'Time to First Audio (voice only)', set: p.timeToFirstAudioMs },
  ]
  return rows
})

const summaryCards = computed(() => {
  const s = analyticsStore.latencyStats
  if (!s) return null
  return {
    totalTurns: s.totalTurns,
    avgTotal: s.totalTurnDurationMs.avg,
    p95Total: s.totalTurnDurationMs.p95,
    avgTtft: s.timeToFirstTokenMs.avg,
  }
})
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Latency statistics for your project</p>
        </div>
      </div>

      <!-- No project selected -->
      <div v-if="!projectId" class="empty-state">
        <BarChart2 class="empty-state-icon" />
        <p class="empty-state-title">No project selected</p>
        <p>Select a project to view analytics</p>
      </div>

      <template v-else>
        <!-- Filter Bar -->
        <div class="mb-6 flex flex-wrap items-center gap-3">
          <!-- Time range dropdown -->
          <div class="relative">
            <button
              @click="showTimeDropdown = !showTimeDropdown"
              class="analytics-time-button filter-btn !shadow-none"
            >
              <Calendar class="w-4 h-4 mr-2" />
              <span>{{ currentTimeFilterLabel }}</span>
              <ChevronDown class="w-4 h-4 ml-2" />
            </button>
            <div v-if="showTimeDropdown" class="analytics-time-dropdown filter-dropdown-panel min-w-[200px]">
              <button
                v-for="option in timeFilterOptions"
                :key="option.value"
                @click="selectTimeFilter(option.value)"
                class="filter-dropdown-item !shadow-none"
                :class="{ 'filter-dropdown-item-active': timeFilter === option.value }"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Stage filter -->
          <select v-model="filterStageId" class="form-select-auto">
            <option value="">All stages</option>
            <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
          </select>

          <!-- Source filter -->
          <select v-model="filterSource" class="form-select-auto">
            <option value="">All sources</option>
            <option value="text">Text</option>
            <option value="voice">Voice</option>
          </select>

          <!-- Trend interval -->
          <select v-model="filterInterval" class="form-select-auto">
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
          </select>

          <button @click="applyFilters" class="btn-primary" :disabled="analyticsStore.isLoading">
            {{ analyticsStore.isLoading ? 'Loading...' : 'Apply' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="analyticsStore.error" class="error-state mb-6">
          {{ analyticsStore.error }}
        </div>

        <!-- Loading -->
        <div v-if="analyticsStore.isLoading && !analyticsStore.latencyStats" class="loading-state">
          Loading analytics data...
        </div>

        <template v-else-if="analyticsStore.latencyStats">
          <!-- Summary Cards -->
           <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Summary</h2>
          <div v-if="summaryCards" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="card text-center py-4">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summaryCards.totalTurns.toLocaleString() }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Turns</div>
            </div>
            <div class="card text-center py-4">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ fmtMs(summaryCards.avgTotal) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Turn Duration</div>
            </div>
            <div class="card text-center p-4">
              <div class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ fmtMs(summaryCards.p95Total) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">P95 Turn Duration</div>
            </div>
            <div class="card text-center py-4">
              <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ fmtMs(summaryCards.avgTtft) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Time to First Token</div>
            </div>
          </div>

          <!-- Latency Statistics -->
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Latency Statistics</h2>
          <div class="table-container mb-6">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Metric</th>
                    <th class="table-header-cell text-right">Count</th>
                    <th class="table-header-cell text-right">Avg</th>
                    <th class="table-header-cell text-right">Median</th>
                    <th class="table-header-cell text-right">P95</th>
                    <th class="table-header-cell text-right">Min</th>
                    <th class="table-header-cell text-right">Max</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr
                    v-for="row in statRows"
                    :key="row.label"
                    class="table-row"
                    :class="{ 'opacity-40': row.voiceOnly && filterSource === 'text' }"
                  >
                    <td class="table-cell">{{ row.label }}</td>
                    <td class="table-cell-muted text-right">{{ row.metric.count.toLocaleString() }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.metric.avg) }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.metric.median) }}</td>
                    <td class="table-cell text-right font-medium">{{ fmtMs(row.metric.p95) }}</td>
                    <td class="table-cell-muted text-right">{{ fmtMs(row.metric.min) }}</td>
                    <td class="table-cell-muted text-right">{{ fmtMs(row.metric.max) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Percentile Distribution -->
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Percentile Distribution</h2>
          <div class="table-container mb-6">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Metric</th>
                    <th class="table-header-cell text-right">P50</th>
                    <th class="table-header-cell text-right">P75</th>
                    <th class="table-header-cell text-right">P90</th>
                    <th class="table-header-cell text-right">P95</th>
                    <th class="table-header-cell text-right">P99</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr
                    v-for="row in percentileRows"
                    :key="row.label"
                    class="table-row"
                  >
                    <td class="table-cell">{{ row.label }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.set.p50) }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.set.p75) }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.set.p90) }}</td>
                    <td class="table-cell text-right font-medium">{{ fmtMs(row.set.p95) }}</td>
                    <td class="table-cell text-right">{{ fmtMs(row.set.p99) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Latency Trend -->
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Latency Trend</h2>
          <div class="card">
            <LatencyTrendChart
              :data="analyticsStore.latencyTrend"
              :is-loading="analyticsStore.isLoading"
            />
          </div>
        </template>
      </template>
    </div>
  </MonitorSectionLayout>
</template>
