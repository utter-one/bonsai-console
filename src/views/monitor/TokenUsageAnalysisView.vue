<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useStagesStore } from '@/stores'
import { Calendar, ChevronDown } from 'lucide-vue-next'
import TokenUsageTrendChart from '@/components/TokenUsageTrendChart.vue'

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
  const dropdown = document.querySelector('.token-usage-time-dropdown')
  const button = document.querySelector('.token-usage-time-button')
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
  await analyticsStore.fetchAllTokenUsage(projectId.value, buildQuery())
}

onMounted(async () => {
  if (projectId.value) {
    await Promise.all([
      stagesStore.fetchAll(projectId.value),
      analyticsStore.fetchAllTokenUsage(projectId.value, buildQuery()),
    ])
  }
})

watch(projectId, async (newId) => {
  if (newId) {
    await Promise.all([
      stagesStore.fetchAll(newId),
      analyticsStore.fetchAllTokenUsage(newId, buildQuery()),
    ])
  }
})

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
</script>

<template>
  <!-- Filter Bar -->
  <div class="mb-6 flex flex-wrap items-center gap-3">
    <div class="relative">
      <button
        @click="showTimeDropdown = !showTimeDropdown"
        class="token-usage-time-button filter-btn !shadow-none"
      >
        <Calendar class="w-4 h-4 mr-2" />
        <span>{{ currentTimeFilterLabel }}</span>
        <ChevronDown class="w-4 h-4 ml-2" />
      </button>
      <div v-if="showTimeDropdown" class="token-usage-time-dropdown filter-dropdown-panel min-w-[200px]">
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
              <th class="table-header-cell text-right">Events</th>
              <th class="table-header-cell text-right">Prompt Tokens</th>
              <th class="table-header-cell text-right">Completion Tokens</th>
              <th class="table-header-cell text-right">Total Tokens</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr
              v-for="row in analyticsStore.tokenUsageStats.byEventType"
              :key="row.eventType"
              class="table-row"
            >
              <td class="table-cell font-mono text-xs">{{ row.eventType }}</td>
              <td class="table-cell-muted text-right">{{ row.eventCount.toLocaleString() }}</td>
              <td class="table-cell text-right">{{ row.totalPromptTokens.toLocaleString() }}</td>
              <td class="table-cell text-right">{{ row.totalCompletionTokens.toLocaleString() }}</td>
              <td class="table-cell text-right font-medium">{{ row.totalTokens.toLocaleString() }}</td>
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
