<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useRouter } from 'vue-router'
import {
  useProjectsStore,
  useAuditLogsStore,
  useProjectSelectionStore,
  useAgentsStore,
  useStagesStore,
  useClassifiersStore,
  useKnowledgeStore,
  useToolsStore,
  useGuardrailsStore,
  useProvidersStore,
  useConversationsStore,
  useAnalyticsStore,
  useOperatorsStore,
  useAllApiKeysStore,
  useMonitoringStore,
  useAuthStore,
} from '@/stores'
import RelativeDate from '@/components/RelativeDate.vue'
import StatusMiniBar from '@/components/StatusMiniBar.vue'
import { healthStatusClass, worstNonUnknownStatus, windowCountsLabel } from '@/utils/monitoring'
import apiClient from '@/api/client'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'
import { getStatusBadgeClass, formatStatusLabel } from '@/utils/conversationStatus'
import SetupWizardModal from '@/components/modals/SetupWizardModal.vue'
import {
  BriefcaseBusiness,
  Users,
  ClipboardList,
  MessageSquare,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  ChevronRight,
  Sparkles,
  Zap,
  BookOpen,
  Bug,
  Hammer,
  ShieldCheck,
  Route,
  Target,
  Drama,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  AlertTriangle,
  Key,
  HeartPulse,
  BellRing,
} from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()
const auditLogsStore = useAuditLogsStore()
const projectSelectionStore = useProjectSelectionStore()
const agentsStore = useAgentsStore()
const stagesStore = useStagesStore()
const classifiersStore = useClassifiersStore()
const knowledgeStore = useKnowledgeStore()
const toolsStore = useToolsStore()
const guardrailsStore = useGuardrailsStore()
const providersStore = useProvidersStore()
const conversationsStore = useConversationsStore()
const analyticsStore = useAnalyticsStore()
const operatorsStore = useOperatorsStore()
const allApiKeysStore = useAllApiKeysStore()
const monitoringStore = useMonitoringStore()
const authStore = useAuthStore()

const canMonitor = computed(() => authStore.permissions.includes('system:monitoring'))

// Dashboard card shows the platform checks — per-provider probes are
// summarized in the footer row; details live in System → System Health.
const statusChecks = computed(() => monitoringStore.status?.checks ?? [])
const statusProviders = computed(() => monitoringStore.status?.providers ?? [])

// Platform-checks-only status (provider probes are not part of the main badge),
// using the backend's semantics: worst non-unknown status, unknown when all are unknown.
const systemOverallStatus = computed(() => worstNonUnknownStatus(statusChecks.value))
// Backend global status — includes provider probes.
const globalOverallStatus = computed(() => monitoringStore.status?.overall ?? null)

// Worst non-unknown status across provider probes (footer row badge)
const providerWorstStatus = computed(() => worstNonUnknownStatus(statusProviders.value))

// Aggregated window counts across all provider probes (footer row)
const providerWindowTotals = computed(() => {
  const t = { total: 0, ok: 0, degraded: 0, down: 0, unknown: 0 }
  statusProviders.value.forEach((p) => {
    t.total += p.window.total
    t.ok += p.window.ok
    t.degraded += p.window.degraded
    t.down += p.window.down
    t.unknown += p.window.unknown
  })
  return t
})

// Count of currently firing alert events (limit 1 — only pagination.total is used)
const firingAlertsTotal = ref<number | null>(null)

async function loadFiringAlerts() {
  try {
    await monitoringStore.fetchAlerts({ status: 'firing', limit: 1 })
    firingAlertsTotal.value = monitoringStore.alertsPagination.total
  } catch (err) {
    firingAlertsTotal.value = null
    console.error('Failed to load firing alerts:', err)
  }
}

async function loadStatus() {
  if (!canMonitor.value) return
  try {
    await monitoringStore.fetchStatus({ windowMinutes: 60 })
  } catch (err) {
    console.error('Failed to load status page:', err)
  }
  loadFiringAlerts()
}

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoadingGlobal = ref(true)
const isRefreshing = ref(false)

