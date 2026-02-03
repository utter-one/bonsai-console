<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useIssuesStore, useProjectSelectionStore } from '@/stores'
import { usePagination } from '@/composables'
import { Bug, Search, X } from 'lucide-vue-next'
import type { IssueResponse } from '@/api/types'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'

const issuesStore = useIssuesStore()
const projectSelectionStore = useProjectSelectionStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: issuesStore,
  pageSize: 20,
  onPageChange: loadIssues
})

// Computed
const filteredIssues = computed(() => {
  if (!debouncedSearchQuery.value) return issuesStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return issuesStore.items.filter(issue => {
    const issueAny = issue as any
    return (
      issueAny.title?.toLowerCase().includes(query) ||
      issueAny.description?.toLowerCase().includes(query) ||
      issueAny.id?.toString().includes(query)
    )
  })
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

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadIssues()
})

// Lifecycle
onMounted(async () => {
  await loadIssues()
})

// Methods
async function loadIssues() {
  try {
    const filters: any = {}
    
    // Add project filter if a project is selected
    if (projectSelectionStore.selectedProjectId) {
      filters.projectId = {
        op: 'eq',
        value: projectSelectionStore.selectedProjectId
      }
    }
    
    await issuesStore.fetchAll(pagination.getParams({ filters }))
  } catch (error) {
    console.error('Failed to load issues:', error)
  }
}

function clearSearch() {
  searchQuery.value = ''
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Issues</h1>
          <p class="page-subtitle">Track and manage system issues</p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search issues..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="issuesStore.isLoading" class="loading-state">
        Loading issues...
      </div>

      <!-- Error State -->
      <div v-else-if="issuesStore.error" class="error-state">
        {{ issuesStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredIssues.length === 0" class="empty-state">
        <Bug class="empty-state-icon" />
        <p class="empty-state-title">No issues found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else-if="projectSelectionStore.selectedProjectId">No issues found for the selected project</p>
        <p v-else>No issues have been reported yet</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">ID</th>
                <th class="table-header-cell">Title</th>
                <th class="table-header-cell">Created</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="issue in filteredIssues" :key="issue.id" class="table-row">
                <td class="table-cell font-mono text-sm">{{ issue.id }}</td>
                <td class="table-cell">{{ (issue as any).title || 'Untitled Issue' }}</td>
                <td class="table-cell-muted">{{ formatDate((issue as any).createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <PaginationControls
          :pagination="pagination"
          :displayed-count="filteredIssues.length"
          resource-name="issues"
        />
      </div>
    </div>
  </MonitorSectionLayout>
</template>
