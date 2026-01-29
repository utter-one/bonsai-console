<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvidersStore } from '@/stores'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { ProviderResponse } from '@/types/api'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'

const route = useRoute()
const router = useRouter()
const providersStore = useProvidersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'config' | 'metadata'>('basic')
const configJson = ref('')
const form = ref({
  id: '',
  displayName: '',
  description: '',
  providerType: 'llm' as 'asr' | 'tts' | 'llm' | 'embeddings',
  apiType: '',
  config: {} as Record<string, any>,
  tags: [] as string[],
  createdBy: ''
})

// Computed
const providerId = computed(() => route.params.providerId as string | undefined)
const isEditMode = computed(() => !!providerId.value)
const currentProvider = ref<ProviderResponse | null>(null)

const providerTypes = [
  { value: 'llm', label: 'LLM (Large Language Model)' },
  { value: 'asr', label: 'ASR (Automatic Speech Recognition)' },
  { value: 'tts', label: 'TTS (Text-to-Speech)' },
  { value: 'embeddings', label: 'Embeddings' }
]

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    await loadProvider()
  }
})

// Methods
async function loadProvider() {
  if (!providerId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentProvider.value = await providersStore.fetchById(providerId.value)
    if (currentProvider.value) {
      form.value = {
        id: currentProvider.value.id,
        displayName: currentProvider.value.displayName,
        description: currentProvider.value.description || '',
        providerType: currentProvider.value.providerType,
        apiType: currentProvider.value.apiType,
        config: currentProvider.value.config || {},
        tags: currentProvider.value.tags || [],
        createdBy: currentProvider.value.createdBy || ''
      }
      configJson.value = JSON.stringify(currentProvider.value.config, null, 2)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load provider'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  
  // Validate config JSON
  try {
    form.value.config = JSON.parse(configJson.value)
  } catch (err) {
    error.value = 'Invalid JSON in configuration field'
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentProvider.value) {
      // Update existing provider
      await providersStore.update(currentProvider.value.id, {
        version: currentProvider.value.version,
        displayName: form.value.displayName,
        description: form.value.description || undefined,
        providerType: form.value.providerType,
        apiType: form.value.apiType,
        config: form.value.config,
        tags: form.value.tags.length > 0 ? form.value.tags : undefined
      })
    } else {
      // Create new provider
      const createData: any = {
        displayName: form.value.displayName,
        providerType: form.value.providerType,
        apiType: form.value.apiType,
        config: form.value.config
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include description if it's not empty
      if (form.value.description) {
        createData.description = form.value.description
      }

      // Only include createdBy if it's not empty
      if (form.value.createdBy) {
        createData.createdBy = form.value.createdBy
      }

      // Only include tags if there are any
      if (form.value.tags.length > 0) {
        createData.tags = form.value.tags
      }

      await providersStore.create(createData)
    }

    // Navigate back to providers list
    router.push({ name: 'administration.providers' })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} provider`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.providers' })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function addTag() {
  const tag = prompt('Enter tag name:')
  if (tag && tag.trim() && !form.value.tags.includes(tag.trim())) {
    form.value.tags.push(tag.trim())
  }
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to providers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ isEditMode ? 'Edit Provider' : 'Create Provider' }}</h1>
          <p class="text-sm text-gray-600">
            {{ isEditMode ? 'Update the provider configuration' : 'Define a new AI provider' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Provider') }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          Basic Information
        </button>
        <button
          @click="activeTab = 'config'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'config' }]"
          type="button"
        >
          Configuration
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'metadata'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]"
          type="button"
        >
          Metadata
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading provider...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode && !currentProvider" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Providers
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-gray-50">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
        <!-- Error Message -->
        <div v-if="error" class="alert-error mb-6">
          {{ error }}
        </div>

        <!-- Basic Information Tab -->
        <div v-show="activeTab === 'basic'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Display Name <span class="required">*</span>
            </label>
            <input
              v-model="form.displayName"
              type="text"
              required
              placeholder="OpenAI GPT-4"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A human-readable name for this provider</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.id"
              type="text"
              placeholder="openai-gpt4"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The provider ID cannot be changed after creation' 
                : 'Leave empty to auto-generate. Use lowercase letters, numbers, and hyphens only.' 
              }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Description <span class="text-gray-500">(optional)</span>
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-textarea"
              placeholder="A brief description of this provider..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              Optional description to help identify the purpose of this provider
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Provider Type <span class="required">*</span>
            </label>
            <select
              v-model="form.providerType"
              required
              class="form-select"
              :disabled="isEditMode || isLoading"
            >
              <option v-for="type in providerTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The provider type cannot be changed after creation' 
                : 'Select the type of AI service this provider offers' 
              }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              API Type <span class="required">*</span>
            </label>
            <input
              v-model="form.apiType"
              type="text"
              required
              placeholder="openai"
              class="form-input-mono"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              The API implementation type (e.g., "openai", "anthropic", "azure", "custom")
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Tags <span class="text-gray-500">(optional)</span>
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span v-for="(tag, index) in form.tags" :key="index" class="badge-secondary flex items-center gap-1">
                {{ tag }}
                <button type="button" @click="removeTag(index)" class="text-gray-600 hover:text-gray-900">
                  ×
                </button>
              </span>
              <button type="button" @click="addTag" class="btn-secondary btn-sm">
                + Add Tag
              </button>
            </div>
            <p class="form-help-text">
              Optional tags for organizing and filtering providers
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Created By <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.createdBy"
              type="text"
              placeholder="admin-id"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The creator cannot be changed after creation' 
                : 'Optional admin ID who created this provider' 
              }}
            </p>
          </div>
        </div>

        <!-- Configuration Tab -->
        <div v-show="activeTab === 'config'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Provider Configuration <span class="required">*</span>
            </label>
            <textarea
              v-model="configJson"
              required
              rows="25"
              class="form-textarea font-mono text-sm"
              placeholder='{\n  "apiKey": "sk-...",\n  "model": "gpt-4",\n  "temperature": 0.7\n}'
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              JSON configuration object for this provider. Include API keys, endpoints, model parameters, and any provider-specific settings.
            </p>
          </div>
        </div>

        <!-- Metadata Tab -->
        <div v-if="isEditMode && currentProvider" v-show="activeTab === 'metadata'" class="tab-content">
          <div class="metadata-container">
            <div class="metadata-item">
              <span class="metadata-label">Provider ID</span>
              <span class="metadata-value">{{ currentProvider.id }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Provider Type</span>
              <span class="metadata-value">{{ currentProvider.providerType }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">API Type</span>
              <span class="metadata-value">{{ currentProvider.apiType }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Created By</span>
              <span class="metadata-value">{{ currentProvider.createdBy || 'N/A' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Version</span>
              <span class="metadata-value">{{ currentProvider.version }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Created</span>
              <span class="metadata-value">{{ formatDate(currentProvider.createdAt) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Updated</span>
              <span class="metadata-value">{{ formatDate(currentProvider.updatedAt) }}</span>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
