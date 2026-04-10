<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TokenUsageTrendResponse } from '@/api/generated/data-contracts'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  data: TokenUsageTrendResponse | null
  isLoading: boolean
}>()

function formatBucketLabel(bucket: string, interval: string): string {
  const date = new Date(bucket)
  if (interval === 'hour') {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric' })
}

const chartData = computed(() => {
  if (!props.data || props.data.points.length === 0) return null
  const { points, interval } = props.data
  return {
    labels: points.map(p => formatBucketLabel(p.bucket, interval)),
    datasets: [
      {
        label: 'Prompt Tokens',
        data: points.map(p => p.totalPromptTokens),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        stack: 'tokens',
      },
      {
        label: 'Completion Tokens',
        data: points.map(p => p.totalCompletionTokens),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        stack: 'tokens',
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        callback: (value: any) => value.toLocaleString(),
      },
    },
  },
}
</script>

<template>
  <div class="relative h-72">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
      Loading trend data...
    </div>
    <div v-else-if="!chartData" class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
      No trend data available for the selected period
    </div>
    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
