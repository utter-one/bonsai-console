<template>
  <div class="modal-overlay">
    <div class="modal-content max-w-6xl fixed-height-modal" @click.stop>
      <div class="modal-header flex items-center justify-between">
        <h2 class="m-0 text-xl font-semibold">{{ modalTitle }}</h2>
        <a
          href="/help/design/actions.html"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 bg-white dark:bg-gray-800 transition-colors"
        >
          <HelpCircle :size="16" />
        </a>
      </div>
      
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
          :show-key-field="!isLifecycleAction"
          :action-key="actionKey"
          :is-key-disabled="!!editingKey"
          :show-parameters="!isLifecycleAction"
          :show-trigger="!isLifecycleAction"
          :show-tabs="true"
        />

        <div class="modal-footer border-t border-gray-200 mt-auto py-0">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ editingKey ? 'Save Changes' : 'Create Action' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue'
import { HelpCircle } from 'lucide-vue-next'
import { useClassifiersStore, useStagesStore, useToolsStore } from '@/stores'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations } from '@/composables'
import ActionForm from '@/components/ActionForm.vue'
import type { StageAction } from '@/api/types'

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
const actionFormRef = ref<any>(null)

type TabType = 'basic' | 'trigger' | 'parameters' | 'effects' | 'goToStage' | 'runScript' | 'modifyUserInput' | 'modifyVariables' | 'modifyUserProfile' | 'callTool' | 'callWebhook'

const activeTab = reactive({ value: 'basic' as TabType })

// Action key is separate since ActionForm doesn't include it
const actionKey = reactive({ value: '' })

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
    actionKey.value = props.editingKey || ''
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
  if (!actionKey.value || !form.value.name) {
    return
  }

  // Always pull the latest value directly from the live editor before building effects.
  // This ensures the code is not empty even if the reactive v-model update was delayed.
  if (operations.value.runScript.enabled && actionFormRef.value?.getRunScriptCode) {
    operations.value.runScript.code = actionFormRef.value.getRunScriptCode()
  }

  // Build effects array using shared utility
  const result = buildEffectsFromOperations(operations.value)

  if (result.error) {
    alert(result.error)
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

<style scoped>
.max-w-6xl {
  max-width: 72rem;
}

.fixed-height-modal {
  height: 90vh;
  max-height: 1200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
