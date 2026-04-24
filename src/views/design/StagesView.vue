<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStagesStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import { Route, Search, X, Plus, BookOpen, Zap, Target, Microchip } from 'lucide-vue-next'
import type { StageResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const stagesStore = useStagesStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-stages')

// Pagination
const pagination = usePagination({
  store: stagesStore,
  pageSize: 20,
  onPageChange: loadStages
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredStages, clearSearch } = useSearch(
  () => stagesStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadStages()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadStages()
})

// Lifecycle
onMounted(async () => {
  await loadStages()
})

// Methods
async function loadStages() {
  try {
    const orderBy = getOrderBy()
    await stagesStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load stages:', error)
  }
}

function createStage() {
  if (projectIsArchived.value) return
  router.push({
    name: 'design.stages.create',
    params: { projectId: projectId.value }
  })
}

function editStage(stage: StageResponse) {
  router.push({
    name: 'design.stages.edit',
    params: {
      projectId: projectId.value,
      stageId: stage.id
    }
  })
}

async function deleteStage(stage: StageResponse) {
  if (!confirm(`Delete stage "${stage.name}" (${stage.id})?\n\nThis action cannot be undone.`)) return

  try {
    await stagesStore.remove(projectId.value, stage.id, stage.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete stage')
  }
}



</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Stages</h1>
          <p class="page-subtitle">Define conversation stages for this project</p>
        </div>
        <button @click="createStage" class="btn-primary" :disabled="projectIsArchived">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Stage
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by stage or prompt..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="stagesStore.isLoading" class="loading-state">
        Loading stages...
      </div>

      <!-- Error State -->
      <div v-else-if="stagesStore.error" class="error-state">
        {{ stagesStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredStages.length === 0" class="empty-state">
        <Route class="empty-state-icon" />
        <p class="empty-state-title">No stages found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first stage to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell-sortable" @click="toggleSort('name')">
                  <div class="flex items-center gap-1">
                    Stage Name
                    <component :is="getSortIcon('name')" class="w-4 h-4" :class="sortKey === 'name' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell">Features</th>
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
              <tr v-for="stage in filteredStages" :key="stage.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editStage(stage)">
                  {{ stage.name }}
                  <span v-if="stage.archived" class="badge badge-error ml-2">Archived</span>
                </td>
                <td class="table-cell">
                  <div class="flex gap-2 items-center">
                    <span v-if="stage.useKnowledge" class="feature-badge">
                      <BookOpen class="w-4 h-4" />
                      <span class="feature-tooltip">Knowledge Base</span>
                    </span>
                    <span v-if="stage.useGlobalActions" class="feature-badge">
                      <Zap class="w-4 h-4" />
                      <span class="feature-tooltip">Global Actions</span>
                    </span>
                    <span v-if="stage.defaultClassifierId" class="feature-badge">
                      <Target class="w-4 h-4" />
                      <span class="feature-tooltip">Classifier</span>
                    </span>
                    <span v-if="stage.transformerIds?.length" class="feature-badge">
                      <Microchip class="w-4 h-4" />
                      <span class="feature-tooltip">{{ stage.transformerIds.length }} Context Transformer{{ stage.transformerIds.length === 1 ? '' : 's' }}</span>
                    </span>
                  </div>
                </td>
                <td class="table-cell">
                  <div v-if="stage.tags?.length" class="tag-list">
                    <span v-for="tag in stage.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted"><RelativeDate :date="stage.updatedAt" /></td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editStage(stage)" class="btn-secondary btn-sm">
                      {{ (projectIsArchived || stage.archived) ? 'View' : 'Edit' }}
                    </button>
                    <button @click="deleteStage(stage)" class="btn-danger btn-sm" :disabled="stage.archived">
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
        :displayed-count="filteredStages.length"
        resource-name="stages"
      />
      </div>
  </div>
</template>

<style scoped>
.feature-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: default;
}

.feature-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.75rem;
  line-height: 1.4;
  padding: 5px 8px;
  border-radius: 5px;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.feature-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1f2937;
}

.feature-badge:hover .feature-tooltip {
  display: block;
}
</style>
