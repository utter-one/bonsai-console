<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToolsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch, formatDate } from '@/composables'
import { Hammer, Search, X, Plus, Sparkles, Globe, Code2 } from 'lucide-vue-next'
import type { ToolResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-tools')

// Pagination
const pagination = usePagination({
  store: toolsStore,
  pageSize: 20,
  onPageChange: loadTools
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: textFilteredTools, clearSearch } = useSearch(
  () => toolsStore.items
)

// Type filter
const typeFilter = ref<'all' | 'smart_function' | 'webhook' | 'script'>('all')

const filteredTools = computed(() =>
  typeFilter.value === 'all'
    ? textFilteredTools.value
    : textFilteredTools.value.filter(t => t.type === typeFilter.value)
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadTools()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadTools()
})

// Lifecycle
onMounted(async () => {
  await loadTools()
})

// Methods
async function loadTools() {
  try {
    const orderBy = getOrderBy()
    await toolsStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load tools:', error)
  }
}

async function deleteTool(tool: ToolResponse) {
  if (!confirm(`Delete tool "${tool.name}" (${tool.id})?\n\nThis action cannot be undone.`)) return

  try {
    await toolsStore.remove(projectId.value, tool.id, tool.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete tool')
  }
}




function createTool() {
  if (projectIsArchived.value) return
  router.push({ name: 'design.tools.create', params: { projectId: projectId.value } })
}

function editTool(tool: ToolResponse) {
  router.push({ name: 'design.tools.edit', params: { projectId: projectId.value, toolId: tool.id } })
}

function getTypeBadgeClass(type: string) {
  if (type === 'webhook') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  if (type === 'script') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
}

function getTypeLabel(type: string) {
  if (type === 'webhook') return 'Webhook'
  if (type === 'script') return 'Script'
  return 'Smart Function'
}

function getTypeIcon(type: string) {
  if (type === 'webhook') return Globe
  if (type === 'script') return Code2
  return Sparkles
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Tools</h1>
          <p class="page-subtitle">Configure available tools for this project</p>
        </div>
        <button @click="createTool" class="btn-primary" :disabled="projectIsArchived">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Tool
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

      <!-- Type Filter -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button
          v-for="opt in [
            { value: 'all', label: 'All' },
            { value: 'smart_function', label: 'Smart Function', icon: Sparkles },
            { value: 'webhook', label: 'Webhook', icon: Globe },
            { value: 'script', label: 'Script', icon: Code2 },
          ]"
          :key="opt.value"
          type="button"
          @click="typeFilter = opt.value as 'all' | 'smart_function' | 'webhook' | 'script'"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
            typeFilter === opt.value
              ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
          ]"
        >
          <component v-if="opt.icon" :is="opt.icon" class="w-3.5 h-3.5" />
          {{ opt.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="toolsStore.isLoading" class="loading-state">
        Loading tools...
      </div>

      <!-- Error State -->
      <div v-else-if="toolsStore.error" class="error-state">
        {{ toolsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTools.length === 0" class="empty-state">
        <Hammer class="empty-state-icon" />
        <p class="empty-state-title">No tools found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first tool to get started</p>
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
                <th class="table-header-cell">Type</th>
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
              <tr v-for="tool in filteredTools" :key="tool.id" class="table-row">
                <td class="table-clickable-cell" @click="editTool(tool)">{{ tool.name }}<span v-if="tool.archived" class="badge badge-error ml-2">Archived</span></td>
                <td class="table-cell">
                  <span :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', getTypeBadgeClass(tool.type)]">
                    <component :is="getTypeIcon(tool.type)" class="w-3 h-3" />
                    {{ getTypeLabel(tool.type) }}
                  </span>
                </td>
                <td class="table-cell">
                  <div v-if="tool.tags?.length" class="tag-list">
                    <span v-for="tag in tool.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(tool.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editTool(tool)" class="btn-secondary btn-sm">
                      {{ (projectIsArchived || tool.archived) ? 'View' : 'Edit' }}
                    </button>
                    <button @click="deleteTool(tool)" class="btn-danger btn-sm" :disabled="tool.archived">
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
        :displayed-count="filteredTools.length"
        resource-name="tools"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