const userCount = ref(0)
const isLoadingUsers = ref(false)

const convCounts = ref({ active: 0, finished: 0, aborted: 0, failed: 0 })
const convTotal = computed(() => convCounts.value.active + convCounts.value.finished + convCounts.value.aborted + convCounts.value.failed)
const isLoadingConversations = ref(false)

const issueCounts = ref({ critical: 0, major: 0, minor: 0, trivial: 0 })
const recentIssues = ref<any[]>([])

const showIssueModal = ref(false)
const selectedIssue = ref<any | null>(null)

const ACTIVE_STATUSES = [
  'initialized',
  'awaiting_user_input',
  'receiving_user_voice',
  'processing_user_input',
  'generating_response',
]

const showWizard = ref(false)

// Configuration health
interface ConfigItem {
  label: string
  icon: any
  count: number
  critical: boolean
  linkName: string
}

const configItems = computed<ConfigItem[]>(() => [
  { label: 'Agent', icon: Drama, count: agentsStore.pagination.total, critical: true, linkName: 'design.agents' },
  { label: 'Stages', icon: Route, count: stagesStore.pagination.total, critical: true, linkName: 'design.stages' },
  { label: 'Classifiers', icon: Target, count: classifiersStore.pagination.total, critical: false, linkName: 'design.classifiers' },
  { label: 'Knowledge', icon: BookOpen, count: knowledgeStore.pagination.total, critical: false, linkName: 'design.knowledge' },
  { label: 'Tools', icon: Hammer, count: toolsStore.pagination.total, critical: false, linkName: 'design.tools' },
  { label: 'Guardrails', icon: ShieldCheck, count: guardrailsStore.pagination.total, critical: false, linkName: 'design.guardrails' },
])

// Alerts
interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  link?: RouteLocationRaw
  linkLabel?: string
}

const alerts = computed<Alert[]>(() => {
  const items: Alert[] = []

  if (issueCounts.value.critical > 0) {
    items.push({
      id: 'critical-issues',
      severity: 'critical',
      message: `${issueCounts.value.critical} critical issue${issueCounts.value.critical > 1 ? 's' : ''} require attention`,
      link: { name: 'monitor.issues' },
      linkLabel: 'View issues',
    })
  }

  if (issueCounts.value.major > 0) {
    items.push({
      id: 'major-issues',
      severity: 'warning',
      message: `${issueCounts.value.major} major issue${issueCounts.value.major > 1 ? 's' : ''} detected`,
      link: { name: 'monitor.issues' },
      linkLabel: 'View issues',
    })
  }

  const totalCompleted = convCounts.value.finished + convCounts.value.aborted + convCounts.value.failed
  if (totalCompleted > 0) {
    const failureRate = (convCounts.value.failed / totalCompleted) * 100
    if (failureRate > 10) {
      items.push({
        id: 'high-failure-rate',
        severity: 'warning',
        message: `Conversation failure rate is ${failureRate.toFixed(1)}%`,
        link: { name: 'monitor.conversations' },
        linkLabel: 'View conversations',
      })
    }
  }

  const hasLlmProvider = providersStore.items.some(p => p.providerType === 'llm')
  if (!hasLlmProvider) {
    items.push({
      id: 'no-llm-provider',
      severity: 'warning',
      message: 'No LLM provider configured',
      link: { name: 'administration.providers' },
      linkLabel: 'Configure providers',
    })
  }

  return items.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
})

// Performance metrics
const avgTTFT = computed(() => {
  if (!analyticsStore.latencyStats?.timeToFirstTokenMs) return null
  const ms = analyticsStore.latencyStats.timeToFirstTokenMs.avg
  if (ms == null || ms === 0) return null
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
})

const avgLLMDuration = computed(() => {
  if (!analyticsStore.latencyStats?.llmDurationMs) return null
  const ms = analyticsStore.latencyStats.llmDurationMs.avg
  if (ms == null || ms === 0) return null
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
})

const avgTurnDuration = computed(() => {
  if (!analyticsStore.latencyStats?.totalTurnDurationMs) return null
  const ms = analyticsStore.latencyStats.totalTurnDurationMs.avg
  if (ms == null || ms === 0) return null
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
})

