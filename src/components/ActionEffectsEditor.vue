<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { Trash2, Plus, MoreHorizontal } from 'lucide-vue-next'
import PromptEditor from './PromptEditor.vue'
import type { ActionOperations } from '@/composables/useActionForm'
import type { ToolResponse } from '@/api/generated/data-contracts'

const props = withDefaults(defineProps<{
  operations: ActionOperations
  availableClassifiers?: Array<{ id: string; name: string }>
  availableStages?: Array<{ id: string; name: string }>
  availableTools?: ToolResponse[]
  stageVariables?: any[]
  actionParameters?: Record<string, any[]>
  projectConstants?: Record<string, any>
}>(), {
  availableClassifiers: () => [],
  availableStages: () => [],
  availableTools: () => [],
  stageVariables: () => [],
  actionParameters: () => ({}),
  projectConstants: () => ({}),
})

const selectedEffectId = ref<string | null>(null)

const EFFECT_PRIORITY = {
  callTool: 2,
  modifyVariables: 3,
  modifyUserProfile: 4,
  modifyUserInput: 5,
  changeVisibility: 6,
  generateResponse: 7,
  endConversation: 8,
  abortConversation: 9,
  goToStage: 10,
} as const

const effectsList = computed(() => {
  const ops = props.operations
  const list: Array<{ id: string; label: string; priority: number }> = []
  if (ops.generateResponse.enabled) list.push({ id: 'generateResponse', label: 'Generate Response', priority: EFFECT_PRIORITY.generateResponse })
  if (ops.endConversation.enabled) list.push({ id: 'endConversation', label: 'End Conversation', priority: EFFECT_PRIORITY.endConversation })
  if (ops.abortConversation.enabled) list.push({ id: 'abortConversation', label: 'Abort Conversation', priority: EFFECT_PRIORITY.abortConversation })
  if (ops.goToStage.enabled) list.push({ id: 'goToStage', label: 'Go to Stage', priority: EFFECT_PRIORITY.goToStage })
  if (ops.modifyUserInput.enabled) list.push({ id: 'modifyUserInput', label: 'Modify User Input', priority: EFFECT_PRIORITY.modifyUserInput })
  if (ops.modifyVariables.enabled) list.push({ id: 'modifyVariables', label: 'Modify Variables', priority: EFFECT_PRIORITY.modifyVariables })
  if (ops.modifyUserProfile.enabled) list.push({ id: 'modifyUserProfile', label: 'Modify User Profile', priority: EFFECT_PRIORITY.modifyUserProfile })
  if (ops.changeVisibility.enabled) list.push({ id: 'changeVisibility', label: 'Change Visibility', priority: EFFECT_PRIORITY.changeVisibility })
  ops.callTools.forEach((toolCall, i) => {
    const tool = props.availableTools?.find(t => t.id === toolCall.toolId)
    list.push({ id: `callTool_${i}`, label: tool ? `Tool: ${tool.name}` : 'Tool: (none)', priority: EFFECT_PRIORITY.callTool })
  })
  return list.sort((a, b) => a.priority - b.priority)
})

watch(effectsList, (list) => {
  if (list.length === 0) {
    selectedEffectId.value = null
  } else if (!selectedEffectId.value || !list.some(e => e.id === selectedEffectId.value)) {
    selectedEffectId.value = list[0]!.id
  }
}, { immediate: true })

const selectedEffectType = computed(() => {
  if (!selectedEffectId.value) return null
  if (selectedEffectId.value.startsWith('callTool_')) return 'callTool'
  return selectedEffectId.value
})

const selectedCallToolIndex = computed(() => {
  if (!selectedEffectId.value?.startsWith('callTool_')) return -1
  return parseInt(selectedEffectId.value.slice('callTool_'.length), 10)
})

const addableEffects = computed(() => {
  const ops = props.operations
  return [
    { key: 'generateResponse', label: 'Generate Response' },
    { key: 'endConversation', label: 'End Conversation' },
    { key: 'abortConversation', label: 'Abort Conversation' },
    { key: 'goToStage', label: 'Go to Stage' },
    { key: 'modifyUserInput', label: 'Modify User Input' },
    { key: 'modifyVariables', label: 'Modify Variables' },
    { key: 'modifyUserProfile', label: 'Modify User Profile' },
    { key: 'changeVisibility', label: 'Change Visibility' },
  ].filter(e => !(ops as any)[e.key]?.enabled)
})

const showAddDropdown = ref(false)

