<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import { formatHealthCheckName } from '@/utils/monitoring'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { usePagination } from '@/composables'
import { Activity, RefreshCw, ChevronDown, ChevronRight } from 'lucide-vue-next'

const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

const providerNameMap = computed(() => {
  const map: Record<string, string> = {}
  providersStore.items.forEach((p) => (map[p.id] = p.name))
  return map
})

const STATUS_BADGE: Record<string, string> = {
  ok: 'badge-success',
  degraded: 'badge-warning',
  down: 'badge-danger',
  unknown: 'badge-secondary',
}

function statusBadge(status: string): string {
  return STATUS_BADGE[status] ?? 'badge-secondary'
}

// Overall snapshot status — worst check wins
const overallStatus = computed(() => {
  const checks = monitoringStore.health?.checks ?? []
  if (checks.length === 0) return null
  if (checks.some((c) => c.status === 'down')) return 'down'
  if (checks.some((c) => c.status === 'degraded')) return 'degraded'
  if (checks.every((c) => c.status === 'ok')) return 'ok'
  return 'unknown'
})

// --- Detail expansion (snapshot + history) ---
const expandedCheck = ref<string | null>(null)
function toggleDetail(key: string) {
  expandedCheck.value = expandedCheck.value === key ? null : key
}
function formatDetail(detail: Record<string, unknown> | null | undefined): string {
  if (!detail || Object.keys(detail).length === 0) return ''
  return JSON.stringify(detail, null, 2)
}
function formatLatency(ms: number | null | undefined): string {
  return ms == null ? '—' : `${Math.round(ms)} ms`
}

// --- History pagination ---
const historyPagination = usePagination({
  store: { pagination: monitoringStore.healthHistoryPagination },
  pageSize: 50,
  onPageChange: () => loadHistory(),
})
const historyStatusFilter = ref('')

async function loadHistory() {
  try {
    await monitoringStore.fetchHealthHistory({
      limit: historyPagination.pageSize.value,
      offset: historyPagination.offset.value,
      status: historyStatusFilter.value || undefined,
    })
  } catch {
    // error surfaced via monitoringStore.healthHistoryError
  }
}

function loadAll() {
  monitoringStore.fetchHealth().catch(() => {})
  providersStore.fetchAll().catch(() => {})
  historyPagination.reset()
}

onMounted(loadAll)
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">System Health</h1>
          <p class="page-subtitle">Live health-check snapshot and history</p>
        </div>
        <button @click="loadAll" class="btn-secondary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Refresh
        </button>
      </div>

      <!-- Current snapshot -->
      <div class="section-card mb-6">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <Activity class="text-primary-500" :size="20" />
            <h2 class="section-title">Current Snapshot</h2>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="overallStatus"
              class="badge capitalize"
              :class="statusBadge(overallStatus)"
            >
              {{ overallStatus }}
            </span>
            <span v-if="monitoringStore.health?.checkedAt" class="text-xs text-gray-500 dark:text-gray-400">
              checked <RelativeDate :date="monitoringStore.health.checkedAt" />
            </span>
          </div>
        </div>

        <div v-if="monitoringStore.healthLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.healthError" class="alert-error">{{ monitoringStore.healthError }}</div>

        <div v-else-if="!monitoringStore.health?.checkedAt" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No completed health-check cycle yet — the snapshot appears after the first cycle runs.</p>
        </div>

        <div v-else class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
          <div
            v-for="check in monitoringStore.health.checks"
            :key="check.name"
            class="py-3"
          >
            <div
              class="flex items-center gap-3 cursor-pointer"
              @click="formatDetail(check.detail) ? toggleDetail(`snap-${check.name}`) : undefined"
            >
              <span
                v-if="formatDetail(check.detail)"
                class="text-gray-400 dark:text-gray-500"
              >
                <ChevronRight v-if="expandedCheck !== `snap-${check.name}`" :size="14" />
                <ChevronDown v-else :size="14" />
              </span>
              <span class="badge flex-shrink-0 w-20 justify-center capitalize" :class="statusBadge(check.status)">
                {{ check.status }}
              </span>
              <span class="text-sm font-medium flex-1 truncate" :title="check.name">{{ formatHealthCheckName(check.name, providerNameMap) }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 tabular-nums">
                {{ formatLatency(check.latencyMs) }}
              </span>
            </div>
            <pre
              v-if="expandedCheck === `snap-${check.name}`"
              class="mt-2 mb-1 text-xs bg-gray-50 dark:bg-gray-900 rounded-md p-3 overflow-x-auto text-gray-700 dark:text-gray-300"
            >{{ formatDetail(check.detail) }}</pre>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="section-card">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <Activity class="text-primary-500" :size="20" />
            <h2 class="section-title">Check History</h2>
          </div>
          <select v-model="historyStatusFilter" @change="historyPagination.reset()" class="form-select-auto">
            <option value="">All statuses</option>
            <option value="ok">OK</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div v-if="monitoringStore.healthHistoryLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.healthHistoryError" class="alert-error">{{ monitoringStore.healthHistoryError }}</div>

        <div v-else-if="monitoringStore.healthHistory.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No health-check rows recorded yet.</p>
        </div>

        <template v-else>
          <div class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Checked</th>
                    <th class="table-header-cell">Check</th>
                    <th class="table-header-cell">Status</th>
                    <th class="table-header-cell table-cell-right">Latency</th>
                    <th class="table-header-cell">Detail</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <template v-for="row in monitoringStore.healthHistory" :key="row.id">
                    <tr class="table-row">
                      <td class="table-cell whitespace-nowrap"><RelativeDate :date="row.createdAt" /></td>
                      <td class="table-cell truncate max-w-xs" :title="row.checkName">{{ formatHealthCheckName(row.checkName, providerNameMap) }}</td>
                      <td class="table-cell">
                        <span class="badge capitalize" :class="statusBadge(row.status)">{{ row.status }}</span>
                      </td>
                      <td class="table-cell-right tabular-nums">{{ formatLatency(row.latencyMs) }}</td>
                      <td class="table-cell">
                        <button
                          v-if="formatDetail(row.detail)"
                          class="btn-link"
                          @click="toggleDetail(row.id)"
                        >
                          {{ expandedCheck === row.id ? 'Hide' : 'Show' }}
                        </button>
                        <span v-else class="text-gray-400 dark:text-gray-500 text-xs">—</span>
                      </td>
                    </tr>
                    <tr v-if="expandedCheck === row.id">
                      <td class="table-cell" colspan="5">
                        <pre class="text-xs bg-gray-50 dark:bg-gray-900 rounded-md p-3 overflow-x-auto text-gray-700 dark:text-gray-300">{{ formatDetail(row.detail) }}</pre>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
          <PaginationControls
            :pagination="historyPagination"
            :displayed-count="monitoringStore.healthHistory.length"
            resource-name="health checks"
          />
        </template>
      </div>
    </div>
  </div>
</template>
