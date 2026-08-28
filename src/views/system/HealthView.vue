<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import { formatHealthCheckName, isProviderCheck } from '@/utils/monitoring'
import RelativeDate from '@/components/RelativeDate.vue'
import HealthCheckDetail from '@/components/HealthCheckDetail.vue'
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

function checkCategory(name: string): { label: string; badge: string } {
  return isProviderCheck(name)
    ? { label: 'Provider', badge: 'badge-violet' }
    : { label: 'System', badge: 'badge-primary' }
}

// Overall snapshot status — computed by the backend (worst non-unknown check status;
// unknown checks are ignored, so a healthy system with not-yet-known checks still reports ok)
const overallStatus = computed(() => monitoringStore.health?.overall ?? null)

// Snapshot split: system (platform) checks render as cards, provider probes as rows
const systemChecks = computed(() =>
  (monitoringStore.health?.checks ?? []).filter((c) => !isProviderCheck(c.name)),
)
const providerChecks = computed(() =>
  (monitoringStore.health?.checks ?? []).filter((c) => isProviderCheck(c.name)),
)

// Worst non-unknown status within a group (mirrors the backend `overall` semantics)
function groupStatus(checks: { status: string }[]): string | null {
  if (checks.length === 0) return null
  const known = checks.filter((c) => c.status !== 'unknown')
  if (known.length === 0) return 'unknown'
  if (known.some((c) => c.status === 'down')) return 'down'
  if (known.some((c) => c.status === 'degraded')) return 'degraded'
  return 'ok'
}
const systemStatus = computed(() => groupStatus(systemChecks.value))
const providerStatus = computed(() => groupStatus(providerChecks.value))

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

        <div v-else-if="systemChecks.length === 0 && providerChecks.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No checks reported in the last cycle.</p>
        </div>

        <template v-else>
          <!-- System checks — card grid (matches the Dashboard) -->
          <div class="mb-6">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">System</h3>
              <span
                v-if="systemStatus"
                class="badge capitalize"
                :class="statusBadge(systemStatus)"
              >
                {{ systemStatus }}
              </span>
            </div>
            <div v-if="systemChecks.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              No system checks reported.
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              <div v-for="check in systemChecks" :key="check.name">
                <div
                  class="flex items-center gap-2 rounded-md border border-gray-100 dark:border-gray-700 px-3 py-2"
                  :class="{ 'cursor-pointer': formatDetail(check.detail) }"
                  @click="formatDetail(check.detail) ? toggleDetail(`snap-${check.name}`) : undefined"
                >
                  <span class="badge flex-shrink-0 w-16 justify-center capitalize" :class="statusBadge(check.status)">
                    {{ check.status }}
                  </span>
                  <span class="text-xs font-medium flex-1 truncate" :title="check.name">{{ formatHealthCheckName(check.name, providerNameMap) }}</span>
                  <span v-if="check.latencyMs != null" class="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                    {{ Math.round(check.latencyMs) }} ms
                  </span>
                  <span
                    v-if="formatDetail(check.detail)"
                    class="text-gray-400 dark:text-gray-500 flex-shrink-0"
                  >
                    <ChevronRight v-if="expandedCheck !== `snap-${check.name}`" :size="14" />
                    <ChevronDown v-else :size="14" />
                  </span>
                </div>
                <div
                  v-if="expandedCheck === `snap-${check.name}`"
                  class="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md p-3"
                >
                  <HealthCheckDetail :detail="check.detail" />
                </div>
              </div>
            </div>
          </div>

          <!-- Provider probes -->
          <div v-if="providerChecks.length > 0">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Providers</h3>
              <span
                v-if="providerStatus"
                class="badge capitalize"
                :class="statusBadge(providerStatus)"
              >
                {{ providerStatus }}
              </span>
            </div>
            <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
              <div
                v-for="check in providerChecks"
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
                <div
                  v-if="expandedCheck === `snap-${check.name}`"
                  class="mt-2 mb-1 bg-gray-50 dark:bg-gray-900 rounded-md p-3"
                >
                  <HealthCheckDetail :detail="check.detail" />
                </div>
              </div>
            </div>
          </div>
        </template>
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
                      <td class="table-cell truncate max-w-xs" :title="row.checkName">
                        <span class="badge flex-shrink-0 mr-1 align-middle" :class="checkCategory(row.checkName).badge">{{ checkCategory(row.checkName).label }}</span>
                        {{ formatHealthCheckName(row.checkName, providerNameMap) }}
                      </td>
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
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                          <HealthCheckDetail :detail="row.detail" />
                        </div>
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
