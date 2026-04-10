<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuardrailsStore, useClassifiersStore, useStagesStore, useToolsStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { ApiErrorDetail, GuardrailResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import ActionForm from '@/components/ActionForm.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import { createDefaultOperations, loadEffectsIntoOperations, buildEffectsFromOperations, validateEffects, type ActionOperations } from '@/composables'
import TagsEditor from '@/components/TagsEditor.vue'

const route = useRoute()
const router = useRouter()
const guardrailsStore = useGuardrailsStore()
const classifiersStore = useClassifiersStore()
const stagesStore = useStagesStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)

type TabType = 'basic' | 'trigger' | 'effects' | 'metadata' | 'history'
const activeTab = ref<TabType>('basic')

// Separate fields not in ActionFormData
const guardrailTags = ref<string[]>([])
const guardrailMetadata = ref<any>({})

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
const guardrailId_param = computed(() => route.params.guardrailId as string | undefined)
const isEditMode = computed(() => !!guardrailId_param.value)
const currentGuardrail = ref<GuardrailResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentGuardrail)
const isReadOnly = computed(() => projectIsArchived.value || !!currentGuardrail.value?.archived)

const projectClassifiers = computed(() => classifiersStore.items)
const projectStages = computed(() => stagesStore.items)
const projectTools = computed(() => toolsStore.items)

const projectConstants = computed(() => projectsStore.currentItem?.constants ?? {})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    classifiersStore.fetchAll(projectId.value),
    stagesStore.fetchAll(projectId.value),
    toolsStore.fetchAll(projectId.value),
    projectsStore.fetchById(projectId.value),
  ])

  if (isEditMode.value) {
    await loadGuardrail()
  }
})

// Methods
async function loadGuardrail() {
  if (!guardrailId_param.value) return

  isLoading.value = true
  error.value = null

  try {
    currentGuardrail.value = await guardrailsStore.fetchById(projectId.value, guardrailId_param.value)
    if (currentGuardrail.value) {
      guardrailTags.value = currentGuardrail.value.tags || []
      guardrailMetadata.value = currentGuardrail.value.metadata || {}
      form.value = {
        name: currentGuardrail.value.name,
        condition: currentGuardrail.value.condition || '',
        triggerOnUserInput: true,
        triggerOnClientCommand: false,
        triggerOnTransformation: false,
        watchedVariables: [],
        classificationTrigger: currentGuardrail.value.classificationTrigger || '',
        overrideClassifierId: '',
        examples: currentGuardrail.value.examples?.join('\n') || '',
        parameters: []
      }

      loadEffectsIntoOperations(currentGuardrail.value.effects || [], operations.value)
    }
  } catch (err: any) {
      error.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  const errorDetails: ApiErrorDetail[] = []

  if(!form.value.name.trim())
    errorDetails.push({ path: ['name'], message: 'Name is required', code: 'too_small' })
  
  const effectsValidationError = validateEffects(operations.value)
  if (effectsValidationError)
    errorDetails.push(...(effectsValidationError.details || []))

  if(errorDetails.length > 0) {
    error.value = { message: 'Please fix the errors in the form', details: errorDetails }
    activeTab.value = 'basic'
    return
  }

  isLoading.value = true

  try {
    const { effects: effectsArray, error: buildError } = buildEffectsFromOperations(operations.value)

    if (buildError) {
      error.value = { message: buildError }
      isLoading.value = false
      return
    }

    if (isEditMode.value && currentGuardrail.value) {
      const updated = await guardrailsStore.update(projectId.value, currentGuardrail.value.id, {
        version: currentGuardrail.value.version,
        name: form.value.name,
        condition: form.value.condition || null,
        classificationTrigger: form.value.classificationTrigger || null,
        effects: effectsArray,
        examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : [],
        tags: guardrailTags.value,
        metadata: guardrailMetadata.value
      })

      currentGuardrail.value = updated
    } else {
      const createData: any = {
        name: form.value.name,
        effects: effectsArray,
        metadata: guardrailMetadata.value
      }

      if (form.value.condition) {
        createData.condition = form.value.condition
      }

      if (form.value.classificationTrigger) {
        createData.classificationTrigger = form.value.classificationTrigger
      }

      if (form.value.examples) {
        createData.examples = form.value.examples.split('\n').filter((e: string) => e.trim())
      }

      if (guardrailTags.value.length > 0) {
        createData.tags = guardrailTags.value
      }

      const created = await guardrailsStore.create(projectId.value, createData)
      currentGuardrail.value = created

      await router.push({
        name: 'design.guardrails.edit',
        params: { projectId: projectId.value, guardrailId: created.id }
      })
    }

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.guardrails', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentGuardrail.value) return []
  return [
    { label: 'Guardrail ID', value: currentGuardrail.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentGuardrail.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentGuardrail.value.version },
    { label: 'Created', value: currentGuardrail.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentGuardrail.value.updatedAt, format: 'date' as const },
  ]
})
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to guardrails">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Edit Guardrail' : 'New Guardrail' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isEditMode ? `Editing: ${currentGuardrail?.name}` : 'Create a new project-wide guardrail' }}
          </p>
        </div>
      </div>
      <button v-if="isReadOnly" class="btn-secondary" disabled>Read-only</button>
      <button v-else
        @click="handleSubmit"
        :disabled="isLoading || showSuccess"
        class="btn-primary"
      >
        <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
        <Save v-else class="inline-block mr-2 w-4 h-4" />
        {{ showSuccess ? 'Saved!' : (isEditMode ? 'Save Changes' : 'Create Guardrail') }}
      </button>
    </div>

    <div v-if="isReadOnly" class="alert-warning mb-4">
      This guardrail is read-only because the project is archived.
    </div>

    <!-- Error Message -->
    <ErrorDisplay :error="error" class="mx-8 mt-4" />

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-0 pb-4 bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
            <!-- Use shared ActionForm component -->
            <ActionForm
              :form="form"
              :parameters="[]"
              :operations="operations"
              v-model:active-tab="activeTab"
              :available-classifiers="projectClassifiers"
              :available-stages="projectStages"
              :available-tools="projectTools"
              :stage-variables="[]"
              :action-parameters="{}"
              :project-constants="projectConstants"
              :show-tabs="true"
              :show-trigger="true"
              :simple-trigger="true"
              :show-parameters="false"
              :show-metadata="isEditMode"
              :metadata-fields="metadataFields"
              :show-history="isEditMode"
              :error="error"
            >
              <template #history>
                <div class="tab-content">
                  <EntityHistoryView
                    v-if="isEditMode && currentGuardrail"
                    :load-history="() => guardrailsStore.fetchAuditLogs(projectId, currentGuardrail!.id)"
                    :current-version="currentGuardrail.version"
                    :current-object="currentGuardrail"
                    :active="activeTab === 'history'"
                    :update-fn="(data) => guardrailsStore.update(projectId, currentGuardrail!.id, data)"
                    :create-fn="(data) => guardrailsStore.create(projectId, data)"
                    :ignore-fields="['createdAt', 'archived', 'updatedAt', 'version']"
                    @recover-success="() => router.go(0)"
                  />
                </div>
              </template>
            </ActionForm>

            <!-- Tags Field -->
            <div v-show="activeTab === 'basic'" class="px-6">
              <TagsEditor v-model="guardrailTags" />
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
