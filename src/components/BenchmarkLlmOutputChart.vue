<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import type { BenchmarkResultResponse, LlmIterationOutput } from '@/api/types'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Tooltip, Legend)

const yAxisType = ref<'linear' | 'logarithmic'>('linear')

const props = defineProps<{
  results: BenchmarkResultResponse[]
  selectedIterations: Set<number>
  showThroughput?: boolean
  showTokenCounts?: boolean
}>()

const selected = computed(() =>
  props.results.filter(r => props.selectedIterations.has(r.iterationIndex) && !r.result.error)
)

function asLlm(r: BenchmarkResultResponse): LlmIterationOutput {
  return r.result.output as LlmIterationOutput
}

const throughputData = computed(() => {
  const withData = selected.value.filter(r => asLlm(r).tokensPerSecond != null)
  if (withData.length === 0) return null
  return {
    labels: withData.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [{
      label: 'Tokens/sec',
      data: withData.map(r => asLlm(r).tokensPerSecond),
      backgroundColor: 'rgb(16,185,129)',
    }],
  }
})

const tokenCountData = computed(() => {
  const withData = selected.value.filter(
    r => asLlm(r).inputTokens != null || asLlm(r).outputTokens != null
  )
  if (withData.length === 0) return null
  return {
    labels: withData.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [
      {
        label: 'Input Tokens',
        data: withData.map(r => asLlm(r).inputTokens),
        backgroundColor: 'rgb(59,130,246)',
      },
      {
        label: 'Output Tokens',
        data: withData.map(r => asLlm(r).outputTokens),
        backgroundColor: 'rgb(168,85,247)',
      },
    ],
  }
})

const throughputOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { type: yAxisType.value, title: { display: true, text: 'tokens/s' } } },
}))

const tokenCountOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
  scales: { y: { type: yAxisType.value, title: { display: true, text: 'tokens' } } },
}))
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-end">
      <div class="flex items-center gap-1 text-xs">
        <button @click="yAxisType = 'linear'" :class="yAxisType === 'linear' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Linear</button>
        <span class="text-gray-300 dark:text-gray-600">/</span>
        <button @click="yAxisType = 'logarithmic'" :class="yAxisType === 'logarithmic' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Log</button>
      </div>
    </div>
    <div v-if="showThroughput !== false && throughputData">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">LLM Throughput (tokens/sec)</h4>
      <div class="h-48">
        <Bar :data="throughputData" :options="throughputOptions" />
      </div>
    </div>
    <div v-if="showTokenCounts !== false && tokenCountData">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Token Counts</h4>
      <div class="h-48">
        <Bar :data="tokenCountData" :options="tokenCountOptions" />
      </div>
    </div>
  </div>
</template>
