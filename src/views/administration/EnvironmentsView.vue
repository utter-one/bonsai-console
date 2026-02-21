<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEnvironmentsStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { Globe, Search, X, Plus, ArrowDownToLine } from 'lucide-vue-next'
import type { EnvironmentResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'
import MigrationModal from '@/components/modals/MigrationModal.vue'

const router = useRouter()
const environmentsStore = useEnvironmentsStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const showMigrateModal = ref(false)
const migratingEnvironment = ref<EnvironmentResponse | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-environments')

// Pagination
const pagination = usePagination({
  store: environmentsStore,
  pageSize: 20,
  onPageChange: loadEnvironments
})

// Computed
const filteredEnvironments = computed(() => {
  if (!debouncedSearchQuery.value) return environmentsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return environmentsStore.items.filter(env =>
    env.id.toLowerCase().includes(query) ||
    env.description.toLowerCase().includes(query) ||
    env.url.toLowerCase().includes(query) ||
    env.login.toLowerCase().includes(query)
  )
})

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadEnvironments()
})

// Lifecycle
onMounted(async () => {
  await loadEnvironments()
})

// Methods
async function loadEnvironments() {
  try {
    const orderBy = getOrderBy()
    await environmentsStore.fetchAll(pagination.getParams(orderBy ? { orderBy } : {}))
  } catch (error) {
    console.error('Failed to load environments:', error)
  }
}

async function deleteEnvironment(env: EnvironmentResponse) {
  if (!confirm(`Delete environment "${env.description}" (${env.id})?\n\nThis action cannot be undone.`)) return

  try {
    await environmentsStore.remove(env.id, env.version)
    await loadEnvironments()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete environment')
  }
}

function createEnvironment() {
  router.push({ name: 'administration.environments.create' })
}

function editEnvironment(env: EnvironmentResponse) {
  router.push({
    name: 'administration.environments.edit',
    params: { environmentId: env.id }
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}

function openMigrateModal(env: EnvironmentResponse) {
  migratingEnvironment.value = env
  showMigrateModal.value = true
}

function closeMigrateModal() {
  showMigrateModal.value = false
  migratingEnvironment.value = null
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Environments</h1>
          <p class="page-subtitle">Configure deployment environments and their credentials</p>
        </div>
        <button @click="createEnvironment" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Environment
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by description, ID, URL, or login..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="environmentsStore.isLoading" class="loading-state">
        Loading environments...
      </div>

      <!-- Error State -->
      <div v-else-if="environmentsStore.error" class="error-state">
        {{ environmentsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredEnvironments.length === 0" class="empty-state">
        <Globe class="empty-state-icon" />
        <p class="empty-state-title">No environments found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first environment to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell-sortable" @click="toggleSort('description')">
                  <div class="flex items-center gap-1">
                    Description
                    <component :is="getSortIcon('description')" class="w-4 h-4" :class="sortKey === 'description' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('id')">
                  <div class="flex items-center gap-1">
                    ID
                    <component :is="getSortIcon('id')" class="w-4 h-4" :class="sortKey === 'id' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('url')">
                  <div class="flex items-center gap-1">
                    URL
                    <component :is="getSortIcon('url')" class="w-4 h-4" :class="sortKey === 'url' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('login')">
                  <div class="flex items-center gap-1">
                    Login
                    <component :is="getSortIcon('login')" class="w-4 h-4" :class="sortKey === 'login' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
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
              <tr v-for="env in filteredEnvironments" :key="env.id" class="table-row">
                <td class="table-clickable-cell" @click="editEnvironment(env)">
                  {{ env.description }}
                </td>
                <td class="table-cell-mono">{{ env.id }}</td>
                <td class="table-cell-mono">{{ env.url }}</td>
                <td class="table-cell">{{ env.login }}</td>
                <td class="table-cell-muted">{{ formatDate(env.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="openMigrateModal(env)" class="btn-secondary btn-sm" title="Pull data from this environment">
                      <ArrowDownToLine class="inline-block mr-1 w-3.5 h-3.5" />
                      Migrate
                    </button>
                    <button @click="editEnvironment(env)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteEnvironment(env)" class="btn-danger btn-sm">
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
          :displayed-count="filteredEnvironments.length"
          resource-name="environments"
        />
      </div>
    </div>
  </AdministrationSectionLayout>

  <!-- Migration Modal -->
  <MigrationModal
    v-if="showMigrateModal && migratingEnvironment"
    :environment="migratingEnvironment"
    @close="closeMigrateModal"
  />
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