const tokenUsage = computed(() => {
  const stats = analyticsStore.tokenUsageStats
  if (!stats) return null
  return {
    total: stats.totalTokens,
    prompt: stats.totalPromptTokens,
    completion: stats.totalCompletionTokens,
  }
})

// Recent conversations
const recentConversations = computed(() => conversationsStore.conversations || [])

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'k'
  return String(n)
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.?0+$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'k'
  return String(n)
}

function getStageName(id: string | null | undefined): string {
  if (!id) return '—'
  const stage = stagesStore.items.find(s => s.id === id)
  return stage?.name ?? id.slice(-6)
}

function getSeverityClass(severity: string): string {
  const severityMap: Record<string, string> = {
    critical: 'issue-badge-severity-error',
    major: 'issue-badge-severity-warning',
    minor: 'issue-badge-severity-info',
    trivial: 'issue-badge-severity-inactive',
  }
  return severityMap[severity.toLowerCase()] || 'issue-badge-severity-inactive'
}

function openIssueModal(issue: any) {
  selectedIssue.value = issue
  showIssueModal.value = true
}

function closeIssueModal() {
  showIssueModal.value = false
  selectedIssue.value = null
}

async function loadGlobalStats() {
  isLoadingGlobal.value = true
  try {
    await projectsStore.fetchCount()
    if ((projectsStore.count ?? 0) === 0 && localStorage.getItem('bonsai_wizard_dismissed') !== 'true') {
      showWizard.value = true
    }
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
  try {
    const [activeRes, finishedRes, abortedRes, failedRes] = await Promise.all([
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
        filters: { status: 'aborted' },
      }),
      (apiClient as any).projectsConversationsList(pid, {
        limit: 1,
        filters: { status: 'failed' },
      }),
    ])
    convCounts.value = {
      active: activeRes?.total ?? 0,
      finished: finishedRes?.total ?? 0,
      aborted: abortedRes?.total ?? 0,
      failed: failedRes?.total ?? 0,
    }
  } catch (err: any) {
    console.error('Failed to load conversation counts:', err)
  } finally {
    isLoadingConversations.value = false
  }
}

async function loadIssueCounts(pid: string) {
  if (!pid) return
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
  }
}

async function loadRecentIssues(pid: string) {
  if (!pid) return
  try {
    const res = await apiClient.issuesList({ limit: 5, orderBy: '-createdAt', filters: { projectId: pid } }) as any
    recentIssues.value = res?.items ?? []
  } catch (err: any) {
    console.log('Error loading recent issues:', err)
  }
}

async function loadProjectData() {
  const pid = projectId.value
  if (!pid) return

  await Promise.all([
    agentsStore.fetchAll(pid, { limit: 1 }),
    stagesStore.fetchAll(pid, { limit: 1 }),
    classifiersStore.fetchAll(pid, { limit: 1 }),
    knowledgeStore.fetchCategories(pid, { limit: 1 }),
    toolsStore.fetchAll(pid, { limit: 1 }),
    guardrailsStore.fetchAll(pid, { limit: 1 }),
    providersStore.fetchAll({ filters: { providerType: 'llm' } }),
    conversationsStore.fetchAll(pid, { limit: 5, orderBy: '-createdAt' }),
    loadConversationCounts(pid),
    loadIssueCounts(pid),
    loadRecentIssues(pid),
    analyticsStore.fetchAllTokenUsage(pid),
    analyticsStore.fetchAll(pid),
  ])
}

async function refreshAll() {
  isRefreshing.value = true
  try {
    await Promise.all([
      loadGlobalStats(),
      loadUserCount(projectId.value),
      loadRecentAuditLogs(projectId.value || undefined),
      ...(!projectId.value ? [loadStatus()] : []),
    ])
    if (projectId.value) {
      await loadProjectData()
    }
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  loadGlobalStats()
  loadRecentAuditLogs(projectId.value || undefined)
  if (projectId.value) {
    loadProjectData()
    loadUserCount(projectId.value)
  } else {
    operatorsStore.fetchAll({ limit: 1 })
    allApiKeysStore.fetchAll({ limit: 1 })
    providersStore.fetchAll({ limit: 1 })
    loadStatus()
  }
})

