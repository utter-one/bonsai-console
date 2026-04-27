<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScenariosStore, useStagesStore, useContextTransformersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { ArrowLeft, Save, Check, X } from 'lucide-vue-next'
import LanguageSelector from '@/components/LanguageSelector.vue'
import type { ApiErrorDetail, ScenarioResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const scenariosStore = useScenariosStore()
const stagesStore = useStagesStore()
const contextTransformersStore = useContextTransformersStore()
const projectSelectionStore = useProjectSelectionStore()

const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'flow' | 'extraction' | 'metadata' | 'history'>('basic')
const currentScenario = ref<ScenarioResponse | null>(null)

const form = ref({
  id: '',
  name: '',
  description: '',
  language: 'en-US',
  startingStageId: '',
  maxTurns: 20,
  endingStageIds: [] as string[],
  personaCanHangUp: false,
  contextTransformerId: '',
  tags: [] as string[],
  metadata: {} as Record<string, any>,
})

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const scenarioId = computed(() => route.params.scenarioId as string | undefined)
const isEditMode = computed(() => !!scenarioId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'flow', label: 'Flow' },
  { key: 'extraction', label: 'Extraction' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])

const { projectIsArchived } = useProjectReadOnly(currentScenario)
const isReadOnly = computed(() => projectIsArchived.value || !!(currentScenario.value as any)?.archived)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const stages = computed(() => stagesStore.items)
const contextTransformers = computed(() => contextTransformersStore.items)

const metadataFields = computed(() => {
  if (!currentScenario.value) return []
  return [
    { label: 'Scenario ID', value: currentScenario.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentScenario.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentScenario.value.version },
    { label: 'Created', value: currentScenario.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentScenario.value.updatedAt, format: 'date' as const },
  ]
})

onMounted(async () => {
  await Promise.all([
    stagesStore.fetchAll(projectId.value),
    contextTransformersStore.fetchAll(projectId.value),
  ])
  if (isEditMode.value) {
    await loadScenario()
  }
})

