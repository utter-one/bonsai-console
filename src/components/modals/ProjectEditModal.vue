<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content modal-content-large" @click.stop>
      <h2 class="modal-header">{{ project ? 'Edit Project' : 'Create New Project' }}</h2>
      
      <!-- Tabs (only show for edit mode) -->
      <div v-if="project" class="tabs-container">
        <nav class="tabs-nav" aria-label="Tabs">
          <button
            @click="activeTab = 'basic'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
            type="button"
          >
            Basic Info
          </button>
          <button
            @click="activeTab = 'apiKeys'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'apiKeys' }]"
            type="button"
          >
            API Keys
          </button>
          <button
            @click="activeTab = 'metadata'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]"
            type="button"
          >
            Metadata
          </button>
        </nav>
      </div>

      <!-- Basic Info Tab -->
      <form v-show="activeTab === 'basic'" @submit.prevent="handleSubmit">
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
          <button type="button" @click="handleClose" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ project ? 'Save Changes' : 'Create' }}
          </button>
        </div>
      </form>

      <!-- API Keys Tab -->
      <div v-show="activeTab === 'apiKeys' && project" class="tab-content">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">API Keys</h3>
            <p class="text-sm text-gray-600">Manage API keys for this project</p>
          </div>
          <button @click="handleCreateApiKey" class="btn-primary">
            <Plus class="inline-block w-4 h-4 mr-2" />
            Create API Key
          </button>
        </div>

        <div v-if="apiKeysLoading" class="text-center py-8 text-gray-500">
          Loading API keys...
        </div>
        
        <div v-else-if="apiKeysError" class="error-message">
          {{ apiKeysError }}
        </div>

        <div v-else-if="filteredApiKeys.length === 0" class="text-center py-8 text-gray-500">
          No API keys yet. Create one to get started.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="apiKey in filteredApiKeys"
            :key="apiKey.id"
            class="api-key-card"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-semibold text-gray-900">{{ apiKey.name }}</h4>
                  <span
                    :class="[
                      'badge',
                      apiKey.isActive ? 'badge-active' : 'badge-inactive'
                    ]"
                  >
                    {{ apiKey.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 font-mono">{{ apiKey.keyPreview }}</p>
                <div class="text-xs text-gray-500 mt-1">
                  <span>Created: {{ formatDate(apiKey.createdAt) }}</span>
                  <span class="mx-2">•</span>
                  <span>Last used: {{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="handleToggleApiKey(apiKey)"
                  class="btn-secondary text-sm"
                  :title="apiKey.isActive ? 'Deactivate' : 'Activate'"
                >
                  {{ apiKey.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  @click="handleEditApiKey(apiKey)"
                  class="btn-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  @click="handleDeleteApiKey(apiKey)"
                  class="btn-danger text-sm"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="handleClose" class="btn-secondary">
            Close
          </button>
        </div>
      </div>

      <!-- Metadata Tab -->
      <div v-show="activeTab === 'metadata' && project" class="tab-content">
        <MetadataTab
          v-if="project"
          :fields="metadataFields"
        />
        <div class="modal-footer">
          <button type="button" @click="handleClose" class="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- API Key Edit Modal -->
    <ApiKeyEditModal
      v-if="showApiKeyModal"
      :api-key="selectedApiKey"
      :project-id="project?.id || ''"
      @close="handleApiKeyModalClose"
      @save="handleApiKeySave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import type { ProjectResponse, ApiKeyResponse } from '@/api/types'
import { useApiKeysStore } from '@/stores'
import MetadataTab from '@/components/MetadataTab.vue'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'

const props = defineProps<{
  project: ProjectResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; description?: string; version?: number }): void
}>()

const apiKeysStore = useApiKeysStore()

const form = ref({
  name: '',
  description: '',
  version: undefined as number | undefined,
})

const activeTab = ref<'basic' | 'apiKeys' | 'metadata'>('basic')
const showApiKeyModal = ref(false)
const selectedApiKey = ref<ApiKeyResponse | null>(null)
const apiKeysLoading = ref(false)
const apiKeysError = ref<string | null>(null)

watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      form.value = {
        name: newProject.name,
        description: newProject.description ?? '',
        version: newProject.version,
      }
      
      // Load API keys when project is set
      loadApiKeys()
    } else {
      form.value = { name: '', description: '', version: undefined }
      activeTab.value = 'basic'
    }
  },
  { immediate: true }
)

// Watch tab changes to reload API keys
watch(activeTab, (newTab) => {
  if (newTab === 'apiKeys' && props.project) {
    loadApiKeys()
  }
})

onMounted(() => {
  if (props.project) {
    loadApiKeys()
  }
})

async function loadApiKeys() {
  if (!props.project) return
  
  apiKeysLoading.value = true
  apiKeysError.value = null
  
  try {
    await apiKeysStore.fetchAll({
      filters: {
        projectId: props.project.id
      }
    })
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to load API keys'
  } finally {
    apiKeysLoading.value = false
  }
}

const filteredApiKeys = computed(() => {
  if (!props.project) return []
  return apiKeysStore.items.filter(key => key.projectId === props.project!.id)
})

const metadataFields = computed(() => {
  if (!props.project) return []
  return [
    { label: 'Project ID', value: props.project.id, format: 'mono' as const },
    { label: 'Version', value: props.project.version },
    { label: 'Created', value: props.project.createdAt, format: 'date' as const },
    { label: 'Updated', value: props.project.updatedAt, format: 'date' as const },
  ]
})

function handleSubmit() {
  if (!form.value.name) return
  emit('save', form.value)
}

function handleClose() {
  emit('close')
}

function handleCreateApiKey() {
  selectedApiKey.value = null
  showApiKeyModal.value = true
}

function handleEditApiKey(apiKey: ApiKeyResponse) {
  selectedApiKey.value = apiKey
  showApiKeyModal.value = true
}

async function handleApiKeySave(data: any) {
  apiKeysError.value = null
  
  try {
    if (selectedApiKey.value) {
      // Update existing key
      await apiKeysStore.update(selectedApiKey.value.id, data)
    } else {
      // Create new key
      const newKey = await apiKeysStore.create({
        projectId: props.project!.id,
        name: data.name,
        metadata: data.metadata
      })
      
      // Show the modal again with the new key (which includes the secret)
      if (newKey) {
        selectedApiKey.value = newKey
        // Don't close the modal - let user see and copy the key
        return
      }
    }
    
    // Close modal and reload keys
    showApiKeyModal.value = false
    selectedApiKey.value = null
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to save API key'
  }
}

function handleApiKeyModalClose() {
  showApiKeyModal.value = false
  selectedApiKey.value = null
}

async function handleToggleApiKey(apiKey: ApiKeyResponse) {
  apiKeysError.value = null
  
  try {
    await apiKeysStore.update(apiKey.id, {
      isActive: !apiKey.isActive,
      version: apiKey.version
    })
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to update API key'
  }
}

async function handleDeleteApiKey(apiKey: ApiKeyResponse) {
  if (!confirm(`Are you sure you want to delete the API key "${apiKey.name}"? This action cannot be undone.`)) {
    return
  }
  
  apiKeysError.value = null
  
  try {
    await apiKeysStore.remove(apiKey.id)
    await loadApiKeys()
  } catch (err: any) {
    apiKeysError.value = err.response?.data?.message || 'Failed to delete API key'
  }
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

.modal-content-large {
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
}

.tabs-container {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.tabs-nav {
  display: flex;
  gap: 0;
}

.tab-button {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #111827;
  background: #f9fafb;
}

.tab-button-active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  padding: 0;
}

.api-key-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.api-key-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}
</style>