function addSingleEffect(key: string) {
  ;(props.operations as any)[key].enabled = true
  showAddDropdown.value = false
  selectedEffectId.value = key
}

function addToolCall() {
  props.operations.callTools.push({ toolId: '', parameters: {} })
  const index = props.operations.callTools.length - 1
  showAddDropdown.value = false
  selectedEffectId.value = `callTool_${index}`
}

function removeEffect(effectId: string) {
  if (effectId.startsWith('callTool_')) {
    const index = parseInt(effectId.slice('callTool_'.length), 10)
    props.operations.callTools.splice(index, 1)
    const newParams: Record<number, Record<string, any>> = {}
    for (const [idxStr, params] of Object.entries(toolParamsByIndex)) {
      const idx = parseInt(idxStr)
      if (idx < index) newParams[idx] = params
      else if (idx > index) newParams[idx - 1] = params
    }
    Object.keys(toolParamsByIndex).forEach(k => delete (toolParamsByIndex as any)[parseInt(k)])
    Object.assign(toolParamsByIndex, newParams)
    if (selectedEffectId.value === effectId) selectedEffectId.value = null
  } else {
    ;(props.operations as any)[effectId].enabled = false
    if (selectedEffectId.value === effectId) selectedEffectId.value = null
  }
}

const toolParamsByIndex = reactive<Record<number, Record<string, any>>>({})

const currentCallTool = computed(() => {
  const idx = selectedCallToolIndex.value
  if (idx < 0 || idx >= props.operations.callTools.length) return null
  return props.operations.callTools[idx]!
})

const currentParams = computed<Record<string, any>>(() => {
  const idx = selectedCallToolIndex.value
  if (idx < 0) return {}
  return toolParamsByIndex[idx] ?? {}
})

const currentToolObj = computed(() => {
  if (!currentCallTool.value?.toolId) return null
  return props.availableTools?.find(t => t.id === currentCallTool.value?.toolId) ?? null
})

watch(
  () => [selectedCallToolIndex.value, currentCallTool.value?.toolId, props.availableTools?.length] as const,
  ([idx, toolId]) => {
    if (idx < 0) return
    if (!toolId) {
      toolParamsByIndex[idx] = {}
      return
    }
    const toolObj = props.availableTools?.find(t => t.id === toolId)
    if (!toolObj) {
      toolParamsByIndex[idx] = {}
      return
    }
    const existingParams = currentCallTool.value?.parameters || {}
    const hasExistingParams = Object.keys(existingParams).length > 0
    const newParams: Record<string, any> = {}
    for (const param of toolObj.parameters) {
      if (hasExistingParams && param.name in existingParams) {
        const existingValue = existingParams[param.name]
        if (param.type === 'object') {
          if (typeof existingValue === 'object' && existingValue !== null) {
            newParams[param.name] = JSON.stringify(existingValue, null, 2)
          } else if (typeof existingValue === 'string') {
            try {
              newParams[param.name] = JSON.stringify(JSON.parse(existingValue), null, 2)
            } catch {
              newParams[param.name] = '{}'
            }
          } else {
            newParams[param.name] = '{}'
          }
        } else if (param.type === 'object[]' && Array.isArray(existingValue)) {
          newParams[param.name] = existingValue.map((item: any) =>
            typeof item === 'object' && item !== null ? JSON.stringify(item, null, 2) : item
          )
        } else if (param.type === 'image[]' && (typeof existingValue === 'object' || Array.isArray(existingValue))) {
          newParams[param.name] = typeof existingValue === 'string' ? existingValue : ''
        } else if ((param.type === 'image' || param.type === 'audio') && typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
          newParams[param.name] = ''
        } else {
          newParams[param.name] = existingValue
        }
      } else {
        if (param.type === 'boolean') newParams[param.name] = false
        else if (param.type === 'object') newParams[param.name] = '{}'
        else if (param.type === 'image[]') newParams[param.name] = ''
        else if (param.type.endsWith('[]')) newParams[param.name] = []
        else newParams[param.name] = ''
      }
    }
    toolParamsByIndex[idx] = newParams
  },
  { immediate: true }
)

watch(toolParamsByIndex, (params) => {
  for (const [idxStr, paramMap] of Object.entries(params)) {
    const idx = parseInt(idxStr)
    if (props.operations.callTools[idx]) {
      props.operations.callTools[idx]!.parameters = { ...paramMap }
    }
  }
}, { deep: true })

