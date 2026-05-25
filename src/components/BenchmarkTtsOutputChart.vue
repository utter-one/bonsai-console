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
import type { BenchmarkResultResponse, TtsIterationOutput } from '@/api/types'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Tooltip, Legend)

const yAxisType = ref<'linear' | 'logarithmic'>('linear')

const props = defineProps<{
  results: BenchmarkResultResponse[]
  selectedIterations: Set<number>
}>()

const chartData = computed(() => {
  const selected = props.results.filter(
    r =>
      props.selectedIterations.has(r.iterationIndex) &&
      !r.result.error &&
      (r.result.output as TtsIterationOutput)?.bytesPerSecond != null
  )
  if (selected.length === 0) return null

  return {
    labels: selected.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [{
      label: 'Bytes/sec',
      data: selected.map(r => (r.result.output as TtsIterationOutput).bytesPerSecond),
      backgroundColor: 'rgb(245,158,11)',
    }],
  }
})

const chartOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { type: yAxisType.value, title: { display: true, text: 'bytes/s' } } },
}))
</script>

<template>
  <div v-if="chartData">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">TTS Throughput (bytes/sec)</h4>
      <div class="flex items-center gap-1 text-xs">
        <button @click="yAxisType = 'linear'" :class="yAxisType === 'linear' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Linear</button>
        <span class="text-gray-300 dark:text-gray-600">/</span>
        <button @click="yAxisType = 'logarithmic'" :class="yAxisType === 'logarithmic' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Log</button>
      </div>
    </div>
    <div class="h-48">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
