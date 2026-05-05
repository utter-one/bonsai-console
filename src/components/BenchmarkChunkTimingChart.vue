<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import type { BenchmarkResultResponse } from '@/api/types'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Tooltip, Legend)

const CHART_COLORS = [
  'rgb(99,102,241)', 'rgb(16,185,129)', 'rgb(245,158,11)', 'rgb(239,68,68)',
  'rgb(59,130,246)', 'rgb(168,85,247)', 'rgb(20,184,166)',
]

const props = defineProps<{
  results: BenchmarkResultResponse[]
  selectedIterations: Set<number>
}>()

const chartData = computed(() => {
  const selected = props.results.filter(
    r => props.selectedIterations.has(r.iterationIndex) && r.result.chunkTimings?.length > 1
  )
  if (selected.length === 0) return null

  const maxChunks = Math.max(...selected.map(r => r.result.chunkTimings.length))
  const labels = Array.from({ length: maxChunks }, (_, i) => String(i + 1))

  return {
    labels,
    datasets: selected.map((result, idx) => {
      const original: number[] = result.result.chunkTimings
      return {
        label: `Iter ${result.iterationIndex + 1}`,
        data: yAxisType.value === 'logarithmic'
          ? original.map((v: number) => v === 0 ? 0.01 : v)
          : original,
        originalData: original,
        borderColor: CHART_COLORS[idx % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '33',
        tension: 0.3,
        pointRadius: 3,
      }
    }),
  }
})

const yAxisType = ref<'linear' | 'logarithmic'>('linear')

const chartOptions = computed((): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  spanGaps: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const value = yAxisType.value === 'logarithmic' && ctx.dataset.originalData
            ? ctx.dataset.originalData[ctx.dataIndex]
            : ctx.raw
          return `${ctx.dataset.label}: ${value}ms`
        },
      },
    },
  },
  scales: {
    x: { title: { display: true, text: 'Chunk #' } },
    y: { type: yAxisType.value, beginAtZero: yAxisType.value === 'linear', title: { display: true, text: 'Interval (ms)' } },
  },
}))
</script>

<template>
  <div v-if="chartData">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Token Chunk Intervals</h4>
      <div class="flex items-center gap-1 text-xs">
        <button @click="yAxisType = 'linear'" :class="yAxisType === 'linear' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Linear</button>
        <span class="text-gray-300 dark:text-gray-600">/</span>
        <button @click="yAxisType = 'logarithmic'" :class="yAxisType === 'logarithmic' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'">Log</button>
      </div>
    </div>
    <div class="h-64">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
