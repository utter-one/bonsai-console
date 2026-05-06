<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkRunsStore, useBenchmarkSuitesStore, useBenchmarkConfigsStore } from '@/stores'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { BenchmarkConfigExecutionResponse, BenchmarkRunResponse } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import BenchmarkExecutionPanel from '@/components/BenchmarkExecutionPanel.vue'

const route = useRoute()
const router = useRouter()
const runsStore = useBenchmarkRunsStore()
const suitesStore = useBenchmarkSuitesStore()
const configsStore = useBenchmarkConfigsStore()

const runId = computed(() => route.params.runId as string)
const fromTab = computed(() => route.query.fromTab as string | undefined)
const isLoading = ref(false)
const isRefreshingData = ref(false)
const errorMessage = ref<string | null>(null)

const run = ref<BenchmarkRunResponse | null>(null)
const suite = computed(() => run.value ? suitesStore.items.find(s => s.id === run.value!.suiteId) : null)

const expandedExecutions = ref<Set<string>>(new Set())
const excludedExecutions = ref<Set<string>>(new Set())

function configName(configId: string) {
  return configsStore.items.find(c => c.id === configId)?.name ?? configId.slice(0, 8) + '...'
}

function configInputType(configId: string): 'messages' | 'text' | 'audio' | null {
  return configsStore.items.find(c => c.id === configId)?.inputType ?? null
}

onMounted(async () => {
  const cached = runsStore.items.find(r => r.id === runId.value) ?? null
  if (cached) {
    run.value = cached
    isRefreshingData.value = true
  } else {
    isLoading.value = true
  }
  errorMessage.value = null
  try {
    const fetched = await runsStore.fetchById(runId.value)
    run.value = fetched ?? null
    if (run.value?.suiteId) {
      await Promise.all([
        suitesStore.fetchById(run.value.suiteId),
        configsStore.fetchBySuite(run.value.suiteId),
      ])
    }
  } catch (err: any) {
    errorMessage.value = parseApiError(err).message
  } finally {
    isLoading.value = false
    isRefreshingData.value = false
  }
})

function toggleExecution(execution: BenchmarkConfigExecutionResponse) {
  const id = execution.id
  if (expandedExecutions.value.has(id)) {
    expandedExecutions.value.delete(id)
  } else {
    expandedExecutions.value.add(id)
  }
}

function toggleExcluded(id: string, event: Event) {
  event.stopPropagation()
  if (excludedExecutions.value.has(id)) {
    excludedExecutions.value.delete(id)
  } else {
    excludedExecutions.value.add(id)
  }
}

const runStatusClass: Record<string, string> = {
  pending: 'badge-info',
  in_progress: 'badge-warning',
  completed: 'badge-active',
  failed: 'badge-error',
}

function formatDuration(ms: number | null) {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button
          @click="run?.suiteId
            ? router.push({ name: 'administration.benchmarkSuites.edit', params: { suiteId: run.suiteId }, query: fromTab ? { tab: fromTab } : {} })
            : router.push({ name: 'administration.benchmarkSuites' })"
          class="btn-icon mb-2 md:mb-0"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Benchmark Run</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Suite: <span class="font-medium text-gray-900 dark:text-white">{{ suite?.name ?? run?.suiteId ?? '—' }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
    <div class="mx-auto md:px-8 py-6">

    <div v-if="isLoading" class="loading-state">Loading run...</div>
    <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>

    <template v-else-if="run">
      <div class="card mb-6">
        <div class="metadata-container">
          <div class="metadata-item">
            <span class="metadata-label">Run ID</span>
            <span class="metadata-value font-mono text-xs">{{ run.id }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Status</span>
            <span :class="runStatusClass[run.status] ?? 'badge-info'" class="self-start">{{ run.status }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Trigger</span>
            <span class="metadata-value capitalize">{{ run.trigger }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Started</span>
            <span class="metadata-value">
              <RelativeDate v-if="run.startedAt" :date="run.startedAt" />
              <span v-else>—</span>
            </span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Completed</span>
            <span class="metadata-value">
              <RelativeDate v-if="run.completedAt" :date="run.completedAt" />
              <span v-else>—</span>
            </span>
          </div>
          <div v-if="run.error" class="metadata-item col-span-full">
            <span class="metadata-label">Error</span>
            <span class="metadata-value text-red-500">{{ run.error }}</span>
          </div>
        </div>
      </div>

      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Executions</h2>

      <div v-if="isRefreshingData && (!run.executions || run.executions.length === 0)" class="loading-state py-4">Loading executions...</div>
      <div v-else-if="!run.executions || run.executions.length === 0" class="empty-state">
        <p class="empty-state-title">No executions found</p>
        <p>No executions were recorded for this run.</p>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="execution in run.executions"
          :key="execution.id"
          class="card transition-opacity"
          :class="{ 'opacity-50': excludedExecutions.has(execution.id) }"
        >
          <div
            class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            @click="toggleExecution(execution)"
          >
            <div class="flex items-center gap-3">
              <component
                :is="expandedExecutions.has(execution.id) ? ChevronDown : ChevronRight"
                :size="16"
                class="text-gray-400 shrink-0"
              />
              <span
                class="font-medium text-gray-900 dark:text-white"
                :class="{ 'line-through text-gray-400 dark:text-gray-500': excludedExecutions.has(execution.id) }"
              >{{ configName(execution.configId) }}</span>
              <span :class="runStatusClass[execution.status] ?? 'badge-info'">{{ execution.status }}</span>
              <span v-if="excludedExecutions.has(execution.id)" class="badge-inactive text-xs">Excluded</span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ Math.round(execution.stats.successRate * 100) }}% success</span>
              <span>{{ execution.stats.completedIterations + execution.stats.failedIterations }} iterations</span>
              <span>avg {{ formatDuration(execution.stats.totalDurationMs?.avg ?? null) }}</span>
              <label
                class="flex items-center gap-1.5 text-xs cursor-pointer select-none"
                @click.stop
              >
                <input
                  type="checkbox"
                  class="form-checkbox"
                  :checked="excludedExecutions.has(execution.id)"
                  @change="toggleExcluded(execution.id, $event)"
                />
                Exclude
              </label>
            </div>
          </div>

          <BenchmarkExecutionPanel
            v-if="expandedExecutions.has(execution.id)"
            :execution="execution"
            :inputType="configInputType(execution.configId)"
          />
        </div>
      </div>
    </template>
    </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>
