<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore, useProjectSelectionStore, useApiKeysStore, useStagesStore, useUsersStore, useProvidersStore } from '@/stores'
import { usePagination } from '@/composables'
import { getArtifactExtension } from '@/utils/artifactExtension'
import RelativeDate from '@/components/RelativeDate.vue'
import { getStatusBadgeClass, formatStatusLabel, shortenConversationId } from '@/utils/conversationStatus'
import { RefreshCw, MessageSquare, ChevronDown, ArrowDownLeft, ArrowUpRight, Play, Eye, Trash2, MoreHorizontal, Mic, Bot, FileText, Terminal, File } from 'lucide-vue-next'
import type { ConversationResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'
import FloatingDropdown from '@/components/FloatingDropdown.vue'

import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import NoProjectSelected from '@/components/NoProjectSelected.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import TwilioVoiceCallModal from '@/components/modals/TwilioVoiceCallModal.vue'
import TwilioMessagingModal from '@/components/modals/TwilioMessagingModal.vue'
import WhatsAppSendModal from '@/components/modals/WhatsAppSendModal.vue'
// import SesEmailModal from '@/components/modals/SesEmailModal.vue'
// import SendgridEmailModal from '@/components/modals/SendgridEmailModal.vue'
import SmtpImapEmailModal from '@/components/modals/SmtpImapEmailModal.vue'

const router = useRouter()
const conversationsStore = useConversationsStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const apiKeysStore = useApiKeysStore()
const stagesStore = useStagesStore()
const usersStore = useUsersStore()
const providersStore = useProvidersStore()

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

// User filter
const userFilter = ref<string | null>(null)

// Starting stage filter
const startingStageFilter = ref<string | null>(null)

// Ending stage filter
const endingStageFilter = ref<string | null>(null)

// Direction filter
const directionFilter = ref<'all' | 'incoming' | 'outgoing'>('all')

// Outgoing conversation modals
const showVoiceCallModal = ref(false)
const showMessagingModal = ref(false)
const showWhatsAppModal = ref(false)
// const showSesModal = ref(false)
// const showSendgridModal = ref(false)
const showSmtpImapModal = ref(false)

const hasVoiceProviders = computed(() => providersStore.items.some(p => p.apiType === 'twilio_voice'))
const hasMessagingProviders = computed(() => providersStore.items.some(p => p.apiType === 'twilio_messaging'))
const hasWhatsAppProviders = computed(() => providersStore.items.some(p => p.apiType === 'whatsapp'))
// const hasSesProviders = computed(() => providersStore.items.some(p => p.apiType === 'ses'))
// const hasSendgridProviders = computed(() => providersStore.items.some(p => p.apiType === 'sendgrid'))
const hasSmtpImapProviders = computed(() => providersStore.items.some(p => p.apiType === 'smtp_imap'))
const hasAnyChannelProvider = computed(() => hasVoiceProviders.value || hasMessagingProviders.value || hasWhatsAppProviders.value || hasSmtpImapProviders.value)

const directionFilterOptions = [
  { value: 'all' as const, label: 'All Directions' },
  { value: 'incoming' as const, label: 'Incoming' },
  { value: 'outgoing' as const, label: 'Outgoing' },
]

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

const currentDirectionFilterLabel = computed(() => {
  return directionFilterOptions.find(opt => opt.value === directionFilter.value)?.label || 'All Directions'
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
watch(directionFilter, () => { pagination.reset(); loadConversations() })

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  userFilter.value = null
  startingStageFilter.value = null
  endingStageFilter.value = null
  directionFilter.value = 'all'
  pagination.reset()
  loadProjectData()
})

// Lifecycle
onMounted(async () => {
  await loadProjectData()
})

// Methods
async function loadProjectData() {
  await Promise.all([loadConversations(), loadStages(), loadUsers(), loadChannelProviders()])
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

    if (directionFilter.value !== 'all') {
      filters.direction = { op: 'eq', value: directionFilter.value }
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

async function loadChannelProviders() {
  try {
    await providersStore.fetchAll({ filters: { providerType: 'channel' } })
  } catch {
    // silently ignore
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

async function refreshData() {
  await loadProjectData()
}

// Row dropdown
const openDropdownId = ref<string | null>(null)
const dropdownStyle = ref<{ top: string; left: string }>()

function toggleDropdown(event: MouseEvent, conversationId: string) {
  if (openDropdownId.value === conversationId) {
    openDropdownId.value = null
    return
  }
  const btn = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropdownStyle.value = {
    top: `${btn.bottom + 4}px`,
    left: `${btn.right - 176}px`,
  }
  openDropdownId.value = conversationId
}

function closeDropdown() {
  openDropdownId.value = null
}

onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))

const artifactTypeConfig: Record<string, { label: string; icon: any }> = {
  user_voice: { label: 'User Audio', icon: Mic },
  ai_voice: { label: 'AI Audio', icon: Bot },
  user_transcript: { label: 'User Transcript', icon: FileText },
  ai_transcript: { label: 'AI Transcript', icon: FileText },
  tool_input: { label: 'Tool Input', icon: Terminal },
  tool_output: { label: 'Tool Output', icon: Terminal },
  other: { label: 'Other', icon: File },
}

function getArtifactTypeConfig(type: string) {
  return artifactTypeConfig[type] || { label: type, icon: File }
}

async function downloadArtifact(artifact: { id: string; artifactType: string }, conversationId: string) {
  const pId = projectSelectionStore.selectedProjectId
  if (!pId) return
  try {
    const blob = await conversationsStore.downloadArtifact(pId, conversationId, artifact.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ext = getArtifactExtension(blob.type)
    a.download = `${artifact.artifactType}_${Date.now()}${ext}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to download artifact')
  }
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
      name: 'testing.playground',
      params: { projectId },
      query: { conversationId: conversation.id, apiKeyId: key.id }
    })
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to load API keys')
  }
}
</script>

<template>
  <div class="flex-1 min-w-0">
    <NoProjectSelected v-if="!projectId" />
    <div v-else class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Conversations</h1>
          <p class="page-subtitle">Monitor active and past conversations</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="refreshData" class="btn-secondary" :disabled="conversationsStore.isLoading">
            <RefreshCw class="inline-block mr-2 w-4 h-4" :class="{ 'animate-spin': conversationsStore.isLoading }" />
            Refresh
          </button>
          <FloatingDropdown align="right" min-width="200px" :trigger-class="hasAnyChannelProvider ? 'btn-alt flex items-center gap-1' : 'btn-alt flex items-center gap-1 opacity-50 pointer-events-none'" :title="hasAnyChannelProvider ? undefined : 'No channel providers configured'">
            <template #trigger>
              <ArrowUpRight class="w-4 h-4" />
              Initiate
              <ChevronDown class="w-4 h-4" />
            </template>
            <template #default="{ close }">
              <button
                type="button"
                class="filter-dropdown-item"
                :class="{ 'opacity-40 pointer-events-none': !hasVoiceProviders }"
                :title="!hasVoiceProviders ? 'No Twilio Voice providers configured' : undefined"
                @click="showVoiceCallModal = true; close()"
              >
                Voice Call (Twilio)
              </button>
              <button
                type="button"
                class="filter-dropdown-item"
                :class="{ 'opacity-40 pointer-events-none': !hasMessagingProviders }"
                :title="!hasMessagingProviders ? 'No Twilio Messaging providers configured' : undefined"
                @click="showMessagingModal = true; close()"
              >
                SMS (Twilio)
              </button>
              <button
                type="button"
                class="filter-dropdown-item"
                :class="{ 'opacity-40 pointer-events-none': !hasWhatsAppProviders }"
                :title="!hasWhatsAppProviders ? 'No WhatsApp providers configured' : undefined"
                @click="showWhatsAppModal = true; close()"
              >
                WhatsApp
              </button>
             <!-- <button
                type="button"
                class="filter-dropdown-item"
                :class="{ 'opacity-40 pointer-events-none': !hasSesProviders }"
                :title="!hasSesProviders ? 'No SES providers configured' : undefined"
                @click="showSesModal = true; close()"
              >
                Email (SES)
              </button>
              <button
                type="button"
                class="filter-dropdown-item"
                :class="{ 'opacity-40 pointer-events-none': !hasSendgridProviders }"
                :title="!hasSendgridProviders ? 'No SendGrid providers configured' : undefined"
                @click="showSendgridModal = true; close()"
              >
                 Email (SendGrid)
                </button> -->
               <button
                 type="button"
                 class="filter-dropdown-item"
                 :class="{ 'opacity-40 pointer-events-none': !hasSmtpImapProviders }"
                 :title="!hasSmtpImapProviders ? 'No SMTP/IMAP providers configured' : undefined"
                 @click="showSmtpImapModal = true; close()"
               >
                 Email (SMTP/IMAP)
               </button>
             </template>
          </FloatingDropdown>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <!-- Date/Time Range Picker -->
        <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" />

        <!-- Status Filter -->
        <FloatingDropdown
          align="left"
          min-width="180px"
          :trigger-class="statusFilter !== 'all' ? 'btn-secondary flex items-center gap-1 ring-2 ring-blue-500' : 'btn-secondary flex items-center gap-1'"
        >
          <template #trigger>
            {{ currentStatusFilterLabel }}
            <ChevronDown class="w-4 h-4" />
          </template>
          <template #default="{ close }">
            <button
              v-for="option in statusFilterOptions"
              :key="option.value"
              type="button"
              @click="statusFilter = option.value; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': statusFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>

        <!-- User Filter -->
        <FloatingDropdown
          align="left"
          min-width="180px"
          :trigger-class="userFilter !== null ? 'btn-secondary flex items-center gap-1 ring-2 ring-blue-500' : 'btn-secondary flex items-center gap-1'"
        >
          <template #trigger>
            {{ currentUserFilterLabel }}
            <ChevronDown class="w-4 h-4" />
          </template>
          <template #default="{ close }">
            <button
              type="button"
              @click="userFilter = null; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': userFilter === null }"
            >
              All Users
            </button>
            <button
              v-for="user in userOptions"
              :key="user.id"
              type="button"
              @click="userFilter = user.id; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': userFilter === user.id }"
            >
              {{ user.id }}
            </button>
          </template>
        </FloatingDropdown>

        <!-- Starting Stage Filter -->
        <FloatingDropdown
          align="left"
          min-width="180px"
          :trigger-class="startingStageFilter !== null ? 'btn-secondary flex items-center gap-1 ring-2 ring-blue-500' : 'btn-secondary flex items-center gap-1'"
        >
          <template #trigger>
            {{ currentStartingStageLabel }}
            <ChevronDown class="w-4 h-4" />
          </template>
          <template #default="{ close }">
            <button
              type="button"
              @click="startingStageFilter = null; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': startingStageFilter === null }"
            >
              All Starting Stages
            </button>
            <button
              v-for="stage in stageOptions"
              :key="stage.id"
              type="button"
              @click="startingStageFilter = stage.id; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': startingStageFilter === stage.id }"
            >
              {{ stage.name }}
            </button>
          </template>
        </FloatingDropdown>

        <!-- Ending Stage Filter -->
        <FloatingDropdown
          align="left"
          min-width="180px"
          :trigger-class="endingStageFilter !== null ? 'btn-secondary flex items-center gap-1 ring-2 ring-blue-500' : 'btn-secondary flex items-center gap-1'"
        >
          <template #trigger>
            {{ currentEndingStageLabel }}
            <ChevronDown class="w-4 h-4" />
          </template>
          <template #default="{ close }">
            <button
              type="button"
              @click="endingStageFilter = null; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': endingStageFilter === null }"
            >
              All Ending Stages
            </button>
            <button
              v-for="stage in stageOptions"
              :key="stage.id"
              type="button"
              @click="endingStageFilter = stage.id; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': endingStageFilter === stage.id }"
            >
              {{ stage.name }}
            </button>
          </template>
        </FloatingDropdown>

        <!-- Direction Filter -->
        <FloatingDropdown
          align="left"
          min-width="160px"
          :trigger-class="directionFilter !== 'all' ? 'btn-secondary flex items-center gap-1 ring-2 ring-blue-500' : 'btn-secondary flex items-center gap-1'"
        >
          <template #trigger>
            {{ currentDirectionFilterLabel }}
            <ChevronDown class="w-4 h-4" />
          </template>
          <template #default="{ close }">
            <button
              v-for="option in directionFilterOptions"
              :key="option.value"
              type="button"
              @click="directionFilter = option.value; close()"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': directionFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>
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
                <th class="table-header-cell">Artifacts</th>
                <th class="table-header-cell">Started</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="conversation in filteredConversations" :key="conversation.id" class="table-row">
                <td class="table-clickable-cell" @click="viewConversation(conversation)">
                  <span class="inline-flex items-center gap-1.5 font-mono text-sm" :title="conversation.id">
                    {{ shortenConversationId(conversation.id) }}
                    <ArrowDownLeft
                      v-if="conversation.direction === 'incoming'"
                      class="w-3.5 h-3.5 text-blue-500 shrink-0"
                      title="Incoming – user-initiated"
                    />
                    <ArrowUpRight
                      v-else-if="conversation.direction === 'outgoing'"
                      class="w-3.5 h-3.5 text-violet-500 shrink-0"
                      title="Outgoing – Bonsai-initiated"
                    />
                  </span>
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
                <td class="table-cell">
                  <div v-if="conversation.artifacts && conversation.artifacts.length > 0" class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="artifact in conversation.artifacts"
                      :key="artifact.id"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      :title="artifact.artifactType"
                    >
                      <component :is="getArtifactTypeConfig(artifact.artifactType).icon" class="w-3 h-3" />
                      {{ getArtifactTypeConfig(artifact.artifactType).label }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                </td>
                <td class="table-cell-muted"><RelativeDate :date="conversation.createdAt" /></td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button 
                      v-if="isResumable(conversation.status) && !conversation.archived"
                      @click="handleResumeConversation(conversation)" 
                      class="btn-primary btn-sm"
                      title="Resume conversation"
                    >
                      <Play class="w-3.5 h-3.5 inline-block mr-1" />Resume
                    </button>
                    <button @click="viewConversation(conversation)" class="btn-icon-action" title="View">
                      <Eye class="w-4 h-4" />
                    </button>
                    <div>
                      <button
                        @click.stop="toggleDropdown($event, conversation.id)"
                        class="btn-icon-action"
                        title="More actions"
                      >
                        <MoreHorizontal class="w-4 h-4" />
                      </button>
                      <Teleport to="body">
                        <div
                          v-if="openDropdownId === conversation.id"
                          :style="dropdownStyle"
                          class="fixed z-50 w-44 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                          @click.stop
                        >
                          <button
                            @click="viewConversation(conversation); closeDropdown()"
                            class="filter-dropdown-item"
                          >
                            View Details
                          </button>
                          <template v-if="conversation.artifacts && conversation.artifacts.length > 0">
                            <div class="border-t border-gray-200 dark:border-gray-700" />
                            <button
                              v-for="artifact in conversation.artifacts"
                              :key="artifact.id"
                              class="filter-dropdown-item flex items-center gap-2"
                              @click="downloadArtifact(artifact, conversation.id); closeDropdown()"
                            >
                              <component :is="getArtifactTypeConfig(artifact.artifactType).icon" class="w-3.5 h-3.5" />
                              Download {{ getArtifactTypeConfig(artifact.artifactType).label }}
                            </button>
                          </template>
                          <div class="border-t border-gray-200 dark:border-gray-700" />
                          <button
                            v-if="!conversation.archived"
                            @click="deleteConversation(conversation); closeDropdown()"
                            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </Teleport>
                    </div>
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

    <TwilioVoiceCallModal
      v-if="showVoiceCallModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showVoiceCallModal = false; loadConversations()"
    />
    <TwilioMessagingModal
      v-if="showMessagingModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showMessagingModal = false; loadConversations()"
    />
    <WhatsAppSendModal
      v-if="showWhatsAppModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showWhatsAppModal = false; loadConversations()"
    />
    <!-- <SesEmailModal
      v-if="showSesModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showSesModal = false; loadConversations()"
    />
    <SendgridEmailModal
      v-if="showSendgridModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showSendgridModal = false; loadConversations()"
    /> -->
    <SmtpImapEmailModal
      v-if="showSmtpImapModal"
      :project-id="projectSelectionStore.selectedProjectId || ''"
      @close="showSmtpImapModal = false; loadConversations()"
    />
  </div>
</template>
