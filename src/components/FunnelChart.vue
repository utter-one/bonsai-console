<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { FunnelQueryResponse } from '@/api/generated/data-contracts'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  result: FunnelQueryResponse
}>()

const topLabelsPlugin = {
  id: 'funnelTopLabels',
  afterDatasetsDraw(chart: InstanceType<typeof ChartJS>) {
    const { ctx } = chart
    const meta = chart.getDatasetMeta(0)
    meta.data.forEach((bar, index) => {
      const step = props.result.steps[index]
      if (!step) return
      const label = `${step.percentage.toFixed(1)}%`
      ctx.save()
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#10b981'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(label, (bar as any).x, (bar as any).y - 4)
      ctx.restore()
    })
  },
}

const chartData = computed(() => ({
  labels: props.result.steps.map(s => s.label),
  datasets: [
    {
      label: 'Users reached',
      data: props.result.steps.map(s => s.percentage),
      backgroundColor: 'rgba(16, 185, 129, 0.75)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { top: 28 },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (_ctx: any[]) => {
          const index = _ctx[0]?.dataIndex
          return props.result.steps[index]?.label ?? ''
        },
        label: (ctx: any) => {
          const step = props.result.steps[ctx.dataIndex]
          if (!step) return ''
          const lines = [
            `${step.percentage.toFixed(1)}% — ${step.userCount.toLocaleString()} users`,
          ]
          if (step.stepNumber > 1) {
            lines.push(`Drop-off: ${step.dropoffCount.toLocaleString()} (${step.dropoffPercentage.toFixed(1)}%)`)
          }
          return lines
        },
      },
    },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: {
        callback: (value: any) => `${value}%`,
      },
    },
    x: {
      ticks: {
        maxRotation: 30,
        font: { size: 11 },
        callback: (_value: any, index: number) => {
          const label = props.result.steps[index]?.label ?? ''
          return label.length > 24 ? `${label.slice(0, 22)}…` : label
        },
      },
    },
  },
}))
</script>

<template>
  <div class="card p-4 mb-4">
    <div class="relative" style="height: 280px;">
      <Bar
        :data="(chartData as any)"
        :options="(chartOptions as any)"
        :plugins="[topLabelsPlugin]"
        class="absolute! inset-0"
      />
    </div>
  </div>
</template>
