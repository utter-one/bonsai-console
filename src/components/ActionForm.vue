<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import MetadataTab from './MetadataTab.vue'
import PromptEditor from './PromptEditor.vue'
import JavaScriptEditor from './JavaScriptEditor.vue'
import {
  bonsaiDefaultGlobalVariables,
  bonsaiDefaultFunctions,
} from './javascript/bonsaiScriptContext'
import type { ToolResponse } from '@/api/generated/data-contracts'

interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  description: string
  required: boolean
}

interface WatchedVariable {
  path: string
  changeType: 'new' | 'changed' | 'removed'
}

interface ActionFormData {
  name: string
  condition: string
  triggerOnUserInput: boolean
  triggerOnClientCommand: boolean
  triggerOnTransformation: boolean
  watchedVariables: WatchedVariable[]
  classificationTrigger: string
  overrideClassifierId: string
  examples: string
}

interface ActionOperations {
  generateResponse: {
    enabled: boolean
    responseMode: 'generated' | 'prescripted'
    prescriptedSelectionStrategy: 'random' | 'round_robin'
    prescriptedResponses: string[]
  }
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
    form: ActionFormData
    operations: ActionOperations
    parameters?: ActionParameter[]
    activeTab: { value: string }
    availableClassifiers?: Array<{ id: string; name: string }>
    availableStages?: Array<{ id: string; name: string }>
    availableTools?: ToolResponse[]
    showParameters?: boolean
    showTrigger?: boolean
    showKeyField?: boolean
    actionKey?: { value: string }
    isKeyDisabled?: boolean
    showTabs?: boolean
    showMetadata?: boolean
    simpleTrigger?: boolean
    metadataFields?: Array<{ label: string; value: any; format?: 'mono' | 'date' | 'default' }>
    stageVariables?: any[]
    actionParameters?: Record<string, any[]>
    projectConstants?: Record<string, any>
  }>(),
  {
    parameters: () => [],
    availableClassifiers: () => [],
    availableStages: () => [],
    availableTools: () => [],
    showParameters: false,
    showTrigger: true,
    showKeyField: false,
    isKeyDisabled: false,
    showTabs: true,
    showMetadata: false,
    simpleTrigger: false,
    metadataFields: () => [],
    stageVariables: () => [],
    actionParameters: () => ({}),
    projectConstants: () => ({}),
  }
)

function addPrescriptedResponse() {
  props.operations.generateResponse.prescriptedResponses.push('')
}

function removePrescriptedResponse(index: number) {
  props.operations.generateResponse.prescriptedResponses.splice(index, 1)
}

function addParameter() {
  props.parameters.push({ name: '', type: 'string' as const, description: '', required: false })
}

function removeParameter(index: number) {
  props.parameters.splice(index, 1)
}

function addWatchedVariable() {
  props.form.watchedVariables.push({ path: '', changeType: 'changed' })
}

// allow parent to query the current script editor value (in case of sync issues)
const runScriptEditor = ref<any>(null)

function getRunScriptCode() {
  // read from the live CodeMirror editor if available, fall back to prop value
  return runScriptEditor.value?.getValue?.() ?? props.operations.runScript.code
}

defineExpose({ getRunScriptCode })

function removeWatchedVariable(index: number) {
  props.form.watchedVariables.splice(index, 1)
}

const openWatchedVariableDropdown = ref<number | null>(null)

function toggleWatchedVariableDropdown(index: number) {
  if (openWatchedVariableDropdown.value === index) {
    openWatchedVariableDropdown.value = null
  } else {
    openWatchedVariableDropdown.value = index
  }
}

function selectWatchedVariable(index: number, variableName: string) {
  props.form.watchedVariables[index]!.path = variableName
  openWatchedVariableDropdown.value = null
}

function addVariableModification() {
  props.operations.modifyVariables.modifications.push({ variableName: '', operation: 'set', value: '' })
}

function removeVariableModification(index: number) {
  props.operations.modifyVariables.modifications.splice(index, 1)
}

// Track which variable modification dropdown is open
const openVariableDropdown = ref<number | null>(null)

function toggleVariableDropdown(index: number) {
  if (openVariableDropdown.value === index) {
    openVariableDropdown.value = null
  } else {
    openVariableDropdown.value = index
  }
}

