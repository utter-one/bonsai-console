<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import {
  formatHealthCheckName,
  isProviderCheck,
  healthStatusClass,
  worstNonUnknownStatus,
  windowCountsLabel,
  PROVIDER_TYPE_LABELS,
  PROVIDER_TYPE_ORDER,
} from '@/utils/monitoring'
import type { StatusCheck, StatusProvider, StatusWindow } from '@/api/types'
import RelativeDate from '@/components/RelativeDate.vue'
import HealthCheckDetail from '@/components/HealthCheckDetail.vue'
import StatusMiniBar from '@/components/StatusMiniBar.vue'
import StatusWindowModal from '@/components/modals/StatusWindowModal.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { usePagination } from '@/composables'
import { Activity, RefreshCw } from 'lucide-vue-next'

const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

// providerNameMap is only needed for the Check History table (history rows carry
// raw check names without the display labels the status endpoint provides).
const providerNameMap = computed(() => {
  const map: Record<string, string> = {}
  providersStore.items.forEach((p) => (map[p.id] = p.name))
  return map
})

// --- Status page (GET /api/monitoring/status) ---
const windowMinutes = ref(60)

const WINDOW_OPTIONS = [
  { value: 15, label: 'Last 15 minutes' },
  { value: 60, label: 'Last hour' },
  { value: 240, label: 'Last 4 hours' },
  { value: 1440, label: 'Last 24 hours' },
]

// Bar segments: one per time slice of the selected window
// (3 min / 5 min / 15 min / 1 h per segment)
const SEGMENTS_BY_WINDOW: Record<number, number> = { 15: 5, 60: 12, 240: 16, 1440: 24 }
const segmentCount = computed(() => SEGMENTS_BY_WINDOW[windowMinutes.value] ?? 12)

async function loadStatus() {
  try {
    await monitoringStore.fetchStatus({ windowMinutes: windowMinutes.value })
  } catch {
    // error surfaced via monitoringStore.statusError
  }
}

const status = computed(() => monitoringStore.status)

const statusChecks = computed(() => status.value?.checks ?? [])
const statusProviders = computed(() => status.value?.providers ?? [])

// Overall badges: "System" = platform checks only (client-side worst),
// "All" = backend global status including provider probes.
const systemOverallStatus = computed(() => worstNonUnknownStatus(statusChecks.value))
const globalOverallStatus = computed(() => status.value?.overall ?? null)

// Checks grouped by the backend's group field (core / service / other)
const GROUP_LABELS: Record<string, string> = {
  core: 'Core',
  service: 'Background services',
  other: 'Other',
}
const checkGroups = computed(() =>
  (['core', 'service', 'other'] as const)
    .map((g) => ({ group: g, label: GROUP_LABELS[g], checks: statusChecks.value.filter((c) => c.group === g) }))
    .filter((g) => g.checks.length > 0),
)

