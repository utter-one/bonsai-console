<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuditLogsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useSearch, formatEnum } from '@/composables'
import { ClipboardList, Search, X, ChevronDown, Filter } from 'lucide-vue-next'
import type { AuditLogResponse } from '@/api/generated/data-contracts'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'

const router = useRouter()
const auditLogsStore = useAuditLogsStore()
const projectSelectionStore = useProjectSelectionStore()

// Date/time range filter
const dateTimeRange = ref<DateTimeRange>(null)

// Action filter state
const actionFilter = ref<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all')
const showActionDropdown = ref(false)

const actionFilterOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
] as const

// Entity type filter state
const entityTypeFilter = ref<string>('all')
const showEntityTypeDropdown = ref(false)

const entityTypeFilterOptions = [
  { value: 'all', label: 'All Entity Types' },
  { value: 'agent', label: 'Agent' },
  { value: 'api_key', label: 'API Key' },
  { value: 'classifier', label: 'Classifier' },
  { value: 'context_transformer', label: 'Context Transformer' },
  { value: 'copy_decorator', label: 'Copy Decorator' },
  { value: 'environment', label: 'Environment' },
  { value: 'global_action', label: 'Global Action' },
  { value: 'guardrail', label: 'Guardrail' },
  { value: 'knowledge_category', label: 'Knowledge Category' },
  { value: 'knowledge_item', label: 'Knowledge Item' },
  { value: 'operator', label: 'Operator' },
  { value: 'project', label: 'Project' },
  { value: 'provider', label: 'Provider' },
  { value: 'sample_copy', label: 'Sample Copy' },
  { value: 'stage', label: 'Stage' },
  { value: 'tool', label: 'Tool' },
] as const

const currentEntityTypeFilterLabel = computed(() => {
  return entityTypeFilterOptions.find(opt => opt.value === entityTypeFilter.value)?.label || 'All Entity Types'
})

// Mobile Filter State
const showFilterDrawer = ref(false)

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => auditLogsStore.logs)

// Pagination
const pagination = usePagination({
  store: auditLogsStore,
  pageSize: 20,
  onPageChange: loadAuditLogs
})

// Computed
const currentActionFilterLabel = computed(() => {
  return actionFilterOptions.find(opt => opt.value === actionFilter.value)?.label || 'All Actions'
})

const hasActiveFilters = computed(() => {
  return dateTimeRange.value !== null || actionFilter.value !== 'all' || entityTypeFilter.value !== 'all'
})

const filteredLogs = computed(() => auditLogsStore.logs)

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for date range changes
watch(dateTimeRange, () => {
  pagination.reset()
  loadAuditLogs()
})

// Watch for action filter changes
watch(actionFilter, () => {
  pagination.reset()
  loadAuditLogs()
})

// Watch for entity type filter changes
watch(entityTypeFilter, () => {
  pagination.reset()
  loadAuditLogs()
})

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  clearSearch()
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
  const actionDropdown = document.querySelector('.action-filter-dropdown')
  const actionButton = document.querySelector('.action-filter-button')
  const entityTypeDropdown = document.querySelector('.entity-type-filter-dropdown')
  const entityTypeButton = document.querySelector('.entity-type-filter-button')

  if (actionDropdown && !actionDropdown.contains(target) && !actionButton?.contains(target)) {
    showActionDropdown.value = false
  }

  if (entityTypeDropdown && !entityTypeDropdown.contains(target) && !entityTypeButton?.contains(target)) {
    showEntityTypeDropdown.value = false
  }
}

async function loadAuditLogs() {
  try {
    const filters: any = {}

    if (dateTimeRange.value) {
      filters.createdAt = dateTimeRange.value
    }

    if (actionFilter.value !== 'all') {
      filters.action = {
        op: 'eq',
        value: actionFilter.value
      }
    }

    if (entityTypeFilter.value !== 'all') {
      filters.entityType = {
        op: 'eq',
        value: entityTypeFilter.value
      }
    }

    if (projectSelectionStore.selectedProjectId) {
      filters.projectId = {
        op: 'eq',
        value: projectSelectionStore.selectedProjectId
      }
    }

    await auditLogsStore.fetchAll(pagination.getParams({ filters, orderBy: '-createdAt', ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) }))
  } catch (error) {
    console.error('Failed to load audit logs:', error)
  }
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

function getEntityName(log: AuditLogResponse): string {
  const name = (log.newEntity as any)?.name ?? (log.oldEntity as any)?.name
  return name ?? `[${log.entityId}]`
}

function getEntityVersion(log: AuditLogResponse): string {
  const oldV = (log.oldEntity as any)?.version
  const newV = (log.newEntity as any)?.version
  if (log.action === 'UPDATE' && oldV != null && newV != null) {
    return oldV !== newV ? `v${oldV} → v${newV}` : `v${newV}`
  }
  const v = newV ?? oldV
  return v != null ? `v${v}` : '—'
}

function getActionBadgeClass(action: string): string {
  if (action.toLowerCase().includes('create')) return 'badge-success'
  if (action.toLowerCase().includes('update')) return 'badge-active'
  if (action.toLowerCase().includes('delete')) return 'badge-error'
  return 'badge-secondary'
}

function selectActionFilter(value: typeof actionFilter.value) {
  actionFilter.value = value
  showActionDropdown.value = false
}

function selectEntityTypeFilter(value: typeof entityTypeFilter.value) {
  entityTypeFilter.value = value
  showEntityTypeDropdown.value = false
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
          <!-- Date/Time Range Picker -->
          <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" />

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

          <!-- Entity Type Filter -->
          <div class="relative">
            <button
              @click="showEntityTypeDropdown = !showEntityTypeDropdown"
              class="entity-type-filter-button filter-btn !shadow-none">
              <span>{{ currentEntityTypeFilterLabel }}</span>
              <ChevronDown class="w-4 h-4 ml-2" />
            </button>

            <!-- Entity Type Dropdown -->
            <div v-if="showEntityTypeDropdown" class="entity-type-filter-dropdown filter-dropdown-panel min-w-[200px]">
              <button
                v-for="option in entityTypeFilterOptions"
                :key="option.value"
                @click="selectEntityTypeFilter(option.value)"
                class="filter-dropdown-item"
                :class="{ 'filter-dropdown-item-active': entityTypeFilter === option.value }">
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
          class="inline-block md:hidden filter-btn-icon relative"
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

              <!-- Entity Type Filter -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Entity Type</label>
                <div class="flex flex-col gap-1">
                  <button 
                    v-for="option in entityTypeFilterOptions" 
                    :key="option.value" 
                    @click="entityTypeFilter = option.value"
                    class="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left"
                    :class="entityTypeFilter === option.value ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                  >
                    {{ option.label }}
                    <span v-if="entityTypeFilter === option.value" class="w-2 h-2 rounded-full bg-primary-500"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-auto pt-6 flex gap-3">
              <button 
                @click="() => { actionFilter = 'all'; entityTypeFilter = 'all' }"
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
                <th class="table-header-cell">Entity</th>
                <th class="table-header-cell">Version</th>
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
                <td class="table-cell text-gray-500 dark:text-gray-400">{{ formatEnum(log.entityType) }}</td>
                <td class="table-cell font-semibold text-gray-900 dark:text-white">{{ getEntityName(log) }}</td>
                <td class="table-cell text-sm text-gray-500 dark:text-gray-400">{{ getEntityVersion(log) }}</td>
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
