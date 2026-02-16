<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MetadataTab from './MetadataTab.vue'
import type { ToolResponse } from '@/api/generated/data-contracts'

interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]'
  description: string
  required: boolean
}

interface ActionFormData {
  name: string
  condition: string
  triggerOnUserInput: boolean
  triggerOnClientCommand: boolean
  classificationTrigger: string
  overrideClassifierId: string
  examples: string
}

interface ActionOperations {
  generateResponse: { enabled: boolean }
  endConversation: { enabled: boolean; reason: string }
  abortConversation: { enabled: boolean; reason: string }
  goToStage: { enabled: boolean; stageId: string }
  runScript: { enabled: boolean; code: string }
  modifyUserInput: { enabled: boolean; template: string }
  modifyVariables: {
    enabled: boolean
    modifications: Array<{ variableName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  modifyUserProfile: {
    enabled: boolean
    modifications: Array<{ fieldName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  callTool: { enabled: boolean; toolId: string; parameters: Record<string, any> }
  callWebhook: {
    enabled: boolean
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    headers: string
    body: string
    resultKey: string
  }
}

const props = withDefaults(
  defineProps<{
    modelValue: ActionFormData
    operations: ActionOperations
    parameters?: ActionParameter[]
    activeTab: string
    availableClassifiers?: Array<{ id: string; name: string }>
    availableStages?: Array<{ id: string; name: string }>
    availableTools?: ToolResponse[]
    showParameters?: boolean
    showTrigger?: boolean
    showKeyField?: boolean
    actionKey?: string
    isKeyDisabled?: boolean
    showTabs?: boolean
    showMetadata?: boolean
    metadataFields?: Array<{ label: string; value: any; format?: 'mono' | 'date' | 'default' }>
  }>(),
  {
    parameters: () => [],
    availableClassifiers: () => [],
    availableStages: () => [],
    availableTools: () => [],
    showParameters: false,
    showTrigger: true,
    showKeyField: false,
    actionKey: '',
    isKeyDisabled: false,
    showTabs: true,
    showMetadata: false,
    metadataFields: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: ActionFormData]
  'update:operations': [value: ActionOperations]
  'update:parameters': [value: ActionParameter[]]
  'update:activeTab': [value: string]
  'update:actionKey': [value: string]
}>()

const localForm = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const localOperations = computed({
  get: () => props.operations,
  set: (val) => emit('update:operations', val)
})

const localParameters = computed({
  get: () => props.parameters,
  set: (val) => emit('update:parameters', val)
})

const localActiveTab = computed({
  get: () => props.activeTab,
  set: (val) => emit('update:activeTab', val)
})

const localKey = computed({
  get: () => props.actionKey,
  set: (val) => emit('update:actionKey', val)
})

function addParameter() {
  const newParams = [...localParameters.value, { name: '', type: 'string' as const, description: '', required: false }]
  emit('update:parameters', newParams)
}

function removeParameter(index: number) {
  const newParams = [...localParameters.value]
  newParams.splice(index, 1)
  emit('update:parameters', newParams)
}

function addVariableModification() {
  const newOps = { ...localOperations.value }
  newOps.modifyVariables.modifications.push({ variableName: '', operation: 'set', value: '' })
  emit('update:operations', newOps)
}

function removeVariableModification(index: number) {
  const newOps = { ...localOperations.value }
  newOps.modifyVariables.modifications.splice(index, 1)
  emit('update:operations', newOps)
}

function addProfileModification() {
  const newOps = { ...localOperations.value }
  newOps.modifyUserProfile.modifications.push({ fieldName: '', operation: 'set', value: '' })
  emit('update:operations', newOps)
}

function removeProfileModification(index: number) {
  const newOps = { ...localOperations.value }
  newOps.modifyUserProfile.modifications.splice(index, 1)
  emit('update:operations', newOps)
}

// Tool parameter helpers
const selectedTool = computed(() => {
  if (!localOperations.value.callTool.toolId) return null
  return props.availableTools.find(tool => tool.id === localOperations.value.callTool.toolId) || null
})

const toolParameters = ref<Record<string, any>>({})

// Initialize tool parameters when tool changes or when loading existing data
watch(() => [localOperations.value.callTool.toolId, props.availableTools.length] as const, ([newToolId]) => {
  if (!newToolId) {
    toolParameters.value = {}
    return
  }
  
  const tool = props.availableTools.find(t => t.id === newToolId)
  if (!tool) return
  
  // Check if we already have parameters from loaded data
  const existingParams = localOperations.value.callTool.parameters
  const hasExistingParams = existingParams && Object.keys(existingParams).length > 0
  
  // Initialize parameters for new tool or load existing ones
  const newParams: Record<string, any> = {}
  for (const param of tool.parameters) {
    // Use existing parameter value if available, otherwise initialize with default
    if (hasExistingParams && param.name in existingParams) {
      const existingValue = existingParams[param.name]
      
      // For object types, ensure they're represented as JSON strings in the UI
      if (param.type === 'object') {
        if (typeof existingValue === 'object' && existingValue !== null) {
          // Convert object to formatted JSON string for textarea
          newParams[param.name] = JSON.stringify(existingValue, null, 2)
        } else if (typeof existingValue === 'string') {
          // Already a string, keep it (but validate it's valid JSON)
          try {
            // Parse and re-stringify to ensure it's valid and formatted
            const parsed = JSON.parse(existingValue)
            newParams[param.name] = JSON.stringify(parsed, null, 2)
          } catch {
            // If invalid JSON, treat as empty object
            newParams[param.name] = '{}'
          }
        } else {
          // Other types, convert to empty object
          newParams[param.name] = '{}'
        }
      } else if (param.type === 'object[]' && Array.isArray(existingValue)) {
        // For object arrays, stringify each item
        newParams[param.name] = existingValue.map((item: any) => 
          typeof item === 'object' && item !== null ? JSON.stringify(item, null, 2) : item
        )
      } else {
        // For other types, use as is
        newParams[param.name] = existingValue
      }
    } else {
      // Initialize with default value
      if (param.type === 'boolean') {
        newParams[param.name] = false
      } else if (param.type === 'object') {
        newParams[param.name] = '{}'
      } else if (param.type.endsWith('[]')) {
        newParams[param.name] = []
      } else {
        newParams[param.name] = ''
      }
    }
  }
  toolParameters.value = newParams
}, { immediate: true })

// Watch toolParameters and sync to operations
watch(toolParameters, (newParams) => {
  const newOps = { ...localOperations.value }
  newOps.callTool.parameters = { ...newParams }
  emit('update:operations', newOps)
}, { deep: true })

function getArrayValue(paramName: string): any[] {
  if (!Array.isArray(toolParameters.value[paramName])) {
    toolParameters.value[paramName] = []
  }
  return toolParameters.value[paramName]
}

function addArrayItem(paramName: string, paramType: string) {
  if (!Array.isArray(toolParameters.value[paramName])) {
    toolParameters.value[paramName] = []
  }
  
  if (paramType === 'string[]') {
    toolParameters.value[paramName].push('')
  } else if (paramType === 'number[]') {
    toolParameters.value[paramName].push(0)
  } else if (paramType === 'boolean[]') {
    toolParameters.value[paramName].push(false)
  } else if (paramType === 'object[]') {
    toolParameters.value[paramName].push('{}')
  }
}

function removeArrayItem(paramName: string, index: number) {
  if (Array.isArray(toolParameters.value[paramName])) {
    toolParameters.value[paramName].splice(index, 1)
  }
}
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <div v-if="showTabs" class="border-b border-gray-200 mb-6 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8 overflow-x-auto">
        <button
          type="button"
          @click="localActiveTab = 'basic'"
          :class="[
            localActiveTab === 'basic'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Basic
        </button>
        <button
          v-if="showTrigger"
          type="button"
          @click="localActiveTab = 'trigger'"
          :class="[
            localActiveTab === 'trigger'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Trigger
        </button>
        <button
          v-if="showParameters"
          type="button"
          @click="localActiveTab = 'parameters'"
          :class="[
            localActiveTab === 'parameters'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Parameters
        </button>
        <button
          type="button"
          @click="localActiveTab = 'effects'"
          :class="[
            localActiveTab === 'effects'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Effects
        </button>
        <button
          v-if="localOperations.goToStage.enabled"
          type="button"
          @click="localActiveTab = 'goToStage'"
          :class="[
            localActiveTab === 'goToStage'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Go To Stage
        </button>
        <button
          v-if="localOperations.runScript.enabled"
          type="button"
          @click="localActiveTab = 'runScript'"
          :class="[
            localActiveTab === 'runScript'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Run Script
        </button>
        <button
          v-if="localOperations.modifyUserInput.enabled"
          type="button"
          @click="localActiveTab = 'modifyUserInput'"
          :class="[
            localActiveTab === 'modifyUserInput'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Modify User Input
        </button>
        <button
          v-if="localOperations.modifyVariables.enabled"
          type="button"
          @click="localActiveTab = 'modifyVariables'"
          :class="[
            localActiveTab === 'modifyVariables'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Modify Variables
        </button>
        <button
          v-if="localOperations.modifyUserProfile.enabled"
          type="button"
          @click="localActiveTab = 'modifyUserProfile'"
          :class="[
            localActiveTab === 'modifyUserProfile'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Modify User Profile
        </button>
        <button
          v-if="localOperations.callTool.enabled"
          type="button"
          @click="localActiveTab = 'callTool'"
          :class="[
            localActiveTab === 'callTool'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Call Tool
        </button>
        <button
          v-if="localOperations.callWebhook.enabled"
          type="button"
          @click="localActiveTab = 'callWebhook'"
          :class="[
            localActiveTab === 'callWebhook'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Call Webhook
        </button>
        <button
          v-if="showMetadata"
          type="button"
          @click="localActiveTab = 'metadata'"
          :class="[
            localActiveTab === 'metadata'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Metadata
        </button>
      </nav>
    </div>

    <div class="space-y-6">
    <!-- Basic Tab -->
    <div v-show="localActiveTab === 'basic'" class="space-y-6">
      <div v-if="showKeyField" class="form-group">
        <label class="form-label">
          Action Key <span class="required">*</span>
        </label>
        <input
          v-model="localKey"
          type="text"
          required
          placeholder="transfer_to_agent"
          :class="isKeyDisabled ? 'form-input-disabled font-mono' : 'form-input font-mono'"
          :disabled="isKeyDisabled"
        />
        <p class="form-help-text">
          Unique identifier for this action{{ isKeyDisabled ? ' (cannot be changed)' : '' }}
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Display Name <span class="required">*</span>
        </label>
        <input
          v-model="localForm.name"
          type="text"
          required
          placeholder="Transfer to Human Agent"
          class="form-input"
        />
        <p class="form-help-text">
          Human-readable name for this action
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Examples <span class="text-gray-500">(optional, one per line)</span>
        </label>
        <textarea
          v-model="localForm.examples"
          rows="4"
          class="form-textarea"
          placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
        ></textarea>
        <p class="form-help-text">
          Example phrases that should trigger this action
        </p>
      </div>
    </div>

    <!-- Trigger Tab -->
    <div v-show="localActiveTab === 'trigger'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Trigger Options <span class="required">*</span></label>
        <div class="space-y-2">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="localForm.triggerOnUserInput"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
              Trigger on User Input
            </span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="localForm.triggerOnClientCommand"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
              Trigger on Client Command
            </span>
          </label>
        </div>
        <p class="form-help-text">
          Select when this action can be triggered
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Classification Trigger <span class="text-gray-500">(optional)</span>
        </label>
        <input
          v-model="localForm.classificationTrigger"
          type="text"
          placeholder="transfer_request"
          class="form-input"
        />
        <p class="form-help-text">
          Classification label that triggers this action
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Override Classifier ID <span class="text-gray-500">(optional)</span>
        </label>
        <select
          v-model="localForm.overrideClassifierId"
          class="form-select-auto"
        >
          <option value="">No override (use stage default classifier)</option>
          <option v-for="classifier in availableClassifiers" :key="classifier.id" :value="classifier.id">
            {{ classifier.name }}
          </option>
        </select>
        <p class="form-help-text">
          Override the stage's default classifier for this specific action
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Condition <span class="text-gray-500">(optional)</span>
        </label>
        <input
          v-model="localForm.condition"
          type="text"
          placeholder="context.variables.agent_available === true"
          class="form-input font-mono text-sm"
        />
        <p class="form-help-text">
          Optional JavaScript condition expression for action activation
        </p>
      </div>
    </div>

    <!-- Parameters Tab -->
    <div v-if="showParameters" v-show="localActiveTab === 'parameters'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Action Parameters</label>
        <p class="form-help-text mb-3">
          Define parameters that will be extracted from user input when this action is triggered.
        </p>
        <div class="space-y-4">
          <div
            v-for="(param, index) in localParameters"
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
                  placeholder="destination_stage"
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
                </select>
              </div>
            </div>

            <div>
              <label class="form-label text-sm">Description <span class="required">*</span></label>
              <input
                v-model="param.description"
                type="text"
                required
                placeholder="The stage to transfer to"
                class="form-input text-sm"
              />
              <p class="text-xs text-gray-500 mt-1">
                Describe what this parameter represents to help with extraction
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
                Whether this parameter must be extracted from user input
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="addParameter"
            class="btn-secondary w-full"
          >
            + Add Parameter
          </button>
        </div>
      </div>
    </div>

    <!-- Effects Tab -->
    <div v-show="localActiveTab === 'effects'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Select Effects</label>
        <p class="form-help-text mb-3">
          Choose which effects this action should perform. Complex effects will add dedicated tabs for configuration.
        </p>
        <div class="space-y-3">
          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.generateResponse.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Generate Response</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Generate an AI response for this action</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.endConversation.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">End Conversation</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Gracefully end the conversation</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.abortConversation.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Abort Conversation</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Immediately terminate the conversation</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.goToStage.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Go To Stage</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Navigate to a different stage (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.runScript.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Run Script</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Execute custom JavaScript code (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.modifyUserInput.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Modify User Input</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Transform the user's input before processing (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.modifyVariables.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Modify Variables</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Set, update, or remove conversation variables (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.modifyUserProfile.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Modify User Profile</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Update user profile fields (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.callTool.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Call Tool</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Invoke a registered tool (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="localOperations.callWebhook.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Call Webhook</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Make an HTTP request to an external endpoint (adds tab for configuration)</p>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Go To Stage Tab -->
    <div v-show="localActiveTab === 'goToStage'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          Target Stage <span class="required">*</span>
        </label>
        <select
          v-model="localOperations.goToStage.stageId"
          :required="localOperations.goToStage.enabled"
          class="form-select-auto"
        >
          <option value="">Select a stage...</option>
          <option v-for="stage in availableStages" :key="stage.id" :value="stage.id">
            {{ stage.name }}
          </option>
        </select>
        <p class="form-help-text">
          The stage to navigate to when this action is triggered
        </p>
      </div>
    </div>

    <!-- Run Script Tab -->
    <div v-show="localActiveTab === 'runScript'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          JavaScript Code <span class="required">*</span>
        </label>
        <textarea
          v-model="localOperations.runScript.code"
          rows="10"
          :required="localOperations.runScript.enabled"
          class="form-textarea font-mono text-sm"
          placeholder="// Available: context, user, conversation&#10;const result = context.variables.count + 1;&#10;return { count: result };"
        ></textarea>
        <p class="form-help-text">
          JavaScript code to execute. Available objects: context, user, conversation
        </p>
      </div>
    </div>

    <!-- Modify User Input Tab -->
    <div v-show="localActiveTab === 'modifyUserInput'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          Template <span class="required">*</span>
        </label>
        <textarea
          v-model="localOperations.modifyUserInput.template"
          rows="4"
          :required="localOperations.modifyUserInput.enabled"
          class="form-textarea"
          placeholder="User wants to {{user.input}}"
        ></textarea>
        <p class="form-help-text">
          Template to transform the user input. Use <code>&#123;&#123;user.input&#125;&#125;</code> to reference original input
        </p>
      </div>
    </div>

    <!-- Modify Variables Tab -->
    <div v-show="localActiveTab === 'modifyVariables'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Variable Modifications</label>
        <div class="space-y-4">
          <div
            v-for="(mod, index) in localOperations.modifyVariables.modifications"
            :key="index"
            class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white dark:bg-gray-900 dark:border-gray-700"
          >
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Modification {{ index + 1 }}</span>
              <button
                type="button"
                @click="removeVariableModification(index)"
                class="text-red-600 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
            
            <div>
              <label class="form-label text-sm">Variable Name</label>
              <input
                v-model="mod.variableName"
                type="text"
                placeholder="cart_total"
                class="form-input font-mono text-sm"
              />
            </div>

            <div>
              <label class="form-label text-sm">Operation</label>
              <select v-model="mod.operation" class="form-select-auto text-sm">
                <option value="set">Set</option>
                <option value="reset">Reset</option>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </select>
            </div>

            <div v-if="mod.operation !== 'reset'">
              <label class="form-label text-sm">Value</label>
              <input
                v-model="mod.value"
                type="text"
                placeholder="42"
                class="form-input text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            @click="addVariableModification"
            class="btn-secondary w-full"
          >
            + Add Modification
          </button>
        </div>
      </div>
    </div>

    <!-- Modify User Profile Tab -->
    <div v-show="localActiveTab === 'modifyUserProfile'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Profile Modifications</label>
        <div class="space-y-4">
          <div
            v-for="(mod, index) in localOperations.modifyUserProfile.modifications"
            :key="index"
            class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white dark:bg-gray-900 dark:border-gray-700"
          >
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Modification {{ index + 1 }}</span>
              <button
                type="button"
                @click="removeProfileModification(index)"
                class="text-red-600 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
            
            <div>
              <label class="form-label text-sm">Field Name</label>
              <input
                v-model="mod.fieldName"
                type="text"
                placeholder="email"
                class="form-input font-mono text-sm"
              />
            </div>

            <div>
              <label class="form-label text-sm">Operation</label>
              <select v-model="mod.operation" class="form-select-auto text-sm">
                <option value="set">Set</option>
                <option value="reset">Reset</option>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </select>
            </div>

            <div v-if="mod.operation !== 'reset'">
              <label class="form-label text-sm">Value</label>
              <input
                v-model="mod.value"
                type="text"
                placeholder="user@example.com"
                class="form-input text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            @click="addProfileModification"
            class="btn-secondary w-full"
          >
            + Add Modification
          </button>
        </div>
      </div>
    </div>

    <!-- Call Tool Tab -->
    <div v-show="localActiveTab === 'callTool'" class="space-y-6">
      <!-- Tool Dropdown -->
      <div class="form-group">
        <label class="form-label">Tool <span class="required">*</span></label>
        <select 
          v-model="localOperations.callTool.toolId" 
          class="form-select-auto"
          :required="localOperations.callTool.enabled"
        >
          <option :value="''">Select a tool...</option>
          <option v-for="tool in availableTools" :key="tool.id" :value="tool.id">
            {{ tool.name }}
          </option>
        </select>
        <p v-if="selectedTool?.description" class="text-sm text-gray-600 mt-2 dark:text-gray-400">
          {{ selectedTool.description }}
        </p>
      </div>

      <!-- Parameters Section -->
      <div v-if="selectedTool && selectedTool.parameters.length > 0" class="space-y-4">
        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">Tool Parameters</h3>
          
          <div 
            v-for="param in selectedTool.parameters" 
            :key="param.name"
            class="form-group"
          >
            <label class="form-label text-sm">
              {{ param.name }}
              <span v-if="param.required" class="required">*</span>
              <span v-else class="text-gray-500 text-xs ml-1">(optional)</span>
            </label>
            
            <!-- String input -->
            <input 
              v-if="param.type === 'string'"
              v-model="toolParameters[param.name]"
              type="text"
              :required="param.required"
              :placeholder="param.description"
              class="form-input text-sm"
            />
            
            <!-- Number input -->
            <input 
              v-else-if="param.type === 'number'"
              v-model.number="toolParameters[param.name]"
              type="number"
              :required="param.required"
              :placeholder="param.description"
              class="form-input text-sm"
            />
            
            <!-- Boolean checkbox -->
            <label v-else-if="param.type === 'boolean'" class="flex items-center cursor-pointer">
              <input
                v-model="toolParameters[param.name]"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ param.description }}
              </span>
            </label>
            
            <!-- Object input (JSON) -->
            <div v-else-if="param.type === 'object'" class="space-y-1">
              <textarea
                v-model="toolParameters[param.name]"
                :required="param.required"
                :placeholder="param.description + ' (JSON format)'"
                class="form-textarea text-sm font-mono"
                rows="4"
              />
              <p class="text-xs text-gray-500">Enter a valid JSON object or use Handlebars syntax (e.g., <code>&#123;&#123;variable&#125;&#125;</code>)</p>
            </div>
            
            <!-- Array inputs (string[], number[], boolean[], object[]) -->
            <div v-else-if="param.type.endsWith('[]')" class="space-y-2">
              <div 
                v-for="(_item, index) in getArrayValue(param.name)" 
                :key="index"
                class="flex gap-2"
              >
                <input 
                  v-if="param.type === 'string[]'"
                  v-model="toolParameters[param.name][index]"
                  type="text"
                  :placeholder="`${param.description} (item ${index + 1})`"
                  class="form-input text-sm flex-1"
                />
                <input 
                  v-else-if="param.type === 'number[]'"
                  v-model.number="toolParameters[param.name][index]"
                  type="number"
                  :placeholder="`${param.description} (item ${index + 1})`"
                  class="form-input text-sm flex-1"
                />
                <label v-else-if="param.type === 'boolean[]'" class="flex items-center cursor-pointer flex-1">
                  <input
                    v-model="toolParameters[param.name][index]"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Item {{ index + 1 }}
                  </span>
                </label>
                <textarea
                  v-else-if="param.type === 'object[]'"
                  v-model="toolParameters[param.name][index]"
                  :placeholder="`${param.description} (item ${index + 1}, JSON format)`"
                  class="form-textarea text-sm font-mono flex-1"
                  rows="3"
                />
                <button 
                  type="button"
                  @click="removeArrayItem(param.name, index)"
                  class="btn-secondary px-3"
                >
                  Remove
                </button>
              </div>
              <button 
                type="button"
                @click="addArrayItem(param.name, param.type)"
                class="btn-secondary text-sm w-full"
              >
                + Add Item
              </button>
            </div>

            <p class="text-xs text-gray-500 mt-1">
              {{ param.description }} ({{ param.type }})
            </p>
          </div>
        </div>
      </div>

      <!-- No Parameters Message -->
      <div v-else-if="selectedTool && selectedTool.parameters.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
        This tool doesn't require any parameters.
      </div>

      <!-- No Tool Selected Message -->
      <div v-else-if="!selectedTool && availableTools.length > 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
        Select a tool to configure its parameters.
      </div>

      <!-- No Tools Available Message -->
      <div v-else-if="availableTools.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4 border border-gray-200 rounded-lg p-4 dark:border-gray-700">
        <p class="font-medium mb-1">No tools available</p>
        <p class="text-xs">Create tools for this project first before using the Call Tool action.</p>
      </div>
    </div>

    <!-- Call Webhook Tab -->
    <div v-show="localActiveTab === 'callWebhook'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          URL <span class="required">*</span>
        </label>
        <input
          v-model="localOperations.callWebhook.url"
          type="url"
          :required="localOperations.callWebhook.enabled"
          placeholder="https://api.example.com/webhook"
          class="form-input font-mono"
        />
        <p class="form-help-text">
          The webhook endpoint URL
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          HTTP Method <span class="required">*</span>
        </label>
        <select v-model="localOperations.callWebhook.method" class="form-select-auto" :required="localOperations.callWebhook.enabled">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">
          Headers <span class="text-gray-500">(optional, JSON)</span>
        </label>
        <textarea
          v-model="localOperations.callWebhook.headers"
          rows="4"
          class="form-textarea font-mono text-sm"
          placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
        ></textarea>
        <p class="form-help-text">
          JSON object with HTTP headers
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Body <span class="text-gray-500">(optional, JSON)</span>
        </label>
        <textarea
          v-model="localOperations.callWebhook.body"
          rows="6"
          class="form-textarea font-mono text-sm"
          placeholder='{\n  "userId": "{{user.id}}",\n  "message": "{{user.input}}"\n}'
        ></textarea>
        <p class="form-help-text">
          JSON body for the request. Supports template variables.
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Result Key <span class="required">*</span>
        </label>
        <input
          v-model="localOperations.callWebhook.resultKey"
          type="text"
          :required="localOperations.callWebhook.enabled"
          placeholder="webhookResult"
          class="form-input font-mono"
        />
        <p class="form-help-text">
          Variable name to store the webhook response
        </p>
      </div>
    </div>

    <!-- Metadata Tab -->
    <div v-show="localActiveTab === 'metadata'" class="space-y-6">
      <MetadataTab
        v-if="showMetadata && metadataFields.length > 0"
        :fields="metadataFields"
      />
    </div>
    </div>
  </div>
</template>