function getArrayValue(paramName: string): any[] {
  const idx = selectedCallToolIndex.value
  if (idx < 0 || !toolParamsByIndex[idx]) return []
  const params = toolParamsByIndex[idx]!
  if (!Array.isArray(params[paramName])) params[paramName] = []
  return params[paramName]
}

function addArrayItem(paramName: string, paramType: string) {
  const idx = selectedCallToolIndex.value
  if (idx < 0 || !toolParamsByIndex[idx]) return
  const params = toolParamsByIndex[idx]!
  if (!Array.isArray(params[paramName])) params[paramName] = []
  if (paramType === 'string[]') params[paramName].push('')
  else if (paramType === 'number[]') params[paramName].push(0)
  else if (paramType === 'boolean[]') params[paramName].push(false)
  else if (paramType === 'object[]') params[paramName].push('{}')
  else if (paramType === 'audio[]') params[paramName].push(null)
}

function removeArrayItem(paramName: string, itemIndex: number) {
  const idx = selectedCallToolIndex.value
  if (idx < 0 || !toolParamsByIndex[idx]) return
  const params = toolParamsByIndex[idx]!
  if (Array.isArray(params[paramName])) params[paramName].splice(itemIndex, 1)
}

function handleAudioUpload(event: Event, paramName: string) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const idx = selectedCallToolIndex.value
  if (idx < 0 || !toolParamsByIndex[idx]) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    const mimeType = parts[0]!.match(/:(.*?);/)?.[1] || 'audio/mpeg'
    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'
    toolParamsByIndex[idx]![paramName] = { data: parts[1]!, format, mimeType, metadata: {} }
  }
  reader.readAsDataURL(file)
}

function handleAudioArrayUpload(event: Event, paramName: string, itemIndex: number) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const idx = selectedCallToolIndex.value
  if (idx < 0 || !toolParamsByIndex[idx]) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    const mimeType = parts[0]!.match(/:(.*?);/)?.[1] || 'audio/mpeg'
    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'
    const params = toolParamsByIndex[idx]!
    if (!Array.isArray(params[paramName])) params[paramName] = []
    params[paramName][itemIndex] = { data: parts[1]!, format, mimeType, metadata: {} }
  }
  reader.readAsDataURL(file)
}

function addVariableModification() {
  props.operations.modifyVariables.modifications.push({ variableName: '', operation: 'set', value: '' })
}

function removeVariableModification(index: number) {
  props.operations.modifyVariables.modifications.splice(index, 1)
}

function addProfileModification() {
  props.operations.modifyUserProfile.modifications.push({ fieldName: '', operation: 'set', value: '' })
}

function removeProfileModification(index: number) {
  props.operations.modifyUserProfile.modifications.splice(index, 1)
}

function addPrescriptedResponse() {
  props.operations.generateResponse.prescriptedResponses.push('')
}

function removePrescriptedResponse(index: number) {
  props.operations.generateResponse.prescriptedResponses.splice(index, 1)
}

const stageVariablesWithTypes = computed(() => {
  return props.stageVariables?.map(v => ({
    name: v.name,
    type: v.type,
    displayType: getTypeDisplayName(v.type)
  })) ?? []
})

const imageVariables = computed(() => props.stageVariables?.filter(v => v.type === 'image' && !v.isArray) ?? [])
const imageArrayVariables = computed(() => props.stageVariables?.filter(v => v.type === 'image[]') ?? [])

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

const openVariableDropdown = ref<number | null>(null)

function toggleVariableDropdown(index: number) {
  openVariableDropdown.value = openVariableDropdown.value === index ? null : index
}

function selectStageVariable(modIndex: number, variableName: string) {
  props.operations.modifyVariables.modifications[modIndex]!.variableName = variableName
  openVariableDropdown.value = null
}
</script>

