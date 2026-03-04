<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContextTransformersStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { Microchip, Search, X, Plus } from 'lucide-vue-next'
import type { ContextTransformerResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const transformersStore = useContextTransformersStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-context-transformers')

// Pagination
const pagination = usePagination({
  store: transformersStore,
  pageSize: 20,
  onPageChange: loadTransformers
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredTransformers, clearSearch } = useSearch(
  () => transformersStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadTransformers()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadTransformers()
})

// Lifecycle
onMounted(async () => {
  await loadTransformers()
})

// Methods
async function loadTransformers() {
  try {
    const orderBy = getOrderBy()
    await transformersStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load context transformers:', error)
  }
}

async function deleteTransformer(transformer: ContextTransformerResponse) {
  if (!confirm(`Delete context transformer "${transformer.name}" (${transformer.id})?\n\nThis action cannot be undone.`)) return

  try {
    await transformersStore.remove(projectId.value, transformer.id, transformer.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete context transformer')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}



function createTransformer() {
  router.push({ name: 'design.contextTransformers.create', params: { projectId: projectId.value } })
}

function editTransformer(transformer: ContextTransformerResponse) {
  router.push({ 
    name: 'design.contextTransformers.edit', 
    params: { projectId: projectId.value, transformerId: transformer.id } 
  })
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Context Transformers</h1>
          <p class="page-subtitle">Manage context transformation logic for this project</p>
        </div>
        <button @click="createTransformer" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Transformer
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
      <div v-if="transformersStore.isLoading" class="loading-state">
        Loading context transformers...
      </div>

      <!-- Error State -->
      <div v-else-if="transformersStore.error" class="error-state">
        {{ transformersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTransformers.length === 0" class="empty-state">
        <Microchip class="empty-state-icon" />
        <p class="empty-state-title">No context transformers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first context transformer to get started</p>
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
                <th class="table-header-cell">Variables</th>
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
              <tr v-for="transformer in filteredTransformers" :key="transformer.id" class="table-row">
                <td class="table-clickable-cell" @click="editTransformer(transformer)">{{ transformer.name }}</td>
                <td class="table-cell">
                  <span v-if="transformer.contextFields?.length" class="badge-info">
                    {{ transformer.contextFields.length }} variable{{ transformer.contextFields.length !== 1 ? 's' : '' }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <div v-if="transformer.tags?.length" class="tag-list">
                    <span v-for="tag in transformer.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(transformer.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editTransformer(transformer)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteTransformer(transformer)" class="btn-danger btn-sm">
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
        :displayed-count="filteredTransformers.length"
        resource-name="context transformers"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
