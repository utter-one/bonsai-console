<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalActionsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { Zap, Search, X, Plus } from 'lucide-vue-next'
import type { GlobalActionResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const globalActionsStore = useGlobalActionsStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-global-actions')

// Pagination
const pagination = usePagination({
  store: globalActionsStore,
  pageSize: 20,
  onPageChange: loadGlobalActions
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredGlobalActions, clearSearch } = useSearch(
  () => globalActionsStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadGlobalActions()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadGlobalActions()
})

// Lifecycle
onMounted(async () => {
  await loadGlobalActions()
})

// Methods
async function loadGlobalActions() {
  try {
    const orderBy = getOrderBy()
    await globalActionsStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load global actions:', error)
  }
}

async function deleteGlobalAction(action: GlobalActionResponse) {
  if (!confirm(`Delete global action "${action.name}" (${action.id})?\n\nThis action cannot be undone.`)) return

  try {
    await globalActionsStore.remove(projectId.value, action.id, action.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete global action')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}



function createGlobalAction() {
  if (projectIsArchived.value) return
  router.push({ 
    name: 'design.globalActions.create', 
    params: { projectId: projectId.value } 
  })
}

function editGlobalAction(action: GlobalActionResponse) {
  router.push({ 
    name: 'design.globalActions.edit', 
    params: { projectId: projectId.value, globalActionId: action.id } 
  })
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Global Actions</h1>
          <p class="page-subtitle">Define system-wide actions for this project</p>
        </div>
        <button @click="createGlobalAction" class="btn-primary" :disabled="projectIsArchived">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Global Action
        </button>
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
      <div v-if="globalActionsStore.isLoading" class="loading-state">
        Loading global actions...
      </div>

      <!-- Error State -->
      <div v-else-if="globalActionsStore.error" class="error-state">
        {{ globalActionsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGlobalActions.length === 0" class="empty-state">
        <Zap class="empty-state-icon" />
        <p class="empty-state-title">No global actions found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first global action to get started</p>
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
                <th class="table-header-cell">Prompt Trigger</th>
                <th class="table-header-cell">Condition</th>
                <th class="table-header-cell">Effects</th>
                <th class="table-header-cell">Examples</th>
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
              <tr v-for="action in filteredGlobalActions" :key="action.id" class="table-row">
                <td class="table-clickable-cell" @click="editGlobalAction(action)">
                  {{ action.name }}
                  <span v-if="action.archived" class="badge badge-error ml-2">Archived</span>
                </td>
                <td class="table-cell">
                  <span class="truncate max-w-xs">{{ action.classificationTrigger || '—' }}</span>
                </td>
                <td class="table-cell">
                  <span v-if="action.condition" class="truncate max-w-xs text-gray-600">{{ action.condition }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <span v-if="action.effects?.length" class="badge-info">
                    {{ action.effects.length }} effect(s)
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <span v-if="action.examples?.length" class="badge-secondary">
                    {{ action.examples.length }} example(s)
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <div v-if="action.tags?.length" class="tag-list">
                    <span v-for="tag in action.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(action.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editGlobalAction(action)" class="btn-secondary btn-sm">
                      {{ (projectIsArchived || action.archived) ? 'View' : 'Edit' }}
                    </button>
                    <button @click="deleteGlobalAction(action)" class="btn-danger btn-sm" :disabled="action.archived">
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
        :displayed-count="filteredGlobalActions.length"
        resource-name="global actions"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
