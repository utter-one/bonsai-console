<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuditLogsStore, useProjectSelectionStore } from '@/stores'
import { usePagination } from '@/composables'
import { ClipboardList, Search, X, Calendar, ChevronDown, Filter } from 'lucide-vue-next'
import type { AuditLogResponse } from '@/api/generated/data-contracts'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const auditLogsStore = useAuditLogsStore()
const projectSelectionStore = useProjectSelectionStore()

// Time filter state
const timeFilter = ref<'last-15m' | 'last-30m' | 'last-1h' | 'last-4h' | 'last-24h' | 'last-7d' | 'last-30d' | 'all'>('last-24h')
const showTimeDropdown = ref(false)

const timeFilterOptions = [
  { value: 'last-15m', label: 'Last 15 minutes' },
  { value: 'last-30m', label: 'Last 30 minutes' },
  { value: 'last-1h', label: 'Last 1 hour' },
  { value: 'last-4h', label: 'Last 4 hours' },
  { value: 'last-24h', label: 'Last 24 hours' },
  { value: 'last-7d', label: 'Last 7 days' },
  { value: 'last-30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
] as const

// Action filter state
const actionFilter = ref<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all')
const showActionDropdown = ref(false)

const actionFilterOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
] as const

// Mobile Filter State
const showFilterDrawer = ref(false)

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: auditLogsStore,
  pageSize: 20,
  onPageChange: loadAuditLogs
})

// Computed
const currentTimeFilterLabel = computed(() => {
  return timeFilterOptions.find(opt => opt.value === timeFilter.value)?.label || 'Last 24 hours'
})

const currentActionFilterLabel = computed(() => {
  return actionFilterOptions.find(opt => opt.value === actionFilter.value)?.label || 'All Actions'
})

const hasActiveFilters = computed(() => {
  return timeFilter.value !== 'last-24h' || actionFilter.value !== 'all'
})

