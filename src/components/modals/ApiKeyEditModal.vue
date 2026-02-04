<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">{{ apiKey ? 'Edit API Key' : 'Create New API Key' }}</h2>
      
      <!-- Show the key immediately after creation -->
      <div v-if="showNewKeyAlert && newKeyValue" class="alert-success">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="font-medium mb-2">API Key Created Successfully!</p>
            <p class="text-sm mb-2">Make sure to copy your API key now. You won't be able to see it again!</p>
            <div class="bg-white p-3 rounded border border-green-300 font-mono text-sm break-all">
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

        <div v-if="apiKey" class="form-group">
          <label class="form-label">Key Preview</label>
          <input
            :value="apiKey.keyPreview"
            type="text"
            disabled
            class="form-input-disabled font-mono"
          />
          <p class="form-hint">First characters of the key for identification</p>
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
              <span class="text-gray-600">Created:</span>
              <span>{{ formatDate(apiKey.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Last Used:</span>
              <span>{{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            {{ showNewKeyAlert ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!showNewKeyAlert" type="submit" class="btn-primary">
            {{ apiKey ? 'Save Changes' : 'Create API Key' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ApiKeyResponse } from '@/api/types'

const props = defineProps<{
  apiKey: ApiKeyResponse | null
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; isActive?: boolean; metadata?: Record<string, any>; version?: number }): void
  (e: 'created', key: string): void
}>()

const form = ref({
  name: '',
  isActive: true,
  metadata: {} as Record<string, any>,
  version: undefined as number | undefined,
})

const newKeyValue = ref<string | null>(null)
const showNewKeyAlert = ref(false)
const copied = ref(false)

watch(
  () => props.apiKey,
  (newApiKey) => {
    if (newApiKey) {
      form.value = {
        name: newApiKey.name,
        isActive: newApiKey.isActive,
        metadata: newApiKey.metadata ?? {},
        version: newApiKey.version,
      }
      
      // Show the key if it was just created
      if (newApiKey.key) {
        newKeyValue.value = newApiKey.key
        showNewKeyAlert.value = true
      }
    } else {
      form.value = { name: '', isActive: true, metadata: {}, version: undefined }
      newKeyValue.value = null
      showNewKeyAlert.value = false
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!form.value.name) return
  
  const data: any = {
    name: form.value.name,
  }
  
  if (props.apiKey) {
    // Editing existing key
    data.isActive = form.value.isActive
    data.metadata = form.value.metadata
    data.version = form.value.version
  } else {
    // Creating new key
    data.metadata = form.value.metadata
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
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.alert-success {
  background-color: #d1fae5;
  border: 1px solid #10b981;
  color: #065f46;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
