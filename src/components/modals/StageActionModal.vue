<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-6xl fixed-height-modal" @click.stop>
      <h2 class="modal-header">
        {{ editingKey ? 'Edit Action' : 'New Action' }}
      </h2>

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
          :show-key-field="true"
          :action-key="actionKey"
          @update:action-key="actionKey = $event"
          :is-key-disabled="!!editingKey"
          :show-parameters="true"
          :show-tabs="true"
        />

        <div class="modal-footer border-t border-gray-200 mt-auto pt-4">
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
import { useClassifiersStore } from '@/stores'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations } from '@/composables'
import ActionForm from '@/components/ActionForm.vue'
import type { StageAction } from '@/api/types'

const route = useRoute()
const classifiersStore = useClassifiersStore()

const props = defineProps<{
  action: StageAction | null
  editingKey: string | null
}>()

const projectClassifiers = computed(() => {
  const projectId = route.params.projectId as string
  return classifiersStore.items.filter(c => c.projectId === projectId)
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
  template: '',
  examples: ''
})

const operations = ref(createDefaultOperations())

const parameters = ref<Array<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'boolean[]'
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
      template: action.template || '',
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
    actionKey.value = ''
    form.value = {
      name: '',
      condition: '',
      triggerOnUserInput: true,
      triggerOnClientCommand: false,
      classificationTrigger: '',
      overrideClassifierId: '',
      template: '',
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
    template: form.value.template || null,
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
