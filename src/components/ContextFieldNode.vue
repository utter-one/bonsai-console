<template>
  <div>
    <div
      class="flex items-center gap-2 py-1.5 pr-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
      :style="{ paddingLeft: `${level * 1.25 + 0.75}rem` }"
    >
      <!-- Expand toggle for object types -->
      <button
        v-if="isExpandable"
        type="button"
        @click.stop="isExpanded = !isExpanded"
        class="w-4 h-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <ChevronDown v-if="isExpanded" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
      <div v-else class="w-4 flex-shrink-0"></div>

      <!-- Checkbox (hidden for non-selectable nodes inside arrays) -->
      <input
        v-if="!insideArray"
        type="checkbox"
        :id="checkboxId"
        :checked="isSelected"
        @change="$emit('toggle-path', path)"
        @click.stop
        class="form-checkbox w-4 h-4 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 cursor-pointer"
      />
      <!-- For items inside an array schema, show a decorative dot instead -->
      <span v-else class="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
      </span>

      <!-- Field name + type -->
      <label
        :for="!insideArray ? checkboxId : undefined"
        class="flex-1 flex items-center gap-2 min-w-0"
        :class="insideArray ? 'cursor-default opacity-60' : 'cursor-pointer'"
      >
        <code class="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
          {{ descriptor.name }}
        </code>
        <span class="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0" :class="typeClass">
          {{ descriptor.type }}
        </span>
      </label>

      <!-- Array schema preview badge -->
      <span
        v-if="isArrayNode && descriptor.objectSchema && descriptor.objectSchema.length > 0"
        class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap"
      >
        {{ descriptor.objectSchema.length }} field{{ descriptor.objectSchema.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Nested fields for object / object[] types -->
    <template v-if="isExpanded && descriptor.objectSchema">
      <!-- Array schema preview indicator -->
      <div
        v-if="isArrayNode"
        class="text-xs text-gray-400 dark:text-gray-500 italic py-1"
        :style="{ paddingLeft: `${(level + 1) * 1.25 + 0.75}rem` }"
      >
        array item schema (not individually selectable)
      </div>
      <ContextFieldNode
        v-for="(nested, i) in descriptor.objectSchema"
        :key="i"
        :descriptor="nested"
        :path="`${path}.${nested.name}`"
        :selected-paths="selectedPaths"
        :level="level + 1"
        :inside-array="insideArray || isArrayNode"
        @toggle-path="$emit('toggle-path', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { FieldDescriptor } from '@/api/types'

const props = withDefaults(defineProps<{
  descriptor: FieldDescriptor
  path: string
  selectedPaths: string[]
  level?: number
  insideArray?: boolean
}>(), {
  level: 0,
  insideArray: false,
})

defineEmits<{
  'toggle-path': [path: string]
}>()

const isExpanded = ref(false)

const checkboxId = computed(() => `ctx-field-${props.path.replace(/\./g, '-')}`)

const isArrayNode = computed(() =>
  props.descriptor.type === 'object[]'
)

const isExpandable = computed(() =>
  (props.descriptor.type === 'object' || props.descriptor.type === 'object[]') &&
  !!props.descriptor.objectSchema?.length
)

const isSelected = computed(() => props.selectedPaths.includes(props.path))

const typeClass = computed(() => {
  const t = props.descriptor.type
  if (t === 'object' || t === 'object[]') {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  }
  if (t.endsWith('[]')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }
  if (t === 'string') {
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  }
  if (t === 'number') {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  }
  if (t === 'boolean') {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
  }
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
})
</script>