const filteredLogs = computed(() => {
  if (!debouncedSearchQuery.value) return auditLogsStore.logs
  const query = debouncedSearchQuery.value.toLowerCase()
  return auditLogsStore.logs.filter(log => {
    return (
      log.action?.toLowerCase().includes(query) ||
      log.entityType?.toLowerCase().includes(query) ||
      log.entityId?.toLowerCase().includes(query) ||
      log.userId?.toLowerCase().includes(query)
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

// Watch for time filter changes
watch(timeFilter, () => {
  pagination.reset()
  loadAuditLogs()
})

// Watch for action filter changes
watch(actionFilter, () => {
  pagination.reset()
  loadAuditLogs()
})

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadAuditLogs()
})

// Lifecycle
onMounted(async () => {
  await loadAuditLogs()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Methods
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const timeDropdown = document.querySelector('.time-filter-dropdown')
  const timeButton = document.querySelector('.time-filter-button')
  const actionDropdown = document.querySelector('.action-filter-dropdown')
  const actionButton = document.querySelector('.action-filter-button')

  if (timeDropdown && !timeDropdown.contains(target) && !timeButton?.contains(target)) {
    showTimeDropdown.value = false
  }

  if (actionDropdown && !actionDropdown.contains(target) && !actionButton?.contains(target)) {
    showActionDropdown.value = false
  }
}

function getTimeFilterDate(): string | null {
  const now = new Date()

  switch (timeFilter.value) {
    case 'last-15m':
      return new Date(now.getTime() - 15 * 60 * 1000).toISOString()
    case 'last-30m':
      return new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    case 'last-1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    case 'last-4h':
      return new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    case 'last-24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case 'last-7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'last-30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'all':
    default:
      return null
  }
}

async function loadAuditLogs() {
  try {
    const filters: any = {}

    const timeFilterDate = getTimeFilterDate()
    if (timeFilterDate) {
      filters.createdAt = {
        op: 'gte',
        value: timeFilterDate
      }
    }

    if (actionFilter.value !== 'all') {
      filters.action = {
        op: 'eq',
        value: actionFilter.value
      }
    }

    // Add project filter if a project is selected
    if (projectSelectionStore.selectedProjectId) {
      filters.projectId = {
        op: 'eq',
        value: projectSelectionStore.selectedProjectId
      }
    }

    await auditLogsStore.fetchAll(pagination.getParams({ filters, orderBy: '-createdAt' }))
  } catch (error) {
    console.error('Failed to load audit logs:', error)
  }
}

function clearSearch() {
  searchQuery.value = ''
}

function viewLog(log: AuditLogResponse) {
  router.push({
    name: 'monitor.auditLogDetail',
    params: { auditLogId: log.id }
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function getActionBadgeClass(action: string): string {
  if (action.toLowerCase().includes('create')) return 'badge-success'
  if (action.toLowerCase().includes('update')) return 'badge-active'
  if (action.toLowerCase().includes('delete')) return 'badge-error'
  return 'badge-secondary'
}

function selectTimeFilter(value: typeof timeFilter.value) {
  timeFilter.value = value
  showTimeDropdown.value = false
}

function selectActionFilter(value: typeof actionFilter.value) {
  actionFilter.value = value
  showActionDropdown.value = false
}
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Logs</h1>
          <p class="page-subtitle">View system audit trail</p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6 flex items-center gap-3">
        <!-- Desktop Filters (Hidden on Mobile) -->
        <div class="hidden md:flex items-center gap-3">
          <!-- Time Filter -->
          <div class="relative">
            <button
              @click="showTimeDropdown = !showTimeDropdown"
              class="time-filter-button filter-btn !shadow-none">
              <Calendar class="w-4 h-4 mr-2" />
              <span>{{ currentTimeFilterLabel }}</span>
              <ChevronDown class="w-4 h-4 ml-2" />
            </button>

            <!-- Time Dropdown -->
            <div v-if="showTimeDropdown" class="time-filter-dropdown filter-dropdown-panel min-w-[200px]">
              <button
                v-for="option in timeFilterOptions"
                :key="option.value"
                @click="selectTimeFilter(option.value)"
                class="filter-dropdown-item"
                :class="{ 'filter-dropdown-item-active': timeFilter === option.value }">
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Action Filter -->
          <div class="relative">
            <button
              @click="showActionDropdown = !showActionDropdown"
              class="action-filter-button filter-btn !shadow-none">
              <span>{{ currentActionFilterLabel }}</span>
              <ChevronDown class="w-4 h-4 ml-2" />
            </button>

            <!-- Action Dropdown -->
            <div v-if="showActionDropdown" class="action-filter-dropdown filter-dropdown-panel min-w-[180px]">
              <button
                v-for="option in actionFilterOptions"
                :key="option.value"
                @click="selectActionFilter(option.value)"
                class="filter-dropdown-item"
                :class="{ 'filter-dropdown-item-active': actionFilter === option.value }">
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Search Bar (Always Visible) -->
        <div class="relative min-w-[100px] md:min-w-[300px] flex-grow">
            <Search class="input-icon-left" />
            <input v-model="searchQuery" type="text"
              placeholder="Search..." class="search-input" />
            <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
              <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Mobile Filter Button -->
        <button 
          @click="showFilterDrawer = true"
          class="md:hidden filter-btn-icon relative"
        >
          <Filter class="w-5 h-5" />
          <span v-if="hasActiveFilters" class="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 rounded-full border border-white dark:border-gray-800"></span>
        </button>
      </div>

      <!-- Mobile Filter Drawer -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity ease-linear duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity ease-linear duration-300"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div 
            v-if="showFilterDrawer" 
            class="fixed inset-0 bg-gray-900/80 z-[300]" 
            @click="showFilterDrawer = false"
          ></div>
        </Transition>

        <Transition
          enter-active-class="transition ease-in-out duration-300 transform"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition ease-in-out duration-300 transform"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div 
            v-if="showFilterDrawer" 
            class="fixed inset-y-0 right-0 z-[310] w-full max-w-xs bg-white p-6 shadow-xl overflow-y-auto flex flex-col dark:bg-gray-800"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900 m-0 dark:text-white">Filters</h2>
              <button 
                class="p-2 -mr-2 bg-transparent border-none text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                @click="showFilterDrawer = false"
              >
                <X :size="24" />
              </button>
            </div>

            <div class="flex flex-col gap-6">
              <!-- Time Filter -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range</label>
                <div class="flex flex-col gap-1">
                  <button 
                    v-for="option in timeFilterOptions" 
                    :key="option.value" 
                    @click="timeFilter = option.value"
                    class="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left"
                    :class="timeFilter === option.value ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                  >
                    {{ option.label }}
                    <span v-if="timeFilter === option.value" class="w-2 h-2 rounded-full bg-primary-500"></span>
                  </button>
                </div>
              </div>

              <!-- Action Filter -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Action Type</label>
                <div class="flex flex-col gap-1">
                  <button 
                    v-for="option in actionFilterOptions" 
                    :key="option.value" 
                    @click="actionFilter = option.value"
                    class="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left"
                    :class="actionFilter === option.value ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                  >
                    {{ option.label }}
                    <span v-if="actionFilter === option.value" class="w-2 h-2 rounded-full bg-primary-500"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-auto pt-6 flex gap-3">
              <button 
                @click="() => { timeFilter = 'last-24h'; actionFilter = 'all'; }"
                class="btn-secondary flex-1 justify-center"
              >
                Reset
              </button>
              <button 
                @click="showFilterDrawer = false"
                class="btn-primary flex-1 justify-center"
              >
                Done
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Loading State -->
      <div v-if="auditLogsStore.isLoading" class="loading-state">
        Loading audit logs...
      </div>

      <!-- Error State -->
      <div v-else-if="auditLogsStore.error" class="error-state">
        {{ auditLogsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredLogs.length === 0" class="empty-state">
        <ClipboardList class="empty-state-icon" />
        <p class="empty-state-title">No audit logs found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else-if="projectSelectionStore.selectedProjectId">No audit logs found for the selected project</p>
        <p v-else>No audit logs have been recorded yet</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Created At</th>
                <th class="table-header-cell">Action</th>
                <th class="table-header-cell">Entity Type</th>
                <th class="table-header-cell">Entity ID</th>
                <th class="table-header-cell">User ID</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="log in filteredLogs" :key="log.id" class="table-row" @click="viewLog(log)">
                <td class="table-clickable-cell">{{ formatDate(log.createdAt) }}</td>
                <td class="table-cell">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getActionBadgeClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td class="table-cell">{{ log.entityType }}</td>
                <td class="table-cell font-mono text-sm">{{ log.entityId }}</td>
                <td class="table-cell font-mono text-sm">{{ log.userId }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <PaginationControls :pagination="pagination" :displayed-count="filteredLogs.length"
          resource-name="audit logs" />
      </div>
    </div>
  </MonitorSectionLayout>
</template>

<style scoped>
.badge-active {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
}

.badge-success {
  background-color: rgb(219 234 254);
  color: rgb(30 64 175);
}

.badge-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.badge-secondary {
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}
</style>
