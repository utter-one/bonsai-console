<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIssuesStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { usePagination, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import { Bug, Search, X, Plus, ChevronDown, Eye } from 'lucide-vue-next'
import type { IssueResponse, CreateIssueRequest, UpdateIssueRequest, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'

import PaginationControls from '@/components/PaginationControls.vue'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'

const route = useRoute()
const router = useRouter()
const issuesStore = useIssuesStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => issuesStore.items)

// UI State
const showModal = ref(false)
const selectedIssue = ref<IssueResponse | null>(null)
const showArchived = ref(false)
const issueError = ref<ParsedError | null>(null)
const loadError = ref<string | null>(null)

// Whether a project is currently selected
const hasProjectSelected = computed(() => !!projectSelectionStore.selectedProjectId)
const projectStatus = computed(() => showArchived.value ? 'archived' : 'active')

// Pagination
const pagination = usePagination({
  store: issuesStore,
  pageSize: 20,
  onPageChange: loadIssues
})

const filteredIssues = computed(() => issuesStore.items)

function isIssueArchived(issue: IssueResponse): boolean {
  const project = projectsStore.unfilteredProjects.find(p => p.id === issue.projectId)
  return !!project?.archivedAt
}

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for archived toggle changes (only relevant when no project is selected)
watch(showArchived, () => {
  if (!hasProjectSelected.value) {
    pagination.reset()
  }
})


// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  clearSearch()
  pagination.reset()
  loadIssues()
})

// Lifecycle
onMounted(() => {
  projectsStore.fetchUnfilteredProjects()
  loadIssues()
})

// Methods
async function loadIssues() {
  loadError.value = null
  try {
    const filters: any = {}
    if (projectSelectionStore.selectedProjectId) {
      filters.projectId = projectSelectionStore.selectedProjectId
    } else {
      filters.projectStatus = projectStatus.value
    }
    await issuesStore.fetchAll(pagination.getParams({ filters, ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) }))
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || 'Failed to load issues'
  }
}


function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getProjectName(projectId: string): string {
  const project = projectsStore.unfilteredProjects.find(p => p.id === projectId)
  return project ? project.name : projectId
}

const STATUS_OPTIONS = [
  { value: 'awaiting', label: 'Awaiting' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'ready-to-test', label: 'Ready to Test' },
  { value: 'still-occurs', label: 'Still Occurs' },
  { value: 'done', label: 'Done' },
  { value: 'cannot-reproduce', label: 'Cannot Reproduce' },
  { value: 'wont-fix', label: "Won't Fix" },
]

function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    'awaiting': 'issue-badge-status-awaiting',
    'in-progress': 'issue-badge-status-inprogress',
    'ready-to-test': 'issue-badge-status-ready',
    'still-occurs': 'issue-badge-status-stilloccurs',
    'done': 'issue-badge-status-done',
    'cannot-reproduce': 'issue-badge-status-cannotreproduce',
    'wont-fix': 'issue-badge-status-wontfix',
  }
  return statusMap[status.toLowerCase()] || 'badge-secondary'
}

function formatSeverityDisplay(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()
}

function getSeverityClass(severity: string): string {
  const severityMap: Record<string, string> = {
    critical: 'issue-badge-severity-error',
    major: 'issue-badge-severity-warning',
    minor: 'issue-badge-severity-info',
    trivial: 'issue-badge-severity-inactive'
  }
  return severityMap[severity.toLowerCase()] || 'issue-badge-severity-inactive'
}

async function handleStatusChange(issue: IssueResponse, newStatus: string) {
  const previousStatus = issue.status
  issue.status = newStatus
  try {
    await issuesStore.update(issue.id.toString(), { status: newStatus })
  } catch (error) {
    issue.status = previousStatus
    console.error('Failed to update issue status:', error)
  }
}

function openCreateModal() {
  selectedIssue.value = null
  issueError.value = null
  showModal.value = true
}

function openEditModal(issue: IssueResponse) {
  selectedIssue.value = issue
  issueError.value = null
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
    issueError.value = parseApiError(error)
  }
}

async function handleRecoverSuccess() {
  await loadIssues()
  if (selectedIssue.value) {
    selectedIssue.value = await issuesStore.fetchById(selectedIssue.value.id.toString())
  }
}
</script>

<template>
  <div class="flex-1 min-w-0">
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
      <div class="search-container flex gap-4">
        <div class="relative flex-1">
          <Search class="input-icon-left" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
            <X class="w-5 h-5" />
          </button>
        </div>
        <label v-if="!hasProjectSelected" class="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <span>Project status:</span>
          <select v-model="showArchived" class="form-select">
            <option :value="false">Active</option>
            <option :value="true">Archived</option>
          </select>
        </label>
      </div>

      <!-- Loading State -->
      <div v-if="issuesStore.isLoading" class="loading-state">
        Loading issues...
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="error-state">
        {{ loadError }}
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
                @click="router.push({ name: 'monitor.issueDetail', params: { projectId: route.params.projectId as string, issueId: issue.id } })"
              >
                <td class="table-cell font-mono text-sm">{{ issue.id }}</td>
                <td class="table-cell font-medium">{{ getProjectName(issue.projectId) }}</td>
                <td class="table-cell">{{ truncateText(issue.bugDescription) }}</td>
                <td class="table-cell">
                  <div class="relative inline-block" @click.stop>
                    <select
                      :value="issue.status"
                     :class="getStatusClass(issue.status)"
                      :disabled="isIssueArchived(issue)"
                      class="appearance-none border-none outline-none rounded text-xs font-semibold cursor-pointer pl-2 pr-6 py-1 min-w-24 disabled:cursor-default disabled:opacity-85"
                      @change="handleStatusChange(issue, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
                    </select>
                    <ChevronDown class="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white" />
                  </div>
                </td>
                <td class="table-cell">
                  <span :class="getSeverityClass(issue.severity)">{{ formatSeverityDisplay(issue.severity) }}</span>
                </td>
                <td class="table-cell">{{ issue.category }}</td>
                <td class="table-cell-muted"><RelativeDate :date="issue.createdAt" /></td>
                <td class="table-cell">
                  <div class="flex-end">
                    <button @click.stop="openEditModal(issue)" class="btn-icon-action" title="View">
                      <Eye class="w-4 h-4" />
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
      :error="issueError"
      :prefill-data="selectedIssue ? undefined : { projectId: projectSelectionStore.selectedProjectId || undefined }"
      :is-read-only="selectedIssue ? isIssueArchived(selectedIssue) : false"
      :load-history="selectedIssue ? () => issuesStore.fetchAuditLogs(selectedIssue!.id.toString()) : undefined"
      :update-fn="selectedIssue ? (data) => issuesStore.update(selectedIssue!.id.toString(), data) : undefined"
      :create-fn="selectedIssue ? (data) => issuesStore.create(data) : undefined"
      @close="closeModal"
      @save="handleSave"
      @recover-success="handleRecoverSuccess"
    />
  </div>
</template>

<style scoped>
select option {
  background-color: white;
  color: #111827;
}

[data-theme="dark"] select option {
  background-color: #374151;
  color: #f9fafb;
}
</style>
