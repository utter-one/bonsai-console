<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassifiersStore } from '@/stores'
import { usePagination } from '@/composables'
import { Target, Search, X, Plus } from 'lucide-vue-next'
import type { ClassifierResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const route = useRoute()
const router = useRouter()
const classifiersStore = useClassifiersStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: classifiersStore,
  pageSize: 20,
  onPageChange: loadClassifiers
})

// Computed
const projectId = computed(() => route.params.projectId as string)

const filteredClassifiers = computed(() => {
  if (!debouncedSearchQuery.value) return classifiersStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return classifiersStore.items.filter(classifier => 
    classifier.name.toLowerCase().includes(query) ||
    classifier.description?.toLowerCase().includes(query) ||
    classifier.prompt.toLowerCase().includes(query)
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
  loadClassifiers()
})

// Lifecycle
onMounted(async () => {
  await loadClassifiers()
})

// Methods
async function loadClassifiers() {
  try {
    await classifiersStore.fetchAll(
      pagination.getParams({ filters: { projectId: projectId.value } })
    )
  } catch (error) {
    console.error('Failed to load classifiers:', error)
  }
}

async function deleteClassifier(classifier: ClassifierResponse) {
  if (!confirm(`Delete classifier "${classifier.name}" (${classifier.id})?\n\nThis action cannot be undone.`)) return

  try {
    await classifiersStore.remove(classifier.id, classifier.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete classifier')
  }
}

function createClassifier() {
  router.push({ name: 'design.classifiers.create', params: { projectId: projectId.value } })
}

function editClassifier(classifier: ClassifierResponse) {
  router.push({ 
    name: 'design.classifiers.edit', 
    params: { projectId: projectId.value, classifierId: classifier.id } 
  })
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
          <h1 class="page-title">Classifiers</h1>
          <p class="page-subtitle">Configure classification rules for this project</p>
        </div>
        <button @click="createClassifier" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Classifier
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
      <div v-if="classifiersStore.isLoading" class="loading-state">
        Loading classifiers...
      </div>

      <!-- Error State -->
      <div v-else-if="classifiersStore.error" class="error-state">
        {{ classifiersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredClassifiers.length === 0" class="empty-state">
        <Target class="empty-state-icon" />
        <p class="empty-state-title">No classifiers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first classifier to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Name</th>
                <th class="table-header-cell">Description</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="classifier in filteredClassifiers" :key="classifier.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editClassifier(classifier)">
                    {{ classifier.name }}
                </td>
                <td class="table-cell">
                  <span v-if="classifier.description" class="truncate">{{ classifier.description.length > 30 ? classifier.description.substring(0, 30) + '...' : classifier.description }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(classifier.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editClassifier(classifier)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteClassifier(classifier)" class="btn-danger btn-sm">
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
        :displayed-count="filteredClassifiers.length"
        resource-name="classifiers"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
