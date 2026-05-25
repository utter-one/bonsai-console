<script setup lang="ts">
import { computed, onMounted } from 'vue'

type InputType = 'messages' | 'text' | 'audio' | null

const props = defineProps<{
  inputType: InputType
  modelValue: Record<string, boolean>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, boolean>): void
}>()

const LS_KEY = 'bm-viz-prefs'

interface VizOption {
  key: string
  label: string
  inputTypes: Array<InputType | 'all'>
}

const ALL_OPTIONS: VizOption[] = [
  { key: 'iterationTable', label: 'Iteration Table', inputTypes: ['all'] },
  { key: 'ttfcChart', label: 'Time to First Chunk', inputTypes: ['all'] },
  { key: 'chunkTimingChart', label: 'Chunk Timing', inputTypes: ['all'] },
  { key: 'llmThroughputChart', label: 'LLM Throughput', inputTypes: ['messages'] },
  { key: 'llmTokensChart', label: 'LLM Token Counts', inputTypes: ['messages'] },
  { key: 'ttsChart', label: 'TTS Throughput', inputTypes: ['text'] },
  { key: 'asrWordChart', label: 'ASR Word Count', inputTypes: ['audio'] },
  { key: 'asrEventChart', label: 'ASR Recognition Events', inputTypes: ['audio'] },
]

const visibleOptions = computed(() =>
  ALL_OPTIONS.filter(o => o.inputTypes.includes('all') || o.inputTypes.includes(props.inputType))
)

function loadFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(val: Record<string, boolean>) {
  try {
    const existing = loadFromStorage()
    localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...val }))
  } catch {
    // ignore storage errors
  }
}

function defaultsFor(inputType: InputType): Record<string, boolean> {
  const opts = ALL_OPTIONS.filter(o => o.inputTypes.includes('all') || o.inputTypes.includes(inputType))
  return Object.fromEntries(opts.map(o => [o.key, true]))
}

onMounted(() => {
  const stored = loadFromStorage()
  const defaults = defaultsFor(props.inputType)
  const merged: Record<string, boolean> = { ...defaults }
  for (const key of Object.keys(defaults)) {
    if (key in stored) merged[key] = !!stored[key]
  }
  emit('update:modelValue', merged)
})

function toggle(key: string) {
  const next = { ...props.modelValue, [key]: !props.modelValue[key] }
  saveToStorage(next)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
    <span class="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Visualizations:</span>
    <label
      v-for="opt in visibleOptions"
      :key="opt.key"
      class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none"
    >
      <input
        type="checkbox"
        class="form-checkbox"
        :checked="modelValue[opt.key] ?? true"
        @change="toggle(opt.key)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
