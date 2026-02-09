<script setup lang="ts">
import { computed } from 'vue'
import MetadataTab from './MetadataTab.vue'

interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'boolean[]'
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
  template: string
  examples: string
}

interface ActionOperations {
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
  callTool: { enabled: boolean; toolId: string; parameters: string }
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
    showParameters?: boolean
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
    showParameters: false,
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
          Template <span class="text-gray-500">(optional)</span>
        </label>
        <textarea
          v-model="localForm.template"
          rows="3"
          class="form-textarea"
          placeholder="I'll connect you with an agent. Please hold..."
        ></textarea>
        <p class="form-help-text">
          Optional message template for the action response
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
          <option value="">No override (use stage classifiers)</option>
          <option v-for="classifier in availableClassifiers" :key="classifier.id" :value="classifier.id">
            {{ classifier.name }}
          </option>
        </select>
        <p class="form-help-text">
          Override the stage classifier for this action
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
                  <option value="string[]">string[]</option>
                  <option value="number[]">number[]</option>
                  <option value="boolean[]">boolean[]</option>
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
          Target Stage ID <span class="required">*</span>
        </label>
        <input
          v-model="localOperations.goToStage.stageId"
          type="text"
          :required="localOperations.goToStage.enabled"
          placeholder="stage_abc123"
          class="form-input font-mono"
        />
        <p class="form-help-text">
          The ID of the stage to navigate to
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
      <div class="form-group">
        <label class="form-label">
          Tool ID <span class="required">*</span>
        </label>
        <input
          v-model="localOperations.callTool.toolId"
          type="text"
          :required="localOperations.callTool.enabled"
          placeholder="tool_abc123"
          class="form-input font-mono"
        />
        <p class="form-help-text">
          The ID of the tool to invoke
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Parameters <span class="text-gray-500">(optional, JSON)</span>
        </label>
        <textarea
          v-model="localOperations.callTool.parameters"
          rows="6"
          class="form-textarea font-mono text-sm"
          placeholder='{\n  "query": "{{user.input}}",\n  "limit": 10\n}'
        ></textarea>
        <p class="form-help-text">
          JSON object with tool parameters. Supports template variables.
        </p>
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
