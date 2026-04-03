<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import { useGuardrailsStore, useProjectSelectionStore, useProjectsStore, useClassifiersStore, useProvidersStore, useProviderCatalogStore } from '@/stores'
import type { ParsedError } from '@/api/types'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { ShieldCheck, ShieldAlert, Search, X, Plus, Save, Check } from 'lucide-vue-next'
import type { GuardrailResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import ConfigureModerationActionModal from '@/components/modals/ConfigureModerationActionModal.vue'

const router = useRouter()
const guardrailsStore = useGuardrailsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()
const classifiersStore = useClassifiersStore()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()

type TabType = 'guardrails' | 'moderation'
const activeTab = ref<TabType>('guardrails')

const tabs: TabDefinition[] = [
  { key: 'guardrails', label: 'Guardrails' },
  { key: 'moderation', label: 'Moderation' },
]

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-guardrails')

// Pagination
const pagination = usePagination({
  store: guardrailsStore,
  pageSize: 20,
  onPageChange: loadGuardrails
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Project state (shared between tabs)
const currentProject = ref<any>(null)
const settingsLoading = ref(false)
const settingsError = ref<string | null>(null)
const showSettingsSuccess = ref(false)
const defaultGuardrailClassifierId = ref<string>('')

// Moderation state
const showConfigureModerationModal = ref(false)
const moderationLoading = ref(false)
const moderationError = ref<string | null>(null)
const moderationValidationError = ref<ParsedError | null>(null)
const showModerationSuccess = ref(false)
const moderationForm = ref({
  enabled: false,
  llmProviderId: '',
  mode: 'strict' as 'strict' | 'standard',
  blockedCategories: [] as string[],
})

const moderationLlmProviders = computed(() =>
  providersStore.items.filter(
    p => p.providerType === 'llm' && (p.apiType === 'openai' || p.apiType === 'mistral')
  )
)

const selectedModerationProviderApiType = computed(() => {
  if (!moderationForm.value.llmProviderId) return null
  return moderationLlmProviders.value.find(p => p.id === moderationForm.value.llmProviderId)?.apiType ?? null
})

const availableModerationCategories = computed(() => {
  const apiType = selectedModerationProviderApiType.value
  if (!apiType || !providerCatalogStore.catalog?.moderation) return []
  const providerInfo = providerCatalogStore.catalog.moderation.find(p => p.apiType === apiType)
  if (!providerInfo) return []
  const seen = new Set<string>()
  const categories: { name: string; displayName: string; description?: string }[] = []
  for (const model of providerInfo.models) {
    for (const cat of model.categories) {
      if (!seen.has(cat.name)) {
        seen.add(cat.name)
        categories.push(cat)
      }
    }
  }
  return categories
})

watch(() => moderationForm.value.llmProviderId, () => {
  moderationForm.value.blockedCategories = []
  moderationValidationError.value = null
})

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredGuardrails, clearSearch } = useSearch(
  () => guardrailsStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadGuardrails()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadGuardrails()
  loadProjectData()
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadGuardrails(),
    loadProjectData(),
    providersStore.fetchAll(),
    providerCatalogStore.catalog ? Promise.resolve() : providerCatalogStore.fetchCatalog(),
  ])
})

// Methods
async function loadProjectData() {
  await loadProjectSettings()
}

async function loadGuardrails() {
  try {
    const orderBy = getOrderBy()
    await guardrailsStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load guardrails:', error)
  }
}

async function loadProjectSettings() {
  if (!projectId.value) return
  try {
    await classifiersStore.fetchAll(projectId.value)
    currentProject.value = await projectsStore.fetchById(projectId.value)
    defaultGuardrailClassifierId.value = currentProject.value?.defaultGuardrailClassifierId || ''
    moderationForm.value = {
      enabled: currentProject.value?.moderationConfig?.enabled ?? false,
      llmProviderId: currentProject.value?.moderationConfig?.llmProviderId || '',
      mode: currentProject.value?.moderationConfig?.mode ?? 'strict',
      blockedCategories: currentProject.value?.moderationConfig?.blockedCategories ?? [],
    }
  } catch (err: any) {
    settingsError.value = err.response?.data?.message || 'Failed to load project settings'
  }
}

