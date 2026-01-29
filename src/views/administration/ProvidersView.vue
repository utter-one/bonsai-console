<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProvidersStore } from '@/stores'
import { usePagination } from '@/composables'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { Bot, Search, X, Plus } from 'lucide-vue-next'
import type { ProviderResponse } from '@/types/api'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const providersStore = useProvidersStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: providersStore,
  pageSize: 20,
  onPageChange: loadProviders
})

// Computed
const filteredProviders = computed(() => {
  if (!debouncedSearchQuery.value) return providersStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return providersStore.items.filter(provider => 
    provider.id.toLowerCase().includes(query) ||
    provider.name.toLowerCase().includes(query) ||
    provider.description?.toLowerCase().includes(query) ||
    provider.apiType.toLowerCase().includes(query) ||
    provider.providerType.toLowerCase().includes(query)
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

// Lifecycle
onMounted(async () => {
  await loadProviders()
})

// Methods
async function loadProviders() {
  try {
    await providersStore.fetchAll(pagination.getParams())
  } catch (error) {
    console.error('Failed to load providers:', error)
  }
}

async function deleteProvider(provider: ProviderResponse) {
  if (!confirm(`Delete provider "${provider.name}" (${provider.id})?\n\nThis action cannot be undone.`)) return

  try {
    await providersStore.remove(provider.id, provider.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete provider')
  }
}

function createProvider() {
  router.push({ name: 'administration.providers.create' })
}

function editProvider(provider: ProviderResponse) {
  router.push({ 
    name: 'administration.providers.edit', 
    params: { providerId: provider.id } 
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}

function getProviderTypeBadgeClass(type: string) {
  switch (type) {
    case 'llm': return 'badge-primary'
    case 'asr': return 'badge-info'
    case 'tts': return 'badge-warning'
    case 'embeddings': return 'badge-secondary'
    default: return 'badge-default'
  }
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Providers</h1>
          <p class="page-subtitle">Configure AI providers (LLM, ASR, TTS, Embeddings)</p>
        </div>
        <button @click="createProvider" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Provider
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, type, or description..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="providersStore.isLoading" class="loading-state">
        Loading providers...
      </div>

      <!-- Error State -->
      <div v-else-if="providersStore.error" class="error-state">
        {{ providersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProviders.length === 0" class="empty-state">
        <Bot class="empty-state-icon" />
        <p class="empty-state-title">No providers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first provider to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Name</th>
                <th class="table-header-cell">ID</th>
                <th class="table-header-cell">Type</th>
                <th class="table-header-cell">API Type</th>
                <th class="table-header-cell">Description</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="provider in filteredProviders" :key="provider.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editProvider(provider)">
                    {{ provider.name }}
                </td>
                <td class="table-cell-mono">{{ provider.id }}</td>
                <td class="table-cell">
                  <span :class="['badge', getProviderTypeBadgeClass(provider.providerType)]">
                    {{ provider.providerType.toUpperCase() }}
                  </span>
                </td>
                <td class="table-cell-mono">{{ provider.apiType }}</td>
                <td class="table-cell">
                  <span v-if="provider.description" class="truncate max-w-xs">{{ provider.description }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(provider.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editProvider(provider)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteProvider(provider)" class="btn-danger btn-sm">
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
          :displayed-count="filteredProviders.length"
          resource-name="providers"
        />
      </div>
    </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