// Providers grouped by type in a fixed order, unknown types fall into "Other"
const providerGroups = computed(() => {
  const groups = PROVIDER_TYPE_ORDER.map((t) => ({
    type: t,
    label: PROVIDER_TYPE_LABELS[t],
    providers: statusProviders.value.filter((p) => p.providerType === t),
  })).filter((g) => g.providers.length > 0)
  const other = statusProviders.value.filter((p) => !PROVIDER_TYPE_ORDER.includes(p.providerType))
  if (other.length > 0) groups.push({ type: 'other', label: 'Other', providers: other })
  return groups
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

// Category chip for Check History rows (history rows carry raw check names)
function checkCategory(name: string): { label: string; badge: string } {
  return isProviderCheck(name)
    ? { label: 'Provider', badge: 'badge-violet' }
    : { label: 'System', badge: 'badge-primary' }
}

// --- Window aggregates popup (opened from a bar segment) ---
interface WindowModalState {
  title: string
  subtitle: string
  currentStatus: string
  latencyMs: number | null
  checkedAt: string | null
  window: StatusWindow
  extraRows?: { label: string; value: string }[]
}
const windowModal = ref<WindowModalState | null>(null)

function openCheckWindow(check: StatusCheck) {
  windowModal.value = {
    title: check.label || check.name,
    subtitle: `${GROUP_LABELS[check.group] ?? check.group} check`,
    currentStatus: check.status,
    latencyMs: check.latencyMs,
    checkedAt: check.checkedAt,
    window: check.window,
    extraRows: [{ label: 'Check name', value: check.name }],
  }
}

function openProviderWindow(provider: StatusProvider) {
  windowModal.value = {
    title: provider.name,
    subtitle: `${PROVIDER_TYPE_LABELS[provider.providerType] ?? provider.providerType} provider`,
    currentStatus: provider.status,
    latencyMs: provider.latencyMs,
    checkedAt: provider.checkedAt,
    window: provider.window,
    extraRows: [
      { label: 'API vendor', value: provider.apiType },
      { label: 'Provider id', value: provider.id },
    ],
  }
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
  loadStatus()
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
          <p class="page-subtitle">Live status and check history</p>
        </div>
        <button @click="loadAll" class="btn-secondary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Refresh
        </button>
      </div>

      <!-- Current status -->
      <div class="section-card mb-6">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <Activity class="text-primary-500" :size="20" />
            <h2 class="section-title">Current Status</h2>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <span
              v-if="systemOverallStatus"
              class="badge capitalize"
              :class="healthStatusClass(systemOverallStatus)"
              title="Platform checks only (core checks and service heartbeats)"
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
            <span v-if="status?.generatedAt" class="text-xs text-gray-500 dark:text-gray-400">
              checked <RelativeDate :date="status.generatedAt" />
            </span>
            <select v-model.number="windowMinutes" @change="loadStatus" class="form-select-auto">
              <option v-for="opt in WINDOW_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div v-if="monitoringStore.statusLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.statusError" class="alert-error">{{ monitoringStore.statusError }}</div>

        <div v-else-if="statusChecks.length === 0 && statusProviders.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No completed health-check cycle yet — the status appears after the first cycle runs.</p>
        </div>

        <template v-else>
          <!-- Checks, grouped by the backend's group field -->
          <div v-for="group in checkGroups" :key="group.group" class="mb-6">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ group.label }}</h3>
              <span
                v-if="worstNonUnknownStatus(group.checks)"
                class="badge capitalize"
                :class="healthStatusClass(worstNonUnknownStatus(group.checks) ?? 'unknown')"
              >
                {{ worstNonUnknownStatus(group.checks) }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                status counts over the last {{ status?.windowMinutes }} minutes
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              <div
                v-for="check in group.checks"
                :key="check.name"
                class="rounded-md border border-gray-100 dark:border-gray-700 px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <span class="badge flex-shrink-0 w-16 justify-center capitalize" :class="healthStatusClass(check.status)">
                    {{ check.status }}
                  </span>
                  <span class="text-xs font-medium flex-1 truncate" :title="check.name">{{ check.label || check.name }}</span>
                  <span v-if="check.latencyMs != null" class="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                    {{ Math.round(check.latencyMs) }} ms
                  </span>
                </div>
                <div class="mt-2 flex flex-col gap-1">
                  <StatusMiniBar :window="check.window" width-class="w-full" :segments="segmentCount" @segment-click="openCheckWindow(check)" />
                  <span class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {{ windowCountsLabel(check.window) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Providers, same card grid as the system checks -->
          <template v-if="providerGroups.length > 0">
            <div v-for="group in providerGroups" :key="group.type" class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ group.label }} providers</h3>
                <span
                  v-if="worstNonUnknownStatus(group.providers)"
                  class="badge capitalize"
                  :class="healthStatusClass(worstNonUnknownStatus(group.providers) ?? 'unknown')"
                >
                  {{ worstNonUnknownStatus(group.providers) }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  status counts over the last {{ status?.windowMinutes }} minutes
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                <div
                  v-for="provider in group.providers"
                  :key="provider.id"
                  class="rounded-md border border-gray-100 dark:border-gray-700 px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <span class="badge flex-shrink-0 w-16 justify-center capitalize" :class="healthStatusClass(provider.status)">
                      {{ provider.status }}
                    </span>
                    <span class="text-xs font-medium flex-1 truncate" :title="`${provider.name} · ${provider.apiType}`">{{ provider.name }}</span>
                    <span v-if="provider.latencyMs != null" class="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                      {{ Math.round(provider.latencyMs) }} ms
                    </span>
                  </div>
                  <div class="mt-2 flex flex-col gap-1">
                    <StatusMiniBar :window="provider.window" width-class="w-full" :segments="segmentCount" @segment-click="openProviderWindow(provider)" />
                    <span class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {{ windowCountsLabel(provider.window) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
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
                        <span class="badge capitalize" :class="healthStatusClass(row.status)">{{ row.status }}</span>
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

      <StatusWindowModal
        v-if="windowModal"
        v-bind="windowModal"
        :window-minutes="windowMinutes"
        @close="windowModal = null"
      />
    </div>
  </div>
</template>