async function saveProjectSettings() {
  if (!currentProject.value) return
  settingsLoading.value = true
  settingsError.value = null
  try {
    const updated = await projectsStore.update(currentProject.value.id, {
      version: currentProject.value.version,
      defaultGuardrailClassifierId: defaultGuardrailClassifierId.value || null,
    })
    currentProject.value = updated
    showSettingsSuccess.value = true
    setTimeout(() => { showSettingsSuccess.value = false }, 3000)
  } catch (err: any) {
    settingsError.value = err.response?.data?.message || 'Failed to save project settings'
  } finally {
    settingsLoading.value = false
  }
}

async function saveModerationSettings() {
  if (!currentProject.value) return
  moderationValidationError.value = null
  if (moderationForm.value.enabled && !moderationForm.value.llmProviderId) {
    moderationValidationError.value = {
      message: 'A moderation provider is required when content moderation is enabled',
      details: [{ code: 'required', path: ['llmProviderId'], message: 'A moderation provider is required' }]
    }
    return
  }
  moderationLoading.value = true
  moderationError.value = null
  try {
    const updated = await projectsStore.update(currentProject.value.id, {
      version: currentProject.value.version,
      moderationConfig: moderationForm.value.enabled
        ? {
            enabled: true,
            llmProviderId: moderationForm.value.llmProviderId,
            mode: moderationForm.value.mode,
            ...(moderationForm.value.blockedCategories.length > 0 && {
              blockedCategories: moderationForm.value.blockedCategories,
            }),
          }
        : { enabled: false, llmProviderId: moderationForm.value.llmProviderId },
    })
    currentProject.value = updated
    showModerationSuccess.value = true
    setTimeout(() => { showModerationSuccess.value = false }, 3000)
  } catch (err: any) {
    moderationError.value = err.response?.data?.message || 'Failed to save moderation configuration'
  } finally {
    moderationLoading.value = false
  }
}