<template>
  <div class="flex h-full bg-white dark:bg-gray-800">
    <!-- Left Panel: Effects List -->
    <div class="w-52 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900/50">
      <div class="flex-1 overflow-y-auto">
        <div
          v-if="effectsList.length === 0"
          class="p-4 text-sm text-gray-400 dark:text-gray-500 text-center mt-6"
        >
          No effects added yet
        </div>
        <ul v-else class="py-1">
          <li v-for="effect in effectsList" :key="effect.id">
            <div
              class="flex items-center gap-1 px-3 py-2 cursor-pointer select-none group border-l-2"
              :class="selectedEffectId === effect.id
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400'
                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
              @click="selectedEffectId = effect.id"
            >
              <span
                class="text-sm flex-1 truncate"
                :class="selectedEffectId === effect.id
                  ? 'text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300'"
              >
                {{ effect.label }}
              </span>
              <button
                type="button"
                @click.stop="removeEffect(effect.id)"
                class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity"
                title="Remove effect"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Add Effect Footer -->
      <div class="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="relative">
          <button
            type="button"
            class="w-full btn-secondary text-sm flex items-center justify-center gap-1.5"
            @click="showAddDropdown = !showAddDropdown"
          >
            <Plus :size="14" />
            Add Effect
          </button>
          <div v-if="showAddDropdown" class="fixed inset-0 z-40" @click="showAddDropdown = false"></div>
          <div
            v-if="showAddDropdown"
            class="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto"
          >
            <button
              v-for="effect in addableEffects"
              :key="effect.key"
              type="button"
              @click="addSingleEffect(effect.key)"
              class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {{ effect.label }}
            </button>
            <div v-if="addableEffects.length > 0" class="my-1 border-t border-gray-200 dark:border-gray-700"></div>
            <button
              type="button"
              @click="addToolCall()"
              class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Call Tool
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Effect Editor -->
    <div class="flex-1 min-w-0 overflow-y-auto px-6 py-4">
      <!-- Empty state -->
      <div v-if="!selectedEffectId" class="flex items-center justify-center h-full min-h-[20rem]">
        <p class="text-sm text-gray-400 dark:text-gray-500">
          Select an effect from the list, or add a new one.
        </p>
      </div>

      <!-- Generate Response Editor -->
      <div v-else-if="selectedEffectType === 'generateResponse'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Response Mode</label>
          <select v-model="operations.generateResponse.responseMode" class="form-select-auto min-w-64">
            <option value="generated">Generated (AI-generated)</option>
            <option value="prescripted">Prescripted (predefined responses)</option>
          </select>
          <p class="form-help-text">How the response should be produced</p>
        </div>

        <template v-if="operations.generateResponse.responseMode === 'prescripted'">
          <div class="form-group">
            <label class="form-label">Selection Strategy</label>
            <select v-model="operations.generateResponse.prescriptedSelectionStrategy" class="form-select-auto min-w-64">
              <option value="random">Random</option>
              <option value="round_robin">Round Robin</option>
            </select>
            <p class="form-help-text">How to pick a response when multiple prescripted responses are provided</p>
          </div>

          <div class="form-group">
            <div class="flex items-center justify-between mb-2">
              <label class="form-label mb-0">Prescripted Responses</label>
              <button type="button" class="btn-secondary" @click="addPrescriptedResponse()">+ Add Response</button>
            </div>
            <p class="form-help-text mb-3">Define the predefined responses to choose from</p>
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

      <!-- End Conversation Editor -->
      <div v-else-if="selectedEffectType === 'endConversation'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Reason <span class="text-gray-500">(optional)</span></label>
          <input
            v-model="operations.endConversation.reason"
            type="text"
            placeholder="User completed the flow"
            class="form-input"
          />
          <p class="form-help-text">Optional reason for ending the conversation</p>
        </div>
      </div>

      <!-- Abort Conversation Editor -->
      <div v-else-if="selectedEffectType === 'abortConversation'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Reason <span class="text-gray-500">(optional)</span></label>
          <input
            v-model="operations.abortConversation.reason"
            type="text"
            placeholder="Safety violation detected"
            class="form-input"
          />
          <p class="form-help-text">Optional reason for aborting the conversation</p>
        </div>
      </div>

      <!-- Go To Stage Editor -->
      <div v-else-if="selectedEffectType === 'goToStage'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Target Stage <span class="required">*</span></label>
          <select
            v-model="operations.goToStage.stageId"
            :required="operations.goToStage.enabled"
            class="form-select-auto min-w-64"
          >
            <option value="">Select a stage...</option>
            <option v-for="stage in availableStages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
          </select>
          <p class="form-help-text">The stage to navigate to when this action is triggered</p>
        </div>
      </div>

      <!-- Modify User Input Editor -->
      <div v-else-if="selectedEffectType === 'modifyUserInput'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Template <span class="required">*</span></label>
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

      <!-- Modify Variables Editor -->
      <div v-else-if="selectedEffectType === 'modifyVariables'" class="space-y-6">
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
                  <input
                    v-model="mod.variableName"
                    type="text"
                    placeholder="cart_total"
                    class="form-input font-mono text-sm flex-1"
                  />
                  <div v-if="stageVariables.length > 0" class="relative">
                    <button
                      type="button"
                      @click.stop="toggleVariableDropdown(index)"
                      class="btn-secondary mt-0.5"
                      title="Select from defined variables"
                    >
                      <MoreHorizontal :size="16" />
                    </button>
                    <div v-if="openVariableDropdown === index" class="fixed inset-0 z-40" @click="openVariableDropdown = null"></div>
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

            <button type="button" @click="addVariableModification" class="btn-secondary w-full">
              + Add Modification
            </button>
          </div>
        </div>
      </div>

      <!-- Modify User Profile Editor -->
      <div v-else-if="selectedEffectType === 'modifyUserProfile'" class="space-y-6">
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
                <input v-model="mod.fieldName" type="text" placeholder="email" class="form-input font-mono text-sm" />
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

            <button type="button" @click="addProfileModification" class="btn-secondary w-full">
              + Add Modification
            </button>
          </div>
        </div>
      </div>

      <!-- Change Visibility Editor -->
      <div v-else-if="selectedEffectType === 'changeVisibility'" class="space-y-6">
        <div class="form-group">
          <label class="form-label">Visibility <span class="required">*</span></label>
          <select v-model="operations.changeVisibility.visibility" class="form-select-auto min-w-48">
            <option value="always">Always</option>
            <option value="stage">Stage only</option>
            <option value="never">Never</option>
            <option value="conditional">Conditional</option>
          </select>
          <p class="form-help-text">
            <template v-if="operations.changeVisibility.visibility === 'always'">Always visible regardless of context</template>
            <template v-else-if="operations.changeVisibility.visibility === 'stage'">Visible only while in the current stage</template>
            <template v-else-if="operations.changeVisibility.visibility === 'never'">Never visible</template>
            <template v-else>Visible based on a JavaScript condition expression</template>
          </p>
        </div>

        <div v-if="operations.changeVisibility.visibility === 'conditional'" class="form-group">
          <label class="form-label">Condition <span class="required">*</span></label>
          <input
            v-model="operations.changeVisibility.condition"
            type="text"
            placeholder="vars.count > 0"
            class="form-input font-mono"
          />
          <p class="form-help-text">JavaScript expression evaluated against the conversation context; must return a boolean</p>
        </div>
      </div>

      <!-- Call Tool Editor -->
      <div
        v-else-if="selectedEffectType === 'callTool' && currentCallTool !== null"
        class="space-y-6"
      >
        <div class="form-group">
          <label class="form-label">Tool <span class="required">*</span></label>
          <select
            v-model="currentCallTool!.toolId"
            class="form-select-auto"
          >
            <option value="">Select a tool...</option>
            <option v-for="tool in availableTools" :key="tool.id" :value="tool.id">{{ tool.name }}</option>
          </select>
          <p v-if="currentToolObj?.description" class="text-sm text-gray-600 mt-2 dark:text-gray-400">
            {{ currentToolObj.description }}
          </p>
        </div>

        <div v-if="currentToolObj && currentToolObj.parameters.length > 0" class="space-y-4">
          <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">Tool Parameters</h3>

            <div v-for="param in currentToolObj.parameters" :key="param.name" class="form-group">
              <label class="form-label text-sm">
                {{ param.name }}
                <span v-if="param.required" class="required">*</span>
                <span v-else class="text-gray-500 text-xs ml-1">(optional)</span>
              </label>

              <input
                v-if="param.type === 'string'"
                v-model="currentParams[param.name]"
                type="text"
                :required="param.required"
                :placeholder="param.description"
                class="form-input text-sm"
              />

              <input
                v-else-if="param.type === 'number'"
                v-model.number="currentParams[param.name]"
                type="number"
                :required="param.required"
                :placeholder="param.description"
                class="form-input text-sm"
              />

              <label v-else-if="param.type === 'boolean'" class="flex items-center cursor-pointer">
                <input
                  v-model="currentParams[param.name]"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ param.description }}</span>
              </label>

              <div v-else-if="param.type === 'object'" class="space-y-1">
                <textarea
                  v-model="currentParams[param.name]"
                  :required="param.required"
                  :placeholder="param.description + ' (JSON format)'"
                  class="form-textarea text-sm font-mono"
                  rows="4"
                />
                <p class="text-xs text-gray-500">Enter a valid JSON object or use Handlebars syntax (e.g., <code>&#123;&#123;variable&#125;&#125;</code>)</p>
              </div>

              <div v-else-if="param.type === 'image'" class="space-y-2">
                <select
                  v-model="currentParams[param.name]"
                  class="form-select text-sm"
                  :required="param.required"
                >
                  <option value="">Select image variable...</option>
                  <option v-for="variable in imageVariables" :key="variable.name" :value="`{{vars.${variable.name}}}`">
                    {{ variable.name }}
                  </option>
                </select>
                <p class="text-xs text-gray-500">{{ param.description }} - Select a stage variable of type image</p>
              </div>

              <div v-else-if="param.type === 'audio'" class="space-y-2">
                <input
                  type="file"
                  accept="audio/*"
                  @change="handleAudioUpload($event, param.name)"
                  class="form-input text-sm"
                  :required="param.required"
                />
                <div v-if="currentParams[param.name]" class="mt-2">
                  <audio
                    controls
                    :src="`data:${currentParams[param.name].mimeType};base64,${currentParams[param.name].data}`"
                    class="w-full max-w-md"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <p class="text-xs text-gray-500">{{ param.description }}</p>
              </div>

              <div v-else-if="param.type === 'image[]'" class="space-y-2">
                <select
                  v-model="currentParams[param.name]"
                  class="form-select text-sm"
                  :required="param.required"
                >
                  <option value="">Select image array variable...</option>
                  <option v-for="variable in imageArrayVariables" :key="variable.name" :value="`{{vars.${variable.name}}}`">
                    {{ variable.name }}
                  </option>
                </select>
                <p class="text-xs text-gray-500">{{ param.description }} - Select a stage variable of type image[]</p>
              </div>

              <div v-else-if="param.type.endsWith('[]')" class="space-y-2">
                <div
                  v-for="(_item, itemIdx) in getArrayValue(param.name)"
                  :key="itemIdx"
                  class="flex gap-2"
                >
                  <input
                    v-if="param.type === 'string[]'"
                    v-model="currentParams[param.name][itemIdx]"
                    type="text"
                    :placeholder="`${param.description} (item ${itemIdx + 1})`"
                    class="form-input text-sm flex-1"
                  />
                  <input
                    v-else-if="param.type === 'number[]'"
                    v-model.number="currentParams[param.name][itemIdx]"
                    type="number"
                    :placeholder="`${param.description} (item ${itemIdx + 1})`"
                    class="form-input text-sm flex-1"
                  />
                  <label v-else-if="param.type === 'boolean[]'" class="flex items-center cursor-pointer flex-1">
                    <input
                      v-model="currentParams[param.name][itemIdx]"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Item {{ itemIdx + 1 }}</span>
                  </label>
                  <textarea
                    v-else-if="param.type === 'object[]'"
                    v-model="currentParams[param.name][itemIdx]"
                    :placeholder="`${param.description} (item ${itemIdx + 1}, JSON format)`"
                    class="form-textarea text-sm font-mono flex-1"
                    rows="3"
                  />
                  <div v-else-if="param.type === 'audio[]'" class="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="audio/*"
                      @change="handleAudioArrayUpload($event, param.name, itemIdx)"
                      class="form-input text-sm"
                    />
                    <div v-if="currentParams[param.name][itemIdx]" class="mt-2">
                      <audio
                        controls
                        :src="`data:${currentParams[param.name][itemIdx].mimeType};base64,${currentParams[param.name][itemIdx].data}`"
                        class="w-full max-w-md"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeArrayItem(param.name, itemIdx)"
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

              <p class="text-xs text-gray-500 mt-1">{{ param.description }} ({{ param.type }})</p>
            </div>
          </div>
        </div>

        <div
          v-else-if="currentToolObj && currentToolObj.parameters.length === 0"
          class="text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          This tool doesn't require any parameters.
        </div>

        <div
          v-else-if="!currentToolObj && availableTools.length > 0"
          class="text-sm text-gray-500 dark:text-gray-400 py-4"
        >
          Select a tool to configure its parameters.
        </div>

        <div
          v-else-if="availableTools.length === 0"
          class="text-sm text-gray-500 dark:text-gray-400 py-4 border border-gray-200 rounded-lg p-4 dark:border-gray-700"
        >
          <p class="font-medium mb-1">No tools available</p>
          <p class="text-xs">Create tools for this project first before using the Call Tool effect.</p>
        </div>
      </div>
    </div>
  </div>
</template>
