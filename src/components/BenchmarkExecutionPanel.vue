<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBenchmarkRunsStore } from '@/stores'
import type { BenchmarkConfigExecutionResponse, BenchmarkResultResponse } from '@/api/types'
import BenchmarkStatsDisplay from '@/components/BenchmarkStatsDisplay.vue'
import BenchmarkVisualizationControls from '@/components/BenchmarkVisualizationControls.vue'
import BenchmarkIterationTable from '@/components/BenchmarkIterationTable.vue'
import BenchmarkChunkTimingChart from '@/components/BenchmarkChunkTimingChart.vue'
import BenchmarkTtfcChart from '@/components/BenchmarkTtfcChart.vue'
import BenchmarkLlmOutputChart from '@/components/BenchmarkLlmOutputChart.vue'
import BenchmarkTtsOutputChart from '@/components/BenchmarkTtsOutputChart.vue'
import BenchmarkAsrOutputChart from '@/components/BenchmarkAsrOutputChart.vue'

const props = defineProps<{
  execution: BenchmarkConfigExecutionResponse
  inputType: 'messages' | 'text' | 'audio' | null
}>()

const runsStore = useBenchmarkRunsStore()

const results = ref<BenchmarkResultResponse[]>([])
const isLoading = ref(false)
const hasError = ref(false)

const selectedIterations = ref<Set<number>>(new Set())
const enabledViz = ref<Record<string, boolean>>({})

onMounted(async () => {
  isLoading.value = true
  try {
    await runsStore.fetchExecutionResults(props.execution.id)
    results.value = [...runsStore.executionResults]
    selectedIterations.value = new Set(results.value.map(r => r.iterationIndex))
  } catch {
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})

const hasAnyChart = computed(() =>
  enabledViz.value.ttfcChart !== false ||
  enabledViz.value.chunkTimingChart !== false ||
  (props.inputType === 'messages' && (enabledViz.value.llmThroughputChart !== false || enabledViz.value.llmTokensChart !== false)) ||
  (props.inputType === 'text' && enabledViz.value.ttsChart !== false) ||
  (props.inputType === 'audio' && (enabledViz.value.asrWordChart !== false || enabledViz.value.asrEventChart !== false))
)
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-700">
    <div class="p-4">
      <BenchmarkStatsDisplay :stats="execution.stats" />
    </div>

    <BenchmarkVisualizationControls
      :inputType="inputType"
      v-model="enabledViz"
    />

    <div v-if="isLoading" class="loading-state">Loading iterations...</div>
    <div v-else-if="hasError" class="text-center py-6 text-sm text-red-500">Failed to load iteration results.</div>
    <div v-else-if="results.length === 0" class="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
      No iteration results available.
    </div>
    <template v-else>
      <template v-if="enabledViz.iterationTable !== false">
        <div class="px-4 pb-2 pt-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Iteration Results</h4>
        </div>
        <BenchmarkIterationTable
          :results="results"
          v-model="selectedIterations"
          :inputType="inputType"
        />
      </template>

      <div v-if="hasAnyChart" class="flex flex-col gap-6 p-4 border-t border-gray-200 dark:border-gray-700">
        <BenchmarkTtfcChart
          v-if="enabledViz.ttfcChart !== false"
          :results="results"
          :selectedIterations="selectedIterations"
        />
        <BenchmarkChunkTimingChart
          v-if="enabledViz.chunkTimingChart !== false"
          :results="results"
          :selectedIterations="selectedIterations"
        />
        <BenchmarkLlmOutputChart
          v-if="inputType === 'messages' && (enabledViz.llmThroughputChart !== false || enabledViz.llmTokensChart !== false)"
          :results="results"
          :selectedIterations="selectedIterations"
          :showThroughput="enabledViz.llmThroughputChart !== false"
          :showTokenCounts="enabledViz.llmTokensChart !== false"
        />
        <BenchmarkTtsOutputChart
          v-if="inputType === 'text' && enabledViz.ttsChart !== false"
          :results="results"
          :selectedIterations="selectedIterations"
        />
        <BenchmarkAsrOutputChart
          v-if="inputType === 'audio' && (enabledViz.asrWordChart !== false || enabledViz.asrEventChart !== false)"
          :results="results"
          :selectedIterations="selectedIterations"
          :showWordCount="enabledViz.asrWordChart !== false"
          :showEvents="enabledViz.asrEventChart !== false"
        />
      </div>
    </template>
  </div>
</template>
