<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useDeferredProcessingStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort, useSearch, useConfirm } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import DeferredProcessingDetailModal from '@/components/modals/DeferredProcessingDetailModal.vue'
import { Search, X, Clock, AlertTriangle, CheckCircle, XCircle, Hourglass } from 'lucide-vue-next'
import PaginationControls from '@/components/PaginationControls.vue'
import type { DeferredProcessingEntry } from '@/api/types'

const store = useDeferredProcessingStore()
const projectSelectionStore = useProjectSelectionStore()

const { sortKey, sortOrder, toggleSort, getSortIcon } = useTableSort('sort-deferred-processing')

const pagination = usePagination({
  store,
  pageSize: 50,
  onPageChange: loadEntries,
})

const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(
  () => store.items
)

const { confirmDelete } = useConfirm()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

type StatusFilter = 'all' | 'pending' | 'processed' | 'failed' | 'cancelled'
const activeStatus = ref<StatusFilter>('all')
const activeChannelType = ref<string>('all')

const statusOptions: StatusFilter[] = ['pending', 'processed', 'failed', 'cancelled']

const showDetailModal = ref(false)
const selectedEntry = ref<DeferredProcessingEntry | null>(null)

const filteredItems = computed(() => {
  let items = store.items

  if (activeStatus.value !== 'all') {
    items = items.filter(item => item.status === activeStatus.value)
  }

  if (activeChannelType.value !== 'all') {
    items = items.filter(item => item.channelType === activeChannelType.value)
  }

  if (textSearchQuery.value) {
    const q = textSearchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.sessionId.toLowerCase().includes(q) ||
      item.providerId.toLowerCase().includes(q) ||
      (item.conversationId && item.conversationId.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q)
    )
  }

  if (sortKey.value) {
    const key = sortKey.value
    const order = sortOrder.value === 'asc' ? 1 : -1
    items = [...items].sort((a, b) => {
      const aVal = (a as any)[key] ?? ''
      const bVal = (b as any)[key] ?? ''
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * order
      }
      return 0
    })
  }

  return items
})

// Derive unique channel types from items
const channelTypes = computed(() => {
  const types = new Set<string>(store.items.map(item => item.channelType))
  return Array.from(types).sort()
})

watch([sortKey, sortOrder], () => {
  loadEntries()
})

watch(debouncedSearchQuery, () => {
  pagination.reset()
})

watch(activeStatus, () => {
  pagination.reset()
})

watch(activeChannelType, () => {
  pagination.reset()
})

watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadEntries()
})

onMounted(async () => {
  await loadEntries()
})

async function loadEntries() {
  try {
    const extraParams: any = {}
    if (activeStatus.value !== 'all') {
      extraParams.status = activeStatus.value
    }
    if (activeChannelType.value !== 'all') {
      extraParams.channelType = activeChannelType.value
    }
    await store.fetchAll(projectId.value, pagination.getParams(extraParams) as any)
  } catch (error) {
    console.error('Failed to load deferred processing entries:', error)
  }
}

function openDetailModal(entry: DeferredProcessingEntry) {
  selectedEntry.value = entry
  showDetailModal.value = true
}

async function handleReschedule(entry: DeferredProcessingEntry) {
  try {
    // Use a past date to trigger immediate processing
    await store.reschedule(projectId.value, entry.id, new Date().toISOString())
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to reschedule entry')
  }
}

async function handleCancel(entry: DeferredProcessingEntry) {
  if (!(await confirmDelete(`Cancel deferred processing entry ${entry.id}?`))) return

  try {
    await store.cancel(projectId.value, entry.id)
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to cancel entry')
  }
}

function formatChannelType(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending': return 'badge-warning'
    case 'processed': return 'badge-success'
    case 'failed': return 'badge-error'
    case 'cancelled': return 'badge-secondary'
    default: return 'badge'
  }
}

