<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, Trash2, CheckCircle, Circle } from 'lucide-vue-next'
import type { StageAction, ParsedError } from '@/api/types'
import StageActionModal from '@/components/modals/StageActionModal.vue'

const LIFECYCLE_ACTIONS = {
  ON_ENTER: '__on_enter',
  ON_LEAVE: '__on_leave',
  ON_FALLBACK: '__on_fallback',
} as const

const LIFECYCLE_ACTION_INFO = {
  [LIFECYCLE_ACTIONS.ON_ENTER]: {
    name: 'On Enter',
    description: 'Executes when entering this stage',
    context: 'on_enter',
  },
  [LIFECYCLE_ACTIONS.ON_LEAVE]: {
    name: 'On Leave',
    description: 'Executes when leaving this stage',
    context: 'on_leave',
  },
  [LIFECYCLE_ACTIONS.ON_FALLBACK]: {
    name: 'On Fallback',
    description: 'Executes when no action matches user input',
    context: 'on_fallback',
  },
} as const

function isLifecycleAction(key: string): boolean {
  return Object.values(LIFECYCLE_ACTIONS).includes(key as any)
}

const model = defineModel<Record<string, StageAction>>({ required: true })

const props = defineProps<{
  stageVariables: any[]
  projectConstants: Record<string, any>
  isLoading: boolean
}>()

const showActionModal = ref(false)
const editingActionKey = ref<string | null>(null)
const editingAction = ref<StageAction | null>(null)
const actionModalError = ref<ParsedError | null>(null)

const actionParametersForCompletion = computed(() => {
  const result: Record<string, any[]> = {}
  for (const [key, action] of Object.entries(model.value)) {
    if (!isLifecycleAction(key) && action.parameters && action.parameters.length > 0) {
      result[action.name] = action.parameters
    }
  }
  return result
})

const lifecycleActions = computed(() => {
  return Object.values(LIFECYCLE_ACTIONS).map(key => ({
    key,
    info: LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO],
    action: model.value[key] || null,
    isConfigured: !!model.value[key],
  }))
})

function configureLifecycleAction(key: string) {
  editingActionKey.value = key
  editingAction.value = model.value[key] || null
  showActionModal.value = true
}

function clearLifecycleAction(key: string) {
  const info = LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO]
  if (confirm(`Are you sure you want to clear the "${info.name}" action?`)) {
    const newActions = { ...model.value }
    delete newActions[key]
    model.value = newActions
  }
}

function handleActionSave(data: { key: string; action: StageAction }) {
  const newActions = { ...model.value }
  newActions[data.key] = data.action
  model.value = newActions
  showActionModal.value = false
  actionModalError.value = null
}
</script>

<template>
  <div class="mb-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lifecycle Actions</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Special system actions that execute at specific lifecycle points in the conversation flow.
      These are optional but provide powerful hooks for initialization, cleanup, and fallback handling.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div
      v-for="lifecycle in lifecycleActions"
      :key="lifecycle.key"
      class="lifecycle-action-card"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-gray-900 dark:text-white">{{ lifecycle.info.name }}</h4>
            <span v-if="lifecycle.isConfigured" class="badge-configured">
              <CheckCircle class="w-3 h-3 mr-1 inline-block" />
              Configured
            </span>
            <span v-else class="badge-unconfigured">
              <Circle class="w-3 h-3 mr-1 inline-block" />
              Not Set
            </span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400">{{ lifecycle.info.description }}</p>
        </div>
      </div>

      <div v-if="lifecycle.action" class="mb-3 text-sm">
        <p class="text-gray-700 dark:text-gray-300 font-medium">{{ lifecycle.action.name }}</p>
        <p class="text-gray-500 text-xs mt-1">
          {{ lifecycle.action.effects?.length || 0 }} effect(s)
        </p>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          @click="configureLifecycleAction(lifecycle.key)"
          class="btn-secondary btn-sm flex-1"
          :disabled="isLoading"
        >
          <Settings class="w-3 h-3 mr-1 inline-block" />
          {{ lifecycle.isConfigured ? 'Edit' : 'Configure' }}
        </button>
        <button
          v-if="lifecycle.isConfigured"
          type="button"
          @click="clearLifecycleAction(lifecycle.key)"
          class="btn-danger btn-sm"
          :disabled="isLoading"
          title="Clear action"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>

  <StageActionModal
    v-if="showActionModal"
    :action="editingAction"
    :editing-key="editingActionKey"
    :is-lifecycle-action="true"
    :stage-variables="stageVariables"
    :action-parameters="actionParametersForCompletion"
    :project-constants="projectConstants"
    :error="actionModalError"
    @close="showActionModal = false; actionModalError = null"
    @save="handleActionSave"
  />
</template>
