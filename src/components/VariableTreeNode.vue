<template>
  <div>
    <!-- Current Node -->
    <div 
      class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
      :style="{ paddingLeft }"
    >
      <!-- Expand/Collapse Icon -->
      <button
        v-if="isObjectType"
        type="button"
        @click="$emit('toggle', path)"
        class="w-4 h-4 flex-shrink-0 text-gray-400"
      >
        <ChevronDown v-if="isExpanded" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
      <div v-else class="w-4"></div>

      <!-- Variable Name (Editable) -->
      <div class="flex-1 items-start min-w-0">
        <input
          v-if="isEditingName"
          v-model="editName"
          type="text"
          @blur="saveName"
          @keyup.enter="saveName"
          @keyup.esc="cancelEdit"
          ref="nameInput"
          class="form-input py-1 px-2 text-sm font-mono"
          :class="{ 'border-red-400 ring-1 ring-red-400': hasError }"
          placeholder="field_name"
        />
        <button
          v-else
          type="button"
          @click="startEditName"
          class="text-left w-full"
        >
          <code class="text-sm font-mono bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded"
            :class="{ 'ring-2 ring-red-500 dark:ring-red-400': hasError }">
            {{ descriptor.name }}
          </code>
        </button>
        <p v-if="errorMessage" class="text-xs text-red-500 dark:text-red-400 pt-1 mt-0.5">{{ errorMessage }}</p>
      </div>

      <!-- Type Selector (Inline) -->
      <select
        :value="descriptor.type"
        @change="updateType($event)"
        class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="object">Object</option>
        <option value="string[]">String[]</option>
        <option value="number[]">Number[]</option>
        <option value="boolean[]">Boolean[]</option>
        <option value="object[]">Object[]</option>
        <option value="image">Image</option>
        <option value="image[]">Image[]</option>
        <option value="audio">Audio</option>
        <option value="audio[]">Audio[]</option>
      </select>

      <!-- Nested Count -->
      <span v-if="hasNested" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {{ descriptor.objectSchema?.length || 0 }} field{{ (descriptor.objectSchema?.length || 0) !== 1 ? 's' : '' }}
      </span>

      <!-- Actions -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          v-if="isObjectType"
          type="button"
          @click="$emit('add-nested', path)"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
          title="Add nested field"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="$emit('delete', path)"
          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
          title="Delete"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Nested Fields -->
    <div v-if="isExpanded && hasNested">
      <VariableTreeNode
        v-for="(nested, index) in descriptor.objectSchema"
        :key="index"
        :descriptor="nested"
        :path="[...path, index]"
        :level="level + 1"
        :expanded-nodes="expandedNodes"
        :error-paths="errorPaths"
        @toggle="$emit('toggle', $event)"
        @update-name="$emit('update-name', $event)"
        @update-type="$emit('update-type', $event)"
        @delete="$emit('delete', $event)"
        @add-nested="$emit('add-nested', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import type { FieldDescriptor } from '@/api/types'

const props = withDefaults(defineProps<{
  descriptor: FieldDescriptor
  path: number[]
  level?: number
  expandedNodes: Set<string>
  errorPaths?: Map<string, string>
}>(), {
  level: 0,
  errorPaths: () => new Map()
})

const errorMessage = computed(() => props.errorPaths.get(props.path.join('-')) ?? null)
const hasError = computed(() => errorMessage.value !== null)

const emit = defineEmits<{
  toggle: [path: number[]]
  'update-name': [data: { path: number[]; name: string }]
  'update-type': [data: { path: number[]; type: string }]
  delete: [path: number[]]
  'add-nested': [path: number[]]
}>()

const isEditingName = ref(false)
const editName = ref('')
const nameInput = ref<HTMLInputElement>()

const isExpanded = computed(() => {
  return props.expandedNodes.has(props.path.join('-'))
})

const hasNested = computed(() => {
  return props.descriptor.objectSchema && props.descriptor.objectSchema.length > 0
})

const isObjectType = computed(() => {
  return props.descriptor.type === 'object' || props.descriptor.type === 'object[]'
})

const paddingLeft = computed(() => {
  return `${props.level * 1.5}rem`
})

function startEditName() {
  isEditingName.value = true
  editName.value = props.descriptor.name
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

function saveName() {
  if (editName.value && editName.value !== props.descriptor.name) {
    emit('update-name', { path: props.path, name: editName.value })
  }
  isEditingName.value = false
}

function cancelEdit() {
  isEditingName.value = false
  editName.value = props.descriptor.name
}

function updateType(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update-type', { path: props.path, type: target.value })
}
</script>
