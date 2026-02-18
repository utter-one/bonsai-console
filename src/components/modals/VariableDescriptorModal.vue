<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">
        {{ editingIndex !== null ? 'Edit Variable Descriptor' : 'Add Variable Descriptor' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FieldDescriptor } from '@/api/types'

const props = defineProps<{
  descriptor: FieldDescriptor | null
  editingIndex: number | null
}>()

const emit = defineEmits<{
  close: []
  save: [descriptor: FieldDescriptor]
}>()

const form = ref<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  isArray: boolean
}>({
  name: '',
  type: 'string',
  isArray: false
})

// Initialize form when descriptor prop changes
watch(() => props.descriptor, (descriptor) => {
  if (descriptor) {
    form.value = {
      name: descriptor.name,
      type: descriptor.type,
      isArray: descriptor.isArray
    }
  } else {
    form.value = {
      name: '',
      type: 'string',
      isArray: false
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  // Automatically set isArray based on type
  const isArrayType = form.value.type.endsWith('[]')
  
  emit('save', {
    name: form.value.name,
    type: form.value.type,
    isArray: isArrayType
  })
}
</script>

<style scoped>
/* Modal styles are inherited from utilities.css */
</style>
