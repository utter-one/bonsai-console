<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScenarioRunsStore, useScenariosStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import RunScenariosModal from '@/components/modals/RunScenariosModal.vue'
import { PlayCircle, Plus, XCircle, Trash2, RefreshCw, Eye, AlertTriangle } from 'lucide-vue-next'
import { ScenarioRunStatus } from '@/api/types'
import type { ScenarioRunResponse } from '@/api/types'

const scenarioRunsStore = useScenarioRunsStore()
const scenariosStore = useScenariosStore()
const projectSelectionStore = useProjectSelectionStore()
const router = useRouter()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const scenarioNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const s of scenariosStore.items) {
    map[s.id] = s.name
  }
  return map
})

function scenarioName(id: string): string {
  return scenarioNameMap.value[id] ?? id
}

const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-test-runs')

const pagination = usePagination({
  store: scenarioRunsStore,
  pageSize: 20,
  onPageChange: loadRuns,
})

watch([sortKey, sortOrder], () => {
  loadRuns()
})

watch(projectId, () => {
  pagination.reset()
  loadScenarios()
  loadRuns()
})

onMounted(async () => {
  await Promise.all([loadScenarios(), loadRuns()])
})

async function loadScenarios() {
  try {
    await scenariosStore.fetchAll(projectId.value, { limit: 1000 })
  } catch (error) {
    console.error('Failed to load scenarios:', error)
  }
}

async function loadRuns() {
  try {
    const orderBy = getOrderBy()
    await scenarioRunsStore.fetchAll(
      projectId.value,
      pagination.getParams({
        ...(orderBy ? { orderBy } : {}),
      })
    )
  } catch (error) {
    console.error('Failed to load test runs:', error)
  }
}

function statusBadgeClass(run: ScenarioRunResponse): string {
  switch (run.status) {
    case ScenarioRunStatus.Queued: return 'badge-secondary'
    case ScenarioRunStatus.InProgress: return 'badge-info'
    case ScenarioRunStatus.Passed: return 'badge-success'
    case ScenarioRunStatus.Failed: return 'badge-error'
    case ScenarioRunStatus.Cancelled: return 'badge-warning'
    case ScenarioRunStatus.Error: return 'badge-error'
    default: return 'badge-secondary'
  }
}

function statusLabel(run: ScenarioRunResponse): string {
  switch (run.status) {
    case ScenarioRunStatus.Queued: return 'Queued'
    case ScenarioRunStatus.InProgress: return 'In Progress'
    case ScenarioRunStatus.Passed: return 'Passed'
    case ScenarioRunStatus.Failed: return 'Failed'
    case ScenarioRunStatus.Cancelled: return 'Cancelled'
    case ScenarioRunStatus.Error: return 'Error'
    default: return run.status
  }
}

const showRunModal = ref(false)
const actionLoadingId = ref<string | null>(null)

function passRatePct(run: ScenarioRunResponse): number {
  if (!run.testStatistics) return 0
  const total = run.testStatistics.passedTests + run.testStatistics.failedTests
  if (total === 0) return 0
  return Math.round((run.testStatistics.passedTests / total) * 100)
}

function isTerminal(run: ScenarioRunResponse): boolean {
  return run.status === ScenarioRunStatus.Passed ||
    run.status === ScenarioRunStatus.Failed ||
    run.status === ScenarioRunStatus.Cancelled ||
    run.status === ScenarioRunStatus.Error
}

function canCancel(run: ScenarioRunResponse): boolean {
  return run.status === ScenarioRunStatus.Queued || run.status === ScenarioRunStatus.InProgress
}

async function cancelRun(run: ScenarioRunResponse) {
  actionLoadingId.value = run.id
  try {
    await scenarioRunsStore.cancel(projectId.value, run.id)
  } finally {
    actionLoadingId.value = null
  }
}

