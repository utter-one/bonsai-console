<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClassifiersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { Target, Search, X, Plus } from 'lucide-vue-next'
import type { ClassifierResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const classifiersStore = useClassifiersStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-classifiers')

// Pagination
const pagination = usePagination({
  store: classifiersStore,
  pageSize: 20,
  onPageChange: loadClassifiers
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredClassifiers, clearSearch } = useSearch(
  () => classifiersStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadClassifiers()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadClassifiers()
})

// Lifecycle
onMounted(async () => {
  await loadClassifiers()
})

// Methods
async function loadClassifiers() {
  try {
    const orderBy = getOrderBy()
    await classifiersStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load classifiers:', error)
  }
}

async function deleteClassifier(classifier: ClassifierResponse) {
  if (!confirm(`Delete classifier "${classifier.name}" (${classifier.id})?\n\nThis action cannot be undone.`)) return

  try {
    await classifiersStore.remove(projectId.value, classifier.id, classifier.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete classifier')
  }
}

function createClassifier() {
  if (projectIsArchived.value) return
  router.push({ name: 'design.classifiers.create', params: { projectId: projectId.value } })
}

function editClassifier(classifier: ClassifierResponse) {
  router.push({ 
    name: 'design.classifiers.edit', 
    params: { projectId: projectId.value, classifierId: classifier.id } 
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}


</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Classifiers</h1>
          <p class="page-subtitle">Configure classification rules for this project</p>
        </div>
        <button @click="createClassifier" class="btn-primary" :disabled="projectIsArchived">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Classifier
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, description, or prompt..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="classifiersStore.isLoading" class="loading-state">
        Loading classifiers...
      </div>

      <!-- Error State -->
      <div v-else-if="classifiersStore.error" class="error-state">
        {{ classifiersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredClassifiers.length === 0" class="empty-state">
        <Target class="empty-state-icon" />
        <p class="empty-state-title">No classifiers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first classifier to get started</p>
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
              <tr v-for="classifier in filteredClassifiers" :key="classifier.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editClassifier(classifier)">
                    {{ classifier.name }}
                    <span v-if="classifier.archived" class="badge badge-error ml-2">Archived</span>
                </td>
                <td class="table-cell">
                  <div v-if="classifier.tags?.length" class="tag-list">
                    <span v-for="tag in classifier.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(classifier.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editClassifier(classifier)" class="btn-secondary btn-sm">
                      {{ (projectIsArchived || classifier.archived) ? 'View' : 'Edit' }}
                    </button>
                    <button @click="deleteClassifier(classifier)" class="btn-danger btn-sm" :disabled="classifier.archived">
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
        :displayed-count="filteredClassifiers.length"
        resource-name="classifiers"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
