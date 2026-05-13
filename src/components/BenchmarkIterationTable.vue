<script setup lang="ts">
import { computed } from 'vue'
import type { BenchmarkResultResponse, LlmIterationOutput, TtsIterationOutput, AsrIterationOutput } from '@/api/types'

const props = defineProps<{
  results: BenchmarkResultResponse[]
  modelValue: Set<number>
  inputType: 'messages' | 'text' | 'audio' | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Set<number>): void
}>()

const allSelected = computed(() => props.results.every(r => props.modelValue.has(r.iterationIndex)))

function toggleAll() {
  if (allSelected.value) {
    emit('update:modelValue', new Set())
  } else {
    emit('update:modelValue', new Set(props.results.map(r => r.iterationIndex)))
  }
}

function toggleIteration(idx: number) {
  const next = new Set(props.modelValue)
  if (next.has(idx)) {
    next.delete(idx)
  } else {
    next.add(idx)
  }
  emit('update:modelValue', next)
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function asLlm(r: BenchmarkResultResponse): LlmIterationOutput | null {
  return props.inputType === 'messages' ? (r.result.output as LlmIterationOutput) : null
}

function asTts(r: BenchmarkResultResponse): TtsIterationOutput | null {
  return props.inputType === 'text' ? (r.result.output as TtsIterationOutput) : null
}

function asAsr(r: BenchmarkResultResponse): AsrIterationOutput | null {
  return props.inputType === 'audio' ? (r.result.output as AsrIterationOutput) : null
}
</script>

<template>
  <div class="table-container rounded-none border-x-0 border-b-0 mb-0">
    <div class="table-wrapper">
      <table class="table">
        <thead class="table-header">
          <tr>
            <th class="table-header-cell w-8">
              <input type="checkbox" class="form-checkbox" :checked="allSelected" @change="toggleAll" />
            </th>
            <th class="table-header-cell">#</th>
            <th class="table-header-cell">Status</th>
            <th class="table-header-cell">Duration</th>
            <th class="table-header-cell">TTFC</th>
            <th class="table-header-cell">Chunks</th>
            <template v-if="inputType === 'messages'">
              <th class="table-header-cell">Tokens/s</th>
              <th class="table-header-cell">In Tokens</th>
              <th class="table-header-cell">Out Tokens</th>
              <th class="table-header-cell">Stop</th>
            </template>
            <template v-else-if="inputType === 'text'">
              <th class="table-header-cell">Bytes/s</th>
            </template>
            <template v-else-if="inputType === 'audio'">
              <th class="table-header-cell">Words</th>
              <th class="table-header-cell">Partials</th>
              <th class="table-header-cell">Finals</th>
            </template>
            <th class="table-header-cell">Error</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr
            v-for="result in results"
            :key="result.id"
            class="table-row transition-opacity"
            :class="{ 'opacity-40': !modelValue.has(result.iterationIndex) }"
          >
            <td class="table-cell">
              <input
                type="checkbox"
                class="form-checkbox"
                :checked="modelValue.has(result.iterationIndex)"
                @change="toggleIteration(result.iterationIndex)"
              />
            </td>
            <td class="table-cell">{{ result.iterationIndex + 1 }}</td>
            <td class="table-cell">
              <span :class="result.result.error ? 'badge-error' : 'badge-active'">
                {{ result.result.error ? 'failed' : 'ok' }}
              </span>
            </td>
            <td class="table-cell font-mono">
              {{
                result.startedAt && result.completedAt
                  ? formatDuration(new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime())
                  : '—'
              }}
            </td>
            <td class="table-cell font-mono">{{ formatDuration(result.result.timeToFirstChunkMs) }}</td>
            <td class="table-cell font-mono">{{ result.result.chunkCount }}</td>
            <template v-if="inputType === 'messages'">
              <td class="table-cell font-mono">{{ asLlm(result)?.tokensPerSecond?.toFixed(1) ?? '—' }}</td>
              <td class="table-cell font-mono">{{ asLlm(result)?.inputTokens ?? '—' }}</td>
              <td class="table-cell font-mono">{{ asLlm(result)?.outputTokens ?? '—' }}</td>
              <td class="table-cell text-xs text-gray-500 dark:text-gray-400">{{ asLlm(result)?.stopReason ?? '—' }}</td>
            </template>
            <template v-else-if="inputType === 'text'">
              <td class="table-cell font-mono">{{ asTts(result)?.bytesPerSecond?.toFixed(0) ?? '—' }}</td>
            </template>
            <template v-else-if="inputType === 'audio'">
              <td class="table-cell font-mono">{{ asAsr(result)?.wordCount ?? '—' }}</td>
              <td class="table-cell font-mono">{{ asAsr(result)?.partialCount ?? '—' }}</td>
              <td class="table-cell font-mono">{{ asAsr(result)?.finalCount ?? '—' }}</td>
            </template>
            <td class="table-cell text-red-500 text-xs max-w-xs truncate">{{ result.result.error ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