watch(projectId, (newId) => {
  if (newId) {
    loadProjectData()
    loadUserCount(newId)
  } else {
    userCount.value = 0
    operatorsStore.fetchAll({ limit: 1 })
    allApiKeysStore.fetchAll({ limit: 1 })
    providersStore.fetchAll({ limit: 1 })
    loadStatus()
  }
  loadRecentAuditLogs(newId || undefined)
})
</script>

<template>
  <div class="container-constrained mx-auto">
    <SetupWizardModal
      v-if="showWizard"
      @close="showWizard = false"
      @project-created="loadGlobalStats"
    />

    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p v-if="!projectId" class="page-subtitle">Platform health and setup overview</p>
        <p v-else class="page-subtitle">Project health, alerts, and performance overview</p>
      </div>
      <div class="flex items-center gap-2 self-start mt-1">
        <button
          v-if="projectId"
          class="btn-secondary flex items-center gap-2"
          :disabled="isRefreshing"
          @click="refreshAll"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': isRefreshing }" />
          Refresh
        </button>
        <button
          v-if="!isLoadingGlobal && (projectsStore.count ?? 0) === 0"
          class="btn-secondary flex items-center gap-2"
          @click="showWizard = true"
        >
          <Sparkles :size="16" />
          Setup Guide
        </button>
      </div>
    </div>

    <!-- NO PROJECT SELECTED -->
    <template v-if="!projectId">
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
              <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
              <span v-else>{{ formatCount(operatorsStore.pagination.total) }}</span>
            </div>
            <div class="stat-label">Operators</div>
          </div>
        </div>

        <div class="stat-card">
          <Settings class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">
              <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
              <span v-else>{{ formatCount(providersStore.pagination.total) }}</span>
            </div>
            <div class="stat-label">Providers</div>
          </div>
        </div>

        <div class="stat-card">
          <Key class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">
              <span v-if="isLoadingGlobal" class="text-gray-400 text-2xl">—</span>
              <span v-else>{{ formatCount(allApiKeysStore.pagination.total) }}</span>
            </div>
            <div class="stat-label">API Keys</div>
          </div>
        </div>
      </div>

      <!-- System Health (monitoring permission required) -->
      <div v-if="canMonitor" class="section-card mb-6">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <HeartPulse class="text-primary-500" :size="20" />
            <h2 class="section-title">System Health</h2>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="systemOverallStatus"
              class="badge capitalize"
              :class="healthStatusClass(systemOverallStatus)"
              title="Platform checks only (db, process, service heartbeats)"
            >
              System: {{ systemOverallStatus }}
            </span>
            <span
              v-if="globalOverallStatus"
              class="badge capitalize"
              :class="healthStatusClass(globalOverallStatus)"
              title="All checks including provider probes (backend overall)"
            >
              All: {{ globalOverallStatus }}
            </span>
            <span v-if="monitoringStore.status?.generatedAt" class="text-xs text-gray-500 dark:text-gray-400">
              checked <RelativeDate :date="monitoringStore.status.generatedAt" />
            </span>
            <router-link
              v-if="firingAlertsTotal"
              :to="{ name: 'system.alerts', query: { status: 'firing' } }"
              class="badge badge-danger flex items-center gap-1"
              title="Firing alert events"
            >
              <BellRing :size="12" />
              {{ firingAlertsTotal }} firing
            </router-link>
            <router-link :to="{ name: 'system.health' }" class="btn-link flex items-center gap-1">
              View all <ChevronRight :size="14" />
            </router-link>
          </div>
        </div>

        <div v-if="monitoringStore.statusLoading" class="flex justify-center py-6">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.statusError" class="alert-error">{{ monitoringStore.statusError }}</div>

        <div v-else-if="statusChecks.length === 0 && statusProviders.length === 0" class="py-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">Waiting for the first health-check cycle…</p>
        </div>

        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="check in statusChecks"
              :key="check.name"
              class="flex items-center gap-2 rounded-md border border-gray-100 dark:border-gray-700 px-3 py-2"
            >
              <span class="badge flex-shrink-0 w-16 justify-center capitalize" :class="healthStatusClass(check.status)">
                {{ check.status }}
              </span>
              <span class="text-xs font-medium flex-1 truncate" :title="check.name">{{ check.label || check.name }}</span>
              <StatusMiniBar :window="check.window" width-class="w-14" class="hidden sm:flex" />
              <span v-if="check.latencyMs != null" class="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                {{ Math.round(check.latencyMs) }} ms
              </span>
            </div>
          </div>

          <div
            v-if="statusProviders.length > 0"
            class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap"
          >
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Providers</span>
            <span class="badge flex-shrink-0 justify-center capitalize" :class="healthStatusClass(providerWorstStatus ?? 'unknown')">
              {{ providerWorstStatus ?? 'unknown' }}
            </span>
            <span
              class="text-xs text-gray-400 dark:text-gray-500 tabular-nums"
              :title="`Provider probes over the last ${monitoringStore.status?.windowMinutes ?? 60} minutes`"
            >
              {{ windowCountsLabel(providerWindowTotals) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Platform Activity -->
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
            <span class="badge badge-secondary flex-shrink-0 w-16 justify-center">{{ log.action }}</span>
            <div class="flex-1 min-w-0 flex items-baseline gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{{ log.entityType }}</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ log.newEntity?.name ?? log.oldEntity?.name ?? `[${log.entityId}]` }}</span>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"><RelativeDate :date="log.createdAt" /></span>
          </div>
        </div>
      </div>
    </template>

    <!-- PROJECT SELECTED -->
    <template v-else>
      <!-- Configuration Health -->
      <div class="section-card mb-6">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <Settings class="text-primary-500" :size="20" />
            <h2 class="section-title">Configuration Health</h2>
          </div>
        </div>

        <div v-if="isLoadingGlobal" class="flex justify-center py-4">
          <div class="spinner"></div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <router-link
            v-for="item in configItems"
            :key="item.label"
            :class="[
              'rounded-lg border p-4 flex flex-col items-center gap-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30',
              item.count > 0
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20',
            ]"
            :to="{ name: item.linkName, params: { projectId } }"
          >
            <component :is="item.icon" :size="24" :class="item.count > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'" />
            <div class="text-center">
              <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.label }}</div>
              <div :class="item.count > 0 ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-500 dark:text-red-400'">
                {{ item.count > 0 ? `${item.count} configured` : 'Not configured' }}
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="alerts.length > 0" class="mb-6 flex flex-col gap-3">
        <div v-for="alert in alerts" :key="alert.id"
          :class="[
            'rounded-lg border p-4 flex items-start gap-3',
            alert.severity === 'critical'
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
              : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20',
          ]"
        >
          <AlertTriangle :size="20"
            :class="alert.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'"
            class="flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <p :class="alert.severity === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'" class="text-sm font-medium">
              {{ alert.message }}
            </p>
            <router-link
              v-if="alert.link"
              :to="alert.link"
              :class="[
                'text-xs mt-1 inline-flex items-center gap-1',
                alert.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400',
              ]"
            >
              {{ alert.linkLabel }} <ChevronRight :size="12" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Performance + Conversation Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Performance Metrics -->
        <div class="section-card">
          <div class="section-header">
            <div class="flex items-center gap-2">
              <Zap class="text-primary-500" :size="20" />
              <h2 class="section-title">Performance</h2>
            </div>
          </div>

          <!-- Token Usage -->
          <div v-if="tokenUsage" class="mb-6">
            <div class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1">Total Tokens</div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white mb-3">{{ formatTokens(tokenUsage.total) }}</div>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 rounded-full overflow-hidden flex">
                <div
                  class="h-full bg-emerald-500"
                  :style="{ width: tokenUsage.prompt > 0 ? `${(tokenUsage.prompt / tokenUsage.total) * 100}%` : '0%' }"
                />
                <div class="flex-1 h-full bg-teal-400 dark:bg-teal-600" />
              </div>
            </div>
            <div class="flex items-center justify-between mt-2 text-xs">
              <span class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span class="text-gray-500 dark:text-gray-400">Prompt</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatTokens(tokenUsage.prompt) }}</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-teal-400 dark:bg-teal-600" />
                <span class="text-gray-500 dark:text-gray-400">Completion</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatTokens(tokenUsage.completion) }}</span>
              </span>
            </div>
          </div>

          <!-- Latency Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div v-if="avgTTFT" class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-amber-300 dark:bg-amber-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Time to first token</span>
              </div>
              <div class="text-xl font-bold text-gray-900 dark:text-white">{{ avgTTFT }}</div>
            </div>
            <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-amber-300 dark:bg-amber-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Time to first token</span>
              </div>
              <div class="text-xl font-bold text-gray-400">—</div>
            </div>

            <div v-if="avgLLMDuration" class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-emerald-300 dark:bg-emerald-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Avg LLM duration</span>
              </div>
              <div class="text-xl font-bold text-gray-900 dark:text-white">{{ avgLLMDuration }}</div>
            </div>
            <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-emerald-300 dark:bg-emerald-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Avg LLM duration</span>
              </div>
              <div class="text-xl font-bold text-gray-400">—</div>
            </div>

            <div v-if="avgTurnDuration" class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-blue-300 dark:bg-blue-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Avg turn duration</span>
              </div>
              <div class="text-xl font-bold text-gray-900 dark:text-white">{{ avgTurnDuration }}</div>
            </div>
            <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-block w-2 h-2 rounded-sm bg-blue-300 dark:bg-blue-700 flex-shrink-0" />
                <span class="text-xs text-gray-500 dark:text-gray-400">Avg turn duration</span>
              </div>
              <div class="text-xl font-bold text-gray-400">—</div>
            </div>
          </div>
        </div>

        <!-- Conversation Summary -->
        <div class="section-card">
          <div class="section-header">
            <div class="flex items-center gap-2">
              <MessageSquare class="text-primary-500" :size="20" />
              <h2 class="section-title">Conversations</h2>
            </div>
            <router-link
              :to="{ name: 'monitor.conversations' }"
              class="btn-link flex items-center gap-1"
            >
              View all <ChevronRight :size="14" />
            </router-link>
          </div>

          <div v-if="isLoadingConversations" class="flex justify-center py-8">
            <div class="spinner"></div>
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900 p-5 flex items-center gap-4">
              <Activity class="text-blue-500 flex-shrink-0" :size="32" />
              <div>
                <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ formatCount(convCounts.active) }}</div>
                <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Active</div>
              </div>
            </div>
            <div class="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 p-5 flex items-center gap-4">
              <CheckCircle class="text-green-500 flex-shrink-0" :size="32" />
              <div>
                <div class="text-3xl font-bold text-green-700 dark:text-green-300">{{ formatCount(convCounts.finished) }}</div>
                <div class="text-xs text-green-600 dark:text-green-400 mt-1">Finished</div>
              </div>
            </div>
            <div class="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900 p-5 flex items-center gap-4">
              <Ban class="text-orange-500 flex-shrink-0" :size="32" />
              <div>
                <div class="text-3xl font-bold text-orange-700 dark:text-orange-300">{{ formatCount(convCounts.aborted) }}</div>
                <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">Aborted</div>
              </div>
            </div>
            <div class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 p-5 flex items-center gap-4">
              <XCircle class="text-red-500 flex-shrink-0" :size="32" />
              <div>
                <div class="text-3xl font-bold text-red-700 dark:text-red-300">{{ formatCount(convCounts.failed) }}</div>
                <div class="text-xs text-red-600 dark:text-red-400 mt-1">Failed</div>
              </div>
            </div>
          </div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ formatCount(convTotal) }}</span> conversations
          </p>
        </div>
      </div>

      <!-- Issues + Recent Conversations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Issues -->
        <div class="section-card">
          <div class="section-header">
            <div class="flex items-center gap-2">
              <Bug class="text-primary-500" :size="20" />
              <h2 class="section-title">Issues</h2>
            </div>
            <router-link :to="{ name: 'monitor.issues' }" class="btn-link flex items-center gap-1">
              View all <ChevronRight :size="14" />
            </router-link>
          </div>

          <div v-if="isLoadingGlobal" class="flex justify-center py-4">
            <div class="spinner"></div>
          </div>

          <div v-else>
            <!-- Severity counts row -->
            <div class="flex items-center gap-4 mb-4 text-sm">
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
                <span class="text-gray-500 dark:text-gray-400">Critical</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ issueCounts.critical }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-orange-500" />
                <span class="text-gray-500 dark:text-gray-400">Major</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ issueCounts.major }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                <span class="text-gray-500 dark:text-gray-400">Minor</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ issueCounts.minor }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-gray-400" />
                <span class="text-gray-500 dark:text-gray-400">Trivial</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ issueCounts.trivial }}</span>
              </div>
            </div>

            <!-- Recent issues list -->
            <div v-if="recentIssues.length === 0" class="empty-state py-6">
              <p class="text-sm text-gray-500 dark:text-gray-400">No issues recorded yet.</p>
            </div>

            <div v-else class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
              <div
                v-for="issue in recentIssues"
                :key="issue.id"
                class="py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-6 px-6 cursor-pointer transition-colors"
                @click="openIssueModal(issue)"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSeverityClass(issue.severity)"
                  >
                    {{ formatStatusLabel(issue.severity) }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ issue.category }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"><RelativeDate :date="issue.createdAt" /></span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ issue.bugDescription }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Conversations -->
        <div class="section-card">
          <div class="section-header">
            <div class="flex items-center gap-2">
              <MessageSquare class="text-primary-500" :size="20" />
              <h2 class="section-title">Recent Conversations</h2>
            </div>
            <router-link :to="{ name: 'monitor.conversations' }" class="btn-link flex items-center gap-1">
              View all <ChevronRight :size="14" />
            </router-link>
          </div>

          <div v-if="conversationsStore.isLoading" class="flex justify-center py-8">
            <div class="spinner"></div>
          </div>

          <div v-else-if="conversationsStore.error" class="alert-error">{{ conversationsStore.error }}</div>

          <div v-else-if="recentConversations.length === 0" class="empty-state py-8">
            <MessageSquare class="empty-state-icon" />
            <p class="text-sm text-gray-500 dark:text-gray-400">No conversations yet.</p>
          </div>

          <div v-else class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
            <div
              v-for="conv in recentConversations"
              :key="conv.id"
              class="flex items-center gap-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-6 px-6 cursor-pointer transition-colors"
              @click="router.push({ name: 'monitor.conversationDetail', params: { conversationId: conv.id } })"
            >
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(conv.status)"
                >
                  {{ formatStatusLabel(conv.status) }}
                </span>
                <ArrowDownLeft v-if="conv.direction === 'incoming'" class="w-3.5 h-3.5 text-blue-500" title="Incoming" />
                <ArrowUpRight v-else-if="conv.direction === 'outgoing'" class="w-3.5 h-3.5 text-violet-500" title="Outgoing" />
              </div>

              <span class="font-mono text-sm text-gray-700 dark:text-gray-300 flex-shrink-0 truncate" :title="conv.id">
                {{ conv.id.slice(-8) }}
              </span>

              <span class="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline-flex">
                {{ getStageName(conv.startingStageId) }}
              </span>

              <div class="flex-1 min-w-0">
                <p v-if="conv.statusDetails" class="text-sm text-gray-500 dark:text-gray-400 truncate" :title="conv.statusDetails">
                  {{ conv.statusDetails }}
                </p>
              </div>

              <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"><RelativeDate :date="conv.createdAt" /></span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Issue Edit Modal -->
    <IssueEditModal
      v-if="showIssueModal"
      :issue="selectedIssue"
      @close="closeIssueModal"
    />
  </div>
</template>