const statusIconMap = (status: string) => {
  switch (status) {
    case 'pending': return Hourglass
    case 'processed': return CheckCircle
    case 'failed': return AlertTriangle
    case 'cancelled': return XCircle
    default: return Clock
  }
}
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Deferred Processing</h1>
        <p class="page-subtitle">Monitor and manage incoming message processing queue</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by session ID, conversation ID, or provider ID..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</label>
        <div class="flex flex-wrap gap-1">
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeStatus === 'all'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeStatus = 'all'"
          >
            All
          </button>
          <button
            v-for="status in statusOptions"
            :key="status"
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors capitalize"
            :class="activeStatus === status
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeStatus = status"
          >
            {{ status }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Channel</label>
        <div class="flex flex-wrap gap-1">
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeChannelType === 'all'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeChannelType = 'all'"
          >
            All
          </button>
          <button
            v-for="channel in channelTypes"
            :key="channel"
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeChannelType === channel
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeChannelType = channel"
          >
            {{ formatChannelType(channel) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading && !store.items.length" class="loading-state">
      Loading deferred processing entries...
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="error-state">
      {{ store.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <Clock class="empty-state-icon" />
      <p class="empty-state-title">No deferred processing entries found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Messages waiting to be processed will appear here</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell-sortable" @click="toggleSort('id')">
                <div class="flex items-center gap-1">
                  ID
                  <component :is="getSortIcon('id')" class="w-4 h-4" :class="sortKey === 'id' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-sortable" @click="toggleSort('status')">
                <div class="flex items-center gap-1">
                  Status
                  <component :is="getSortIcon('status')" class="w-4 h-4" :class="sortKey === 'status' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-sortable" @click="toggleSort('channelType')">
                <div class="flex items-center gap-1">
                  Channel
                  <component :is="getSortIcon('channelType')" class="w-4 h-4" :class="sortKey === 'channelType' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell">Session</th>
              <th class="table-header-cell">Conversation</th>
              <th class="table-header-cell-sortable" @click="toggleSort('processAt')">
                <div class="flex items-center gap-1">
                  Process At
                  <component :is="getSortIcon('processAt')" class="w-4 h-4" :class="sortKey === 'processAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-sortable" @click="toggleSort('retryCount')">
                <div class="flex items-center gap-1">
                  Retries
                  <component :is="getSortIcon('retryCount')" class="w-4 h-4" :class="sortKey === 'retryCount' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr
              v-for="entry in filteredItems"
              :key="entry.id"
              class="table-row cursor-pointer"
              @click="openDetailModal(entry)"
            >
              <td class="table-cell-mono text-xs">{{ entry.id }}</td>
              <td class="table-cell">
                <span class="badge" :class="statusBadgeClass(entry.status)">
                  <component :is="statusIconMap(entry.status)" class="inline-block mr-1 w-3 h-3" />
                  {{ entry.status }}
                </span>
              </td>
              <td class="table-cell">{{ formatChannelType(entry.channelType) }}</td>
              <td class="table-cell-mono text-xs">{{ entry.sessionId }}</td>
              <td class="table-cell-mono text-xs">{{ entry.conversationId || '—' }}</td>
              <td class="table-cell">
                <RelativeDate v-if="entry.processAt" :date="entry.processAt" />
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell text-center">{{ entry.retryCount }}</td>
              <td class="table-cell-muted"><RelativeDate :date="entry.createdAt || new Date().toISOString()" /></td>
              <td class="table-cell-right" @click.stop>
                <div class="flex-end gap-1">
                  <button
                    v-if="entry.status === 'pending'"
                    @click="handleReschedule(entry)"
                    class="btn-icon-action"
                    title="Process now"
                  >
                    <Clock class="w-4 h-4" />
                  </button>
                  <button
                    v-if="entry.status === 'pending'"
                    @click="handleCancel(entry)"
                    class="btn-icon-action-danger"
                    title="Cancel"
                  >
                    <XCircle class="w-4 h-4" />
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
        :displayed-count="filteredItems.length"
        resource-name="deferred processing entries"
      />
    </div>

    <!-- Detail Modal -->
    <DeferredProcessingDetailModal
      v-if="showDetailModal"
      :model-value="true"
      :entry="selectedEntry"
      :project-id="projectId"
      @close="showDetailModal = false"
      @refresh="loadEntries"
    />
  </div>
</template>
