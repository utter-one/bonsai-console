<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useProjectsStore,
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
const auditLogsStore = useAuditLogsStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoadingGlobal = ref(true)

const userCount = ref(0)
const isLoadingUsers = ref(false)

const convCounts = ref({ active: 0, finished: 0, failed: 0 })
const convTotal = computed(() => convCounts.value.active + convCounts.value.finished + convCounts.value.failed)
const isLoadingConversations = ref(false)
const conversationsError = ref<string | null>(null)

const issueCounts = ref({ critical: 0, major: 0, minor: 0, trivial: 0 })
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
    await projectsStore.fetchCount()
  } catch (error) {
    console.error('Failed to load global stats:', error)
  } finally {
    isLoadingGlobal.value = false
  }
}

async function loadUserCount(pid: string) {
  if (!pid) {
    userCount.value = 0
    return
  }
  isLoadingUsers.value = true
  try {
    const res = await (apiClient as any).projectsUsersList(pid, { limit: 1 }) as any
    userCount.value = res?.total ?? 0
  } catch (err) {
    console.error('Failed to load user count:', err)
  } finally {
    isLoadingUsers.value = false
  }
}

async function loadRecentAuditLogs(pid?: string) {
  const params: Record<string, any> = { limit: 10, orderBy: '-createdAt' }
  if (pid) {
    params.filters = { projectId: pid }
  }
  await auditLogsStore.fetchAll(params)
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
    const [criticalRes, majorRes, minorRes, trivialRes] = await Promise.all([
      apiClient.issuesList({ limit: 1, filters: { projectId: pid, severity: 'critical' } }),
      apiClient.issuesList({ limit: 1, filters: { projectId: pid, severity: 'major' } }),
      apiClient.issuesList({ limit: 1, filters: { projectId: pid, severity: 'minor' } }),
      apiClient.issuesList({ limit: 1, filters: { projectId: pid, severity: 'trivial' } }),
    ])
    issueCounts.value = {
      critical: criticalRes?.total ?? 0,
      major: majorRes?.total ?? 0,
      minor: minorRes?.total ?? 0,
      trivial: trivialRes?.total ?? 0,
    }
  } catch (err: any) {
    console.log('Error loading issue counts:', err)
    issuesError.value = err?.response?.data?.message || 'Failed to load issues'
  } finally {
    isLoadingIssues.value = false
  }
}

onMounted(() => {
  loadGlobalStats()
  loadRecentAuditLogs(projectId.value || undefined)
  if (projectId.value) {
    loadConversationCounts(projectId.value)
    loadIssueCounts(projectId.value)
    loadUserCount(projectId.value)
  }
})

watch(projectId, (newId) => {
  loadRecentAuditLogs(newId || undefined)
  if (newId) {
    loadConversationCounts(newId)
    loadIssueCounts(newId)
    loadUserCount(newId)
  } else {
    userCount.value = 0
  }
})

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'k'
  return String(n)
}

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
            <span v-else>{{ formatCount(projectsStore.count ?? 0) }}</span>
          </div>
          <div class="stat-label">Projects</div>
        </div>
      </div>

      <div class="stat-card">
        <Users class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="!projectId" class="text-gray-400 text-2xl">—</span>
            <span v-else-if="isLoadingUsers" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ formatCount(userCount) }}</span>
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
            <span v-else>{{ formatCount(convTotal) }}</span>
          </div>
          <div class="stat-label">Conversations</div>
        </div>
      </div>

      <div class="stat-card">
        <ClipboardList class="text-primary-500 flex-shrink-0" :size="36" />
        <div class="flex-1">
          <div class="stat-value">
            <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
            <span v-else>{{ formatCount(auditLogsStore.pagination.total) }}</span>
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
          <div class="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-8 text-center">
            <Activity class="mx-auto mb-3 text-blue-500" :size="28" />
            <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ formatCount(convCounts.active) }}</div>
            <div class="text-xs text-blue-600 dark:text-blue-400 mt-2">Active</div>
          </div>
          <div class="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-8 text-center">
            <CheckCircle class="mx-auto mb-3 text-green-500" :size="28" />
            <div class="text-3xl font-bold text-green-700 dark:text-green-300">{{ formatCount(convCounts.finished) }}</div>
            <div class="text-xs text-green-600 dark:text-green-400 mt-2">Finished</div>
          </div>
          <div class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-8 text-center">
            <XCircle class="mx-auto mb-3 text-red-500" :size="28" />
            <div class="text-3xl font-bold text-red-700 dark:text-red-300">{{ formatCount(convCounts.failed) }}</div>
            <div class="text-xs text-red-600 dark:text-red-400 mt-2">Failed / Aborted</div>
          </div>
        </div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Total number of conversations is <span class="font-semibold text-gray-700 dark:text-gray-200">{{ formatCount(convTotal) }}</span>
        </p>
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
            <span class="text-lg font-bold text-red-700 dark:text-red-300">{{ formatCount(issueCounts.critical) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
            <span class="text-sm font-medium text-orange-700 dark:text-orange-300">Major</span>
            <span class="text-lg font-bold text-orange-700 dark:text-orange-300">{{ formatCount(issueCounts.major) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Minor</span>
            <span class="text-lg font-bold text-blue-700 dark:text-blue-300">{{ formatCount(issueCounts.minor) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Trivial</span>
            <span class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ formatCount(issueCounts.trivial) }}</span>
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

      <div v-if="auditLogsStore.isLoading" class="flex justify-center py-8">
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
          <div class="flex items-center gap-2 flex-shrink-0">
            <span v-if="log.userId" class="text-xs font-mono text-gray-400 dark:text-gray-500 truncate" :title="log.userId">{{ log.userId }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatRelativeTime(log.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
