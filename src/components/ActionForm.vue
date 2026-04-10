<script setup lang="ts">
import { computed, watch } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import MetadataTab from './MetadataTab.vue'
import FloatingDropdown from './FloatingDropdown.vue'
import ActionEffectsEditor from './ActionEffectsEditor.vue'
import type { ToolResponse } from '@/api/generated/data-contracts'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import FormField from './FormField.vue'
import { useTabNavigation, type ActionOperations } from '../composables'
import type { ParsedError } from '../api/types'

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

const activeTab = defineModel<string>('activeTab', { default: 'basic' })

const props = withDefaults(
  defineProps<{
    form: ActionFormData
    operations: ActionOperations
    parameters?: ActionParameter[]
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
    error?: ParsedError | null
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
    error: null,
  }
)

const { switchToFirstErrorTab } = useTabNavigation(activeTab)

watch(() => props.error, (err) => {
  if (err) switchToFirstErrorTab(err)
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'Basic' },
  { key: 'trigger', label: 'Trigger', show: props.showTrigger },
  { key: 'parameters', label: 'Parameters', show: props.showParameters },
  { key: 'effects', label: 'Effects' },
  { key: 'metadata', label: 'Metadata', show: props.showMetadata },
  { key: 'history', label: 'History', show: props.showHistory },
])

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

function selectWatchedVariable(index: number, variableName: string) {
  props.form.watchedVariables[index]!.path = variableName
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
      <TabNavigator
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div class="flex-1 min-h-0 flex flex-col">
    <!-- Basic Tab -->
    <div v-show="activeTab === 'basic'" class="tab-content space-y-6 overflow-y-auto" data-tab="basic">
      <FormField label="Name" :path="'name'" :error="props.error" required class="w-full" help="This name is used in templates and scripts to reference this action.">
        <input
          v-model="form.name"
          type="text"
          placeholder="Transfer to Human Agent"
          class="form-input"
        />
      </FormField>

      <FormField label="Examples" hint="(optional, one per line)" class="w-full" help="Example phrases that should trigger this action">
        <textarea
          v-model="form.examples"
          rows="4"
          class="form-textarea"
          placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
        ></textarea>
      </FormField>
    </div>

    <!-- Trigger Tab (simplified mode) -->
    <div v-if="simpleTrigger" v-show="activeTab === 'trigger'" class="tab-content space-y-4 overflow-y-auto" data-tab="trigger">
      <FormField label="Classification Trigger" class="w-full" help="Classification label that triggers this guardrail">
        <input
          v-model="form.classificationTrigger"
          type="text"
          placeholder="offensive_language"
          class="form-input"
        />
      </FormField>
      <FormField label="Override Classifier" hint="(optional)" class="w-full" help="Override the stage's default classifier for this guardrail">
        <select
          v-model="form.overrideClassifierId"
          class="form-select-auto"
        >
          <option value="">No override (use default classifier)</option>
          <option v-for="classifier in availableClassifiers" :key="classifier.id" :value="classifier.id">
            {{ classifier.name }}
          </option>
        </select>
      </FormField>
    </div>

    <!-- Trigger Tab (full mode) -->
    <div v-if="!simpleTrigger" v-show="activeTab === 'trigger'" class="tab-content space-y-4 overflow-y-auto" data-tab="trigger">

      <!-- Condition (always visible) -->
      <FormField label="Condition" hint="(optional)" class="w-full" help="Optional JavaScript condition expression for action activation">
        <input
          v-model="form.condition"
          type="text"
          placeholder="context.variables.agent_available === true"
          class="form-input font-mono text-sm"
        />
      </FormField>

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
                <FormField label="Variable Path" required :path="['watchedVariables', index, 'path']" :error="props.error" class="w-full">
                  <div class="flex items-start gap-2">
                    <input
                      v-model="watched.path"
                      type="text"
                      placeholder="cart_total"
                      class="form-input font-mono text-sm flex-1"
                    />
                    <FloatingDropdown
                      v-if="stageVariables.length > 0"
                      :items="stageVariablesWithTypes"
                      item-key="name"
                      trigger-class="btn-secondary mt-0.5"
                      trigger-title="Select from defined variables"
                      @select="(v) => selectWatchedVariable(index, v.name)"
                    >
                      <template #trigger>
                        <MoreHorizontal :size="16" />
                      </template>
                      <template #item="{ item }">
                        <span class="font-mono text-gray-900 dark:text-gray-100">{{ item.name }}</span>
                        <span
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                          :class="getTypeBadgeColor(item.type)"
                        >
                          {{ item.displayType }}
                        </span>
                      </template>
                    </FloatingDropdown>
                  </div>
                </FormField>
                <div>
                  <label class="form-label text-md">Change Type</label>
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
    <div v-if="showParameters" v-show="activeTab === 'parameters'" class="tab-content space-y-6 overflow-y-auto" data-tab="parameters">
      <FormField label="Action Parameters" class="w-full">
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
              <FormField label="Parameter Name" required :path="['parameters', index, 'name']" :error="props.error" class="w-full">
                <input
                  v-model="param.name"
                  type="text"
                  placeholder="destination_stage"
                  class="form-input font-mono text-sm"
                />
              </FormField>

              <div>
                <label class="form-label text-sm">Type</label>
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
              </div>
            </div>

            <FormField label="Description" required :path="['parameters', index, 'description']" :error="props.error" class="w-full" help="Describe what this parameter represents to help with extraction">
              <input
                v-model="param.description"
                type="text"
                placeholder="The stage to transfer to"
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
      </FormField>
    </div>

    <!-- Effects Tab -->
    <div v-show="activeTab === 'effects'" class="flex-1 min-h-0 flex flex-col" data-tab="effects">
      <ActionEffectsEditor
        :operations="operations"
        :available-classifiers="availableClassifiers"
        :available-stages="availableStages"
        :available-tools="availableTools"
        :stage-variables="stageVariables"
        :action-parameters="actionParameters"
        :project-constants="projectConstants"
        :error="props.error"
      />
    </div>

    <!-- Metadata Tab -->
    <div v-show="activeTab === 'metadata'" class="space-y-6 tab-content overflow-y-auto" data-tab="metadata">
      <MetadataTab
        v-if="showMetadata && metadataFields.length > 0"
        :fields="metadataFields"
      />
    </div>
    <!-- History Tab -->
    <div v-show="activeTab === 'history'">
      <slot name="history" />
    </div>
    </div>
  </div>
</template>
