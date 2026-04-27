<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useScenarioRunsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { PlayCircle } from 'lucide-vue-next'
import { ScenarioRunStatus } from '@/api/types'
import type { ScenarioRunResponse } from '@/api/types'

const scenarioRunsStore = useScenarioRunsStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

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
  loadRuns()
})

onMounted(async () => {
  await loadRuns()
})

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
    default: return 'badge-secondary'
  }
}

function statusLabel(run: ScenarioRunResponse): string {
  switch (run.status) {
    case ScenarioRunStatus.Queued: return 'Queued'
    case ScenarioRunStatus.InProgress: return 'In Progress'
    case ScenarioRunStatus.Passed: return 'Passed'
    case ScenarioRunStatus.Failed: return 'Failed'
    default: return run.status
  }
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
    </div>

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
              <th class="table-header-cell">Status</th>
              <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="run in scenarioRunsStore.items" :key="run.id" class="table-row">
              <td class="table-cell font-mono text-xs">{{ run.scenarioId }}</td>
              <td class="table-cell-muted">{{ run.testerIds.length }}</td>
              <td class="table-cell-muted">{{ run.totalConversations }}</td>
              <td class="table-cell">
                <span :class="statusBadgeClass(run)">{{ statusLabel(run) }}</span>
              </td>
              <td class="table-cell-muted">
                <RelativeDate :date="run.createdAt" />
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
