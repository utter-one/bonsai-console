<script setup lang="ts">
import { computed } from 'vue'
import type { StatusWindow } from '@/api/types'
import { segmentCountsLabel, segmentWorst, windowCountsLabel, type SegmentStats } from '@/utils/monitoring'

const props = withDefaults(defineProps<{
  window: StatusWindow
  widthClass?: string
  /**
   * Per-segment aggregates (history rows bucketed into time slices).
   * When provided, renders one discrete cell per segment colored
   * worst-wins (down > degraded > unknown > ok); segments without
   * rows render as empty track.
   */
  segmentStats?: SegmentStats[]
}>(), {
  widthClass: 'w-16',
  segmentStats: undefined,
})

const emit = defineEmits<{
  (e: 'segment-click', index: number, stats: SegmentStats): void
}>()

interface Cell {
  title: string
  cls: string
  stats: SegmentStats
}

const SEG_CELL_CLS: Record<string, string> = {
  down: 'bg-red-500',
  degraded: 'bg-amber-500',
  unknown: 'bg-gray-300 dark:bg-gray-600',
  ok: 'bg-emerald-500',
  empty: 'bg-transparent',
}

const cells = computed<Cell[]>(() => {
  const stats = props.segmentStats
  if (!stats) return []
  return stats.map((s) => ({
    stats: s,
    title: segmentCountsLabel(s),
    cls: SEG_CELL_CLS[segmentWorst(s) ?? 'empty'] ?? 'bg-transparent',
  }))
})

function pct(count: number): string {
  if (props.window.total === 0) return '0%'
  return `${(count / props.window.total) * 100}%`
}
</script>

<template>
  <!-- Continuous proportional bar (default) -->
  <div
    v-if="!props.segmentStats"
    class="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0"
    :class="props.widthClass"
    :title="windowCountsLabel(props.window)"
  >
    <div class="bg-emerald-500" :style="{ width: pct(props.window.ok) }" />
    <div class="bg-amber-500" :style="{ width: pct(props.window.degraded) }" />
    <div class="bg-red-500" :style="{ width: pct(props.window.down) }" />
    <div class="bg-gray-300 dark:bg-gray-600" :style="{ width: pct(props.window.unknown) }" />
  </div>
  <!-- Discrete segments: one per time slice, colored worst-wins -->
  <div
    v-else
    class="flex h-2 gap-[2px] rounded bg-gray-100 dark:bg-gray-700"
    :class="props.widthClass"
  >
    <div
      v-for="(cell, i) in cells"
      :key="i"
      class="flex-1 rounded-[1px] cursor-pointer"
      :class="cell.cls"
      :title="cell.title"
      @click.stop="emit('segment-click', i, cell.stats)"
    />
  </div>
</template>
