<script setup lang="ts">
import { computed, ref } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import MetadataTab from './MetadataTab.vue'
import ActionEffectsEditor from './ActionEffectsEditor.vue'
import type { ToolResponse } from '@/api/generated/data-contracts'

interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  description: string
  required: boolean
}

interface WatchedVariable {
  path: string
  changeType: 'new' | 'changed' | 'removed' | 'any'
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
  modifyUserInput: { enabled: boolean; template: string }
  modifyVariables: {
    enabled: boolean
    modifications: Array<{ variableName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  modifyUserProfile: {
    enabled: boolean
    modifications: Array<{ fieldName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  callTools: Array<{ toolId: string; parameters: Record<string, any> }>
  changeVisibility: {
    enabled: boolean
    visibility: 'always' | 'stage' | 'never' | 'conditional'
    condition: string
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
    showTabs?: boolean
    showMetadata?: boolean
    showHistory?: boolean
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
    showTabs: true,
    showMetadata: false,
    showHistory: false,
    simpleTrigger: false,
    metadataFields: () => [],
    stageVariables: () => [],
    actionParameters: () => ({}),
    projectConstants: () => ({}),
  }
)

function addParameter() {
  props.parameters.push({ name: '', type: 'string' as const, description: '', required: false })
}

function removeParameter(index: number) {
  props.parameters.splice(index, 1)
}

function addWatchedVariable() {
  props.form.watchedVariables.push({ path: '', changeType: 'any' })
}

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

const stageVariablesWithTypes = computed(() => {
  return props.stageVariables.map(v => ({
    name: v.name,
    type: v.type,
    displayType: getTypeDisplayName(v.type)
  }))
})

function getTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String', 'number': 'Number', 'boolean': 'Boolean', 'object': 'Object',
    'string[]': 'String[]', 'number[]': 'Number[]', 'boolean[]': 'Boolean[]', 'object[]': 'Object[]',
    'image': 'Image', 'image[]': 'Image[]', 'audio': 'Audio', 'audio[]': 'Audio[]'
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
          v-if="showMetadata"
          type="button"
          @click="activeTab.value = 'metadata'"
          :class="['tab-button', activeTab.value === 'metadata' ? 'tab-button-active' : '']"
        >
          Metadata
        </button>
        <button
          v-if="showHistory"
          type="button"
          @click="activeTab.value = 'history'"
          :class="['tab-button', activeTab.value === 'history' ? 'tab-button-active' : '']"
        >
          History
        </button>
      </nav>
    </div>

    <div class="flex-1 min-h-0 flex flex-col">
    <!-- Basic Tab -->
    <div v-show="activeTab.value === 'basic'" class="tab-content space-y-6 overflow-y-auto">
      <div class="form-group">
        <label class="form-label">
          Name <span class="required">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Transfer to Human Agent"
          class="form-input"
        />
        <p class="form-help-text">
          This name is used in templates and scripts to reference this action.
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
    <div v-if="simpleTrigger" v-show="activeTab.value === 'trigger'" class="tab-content space-y-4 overflow-y-auto">
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
          Override Classifier <span class="text-gray-500">(optional)</span>
        </label>
        <select
          v-model="form.overrideClassifierId"
          class="form-select-auto"
        >
          <option value="">No override (use default classifier)</option>
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
    <div v-if="!simpleTrigger" v-show="activeTab.value === 'trigger'" class="tab-content space-y-4 overflow-y-auto">

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
              Classification Trigger
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
              Override Classifier <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="form.overrideClassifierId"
              class="form-select-auto min-w-64"
            >
              <option value="">No override (use default classifier)</option>
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
                    <option value="any">Any (new, changed, or removed)</option>
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
    <div v-if="showParameters" v-show="activeTab.value === 'parameters'" class="tab-content space-y-6 overflow-y-auto">
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
            class="btn-secondary"
          >
            + Add Parameter
          </button>
        </div>
      </div>
    </div>

    <!-- Effects Tab -->
    <div v-show="activeTab.value === 'effects'" class="flex-1 min-h-0 flex flex-col">
      <ActionEffectsEditor
        :operations="operations"
        :available-classifiers="availableClassifiers"
        :available-stages="availableStages"
        :available-tools="availableTools"
        :stage-variables="stageVariables"
        :action-parameters="actionParameters"
        :project-constants="projectConstants"
      />
    </div>

    <!-- Metadata Tab -->
    <div v-show="activeTab.value === 'metadata'" class="space-y-6 tab-content overflow-y-auto">
      <MetadataTab
        v-if="showMetadata && metadataFields.length > 0"
        :fields="metadataFields"
      />
    </div>
    <!-- History Tab -->
    <div v-show="activeTab.value === 'history'">
      <slot name="history" />
    </div>
    </div>
  </div>
</template>
