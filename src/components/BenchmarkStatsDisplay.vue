<script setup lang="ts">
import type { BenchmarkStats } from '@/api/types'

defineProps<{
  stats: BenchmarkStats
}>()

function fmtMs(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return `${Math.round(val)} ms`
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return `${(val * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="metadata-container">
    <div class="metadata-item">
      <span class="metadata-label">Success Rate</span>
      <span class="metadata-value">{{ fmtPct(stats.successRate) }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Completed</span>
      <span class="metadata-value">{{ stats.completedIterations }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Failed</span>
      <span class="metadata-value">{{ stats.failedIterations }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Total Duration (avg)</span>
      <span class="metadata-value">{{ fmtMs(stats.totalDurationMs?.avg) }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Total Duration (p95)</span>
      <span class="metadata-value">{{ fmtMs(stats.totalDurationMs?.p95) }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Time to First Chunk (avg)</span>
      <span class="metadata-value">{{ fmtMs(stats.timeToFirstChunkMs?.avg) }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Time to First Chunk (p95)</span>
      <span class="metadata-value">{{ fmtMs(stats.timeToFirstChunkMs?.p95) }}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Chunk Interval (avg)</span>
      <span class="metadata-value">{{ fmtMs(stats.chunkIntervalMs?.avg) }}</span>
    </div>
  </div>
</template>
