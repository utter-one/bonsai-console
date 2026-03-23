<template>
  <span
    v-if="settings?.model"
    class="badge badge-secondary gap-1.5 self-center text-xs"
    :title="`Model: ${settings.model}`"
  >
    <Cpu class="w-3 h-3 shrink-0" />
    {{ formatModelName(settings.model) }}
    <Thermometer v-if="settings.defaultTemperature" class="w-3 h-3 shrink-0" />
    {{ settings.defaultTemperature }}
  </span>
</template>

<script setup lang="ts">
import { Cpu, Thermometer } from 'lucide-vue-next'
import type { LlmSettings } from '@/api/types'

defineProps<{
  settings: LlmSettings | null | undefined
}>()

const ACRONYMS = new Set(['gpt', 'llm', 'oss', 'api', 'aws'])

function formatModelName(model: string): string {
  const name = model.includes('/') ? model.split('/').pop()! : model
  return name
    .split('-')
    .map(part => {
      if (ACRONYMS.has(part.toLowerCase())) return part.toUpperCase()
      if (/^\d+[bmk]$/i.test(part)) return part.toUpperCase()
      if (/^\d/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}
</script>
