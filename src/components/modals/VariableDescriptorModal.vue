<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-4xl" @click.stop>
      <h2 class="modal-header">
        {{ editingIndex !== null ? 'Edit Variable Descriptor' : 'Add Variable Descriptor' }}
        <span v-if="breadcrumb" class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
          {{ breadcrumb }}
        </span>
      </h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">
            Variable Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="user_name"
            class="form-input"
            :disabled="editingIndex !== null"
          />
          <p class="form-help-text">
            The name of the variable as used in stage context
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Type <span class="required">*</span>
          </label>
          <select
            v-model="form.type"
            required
            class="form-select-auto"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="string[]">String Array</option>
            <option value="number[]">Number Array</option>
            <option value="boolean[]">Boolean Array</option>
            <option value="object[]">Object Array</option>
            <option value="image">Image</option>
            <option value="image[]">Image Array</option>
            <option value="audio">Audio</option>
            <option value="audio[]">Audio Array</option>
          </select>
          <p class="form-help-text">
            The data type expected for this variable
          </p>
        </div>

        <!-- Object Schema Section -->
        <div v-if="isObjectType" class="form-group border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <label class="form-label mb-0">Object Schema</label>
              <p class="form-help-text mt-1">
                Define the nested fields for this object
              </p>
            </div>
            <button
              type="button"
              @click="addNestedField"
              class="btn-primary btn-sm"
            >
              <Plus class="inline-block w-3 h-3 mr-1" />
              Add Field
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="form.objectSchema.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400">No nested fields defined</p>
          </div>

          <!-- Nested Fields Table -->
          <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(field, index) in form.objectSchema" :key="index">
                  <td class="px-3 py-2 text-sm">
                    <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
                      {{ field.name }}
                    </code>
                  </td>
                  <td class="px-3 py-2 text-sm">
                    <span class="badge-primary text-xs">{{ field.type }}</span>
                    <span v-if="field.objectSchema && field.objectSchema.length > 0" class="text-xs text-gray-500 ml-1">
                      ({{ field.objectSchema.length }} nested)
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right text-sm">
                    <button
                      type="button"
                      @click="editNestedField(index)"
                      class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      @click="deleteNestedField(index)"
                      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="!form.name">
            {{ editingIndex !== null ? 'Save Changes' : 'Add Variable' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Nested Field Modal (Recursive) -->
    <VariableDescriptorModal
      v-if="showNestedModal"
      :descriptor="editingNestedDescriptor"
      :editing-index="editingNestedIndex"
      :breadcrumb="nestedBreadcrumb"
      @close="showNestedModal = false"
      @save="handleNestedFieldSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { FieldDescriptor } from '@/api/types'

const props = defineProps<{
  descriptor: FieldDescriptor | null
  editingIndex: number | null
  breadcrumb?: string
}>()

const emit = defineEmits<{
  close: []
  save: [descriptor: FieldDescriptor]
}>()

const form = ref<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  isArray: boolean
  objectSchema: FieldDescriptor[]
}>({
  name: '',
  type: 'string',
  isArray: false,
  objectSchema: []
})

// Check if current type is an object type
const isObjectType = computed(() => {
  return form.value.type === 'object' || form.value.type === 'object[]'
})

// Nested modal state
const showNestedModal = ref(false)
const editingNestedIndex = ref<number | null>(null)
const editingNestedDescriptor = ref<FieldDescriptor | null>(null)

const nestedBreadcrumb = computed(() => {
  if (props.breadcrumb) {
    return `${props.breadcrumb} > ${form.value.name || 'new'}`
  }
  return form.value.name || 'new'
})

// Initialize form when descriptor prop changes
watch(() => props.descriptor, (descriptor) => {
  if (descriptor) {
    form.value = {
      name: descriptor.name,
      type: descriptor.type,
      isArray: descriptor.isArray,
      objectSchema: descriptor.objectSchema || []
    }
  } else {
    form.value = {
      name: '',
      type: 'string',
      isArray: false,
      objectSchema: []
    }
  }
}, { immediate: true })

// Clear objectSchema when type changes away from object types
watch(() => form.value.type, (newType, oldType) => {
  const wasObject = oldType === 'object' || oldType === 'object[]'
  const isObject = newType === 'object' || newType === 'object[]'
  
  if (wasObject && !isObject) {
    form.value.objectSchema = []
  }
})

// Nested field management
function addNestedField() {
  editingNestedIndex.value = null
  editingNestedDescriptor.value = null
  showNestedModal.value = true
}

function editNestedField(index: number) {
  const field = form.value.objectSchema[index]
  if (!field) return
  
  editingNestedIndex.value = index
  editingNestedDescriptor.value = field
  showNestedModal.value = true
}

function deleteNestedField(index: number) {
  if (confirm('Are you sure you want to delete this nested field?')) {
    form.value.objectSchema.splice(index, 1)
  }
}

function handleNestedFieldSave(descriptor: FieldDescriptor) {
  if (editingNestedIndex.value !== null) {
    // Update existing
    form.value.objectSchema[editingNestedIndex.value] = descriptor
  } else {
    // Add new
    form.value.objectSchema.push(descriptor)
  }
  
  showNestedModal.value = false
  editingNestedIndex.value = null
  editingNestedDescriptor.value = null
}

const handleSubmit = () => {
  // Automatically set isArray based on type
  const isArrayType = form.value.type.endsWith('[]')
  
  const descriptor: FieldDescriptor = {
    name: form.value.name,
    type: form.value.type,
    isArray: isArrayType
  }
  
  // Only include objectSchema if it's an object type and has fields
  if (isObjectType.value && form.value.objectSchema.length > 0) {
    descriptor.objectSchema = form.value.objectSchema
  }
  
  emit('save', descriptor)
}
</script>

<style scoped>
/* Modal styles are inherited from utilities.css */
</style>