async function loadScenario() {
  if (!scenarioId.value) return
  isLoading.value = true
  loadError.value = null
  try {
    currentScenario.value = await scenariosStore.fetchById(projectId.value, scenarioId.value)
    if (currentScenario.value) {
      form.value = {
        id: currentScenario.value.id,
        name: currentScenario.value.name,
        description: currentScenario.value.description || '',
        language: currentScenario.value.language,
        startingStageId: currentScenario.value.startingStageId,
        maxTurns: currentScenario.value.maxTurns,
        endingStageIds: currentScenario.value.endingStageIds || [],
        personaCanHangUp: currentScenario.value.personaCanHangUp,
        contextTransformerId: currentScenario.value.contextTransformerId || '',
        tags: currentScenario.value.tags || [],
        metadata: currentScenario.value.metadata || {},
      }
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load scenario'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  const errorDetails: ApiErrorDetail[] = []

  if (!form.value.name.trim())
    errorDetails.push({ code: 'required', path: ['name'], message: 'Name is required' })

  if (!form.value.language.trim())
    errorDetails.push({ code: 'required', path: ['language'], message: 'Language is required' })

  if (!form.value.startingStageId)
    errorDetails.push({ code: 'required', path: ['startingStageId'], message: 'Starting stage is required' })

  if (!form.value.maxTurns || form.value.maxTurns < 1)
    errorDetails.push({ code: 'min', path: ['maxTurns'], message: 'Max turns must be at least 1' })

  if (errorDetails.length > 0) {
    error.value = { message: 'Please fix the validation errors and try again.', details: errorDetails }
    switchToFirstErrorTab(error.value)
    return
  }

  isLoading.value = true
  try {
    if (isEditMode.value && currentScenario.value) {
      const updated = await scenariosStore.update(projectId.value, currentScenario.value.id, {
        version: currentScenario.value.version,
        name: form.value.name,
        description: form.value.description || null,
        language: form.value.language,
        startingStageId: form.value.startingStageId,
        maxTurns: form.value.maxTurns,
        endingStageIds: form.value.endingStageIds.filter(Boolean),
        personaCanHangUp: form.value.personaCanHangUp,
        contextTransformerId: form.value.contextTransformerId || null,
        tags: form.value.tags,
        metadata: form.value.metadata,
      })
      currentScenario.value = updated
    } else {
      const createData: any = {
        name: form.value.name,
        language: form.value.language,
        startingStageId: form.value.startingStageId,
        maxTurns: form.value.maxTurns,
        personaCanHangUp: form.value.personaCanHangUp,
        endingStageIds: form.value.endingStageIds.filter(Boolean),
        metadata: form.value.metadata,
      }
      if (form.value.id) createData.id = form.value.id
      if (form.value.description) createData.description = form.value.description
      if (form.value.tags.length > 0) createData.tags = form.value.tags
      if (form.value.contextTransformerId) createData.contextTransformerId = form.value.contextTransformerId

      const created = await scenariosStore.create(projectId.value, createData)
      currentScenario.value = created
      await router.push({
        name: 'testing.scenarios.edit',
        params: { projectId: projectId.value, scenarioId: created.id },
      })
    }

    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'testing.scenarios', params: { projectId: projectId.value } })
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to testing">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Scenario' : 'Create Scenario' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the scenario configuration' : 'Define a new testing scenario for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="!isReadOnly" @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Scenario')) }}
        </button>
      </div>
    </div>

    <div v-if="isReadOnly" class="alert-warning mb-4">
      This scenario is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <div v-if="isLoading && isEditMode && !currentScenario" class="loading-state">
      Loading scenario...
    </div>

    <div v-else-if="loadError" class="error-state">
      {{ loadError }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Testing
      </button>
    </div>

    <div v-show="!loadError" class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">

            <ErrorDisplay :error="error" class="mx-8 mt-4" />

            <!-- General Tab -->
            <TabContent v-model="activeTab" tab="basic">
              <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this scenario">
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Happy Path Scenario"
                  class="form-input"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="Language" required :error="error" path="language" class="w-full md:w-96" help="Language of the conversation">
                <LanguageSelector
                  :model-value="form.language || null"
                  @update:model-value="v => form.language = v || ''"
                  :disabled="isLoading"
                  width="full"
                />
              </FormField>

              <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description of the scenario purpose and expected flow">
                <textarea
                  v-model="form.description"
                  rows="4"
                  class="form-textarea"
                  placeholder="A brief description of what this scenario tests..."
                  :disabled="isLoading"
                ></textarea>
              </FormField>

              <TagsEditor v-model="form.tags" :disabled="isLoading" />
            </TabContent>

            <!-- Flow Tab -->
            <TabContent v-model="activeTab" tab="flow">
              <div class="flex flex-col md:flex-row gap-4">
                <FormField label="Starting Stage" required :error="error" path="startingStageId" class="w-fit" help="The stage where the conversation begins">
                  <select v-model="form.startingStageId" class="form-select-auto min-w-64" :disabled="isLoading">
                    <option value="">Select a stage</option>
                    <option v-for="stage in stages" :key="stage.id" :value="stage.id">
                      {{ stage.name }}
                    </option>
                  </select>
                </FormField>

                <FormField label="Max Turns" hint="Optional limit" :error="error" path="maxTurns" class="w-fit" help="Maximum turns before the scenario is terminated">
                  <input
                    v-model.number="form.maxTurns"
                    type="number"
                    min="1"
                    class="form-input w-32"
                    :disabled="isLoading"
                  />
                </FormField>
              </div>

              <FormField label="End Actions" :error="error" path="endingStageIds" help="Stop the conversation when any of these stages is reached">
                <div class="space-y-2">
                  <div
                    v-for="(_, index) in form.endingStageIds"
                    :key="index"
                    class="flex gap-2 items-center"
                  >
                    <select
                      v-model="form.endingStageIds[index]"
                      class="form-select-auto min-w-64"
                      :disabled="isLoading"
                    >
                      <option value="">Select a stage</option>
                      <option v-for="stage in stages" :key="stage.id" :value="stage.id">
                        {{ stage.name }}
                      </option>
                    </select>
                    <button
                      type="button"
                      @click="form.endingStageIds.splice(index, 1)"
                      class="btn-icon text-red-500 dark:text-red-400 hover:text-red-700"
                      :disabled="isLoading"
                      title="Remove end action"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <p v-if="form.endingStageIds.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic">
                    No end actions defined.
                  </p>
                </div>
                <button
                  type="button"
                  @click="form.endingStageIds.push('')"
                  class="btn-secondary mt-3 text-sm"
                  :disabled="isLoading"
                >
                  + Add End Action
                </button>
              </FormField>

              <FormField label="Persona Can Hang Up" :error="error" path="personaCanHangUp" help="Allow the persona to end the conversation independently">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="form.personaCanHangUp" type="checkbox" class="form-checkbox" :disabled="isLoading" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Persona can decide to hang up independently</span>
                </label>
              </FormField>
            </TabContent>

            <!-- Extraction Tab -->
            <TabContent v-model="activeTab" tab="extraction">
              <FormField label="Context Transformer" :error="error" path="contextTransformerId" class="w-fit" help="Optional context transformer used to post-process data extracted from the conversation">
                <select
                  v-model="form.contextTransformerId"
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">None</option>
                  <option v-for="transformer in contextTransformers" :key="transformer.id" :value="transformer.id">
                    {{ transformer.name }}
                  </option>
                </select>
              </FormField>
            </TabContent>

            <!-- Metadata Tab -->
            <MetadataTab
              v-if="isEditMode && currentScenario"
              v-model="activeTab"
              tab="metadata"
              :fields="metadataFields"
            />

            <!-- History Tab -->
            <TabContent v-model="activeTab" tab="history">
              <EntityHistoryView
                v-if="isEditMode && currentScenario"
                :load-history="() => scenariosStore.fetchAuditLogs(projectId, currentScenario!.id)"
                :current-version="currentScenario.version"
                :current-object="currentScenario"
              />
            </TabContent>

          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>
