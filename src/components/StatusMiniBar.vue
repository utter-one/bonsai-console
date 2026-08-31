<script setup lang="ts">
import { computed } from 'vue'
import type { StatusWindow } from '@/api/types'
import { windowCountsLabel } from '@/utils/monitoring'

const props = withDefaults(defineProps<{
  window: StatusWindow
  widthClass?: string
  /**
   * When set, render N discrete segments instead of a continuous bar:
   * the window's status counts are scaled proportionally into the
   * segments, worst status first (down, degraded, ok, unknown),
   * leftover cells stay empty track (e.g. checks with fewer rows
   * than segments).
   */
  segments?: number
}>(), {
  widthClass: 'w-16',
  segments: undefined,
})

const emit = defineEmits<{
  (e: 'segment-click', index: number, status: string): void
}>()

interface Cell {
  title: string
  cls: string
}

const cells = computed<Cell[]>(() => {
  const w = props.window
  const n = props.segments
  if (!n) return []
  if (w.total === 0) {
    return Array.from({ length: n }, () => ({ title: 'no data in window', cls: 'bg-transparent' }))
  }
  const scale = (c: number) => Math.round((c / w.total) * n)
  let down = scale(w.down)
  let degraded = scale(w.degraded)
  let ok = scale(w.ok)
  let unknown = scale(w.unknown)
  // Rounding can overflow the segment count; trim from the least-significant statuses
  let over = down + degraded + ok + unknown - n
  if (over > 0) {
    const trimUnknown = Math.min(unknown, over)
    unknown -= trimUnknown
    over -= trimUnknown
    ok = Math.max(0, ok - over)
  }
  const empty = n - (down + degraded + ok + unknown)
  const list: Cell[] = []
  for (let i = 0; i < down; i++) list.push({ title: 'down', cls: 'bg-red-500' })
  for (let i = 0; i < degraded; i++) list.push({ title: 'degraded', cls: 'bg-amber-500' })
  for (let i = 0; i < ok; i++) list.push({ title: 'ok', cls: 'bg-emerald-500' })
  for (let i = 0; i < unknown; i++) list.push({ title: 'unknown', cls: 'bg-gray-300 dark:bg-gray-600' })
  for (let i = 0; i < empty; i++) list.push({ title: 'no data', cls: 'bg-transparent' })
  return list
})

function pct(count: number): string {
  if (props.window.total === 0) return '0%'
  return `${(count / props.window.total) * 100}%`
}
</script>

<template>
  <!-- Continuous proportional bar (default) -->
  <div
    v-if="!props.segments"
    class="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0"
    :class="props.widthClass"
    :title="windowCountsLabel(props.window)"
  >
    <div class="bg-emerald-500" :style="{ width: pct(props.window.ok) }" />
    <div class="bg-amber-500" :style="{ width: pct(props.window.degraded) }" />
    <div class="bg-red-500" :style="{ width: pct(props.window.down) }" />
    <div class="bg-gray-300 dark:bg-gray-600" :style="{ width: pct(props.window.unknown) }" />
  </div>
  <!-- Discrete segments -->
  <div
    v-else
    class="flex h-2 gap-[2px] rounded bg-gray-100 dark:bg-gray-700"
    :class="props.widthClass"
    :title="windowCountsLabel(props.window)"
  >
    <div
      v-for="(cell, i) in cells"
      :key="i"
      class="flex-1 rounded-[1px] cursor-pointer"
      :class="cell.cls"
      :title="cell.title"
      @click.stop="emit('segment-click', i, cell.title)"
    />
  </div>
</template>
