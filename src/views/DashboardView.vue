<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useProjectsStore,
  useUsersStore,
  useAuditLogsStore,
  useProjectSelectionStore,
} from '@/stores'
import apiClient from '@/api/client'
import {
  BriefcaseBusiness,
  Users,
  ClipboardList,
  MessageSquare,
  Bug,
  CheckCircle,
  XCircle,
  Activity,
  ChevronRight,
  FolderOpen,
} from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const auditLogsStore = useAuditLogsStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoadingGlobal = ref(true)

const convCounts = ref({ active: 0, finished: 0, failed: 0 })
const convTotal = computed(() => convCounts.value.active + convCounts.value.finished + convCounts.value.failed)
const isLoadingConversations = ref(false)
const conversationsError = ref<string | null>(null)

const issueCounts = ref({ critical: 0, high: 0, medium: 0, low: 0 })
const isLoadingIssues = ref(false)
const issuesError = ref<string | null>(null)

const ACTIVE_STATUSES = [
  'initialized',
  'awaiting_user_input',
  'receiving_user_voice',
  'processing_user_input',
  'generating_response',
]

async function loadGlobalStats() {
  isLoadingGlobal.value = true
  try {
    await Promise.all([
      projectsStore.fetchAll({ offset: 0, limit: 1 }),
      usersStore.fetchAll({ offset: 0, limit: 1 }),
      auditLogsStore.fetchAll({ limit: 10, orderBy: '-createdAt' }),
    ])
  } catch (error) {
    console.error('Failed to load global stats:', error)
  } finally {
    isLoadingGlobal.value = false
  }
}

async function loadConversationCounts(pid: string) {
  if (!pid) return
  isLoadingConversations.value = true
  conversationsError.value = null
  try {
    const [activeRes, finishedRes, failedRes] = await Promise.all([
      (apiClient as any).projectsConversationsList(pid, {
        limit: 1,
        filters: { status: { op: 'in', value: ACTIVE_STATUSES } },
      }),
      (apiClient as any).projectsConversationsList(pid, {
        limit: 1,
        filters: { status: 'finished' },
      }),
      (apiClient as any).projectsConversationsList(pid, {
        limit: 1,
        filters: { status: { op: 'in', value: ['aborted', 'failed'] } },
      }),
    ])
    convCounts.value = {
      active: activeRes?.total ?? 0,
      finished: finishedRes?.total ?? 0,
      failed: failedRes?.total ?? 0,
    }
  } catch (err: any) {
    conversationsError.value = err?.response?.data?.message || 'Failed to load conversations'
  } finally {
    isLoadingConversations.value = false
  }
}

async function loadIssueCounts(pid: string) {
  if (!pid) return
  isLoadingIssues.value = true
  issuesError.value = null
  try {
    const [criticalRes, highRes, mediumRes, lowRes] = await Promise.all([
      (apiClient as any).projectsIssuesList(pid, { limit: 1, filters: { severity: 'critical' } }),
      (apiClient as any).projectsIssuesList(pid, { limit: 1, filters: { severity: 'high' } }),
      (apiClient as any).projectsIssuesList(pid, { limit: 1, filters: { severity: 'medium' } }),
      (apiClient as any).projectsIssuesList(pid, { limit: 1, filters: { severity: 'low' } }),
    ])
    issueCounts.value = {
      critical: criticalRes?.total ?? 0,
      high: highRes?.total ?? 0,
      medium: mediumRes?.total ?? 0,
      low: lowRes?.total ?? 0,
    }
  } catch (err: any) {
    issuesError.value = err?.response?.data?.message || 'Failed to load issues'
  } finally {
    isLoadingIssues.value = false
  }
}

onMounted(() => {
  loadGlobalStats()
  if (projectId.value) {
    loadConversationCounts(projectId.value)
    loadIssueCounts(projectId.value)
  }
})

watch(projectId, (newId) => {
  if (newId) {
    loadConversationCounts(newId)
    loadIssueCounts(newId)
  }
})

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'CREATE': return 'badge badge-success'
    case 'UPDATE': return 'badge badge-info'
    case 'DELETE': return 'badge badge-danger'
    default: return 'badge badge-secondary'
  }
}
</script>

