<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestersStore, useProvidersStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useLlmProviderSelect } from '@/composables/useLlmProviderSelect'
import { ArrowLeft, Save, Settings, Check, X } from 'lucide-vue-next'
import type { ApiErrorDetail, TesterResponse, LlmSettings, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const testersStore = useTestersStore()
const providersStore = useProvidersStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'profile' | 'metadata' | 'history'>('basic')
const showLLMSettingsModal = ref(false)
const currentTester = ref<TesterResponse | null>(null)

interface ProfileEntry {
  key: string
  value: string
}

const userProfileEntries = ref<ProfileEntry[]>([])

const form = ref({
  id: '',
  name: '',
  description: '',
  prompt: '',
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  tags: [] as string[],
  metadata: {} as Record<string, any>,
})

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const testerId = computed(() => route.params.testerId as string | undefined)
const isEditMode = computed(() => !!testerId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'profile', label: 'User Profile' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])

const { projectIsArchived } = useProjectReadOnly(currentTester)
const isReadOnly = computed(() => projectIsArchived.value || !!(currentTester.value as any)?.archived)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const userProfileDescriptors = computed(
  () => projectsStore.unfilteredProjects.find(p => p.id === projectId.value)?.userProfileVariableDescriptors ?? []
)

const llmProviders = computed(() => providersStore.items.filter(p => p.providerType === 'llm'))

const { handleProviderChange: handleLlmProviderChange } = useLlmProviderSelect(
  () => form.value.llmProviderId,
  (v) => { form.value.llmProviderId = v },
  () => form.value.llmSettings,
  (v) => { form.value.llmSettings = v },
)

const metadataFields = computed(() => {
  if (!currentTester.value) return []
  return [
    { label: 'Tester ID', value: currentTester.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentTester.value.projectId, format: 'mono' as const },
    { label: 'Version', value: currentTester.value.version },
    { label: 'Created', value: currentTester.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentTester.value.updatedAt, format: 'date' as const },
  ]
})

onMounted(async () => {
  await Promise.all([
    providersStore.fetchAll(),
    projectsStore.fetchUnfilteredProjects(),
  ])
  if (isEditMode.value) {
    await loadTester()
  }
})

async function loadTester() {
  if (!testerId.value) return
  isLoading.value = true
  loadError.value = null
  try {
    currentTester.value = await testersStore.fetchById(projectId.value, testerId.value)
    if (currentTester.value) {
      form.value = {
        id: currentTester.value.id,
        name: currentTester.value.name,
        description: currentTester.value.description || '',
        prompt: currentTester.value.prompt,
        llmProviderId: currentTester.value.llmProviderId || '',
        llmSettings: currentTester.value.llmSettings || null,
        tags: currentTester.value.tags || [],
        metadata: currentTester.value.metadata || {},
      }
      userProfileEntries.value = Object.entries(currentTester.value.userProfile || {}).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }))
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load tester'
  } finally {
    isLoading.value = false
  }
}

function buildUserProfile(): Record<string, any> {
  return Object.fromEntries(
    userProfileEntries.value
      .filter(e => e.key)
      .map(e => {
        const desc = userProfileDescriptors.value.find(d => d.name === e.key)
        if (desc?.type === 'number') return [e.key, Number(e.value)]
        if (desc?.type === 'boolean') return [e.key, e.value === 'true']
        return [e.key, e.value]
      })
  )
}

