<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">{{ project ? 'Edit Project' : 'Create New Project' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="project" class="form-group">
          <label class="form-label">Project ID</label>
          <input
            :value="project.id"
            type="text"
            disabled
            class="form-input-disabled font-mono"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Project Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="My AI Project"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Optional description"
            class="form-textarea"
          ></textarea>
        </div>

        <div v-if="project" class="card-info">
          <div class="flex-between">
            <span>Version: {{ project.version }}</span>
            <span>Created: {{ formatDate(project.createdAt) }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ project ? 'Save Changes' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProjectResponse } from '@/types/api'

const props = defineProps<{
  project: ProjectResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; description?: string; version?: number }): void
}>()

const form = ref({
  name: '',
  description: '',
  version: undefined as number | undefined,
})

watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      form.value = {
        name: newProject.name,
        description: newProject.description ?? '',
        version: newProject.version,
      }
    } else {
      form.value = { name: '', description: '', version: undefined }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!form.value.name) return
  emit('save', form.value)
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.required {
  color: #ef4444;
}

.card-info {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
}

.font-mono {
  font-family: monospace;
}
</style>