<template>
  <div class="container-constrained mx-auto">
    <div class="mb-8">
      <h1 class="m-0 mb-2 text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="m-0 text-base text-gray-600 dark:text-gray-400">Platform health and recent activity overview</p>
    </div>

    <!-- Global Stat Tiles -->
    <div class="grid-stats mb-8">
      <div class="stat-card">
        <BriefcaseBusiness class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ projectsStore.pagination.total }}</span>
          </div>
          <div class="stat-label">Projects</div>
        </div>
      </div>

      <div class="stat-card">
        <Users class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ usersStore.pagination.total }}</span>
          </div>
          <div class="stat-label">Users</div>
        </div>
      </div>

      <div class="stat-card">
        <MessageSquare class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="!projectId" class="text-gray-400 text-2xl">—</span>
            <span v-else-if="isLoadingConversations" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ convTotal }}</span>
          </div>
          <div class="stat-label">Conversations</div>
        </div>
      </div>

      <div class="stat-card">
        <ClipboardList class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ auditLogsStore.pagination.total }}</span>
          </div>
          <div class="stat-label">Audit Log Entries</div>
        </div>
      </div>
    </div>

    <!-- Operational Health Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

      <!-- Conversation Status Widget -->
      <div class="section-card">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <MessageSquare class="text-primary-500" :size="20" />
            <h2 class="section-title">Conversations</h2>
          </div>
          <router-link
            v-if="projectId"
            :to="{ name: 'monitor.conversations' }"
            class="btn-link flex items-center gap-1"
          >
            View all <ChevronRight :size="14" />
          </router-link>
        </div>

        <div v-if="!projectId" class="empty-state py-6">
          <FolderOpen class="empty-state-icon" />
          <p class="empty-state-title text-base">No project selected</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Select a project from the top bar to view conversation data.</p>
        </div>

        <div v-else-if="isLoadingConversations" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="conversationsError" class="alert-error">{{ conversationsError }}</div>

        <div v-else class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-center">
            <Activity class="mx-auto mb-2 text-blue-500" :size="20" />
            <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ convCounts.active }}</div>
            <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Active</div>
          </div>
          <div class="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 text-center">
            <CheckCircle class="mx-auto mb-2 text-green-500" :size="20" />
            <div class="text-2xl font-bold text-green-700 dark:text-green-300">{{ convCounts.finished }}</div>
            <div class="text-xs text-green-600 dark:text-green-400 mt-1">Finished</div>
          </div>
          <div class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-center">
            <XCircle class="mx-auto mb-2 text-red-500" :size="20" />
            <div class="text-2xl font-bold text-red-700 dark:text-red-300">{{ convCounts.failed }}</div>
            <div class="text-xs text-red-600 dark:text-red-400 mt-1">Failed / Aborted</div>
          </div>
        </div>
      </div>

      <!-- Issues by Severity Widget -->
      <div class="section-card">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <Bug class="text-primary-500" :size="20" />
            <h2 class="section-title">Issues by Severity</h2>
          </div>
          <router-link
            v-if="projectId"
            :to="{ name: 'monitor.issues' }"
            class="btn-link flex items-center gap-1"
          >
            View all <ChevronRight :size="14" />
          </router-link>
        </div>

        <div v-if="!projectId" class="empty-state py-6">
          <FolderOpen class="empty-state-icon" />
          <p class="empty-state-title text-base">No project selected</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Select a project from the top bar to view issue data.</p>
        </div>

        <div v-else-if="isLoadingIssues" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="issuesError" class="alert-error">{{ issuesError }}</div>

        <div v-else class="flex flex-col gap-3">
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <span class="text-sm font-medium text-red-700 dark:text-red-300">Critical</span>
            <span class="text-lg font-bold text-red-700 dark:text-red-300">{{ issueCounts.critical }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
            <span class="text-sm font-medium text-orange-700 dark:text-orange-300">High</span>
            <span class="text-lg font-bold text-orange-700 dark:text-orange-300">{{ issueCounts.high }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <span class="text-sm font-medium text-yellow-700 dark:text-yellow-300">Medium</span>
            <span class="text-lg font-bold text-yellow-700 dark:text-yellow-300">{{ issueCounts.medium }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Low</span>
            <span class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ issueCounts.low }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Audit Log Activity -->
    <div class="section-card">
      <div class="section-header">
        <div class="flex items-center gap-2">
          <ClipboardList class="text-primary-500" :size="20" />
          <h2 class="section-title">Recent Activity</h2>
        </div>
        <router-link :to="{ name: 'monitor.auditLogs' }" class="btn-link flex items-center gap-1">
          View all <ChevronRight :size="14" />
        </router-link>
      </div>

      <div v-if="isLoadingGlobal" class="flex justify-center py-8">
        <div class="spinner"></div>
      </div>

      <div v-else-if="auditLogsStore.error" class="alert-error">{{ auditLogsStore.error }}</div>

      <div v-else-if="auditLogsStore.logs.length === 0" class="empty-state py-8">
        <p class="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      </div>

      <div v-else class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
        <div
          v-for="log in auditLogsStore.logs"
          :key="log.id"
          class="flex items-center gap-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-6 px-6 cursor-pointer transition-colors"
          @click="router.push({ name: 'monitor.auditLogDetail', params: { auditLogId: log.id } })"
        >
          <span :class="getActionBadgeClass(log.action)" class="flex-shrink-0 w-16 justify-center">{{ log.action }}</span>
          <div class="flex-1 min-w-0 flex items-baseline gap-2">
            <span class="text-sm font-medium text-gray-900 dark:text-white capitalize flex-shrink-0">{{ log.entityType }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">{{ log.entityId }}</span>
          </div>
          <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{{ formatRelativeTime(log.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
