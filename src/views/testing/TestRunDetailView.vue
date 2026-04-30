<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectSelectionStore } from '@/stores'
import RelativeDate from '@/components/RelativeDate.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import { ArrowLeft, Download, RefreshCw, CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-vue-next'
import apiClient from '@/api/client'
import { formatEnum } from '@/composables'
import { getStatusBadgeClass, formatStatusLabel } from '@/utils/conversationStatus'
import type { ScenarioRunResponse, ScenarioResponse, ScenarioConversationResponse, TesterResponse } from '@/api/types'
import { ScenarioRunStatus } from '@/api/types'

const route = useRoute()
const router = useRouter()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || (route.params.projectId as string) || '')
const runId = computed(() => route.params.runId as string)

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const activeTab = ref<'results' | 'pass-fail' | 'conversations'>('pass-fail')

const run = ref<ScenarioRunResponse | null>(null)
const scenario = ref<ScenarioResponse | null>(null)
const conversations = ref<ScenarioConversationResponse[]>([])
const testerMap = ref<Record<string, string>>({})
const conversationStatusMap = ref<Record<string, string>>({})

let intervalId: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

async function pollRun() {
  try {
    const runData = await (apiClient as any).projectsScenarioRunsDetail(projectId.value, runId.value)
    run.value = runData as ScenarioRunResponse

    const convsData = await (apiClient as any).projectsScenarioConversationsList(projectId.value, {
      scenarioRunId: runId.value,
      limit: 1000,
    })
    const items = (convsData as { items: ScenarioConversationResponse[] }).items
    conversations.value = items

    const conversationIds = items
      .map(c => c.conversationId)
      .filter((id): id is string => id != null)
    if (conversationIds.length > 0) {
      const underlyingConvs = await (apiClient as any).projectsConversationsList(projectId.value, {
        limit: conversationIds.length,
        filters: { id: conversationIds },
      })
      conversationStatusMap.value = Object.fromEntries((underlyingConvs as { items: { id: string; status: string }[] }).items.map(c => [c.id, c.status]))
    }

    const r = runData as ScenarioRunResponse
    const isTerminal = r.status === ScenarioRunStatus.Passed ||
      r.status === ScenarioRunStatus.Failed ||
      r.status === ScenarioRunStatus.Cancelled
    if (isTerminal) {
      stopPolling()
    }
  } catch {
    // Silently ignore polling errors
  }
}

watch(run, (newRun) => {
  if (!newRun) return
  const isTerminal = newRun.status === ScenarioRunStatus.Passed ||
    newRun.status === ScenarioRunStatus.Failed ||
    newRun.status === ScenarioRunStatus.Cancelled
  if (!isTerminal && !intervalId) {
    intervalId = setInterval(pollRun, 5000)
  }
})

onUnmounted(() => {
  stopPolling()
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'pass-fail', label: 'Pass / Fail' },
  { key: 'results', label: 'Results Table' },
  { key: 'conversations', label: 'Conversations' },
])

onMounted(() => loadAll())

