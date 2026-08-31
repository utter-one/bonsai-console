<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import StatusMiniBar from '@/components/StatusMiniBar.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { healthStatusClass } from '@/utils/monitoring'
import type { StatusWindow } from '@/api/types'

const props = defineProps<{
  title: string
  subtitle: string
  currentStatus: string
  latencyMs: number | null
  checkedAt: string | null
  window: StatusWindow
  windowMinutes: number
  extraRows?: { label: string; value: string }[]
}>()

defineEmits<{ close: [] }>()

const STATUS_ROWS: { key: 'ok' | 'degraded' | 'down' | 'unknown'; label: string; dot: string }[] = [
  { key: 'ok', label: 'OK', dot: 'bg-emerald-500' },
  { key: 'degraded', label: 'Degraded', dot: 'bg-amber-500' },
  { key: 'down', label: 'Down', dot: 'bg-red-500' },
  { key: 'unknown', label: 'Unknown', dot: 'bg-gray-400' },
]

function share(count: number): string {
  return props.window.total === 0 ? '—' : `${((count / props.window.total) * 100).toFixed(1)}%`
}
</script>

<template>
  <BaseModal :title="props.title" size="sm" @close="$emit('close')">
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">{{ props.subtitle }}</p>

    <!-- Current state -->
    <div class="flex items-center gap-2 mb-4">
      <span class="badge capitalize" :class="healthStatusClass(props.currentStatus)">
        {{ props.currentStatus }}
      </span>
      <span v-if="props.latencyMs != null" class="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {{ Math.round(props.latencyMs) }} ms
      </span>
      <span v-if="props.checkedAt" class="text-xs text-gray-400 dark:text-gray-500">
        checked <RelativeDate :date="props.checkedAt" />
      </span>
    </div>

    <!-- Window aggregates -->
    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
      Last {{ props.windowMinutes }} minutes
    </div>
    <StatusMiniBar :window="props.window" width-class="w-full" class="mb-2" />
    <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 rounded-md border border-gray-100 dark:border-gray-700">
      <div v-for="row in STATUS_ROWS" :key="row.key" class="flex items-center gap-2 px-3 py-1.5">
        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="row.dot" />
        <span class="text-sm flex-1">{{ row.label }}</span>
        <span class="text-sm tabular-nums">{{ props.window[row.key] }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-14 text-right">{{ share(props.window[row.key]) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3">
      <span class="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{{ props.window.total }} checks in window</span>
      <span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        worst:
        <span class="badge capitalize" :class="healthStatusClass(props.window.worstStatus)">
          {{ props.window.worstStatus }}
        </span>
      </span>
    </div>

    <!-- Extra rows -->
    <div v-if="props.extraRows?.length" class="mt-4">
      <div
        v-for="row in props.extraRows"
        :key="row.label"
        class="flex items-baseline gap-3 py-1.5 border-b border-gray-100 dark:border-gray-700"
      >
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28 flex-shrink-0">{{ row.label }}</span>
        <span class="text-sm break-all">{{ row.value }}</span>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" @click="$emit('close')">Close</button>
    </div>
  </BaseModal>
</template>
