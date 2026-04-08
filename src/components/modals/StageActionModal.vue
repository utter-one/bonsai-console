<template>
  <BaseModal title="" size="full" :fixed-height="true" @close="$emit('close')">
    <template #header>
      <div class="modal-header">
        <h2 class="m-0 text-xl font-semibold">{{ modalTitle }}</h2>
        <a
          href="/help/design/actions.html"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-500 dark:text-blue-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 transition-colors"
        >
          <HelpCircle :size="16" />
        </a>
      </div>
    </template>
      
    <!-- Lifecycle Action Info -->
    <div v-if="isLifecycleAction" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <p class="text-sm text-blue-800 dark:text-blue-300">
        <strong>Lifecycle Action:</strong> {{ lifecycleInfo }}
      </p>
      <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
        Note: Some effects may be restricted based on the lifecycle context. Trigger settings are not applicable.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col flex-1 min-h-0">
      <!-- Use shared ActionForm component -->
      <ActionForm
        ref="actionFormRef"
        :form="form"
        :operations="operations"
        :active-tab="activeTab"
        :parameters="parameters"
        :available-classifiers="projectClassifiers"
        :available-stages="projectStages"
        :available-tools="projectTools"
        :stage-variables="stageVariables"
        :action-parameters="actionParameters"
        :project-constants="projectConstants"
        :show-parameters="!isLifecycleAction"
        :show-trigger="!isLifecycleAction"
        :show-tabs="true"
        :error="displayError"
      />

      <div class="modal-footer">
        <ErrorDisplay :error="displayError" class="flex-1 mr-2" />
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn-primary">
          {{ editingKey ? 'Save Changes' : 'Create Action' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue'
import { HelpCircle } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useClassifiersStore, useStagesStore, useToolsStore } from '@/stores'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations, validateEffects } from '@/composables'
import ActionForm from '@/components/ActionForm.vue'
import type { StageAction, ParsedError, ApiErrorDetail } from '@/api/types'

const classifiersStore = useClassifiersStore()
const stagesStore = useStagesStore()
const toolsStore = useToolsStore()

// Lifecycle action constants (matching StageEditView)
const LIFECYCLE_ACTION_INFO = {
  '__on_enter': {
    name: 'Stage Entry Action',
    description: 'Executes when entering this stage, before enterBehavior',
  },
  '__on_leave': {
    name: 'Stage Exit Action',
    description: 'Executes when leaving this stage, before loading the new stage',
  },
  '__on_fallback': {
    name: 'Fallback Action',
    description: 'Executes when no action matches user input after classification',
  },
} as const

const props = defineProps<{
  action: StageAction | null
  editingKey: string | null
  isLifecycleAction?: boolean
  stageVariables?: any[]
  actionParameters?: Record<string, any[]>
  projectConstants?: Record<string, any>
  error?: ParsedError | null
}>()

const projectClassifiers = computed(() => {
  return classifiersStore.items
})

const projectStages = computed(() => {
  return stagesStore.items
})

const projectTools = computed(() => {
  return toolsStore.items
})

const modalTitle = computed(() => {
  if (props.isLifecycleAction && props.editingKey) {
    const info = LIFECYCLE_ACTION_INFO[props.editingKey as keyof typeof LIFECYCLE_ACTION_INFO]
    return info ? `Configure ${info.name}` : 'Configure Lifecycle Action'
  }
  return props.editingKey ? 'Edit Action' : 'New Action'
})

const lifecycleInfo = computed(() => {
  if (props.isLifecycleAction && props.editingKey) {
    const info = LIFECYCLE_ACTION_INFO[props.editingKey as keyof typeof LIFECYCLE_ACTION_INFO]
    return info?.description || ''
  }
  return ''
})

const emit = defineEmits<{
  close: []
  save: [data: { key: string; action: StageAction }]
}>()

// reference to inner ActionForm for flushing code

type TabType = 'basic' | 'trigger' | 'parameters' | 'effects'

const activeTab = reactive({ value: 'basic' as TabType })

// Action key is managed internally (auto-generated for new actions, fixed for existing)
const actionKey = reactive({ value: '' })

const internalError = ref<ParsedError | null>(null)
const displayError = computed(() => internalError.value || props.error || null)

