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
import type { BenchmarkResultResponse } from '@/api/types'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Tooltip, Legend)

const yAxisType = ref<'linear' | 'logarithmic'>('linear')

const props = defineProps<{
  results: BenchmarkResultResponse[]
  selectedIterations: Set<number>
}>()

const chartData = computed(() => {
  const selected = props.results.filter(
    r => props.selectedIterations.has(r.iterationIndex) && r.result.timeToFirstChunkMs !== null
  )
  if (selected.length === 0) return null

  return {
    labels: selected.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [{
      label: 'Time to First Chunk (ms)',
      data: selected.map(r => r.result.timeToFirstChunkMs),
      backgroundColor: 'rgb(99,102,241)',
    }],
  }
})

const chartOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.raw} ms`,
      },
    },
  },
  scales: {
    y: { type: yAxisType.value, title: { display: true, text: 'ms' } },
  },
}))
</script>

<template>
  <div v-if="chartData">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Time to First Chunk</h4>
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
