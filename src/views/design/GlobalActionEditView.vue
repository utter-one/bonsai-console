<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalActionsStore, useClassifiersStore, useStagesStore, useToolsStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Check, ShieldAlert } from 'lucide-vue-next'
import type { GlobalActionResponse } from '@/api/types'
import ActionForm from '@/components/ActionForm.vue'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations, type ActionOperations } from '@/composables'
import TagsEditor from '@/components/TagsEditor.vue'

const route = useRoute()
const router = useRouter()
const globalActionsStore = useGlobalActionsStore()
const classifiersStore = useClassifiersStore()
const stagesStore = useStagesStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

const SPECIAL_ACTION_NAMES: Record<string, string> = {
  '__moderation_blocked': 'Moderation Blocked',
  '__conversation_start': 'Conversation Start',
  '__conversation_resume': 'Conversation Resume',
  '__conversation_end': 'Conversation End',
  '__conversation_abort': 'Conversation Abort',
  '__conversation_failed': 'Conversation Failed',
}

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const specialActionNotFound = ref(false)

type TabType = 'basic' | 'trigger' | 'effects' | 'metadata'
const activeTab = reactive({ value: 'basic' as TabType })

// Separate fields not in ActionFormData
const actionTags = ref<string[]>([])
const actionMetadata = ref<any>({})

const form = ref({
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  triggerOnTransformation: false,
  watchedVariables: [] as Array<{ path: string; changeType: 'new' | 'changed' | 'removed' | 'any' }>,
  classificationTrigger: '',
  overrideClassifierId: '',
  examples: '',
  parameters: [] as Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
    description: string
    required: boolean
  }>
})

const operations = ref<ActionOperations>(createDefaultOperations())

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const globalActionId = computed(() => route.params.globalActionId as string | undefined)
const isEditMode = computed(() => !!globalActionId.value)
const currentGlobalAction = ref<GlobalActionResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentGlobalAction)
const isReadOnly = computed(() => projectIsArchived.value || !!currentGlobalAction.value?.archived)

const isSpecialAction = computed(() => (globalActionId.value || '').startsWith('__'))

const specialActionDisplayName = computed(() => SPECIAL_ACTION_NAMES[globalActionId.value || ''] ?? null)

const projectClassifiers = computed(() => 
  classifiersStore.items.filter(() => true)
)

const projectStages = computed(() => 
  stagesStore.items.filter(() => true)
)

const projectTools = computed(() => 
  toolsStore.items.filter(() => true)
)

// Lifecycle
onMounted(async () => {
  // Load classifiers and stages for dropdowns
  await classifiersStore.fetchAll(projectId.value)
  await stagesStore.fetchAll(projectId.value)
  await toolsStore.fetchAll(projectId.value)
  await projectsStore.fetchById(projectId.value)
  
  if (isEditMode.value) {
    await loadGlobalAction()
  }
})

const projectConstants = computed(() => projectsStore.currentItem?.constants ?? {})

