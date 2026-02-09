<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useKnowledgeStore, useProjectSelectionStore } from '@/stores'
import { usePagination } from '@/composables'
import { BookOpen, Search, X, Plus, ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { KnowledgeCategoryResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const knowledgeStore = useKnowledgeStore()
const projectSelectionStore = useProjectSelectionStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const expandedCategories = ref<Set<string>>(new Set())

// Pagination
const pagination = usePagination({
  store: { 
    items: computed(() => knowledgeStore.categories),
    isLoading: computed(() => knowledgeStore.isLoading),
    error: computed(() => knowledgeStore.error),
    pagination: {
      get total() { return knowledgeStore.categories.length }
    }
  },
  pageSize: 20,
  onPageChange: loadCategories
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const filteredCategories = computed(() => {
  if (!debouncedSearchQuery.value) return knowledgeStore.categories
  const query = debouncedSearchQuery.value.toLowerCase()
  return knowledgeStore.categories.filter(category => 
    category.name.toLowerCase().includes(query) ||
    category.promptTrigger.toLowerCase().includes(query)
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
  expandedCategories.value.clear()
  pagination.reset()
  loadCategories()
})

// Lifecycle
onMounted(async () => {
  await loadCategories()
})

// Methods
async function loadCategories() {
  try {
    await knowledgeStore.fetchCategories({ filters: { projectId: projectId.value } })
  } catch (error) {
    console.error('Failed to load knowledge categories:', error)
  }
}

async function deleteCategory(category: KnowledgeCategoryResponse) {
  if (!confirm(`Delete knowledge category "${category.name}" (${category.id})?\n\nThis will also delete all items in this category.\nThis action cannot be undone.`)) return

  try {
    await knowledgeStore.deleteCategory(category.id)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete knowledge category')
  }
}

function toggleCategory(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Knowledge Base</h1>
          <p class="page-subtitle">Manage knowledge categories and items for this project</p>
        </div>
        <button class="btn-primary" disabled>
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Category
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or prompt trigger..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="knowledgeStore.isLoading" class="loading-state">
        Loading knowledge categories...
      </div>

      <!-- Error State -->
      <div v-else-if="knowledgeStore.error" class="error-state">
        {{ knowledgeStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCategories.length === 0" class="empty-state">
        <BookOpen class="empty-state-icon" />
        <p class="empty-state-title">No knowledge categories found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first knowledge category to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell w-8"></th>
                <th class="table-header-cell">Name</th>
                <th class="table-header-cell">Prompt Trigger</th>
                <th class="table-header-cell">Knowledge Sections</th>
                <th class="table-header-cell">Order</th>
                <th class="table-header-cell">Items</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <template v-for="category in filteredCategories" :key="category.id">
                <tr class="table-row">
                  <td class="table-cell">
                    <button 
                      @click="toggleCategory(category.id)"
                      class="btn-icon"
                      :title="expandedCategories.has(category.id) ? 'Collapse' : 'Expand'"
                    >
                      <ChevronDown v-if="expandedCategories.has(category.id)" class="w-4 h-4" />
                      <ChevronRight v-else class="w-4 h-4" />
                    </button>
                  </td>
                  <td class="table-cell-medium">{{ category.name }}</td>
                  <td class="table-cell">
                    <span class="truncate max-w-md">{{ category.promptTrigger }}</span>
                  </td>
                  <td class="table-cell">
                    <div v-if="category.knowledgeSections?.length" class="flex gap-1 flex-wrap">
                      <span v-for="section in category.knowledgeSections" :key="section" class="badge-info text-xs">
                        {{ section }}
                      </span>
                    </div>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="table-cell">
                    <span class="badge-secondary">{{ category.order }}</span>
                  </td>
                  <td class="table-cell">
                    <span v-if="category.items?.length" class="badge-info">
                      {{ category.items.length }} item(s)
                    </span>
                    <span v-else class="text-gray-400">0</span>
                  </td>
                  <td class="table-cell-muted">{{ formatDate(category.updatedAt) }}</td>
                  <td class="table-cell-right">
                    <div class="flex-end">
                      <button class="btn-secondary btn-sm" disabled>
                        Edit
                      </button>
                      <button @click="deleteCategory(category)" class="btn-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Expanded Items Row -->
                <tr v-if="expandedCategories.has(category.id) && category.items?.length" class="bg-gray-50">
                  <td colspan="8" class="px-4 py-3">
                    <div class="ml-8">
                      <h4 class="text-sm font-semibold text-gray-700 mb-2">Knowledge Items</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="item in category.items" 
                          :key="item.id"
                          class="bg-white border border-gray-200 rounded p-3"
                        >
                          <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-mono text-gray-500">{{ item.id }}</span>
                            <span class="badge-secondary text-xs">Order: {{ item.order }}</span>
                          </div>
                          <div class="mb-1">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Q:</span>
                            <span class="text-sm text-gray-900 dark:text-gray-200 ml-2">{{ item.question }}</span>
                          </div>
                          <div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">A:</span>
                            <span class="text-sm text-gray-600 ml-2">{{ item.answer }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="expandedCategories.has(category.id)" class="bg-gray-50">
                  <td colspan="8" class="px-4 py-3">
                    <div class="ml-8 text-sm text-gray-500 italic">
                      No items in this category
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

      <!-- Pagination Controls -->
      <PaginationControls
        :pagination="pagination"
        :displayed-count="filteredCategories.length"
        resource-name="knowledge categories"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
