<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useStagesStore } from '@/stores'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import { formatEnum } from '@/composables'
import TokenUsageTrendChart from '@/components/TokenUsageTrendChart.vue'

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()
const stagesStore = useStagesStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const dateTimeRange = ref<DateTimeRange>(null)
const filterStageId = ref('')
const filterSource = ref<'' | 'text' | 'voice'>('')
const filterInterval = ref<'hour' | 'day' | 'week'>('day')

const stages = computed(() => stagesStore.items)

function buildQuery() {
  return {
    from: dateTimeRange.value?.value[0] ?? undefined,
    to: dateTimeRange.value?.value[1] ?? undefined,
    stageId: filterStageId.value || undefined,
    source: (filterSource.value || undefined) as 'text' | 'voice' | undefined,
    interval: filterInterval.value,
  }
}

async function applyFilters() {
  if (!projectId.value) return
  await analyticsStore.fetchAllTokenUsage(projectId.value, buildQuery())
}

const summaryCards = computed(() => {
  const s = analyticsStore.tokenUsageStats
  if (!s) return null
  return {
    totalEvents: s.totalEvents,
    totalPromptTokens: s.totalPromptTokens,
    totalCompletionTokens: s.totalCompletionTokens,
    totalTokens: s.totalTokens,
  }
})

function fmtAvgTokens(total: number, count: number): string {
  if (count === 0) return '—'
  return Math.round(total / count).toLocaleString()
}

function fmtRatio(prompt: number, completion: number): string {
  if (completion === 0) return prompt > 0 ? '∞:1' : '—'
  return `${(prompt / completion).toFixed(2)}:1`
}
</script>

<template>
  <!-- Filter Bar -->
  <div class="mb-6 flex flex-wrap items-center gap-3">
    <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" />

    <select v-model="filterStageId" class="form-select-auto">
      <option value="">All stages</option>
      <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
    </select>

    <select v-model="filterSource" class="form-select-auto">
      <option value="">All sources</option>
      <option value="text">Text</option>
      <option value="voice">Voice</option>
    </select>

    <select v-model="filterInterval" class="form-select-auto">
      <option value="hour">Hourly</option>
      <option value="day">Daily</option>
      <option value="week">Weekly</option>
    </select>

    <button @click="applyFilters" class="btn-primary" :disabled="analyticsStore.isLoadingTokenUsage">
      {{ analyticsStore.isLoadingTokenUsage ? 'Loading...' : 'Apply' }}
    </button>
  </div>

  <!-- Error -->
  <div v-if="analyticsStore.tokenUsageError" class="error-state mb-6">
    {{ analyticsStore.tokenUsageError }}
  </div>

  <!-- Loading -->
  <div v-if="analyticsStore.isLoadingTokenUsage && !analyticsStore.tokenUsageStats" class="loading-state">
    Loading token usage data...
  </div>

  <!-- Idle -->
  <div v-else-if="!analyticsStore.tokenUsageStats" class="empty-state">
    <p class="empty-state-title">No data yet</p>
    <p>Set your filters and click <span class="font-semibold">Apply</span> to calculate token usage statistics.</p>
  </div>

  <template v-else-if="analyticsStore.tokenUsageStats">
    <!-- Summary Cards -->
    <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Summary</h2>
    <div v-if="summaryCards" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summaryCards.totalEvents.toLocaleString() }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Events</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ summaryCards.totalPromptTokens.toLocaleString() }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Prompt Tokens</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ summaryCards.totalCompletionTokens.toLocaleString() }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Completion Tokens</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ summaryCards.totalTokens.toLocaleString() }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Tokens</div>
      </div>
    </div>

    <!-- Breakdown by Event Type -->
    <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Usage by Event Type</h2>
    <div class="table-container mb-6">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Event Type</th>
              <th class="table-header-cell-right">Events</th>
              <th class="table-header-cell-right">Prompt Tokens</th>
              <th class="table-header-cell-right">Completion Tokens</th>
              <th class="table-header-cell-right">Total Tokens</th>
              <th class="table-header-cell-right">Avg / Event</th>
              <th class="table-header-cell-right">In:Out Ratio</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr
              v-for="row in analyticsStore.tokenUsageStats.byEventType"
              :key="row.eventType"
              class="table-row"
            >
              <td class="table-cell">{{ formatEnum(row.eventType) }}</td>
              <td class="table-cell-muted text-right">{{ row.eventCount.toLocaleString() }}</td>
              <td class="table-cell text-right">{{ row.totalPromptTokens.toLocaleString() }}</td>
              <td class="table-cell text-right">{{ row.totalCompletionTokens.toLocaleString() }}</td>
              <td class="table-cell text-right font-medium">{{ row.totalTokens.toLocaleString() }}</td>
              <td class="table-cell-muted text-right">{{ fmtAvgTokens(row.totalTokens, row.eventCount) }}</td>
              <td class="table-cell-muted text-right font-mono text-xs">{{ fmtRatio(row.totalPromptTokens, row.totalCompletionTokens) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Token Usage Trend -->
    <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Token Usage Trend</h2>
    <div class="card">
      <TokenUsageTrendChart
        :data="analyticsStore.tokenUsageTrend"
        :is-loading="analyticsStore.isLoadingTokenUsage"
      />
    </div>
  </template>
</template>
