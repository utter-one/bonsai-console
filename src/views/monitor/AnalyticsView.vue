<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useStagesStore } from '@/stores'
import { BarChart2 } from 'lucide-vue-next'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import LatencyTrendChart from '@/components/LatencyTrendChart.vue'
import type { LatencyMetric, PercentileSet } from '@/api/generated/data-contracts'

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()
const stagesStore = useStagesStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const filterFrom = ref('')
const filterTo = ref('')
const filterStageId = ref('')
const filterSource = ref<'' | 'text' | 'voice'>('')
const filterInterval = ref<'hour' | 'day' | 'week'>('day')

const stages = computed(() => stagesStore.items)

function buildQuery() {
  return {
    from: filterFrom.value || undefined,
    to: filterTo.value || undefined,
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
    <div class="flex flex-col h-full md:border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between md:px-8 px-0 md:py-6 pb-6 border-b border-gray-200 md:bg-white bg-transparent flex-shrink-0 md:dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <BarChart2 class="w-6 h-6 text-gray-500 dark:text-gray-400" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Latency statistics for your project</p>
          </div>
        </div>
      </div>

      <!-- No project selected -->
      <div v-if="!projectId" class="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        Select a project to view analytics
      </div>

      <div v-else class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div class="p-6 space-y-6">
          <!-- Filter Bar -->
          <div class="card">
            <div class="flex flex-wrap gap-4 items-end">
              <div class="form-group mb-0">
                <label class="form-label">From</label>
                <input v-model="filterFrom" type="datetime-local" class="form-input" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">To</label>
                <input v-model="filterTo" type="datetime-local" class="form-input" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Stage</label>
                <select v-model="filterStageId" class="form-select">
                  <option value="">All stages</option>
                  <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Source</label>
                <select v-model="filterSource" class="form-select">
                  <option value="">All</option>
                  <option value="text">Text</option>
                  <option value="voice">Voice</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Trend interval</label>
                <select v-model="filterInterval" class="form-select">
                  <option value="hour">Hourly</option>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                </select>
              </div>
              <button @click="applyFilters" class="btn-primary" :disabled="analyticsStore.isLoading">
                {{ analyticsStore.isLoading ? 'Loading...' : 'Apply' }}
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="analyticsStore.error" class="error-state">
            {{ analyticsStore.error }}
          </div>

          <!-- Summary Cards -->
          <div v-if="summaryCards" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summaryCards.totalTurns.toLocaleString() }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Turns</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ fmtMs(summaryCards.avgTotal) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Turn Duration</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ fmtMs(summaryCards.p95Total) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">P95 Turn Duration</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ fmtMs(summaryCards.avgTtft) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Time to First Token</div>
            </div>
          </div>

          <!-- Latency Stats Table -->
          <div class="card" v-if="analyticsStore.latencyStats">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Statistics</h2>
            <div class="table-container">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Metric</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Count</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Avg</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Median</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P95</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Min</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in statRows"
                    :key="row.label"
                    class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    :class="{ 'opacity-50': row.voiceOnly && filterSource === 'text' }"
                  >
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-200">{{ row.label }}</td>
                    <td class="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{{ row.metric.count.toLocaleString() }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.metric.avg) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.metric.median) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.metric.p95) }}</td>
                    <td class="text-right py-2 px-2 text-gray-500 dark:text-gray-500">{{ fmtMs(row.metric.min) }}</td>
                    <td class="text-right py-2 px-2 text-gray-500 dark:text-gray-500">{{ fmtMs(row.metric.max) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Percentile Distribution Table -->
          <div class="card" v-if="analyticsStore.latencyPercentiles">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Percentile Distribution</h2>
            <div class="table-container">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Metric</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P50</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P75</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P90</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P95</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">P99</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in percentileRows"
                    :key="row.label"
                    class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-200">{{ row.label }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.set.p50) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.set.p75) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.set.p90) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.set.p95) }}</td>
                    <td class="text-right py-2 px-2 text-gray-800 dark:text-gray-200">{{ fmtMs(row.set.p99) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Trend Chart -->
          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Trend</h2>
            <LatencyTrendChart
              :data="analyticsStore.latencyTrend"
              :is-loading="analyticsStore.isLoading"
            />
          </div>

          <!-- Loading skeleton when no data yet -->
          <div v-if="analyticsStore.isLoading && !analyticsStore.latencyStats" class="card text-center py-12 text-gray-400 dark:text-gray-500">
            Loading analytics data...
          </div>
        </div>
      </div>
    </div>
  </MonitorSectionLayout>
</template>
