<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore, useProjectSelectionStore, useApiKeysStore, useStagesStore, useUsersStore } from '@/stores'
import { usePagination } from '@/composables'
import { RefreshCw, ChevronDown, MessageSquare } from 'lucide-vue-next'
import type { ConversationResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'

const router = useRouter()
const conversationsStore = useConversationsStore()
const projectSelectionStore = useProjectSelectionStore()
const apiKeysStore = useApiKeysStore()
const stagesStore = useStagesStore()
const usersStore = useUsersStore()

const stageMap = computed(() => {
  const map = new Map<string, string>()
  for (const stage of stagesStore.items) {
    map.set(stage.id, stage.name)
  }
  return map
})

// Date/time range filter
const dateTimeRange = ref<DateTimeRange>(null)

// Status filter state
const statusFilter = ref<'all' | 'initialized' | 'awaiting_user_input' | 'receiving_user_voice' | 'processing_user_input' | 'generating_response' | 'finished' | 'aborted' | 'failed'>('all')
const showStatusDropdown = ref(false)

// User filter
const userFilter = ref<string | null>(null)
const showUserDropdown = ref(false)

// Starting stage filter
const startingStageFilter = ref<string | null>(null)
const showStartingStageDropdown = ref(false)

// Ending stage filter
const endingStageFilter = ref<string | null>(null)
const showEndingStageDropdown = ref(false)

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
const currentStatusFilterLabel = computed(() => {
  return statusFilterOptions.find(opt => opt.value === statusFilter.value)?.label || 'All Statuses'
})

const userOptions = computed(() => {
  return [...usersStore.items].sort((a, b) => a.id.localeCompare(b.id))
})

const stageOptions = computed(() => {
  return [...stagesStore.items].sort((a, b) => a.name.localeCompare(b.name))
})

const currentUserFilterLabel = computed(() => {
  if (!userFilter.value) return 'All Users'
  return userFilter.value
})

const currentStartingStageLabel = computed(() => {
  if (!startingStageFilter.value) return 'All Starting Stages'
  return stageMap.value.get(startingStageFilter.value) ?? startingStageFilter.value
})

const currentEndingStageLabel = computed(() => {
  if (!endingStageFilter.value) return 'All Ending Stages'
  return stageMap.value.get(endingStageFilter.value) ?? endingStageFilter.value
})

const filteredConversations = computed(() => {
  return conversationsStore.conversations
})

// Watch for filter changes
watch(dateTimeRange, () => { pagination.reset(); loadConversations() })
watch(statusFilter, () => { pagination.reset(); loadConversations() })
watch(userFilter, () => { pagination.reset(); loadConversations() })
watch(startingStageFilter, () => { pagination.reset(); loadConversations() })
watch(endingStageFilter, () => { pagination.reset(); loadConversations() })

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  userFilter.value = null
  startingStageFilter.value = null
  endingStageFilter.value = null
  pagination.reset()
  loadProjectData()
})

