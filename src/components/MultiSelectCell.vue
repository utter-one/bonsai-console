<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

export interface SelectOption {
  id: string
  name: string
}

const props = defineProps<{
  modelValue: string[]
  options: SelectOption[]
  placeholder?: string
  readonly?: boolean
  /** data-col value forwarded to the root focusable element for keyboard nav */
  dataCol?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const available = computed(() =>
  props.options.filter(o => !props.modelValue.includes(o.id))
)

function getLabel(id: string) {
  return props.options.find(o => o.id === id)?.name ?? id
}

function add(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  if (!id) return
  emit('update:modelValue', [...props.modelValue, id]);
  (e.target as HTMLSelectElement).value = ''
}

function remove(id: string) {
  emit('update:modelValue', props.modelValue.filter(v => v !== id))
}
</script>

<template>
  <div
    :data-col="dataCol"
    tabindex="0"
    class="flex flex-wrap gap-1 items-center min-h-[26px] outline-none focus:ring-1 focus:ring-emerald-400 dark:focus:ring-emerald-500 rounded px-0.5 py-0.5"
  >
    <span
      v-if="modelValue.length === 0 && (readonly || available.length === 0)"
      class="text-xs text-gray-400 dark:text-gray-600 italic"
    >{{ placeholder ?? 'None' }}</span>
    <span
      v-for="id in modelValue"
      :key="id"
      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
    >
      <span class="max-w-[90px] truncate">{{ getLabel(id) }}</span>
      <button
        v-if="!readonly"
        type="button"
        tabindex="-1"
        class="hover:text-red-500 dark:hover:text-red-400 transition-colors ml-0.5 shrink-0"
        @click.stop="remove(id)"
      ><X class="w-2.5 h-2.5" /></button>
    </span>
    <select
      v-if="!readonly && available.length > 0"
      tabindex="-1"
      class="max-w-full min-w-0 text-xs bg-transparent border border-dashed border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-500 dark:text-gray-400 outline-none hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-colors"
      @change="add"
    >
      <option value="">+ Add</option>
      <option v-for="opt in available" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
    </select>
  </div>
</template>

