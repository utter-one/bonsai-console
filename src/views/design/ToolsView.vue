<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToolsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import { Hammer, Search, X, Plus, FileText, Image as ImageIcon, Layers } from 'lucide-vue-next'
import type { ToolResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

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

const filteredTools = computed(() => {
  if (!debouncedSearchQuery.value) return toolsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return toolsStore.items.filter(tool => 
    tool.name.toLowerCase().includes(query) ||
    tool.description?.toLowerCase().includes(query) ||
    tool.prompt.toLowerCase().includes(query)
  )
})

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadTools()
})

// Watch for projectId changes
watch(projectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
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
      pagination.getParams({ filters: { projectId: projectId.value }, ...(orderBy ? { orderBy } : {}) })
    )
  } catch (error) {
    console.error('Failed to load tools:', error)
  }
}

async function deleteTool(tool: ToolResponse) {
  if (!confirm(`Delete tool "${tool.name}" (${tool.id})?\n\nThis action cannot be undone.`)) return

  try {
    await toolsStore.remove(tool.id, tool.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete tool')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}

function createTool() {
  router.push({ name: 'design.tools.create', params: { projectId: projectId.value } })
}

function editTool(tool: ToolResponse) {
  router.push({ name: 'design.tools.edit', params: { projectId: projectId.value, toolId: tool.id } })
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'text': return FileText
    case 'image': return ImageIcon
    case 'multi-modal': return Layers
    default: return FileText
  }
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
        <button @click="createTool" class="btn-primary">
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
                <th class="table-header-cell-sortable" @click="toggleSort('description')">
                  <div class="flex items-center gap-1">
                    Description
                    <component :is="getSortIcon('description')" class="w-4 h-4" :class="sortKey === 'description' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell">Input/Output Types</th>
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
                <td class="table-clickable-cell" @click="editTool(tool)">{{ tool.name }}</td>
                <td class="table-cell">
                  <span v-if="tool.description" class="truncate">{{ tool.description.length > 30 ? tool.description.substring(0, 30) + '...' : tool.description }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-1.5 text-xs text-gray-600">
                      <component :is="getTypeIcon(tool.inputType)" class="w-4 h-4" />
                      <span>⇒</span>
                      <component :is="getTypeIcon(tool.outputType)" class="w-4 h-4" />
                    </div>
                  </div>
                </td>
                <td class="table-cell-muted">{{ formatDate(tool.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editTool(tool)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteTool(tool)" class="btn-danger btn-sm">
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