const form = ref({
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  triggerOnTransformation: false,
      watchedVariables: [] as Array<{ path: string; changeType: 'new' | 'changed' | 'removed' | 'any' }>,
  classificationTrigger: '',
  overrideClassifierId: '',
  examples: ''
})

const operations = ref(createDefaultOperations())

const parameters = ref<Array<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  description: string
  required: boolean
}>>([])

// Initialize form when action prop changes
watch(() => props.action, (action) => {
  internalError.value = null
  if (action && props.editingKey) {
    actionKey.value = props.editingKey
    form.value = {
      name: action.name,
      condition: action.condition || '',
      triggerOnUserInput: action.triggerOnUserInput,
      triggerOnClientCommand: action.triggerOnClientCommand,
      triggerOnTransformation: action.triggerOnTransformation ?? false,
      watchedVariables: action.watchedVariables
        ? Object.entries(action.watchedVariables).map(([path, changeType]) => ({ path, changeType }))
        : [],
      classificationTrigger: action.classificationTrigger || '',
      overrideClassifierId: action.overrideClassifierId || '',
      examples: action.examples?.join('\n') || ''
    }

    // Load parameters from action
    parameters.value = action.parameters ? [...action.parameters] : []

    // Load effects using shared utility
    operations.value = createDefaultOperations()
    if (action.effects) {
      loadEffectsIntoOperations(action.effects, operations.value)
    }
  } else {
    // Reset form for new action
    actionKey.value = props.editingKey || crypto.randomUUID()
    form.value = {
      name: '',
      condition: '',
      // Lifecycle actions don't use triggers
      triggerOnUserInput: props.isLifecycleAction ? false : true,
      triggerOnClientCommand: false,
      triggerOnTransformation: false,
      watchedVariables: [],
      classificationTrigger: '',
      overrideClassifierId: '',
      examples: ''
    }

    // Reset parameters
    parameters.value = []

    // Reset all effects
    operations.value = createDefaultOperations()
  }
}, { immediate: true })

function handleSubmit() {
  internalError.value = null
  const validationDetails: ApiErrorDetail[] = []

  if (!form.value.name.trim()) {
    validationDetails.push({ path: ['name'], message: 'Action name is required.', code: 'too_small' })
  }

  if (form.value.triggerOnTransformation) {
    for (let i = 0; i < form.value.watchedVariables.length; i++) {
      if (!form.value.watchedVariables[i]!.path.trim()) {
        validationDetails.push({ path: ['watchedVariables', i, 'path'], message: `Watched variable ${i + 1}: variable path is required.`, code: 'required' })
      }
    }
  }

  for (let i = 0; i < parameters.value.length; i++) {
    const p = parameters.value[i]!
    if (!p.name.trim()) {
      validationDetails.push({ path: ['parameters', i, 'name'], message: `Parameter ${i + 1}: name is required.`, code: 'required' })
    }
    if (!p.description.trim()) {
      validationDetails.push({ path: ['parameters', i, 'description'], message: `Parameter ${i + 1}: description is required.`, code: 'required' })
    }
  }

  const effectsValidationError = validateEffects(operations.value)
  if (effectsValidationError && effectsValidationError.details?.length) {
    validationDetails.push(...effectsValidationError.details)
  }

  if (validationDetails.length > 0) {
    internalError.value = { message: validationDetails[0]!.message, details: validationDetails }
    return
  }

  // Build effects array using shared utility
  const result = buildEffectsFromOperations(operations.value)

  if (result.error) {
    internalError.value = { message: result.error }
    return
  }

  const action: StageAction = {
    name: form.value.name,
    condition: form.value.condition || null,
    triggerOnUserInput: form.value.triggerOnUserInput,
    triggerOnClientCommand: form.value.triggerOnClientCommand,
    triggerOnTransformation: form.value.triggerOnTransformation || undefined,
    watchedVariables: form.value.triggerOnTransformation && form.value.watchedVariables.length > 0
      ? Object.fromEntries(form.value.watchedVariables.filter(v => v.path).map(v => [v.path, v.changeType]))
      : undefined,
    classificationTrigger: form.value.classificationTrigger || null,
    overrideClassifierId: form.value.overrideClassifierId || null,
    parameters: parameters.value.length > 0 ? parameters.value : [],
    effects: result.effects,
    examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : null,
    metadata: props.action?.metadata || undefined
  }

  emit('save', { key: actionKey.value, action })
}
</script>

