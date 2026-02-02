<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContextTransformersStore } from '@/stores'
import { usePagination } from '@/composables'
import { Wrench, Search, X, Plus } from 'lucide-vue-next'
import type { ContextTransformerResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const route = useRoute()
const router = useRouter()
const transformersStore = useContextTransformersStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: transformersStore,
  pageSize: 20,
  onPageChange: loadTransformers
})

// Computed
const projectId = computed(() => route.params.projectId as string)

const filteredTransformers = computed(() => {
  if (!debouncedSearchQuery.value) return transformersStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return transformersStore.items.filter(transformer => 
    transformer.name.toLowerCase().includes(query) ||
    transformer.description?.toLowerCase().includes(query) ||
    transformer.prompt.toLowerCase().includes(query)
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

// Watch for projectId changes
watch(projectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadTransformers()
})

// Lifecycle
onMounted(async () => {
  await loadTransformers()
})

// Methods
async function loadTransformers() {
  try {
    await transformersStore.fetchAll(
      pagination.getParams({ filters: { projectId: projectId.value } })
    )
  } catch (error) {
    console.error('Failed to load context transformers:', error)
  }
}

async function deleteTransformer(transformer: ContextTransformerResponse) {
  if (!confirm(`Delete context transformer "${transformer.name}" (${transformer.id})?\n\nThis action cannot be undone.`)) return

  try {
    await transformersStore.remove(transformer.id, transformer.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete context transformer')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}

function createTransformer() {
  router.push({ name: 'design.contextTransformers.create', params: { projectId: projectId.value } })
}

function editTransformer(transformer: ContextTransformerResponse) {
  router.push({ 
    name: 'design.contextTransformers.edit', 
    params: { projectId: projectId.value, transformerId: transformer.id } 
  })
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Context Transformers</h1>
          <p class="page-subtitle">Manage context transformation logic for this project</p>
        </div>
        <button @click="createTransformer" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Transformer
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
      <div v-if="transformersStore.isLoading" class="loading-state">
        Loading context transformers...
      </div>

      <!-- Error State -->
      <div v-else-if="transformersStore.error" class="error-state">
        {{ transformersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTransformers.length === 0" class="empty-state">
        <Wrench class="empty-state-icon" />
        <p class="empty-state-title">No context transformers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first context transformer to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Name</th>
                <th class="table-header-cell">Description</th>
                <th class="table-header-cell">Prompt Preview</th>
                <th class="table-header-cell">Context Fields</th>
                <th class="table-header-cell">LLM Provider</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="transformer in filteredTransformers" :key="transformer.id" class="table-row">
                <td class="table-cell-medium">{{ transformer.name }}</td>
                <td class="table-cell">
                  <span v-if="transformer.description" class="truncate max-w-xs">{{ transformer.description }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <span class="truncate max-w-md">{{ transformer.prompt }}</span>
                </td>
                <td class="table-cell">
                  <div v-if="transformer.contextFields?.length" class="flex gap-1 flex-wrap">
                    <span v-for="field in transformer.contextFields" :key="field" class="badge-info">
                      {{ field }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-mono">
                  <span v-if="transformer.llmProviderId" class="badge-secondary">
                    {{ transformer.llmProviderId }}
                  </span>
                  <span v-else class="text-gray-400">Default</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(transformer.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editTransformer(transformer)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteTransformer(transformer)" class="btn-danger btn-sm">
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
        :displayed-count="filteredTransformers.length"
        resource-name="context transformers"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