// Lifecycle
onMounted(async () => {
  await loadProjectData()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Methods
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const dropdownPairs = [
    { panel: '.status-filter-dropdown', button: '.status-filter-button', hide: () => { showStatusDropdown.value = false } },
    { panel: '.user-filter-dropdown', button: '.user-filter-button', hide: () => { showUserDropdown.value = false } },
    { panel: '.starting-stage-dropdown', button: '.starting-stage-button', hide: () => { showStartingStageDropdown.value = false } },
    { panel: '.ending-stage-dropdown', button: '.ending-stage-button', hide: () => { showEndingStageDropdown.value = false } },
  ]
  for (const { panel, button, hide } of dropdownPairs) {
    const panelEl = document.querySelector(panel)
    const buttonEl = document.querySelector(button)
    if (panelEl && !panelEl.contains(target) && !buttonEl?.contains(target)) {
      hide()
    }
  }
}

async function loadProjectData() {
  await Promise.all([loadConversations(), loadStages(), loadUsers()])
}

async function loadConversations() {
  try {
    const filters: any = {}

    if (dateTimeRange.value) {
      filters.createdAt = dateTimeRange.value
    }

    if (statusFilter.value !== 'all') {
      filters.status = { op: 'eq', value: statusFilter.value }
    }

    if (userFilter.value) {
      filters.userId = { op: 'eq', value: userFilter.value }
    }

    if (startingStageFilter.value) {
      filters.startingStageId = { op: 'eq', value: startingStageFilter.value }
    }

    if (endingStageFilter.value) {
      filters.endingStageId = { op: 'eq', value: endingStageFilter.value }
    }

    await conversationsStore.fetchAll(
      projectSelectionStore.selectedProjectId || '',
      pagination.getParams({
        filters,
        orderBy: '-createdAt'
      })
    )
  } catch (error) {
    console.error('Failed to load conversations:', error)
  }
}

async function loadStages() {
  const projectId = projectSelectionStore.selectedProjectId
  if (!projectId) return
  try {
    await stagesStore.fetchAll(projectId, { limit: 1000 })
  } catch {
    // Stage names will fall back to IDs
  }
}

async function loadUsers() {
  const projectId = projectSelectionStore.selectedProjectId
  if (!projectId) return
  try {
    await usersStore.fetchAll(projectId, { limit: 1000 })
  } catch {
    // User names not available
  }
}

function getUserDisplayById(userId: string): string {
  return userId || '—'
}

function getStageName(id: string | null | undefined): string {
  if (!id) return '—'
  return stageMap.value.get(id) ?? id.slice(-6)
}

function shortenConversationId(id: string): string {
  return `conv_...${id.slice(-6)}`
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
    await conversationsStore.remove(projectSelectionStore.selectedProjectId || '', conversation.id)
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

function selectStatusFilter(value: typeof statusFilter.value) {
  statusFilter.value = value
  showStatusDropdown.value = false
}

async function refreshData() {
  await loadProjectData()
}

function isResumable(status: string): boolean {
  return status === 'awaiting_user_input'
}

async function handleResumeConversation(conversation: ConversationResponse) {
  const projectId = projectSelectionStore.selectedProjectId
  if (!projectId) {
    alert('No project selected')
    return
  }

  try {
    await apiKeysStore.fetchAll(projectId, { filters: { isActive: true } })
    const activeKeys = apiKeysStore.items.filter(k => k.isActive && k.projectId === projectId)

    if (activeKeys.length === 0) {
      alert('No active API keys found for this project. Please create an API key first.')
      return
    }

    const key = activeKeys[0]!
    router.push({
      name: 'playground',
      params: { projectId },
      query: { conversationId: conversation.id, apiKeyId: key.id }
    })
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to load API keys')
  }
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
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <!-- Date/Time Range Picker -->
        <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" />

        <!-- Status Filter -->
        <div class="relative">
          <button
            @click="showStatusDropdown = !showStatusDropdown"
            class="status-filter-button filter-btn shadow-none!"
          >
            <span>{{ currentStatusFilterLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </button>
          <div v-if="showStatusDropdown" class="status-filter-dropdown filter-dropdown-panel min-w-45">
            <button
              v-for="option in statusFilterOptions"
              :key="option.value"
              @click="selectStatusFilter(option.value)"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': statusFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- User Filter -->
        <div class="relative">
          <button
            @click="showUserDropdown = !showUserDropdown"
            class="user-filter-button filter-btn shadow-none!"
          >
            <span class="max-w-40 truncate">{{ currentUserFilterLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2 shrink-0" />
          </button>
          <div v-if="showUserDropdown" class="user-filter-dropdown filter-dropdown-panel min-w-55 max-h-64 overflow-y-auto">
            <button
              @click="userFilter = null; showUserDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': userFilter === null }"
            >
              All Users
            </button>
            <button
              v-for="user in userOptions"
              :key="user.id"
              @click="userFilter = user.id; showUserDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': userFilter === user.id }"
            >
              {{ user.id }}
            </button>
          </div>
        </div>

        <!-- Starting Stage Filter -->
        <div class="relative">
          <button
            @click="showStartingStageDropdown = !showStartingStageDropdown"
            class="starting-stage-button filter-btn shadow-none!"
          >
            <span class="max-w-40 truncate">{{ currentStartingStageLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2 shrink-0" />
          </button>
          <div v-if="showStartingStageDropdown" class="starting-stage-dropdown filter-dropdown-panel min-w-50 max-h-64 overflow-y-auto">
            <button
              @click="startingStageFilter = null; showStartingStageDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': startingStageFilter === null }"
            >
              All Starting Stages
            </button>
            <button
              v-for="stage in stageOptions"
              :key="stage.id"
              @click="startingStageFilter = stage.id; showStartingStageDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': startingStageFilter === stage.id }"
            >
              {{ stage.name }}
            </button>
          </div>
        </div>

        <!-- Ending Stage Filter -->
        <div class="relative">
          <button
            @click="showEndingStageDropdown = !showEndingStageDropdown"
            class="ending-stage-button filter-btn shadow-none!"
          >
            <span class="max-w-40 truncate">{{ currentEndingStageLabel }}</span>
            <ChevronDown class="w-4 h-4 ml-2 shrink-0" />
          </button>
          <div v-if="showEndingStageDropdown" class="ending-stage-dropdown filter-dropdown-panel min-w-50 max-h-64 overflow-y-auto">
            <button
              @click="endingStageFilter = null; showEndingStageDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': endingStageFilter === null }"
            >
              All Ending Stages
            </button>
            <button
              v-for="stage in stageOptions"
              :key="stage.id"
              @click="endingStageFilter = stage.id; showEndingStageDropdown = false"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': endingStageFilter === stage.id }"
            >
              {{ stage.name }}
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
        <MessageSquare class="empty-state-icon" />
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
                <th class="table-header-cell">User</th>
                <th class="table-header-cell">Starting Stage</th>
                <th class="table-header-cell">Ending Stage</th>
                <th class="table-header-cell">Started</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="conversation in filteredConversations" :key="conversation.id" class="table-row">
                <td class="table-clickable-cell" @click="viewConversation(conversation)">
                  <span class="font-mono text-sm" :title="conversation.id">{{ shortenConversationId(conversation.id) }}</span>
                </td>
                <td class="table-cell">
                  <div class="flex items-center gap-2">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help whitespace-nowrap"
                      :class="getStatusBadgeClass(conversation.status)"
                      :title="conversation.statusDetails || 'No status details provided'"
                    >
                      {{ formatStatusLabel(conversation.status) }}
                    </span>
                    <span v-if="conversation.archived" class="badge-secondary">Archived</span>
                  </div>
                </td>
                <td class="table-cell">
                  <span class="text-sm" :title="conversation.userId">{{ getUserDisplayById(conversation.userId) }}</span>
                </td>
                <td class="table-cell">{{ getStageName(conversation.startingStageId) }}</td>
                <td class="table-cell">{{ getStageName(conversation.endingStageId) }}</td>
                <td class="table-cell-muted">{{ formatDate(conversation.createdAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button 
                      v-if="isResumable(conversation.status) && !conversation.archived"
                      @click="handleResumeConversation(conversation)" 
                      class="btn-primary btn-sm"
                      title="Resume conversation"
                    >
                      Resume
                    </button>
                    <button @click="viewConversation(conversation)" class="btn-secondary btn-sm">
                      View
                    </button>
                    <button v-if="!conversation.archived" @click="deleteConversation(conversation)" class="btn-danger btn-sm">
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
