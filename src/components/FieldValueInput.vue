<template>
  <!-- String -->
  <input
    v-if="field.type === 'string'"
    v-model="values[field.name]"
    type="text"
    class="form-input"
    :placeholder="`Enter ${field.name}...`"
  />

  <!-- Number -->
  <input
    v-else-if="field.type === 'number'"
    v-model.number="values[field.name]"
    type="number"
    step="any"
    class="form-input"
    :placeholder="`Enter ${field.name}...`"
  />

  <!-- Boolean -->
  <div v-else-if="field.type === 'boolean'" class="flex items-center gap-2 h-9">
    <input v-model="values[field.name]" type="checkbox" class="form-checkbox" />
    <span class="text-sm text-gray-700 dark:text-gray-200">
      {{ values[field.name] ? 'True' : 'False' }}
    </span>
  </div>

  <!-- Object (JSON) -->
  <div v-else-if="field.type === 'object'">
    <textarea
      v-model="values[field.name]"
      class="form-textarea font-mono text-sm"
      rows="4"
      placeholder="{}"
    />
    <p v-if="jsonErrors[field.name]" class="text-xs text-red-600 mt-1 dark:text-red-400">
      {{ jsonErrors[field.name] }}
    </p>
    <p v-else class="text-xs text-gray-400 mt-1">Enter a valid JSON object (leave as {} to skip)</p>
  </div>

  <!-- String array -->
  <div v-else-if="field.type === 'string[]'" class="space-y-2">
    <div v-for="(_item, idx) in arr(field.name)" :key="idx" class="flex gap-2">
      <input v-model="arr(field.name)[idx]" type="text" class="form-input flex-1" placeholder="Enter string..." />
      <button type="button" class="btn-icon" @click="removeItem(field.name, idx)" title="Remove">
        <X :size="14" />
      </button>
    </div>
    <button type="button" class="btn-secondary text-sm" @click="addItem(field.name, 'string')">
      <Plus :size="14" /> Add Item
    </button>
  </div>

  <!-- Number array -->
  <div v-else-if="field.type === 'number[]'" class="space-y-2">
    <div v-for="(_item, idx) in arr(field.name)" :key="idx" class="flex gap-2">
      <input v-model.number="arr(field.name)[idx]" type="number" step="any" class="form-input flex-1" />
      <button type="button" class="btn-icon" @click="removeItem(field.name, idx)" title="Remove">
        <X :size="14" />
      </button>
    </div>
    <button type="button" class="btn-secondary text-sm" @click="addItem(field.name, 'number')">
      <Plus :size="14" /> Add Item
    </button>
  </div>

  <!-- Boolean array -->
  <div v-else-if="field.type === 'boolean[]'" class="space-y-2">
    <div v-for="(_item, idx) in arr(field.name)" :key="idx" class="flex items-center gap-2">
      <input v-model="arr(field.name)[idx]" type="checkbox" class="form-checkbox" />
      <span class="text-sm text-gray-700 dark:text-gray-200 flex-1">
        {{ arr(field.name)[idx] ? 'True' : 'False' }}
      </span>
      <button type="button" class="btn-icon" @click="removeItem(field.name, idx)" title="Remove">
        <X :size="14" />
      </button>
    </div>
    <button type="button" class="btn-secondary text-sm" @click="addItem(field.name, 'boolean')">
      <Plus :size="14" /> Add Item
    </button>
  </div>

  <!-- Object array (JSON items) -->
  <div v-else-if="field.type === 'object[]'" class="space-y-2">
    <div v-for="(_item, idx) in arr(field.name)" :key="idx" class="flex gap-2">
      <textarea
        v-model="arr(field.name)[idx]"
        class="form-textarea font-mono text-sm flex-1"
        rows="3"
        placeholder="{}"
      />
      <button type="button" class="btn-icon h-fit mt-1" @click="removeItem(field.name, idx)" title="Remove">
        <X :size="14" />
      </button>
    </div>
    <p v-if="jsonErrors[field.name]" class="text-xs text-red-600 dark:text-red-400">
      {{ jsonErrors[field.name] }}
    </p>
    <button type="button" class="btn-secondary text-sm" @click="addItem(field.name, 'object')">
      <Plus :size="14" /> Add Item
    </button>
  </div>

  <!-- Image / audio (not supported for pre-set) -->
  <div
    v-else-if="field.type === 'image' || field.type === 'image[]' || field.type === 'audio' || field.type === 'audio[]'"
    class="form-input form-input-disabled text-sm text-gray-400 dark:text-gray-500"
  >
    Media fields cannot be pre-set in the playground
  </div>
</template>

<script setup lang="ts">
import { X, Plus } from 'lucide-vue-next'
import type { FieldDescriptor } from '@/api/types'
import { defaultItemForArrayType } from '@/utils/arrayEditor'

const { field, values, arrayValues, jsonErrors } = defineProps<{
  field: FieldDescriptor
  values: Record<string, any>
  arrayValues: Record<string, any[]>
  jsonErrors: Record<string, string>
}>()

function arr(name: string): any[] {
  return (arrayValues as Record<string, any[]>)[name] ?? []
}

function addItem(fieldName: string, itemType: string) {
  arr(fieldName).push(defaultItemForArrayType(itemType))
}

function removeItem(fieldName: string, index: number) {
  arr(fieldName).splice(index, 1)
}
</script>
