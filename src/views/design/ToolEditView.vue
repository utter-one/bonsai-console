<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToolsStore, useProvidersStore } from '@/stores'
import { ArrowLeft, Save, Settings } from 'lucide-vue-next'
import type { ToolResponse, LLMSettings } from '@/types/api'
import MetadataTab from '@/components/MetadataTab.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'

const route = useRoute()
const router = useRouter()
const toolsStore = useToolsStore()
const providersStore = useProvidersStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'basic' | 'prompt' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  llmProviderId: '',
  llmSettings: null as LLMSettings | null,
  inputType: '',
  outputType: '',
  metadata: {}
})

// Computed
const projectId = computed(() => route.params.projectId as string)
const toolId = computed(() => route.params.toolId as string | undefined)
const isEditMode = computed(() => !!toolId.value)
const currentTool = ref<ToolResponse | null>(null)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

// Lifecycle
onMounted(async () => {
  // Load LLM providers
  await providersStore.fetchAll()
  
  if (isEditMode.value) {
    await loadTool()
  }
})

// Methods
async function loadTool() {
  if (!toolId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentTool.value = await toolsStore.fetchById(toolId.value)
    if (currentTool.value) {
      form.value = {
        id: currentTool.value.id,
        name: currentTool.value.name,
        description: currentTool.value.description || '',
        prompt: currentTool.value.prompt,
        llmProviderId: currentTool.value.llmProviderId || '',
        llmSettings: currentTool.value.llmSettings || null,
        inputType: currentTool.value.inputType,
        outputType: currentTool.value.outputType,
        metadata: currentTool.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load tool'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentTool.value) {
      // Update existing tool
      await toolsStore.update(currentTool.value.id, {
        version: currentTool.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings || undefined,
        inputType: form.value.inputType,
        outputType: form.value.outputType,
        metadata: form.value.metadata
      })
    } else {
      // Create new tool
      const createData: any = {
        projectId: projectId.value,
        name: form.value.name,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings,
        inputType: form.value.inputType,
        outputType: form.value.outputType,
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

      await toolsStore.create(createData)
    }

    // Navigate back to tools list
    router.push({ name: 'design.tools', params: { projectId: projectId.value } })
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} tool`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.tools', params: { projectId: projectId.value } })
}

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LLMSettings
  showLLMSettingsModal.value = false
}

const metadataFields = computed(() => {
  if (!currentTool.value) return []
  return [
    { label: 'Tool ID', value: currentTool.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentTool.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentTool.value.version },
    { label: 'Created', value: currentTool.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentTool.value.updatedAt, format: 'date' as const },
  ]
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4 flex-1">
        <button @click="goBack" class="btn-icon" title="Back to tools">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ isEditMode ? 'Edit Tool' : 'Create Tool' }}</h1>
          <p class="text-sm text-gray-600">
            {{ isEditMode ? 'Update the tool configuration' : 'Define a new AI tool for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading">
          <Save class="inline-block mr-2 w-4 h-4" />
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Tool') }}
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
      Loading tool...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Tools
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
                Tool ID <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.id"
                type="text"
                placeholder="my_custom_tool"
                class="form-input-mono"
                :disabled="isLoading || isEditMode"
                :class="{ 'form-input-disabled': isEditMode }"
              />
              <p class="form-help-text">
                Custom identifier for the tool. Leave empty to auto-generate.
                {{ isEditMode ? 'Cannot be changed after creation.' : '' }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Data Analyzer"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Human-readable name for this tool
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
                placeholder="Brief description of what this tool does..."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Optional description of the tool's purpose and functionality
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Input Type <span class="required">*</span>
              </label>
              <input
                v-model="form.inputType"
                type="text"
                required
                placeholder="string"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                The expected data type for tool input (e.g., string, json, object)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Output Type <span class="required">*</span>
              </label>
              <input
                v-model="form.outputType"
                type="text"
                required
                placeholder="string"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                The expected data type for tool output (e.g., string, json, object)
              </p>
            </div>
          </div>

          <!-- Prompt Configuration Tab -->
          <div v-show="activeTab === 'prompt'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                LLM Provider <span class="required">*</span>
              </label>
              <div class="flex gap-2">
                <select
                  v-model="form.llmProviderId"
                  required
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">Select an LLM provider</option>
                  <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="showLLMSettingsModal = true"
                  class="btn-secondary whitespace-nowrap"
                  :disabled="isLoading"
                >
                  <Settings class="inline-block mr-1 w-4 h-4" />
                  Settings...
                </button>
              </div>
              <p class="form-help-text">
                The LLM provider to use for this tool
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Tool Prompt <span class="required">*</span>
              </label>
              <textarea
                v-model="form.prompt"
                required
                rows="20"
                class="form-textarea"
                placeholder="You are a tool that analyzes data and provides insights..."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                The system prompt or instructions for this tool's operation
              </p>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentTool"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
        </form>
      </div>
    </div>

    <!-- LLM Settings Modal -->
    <LLMSettingsModal
      v-if="showLLMSettingsModal"
      :settings="form.llmSettings"
      :selected-provider-id="form.llmProviderId"
      :providers="llmProviders"
      @close="showLLMSettingsModal = false"
      @save="handleLLMSettingsSave"
    />
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
