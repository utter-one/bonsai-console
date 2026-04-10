<template>
  <BaseModal title="Duplicate Action" size="lg" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <FormField label="New Action Name" required class="w-full" :error="error" help="Display name for the new action">
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="e.g., My Action"
          />
        </FormField>

        <div class="modal-footer">
          <ErrorDisplay :error="error" class="flex-1 mr-2" />
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Duplicate Action
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import type { ParsedError } from '@/api/types'

const props = defineProps<{
  originalKey: string
  originalName: string
  existingNames: string[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string }]
}>()

const form = ref({
  name: ''
})

const error = ref<ParsedError | null>(null)


watch(() => props.originalName, (name) => {
  form.value.name = name ? `${name} (Copy)` : ''
}, { immediate: true })

watch(() => form.value.name, () => {
  error.value = null
})

function handleSubmit() {
  if (!form.value.name.trim()) {
    error.value = { message: 'Action name is required.' }
    return
  }
  if (props.existingNames.includes(form.value.name.trim())) {
    error.value = { message: 'An action with this name already exists. Please choose a different name.' }
    return
  }
  emit('save', { name: form.value.name })
}
</script>
