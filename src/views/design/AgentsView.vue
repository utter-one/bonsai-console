<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAgentsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { Drama, Search, X, Plus } from 'lucide-vue-next'
import type { AgentResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const agentsStore = useAgentsStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-agents')

// Pagination
const pagination = usePagination({
  store: agentsStore,
  pageSize: 20,
  onPageChange: loadAgents
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

// Search
const { searchQuery, filteredItems: filteredAgents, clearSearch } = useSearch(
  () => agentsStore.items,
  (agent, query) => agent.name.toLowerCase().includes(query)
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadAgents()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadAgents()
})

// Lifecycle
onMounted(async () => {
  await loadAgents()
})

// Methods
async function loadAgents() {
  try {
    const orderBy = getOrderBy()
    await agentsStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}) })
    )
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

function createAgent() {
  router.push({
    name: 'design.agents.create',
    params: { projectId: projectId.value }
  })
}

function editAgent(agent: AgentResponse) {
  router.push({
    name: 'design.agents.edit',
    params: {
      projectId: projectId.value,
      agentId: agent.id
    }
  })
}

async function deleteAgent(agent: AgentResponse) {
  if (!confirm(`Delete agent "${agent.name}" (${agent.id})?\n\nThis action cannot be undone.`)) return

  try {
    await agentsStore.remove(projectId.value, agent.id, agent.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete agent')
  }
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
        <h1 class="page-title">Agents</h1>
        <p class="page-subtitle">Manage AI agents for this project</p>
      </div>
      <button @click="createAgent" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Agent
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input v-model="searchQuery" type="text" placeholder="Search by name..." class="search-input" />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="agentsStore.isLoading" class="loading-state">
      Loading agents...
    </div>

    <!-- Error State -->
    <div v-else-if="agentsStore.error" class="error-state">
      {{ agentsStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAgents.length === 0" class="empty-state">
      <Drama class="empty-state-icon" />
      <p class="empty-state-title">No agents found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first agent to get started</p>
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
            <tr v-for="agent in filteredAgents" :key="agent.id" class="table-row">
              <td class="table-clickable-cell"
                @click="editAgent(agent)">
                {{ agent.name }}
              </td>
              <td class="table-cell">
                <div v-if="agent.tags?.length" class="tag-list">
                  <span v-for="tag in agent.tags" :key="tag" class="tag-item">{{ tag }}</span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted">{{ formatDate(agent.updatedAt) }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editAgent(agent)" class="btn-secondary btn-sm">
                    Edit
                  </button>
                  <button @click="deleteAgent(agent)" class="btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <PaginationControls :pagination="pagination" :displayed-count="filteredAgents.length"
        resource-name="agents" />
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
