<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToolsStore, useProvidersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Check, Sparkles, Globe, Code2 } from 'lucide-vue-next'
import type { ToolResponse, LlmSettings, ToolParameter, ParsedError, ApiErrorDetail } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'
import SmartFunctionConfig from '@/components/tools/SmartFunctionConfig.vue'
import WebhookConfig from '@/components/tools/WebhookConfig.vue'
import ScriptConfig from '@/components/tools/ScriptConfig.vue'

const route = useRoute()
const router = useRouter()
const toolsStore = useToolsStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'config' | 'parameters' | 'metadata' | 'history'>('basic')
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
const { switchToFirstErrorTab } = useTabNavigation(activeTab)
const resolvedType = computed(() => currentTool.value?.type ?? form.value.type)

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
    loadError.value = parseApiError(err).message
  } finally {
    isLoading.value = false
  }
}

function validate(): ParsedError | null {
  const details: ApiErrorDetail[] = []

  if (!form.value.name.trim()) {
    details.push({ path: ['name'], code: 'required', message: 'Name is required' })
  }

  const type = isEditMode.value ? currentTool.value?.type : form.value.type
  if (type === 'smart_function') {
    if (!form.value.inputType) {
      details.push({ path: ['inputType'], code: 'required', message: 'Input type is required' })
    }
    if (!form.value.outputType) {
      details.push({ path: ['outputType'], code: 'required', message: 'Output type is required' })
    }
    if (!form.value.llmProviderId) {
      details.push({ path: ['llmProviderId'], code: 'required', message: 'LLM provider is required' })
    }
    else if (!form.value.llmSettings) {
      details.push({ path: ['llmSettings'], code: 'required', message: 'LLM settings are required' })
    }
    if (!form.value.prompt.trim()) {
      details.push({ path: ['prompt'], code: 'required', message: 'Tool prompt is required' })
    }
  } else if (type === 'webhook') {
    if (!form.value.url.trim()) {
      details.push({ path: ['url'], code: 'required', message: 'Webhook URL is required' })
    }
  } else if (type === 'script') {
    if (!form.value.code.trim()) {
      details.push({ path: ['code'], code: 'required', message: 'Script code is required' })
    }
  }

  for (let i = 0; i < form.value.parameters.length; i++) {
    const p = form.value.parameters[i]!
    if (!p.name.trim()) {
      details.push({ path: ['parameters', i, 'name'], code: 'required', message: `Parameter ${i + 1}: name is required` })
    }
    if (!p.description.trim()) {
      details.push({ path: ['parameters', i, 'description'], code: 'required', message: `Parameter ${i + 1}: description is required` })
    }
    if (!p.type) {
      details.push({ path: ['parameters', i, 'type'], code: 'required', message: `Parameter ${i + 1}: type is required` })
    }
  }

  return details.length > 0 ? { message: 'Please fill in all required fields', details } : null
}

async function handleSubmit() {
  error.value = null

  const validationError = validate()
  if (validationError) {
    error.value = validationError
    switchToFirstErrorTab(validationError)
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentTool.value) {
      // Update existing tool
      const updateData: any = {
        version: currentTool.value.version,
        name: form.value.name,
        type: form.value.type,
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
          inputType: form.value.inputType,
          outputType: form.value.outputType
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
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.tools', params: { projectId: projectId.value } })
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
    <div v-else-if="loadError && isEditMode" class="error-state">
      {{ loadError }}
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
          <ErrorDisplay :error="error" class="mx-8 mt-4" />

          <!-- General Tab -->
          <TabContent v-model="activeTab" tab="basic">
            <!-- Type Selector (create) / Type Badge (edit) -->
            <FormField label="Tool Type" :required="!isEditMode" class="w-full" :help="!isEditMode ? 'Select how this tool processes requests' : undefined">
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
            </FormField>

            <FormField label="Tool ID" :error="error" path="id" class="w-full" hint="optional" :help="isEditMode ? 'Cannot be changed after creation.' : 'Custom identifier for the tool. Leave empty to auto-generate.'">
              <input
                v-model="form.id"
                type="text"
                placeholder="my_custom_tool"
                class="form-input-mono"
                :disabled="isLoading || isEditMode"
                :class="{ 'form-input-disabled': isEditMode }"
              />
            </FormField>

            <FormField label="Name" required :error="error" path="name" class="w-full" help="Human-readable name for this tool">
              <input
                v-model="form.name"
                type="text"
                placeholder="Data Analyzer"
                class="form-input"
                :disabled="isLoading"
              />
            </FormField>

            <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description of the tool's purpose and functionality">
              <textarea
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of what this tool does..."
                :disabled="isLoading"
              ></textarea>
            </FormField>

            <TagsEditor v-model="form.tags" :disabled="isLoading" />
          </TabContent>

          <!-- Config Tab (Prompt / Webhook / Script) -->
          <TabContent v-model="activeTab" tab="config">
            <SmartFunctionConfig
              v-if="resolvedType === 'smart_function'"
              v-model:prompt="form.prompt"
              v-model:llm-provider-id="form.llmProviderId"
              v-model:llm-settings="form.llmSettings"
              v-model:input-type="form.inputType"
              v-model:output-type="form.outputType"
              :llm-providers="llmProviders"
              :is-loading="isLoading"
              :error="error"
            />
            <WebhookConfig
              v-else-if="resolvedType === 'webhook'"
              v-model:url="form.url"
              v-model:method="form.webhookMethod"
              v-model:headers="form.webhookHeaderPairs"
              v-model:body="form.webhookBody"
              :is-loading="isLoading"
              :error="error"
            />
            <ScriptConfig
              v-else-if="resolvedType === 'script'"
              v-model="form.code"
              :is-loading="isLoading"
              :is-read-only="isReadOnly"
              :error="error"
            />
          </TabContent>

          <!-- Parameters Tab -->
          <TabContent v-model="activeTab" tab="parameters">
            <FormField label="Tool Parameters" class="w-full">
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
                    <FormField label="Parameter Name" required :error="error" :path="['parameters', index, 'name']">
                      <input
                        v-model="param.name"
                        type="text"
                        placeholder="input_data"
                        class="form-input font-mono text-sm"
                      />
                    </FormField>

                    <FormField label="Type" required :error="error" :path="['parameters', index, 'type']">
                      <select v-model="param.type" class="form-select-auto text-sm">
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
                    </FormField>
                  </div>

                  <FormField label="Description" required :error="error" :path="['parameters', index, 'description']" class="w-full" help="Describe what this parameter represents for documentation">
                    <input
                      v-model="param.description"
                      type="text"
                      placeholder="The data to process"
                      class="form-input text-sm"
                    />
                  </FormField>

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
            </FormField>
          </TabContent>
          <MetadataTab
            v-if="isEditMode && currentTool"
            v-model="activeTab"
            tab="metadata"
            :fields="metadataFields"
          />
          <!-- History Tab -->
          <TabContent v-model="activeTab" tab="history">
            <EntityHistoryView
              v-if="isEditMode && currentTool"
              :load-history="() => toolsStore.fetchAuditLogs(projectId, currentTool!.id)"
              :current-version="currentTool.version"
              :current-object="currentTool"
              :active="activeTab === 'history'"
              :update-fn="(data) => toolsStore.update(projectId, currentTool!.id, data)"
              :create-fn="(data) => toolsStore.create(projectId, data)"
              :ignore-fields="['createdAt', 'archived', 'updatedAt', 'version']"
              @recover-success="() => router.go(0)"
            />
          </TabContent>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
