<template>
  <BaseModal title="Duplicate Action" size="md" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">
            New Action Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
            :class="{ 'border-red-500': nameConflict }"
            placeholder="e.g., My Action"
          />
          <p v-if="nameConflict" class="text-red-500 text-sm mt-1">
            An action with this name already exists. Please choose a different name.
          </p>
          <p v-else class="form-help-text">
            Display name for the new action
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="nameConflict">
            Duplicate Action
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

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

const nameConflict = computed(() =>
  props.existingNames.includes(form.value.name.trim())
)

watch(() => props.originalName, (name) => {
  form.value.name = name ? `${name} (Copy)` : ''
}, { immediate: true })

function handleSubmit() {
  emit('save', { name: form.value.name })
}
</script>
