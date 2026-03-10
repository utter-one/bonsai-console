<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGuardrailsStore, useProjectSelectionStore, useProjectsStore, useClassifiersStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { ShieldCheck, Search, X, Plus, Save, Check } from 'lucide-vue-next'
import type { GuardrailResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const guardrailsStore = useGuardrailsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()
const classifiersStore = useClassifiersStore()

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

// Project settings state
const currentProject = ref<any>(null)
const settingsLoading = ref(false)
const settingsError = ref<string | null>(null)
const showSettingsSuccess = ref(false)
const defaultGuardrailClassifierId = ref<string>('')

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
  loadAll()
})

// Lifecycle
onMounted(async () => {
  await loadAll()
})

// Methods
async function loadAll() {
  await Promise.all([loadGuardrails(), loadProjectSettings()])
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
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Guardrails</h1>
        <p class="page-subtitle">Define safety rules that fire on every stage using the project-level classifier</p>
      </div>
      <button @click="createGuardrail" class="btn-primary" :disabled="projectIsArchived">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Guardrail
      </button>
    </div>

    <!-- Project Settings: Default Guardrail Classifier -->
    <div class="mb-6">
      <div class="form-group">
        <label class="form-label">Guardrails Classifier</label>
        <div class="flex items-center gap-3">
          <select
            v-model="defaultGuardrailClassifierId"
            class="form-select-auto"
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
        </div>
        <p class="form-help-text">
          The classifier used to evaluate all guardrails in this project on every user input turn.
        </p>
        <p v-if="settingsError" class="text-sm text-red-600 dark:text-red-400 mt-1">{{ settingsError }}</p>
      </div>
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

      <!-- Pagination Controls -->
      <PaginationControls
        :pagination="pagination"
        :displayed-count="filteredGuardrails.length"
        resource-name="guardrails"
      />
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
