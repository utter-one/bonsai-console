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
import type { BenchmarkResultResponse, AsrIterationOutput } from '@/api/types'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Tooltip, Legend)

const yAxisType = ref<'linear' | 'logarithmic'>('linear')

const props = defineProps<{
  results: BenchmarkResultResponse[]
  selectedIterations: Set<number>
  showWordCount?: boolean
  showEvents?: boolean
}>()

const selected = computed(() =>
  props.results.filter(r => props.selectedIterations.has(r.iterationIndex) && !r.result.error)
)

function asAsr(r: BenchmarkResultResponse): AsrIterationOutput {
  return r.result.output as AsrIterationOutput
}

const wordCountData = computed(() => {
  const withData = selected.value.filter(r => asAsr(r).wordCount != null)
  if (withData.length === 0) return null
  return {
    labels: withData.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [{
      label: 'Words',
      data: withData.map(r => asAsr(r).wordCount),
      backgroundColor: 'rgb(20,184,166)',
    }],
  }
})

const eventCountData = computed(() => {
  const withData = selected.value.filter(r => asAsr(r).partialCount != null)
  if (withData.length === 0) return null
  return {
    labels: withData.map(r => `Iter ${r.iterationIndex + 1}`),
    datasets: [
      {
        label: 'Partial Events',
        data: withData.map(r => asAsr(r).partialCount),
        backgroundColor: 'rgb(59,130,246)',
      },
      {
        label: 'Final Events',
        data: withData.map(r => asAsr(r).finalCount),
        backgroundColor: 'rgb(99,102,241)',
      },
    ],
  }
})

const wordCountOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { type: yAxisType.value, title: { display: true, text: 'words' } } },
}))

const eventOptions = computed((): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
  scales: {
    x: { stacked: true },
    y: { type: yAxisType.value, stacked: true, title: { display: true, text: 'events' } },
  },
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
    <div v-if="showWordCount !== false && wordCountData">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recognised Word Count</h4>
      <div class="h-48">
        <Bar :data="wordCountData" :options="wordCountOptions" />
      </div>
    </div>
    <div v-if="showEvents !== false && eventCountData">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recognition Events</h4>
      <div class="h-48">
        <Bar :data="eventCountData" :options="eventOptions" />
      </div>
    </div>
  </div>
</template>
