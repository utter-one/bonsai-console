<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScenariosStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { ClipboardList, Search, X, Plus } from 'lucide-vue-next'
import type { ScenarioResponse } from '@/api/types'

const router = useRouter()
const scenariosStore = useScenariosStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-scenarios')

const pagination = usePagination({
  store: scenariosStore,
  pageSize: 20,
  onPageChange: loadScenarios,
})

const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredScenarios, clearSearch } = useSearch(
  () => scenariosStore.items
)

watch([sortKey, sortOrder], () => {
  loadScenarios()
})

watch(debouncedSearchQuery, () => {
  pagination.reset()
})

watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadScenarios()
})

onMounted(async () => {
  await loadScenarios()
})

async function loadScenarios() {
  try {
    const orderBy = getOrderBy()
    await scenariosStore.fetchAll(
      projectId.value,
      pagination.getParams({
        ...(orderBy ? { orderBy } : {}),
        ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}),
      })
    )
  } catch (error) {
    console.error('Failed to load scenarios:', error)
  }
}

async function deleteScenario(scenario: ScenarioResponse) {
  if (!confirm(`Delete scenario "${scenario.name}" (${scenario.id})?\n\nThis action cannot be undone.`)) return

  try {
    await scenariosStore.remove(projectId.value, scenario.id, scenario.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete scenario')
  }
}

function createScenario() {
  if (projectIsArchived.value) return
  router.push({ name: 'testing.scenarios.create', params: { projectId: projectId.value } })
}

function editScenario(scenario: ScenarioResponse) {
  router.push({
    name: 'testing.scenarios.edit',
    params: { projectId: projectId.value, scenarioId: scenario.id },
  })
}
</script>

<template>
  <div class="container-constrained">
    <!-- Section header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Scenarios</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Define test scenarios that simulate conversations against your project.
        </p>
      </div>
      <button @click="createScenario" class="btn-primary shrink-0" :disabled="projectIsArchived">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Scenario
      </button>
    </div>

    <!-- Search bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or description..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="scenariosStore.isLoading" class="loading-state">
      Loading scenarios...
    </div>

    <!-- Error state -->
    <div v-else-if="scenariosStore.error" class="error-state">
      {{ scenariosStore.error.message }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredScenarios.length === 0" class="empty-state">
      <ClipboardList class="empty-state-icon" />
      <p class="empty-state-title">No scenarios found</p>
      <p v-if="searchQuery" class="empty-state-description">Try adjusting your search criteria</p>
      <p v-else class="empty-state-description">Create your first scenario to start testing</p>
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
              <th class="table-header-cell">Language</th>
              <th class="table-header-cell">Max Turns</th>
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
            <tr v-for="scenario in filteredScenarios" :key="scenario.id" class="table-row">
              <td class="table-clickable-cell" @click="editScenario(scenario)">
                {{ scenario.name }}
              </td>
              <td class="table-cell-muted">{{ scenario.language }}</td>
              <td class="table-cell-muted">{{ scenario.maxTurns }}</td>
              <td class="table-cell">
                <div v-if="scenario.tags?.length" class="tag-list">
                  <span v-for="tag in scenario.tags" :key="tag" class="tag-item">{{ tag }}</span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted">
                <RelativeDate :date="scenario.updatedAt" />
              </td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editScenario(scenario)" class="btn-secondary btn-sm">
                    {{ projectIsArchived ? 'View' : 'Edit' }}
                  </button>
                  <button @click="deleteScenario(scenario)" class="btn-danger btn-sm" :disabled="projectIsArchived">
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
        :displayed-count="filteredScenarios.length"
        resource-name="scenarios"
      />
    </div>
  </div>
</template>