async function loadAll() {
  isLoading.value = true
  loadError.value = null
  try {
    const [runData, testersData] = await Promise.all([
      (apiClient as any).projectsScenarioRunsDetail(projectId.value, runId.value) as Promise<ScenarioRunResponse>,
      (apiClient as any).projectsTestersList(projectId.value, { limit: 1000 }) as Promise<{ items: TesterResponse[] }>,
    ])
    run.value = runData
    testerMap.value = Object.fromEntries(testersData.items.map((t: TesterResponse) => [t.id, t.name]))

    const [scenarioData, convsData] = await Promise.all([
      (apiClient as any).projectsScenariosDetail(projectId.value, runData.scenarioId) as Promise<ScenarioResponse>,
      (apiClient as any).projectsScenarioConversationsList(projectId.value, {
        scenarioRunId: runId.value,
        limit: 1000,
      }) as Promise<{ items: ScenarioConversationResponse[] }>,
    ])
    scenario.value = scenarioData
    conversations.value = convsData.items

    const conversationIds = convsData.items
      .map(c => c.conversationId)
      .filter((id): id is string => id != null)
    if (conversationIds.length > 0) {
      const underlyingConvs = await (apiClient as any).projectsConversationsList(projectId.value, {
        limit: conversationIds.length,
        filters: { id: conversationIds },
      }) as { items: { id: string; status: string }[] }
      conversationStatusMap.value = Object.fromEntries(underlyingConvs.items.map(c => [c.id, c.status]))
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load run details'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'testing.testRuns', params: { projectId: projectId.value } })
}

// ── Results table ──────────────────────────────────────────────

const extractionColumns = computed(() =>
  (scenario.value?.dataExtraction ?? []).map(e => ({ key: e.varName, label: e.varName, source: 'extraction' as const }))
)

const transformerColumns = computed(() =>
  Object.keys(scenario.value?.dataPostProcessingExpected ?? {}).map(k => ({
    key: k, label: k, source: 'transformation' as const,
  }))
)

const allColumns = computed(() => [...extractionColumns.value, ...transformerColumns.value])

function cellValue(conv: ScenarioConversationResponse, col: { key: string; source: 'extraction' | 'transformation' }): string {
  const map = col.source === 'extraction' ? conv.dataExtractionResults : conv.dataTransformationResults
  const v = map?.[col.key]
  if (v === undefined || v === null) return ''
  return typeof v === 'string' ? v : JSON.stringify(v)
}

function exportCsv() {
  const headers = ['Conversation ID', 'Tester', 'Status', ...allColumns.value.map(c => c.label)]
  const rows = conversations.value.map(conv => [
    conv.conversationId ?? conv.id,
    testerMap.value[conv.testerId] ?? conv.testerId,
    conv.status,
    ...allColumns.value.map(c => cellValue(conv, c)),
  ])
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `run-${runId.value}-results.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Pass / Fail ────────────────────────────────────────────────

interface CheckedField {
  label: string
  source: 'extraction' | 'transformation'
  expected: any
}

const checkedFields = computed<CheckedField[]>(() => {
  const fields: CheckedField[] = []
  for (const entry of scenario.value?.dataExtraction ?? []) {
    if (entry.expectedValue !== undefined && entry.expectedValue !== null && entry.expectedValue !== '') {
      fields.push({ label: entry.varName, source: 'extraction', expected: entry.expectedValue })
    }
  }
  for (const [key, expected] of Object.entries(scenario.value?.dataPostProcessingExpected ?? {})) {
    fields.push({ label: key, source: 'transformation', expected })
  }
  return fields
})

function actualValue(conv: ScenarioConversationResponse, field: CheckedField): any {
  const map = field.source === 'extraction' ? conv.dataExtractionResults : conv.dataTransformationResults
  return map?.[field.label]
}

function isPassing(conv: ScenarioConversationResponse, field: CheckedField): boolean {
  const actual = actualValue(conv, field)
  const expected = field.expected
  if (typeof expected === 'string' && typeof actual === 'string') return actual === expected
  return JSON.stringify(actual) === JSON.stringify(expected)
}

const passStats = computed(() => {
  if (checkedFields.value.length === 0 || conversations.value.length === 0) return null
  let total = 0
  let passed = 0
  for (const conv of conversations.value) {
    for (const field of checkedFields.value) {
      total++
      if (isPassing(conv, field)) passed++
    }
  }
  return { total, passed, pct: Math.round((passed / total) * 100) }
})

// ── Status helpers ─────────────────────────────────────────────

function runStatusBadgeClass(status: ScenarioRunStatus): string {
  switch (status) {
    case ScenarioRunStatus.Queued: return 'badge-secondary'
    case ScenarioRunStatus.InProgress: return 'badge-info'
    case ScenarioRunStatus.Passed: return 'badge-success'
    case ScenarioRunStatus.Failed: return 'badge-error'
    case ScenarioRunStatus.Cancelled: return 'badge-warning'
    default: return 'badge-secondary'
  }
}

function convOverallStatus(conv: ScenarioConversationResponse): 'Passed' | 'Failed' {
  if (conv.status === 'queued' || conv.status === 'in_progress') return 'Failed'
  return checkedFields.value.every(f => isPassing(conv, f)) ? 'Passed' : 'Failed'
}

function convOverallStatusBadgeClass(status: 'Passed' | 'Failed'): string {
  return status === 'Passed' ? 'badge-success' : 'badge-error'
}

function convLifecycleStatusLabel(status: string): string {
  switch (status) {
    case 'queued':
    case 'in_progress': return 'In Progress'
    case 'passed': return 'Completed'
    case 'failed': return 'Failed'
    case 'cancelled': return 'Aborted'
    default: return status
  }
}

function convLifecycleStatusBadgeClass(status: string): string {
  switch (status) {
    case 'queued':
    case 'in_progress': return 'badge-info'
    case 'passed': return 'badge-success'
    case 'failed': return 'badge-error'
    case 'cancelled': return 'badge-warning'
    default: return 'badge-secondary'
  }
}

function openConversation(conv: ScenarioConversationResponse) {
  if (!conv.conversationId) return
  router.push({ name: 'monitor.conversationDetail', params: { conversationId: conv.conversationId } })
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to test runs">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Run</h1>
            <span v-if="run" :class="runStatusBadgeClass(run.status)" :title="run.statusDetails || undefined">
              {{ formatEnum(run.status) }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ runId }}</p>
          <p v-if="scenario" class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Scenario: <span class="font-medium text-gray-800 dark:text-gray-200">{{ scenario.name }}</span>
          </p>
          <div v-if="run" class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Conversations: <span class="font-medium text-gray-800 dark:text-gray-200">{{ run.totalConversations }}</span></span>
            <span>Testers: <span class="font-medium text-gray-800 dark:text-gray-200">{{ Object.keys(run.testers).length }}</span></span>
            <span v-if="run.createdAt">Started: <RelativeDate :date="run.createdAt" /></span>
            <span v-if="passStats">Pass rate:
              <span :class="passStats.pct >= 100 ? 'text-green-600 dark:text-green-400' : passStats.pct > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
                {{ passStats.pct }}%
              </span>
              <span class="text-gray-400 ml-1">({{ passStats.passed }}/{{ passStats.total }})</span>
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary flex items-center gap-2" :disabled="isLoading" @click="loadAll">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      Loading run details...
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="error-state">
      {{ loadError }}
      <button @click="goBack" class="btn-secondary mt-4">Back to Test Runs</button>
    </div>

    <div v-else-if="run" class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">

      <!-- Results Table Tab -->
      <TabContent v-model="activeTab" tab="results">
        <div class="px-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Results Table</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Extracted variable values for each conversation</p>
            </div>
            <button
              v-if="conversations.length > 0 && allColumns.length > 0"
              class="btn-secondary flex items-center gap-2"
              @click="exportCsv"
            >
              <Download class="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div v-if="allColumns.length === 0" class="empty-state">
            <p class="empty-state-title">No extraction columns</p>
            <p class="empty-state-description">This scenario has no data extraction or post-processing configuration.</p>
          </div>

          <div v-else-if="conversations.length === 0" class="empty-state">
            <p class="empty-state-title">No conversations yet</p>
            <p class="empty-state-description">Conversations will appear here as they are generated.</p>
          </div>

          <div v-else class="table-container">
            <div class="table-wrapper overflow-x-auto">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell whitespace-nowrap">Tester</th>
                    <th class="table-header-cell whitespace-nowrap">Status</th>
                    <th
                      v-for="col in extractionColumns"
                      :key="'ex-' + col.key"
                      class="table-header-cell whitespace-nowrap"
                      :title="'Extracted variable: ' + col.label"
                    >{{ col.label }}</th>
                    <th
                      v-if="transformerColumns.length > 0"
                      colspan="1"
                      class="table-header-cell border-l border-gray-300 dark:border-gray-600 whitespace-nowrap text-violet-700 dark:text-violet-400"
                    ></th>
                    <th
                      v-for="col in transformerColumns"
                      :key="'tr-' + col.key"
                      class="table-header-cell whitespace-nowrap text-violet-700 dark:text-violet-400"
                      :title="'Transformer output: ' + col.label"
                    >{{ col.label }}</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="conv in conversations" :key="conv.id" class="table-row">
                    <td class="table-cell-muted whitespace-nowrap">{{ testerMap[conv.testerId] ?? conv.testerId }}</td>
                    <td class="table-cell whitespace-nowrap">
                      <span :class="convLifecycleStatusBadgeClass(conv.status)">{{ convLifecycleStatusLabel(conv.status) }}</span>
                    </td>
                    <td
                      v-for="col in extractionColumns"
                      :key="'ex-' + col.key"
                      class="table-cell font-mono text-xs max-w-48 truncate"
                      :title="cellValue(conv, col)"
                    >{{ cellValue(conv, col) || '—' }}</td>
                    <td v-if="transformerColumns.length > 0" class="table-cell border-l border-gray-200 dark:border-gray-700"></td>
                    <td
                      v-for="col in transformerColumns"
                      :key="'tr-' + col.key"
                      class="table-cell font-mono text-xs max-w-48 truncate"
                      :title="cellValue(conv, col)"
                    >{{ cellValue(conv, col) || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TabContent>

      <!-- Pass / Fail Tab -->
      <TabContent v-model="activeTab" tab="pass-fail">
        <div class="px-2">
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Pass / Fail</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Checks for fields where an expected value is defined
            </p>
          </div>

          <div v-if="checkedFields.length === 0" class="empty-state">
            <p class="empty-state-title">No expected values defined</p>
            <p class="empty-state-description">Define expected values in the scenario's extraction or post-processing configuration to enable pass/fail checking.</p>
          </div>

          <div v-else-if="conversations.length === 0" class="empty-state">
            <p class="empty-state-title">No conversations yet</p>
          </div>

          <div v-else>
            <!-- Summary bar -->
            <div v-if="passStats" class="flex items-center gap-4 mb-6 p-4 rounded-lg border" :class="passStats.pct >= 100 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' : passStats.pct === 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'">
              <div class="text-3xl font-bold" :class="passStats.pct >= 100 ? 'text-green-600 dark:text-green-400' : passStats.pct === 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'">
                {{ passStats.pct }}%
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <div class="font-medium text-gray-800 dark:text-gray-200">{{ passStats.passed }} / {{ passStats.total }} checks passed</div>
                <div>{{ conversations.length }} conversations × {{ checkedFields.length }} checked fields</div>
              </div>
            </div>

            <!-- Per-conversation breakdown -->
            <div class="table-container">
              <div class="table-wrapper overflow-x-auto">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell whitespace-nowrap">Tester</th>
                      <th class="table-header-cell whitespace-nowrap">Status</th>
                      <th
                        v-for="field in checkedFields"
                        :key="field.label"
                        class="table-header-cell whitespace-nowrap text-center"
                        :title="'Expected: ' + JSON.stringify(field.expected)"
                      >{{ field.label }}</th>
                      <th class="table-header-cell text-center whitespace-nowrap">Result</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-for="conv in conversations" :key="conv.id" class="table-row">
                      <td class="table-cell-muted whitespace-nowrap">{{ testerMap[conv.testerId] ?? conv.testerId }}</td>
                      <td class="table-cell whitespace-nowrap">
                        <template v-if="conv.status === 'queued' || conv.status === 'in_progress'">
                          <Clock class="w-4 h-4 text-gray-400 inline-block" />
                        </template>
                        <span v-else :class="convOverallStatusBadgeClass(convOverallStatus(conv))">{{ convOverallStatus(conv) }}</span>
                      </td>
                      <td
                        v-for="field in checkedFields"
                        :key="field.label"
                        class="table-cell text-center"
                        :title="'Actual: ' + JSON.stringify(actualValue(conv, field)) + ' · Expected: ' + JSON.stringify(field.expected)"
                      >
                        <span v-if="conv.status === 'queued' || conv.status === 'in_progress'">
                          <Clock class="w-4 h-4 text-gray-400 inline-block" />
                        </span>
                        <span v-else-if="isPassing(conv, field)">
                          <CheckCircle2 class="w-5 h-5 text-green-500 dark:text-green-400 inline-block" />
                        </span>
                        <span v-else>
                          <XCircle class="w-5 h-5 text-red-500 dark:text-red-400 inline-block" />
                        </span>
                      </td>
                      <td class="table-cell text-center">
                        <template v-if="conv.status === 'queued' || conv.status === 'in_progress'">
                          <Clock class="w-4 h-4 text-gray-400 inline-block" />
                        </template>
                        <template v-else>
                          <span
                            :class="checkedFields.every(f => isPassing(conv, f)) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                            class="text-xs font-semibold"
                          >
                            {{ checkedFields.filter(f => isPassing(conv, f)).length }}/{{ checkedFields.length }}
                          </span>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </TabContent>

      <!-- Conversations Tab -->
      <TabContent v-model="activeTab" tab="conversations">
        <div class="px-2">
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Conversations</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Conversations generated in this run. Click to open the full transcript.</p>
          </div>

          <div v-if="conversations.length === 0" class="empty-state">
            <p class="empty-state-title">No conversations yet</p>
            <p class="empty-state-description">Conversations will appear here as they are generated.</p>
          </div>

          <div v-else class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">#</th>
                    <th class="table-header-cell">Tester</th>
                    <th class="table-header-cell">Status</th>
                    <th class="table-header-cell">Updated</th>
                    <th class="table-header-cell"></th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr
                    v-for="(conv, idx) in conversations"
                    :key="conv.id"
                    class="table-row"
                    :class="{ 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50': !!conv.conversationId }"
                    @click="openConversation(conv)"
                  >
                    <td class="table-cell-muted w-10">{{ idx + 1 }}</td>
                    <td class="table-cell">{{ testerMap[conv.testerId] ?? conv.testerId }}</td>
                    <td class="table-cell">
                      <span v-if="conv.conversationId" :class="getStatusBadgeClass(conversationStatusMap[conv.conversationId] || '')">{{ formatStatusLabel(conversationStatusMap[conv.conversationId] || '') }}</span>
                      <span v-else :class="convLifecycleStatusBadgeClass(conv.status)">{{ convLifecycleStatusLabel(conv.status) }}</span>
                    </td>
                    <td class="table-cell-muted">
                      <RelativeDate v-if="conv.updatedAt" :date="conv.updatedAt" />
                      <span v-else>—</span>
                    </td>
                    <td class="table-cell text-right">
                      <span v-if="conv.conversationId" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                        View transcript →
                      </span>
                      <span v-else class="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <MinusCircle class="w-3.5 h-3.5" /> No transcript
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TabContent>

    </div>
  </div>
</template>