function selectStageVariable(index: number, variableName: string) {
  props.operations.modifyVariables.modifications[index]!.variableName = variableName
  openVariableDropdown.value = null // Close dropdown after selection
}

// Computed property to format stage variables for dropdown
const stageVariablesWithTypes = computed(() => {
  return props.stageVariables.map(v => ({
    name: v.name,
    type: v.type,
    displayType: getTypeDisplayName(v.type)
  }))
})

function getTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Number',
    'boolean': 'Boolean',
    'object': 'Object',
    'string[]': 'String[]',
    'number[]': 'Number[]',
    'boolean[]': 'Boolean[]',
    'object[]': 'Object[]',
    'image': 'Image',
    'image[]': 'Image[]',
    'audio': 'Audio',
    'audio[]': 'Audio[]'
  }
  return typeMap[type] || type
}

function getTypeBadgeColor(type: string): string {
  if (type.includes('[]')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (type === 'string') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (type === 'number') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  if (type === 'boolean') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  if (type === 'object') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (type === 'image' || type === 'audio') return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
}

function addProfileModification() {
  props.operations.modifyUserProfile.modifications.push({ fieldName: '', operation: 'set', value: '' })
}

function removeProfileModification(index: number) {
  props.operations.modifyUserProfile.modifications.splice(index, 1)
}

// Tool parameter helpers
const selectedTool = computed(() => {
  if (!props.operations.callTool.toolId) return null
  return props.availableTools.find(tool => tool.id === props.operations.callTool.toolId) || null
})

// Filter stage variables by type for reference selection
const imageVariables = computed(() => {
  return props.stageVariables.filter(v => v.type === 'image' && !v.isArray)
})

const imageArrayVariables = computed(() => {
  return props.stageVariables.filter(v => v.type === 'image[]')
})

const toolParameters = ref<Record<string, any>>({})

// Initialize tool parameters when tool changes or when loading existing data
watch(() => [props.operations.callTool.toolId, props.availableTools.length] as const, ([newToolId]) => {
  if (!newToolId) {
    toolParameters.value = {}
    return
  }
  
  const tool = props.availableTools.find(t => t.id === newToolId)
  if (!tool) return
  
  // Check if we already have parameters from loaded data
  const existingParams = props.operations.callTool.parameters
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
      } else if (param.type === 'image[]' && (typeof existingValue === 'object' || Array.isArray(existingValue))) {
        // For image[] with object/array (old format), convert to empty string
        newParams[param.name] = typeof existingValue === 'string' ? existingValue : ''
      } else if ((param.type === 'image' || param.type === 'audio') && typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
        // For image/audio types, if it's an object (old file upload format), convert to empty string
        newParams[param.name] = ''
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
      } else if (param.type === 'image[]') {
        // image[] uses variable reference, not array of items
        newParams[param.name] = ''
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
  props.operations.callTool.parameters = { ...newParams }
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
  } else if (paramType === 'audio[]') {
    toolParameters.value[paramName].push(null)
  }
}

function removeArrayItem(paramName: string, index: number) {
  if (Array.isArray(toolParameters.value[paramName])) {
    toolParameters.value[paramName].splice(index, 1)
  }
}

function handleAudioUpload(event: Event, paramName: string) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/mpeg'
    
    // Determine format from MIME type
    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'
    
    toolParameters.value[paramName] = {
      data: base64Data,
      format,
      mimeType,
      metadata: {}
    }
  }
  reader.readAsDataURL(file)
}

