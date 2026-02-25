<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalActionsStore, useClassifiersStore, useStagesStore, useToolsStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { GlobalActionResponse } from '@/api/types'
import ActionForm from '@/components/ActionForm.vue'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations, type ActionOperations } from '@/composables'

const route = useRoute()
const router = useRouter()
const globalActionsStore = useGlobalActionsStore()
const classifiersStore = useClassifiersStore()
const stagesStore = useStagesStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)

type TabType = 'basic' | 'trigger' | 'effects' | 'goToStage' | 'runScript' | 'modifyUserInput' | 'modifyVariables' | 'modifyUserProfile' | 'callTool' | 'callWebhook' | 'metadata'
const activeTab = reactive({ value: 'basic' as TabType })

// Separate fields not in ActionFormData
const actionId = ref('')
const actionMetadata = ref<any>({})

const form = ref({
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  triggerOnTransformation: false,
  watchedVariables: [] as Array<{ path: string; changeType: 'new' | 'changed' | 'removed' }>,
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

const projectClassifiers = computed(() => 
  classifiersStore.items.filter(c => c.projectId === projectId.value)
)

const projectStages = computed(() => 
  stagesStore.items.filter(s => s.projectId === projectId.value)
)

const projectTools = computed(() => 
  toolsStore.items.filter(t => t.projectId === projectId.value)
)

// Lifecycle
onMounted(async () => {
  // Load classifiers and stages for dropdowns
  await classifiersStore.fetchAll({ filters: { projectId: projectId.value } })
  await stagesStore.fetchAll({ filters: { projectId: projectId.value } })
  await toolsStore.fetchAll({ filters: { projectId: projectId.value } })
  
  if (isEditMode.value) {
    await loadGlobalAction()
  }
})

// Methods
async function loadGlobalAction() {
  if (!globalActionId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentGlobalAction.value = await globalActionsStore.fetchById(globalActionId.value)
    if (currentGlobalAction.value) {
      actionId.value = currentGlobalAction.value.id
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
    error.value = err.response?.data?.message || 'Failed to load global action'
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
      const updated = await globalActionsStore.update(currentGlobalAction.value.id, {
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
        metadata: actionMetadata.value
      })
      
      // Update currentGlobalAction with the response to get the new version
      currentGlobalAction.value = updated
    } else {
      // Create new global action
      const createData: any = {
        projectId: projectId.value,
        name: form.value.name,
        effects: effectsArray,
        metadata: actionMetadata.value
      }

      // Only include id if it's provided
      if (actionId.value) {
        createData.id = actionId.value
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

      const created = await globalActionsStore.create(createData)
      
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
  <div class="flex flex-col h-full md:border md:border-gray-200 md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to global actions">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Edit Global Action' : 'New Global Action' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isEditMode ? `Editing: ${currentGlobalAction?.name}` : 'Create a new system-wide action' }}
          </p>
        </div>
      </div>
      <button 
        @click="handleSubmit" 
        :disabled="isLoading || showSuccess"
        class="btn-primary"
      >
        <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
        <Save v-else class="inline-block mr-2 w-4 h-4" />
        {{ showSuccess ? 'Saved!' : (isEditMode ? 'Save Changes' : 'Create Action') }}
      </button>
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

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-0 py-4 md:px-8 md:py-6 bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Action ID Field (only for create mode) -->
          <div v-show="activeTab.value === 'basic' && !isEditMode" class="form-group">
            <label class="form-label">
              Action ID <span class="text-gray-500">(optional, auto-generated)</span>
            </label>
            <input
              v-model="actionId"
              type="text"
              placeholder="global_escalate"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              Custom ID for the global action. Leave empty to auto-generate.
            </p>
          </div>

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
            :show-tabs="true"
            :show-key-field="false"
            :show-parameters="true"
            :show-metadata="isEditMode"
            :metadata-fields="metadataFields"
          />
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
