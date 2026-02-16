<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-6xl fixed-height-modal" @click.stop>
      <h2 class="modal-header">
        {{ modalTitle }}
      </h2>
      
      <!-- Lifecycle Action Info -->
      <div v-if="isLifecycleAction" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <strong>Lifecycle Action:</strong> {{ lifecycleInfo }}
        </p>
        <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
          Note: Some effects may be restricted based on the lifecycle context. Trigger settings are not applicable.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col" style="height: calc(100% - 80px);">
        <!-- Use shared ActionForm component -->
        <ActionForm
          :model-value="form"
          @update:model-value="form = $event"
          :operations="operations"
          @update:operations="operations = $event"
          :parameters="parameters"
          @update:parameters="parameters = $event"
          :active-tab="activeTab"
          @update:active-tab="activeTab = $event as TabType"
          :available-classifiers="projectClassifiers"
          :available-stages="projectStages"
          :available-tools="projectTools"
          :show-key-field="!isLifecycleAction"
          :action-key="actionKey"
          @update:action-key="actionKey = $event"
          :is-key-disabled="!!editingKey"
          :show-parameters="!isLifecycleAction"
          :show-trigger="!isLifecycleAction"
          :show-tabs="true"
        />

        <div class="modal-footer border-t border-gray-200 mt-auto py-4">
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
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClassifiersStore, useStagesStore, useToolsStore } from '@/stores'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations } from '@/composables'
import ActionForm from '@/components/ActionForm.vue'
import type { StageAction } from '@/api/types'

const route = useRoute()
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
}>()

const projectClassifiers = computed(() => {
  const projectId = route.params.projectId as string
  return classifiersStore.items.filter(c => c.projectId === projectId)
})

const projectStages = computed(() => {
  const projectId = route.params.projectId as string
  return stagesStore.items.filter(s => s.projectId === projectId)
})

const projectTools = computed(() => {
  const projectId = route.params.projectId as string
  return toolsStore.items.filter(t => t.projectId === projectId)
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

type TabType = 'basic' | 'trigger' | 'parameters' | 'effects' | 'goToStage' | 'runScript' | 'modifyUserInput' | 'modifyVariables' | 'modifyUserProfile' | 'callTool' | 'callWebhook'

const activeTab = ref<TabType>('basic')

// Action key is separate since ActionForm doesn't include it
const actionKey = ref('')

const form = ref({
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  classificationTrigger: '',
  overrideClassifierId: '',
  examples: ''
})

const operations = ref(createDefaultOperations())

const parameters = ref<Array<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]'
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
}
</style>