function handleAudioArrayUpload(event: Event, paramName: string, index: number) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/mpeg'
    
    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'
    
    if (!Array.isArray(toolParameters.value[paramName])) {
      toolParameters.value[paramName] = []
    }
    toolParameters.value[paramName][index] = {
      data: base64Data,
      format,
      mimeType,
      metadata: {}
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Tab Navigation -->
    <div v-if="showTabs" class="tabs-container shrink-0">
      <nav class="tabs-nav">
        <button
          type="button"
          @click="activeTab.value = 'basic'"
          :class="['tab-button', activeTab.value === 'basic' ? 'tab-button-active' : '']"
        >
          Basic
        </button>
        <button
          v-if="showTrigger"
          type="button"
          @click="activeTab.value = 'trigger'"
          :class="['tab-button', activeTab.value === 'trigger' ? 'tab-button-active' : '']"
        >
          Trigger
        </button>
        <button
          v-if="showParameters"
          type="button"
          @click="activeTab.value = 'parameters'"
          :class="['tab-button', activeTab.value === 'parameters' ? 'tab-button-active' : '']"
        >
          Parameters
        </button>
        <button
          type="button"
          @click="activeTab.value = 'effects'"
          :class="['tab-button', activeTab.value === 'effects' ? 'tab-button-active' : '']"
        >
          Effects
        </button>
        <button
          v-if="operations.generateResponse.enabled"
          type="button"
          @click="activeTab.value = 'generateResponse'"
          :class="['tab-button', activeTab.value === 'generateResponse' ? 'tab-button-active' : '']"
        >
          Generate Response
        </button>
        <button
          v-if="operations.goToStage.enabled"
          type="button"
          @click="activeTab.value = 'goToStage'"
          :class="['tab-button', activeTab.value === 'goToStage' ? 'tab-button-active' : '']"
        >
          Go To Stage
        </button>
        <button
          v-if="operations.runScript.enabled"
          type="button"
          @click="activeTab.value = 'runScript'"
          :class="['tab-button', activeTab.value === 'runScript' ? 'tab-button-active' : '']"
        >
          Run Script
        </button>
        <button
          v-if="operations.modifyUserInput.enabled"
          type="button"
          @click="activeTab.value = 'modifyUserInput'"
          :class="['tab-button', activeTab.value === 'modifyUserInput' ? 'tab-button-active' : '']"
        >
          Modify User Input
        </button>
        <button
          v-if="operations.modifyVariables.enabled"
          type="button"
          @click="activeTab.value = 'modifyVariables'"
          :class="['tab-button', activeTab.value === 'modifyVariables' ? 'tab-button-active' : '']"
        >
          Modify Variables
        </button>
        <button
          v-if="operations.modifyUserProfile.enabled"
          type="button"
          @click="activeTab.value = 'modifyUserProfile'"
          :class="['tab-button', activeTab.value === 'modifyUserProfile' ? 'tab-button-active' : '']"
        >
          Modify User Profile
        </button>
        <button
          v-if="operations.callTool.enabled"
          type="button"
          @click="activeTab.value = 'callTool'"
          :class="['tab-button', activeTab.value === 'callTool' ? 'tab-button-active' : '']"
        >
          Call Tool
        </button>
        <button
          v-if="operations.callWebhook.enabled"
          type="button"
          @click="activeTab.value = 'callWebhook'"
          :class="['tab-button', activeTab.value === 'callWebhook' ? 'tab-button-active' : '']"
        >
          Call Webhook
        </button>
        <button
          v-if="showMetadata"
          type="button"
          @click="activeTab.value = 'metadata'"
          :class="['tab-button', activeTab.value === 'metadata' ? 'tab-button-active' : '']"
        >
          Metadata
        </button>
      </nav>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto mt-4 px-6">
    <!-- Basic Tab -->
    <div v-show="activeTab.value === 'basic'" class="space-y-6">
      <div v-if="showKeyField && actionKey" class="form-group">
        <label class="form-label">
          Action Key <span class="required">*</span>
        </label>
        <input
          v-model="actionKey.value"
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
          v-model="form.name"
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
          v-model="form.examples"
          rows="4"
          class="form-textarea"
          placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
        ></textarea>
        <p class="form-help-text">
          Example phrases that should trigger this action
        </p>
      </div>
    </div>

    <!-- Trigger Tab (simplified mode) -->
    <div v-if="simpleTrigger" v-show="activeTab.value === 'trigger'" class="space-y-4">
      <div class="form-group">
        <label class="form-label">
          Classification Trigger
        </label>
        <input
          v-model="form.classificationTrigger"
          type="text"
          placeholder="offensive_language"
          class="form-input"
        />
        <p class="form-help-text">
          Classification label that triggers this guardrail
        </p>
      </div>
      <div class="form-group">
        <label class="form-label">
          Override Classifier ID <span class="text-gray-500">(optional)</span>
        </label>
        <select
          v-model="form.overrideClassifierId"
          class="form-select-auto"
        >
          <option value="">No override (use stage default classifier)</option>
          <option v-for="classifier in availableClassifiers" :key="classifier.id" :value="classifier.id">
            {{ classifier.name }}
          </option>
        </select>
        <p class="form-help-text">
          Override the stage's default classifier for this guardrail
        </p>
      </div>
    </div>

    <!-- Trigger Tab (full mode) -->
    <div v-if="!simpleTrigger" v-show="activeTab.value === 'trigger'" class="space-y-4">

      <!-- Condition (always visible) -->
      <div class="form-group">
        <label class="form-label">
          Condition <span class="text-gray-500">(optional)</span>
        </label>
        <input
          v-model="form.condition"
          type="text"
          placeholder="context.variables.agent_available === true"
          class="form-input font-mono text-sm"
        />
        <p class="form-help-text">
          Optional JavaScript condition expression for action activation
        </p>
      </div>

      <!-- Trigger on User Input -->
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <input
            v-model="form.triggerOnUserInput"
            type="checkbox"
            class="form-checkbox"
          />
          <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
            Trigger on User Input
          </span>
        </label>
        <div v-if="form.triggerOnUserInput" class="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
          <div class="form-group mb-0">
            <label class="form-label">
              Classification Trigger <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.classificationTrigger"
              type="text"
              placeholder="transfer_request"
              class="form-input"
            />
            <p class="form-help-text">
              Classification label that triggers this action
            </p>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">
              Override Classifier ID <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="form.overrideClassifierId"
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
        </div>
      </div>

      <!-- Trigger on Client Command -->
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
        <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <input
            v-model="form.triggerOnClientCommand"
            type="checkbox"
            class="form-checkbox"
          />
          <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
            Trigger on Client Command
          </span>
        </label>
      </div>

      <!-- Trigger on Variable Transformation -->
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <label class="flex items-center cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <input
            v-model="form.triggerOnTransformation"
            type="checkbox"
            class="form-checkbox"
          />
          <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
            Trigger on Variable Transformation
          </span>
        </label>
        <div v-if="form.triggerOnTransformation" class="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <p class="form-help-text mb-3">
            Define which variable changes trigger this action. Leave empty to trigger on any transformation.
          </p>
          <div class="space-y-3">
            <div
              v-for="(watched, index) in form.watchedVariables"
              :key="index"
              class="p-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Variable {{ index + 1 }}</span>
                <button
                  type="button"
                  @click="removeWatchedVariable(index)"
                  class="text-red-600 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label text-sm">Variable Path <span class="required">*</span></label>
                  <div class="flex items-start gap-2">
                    <input
                      v-model="watched.path"
                      type="text"
                      placeholder="cart_total"
                      class="form-input font-mono text-sm flex-1"
                    />
                    <div v-if="stageVariables.length > 0" class="relative">
                      <button
                        type="button"
                        @click.stop="toggleWatchedVariableDropdown(index)"
                        class="btn-secondary mt-0.5"
                        title="Select from defined variables"
                      >
                        <MoreHorizontal :size="16" />
                      </button>
                      <div
                        v-if="openWatchedVariableDropdown === index"
                        class="fixed inset-0 z-40"
                        @click="openWatchedVariableDropdown = null"
                      ></div>
                      <div
                        v-if="openWatchedVariableDropdown === index"
                        @click.stop
                        class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
                      >
                        <button
                          v-for="variable in stageVariablesWithTypes"
                          :key="variable.name"
                          type="button"
                          @click="selectWatchedVariable(index, variable.name)"
                          class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                        >
                          <span class="font-mono text-gray-900 dark:text-gray-100">{{ variable.name }}</span>
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                            :class="getTypeBadgeColor(variable.type)"
                          >
                            {{ variable.displayType }}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="form-label text-sm">Change Type <span class="required">*</span></label>
                  <select v-model="watched.changeType" class="form-select-auto text-sm">
                    <option value="new">New (variable created)</option>
                    <option value="changed">Changed (value updated)</option>
                    <option value="removed">Removed (variable cleared)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            @click="addWatchedVariable()"
            class="btn-secondary mt-3"
          >
            + Add Watched Variable
          </button>
        </div>
      </div>
    </div>

    <!-- Parameters Tab -->
    <div v-if="showParameters" v-show="activeTab.value === 'parameters'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Action Parameters</label>
        <p class="form-help-text mb-3">
          Define parameters that will be extracted from user input when this action is triggered.
        </p>
        <div class="space-y-4">
          <div
            v-for="(param, index) in parameters"
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
    <div v-show="activeTab.value === 'effects'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Select Effects</label>
        <p class="form-help-text mb-3">
          Choose which effects this action should perform. Complex effects will add dedicated tabs for configuration.
        </p>
        <div class="space-y-3">
          <label class="flex items-start cursor-pointer">
            <input
              v-model="operations.generateResponse.enabled"
              type="checkbox"
              class="form-checkbox mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Generate Response</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Generate an AI response for this action (adds tab for configuration)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input
              v-model="operations.endConversation.enabled"
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
              v-model="operations.abortConversation.enabled"
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
              v-model="operations.goToStage.enabled"
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
              v-model="operations.runScript.enabled"
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
              v-model="operations.modifyUserInput.enabled"
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
              v-model="operations.modifyVariables.enabled"
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
              v-model="operations.modifyUserProfile.enabled"
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
              v-model="operations.callTool.enabled"
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
              v-model="operations.callWebhook.enabled"
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

    <!-- Generate Response Tab -->
    <div v-show="activeTab.value === 'generateResponse'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Response Mode</label>
        <select v-model="operations.generateResponse.responseMode" class="form-select-auto">
          <option value="generated">Generated (AI-generated)</option>
          <option value="prescripted">Prescripted (predefined responses)</option>
        </select>
        <p class="form-help-text">
          How the response should be produced
        </p>
      </div>

      <template v-if="operations.generateResponse.responseMode === 'prescripted'">
        <div class="form-group">
          <label class="form-label">Selection Strategy</label>
          <select v-model="operations.generateResponse.prescriptedSelectionStrategy" class="form-select-auto">
            <option value="random">Random</option>
            <option value="round_robin">Round Robin</option>
          </select>
          <p class="form-help-text">
            How to pick a response when multiple prescripted responses are provided
          </p>
        </div>

        <div class="form-group">
          <div class="flex items-center justify-between mb-2">
            <label class="form-label mb-0">Prescripted Responses</label>
            <button type="button" class="btn-secondary" @click="addPrescriptedResponse()">+ Add Response</button>
          </div>
          <p class="form-help-text mb-3">
            Define the predefined responses to choose from
          </p>
          <div v-if="operations.generateResponse.prescriptedResponses.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic py-2">
            No prescripted responses yet. Click "Add Response" to add one.
          </div>
          <div class="space-y-3">
            <div
              v-for="(_, index) in operations.generateResponse.prescriptedResponses"
              :key="index"
              class="flex gap-2 items-start"
            >
              <textarea
                v-model="operations.generateResponse.prescriptedResponses[index]"
                rows="2"
                class="form-textarea flex-1 text-sm"
                :placeholder="`Response ${index + 1}...`"
              ></textarea>
              <button type="button" class="btn-danger" @click="removePrescriptedResponse(index)">Remove</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Go To Stage Tab -->
    <div v-show="activeTab.value === 'goToStage'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          Target Stage <span class="required">*</span>
        </label>
        <select
          v-model="operations.goToStage.stageId"
          :required="operations.goToStage.enabled"
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
    <div v-show="activeTab.value === 'runScript'" class="flex flex-col min-h-full">
      <div class="form-group flex flex-col flex-1 min-h-0">
        <label class="form-label shrink-0">JavaScript Code <span class="required">*</span></label>
        <JavaScriptEditor
          ref="runScriptEditor"
          v-model="operations.runScript.code"
          :disabled="!operations.runScript.enabled"
          :stage-variables="stageVariables"
          :global-variables="bonsaiDefaultGlobalVariables"
          :function-list="bonsaiDefaultFunctions"
          :project-constants="projectConstants"
          :fluid="true"
          show-toolbar
          placeholder="// Available: context, user, conversation\nconst result = context.variables.count + 1;\nreturn { count: result };"
          aria-label="JavaScript code"
        />
        <p class="form-help-text shrink-0">
          JavaScript code to execute. Available objects: context, user, conversation
        </p>
      </div>
    </div>

    <!-- Modify User Input Tab -->
    <div v-show="activeTab.value === 'modifyUserInput'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          Template <span class="required">*</span>
        </label>
        <PromptEditor
          v-model="operations.modifyUserInput.template"
          :disabled="!operations.modifyUserInput.enabled"
          :stage-variables="stageVariables"
          :action-parameters="actionParameters"
          :project-constants="projectConstants"
          placeholder="User wants to {{user.input}}"
          min-height="6rem"
          aria-label="Modify user input template"
        />
        <p class="form-help-text">
          Template to transform the user input. Use <code>&#123;&#123;user.input&#125;&#125;</code> to reference original input
        </p>
      </div>
    </div>

    <!-- Modify Variables Tab -->
    <div v-show="activeTab.value === 'modifyVariables'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Variable Modifications</label>
        <div class="space-y-4">
          <div
            v-for="(mod, index) in operations.modifyVariables.modifications"
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
            
            <div class="space-y-2">
              <label class="form-label text-sm">Variable Name</label>
              
              <div class="flex items-start gap-2">
                <!-- Manual input field -->
                <input
                  v-model="mod.variableName"
                  type="text"
                  placeholder="cart_total"
                  class="form-input font-mono text-sm flex-1"
                />
                
                <!-- Button to select from defined stage variables -->
                <div v-if="stageVariables.length > 0" class="relative">
                  <button
                    type="button"
                    @click.stop="toggleVariableDropdown(index)"
                    class="btn-secondary mt-0.5"
                    title="Select from defined variables"
                  >
                    <MoreHorizontal :size="16" />
                  </button>
                  
                  <!-- Backdrop to close dropdown -->
                  <div
                    v-if="openVariableDropdown === index"
                    class="fixed inset-0 z-40"
                    @click="openVariableDropdown = null"
                  ></div>
                  
                  <!-- Dropdown menu -->
                  <div
                    v-if="openVariableDropdown === index"
                    @click.stop
                    class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
                  >
                    <button
                      v-for="variable in stageVariablesWithTypes"
                      :key="variable.name"
                      type="button"
                      @click="selectStageVariable(index, variable.name)"
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                    >
                      <span class="font-mono text-gray-900 dark:text-gray-100">{{ variable.name }}</span>
                      <span 
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                        :class="getTypeBadgeColor(variable.type)"
                      >
                        {{ variable.displayType }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Type indicator if variable is defined -->
              <div v-if="mod.variableName && stageVariables.length > 0" class="flex items-center gap-2">
                <template v-for="variable in stageVariables" :key="variable.name">
                  <span 
                    v-if="variable.name === mod.variableName"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getTypeBadgeColor(variable.type)"
                  >
                    {{ getTypeDisplayName(variable.type) }}
                  </span>
                </template>
              </div>
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
              <PromptEditor
                v-model="mod.value"
                :stage-variables="stageVariables"
                :action-parameters="actionParameters"
                :project-constants="projectConstants"
                placeholder="42 or {{user.name}}"
                min-height="3rem"
                aria-label="Variable value"
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
    <div v-show="activeTab.value === 'modifyUserProfile'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">Profile Modifications</label>
        <div class="space-y-4">
          <div
            v-for="(mod, index) in operations.modifyUserProfile.modifications"
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
              <PromptEditor
                v-model="mod.value"
                :stage-variables="stageVariables"
                :action-parameters="actionParameters"
                :project-constants="projectConstants"
                placeholder="user@example.com or {{user.email}}"
                min-height="3rem"
                aria-label="Profile field value"
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
    <div v-show="activeTab.value === 'callTool'" class="space-y-6">
      <!-- Tool Dropdown -->
      <div class="form-group">
        <label class="form-label">Tool <span class="required">*</span></label>
        <select 
          v-model="operations.callTool.toolId" 
          class="form-select-auto"
          :required="operations.callTool.enabled"
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
            
            <!-- Image input (variable reference) -->
            <div v-else-if="param.type === 'image'" class="space-y-2">
              <select
                v-model="toolParameters[param.name]"
                class="form-select text-sm"
                :required="param.required"
              >
                <option value="">Select image variable...</option>
                <option 
                  v-for="variable in imageVariables" 
                  :key="variable.name"
                  :value="`{{vars.${variable.name}}}`"
                >
                  {{ variable.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500">{{ param.description }} - Select a stage variable of type image</p>
            </div>
            
            <!-- Audio input -->
            <div v-else-if="param.type === 'audio'" class="space-y-2">
              <input
                type="file"
                accept="audio/*"
                @change="handleAudioUpload($event, param.name)"
                class="form-input text-sm"
                :required="param.required"
              />
              <div v-if="toolParameters[param.name]" class="mt-2">
                <audio
                  controls
                  :src="`data:${toolParameters[param.name].mimeType};base64,${toolParameters[param.name].data}`"
                  class="w-full max-w-md"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
              <p class="text-xs text-gray-500">{{ param.description }}</p>
            </div>
            
            <!-- Image array input (variable reference to image[] array) -->
            <div v-else-if="param.type === 'image[]'" class="space-y-2">
              <select
                v-model="toolParameters[param.name]"
                class="form-select text-sm"
                :required="param.required"
              >
                <option value="">Select image array variable...</option>
                <option 
                  v-for="variable in imageArrayVariables" 
                  :key="variable.name"
                  :value="`{{vars.${variable.name}}}`"
                >
                  {{ variable.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500">{{ param.description }} - Select a stage variable of type image[]</p>
            </div>
            
            <!-- Array inputs (string[], number[], boolean[], object[], audio[]) -->
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
                <div v-else-if="param.type === 'audio[]'" class="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="audio/*"
                    @change="handleAudioArrayUpload($event, param.name, index)"
                    class="form-input text-sm"
                  />
                  <div v-if="toolParameters[param.name][index]" class="mt-2">
                    <audio
                      controls
                      :src="`data:${toolParameters[param.name][index].mimeType};base64,${toolParameters[param.name][index].data}`"
                      class="w-full max-w-md"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
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
    <div v-show="activeTab.value === 'callWebhook'" class="space-y-6">
      <div class="form-group">
        <label class="form-label">
          URL <span class="required">*</span>
        </label>
        <PromptEditor
          v-model="operations.callWebhook.url"
          :disabled="!operations.callWebhook.enabled"
          :stage-variables="stageVariables"
          :action-parameters="actionParameters"
          :project-constants="projectConstants"
          placeholder="https://api.example.com/webhook"
          min-height="3rem"
          aria-label="Webhook URL"
        />
        <p class="form-help-text">
          The webhook endpoint URL (supports template variables)
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          HTTP Method <span class="required">*</span>
        </label>
        <select v-model="operations.callWebhook.method" class="form-select-auto" :required="operations.callWebhook.enabled">
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
        <PromptEditor
          v-model="operations.callWebhook.headers"
          :disabled="!operations.callWebhook.enabled"
          :stage-variables="stageVariables"
          :action-parameters="actionParameters"
          :project-constants="projectConstants"
          placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer {{token}}"\n}'
          min-height="6rem"
          aria-label="Webhook headers"
        />
        <p class="form-help-text">
          JSON object with HTTP headers (supports template variables)
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Body <span class="text-gray-500">(optional, JSON)</span>
        </label>
        <PromptEditor
          v-model="operations.callWebhook.body"
          :disabled="!operations.callWebhook.enabled"
          :stage-variables="stageVariables"
          :action-parameters="actionParameters"
          :project-constants="projectConstants"
          placeholder='{\n  "userId": "{{user.id}}",\n  "message": "{{user.input}}"\n}'
          min-height="9rem"
          aria-label="Webhook body"
        />
        <p class="form-help-text">
          JSON body for the request. Supports template variables.
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Result Key <span class="required">*</span>
        </label>
        <input
          v-model="operations.callWebhook.resultKey"
          type="text"
          :required="operations.callWebhook.enabled"
          placeholder="webhookResult"
          class="form-input font-mono"
        />
        <p class="form-help-text">
          Variable name to store the webhook response
        </p>
      </div>
    </div>

    <!-- Metadata Tab -->
    <div v-show="activeTab.value === 'metadata'" class="space-y-6">
      <MetadataTab
        v-if="showMetadata && metadataFields.length > 0"
        :fields="metadataFields"
      />
    </div>
    </div>
  </div>
</template>