async function deleteGuardrail(guardrail: GuardrailResponse) {
  if (!confirm(`Delete guardrail "${guardrail.name}" (${guardrail.id})?\n\nThis action cannot be undone.`)) return

  try {
    await guardrailsStore.remove(projectId.value, guardrail.id, guardrail.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete guardrail')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function createGuardrail() {
  if (projectIsArchived.value) return
  router.push({
    name: 'design.guardrails.create',
    params: { projectId: projectId.value }
  })
}

function editGuardrail(guardrail: GuardrailResponse) {
  router.push({
    name: 'design.guardrails.edit',
    params: { projectId: projectId.value, guardrailId: guardrail.id }
  })
}

function navigateToModerationAction() {
  showConfigureModerationModal.value = true
}
</script>

<template>
  <ConfigureModerationActionModal
    v-if="showConfigureModerationModal"
    :project-id="projectId"
    @close="showConfigureModerationModal = false"
  />
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Guardrails</h1>
        <p class="page-subtitle">Safety rules and content moderation for this project</p>
      </div>
    </div>

    <!-- Rounded panel -->
    <div class="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">

    <!-- Archived banner -->
    <div v-if="projectIsArchived" class="alert-warning rounded-none border-x-0 border-t-0 mb-0">
      This project is archived — editing is disabled.
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Content -->
    <div class="bg-white dark:bg-gray-800">

      <!-- Guardrails Tab -->
      <div v-show="activeTab === 'guardrails'" class="tab-content">

        <div class="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Guardrails</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Guardrails are safety rules that fire on every turn using a classifier. Select a classifier below to enable them, then define rules that trigger specific effects when a classification threshold is met.
            </p>
          </div>
        </div>

        <!-- Guardrails Classifier Setting -->
        <div class="mb-6">
          <FormField label="Guardrails Classifier" class="w-full">
            <div class="flex items-center gap-3">
              <select
                v-model="defaultGuardrailClassifierId"
                class="form-select-auto min-w-64"
                :disabled="projectIsArchived || settingsLoading"
              >
                <option value="">None — guardrails disabled</option>
                <option v-for="classifier in classifiersStore.items" :key="classifier.id" :value="classifier.id">
                  {{ classifier.name }}
                </option>
              </select>
              <button
                v-if="!projectIsArchived"
                @click="saveProjectSettings"
                class="btn-secondary shrink-0"
                :disabled="settingsLoading || showSettingsSuccess"
              >
                <Check v-if="showSettingsSuccess" class="inline-block mr-2 w-4 h-4" />
                <Save v-else class="inline-block mr-2 w-4 h-4" />
                {{ showSettingsSuccess ? 'Saved!' : 'Save' }}
              </button>
              <button v-if="!projectIsArchived" @click="createGuardrail" class="btn-primary shrink-0 ml-auto">
                <Plus class="inline-block mr-2 w-4 h-4" />
                New Guardrail
              </button>
            </div>
            <p class="form-help-text">The classifier used to evaluate all guardrails in this project on every user input turn.</p>
            <p v-if="settingsError" class="text-sm text-red-600 dark:text-red-400 mt-1">{{ settingsError }}</p>
          </FormField>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <Search class="input-icon-left" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, trigger, or condition..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="guardrailsStore.isLoading" class="loading-state">
          Loading guardrails...
        </div>

        <!-- Error State -->
        <div v-else-if="guardrailsStore.error" class="error-state">
          {{ guardrailsStore.error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredGuardrails.length === 0" class="empty-state">
          <ShieldCheck class="empty-state-icon" />
          <p class="empty-state-title">No guardrails found</p>
          <p v-if="searchQuery">Try adjusting your search criteria</p>
          <p v-else>Create your first guardrail to get started</p>
        </div>

        <!-- Table -->
        <div v-else class="table-container">
          <div class="table-wrapper">
            <table class="table">
              <thead class="table-header">
                <tr>
                  <th class="table-header-cell-sortable" @click="toggleSort('name')">
                    <div class="flex items-center gap-1">
                      Name
                      <component :is="getSortIcon('name')" class="w-4 h-4" :class="sortKey === 'name' ? 'text-primary-600' : 'text-gray-400'" />
                    </div>
                  </th>
                  <th class="table-header-cell">Classification Trigger</th>
                  <th class="table-header-cell">Effects</th>
                  <th class="table-header-cell">Tags</th>
                  <th class="table-header-cell-sortable" @click="toggleSort('updatedAt')">
                    <div class="flex items-center gap-1">
                      Updated
                      <component :is="getSortIcon('updatedAt')" class="w-4 h-4" :class="sortKey === 'updatedAt' ? 'text-primary-600' : 'text-gray-400'" />
                    </div>
                  </th>
                  <th class="table-header-cell-right">Actions</th>
                </tr>
              </thead>
              <tbody class="table-body">
                <tr v-for="guardrail in filteredGuardrails" :key="guardrail.id" class="table-row">
                  <td class="table-clickable-cell" @click="editGuardrail(guardrail)">
                    {{ guardrail.name }}
                    <span v-if="guardrail.archived" class="badge badge-error ml-2">Archived</span>
                  </td>
                  <td class="table-cell">
                    <span class="truncate max-w-xs">{{ guardrail.classificationTrigger || '—' }}</span>
                  </td>
                  <td class="table-cell">
                    <span v-if="guardrail.effects?.length" class="badge-info">
                      {{ guardrail.effects.length }} effect(s)
                    </span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="table-cell">
                    <div v-if="guardrail.tags?.length" class="tag-list">
                      <span v-for="tag in guardrail.tags" :key="tag" class="tag-item">{{ tag }}</span>
                    </div>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="table-cell-muted">{{ formatDate(guardrail.updatedAt) }}</td>
                  <td class="table-cell-right">
                    <div class="flex-end">
                      <button @click="editGuardrail(guardrail)" class="btn-secondary btn-sm">
                        {{ (projectIsArchived || guardrail.archived) ? 'View' : 'Edit' }}
                      </button>
                      <button @click="deleteGuardrail(guardrail)" class="btn-danger btn-sm" :disabled="guardrail.archived">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <PaginationControls
            :pagination="pagination"
            :displayed-count="filteredGuardrails.length"
            resource-name="guardrails"
          />
        </div>
      </div>

      <!-- Moderation Tab -->
      <div v-show="activeTab === 'moderation'" class="tab-content">
        <fieldset :disabled="projectIsArchived" class="border-0 p-0 m-0 min-w-0 w-full">
          <div v-if="moderationError" class="alert-error mb-6">{{ moderationError }}</div>

          <div class="space-y-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Content Moderation</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Enable content moderation to automatically screen user messages for harmful content before processing. 
                  <br />This adds additional latency to user messages.
                </p>
              </div>
              <button
                v-if="!projectIsArchived"
                @click="saveModerationSettings"
                class="btn-primary shrink-0"
                :disabled="moderationLoading || showModerationSuccess"
              >
                <Check v-if="showModerationSuccess" class="inline-block mr-2 w-4 h-4" />
                <Save v-else class="inline-block mr-2 w-4 h-4" />
                {{ showModerationSuccess ? 'Saved!' : (moderationLoading ? 'Saving...' : 'Save Changes') }}
              </button>
            </div>

            <FormField label="Enable content moderation" class="w-full" help="When enabled, each user message is screened by the moderation API before being processed">
              
              <template #leading>
                <input
                  type="checkbox"
                  v-model="moderationForm.enabled"
                  class="form-checkbox"
                  :disabled="moderationLoading"
                />
              </template>
            </FormField>

            <div v-if="moderationForm.enabled" class="form-group">
              <label class="form-label">Moderation Mode</label>
              <div class="space-y-2 mt-1">
                <label class="flex items-start gap-3 cursor-pointer p-2 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700" :class="moderationForm.mode === 'strict' ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700' : ''">
                  <input
                    type="radio"
                    value="strict"
                    v-model="moderationForm.mode"
                    class="form-checkbox mt-0.5 shrink-0"
                    :disabled="moderationLoading"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-900 dark:text-white">Strict <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(default)</span></span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">Moderation runs before all other processing. The turn is held until the result is available, ensuring no flagged message is ever processed.</span>
                  </span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer p-2 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700" :class="moderationForm.mode === 'standard' ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700' : ''">
                  <input
                    type="radio"
                    value="standard"
                    v-model="moderationForm.mode"
                    class="form-checkbox mt-0.5 shrink-0"
                    :disabled="moderationLoading"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-900 dark:text-white">Standard</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">Moderation runs after filler generation, in parallel with classification and knowledge retrieval, reducing perceived latency. Flagged messages are still blocked before classification results are acted upon.</span>
                  </span>
                </label>
              </div>
            </div>

            <div v-if="moderationForm.enabled" class="flex items-start justify-between gap-4 py-2">
              <div>
                <label class="form-label">Moderation Blocked Action</label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Configure the effects that run when a user message is blocked by moderation — for example, generating a refusal response or ending the conversation.
                </p>
              </div>
              <button @click="navigateToModerationAction" class="btn-secondary shrink-0">
                <ShieldAlert class="inline-block mr-2 w-4 h-4 text-violet-500" />
                Configure Action
              </button>
            </div>

            <FormField v-if="moderationForm.enabled" label="Moderation Provider" required :error="moderationValidationError" path="llmProviderId" 
              help="Only OpenAI and Mistral providers are listed as they are the only ones that support the moderation API"
            >
              <select
                v-model="moderationForm.llmProviderId"
                class="form-select-auto"
                :disabled="moderationLoading"
              >
                <option value="">Select a provider...</option>
                <option v-for="provider in moderationLlmProviders" :key="provider.id" :value="provider.id">
                  {{ provider.name }} ({{ provider.apiType }})
                </option>
              </select>
            </FormField>
            <div class="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                No compatible providers found. Add an OpenAI or Mistral LLM provider in the Providers section to enable moderation.
              </p>
            </div>

            <FormField v-if="moderationForm.enabled && moderationForm.llmProviderId" label="Blocked Categories" class="w-full">
              <p class="form-help-text mb-3">
                Select which flagged categories will block the message. If none are selected, any flagged category will block it.
              </p>
              <div v-if="availableModerationCategories.length > 0" class="space-y-2">
                <label
                  v-for="cat in availableModerationCategories"
                  :key="cat.name"
                  class="flex items-start gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    :value="cat.name"
                    v-model="moderationForm.blockedCategories"
                    class="form-checkbox mt-0.5 shrink-0"
                    :disabled="moderationLoading"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-900 dark:text-white">{{ cat.displayName }}</span>
                    <span v-if="cat.description" class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ cat.description }}</span>
                    <code class="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ cat.name }}</code>
                  </span>
                </label>
                <p v-if="moderationForm.blockedCategories.length === 0" class="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  No categories selected — any flagged category will block the message.
                </p>
              </div>
              <div v-else class="bg-gray-50 border border-gray-200 p-3 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                <p class="text-sm text-gray-500 dark:text-gray-400">Category information not available for this provider.</p>
              </div>
            </FormField>

            <div v-if="!moderationForm.enabled" class="bg-gray-50 border border-gray-200 p-4 rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Content moderation is disabled. User messages will not be screened before processing.
              </p>
            </div>
          </div>
        </fieldset>
      </div>

    </div>
    </div><!-- end rounded panel -->
  </div>
</template>
