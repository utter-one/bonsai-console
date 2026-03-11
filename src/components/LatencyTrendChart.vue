<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { LatencyTrendResponse } from '@/api/generated/data-contracts'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  data: LatencyTrendResponse | null
  isLoading: boolean
}>()

function formatBucketLabel(bucket: string, interval: string): string {
  const date = new Date(bucket)
  if (interval === 'hour') {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  if (interval === 'week') {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric' })
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
        label: 'Total Turn Duration',
        data: points.map(p => p.avgTotalTurnDurationMs),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'Time to First Token',
        data: points.map(p => p.avgTimeToFirstTokenMs),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'LLM Duration',
        data: points.map(p => p.avgLlmDurationMs),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'Time to First Audio',
        data: points.map(p => p.avgTimeToFirstAudioMs),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.3,
        spanGaps: true,
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
          const v = ctx.parsed.y
          return v !== null ? `${ctx.dataset.label}: ${Math.round(v)} ms` : `${ctx.dataset.label}: N/A`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `${value} ms`,
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
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
