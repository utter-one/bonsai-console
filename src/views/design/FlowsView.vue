<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFlowsStore, useProjectSelectionStore } from '@/stores'
import { usePagination } from '@/composables'
import { GitFork, Search, X, Plus } from 'lucide-vue-next'
import type { FlowResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const flowsStore = useFlowsStore()
const projectSelectionStore = useProjectSelectionStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: flowsStore,
  pageSize: 20,
  onPageChange: loadFlows
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const filteredFlows = computed(() => {
  if (!debouncedSearchQuery.value) return flowsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return flowsStore.items.filter(flow =>
    flow.name.toLowerCase().includes(query) ||
    flow.description?.toLowerCase().includes(query)
  )
})

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Watch for projectId changes
watch(projectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadFlows()
})

// Lifecycle
onMounted(async () => {
  await loadFlows()
})

// Methods
async function loadFlows() {
  try {
    await flowsStore.fetchAll(projectId.value, pagination.getParams())
  } catch (error) {
    console.error('Failed to load flows:', error)
  }
}

async function deleteFlow(flow: FlowResponse) {
  if (!confirm(`Delete flow "${flow.name}" (${flow.id})?\n\nThis action cannot be undone.`)) return

  try {
    await flowsStore.remove(projectId.value, flow.id, flow.version)
    await loadFlows()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete flow')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}

function createFlow() {
  router.push({ name: 'design.flows.create', params: { projectId: projectId.value } })
}

function editFlow(flow: FlowResponse) {
  router.push({ name: 'design.flows.edit', params: { projectId: projectId.value, flowId: flow.id } })
}
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Flows</h1>
        <p class="page-subtitle">Manage reusable action flows for this project</p>
      </div>
      <button @click="createFlow" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Flow
      </button>
    </div>

    <!-- Search Bar -->
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

    <!-- Loading State -->
    <div v-if="flowsStore.isLoading" class="loading-state">
      Loading flows...
    </div>

    <!-- Error State -->
    <div v-else-if="flowsStore.error" class="error-state">
      {{ flowsStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredFlows.length === 0" class="empty-state">
      <GitFork class="empty-state-icon" />
      <p class="empty-state-title">No flows found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first flow to get started</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Name</th>
              <th class="table-header-cell">Description</th>
              <th class="table-header-cell">Actions</th>
              <th class="table-header-cell">Tools</th>
              <th class="table-header-cell">Updated</th>
              <th class="table-header-cell-right">Operations</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="flow in filteredFlows" :key="flow.id" class="table-row">
              <td class="table-clickable-cell" @click="editFlow(flow)">{{ flow.name }}</td>
              <td class="table-cell">
                <span v-if="flow.description" class="truncate">
                  {{ flow.description.length > 50 ? flow.description.substring(0, 50) + '...' : flow.description }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted">
                {{ Object.keys(flow.actions || {}).length }}
              </td>
              <td class="table-cell-muted">
                {{ (flow.toolIds || []).length }}
              </td>
              <td class="table-cell-muted">{{ formatDate(flow.updatedAt) }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button
                    type="button"
                    @click="editFlow(flow)"
                    class="btn-secondary btn-sm"
                    title="Edit flow"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    @click="deleteFlow(flow)"
                    class="btn-danger btn-sm"
                    title="Delete flow"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationControls
      :pagination="pagination"
      :displayed-count="filteredFlows.length"
      resource-name="flows"
    />
  </div>
</template>