// Methods
async function loadGlobalAction() {
  if (!globalActionId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentGlobalAction.value = await globalActionsStore.fetchById(projectId.value, globalActionId.value)
    if (currentGlobalAction.value) {
      actionTags.value = currentGlobalAction.value.tags || []
      actionMetadata.value = currentGlobalAction.value.metadata || {}
      form.value = {
        name: currentGlobalAction.value.name,
        condition: currentGlobalAction.value.condition || '',
        triggerOnUserInput: currentGlobalAction.value.triggerOnUserInput,
        triggerOnClientCommand: currentGlobalAction.value.triggerOnClientCommand,
        triggerOnTransformation: false,
        watchedVariables: [],
        classificationTrigger: currentGlobalAction.value.classificationTrigger || '',
        overrideClassifierId: currentGlobalAction.value.overrideClassifierId || '',
        examples: currentGlobalAction.value.examples?.join('\n') || '',
        parameters: currentGlobalAction.value.parameters || []
      }

      // Load effects from action
      loadEffectsIntoOperations(currentGlobalAction.value.effects || [], operations.value)
    }
  } catch (err: any) {
    if (err.response?.status === 404 && (globalActionId.value || '').startsWith('__')) {
      specialActionNotFound.value = true
    } else {
      error.value = err.response?.data?.message || 'Failed to load global action'
    }
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    // Build effects array from enabled effects
    const { effects: effectsArray, error: buildError } = buildEffectsFromOperations(operations.value)
    
    if (buildError) {
      error.value = buildError
      isLoading.value = false
      return
    }

    if (isEditMode.value && currentGlobalAction.value) {
      // Update existing global action
      const updated = await globalActionsStore.update(projectId.value, currentGlobalAction.value.id, {
        version: currentGlobalAction.value.version,
        name: form.value.name,
        condition: form.value.condition || null,
        triggerOnUserInput: form.value.triggerOnUserInput,
        triggerOnClientCommand: form.value.triggerOnClientCommand,
        classificationTrigger: form.value.classificationTrigger || null,
        overrideClassifierId: form.value.overrideClassifierId || null,
        parameters: form.value.parameters,
        effects: effectsArray,
        examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : [],
        tags: actionTags.value,
        metadata: actionMetadata.value
      })
      
      // Update currentGlobalAction with the response to get the new version
      currentGlobalAction.value = updated
    } else {
      // Create new global action
      const createData: any = {
        name: form.value.name,
        effects: effectsArray,
        metadata: actionMetadata.value
      }

      // Only include optional fields if they have values
      if (form.value.condition) {
        createData.condition = form.value.condition
      }
      
      createData.triggerOnUserInput = form.value.triggerOnUserInput
      createData.triggerOnClientCommand = form.value.triggerOnClientCommand

      if (form.value.classificationTrigger) {
        createData.classificationTrigger = form.value.classificationTrigger
      }

      if (form.value.overrideClassifierId) {
        createData.overrideClassifierId = form.value.overrideClassifierId
      }

      if (form.value.examples) {
        createData.examples = form.value.examples.split('\n').filter((e: string) => e.trim())
      }

      if (form.value.parameters && form.value.parameters.length > 0) {
        createData.parameters = form.value.parameters
      }

      if (actionTags.value.length > 0) {
        createData.tags = actionTags.value
      }

      const created = await globalActionsStore.create(projectId.value, createData)
      
      // Update currentGlobalAction with the created action
      currentGlobalAction.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.globalActions.edit',
        params: { projectId: projectId.value, globalActionId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} global action`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.globalActions', params: { projectId: projectId.value } })
}

async function initializeSpecialAction() {
  const id = globalActionId.value!
  const name = SPECIAL_ACTION_NAMES[id] || id
  isLoading.value = true
  error.value = null
  try {
    const created = await globalActionsStore.create(projectId.value, {
      id,
      name,
      effects: [],
      metadata: {}
    })
    currentGlobalAction.value = created
    actionTags.value = []
    actionMetadata.value = {}
    form.value = { ...form.value, name: created.name }
    specialActionNotFound.value = false
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to initialize action'
  } finally {
    isLoading.value = false
  }
}

const metadataFields = computed(() => {
  if (!currentGlobalAction.value) return []
  return [
    { label: 'Action ID', value: currentGlobalAction.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentGlobalAction.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentGlobalAction.value.version },
    { label: 'Created', value: currentGlobalAction.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentGlobalAction.value.updatedAt, format: 'date' as const },
  ]
})

</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to global actions">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ (isEditMode && !specialActionNotFound)
                ? (specialActionDisplayName ? `Edit ${specialActionDisplayName}` : 'Edit Global Action')
                : (specialActionDisplayName ? `Set Up ${specialActionDisplayName}` : 'New Global Action') }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ (isEditMode && !specialActionNotFound)
                ? `Editing: ${currentGlobalAction?.name}`
                : (specialActionDisplayName ? `Configure the ${specialActionDisplayName} response` : 'Create a new system-wide action') }}
          </p>
        </div>
      </div>
      <button v-if="isReadOnly" class="btn-secondary" disabled>Read-only</button>
      <button v-else-if="!specialActionNotFound"
        @click="handleSubmit" 
        :disabled="isLoading || showSuccess"
        class="btn-primary"
      >
        <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
        <Save v-else class="inline-block mr-2 w-4 h-4" />
        {{ showSuccess ? 'Saved!' : (isEditMode ? 'Save Changes' : 'Create Action') }}
      </button>
    </div>

    <div v-if="isReadOnly" class="alert-warning mb-4">
      This global action is read-only because the project is archived.
    </div>
    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mx-8 mt-4 dark:bg-red-900/30 dark:border-red-500">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700 dark:text-red-200">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Special Action Not Found -->
    <div v-if="specialActionNotFound" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <ShieldAlert class="w-12 h-12 text-amber-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Not Configured</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        The <strong>{{ specialActionDisplayName || globalActionId }}</strong> action has not been set up for this project yet.
      </p>
      <button @click="initializeSpecialAction" class="btn-primary">
        Initialize {{ specialActionDisplayName || 'Special Action' }}
      </button>
    </div>

    <!-- Form Content -->
    <div v-else class="flex-1 overflow-y-auto px-0 pb-4 bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Use shared ActionForm component with all tabs including metadata -->
          <ActionForm
            :form="form"
            :parameters="form.parameters"
            :operations="operations"
            :active-tab="activeTab"
            :available-classifiers="projectClassifiers"
            :available-stages="projectStages"
            :available-tools="projectTools"
            :stage-variables="[]"
            :action-parameters="{}"
            :project-constants="projectConstants"
            :show-tabs="true"
            :show-trigger="!isSpecialAction"
            :show-parameters="!isSpecialAction"
            :show-metadata="isEditMode"
            :metadata-fields="metadataFields"
          />

          <!-- Tags Field -->
          <div v-show="activeTab.value === 'basic'" class="px-6">
            <TagsEditor v-model="actionTags" />
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
</style>