async function handleSubmit() {
  error.value = null
  const errorDetails: ApiErrorDetail[] = []

  if (!form.value.name.trim())
    errorDetails.push({ code: 'required', path: ['name'], message: 'Name is required' })

  if (!form.value.prompt.trim())
    errorDetails.push({ code: 'required', path: ['prompt'], message: 'Prompt is required' })

  if (errorDetails.length > 0) {
    error.value = { message: 'Please fix the validation errors and try again.', details: errorDetails }
    switchToFirstErrorTab(error.value)
    return
  }

  isLoading.value = true
  try {
    if (isEditMode.value && currentTester.value) {
      const updated = await testersStore.update(projectId.value, currentTester.value.id, {
        version: currentTester.value.version,
        name: form.value.name,
        description: form.value.description || null,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId || undefined,
        llmSettings: form.value.llmSettings || undefined,
        userProfile: buildUserProfile(),
        tags: form.value.tags,
        metadata: form.value.metadata,
      })
      currentTester.value = updated
    } else {
      const createData: any = {
        name: form.value.name,
        prompt: form.value.prompt,
        metadata: form.value.metadata,
      }
      if (form.value.id) createData.id = form.value.id
      if (form.value.description) createData.description = form.value.description
      if (form.value.tags.length > 0) createData.tags = form.value.tags
      if (form.value.llmProviderId) createData.llmProviderId = form.value.llmProviderId
      if (form.value.llmSettings) createData.llmSettings = form.value.llmSettings
      const userProfile = buildUserProfile()
      if (Object.keys(userProfile).length > 0) createData.userProfile = userProfile

      const created = await testersStore.create(projectId.value, createData)
      currentTester.value = created
      await router.push({
        name: 'design.testers.edit',
        params: { projectId: projectId.value, testerId: created.id },
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
  router.push({ name: 'design.testing', params: { projectId: projectId.value } })
}

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}

function addProfileEntry() {
  userProfileEntries.value.push({ key: '', value: '' })
}

function removeProfileEntry(index: number) {
  userProfileEntries.value.splice(index, 1)
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
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Tester' : 'Create Tester' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the tester persona configuration' : 'Define a new tester persona for automated testing' }}
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
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Tester')) }}
        </button>
      </div>
    </div>

    <div v-if="isReadOnly" class="alert-warning mb-4">
      This tester is read-only because the project is archived.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <div v-if="isLoading && isEditMode && !currentTester" class="loading-state">
      Loading tester...
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
              <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this tester persona">
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Friendly Tester"
                  class="form-input"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="Description" :error="error" path="description" class="w-full" help="Optional description of the tester's purpose or behaviour">
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="form-textarea"
                  placeholder="A brief description of this tester..."
                  :disabled="isLoading"
                ></textarea>
              </FormField>

              <TagsEditor v-model="form.tags" :disabled="isLoading" />
            </TabContent>

            <!-- Prompt Tab -->
            <TabContent v-model="activeTab" tab="prompt">
              <CompositeFormField label="LLM Provider" :error="error" help="The LLM provider to use for this tester persona.">
                <div class="flex flex-col md:flex-row gap-2 items-center">
                  <FormField path="llmProviderId">
                    <select
                      :value="form.llmProviderId"
                      @change="handleLlmProviderChange"
                      class="form-select-auto min-w-64"
                      :disabled="isLoading"
                    >
                      <option value="">Select an LLM provider</option>
                      <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                        {{ provider.name }}
                      </option>
                    </select>
                  </FormField>
                  <FormField path="llmSettings">
                    <button
                      type="button"
                      @click="showLLMSettingsModal = true"
                      class="btn-secondary whitespace-nowrap"
                      :disabled="isLoading"
                    >
                      <Settings class="inline-block mr-1 w-4 h-4" />
                      Settings...
                    </button>
                  </FormField>
                  <LLMModelBadge :settings="form.llmSettings" />
                </div>
              </CompositeFormField>

              <FormField label="Persona Prompt" required :error="error" path="prompt" class="w-full" help="Instructions that define how this tester behaves during a conversation.">
                <PromptEditor
                  v-model="form.prompt"
                  :disabled="isLoading || isReadOnly"
                  show-toolbar
                  placeholder="You are a friendly user testing a conversational AI system..."
                  aria-label="Tester persona prompt"
                  min-height="28rem"
                />
              </FormField>
            </TabContent>

            <!-- User Profile Tab -->
            <TabContent v-model="activeTab" tab="profile">
              <div class="p-8 space-y-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Key-value fields passed as the user profile when the tester starts a conversation.
                </p>
                <div class="space-y-2">
                  <div v-if="userProfileEntries.length > 0" class="grid grid-cols-[1fr_1fr_2.5rem] gap-2 mb-1">
                    <span class="form-label pb-0">Field</span>
                    <span class="form-label pb-0">Value</span>
                    <span></span>
                  </div>
                  <div
                    v-for="(entry, index) in userProfileEntries"
                    :key="index"
                    class="grid grid-cols-[1fr_1fr_2.5rem] gap-2 items-start"
                  >
                    <select v-model="entry.key" class="form-select" :disabled="isLoading">
                      <option value="">Select a field...</option>
                      <option v-for="desc in userProfileDescriptors" :key="desc.name" :value="desc.name">
                        {{ desc.name }}
                      </option>
                      <option
                        v-if="entry.key && !userProfileDescriptors.find(d => d.name === entry.key)"
                        :value="entry.key"
                      >{{ entry.key }} (custom)</option>
                    </select>
                    <select
                      v-if="userProfileDescriptors.find(d => d.name === entry.key)?.type === 'boolean'"
                      v-model="entry.value"
                      class="form-select"
                      :disabled="isLoading"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                    <input
                      v-else
                      v-model="entry.value"
                      :type="userProfileDescriptors.find(d => d.name === entry.key)?.type === 'number' ? 'number' : 'text'"
                      class="form-input"
                      placeholder="Value"
                      :disabled="isLoading"
                    />
                    <button
                      type="button"
                      @click="removeProfileEntry(index)"
                      class="btn-icon text-red-500 dark:text-red-400 hover:text-red-700 mt-0.5"
                      :disabled="isLoading"
                      title="Remove field"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <p v-if="userProfileEntries.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic">
                    No profile fields defined.
                  </p>
                </div>
                <button type="button" @click="addProfileEntry" class="btn-secondary" :disabled="isLoading">
                  + Add Field
                </button>
              </div>
            </TabContent>

            <!-- Metadata Tab -->
            <MetadataTab
              v-if="isEditMode && currentTester"
              v-model="activeTab"
              tab="metadata"
              :fields="metadataFields"
            />

            <!-- History Tab -->
            <TabContent v-model="activeTab" tab="history">
              <EntityHistoryView
                v-if="isEditMode && currentTester"
                :load-history="() => testersStore.fetchAuditLogs(projectId, currentTester!.id)"
                :current-version="currentTester.version"
                :current-object="currentTester"
              />
            </TabContent>

          </fieldset>
        </form>
      </div>
    </div>

    <!-- LLM Settings Modal -->
    <LLMSettingsModal
      v-if="showLLMSettingsModal"
      :settings="form.llmSettings"
      :selected-provider-id="form.llmProviderId"
      :providers="llmProviders"
      @close="showLLMSettingsModal = false"
      @save="handleLLMSettingsSave"
    />
  </div>
</template>
