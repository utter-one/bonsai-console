<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-lg" @click.stop>
      <h2 class="modal-header">
        Duplicate Action
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">
            New Action Key <span class="required">*</span>
          </label>
          <input
            v-model="form.key"
            type="text"
            required
            class="form-input"
            placeholder="e.g., action_key"
            pattern="[a-zA-Z_][a-zA-Z0-9_]*"
            title="Key must start with a letter or underscore and contain only letters, numbers, and underscores"
          />
          <p class="form-help-text">
            Unique identifier for the new action (letters, numbers, underscores only)
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            New Action Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
            placeholder="e.g., My Action"
          />
          <p class="form-help-text">
            Display name for the new action
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Duplicate Action
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  originalKey: string
  originalName: string
}>()

const emit = defineEmits<{
  close: []
  save: [data: { key: string; name: string }]
}>()

const form = ref({
  key: '',
  name: ''
})

// Initialize form with suggestions based on original values
watch(() => props.originalKey, (key) => {
  if (key) {
    form.value.key = `${key}_copy`
    form.value.name = `${props.originalName} (Copy)`
  }
}, { immediate: true })

function handleSubmit() {
  emit('save', {
    key: form.value.key,
    name: form.value.name
  })
}
</script>
