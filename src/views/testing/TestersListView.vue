<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTestersStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { Bot, Search, X, Plus } from 'lucide-vue-next'
import type { TesterResponse } from '@/api/types'

const router = useRouter()
const testersStore = useTestersStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-testers')

const pagination = usePagination({
  store: testersStore,
  pageSize: 20,
  onPageChange: loadTesters,
})

const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredTesters, clearSearch } = useSearch(
  () => testersStore.items
)

watch([sortKey, sortOrder], () => {
  loadTesters()
})

watch(debouncedSearchQuery, () => {
  pagination.reset()
})

watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadTesters()
})

onMounted(async () => {
  await loadTesters()
})

async function loadTesters() {
  try {
    const orderBy = getOrderBy()
    await testersStore.fetchAll(
      projectId.value,
      pagination.getParams({
        ...(orderBy ? { orderBy } : {}),
        ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}),
      })
    )
  } catch (error) {
    console.error('Failed to load testers:', error)
  }
}

async function deleteTester(tester: TesterResponse) {
  if (!confirm(`Delete tester "${tester.name}" (${tester.id})?\n\nThis action cannot be undone.`)) return

  try {
    await testersStore.remove(projectId.value, tester.id, tester.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete tester')
  }
}

function createTester() {
  if (projectIsArchived.value) return
  router.push({ name: 'testing.testers.create', params: { projectId: projectId.value } })
}

function editTester(tester: TesterResponse) {
  router.push({
    name: 'testing.testers.edit',
    params: { projectId: projectId.value, testerId: tester.id },
  })
}
</script>

<template>
  <div class="container-constrained">
    <!-- Section header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Testers</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Configure AI-powered testers that interact with your project during scenario runs.
        </p>
      </div>
      <button @click="createTester" class="btn-primary shrink-0" :disabled="projectIsArchived">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Tester
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
    <div v-if="testersStore.isLoading" class="loading-state">
      Loading testers...
    </div>

    <!-- Error state -->
    <div v-else-if="testersStore.error" class="error-state">
      {{ testersStore.error.message }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredTesters.length === 0" class="empty-state">
      <Bot class="empty-state-icon" />
      <p class="empty-state-title">No testers found</p>
      <p v-if="searchQuery" class="empty-state-description">Try adjusting your search criteria</p>
      <p v-else class="empty-state-description">Create your first tester to run scenarios</p>
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
              <th class="table-header-cell">Description</th>
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
            <tr v-for="tester in filteredTesters" :key="tester.id" class="table-row">
              <td class="table-clickable-cell" @click="editTester(tester)">
                {{ tester.name }}
              </td>
              <td class="table-cell-muted max-w-xs truncate">
                {{ tester.description || '—' }}
              </td>
              <td class="table-cell">
                <div v-if="tester.tags?.length" class="tag-list">
                  <span v-for="tag in tester.tags" :key="tag" class="tag-item">{{ tag }}</span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted">
                <RelativeDate :date="tester.updatedAt" />
              </td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editTester(tester)" class="btn-secondary btn-sm">
                    {{ projectIsArchived ? 'View' : 'Edit' }}
                  </button>
                  <button @click="deleteTester(tester)" class="btn-danger btn-sm" :disabled="projectIsArchived">
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
        :displayed-count="filteredTesters.length"
        resource-name="testers"
      />
    </div>
  </div>
</template>
