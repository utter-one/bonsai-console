<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">{{ apiKey ? 'Edit API Key' : 'Create New API Key' }}</h2>
      
      <!-- Show the key immediately after creation -->
      <div v-if="showNewKeyAlert && newKeyValue" class="alert-success">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="font-medium mb-2">This is your API Key</p>
            <div class="bg-gray-800 p-3 rounded border border-green-600 font-mono text-sm break-all text-green-400">
              {{ newKeyValue }}
            </div>
            <button 
              @click="copyToClipboard" 
              type="button"
              class="mt-2 btn-secondary text-sm"
            >
              {{ copied ? 'Copied!' : 'Copy to Clipboard' }}
            </button>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">
            API Key Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Production API Key"
            maxlength="255"
            class="form-input"
          />
          <p class="form-hint">A descriptive name to identify this API key</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Project 
            <span v-if="!apiKey && !props.projectId" class="required">*</span>
          </label>
          <select v-if="!apiKey && !props.projectId" v-model="form.projectId" class="form-select" required>
            <option value="" disabled>Select a project</option>
            <option v-for="option in projectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input v-if="apiKey || props.projectId" :value="projects.find(p => p.id === (props.projectId || form.projectId))?.name || 'Unknown'" readonly class="form-input" />
          <p class="form-hint">{{ apiKey || props.projectId ? 'Project cannot be changed' : 'Choose the project for this API key' }}</p>
        </div>

        <div v-if="apiKey" class="form-group">
          <label class="flex items-center gap-2">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="form-label mb-0">Active</span>
          </label>
          <p class="form-hint">Inactive keys cannot be used for authentication</p>
        </div>

        <div v-if="apiKey" class="card-info">
          <div class="text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Created:</span>
              <span>{{ formatDate(apiKey.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Last Used:</span>
              <span>{{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            {{ showNewKeyAlert ? 'Close' : 'Cancel' }}
          </button>
          <!-- Show Save button if editing, or if creating and not showing new key alert -->
          <button type="submit" class="btn-primary">
            {{ apiKey ? 'Save Changes' : 'Create API Key' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps<{
  apiKey: ApiKeyResponse | null
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: CreateApiKeyRequest | UpdateApiKeyRequest): void
  (e: 'created', key: string): void
  (e: 'project-selected', projectId: string): void
}>()

const form = ref({
  name: '',
  isActive: true,
  metadata: {} as Record<string, any>,
  version: undefined as number | undefined,
  projectId: props.projectId || '',
})

const projectsStore = useProjectsStore()
onMounted(() => projectsStore.fetchAll())
const projects = computed(() => projectsStore.items)
const projectOptions = computed(() =>
  projects.value.map(p => ({ label: p.name, value: p.id }))
)

const newKeyValue = ref<string | null>(null)
const showNewKeyAlert = ref(false)
const copied = ref(false)

watch(
  () => form.value.projectId,
  (newProjectId) => {
    if (newProjectId) emit('project-selected', newProjectId)
  }
)

watch(
  () => props.apiKey,
  (newApiKey) => {
    if (newApiKey) {
      form.value = {
        name: newApiKey.name,
        isActive: newApiKey.isActive,
        metadata: newApiKey.metadata ?? {},
        version: newApiKey.version,
        projectId: newApiKey.projectId || props.projectId || '',
      }
      emit('project-selected', form.value.projectId)
      // Show the key if it was just created
      if (newApiKey.key) {
        newKeyValue.value = newApiKey.key
        showNewKeyAlert.value = true
      }
    } else {
      form.value = {
        name: '',
        isActive: true,
        metadata: {},
        version: undefined,
        projectId: props.projectId || '',
      }
      newKeyValue.value = null
      showNewKeyAlert.value = false
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!form.value.name) return
  if (!props.apiKey && !props.projectId && !form.value.projectId) return
  const data: any = {
    name: form.value.name,
  }
  if (!props.apiKey) {
    // Creating new key
    data.metadata = form.value.metadata
  } else {
    // Editing existing key
    data.isActive = form.value.isActive
    data.metadata = form.value.metadata
    data.version = form.value.version
  }
  emit('save', data)
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

async function copyToClipboard() {
  if (!newKeyValue.value) return
  
  try {
    await navigator.clipboard.writeText(newKeyValue.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.required {
  color: #ef4444;
}

.card-info {
  background: rgb(55 65 81 / 0.5);
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
}

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.alert-success {
  background-color: rgb(6 78 59 / 0.2);
  border: 1px solid #10b981;
  color: #10b981;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
