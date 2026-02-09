<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore, useProjectSelectionStore } from '@/stores'
import { usePagination } from '@/composables'
import { RefreshCw, Calendar, ChevronDown } from 'lucide-vue-next'
import type { ConversationResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'

const router = useRouter()
const conversationsStore = useConversationsStore()
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

// Status filter state
const statusFilter = ref<'all' | 'initialized' | 'awaiting_user_input' | 'receiving_user_voice' | 'processing_user_input' | 'generating_response' | 'finished' | 'aborted' | 'failed'>('all')
const showStatusDropdown = ref(false)

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'initialized', label: 'Initialized' },
  { value: 'awaiting_user_input', label: 'Awaiting User Input' },
  { value: 'receiving_user_voice', label: 'Receiving Voice' },
  { value: 'processing_user_input', label: 'Processing Input' },
  { value: 'generating_response', label: 'Generating Response' },
  { value: 'finished', label: 'Finished' },
  { value: 'aborted', label: 'Aborted' },
  { value: 'failed', label: 'Failed' },
] as const

// Pagination
const pagination = usePagination({
  store: conversationsStore,
  pageSize: 20,
  onPageChange: loadConversations
})

// Computed
const currentTimeFilterLabel = computed(() => {
  return timeFilterOptions.find(opt => opt.value === timeFilter.value)?.label || 'Last 24 hours'
})

const currentStatusFilterLabel = computed(() => {
  return statusFilterOptions.find(opt => opt.value === statusFilter.value)?.label || 'All Statuses'
})

const filteredConversations = computed(() => {
  return conversationsStore.conversations
})

// Watch for time filter changes
watch(timeFilter, () => {
  pagination.reset()
  loadConversations()
})

// Watch for status filter changes
watch(statusFilter, () => {
  pagination.reset()
  loadConversations()
})

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  pagination.reset()
  loadConversations()
})

// Lifecycle
onMounted(async () => {
  await loadConversations()
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
  const statusDropdown = document.querySelector('.status-filter-dropdown')
  const statusButton = document.querySelector('.status-filter-button')
  
  if (timeDropdown && !timeDropdown.contains(target) && !timeButton?.contains(target)) {
    showTimeDropdown.value = false
  }
  
  if (statusDropdown && !statusDropdown.contains(target) && !statusButton?.contains(target)) {
    showStatusDropdown.value = false
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

async function loadConversations() {
  try {
    const filters: any = {}
    
    const timeFilterDate = getTimeFilterDate()
    if (timeFilterDate) {
      filters.updatedAt = {
        op: 'gte',
        value: timeFilterDate
      }
    }
    
    if (statusFilter.value !== 'all') {
      filters.status = {
        op: 'eq',
        value: statusFilter.value
      }
    }
    
    // Add project filter if a project is selected
    if (projectSelectionStore.selectedProjectId) {
      filters.projectId = {
        op: 'eq',
        value: projectSelectionStore.selectedProjectId
      }
    }
    
    await conversationsStore.fetchAll(
      pagination.getParams({ 
        filters,
        orderBy: '-updatedAt'
      })
    )
  } catch (error) {
    console.error('Failed to load conversations:', error)
  }
}

function viewConversation(conversation: ConversationResponse) {
  router.push({
    name: 'monitor.conversationDetail',
    params: { conversationId: conversation.id }
  })
}

async function deleteConversation(conversation: ConversationResponse) {
  if (!confirm(`Delete conversation ${conversation.id}?\n\nThis action cannot be undone.`)) return

  try {
    await conversationsStore.remove(conversation.id)
    await loadConversations()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete conversation')
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'awaiting_user_input':
    case 'receiving_user_voice':
    case 'processing_user_input':
    case 'generating_response':
      return 'badge-active'
    case 'finished':
      return 'badge-success'
    case 'aborted':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    case 'initialized':
    default:
      return 'badge-secondary'
  }
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function selectTimeFilter(value: typeof timeFilter.value) {
  timeFilter.value = value
  showTimeDropdown.value = false
}

function selectStatusFilter(value: typeof statusFilter.value) {
  statusFilter.value = value
  showStatusDropdown.value = false
}

async function refreshData() {
  await loadConversations()
}
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Conversations</h1>
          <p class="page-subtitle">Monitor active and past conversations</p>
        </div>
        <button @click="refreshData" class="btn-secondary" :disabled="conversationsStore.isLoading">
          <RefreshCw class="inline-block mr-2 w-4 h-4" :class="{ 'animate-spin': conversationsStore.isLoading }" />
          Refresh
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6 flex items-center gap-3">
        <!-- Time Filter -->
        <div class="relative">
          <button 
            @click="showTimeDropdown = !showTimeDropdown"
            class="time-filter-button flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-sm font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
          >
            <Calendar class="w-4 h-4 mr-2" />
            <span>{{ currentTimeFilterLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </button>
          
          <!-- Time Dropdown -->
          <div v-if="showTimeDropdown" class="time-filter-dropdown absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px] py-1 dark:bg-gray-800 dark:border-gray-700">
            <button
              v-for="option in timeFilterOptions"
              :key="option.value"
              @click="selectTimeFilter(option.value)"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
              :class="{ 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-200': timeFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="relative">
          <button 
            @click="showStatusDropdown = !showStatusDropdown"
            class="status-filter-button flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-sm font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
          >
            <span>{{ currentStatusFilterLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </button>
          
          <!-- Status Dropdown -->
          <div v-if="showStatusDropdown" class="status-filter-dropdown absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[180px] py-1 dark:bg-gray-800 dark:border-gray-700">
            <button
              v-for="option in statusFilterOptions"
              :key="option.value"
              @click="selectStatusFilter(option.value)"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
              :class="{ 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-200': statusFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="conversationsStore.isLoading" class="loading-state">
        Loading conversations...
      </div>

      <!-- Error State -->
      <div v-else-if="conversationsStore.error" class="error-state">
        {{ conversationsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredConversations.length === 0" class="empty-state">
        <RefreshCw class="empty-state-icon" />
        <p class="empty-state-title">No conversations found</p>
        <p>No conversations match the selected time filter</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Conversation ID</th>
                <th class="table-header-cell">Status</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="conversation in filteredConversations" :key="conversation.id" class="table-row">
                <td class="table-clickable-cell" @click="viewConversation(conversation)">
                  <span class="font-mono text-sm">{{ conversation.id }}</span>
                </td>
                <td class="table-cell">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help"
                    :class="getStatusBadgeClass(conversation.status)"
                    :title="conversation.statusDetails || 'No status details provided'"
                  >
                    {{ formatStatusLabel(conversation.status) }}
                  </span>
                </td>
                <td class="table-cell-muted">{{ formatDate(conversation.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="viewConversation(conversation)" class="btn-secondary btn-sm">
                      View
                    </button>
                    <button @click="deleteConversation(conversation)" class="btn-danger btn-sm">
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
          :displayed-count="filteredConversations.length"
          resource-name="conversations"
        />
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

.badge-warning {
  background-color: rgb(254 249 195);
  color: rgb(133 77 14);
}

.badge-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.badge-secondary {
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
