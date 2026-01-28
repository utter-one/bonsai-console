<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonasStore } from '@/stores'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { PersonaResponse } from '@/types/api'

const route = useRoute()
const router = useRouter()
const personasStore = usePersonasStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const form = ref({
  id: '',
  name: '',
  prompt: '',
  voiceProviderId: '',
  metadata: {}
})

// Computed
const projectId = computed(() => route.params.projectId as string)
const personaId = computed(() => route.params.personaId as string | undefined)
const isEditMode = computed(() => !!personaId.value)
const currentPersona = ref<PersonaResponse | null>(null)

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    await loadPersona()
  }
})

// Methods
async function loadPersona() {
  if (!personaId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentPersona.value = await personasStore.fetchById(personaId.value)
    if (currentPersona.value) {
      form.value = {
        id: currentPersona.value.id,
        name: currentPersona.value.name,
        prompt: currentPersona.value.prompt,
        voiceProviderId: currentPersona.value.voiceConfig?.voiceProviderId || '',
        metadata: currentPersona.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load persona'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentPersona.value) {
      // Update existing persona
      await personasStore.update(currentPersona.value.id, {
        version: currentPersona.value.version,
        name: form.value.name,
        prompt: form.value.prompt,
        metadata: form.value.metadata
      })
    } else {
      // Create new persona
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

      // Only include voiceProviderId if it's not empty
      if (form.value.voiceProviderId) {
        createData.voiceProviderId = form.value.voiceProviderId
      }

      await personasStore.create(createData)
    }

    // Navigate back to personas list
    router.push({ name: 'design.personas', params: { projectId: projectId.value } })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} persona`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.personas', params: { projectId: projectId.value } })
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
        <button @click="goBack" class="btn-icon" title="Back to personas">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ isEditMode ? 'Edit Persona' : 'Create Persona' }}</h1>
          <p class="text-sm text-gray-600">
            {{ isEditMode ? 'Update the persona configuration' : 'Define a new AI persona for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Persona') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading persona...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Personas
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-gray-50">
      <div class="mx-auto pt-4">
        <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- Error Message -->
        <div v-if="error" class="alert-error">
          {{ error }}
        </div>

        <!-- Basic Information -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
          
          <div class="form-group">
            <label class="form-label">
              Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="My Persona"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">A descriptive name for this persona</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.id"
              type="text"
              placeholder="custom-persona-id"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The persona ID cannot be changed after creation' 
                : 'Leave empty to auto-generate. Use lowercase letters, numbers, and hyphens only.' 
              }}
            </p>
          </div>
        </div>

        <!-- Prompt Configuration -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Prompt Configuration</h3>
          
          <div class="form-group">
            <label class="form-label">
              System Prompt <span class="required">*</span>
            </label>
            <textarea
              v-model="form.prompt"
              required
              rows="12"
              class="form-textarea"
              placeholder="You are a helpful assistant..."
              :disabled="isLoading"
            ></textarea>
            <p class="form-help-text">
              The system prompt that defines this persona's behavior, personality, and capabilities
            </p>
          </div>
        </div>

        <!-- Voice Configuration -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Voice Configuration</h3>
          
          <div class="form-group">
            <label class="form-label">
              Voice Provider ID <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.voiceProviderId"
              type="text"
              class="form-input-mono"
              placeholder="voice-provider-id"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              Optional voice provider identifier for text-to-speech functionality
            </p>
          </div>
        </div>

        <!-- Metadata (if in edit mode) -->
        <div v-if="isEditMode && currentPersona" class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Metadata</h3>
          <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex flex-col">
              <span class="text-sm text-gray-500 mb-1">Version</span>
              <span class="text-sm font-medium text-gray-900">{{ currentPersona.version }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-gray-500 mb-1">Created</span>
              <span class="text-sm font-medium text-gray-900">{{ formatDate(currentPersona.createdAt) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-gray-500 mb-1">Updated</span>
              <span class="text-sm font-medium text-gray-900">{{ formatDate(currentPersona.updatedAt) }}</span>
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
