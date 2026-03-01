<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useApiKeysStore, useAllApiKeysStore, useProjectsStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import { Key, Search, X, Plus } from 'lucide-vue-next'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import ApiKeyEditModal from '@/components/modals/ApiKeyEditModal.vue'

const allApiKeysStore = useAllApiKeysStore()
const apiKeysStore = useApiKeysStore()
const projectsStore = useProjectsStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const showModal = ref(false)
const editingApiKey = ref<ApiKeyResponse | null>(null)
const selectedProjectId = ref<string>('')

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-api-keys')

// Pagination
const pagination = usePagination({
  store: allApiKeysStore,
  pageSize: 20,
  onPageChange: loadApiKeys
})

// Create a map of project IDs to names for efficient lookup
const projectNamesMap = computed(() => {
  const map: Record<string, string> = {}
  projectsStore.items.forEach(project => {
    map[project.id] = project.name
  })
  return map
})

// Computed
const filteredApiKeys = computed(() => {
  if (!debouncedSearchQuery.value) return allApiKeysStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return allApiKeysStore.items.filter(apiKey => 
    apiKey.id.toLowerCase().includes(query) ||
    apiKey.name.toLowerCase().includes(query) ||
    apiKey.keyPreview?.toLowerCase().includes(query) ||
    projectNamesMap.value[apiKey.projectId]?.toLowerCase().includes(query)
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
  loadApiKeys()
})

// Lifecycle
onMounted(async () => {
  await loadProjects()
  await loadApiKeys()
})

// Methods
async function loadProjects() {
  try {
    await projectsStore.fetchAll({ offset: 0, limit: 1000 })
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

async function loadApiKeys() {
  try {
    const orderBy = getOrderBy()
    await allApiKeysStore.fetchAll(pagination.getParams(orderBy ? { orderBy } : {}))
  } catch (error) {
    console.error('Failed to load API keys:', error)
  }
}

function openCreateModal() {
  if (projectsStore.items.length === 0) {
    alert('Please create a project first before creating API keys.')
    return
  }
  
  selectedProjectId.value = ''
  editingApiKey.value = null
  showModal.value = true
}

function openEditModal(apiKey: ApiKeyResponse) {
  selectedProjectId.value = apiKey.projectId
  editingApiKey.value = apiKey
  showModal.value = true
}

async function handleSave(data: CreateApiKeyRequest | UpdateApiKeyRequest) {
  try {
    if (editingApiKey.value) {
      const updateData = data as UpdateApiKeyRequest;
      // Update existing API key
      await apiKeysStore.update(selectedProjectId.value, editingApiKey.value.id, {
        name: updateData.name,
        isActive: updateData.isActive,
        metadata: updateData.metadata,
        version: updateData.version,
      })
      showModal.value = false
      editingApiKey.value = null
    } else {
      const createData = data as CreateApiKeyRequest;
      // Create new API key
      const result = await apiKeysStore.create(selectedProjectId.value, {
        name: createData.name,
        metadata: createData.metadata || {},
      })
      
      // Show the modal again with the created key to display the secret
      if (result) {
        editingApiKey.value = result as ApiKeyResponse
      }
    }
    await loadApiKeys()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to save API key')
  }
}

function handleCreated() {
  // This is emitted after the key is shown - close modal
  showModal.value = false
  editingApiKey.value = null
}

function closeModal() {
  showModal.value = false
  editingApiKey.value = null
}

async function toggleApiKeyStatus(apiKey: ApiKeyResponse) {
  try {
    await apiKeysStore.update(apiKey.projectId, apiKey.id, {
      name: apiKey.name,
      isActive: !apiKey.isActive,
      metadata: apiKey.metadata || {},
      version: apiKey.version,
    })
    await loadApiKeys()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to toggle API key status')
  }
}

async function deleteApiKey(apiKey: ApiKeyResponse) {
  if (!confirm(`Delete API key "${apiKey.name}"?\n\nThis action cannot be undone.`)) return

  try {
    await apiKeysStore.remove(apiKey.projectId, apiKey.id, apiKey.version)
    await loadApiKeys()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete API key')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function getProjectName(projectId: string): string {
  return projectNamesMap.value[projectId] || projectId
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">API Keys</h1>
          <p class="page-subtitle">Manage API keys across all projects</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New API Key
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by ID, name, project, or key preview..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="allApiKeysStore.isLoading" class="loading-state">
        Loading API keys...
      </div>

      <!-- Error State -->
      <div v-else-if="allApiKeysStore.error" class="error-state">
        {{ allApiKeysStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredApiKeys.length === 0" class="empty-state">
        <Key class="empty-state-icon" />
        <p class="empty-state-title">No API keys found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first API key to get started</p>
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
                <th class="table-header-cell-sortable" @click="toggleSort('projectId')">
                  <div class="flex items-center gap-1">
                    Project
                    <component :is="getSortIcon('projectId')" class="w-4 h-4" :class="sortKey === 'projectId' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell">Key Preview</th>
                <th class="table-header-cell-sortable" @click="toggleSort('isActive')">
                  <div class="flex items-center gap-1">
                    Is Active
                    <component :is="getSortIcon('isActive')" class="w-4 h-4" :class="sortKey === 'isActive' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('lastUsedAt')">
                  <div class="flex items-center gap-1">
                    Last Used
                    <component :is="getSortIcon('lastUsedAt')" class="w-4 h-4" :class="sortKey === 'lastUsedAt' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                  <div class="flex items-center gap-1">
                    Created
                    <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="apiKey in filteredApiKeys" :key="apiKey.id" class="table-row">
                <td class="table-clickable-cell" @click="openEditModal(apiKey)">
                  {{ apiKey.name }}
                </td>
                <td class="table-cell">
                  {{ getProjectName(apiKey.projectId) }}
                </td>
                <td class="table-cell">
                  <code class="font-mono text-sm">{{ apiKey.keyPreview }}</code>
                </td>
                <td class="table-cell">
                  <input
                    type="checkbox"
                    :checked="apiKey.isActive"
                    @change="toggleApiKeyStatus(apiKey)"
                    class="form-checkbox cursor-pointer"
                    :title="apiKey.isActive ? 'Click to deactivate' : 'Click to activate'"
                  />
                </td>
                <td class="table-cell-muted">{{ formatDate(apiKey.lastUsedAt) }}</td>
                <td class="table-cell-muted">{{ formatDate(apiKey.createdAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="openEditModal(apiKey)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteApiKey(apiKey)" class="btn-danger btn-sm">
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
          :displayed-count="filteredApiKeys.length"
          resource-name="API keys"
        />
      </div>
    </div>

    <!-- Modal -->
    <ApiKeyEditModal
      v-if="showModal"
      :api-key="editingApiKey"
      :project-id="selectedProjectId"
      @close="closeModal"
      @save="handleSave"
      @created="handleCreated"
      @project-selected="selectedProjectId = $event"
    />
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
