<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassifiersStore } from '@/stores'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { ClassifierResponse } from '@/types/api'

const route = useRoute()
const router = useRouter()
const classifiersStore = useClassifiersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'prompt' | 'advanced' | 'metadata'>('basic')
const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  llmProviderId: '',
  metadata: {}
})

// Computed
const projectId = computed(() => route.params.projectId as string)
const classifierId = computed(() => route.params.classifierId as string | undefined)
const isEditMode = computed(() => !!classifierId.value)
const currentClassifier = ref<ClassifierResponse | null>(null)

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    await loadClassifier()
  }
})

// Methods
async function loadClassifier() {
  if (!classifierId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentClassifier.value = await classifiersStore.fetchById(classifierId.value)
    if (currentClassifier.value) {
      form.value = {
        id: currentClassifier.value.id,
        name: currentClassifier.value.name,
        description: currentClassifier.value.description || '',
        prompt: currentClassifier.value.prompt,
        llmProviderId: currentClassifier.value.llmProviderId || '',
        metadata: currentClassifier.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load classifier'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentClassifier.value) {
      // Update existing classifier
      await classifiersStore.update(currentClassifier.value.id, {
        version: currentClassifier.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId || null,
        metadata: form.value.metadata
      })
    } else {
      // Create new classifier
      const createData: any = {
        projectId: projectId.value,
        name: form.value.name,
        prompt: form.value.prompt,
        metadata: form.value.metadata
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include description if it's not empty
      if (form.value.description) {
        createData.description = form.value.description
      }

      // Only include llmProviderId if it's not empty
      if (form.value.llmProviderId) {
        createData.llmProviderId = form.value.llmProviderId
      }

      await classifiersStore.create(createData)
    }

    // Navigate back to classifiers list
    router.push({ name: 'design.classifiers', params: { projectId: projectId.value } })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} classifier`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.classifiers', params: { projectId: projectId.value } })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to classifiers">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ isEditMode ? 'Edit Classifier' : 'Create Classifier' }}</h1>
          <p class="text-sm text-gray-600">
            {{ isEditMode ? 'Update the classifier configuration' : 'Define a new intent classifier for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Classifier') }}
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
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt Configuration
        </button>
        <button
          @click="activeTab = 'advanced'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'advanced' }]"
          type="button"
        >
          Advanced Settings
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
      Loading classifier...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Classifiers
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
              Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Intent Classifier"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A descriptive name for this classifier</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.id"
              type="text"
              placeholder="custom-classifier-id"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The classifier ID cannot be changed after creation' 
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
              placeholder="A brief description of what this classifier does..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              Optional description to help identify the purpose of this classifier
            </p>
          </div>
        </div>

        <!-- Prompt Configuration Tab -->
        <div v-show="activeTab === 'prompt'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Classification Prompt <span class="required">*</span>
            </label>
            <textarea
              v-model="form.prompt"
              required
              rows="20"
              class="form-textarea"
              placeholder="Classify the user's intent based on their message..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              The prompt that defines how the classifier should categorize user inputs. Include instructions on what intents to identify and how to classify them.
            </p>
          </div>
        </div>

        <!-- Advanced Settings Tab -->
        <div v-show="activeTab === 'advanced'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              LLM Provider ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.llmProviderId"
              type="text"
              class="form-input-mono"
              placeholder="llm-provider-id"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              Optional LLM provider identifier for this classifier. Leave empty to use the default provider.
            </p>
          </div>
        </div>

        <!-- Metadata Tab -->
        <div v-if="isEditMode && currentClassifier" v-show="activeTab === 'metadata'" class="tab-content">
          <div class="metadata-container">
            <div class="metadata-item">
              <span class="metadata-label">Classifier ID</span>
              <span class="metadata-value">{{ currentClassifier.id }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Project ID</span>
              <span class="metadata-value">{{ currentClassifier.projectId }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Version</span>
              <span class="metadata-value">{{ currentClassifier.version }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Created</span>
              <span class="metadata-value">{{ formatDate(currentClassifier.createdAt) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Updated</span>
              <span class="metadata-value">{{ formatDate(currentClassifier.updatedAt) }}</span>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
