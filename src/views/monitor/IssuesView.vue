<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useIssuesStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { usePagination } from '@/composables'
import { Bug, Search, X, Plus, Eye } from 'lucide-vue-next'
import type { IssueResponse, CreateIssueRequest, UpdateIssueRequest } from '@/api/types'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'

const issuesStore = useIssuesStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const showModal = ref(false)
const selectedIssue = ref<IssueResponse | null>(null)
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
  return issuesStore.items.filter(issue => 
    issue.bugDescription.toLowerCase().includes(query) ||
    issue.category.toLowerCase().includes(query) ||
    issue.severity.toLowerCase().includes(query) ||
    issue.status.toLowerCase().includes(query) ||
    issue.id.toString().includes(query)
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

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadIssues()
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadIssues(),
    projectsStore.fetchAll()
  ])
})

// Methods
async function loadIssues() {
  try {
    const filters: any = {}
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

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getProjectName(projectId: string): string {
  const project = projectsStore.items.find(p => p.id === projectId)
  return project ? project.name : projectId
}

function getSeverityClass(severity: string): string {
  const severityMap: Record<string, string> = {
    critical: 'badge-error',
    major: 'badge-warning',
    minor: 'badge-info',
    trivial: 'badge-inactive'
  }
  return severityMap[severity.toLowerCase()] || 'badge-inactive'
}

function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    'awaiting': 'badge-awaiting',
    'in-progress': 'badge-in-progress',
    'ready-to-test': 'badge-ready',
    'still-occurs': 'badge-still-occurs',
    'done': 'badge-done',
    'cannot-reproduce': 'badge-cannot-reproduce',
    'wont-fix': 'badge-wont-fix'
  }
  return statusMap[status.toLowerCase()] || 'badge-inactive'
}

function openCreateModal() {
  selectedIssue.value = null
  showModal.value = true
}

function openEditModal(issue: IssueResponse) {
  selectedIssue.value = issue
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedIssue.value = null
}

async function handleSave(data: CreateIssueRequest | UpdateIssueRequest) {
  try {
    if (selectedIssue.value) {
      await issuesStore.update(selectedIssue.value.id.toString(), data as UpdateIssueRequest)
    } else {
      await issuesStore.create(data as CreateIssueRequest)
    }
    closeModal()
    await loadIssues()
  } catch (error) {
    console.error('Failed to save issue:', error)
  }
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
        <button 
          @click="openCreateModal" 
          class="btn-primary"
        >
          <Plus class="w-4 h-4" />
          Create Issue
        </button>
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
        <p v-else>No issues have been reported yet</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">ID</th>
                <th class="table-header-cell">Project</th>
                <th class="table-header-cell">Bug Description</th>
                <th class="table-header-cell">Status</th>
                <th class="table-header-cell">Severity</th>
                <th class="table-header-cell">Category</th>
                <th class="table-header-cell">Date</th>
                <th class="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr 
                v-for="issue in filteredIssues" 
                :key="issue.id" 
                class="table-row cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="openEditModal(issue)"
              >
                <td class="table-cell font-mono text-sm">{{ issue.id }}</td>
                <td class="table-cell font-medium">{{ getProjectName(issue.projectId) }}</td>
                <td class="table-cell">{{ truncateText(issue.bugDescription) }}</td>
                <td class="table-cell">
                  <span :class="getStatusClass(issue.status)">{{ issue.status }}</span>
                </td>
                <td class="table-cell">
                  <span :class="getSeverityClass(issue.severity)">{{ issue.severity }}</span>
                </td>
                <td class="table-cell">{{ issue.category }}</td>
                <td class="table-cell-muted">{{ formatDate(issue.createdAt) }}</td>
                <td class="table-cell">
                  <div class="flex-end">
                    <button @click.stop="openEditModal(issue)" class="btn-secondary btn-sm">
                      View
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
          :displayed-count="filteredIssues.length"
          resource-name="issues"
        />
      </div>
    </div>

    <!-- Issue Edit Modal -->
    <IssueEditModal
      v-if="showModal"
      :issue="selectedIssue"
      :prefill-data="selectedIssue ? undefined : { projectId: projectSelectionStore.selectedProjectId || undefined }"
      @close="closeModal"
      @save="handleSave"
    />
  </MonitorSectionLayout>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

/* Base badge style */
[class^="badge-"] {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Severity badges */
.badge-error {
  background-color: #dc2626;
  color: #fff;
}

.badge-warning {
  background-color: #f59e0b;
  color: #fff;
}

.badge-info {
  background-color: #3b82f6;
  color: #fff;
}

.badge-inactive {
  background-color: #6b7280;
  color: #fff;
}

/* Status badges */
.badge-awaiting {
  background-color: #fb923c;
  color: #fff;
}

.badge-in-progress {
  background-color: #fbbf24;
  color: #fff;
}

.badge-ready {
  background-color: #86efac;
  color: #fff;
}

.badge-still-occurs {
  background-color: #fca5a5;
  color: #fff;
}

.badge-done {
  background-color: #16a34a;
  color: #fff;
}

.badge-cannot-reproduce {
  background-color: #ea580c;
  color: #fff;
}

.badge-wont-fix {
  background-color: #b91c1c;
  color: #fff;
}
</style>
