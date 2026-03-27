<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToolsStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Settings, FileText, Image as ImageIcon, Layers, Check, Sparkles, Globe, Code2 } from 'lucide-vue-next'
import type { ToolResponse, LlmSettings, ToolParameter } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import JavaScriptEditor from '@/components/JavaScriptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'

const route = useRoute()
const router = useRouter()
const toolsStore = useToolsStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'parameters' | 'metadata' | 'history'>('basic')
const showLLMSettingsModal = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  type: 'smart_function' as 'smart_function' | 'webhook' | 'script',
  tags: [] as string[],
  // smart_function fields
  prompt: '',
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  inputType: '' as 'text' | 'image' | 'multi-modal' | '',
  outputType: '' as 'text' | 'image' | 'multi-modal' | '',
  // webhook fields
  url: '',
  webhookMethod: 'POST' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  webhookHeaderPairs: [] as { key: string; value: string }[],
  webhookBody: '',
  // script fields
  code: '',
  // common
  parameters: [] as ToolParameter[],
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const toolId = computed(() => route.params.toolId as string | undefined)
const isEditMode = computed(() => !!toolId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'config', label: configTabLabel.value },
  { key: 'parameters', label: 'Parameters' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentTool = ref<ToolResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentTool)
const isReadOnly = computed(() => projectIsArchived.value || !!currentTool.value?.archived)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const configTabLabel = computed(() => {
  const type = isEditMode.value ? currentTool.value?.type : form.value.type
  if (type === 'webhook') return 'Webhook'
  if (type === 'script') return 'Script'
  return 'Prompt'
})

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
    currentTool.value = await toolsStore.fetchById(projectId.value, toolId.value)
    if (currentTool.value) {
      form.value = {
        id: currentTool.value.id,
        name: currentTool.value.name,
        description: currentTool.value.description || '',
        type: currentTool.value.type,
        tags: currentTool.value.tags || [],
        prompt: currentTool.value.prompt || '',
        llmProviderId: currentTool.value.llmProviderId || '',
        llmSettings: currentTool.value.llmSettings || null,
        inputType: currentTool.value.inputType || '',
        outputType: currentTool.value.outputType || '',
        url: currentTool.value.url || '',
        webhookMethod: (currentTool.value.webhookMethod as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') || 'POST',
        webhookHeaderPairs: recordToHeaderPairs(currentTool.value.webhookHeaders),
        webhookBody: currentTool.value.webhookBody || '',
        code: currentTool.value.code || '',
        parameters: currentTool.value.parameters || [],
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
      const updateData: any = {
        version: currentTool.value.version,
        name: form.value.name,
        description: form.value.description || null,
        tags: form.value.tags,
        parameters: form.value.parameters,
        metadata: form.value.metadata
      }

      if (currentTool.value.type === 'smart_function') {
        updateData.prompt = form.value.prompt
        updateData.llmProviderId = form.value.llmProviderId || null
        updateData.llmSettings = form.value.llmSettings || undefined
        updateData.inputType = form.value.inputType as 'text' | 'image' | 'multi-modal' | undefined
        updateData.outputType = form.value.outputType as 'text' | 'image' | 'multi-modal' | undefined
      } else if (currentTool.value.type === 'webhook') {
        updateData.url = form.value.url
        updateData.webhookMethod = form.value.webhookMethod
        updateData.webhookHeaders = headerPairsToRecord(form.value.webhookHeaderPairs)
        updateData.webhookBody = form.value.webhookBody || null
      } else if (currentTool.value.type === 'script') {
        updateData.code = form.value.code
      }

      const updated = await toolsStore.update(projectId.value, currentTool.value.id, updateData)
      
      // Update currentTool with the response to get the new version
      currentTool.value = updated
    } else {
      // Create new tool — discriminated union on type
      const common: any = {
        name: form.value.name,
        parameters: form.value.parameters,
        metadata: form.value.metadata
      }
      if (form.value.id) common.id = form.value.id
      if (form.value.description) common.description = form.value.description
      if (form.value.tags.length > 0) common.tags = form.value.tags

      let createData: any
      if (form.value.type === 'smart_function') {
        createData = {
          ...common,
          type: 'smart_function',
          prompt: form.value.prompt,
          llmProviderId: form.value.llmProviderId || null,
          llmSettings: form.value.llmSettings || undefined,
          inputType: (form.value.inputType || 'text') as 'text' | 'image' | 'multi-modal',
          outputType: (form.value.outputType || 'text') as 'text' | 'image' | 'multi-modal'
        }
      } else if (form.value.type === 'webhook') {
        createData = {
          ...common,
          type: 'webhook',
          url: form.value.url,
          webhookMethod: form.value.webhookMethod,
          webhookHeaders: headerPairsToRecord(form.value.webhookHeaderPairs),
          webhookBody: form.value.webhookBody || undefined
        }
      } else {
        createData = {
          ...common,
          type: 'script',
          code: form.value.code
        }
      }

      const created = await toolsStore.create(projectId.value, createData)
      
      // Update currentTool with the created tool
      currentTool.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.tools.edit',
        params: { projectId: projectId.value, toolId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
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
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}

function recordToHeaderPairs(record: Record<string, string> | null | undefined): { key: string; value: string }[] {
  if (!record) return []
  return Object.entries(record).map(([key, value]) => ({ key, value }))
}

function headerPairsToRecord(pairs: { key: string; value: string }[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of pairs) {
    if (pair.key.trim()) result[pair.key.trim()] = pair.value
  }
  return result
}

function addHeader() {
  form.value.webhookHeaderPairs.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  form.value.webhookHeaderPairs.splice(index, 1)
}

function addParameter() {
  form.value.parameters.push({
    name: '',
    type: 'string',
    description: '',
    required: false
  })
}

function removeParameter(index: number) {
  form.value.parameters.splice(index, 1)
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
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to tools">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Tool' : 'Create Tool' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the tool configuration' : 'Define a new AI tool for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="!isReadOnly" @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Tool')) }}
        </button>
      </div>
    </div>
    
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This tool is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
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
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Error Message -->
          <div v-if="error" class="alert-error mb-6">
            {{ error }}
          </div>

          <!-- General Tab -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <!-- Type Selector (create) / Type Badge (edit) -->
            <div class="form-group">
              <label class="form-label">Tool Type <span v-if="!isEditMode" class="required">*</span></label>
              <div v-if="!isEditMode" class="flex gap-2">
                <button
                  type="button"
                  @click="form.type = 'smart_function'"
                  :class="[
                    'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                    form.type === 'smart_function'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                  ]"
                  :disabled="isLoading"
                >
                  <Sparkles class="w-5 h-5" />
                  Smart Function
                </button>
                <button
                  type="button"
                  @click="form.type = 'webhook'"
                  :class="[
                    'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                    form.type === 'webhook'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                  ]"
                  :disabled="isLoading"
                >
                  <Globe class="w-5 h-5" />
                  Webhook
                </button>
                <button
                  type="button"
                  @click="form.type = 'script'"
                  :class="[
                    'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                    form.type === 'script'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                  ]"
                  :disabled="isLoading"
                >
                  <Code2 class="w-5 h-5" />
                  Script
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                    currentTool?.type === 'smart_function' ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' :
                    currentTool?.type === 'webhook' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  ]"
                >
                  <Sparkles v-if="currentTool?.type === 'smart_function'" class="w-3.5 h-3.5" />
                  <Globe v-else-if="currentTool?.type === 'webhook'" class="w-3.5 h-3.5" />
                  <Code2 v-else class="w-3.5 h-3.5" />
                  {{ currentTool?.type === 'smart_function' ? 'Smart Function' : currentTool?.type === 'webhook' ? 'Webhook' : 'Script' }}
                </span>
                <span class="text-xs text-gray-500">Type cannot be changed after creation.</span>
              </div>
              <p v-if="!isEditMode" class="form-help-text">Select how this tool processes requests</p>
            </div>

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

            <TagsEditor v-model="form.tags" :disabled="isLoading" />
          </div>

          <!-- Config Tab (Prompt / Webhook / Script) -->
          <div v-show="activeTab === 'config'" class="tab-content">

            <!-- Smart Function: input/output types, LLM provider + prompt -->
            <template v-if="(!isEditMode && form.type === 'smart_function') || (isEditMode && currentTool?.type === 'smart_function')">
              <div class="form-group">
                <label class="form-label">Input Type <span class="required">*</span></label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="form.inputType = 'text'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.inputType === 'text'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <FileText class="w-5 h-5" />
                    Text
                  </button>
                  <button
                    type="button"
                    @click="form.inputType = 'image'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.inputType === 'image'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <ImageIcon class="w-5 h-5" />
                    Image
                  </button>
                  <button
                    type="button"
                    @click="form.inputType = 'multi-modal'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.inputType === 'multi-modal'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <Layers class="w-5 h-5" />
                    Multi-modal
                  </button>
                </div>
                <p class="form-help-text">The expected data type for tool input</p>
              </div>

              <div class="form-group">
                <label class="form-label">Output Type <span class="required">*</span></label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="form.outputType = 'text'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.outputType === 'text'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <FileText class="w-5 h-5" />
                    Text
                  </button>
                  <button
                    type="button"
                    @click="form.outputType = 'image'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.outputType === 'image'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <ImageIcon class="w-5 h-5" />
                    Image
                  </button>
                  <button
                    type="button"
                    @click="form.outputType = 'multi-modal'"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
                      form.outputType === 'multi-modal'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
                    ]"
                    :disabled="isLoading"
                  >
                    <Layers class="w-5 h-5" />
                    Multi-modal
                  </button>
                </div>
                <p class="form-help-text">The expected data type for tool output</p>
              </div>
              <div class="form-group">
                <label class="form-label">
                  LLM Provider <span class="required">*</span>
                </label>
                <div class="flex flex-col md:flex-row gap-2">
                  <select
                    v-model="form.llmProviderId"
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
                  <LLMModelBadge :settings="form.llmSettings" />
                </div>
                <p class="form-help-text">
                  The LLM provider to use for this tool
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Tool Prompt <span class="required">*</span>
                </label>
                <PromptEditor
                  v-model="form.prompt"
                  :disabled="isLoading || isReadOnly"
                  show-toolbar
                  placeholder="You are a tool that analyzes data and provides insights..."
                  aria-label="Tool prompt"
                  min-height="28rem"
                />
                <p class="form-help-text">
                  The system prompt or instructions for this tool's operation
                </p>
              </div>
            </template>

            <!-- Webhook: url, method, headers, body -->
            <template v-else-if="(!isEditMode && form.type === 'webhook') || (isEditMode && currentTool?.type === 'webhook')">
              <div class="form-group">
                <label class="form-label">URL <span class="required">*</span></label>
                <input
                  v-model="form.url"
                  type="url"
                  required
                  placeholder="https://example.com/webhook"
                  class="form-input font-mono"
                  :disabled="isLoading"
                />
                <p class="form-help-text">The endpoint URL to call when this tool is invoked</p>
              </div>

              <div class="form-group">
                <label class="form-label">HTTP Method</label>
                <select v-model="form.webhookMethod" class="form-select-auto" :disabled="isLoading">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Headers <span class="text-gray-500">(optional)</span></label>
                <div class="space-y-2">
                  <div
                    v-for="(header, index) in form.webhookHeaderPairs"
                    :key="index"
                    class="flex gap-2 items-center"
                  >
                    <input
                      v-model="header.key"
                      type="text"
                      placeholder="Header name"
                      class="form-input font-mono flex-1"
                      :disabled="isLoading"
                    />
                    <input
                      v-model="header.value"
                      type="text"
                      placeholder="Value"
                      class="form-input font-mono flex-1"
                      :disabled="isLoading"
                    />
                    <button
                      type="button"
                      @click="removeHeader(index)"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 shrink-0"
                      :disabled="isLoading"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    type="button"
                    @click="addHeader"
                    class="btn-secondary"
                    :disabled="isLoading"
                  >
                    + Add Header
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Request Body Template <span class="text-gray-500">(optional)</span></label>
                <textarea
                  v-model="form.webhookBody"
                  rows="6"
                  class="form-textarea font-mono"
                  placeholder='{{"param": context.params.myParam}}'
                  :disabled="isLoading"
                ></textarea>
                <p class="form-help-text">Template for the request body sent to the webhook endpoint</p>
              </div>
            </template>

            <!-- Script: code editor -->
            <template v-else>
              <div class="form-group">
                <label class="form-label">Script Code <span class="required">*</span></label>
                <JavaScriptEditor
                  v-model="form.code"
                  :disabled="isLoading || isReadOnly"
                  show-toolbar
                  min-height="28rem"
                />
                <p class="form-help-text">JavaScript code to execute when this tool is invoked. Has full flow control (stage navigation, end/abort conversation).</p>
              </div>
            </template>

          </div>

          <!-- Parameters Tab -->
          <div v-show="activeTab === 'parameters'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Tool Parameters</label>
              <p class="form-help-text mb-3">
                Define parameters that this tool expects to receive when invoked. These are used for validation and documentation.
              </p>
              <div class="space-y-4">
                <div
                  v-for="(param, index) in form.parameters"
                  :key="index"
                  class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Parameter {{ index + 1 }}</span>
                    <button
                      type="button"
                      @click="removeParameter(index)"
                      class="text-red-600 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="form-label text-sm">Parameter Name <span class="required">*</span></label>
                      <input
                        v-model="param.name"
                        type="text"
                        required
                        placeholder="input_data"
                        class="form-input font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label class="form-label text-sm">Type <span class="required">*</span></label>
                      <select v-model="param.type" class="form-select-auto text-sm" required>
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="object">object</option>
                        <option value="string[]">string[]</option>
                        <option value="number[]">number[]</option>
                        <option value="boolean[]">boolean[]</option>
                        <option value="object[]">object[]</option>
                        <option value="image">image</option>
                        <option value="image[]">image[]</option>
                        <option value="audio">audio</option>
                        <option value="audio[]">audio[]</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="form-label text-sm">Description <span class="required">*</span></label>
                    <input
                      v-model="param.description"
                      type="text"
                      required
                      placeholder="The data to process"
                      class="form-input text-sm"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Describe what this parameter represents for documentation
                    </p>
                  </div>

                  <div>
                    <label class="flex items-center cursor-pointer">
                      <input
                        v-model="param.required"
                        type="checkbox"
                        class="form-checkbox"
                      />
                      <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                        Required parameter
                      </span>
                    </label>
                    <p class="text-xs text-gray-500 ml-6">
                      Whether this parameter must be provided when calling the tool
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  @click="addParameter"
                  class="btn-secondary"
                  :disabled="isLoading"
                >
                  + Add Parameter
                </button>
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentTool"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
          <div class="tab-content">
            <!-- History Tab -->
            <EntityHistoryView
              v-if="isEditMode && currentTool"
              v-show="activeTab === 'history'"
              :load-history="() => toolsStore.fetchAuditLogs(projectId, currentTool!.id)"
              :current-version="currentTool.version"
              :current-object="currentTool"
              :active="activeTab === 'history'"
              :update-fn="(data) => toolsStore.update(projectId, currentTool!.id, data)"
              :create-fn="(data) => toolsStore.create(projectId, data)"
              :ignore-fields="['createdAt', 'archived', 'updatedAt', 'version']"
              @recover-success="() => router.go(0)"
            />
          </div>
          </fieldset>
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