async function deleteRun(run: ScenarioRunResponse) {
  if (!confirm(`Delete this test run?\n\nThis action cannot be undone.`)) return
  actionLoadingId.value = run.id
  try {
    await scenarioRunsStore.remove(projectId.value, run.id)
    if (scenarioRunsStore.items.length === 0 && pagination.currentPage.value > 1) {
      pagination.currentPage.value--
    }
    await loadRuns()
  } finally {
    actionLoadingId.value = null
  }
}

function openRun(run: ScenarioRunResponse) {
  router.push({ name: 'testing.testRuns.detail', params: { projectId: projectId.value, runId: run.id } })
}

async function onRunStarted() {
  showRunModal.value = false
  await loadRuns()
}
</script>

<template>
  <div class="container-constrained">
    <!-- Section header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Test Runs</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          View the history of scenario test runs executed against your project.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary flex items-center gap-2" :disabled="scenarioRunsStore.isLoading" @click="loadRuns()">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': scenarioRunsStore.isLoading }" />
          Refresh
        </button>
        <button class="btn-primary flex items-center gap-2" @click="showRunModal = true">
          <Plus class="w-4 h-4" />
          Run Scenarios
        </button>
      </div>
    </div>

    <RunScenariosModal
      v-if="showRunModal"
      :project-id="projectId"
      @close="showRunModal = false"
      @run="onRunStarted"
    />

    <!-- Loading state -->
    <div v-if="scenarioRunsStore.isLoading" class="loading-state">
      Loading test runs...
    </div>

    <!-- Error state -->
    <div v-else-if="scenarioRunsStore.error" class="error-state">
      {{ scenarioRunsStore.error.message }}
    </div>

    <!-- Empty state -->
    <div v-else-if="scenarioRunsStore.items.length === 0" class="empty-state">
      <PlayCircle class="empty-state-icon" />
      <p class="empty-state-title">No test runs found</p>
      <p class="empty-state-description">Test runs will appear here once scenarios have been executed</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Scenario</th>
              <th class="table-header-cell">Testers</th>
              <th class="table-header-cell">Conversations</th>
                <th class="table-header-cell">Pass Rate</th>
              <th class="table-header-cell">Status</th>
              <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell"></th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="run in scenarioRunsStore.items" :key="run.id" class="table-row cursor-pointer" @click="openRun(run)">
              <td class="table-cell">{{ scenarioName(run.scenarioId) }}</td>
              <td class="table-cell-muted">{{ Object.keys(run.testers).length }}</td>
                <td class="table-cell-muted">
                  {{ run.totalConversations }}
                  <AlertTriangle v-if="run.errorCount > 0" class="inline w-4 h-4 text-red-500 dark:text-red-400" :title="`${run.errorCount} conversation(s) errored`" />
                </td>
                <td class="table-cell">
                  <span v-if="run.testStatistics && isTerminal(run)" :class="passRatePct(run) >= 100 ? 'text-green-600 dark:text-green-400' : passRatePct(run) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'" class="font-semibold text-xs">
                    {{ passRatePct(run) }}% ({{ run.testStatistics.passedTests }}/{{ run.testStatistics.passedTests + run.testStatistics.failedTests }})
                  </span>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="table-cell">
                <span :class="statusBadgeClass(run)" :title="run.statusDetails || undefined">{{ statusLabel(run) }}</span>
              </td>
              <td class="table-cell-muted">
                <RelativeDate :date="run.createdAt" />
              </td>
              <td class="table-cell">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="btn-icon-action"
                    title="View run"
                    @click.stop="openRun(run)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canCancel(run)"
                    type="button"
                    class="btn-icon-action hover:text-yellow-500 dark:hover:text-yellow-400"
                    title="Cancel run"
                    :disabled="actionLoadingId === run.id"
                    @click.stop="cancelRun(run)"
                  >
                    <XCircle class="w-4 h-4" />
                  </button>
                  <button
                    v-if="isTerminal(run)"
                    type="button"
                    class="btn-icon-action-danger"
                    title="Delete run"
                    :disabled="actionLoadingId === run.id"
                    @click.stop="deleteRun(run)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls
        :pagination="pagination"
        :displayed-count="scenarioRunsStore.items.length"
        resource-name="test runs"
      />
    </div>
  </div>
</template>
