<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMonitoringStore } from '@/stores'
import type { AlertEvent } from '@/stores/monitoring'
import RelativeDate from '@/components/RelativeDate.vue'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import FloatingDropdown from '@/components/FloatingDropdown.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { usePagination, useSearch } from '@/composables'
import { ruleLabel, severityBadgeClass, alertStatusBadgeClass, SEVERITY_OPTIONS, ALERT_STATUS_OPTIONS, RULE_CATALOG, isKnownRule } from '@/utils/monitoringRules'
import { RefreshCw, ChevronDown, BellRing, Check, Loader2, Search } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const monitoringStore = useMonitoringStore()

// --- Filters (status/severity can be pre-selected via route query, e.g. the dashboard badge) ---
const dateTimeRange = ref<DateTimeRange>(null)
const severityFilter = ref('')
const statusFilter = ref('')
const ruleFilter = ref('')

function queryParam(name: string): string {
  const raw = route.query[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : ''
}

const VALID_SEVERITIES = ['info', 'warning', 'critical']
const VALID_STATUSES = ['firing', 'resolved']

if (VALID_SEVERITIES.includes(queryParam('severity'))) severityFilter.value = queryParam('severity')
if (VALID_STATUSES.includes(queryParam('status'))) statusFilter.value = queryParam('status')
if (queryParam('rule')) ruleFilter.value = queryParam('rule')
const { searchQuery, textSearchQuery } = useSearch(() => monitoringStore.alerts, 400)

// --- Pagination ---
const pagination = usePagination({
  store: { pagination: monitoringStore.alertsPagination },
  pageSize: 50,
  onPageChange: () => load(),
})

async function load() {
  try {
    await monitoringStore.fetchAlerts({
      severity: (severityFilter.value || undefined) as 'info' | 'warning' | 'critical' | undefined,
      status: (statusFilter.value || undefined) as 'firing' | 'resolved' | undefined,
      ruleId: ruleFilter.value || undefined,
      firedFrom: dateTimeRange.value?.value[0],
      firedTo: dateTimeRange.value?.value[1],
      textSearch: textSearchQuery.value || undefined,
      offset: pagination.offset.value,
      limit: pagination.pageSize.value,
    })
  } catch {
    // error surfaced via monitoringStore.alertsError
  }
}

function resetFilters() {
  dateTimeRange.value = null
  severityFilter.value = ''
  statusFilter.value = ''
  ruleFilter.value = ''
  searchQuery.value = ''
  pagination.reset()
}

const hasFilters = computed(
  () => !!(dateTimeRange.value || severityFilter.value || statusFilter.value || ruleFilter.value || searchQuery.value)
)

// Re-load when the debounced text search changes
watch(textSearchQuery, () => pagination.reset())

// --- Acknowledge ---
const ackingId = ref<string | null>(null)

async function acknowledge(alert: AlertEvent) {
  if (ackingId.value) return
  ackingId.value = alert.id
  try {
    await monitoringStore.acknowledgeAlert(alert.id)
  } catch {
    // error surfaced via monitoringStore.ackError
  } finally {
    ackingId.value = null
  }
}

function openDetail(alertId: string) {
  router.push({ name: 'system.alertDetail', params: { alertId } })
}

onMounted(load)
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Alerts</h1>
          <p class="page-subtitle">Alert events from the platform alert engine, newest first</p>
        </div>
        <button @click="pagination.reset()" class="btn-secondary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Refresh
        </button>
      </div>

      <ErrorDisplay :error="monitoringStore.ackError" class="mb-4" />

      <!-- Filter Bar -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" @update:model-value="pagination.reset()" />

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ SEVERITY_OPTIONS.find((o) => o.value === severityFilter)?.label ?? 'All severities' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button
              v-for="option in SEVERITY_OPTIONS"
              :key="option.value"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': severityFilter === option.value }"
              @click="severityFilter = option.value; pagination.reset(); close()"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ ALERT_STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All statuses' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button
              v-for="option in ALERT_STATUS_OPTIONS"
              :key="option.value"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': statusFilter === option.value }"
              @click="statusFilter = option.value; pagination.reset(); close()"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ ruleFilter ? ruleLabel(ruleFilter) : 'All rules' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': ruleFilter === '' }"
              @click="ruleFilter = ''; pagination.reset(); close()"
            >
              All rules
            </button>
            <button
              v-for="rule in RULE_CATALOG"
              :key="rule.id"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': ruleFilter === rule.id }"
              @click="ruleFilter = rule.id; pagination.reset(); close()"
            >
              {{ rule.label }}
            </button>
          </template>
        </FloatingDropdown>

        <div class="relative min-w-[220px] flex-1 max-w-sm">
          <Search class="input-icon-left" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search message, scope, rule…"
          />
        </div>

        <button v-if="hasFilters" class="btn-link" @click="resetFilters">
          Clear filters
        </button>
      </div>

      <!-- Results -->
      <div class="section-card">
        <div v-if="monitoringStore.alertsLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.alertsError" class="alert-error">{{ monitoringStore.alertsError }}</div>

        <div v-else-if="monitoringStore.alerts.length === 0" class="empty-state py-8">
          <div class="flex flex-col items-center gap-2">
            <BellRing class="w-8 h-8 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <template v-if="hasFilters">No alert events match this filter.</template>
              <template v-else>No alert events recorded yet — the engine evaluates rules on its interval.</template>
            </p>
          </div>
        </div>

        <template v-else>
          <div class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Fired</th>
                    <th class="table-header-cell">Severity</th>
                    <th class="table-header-cell">Message</th>
                    <th class="table-header-cell">Rule</th>
                    <th class="table-header-cell">Status</th>
                    <th class="table-header-cell">Ack</th>
                    <th class="table-header-cell"></th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr
                    v-for="alert in monitoringStore.alerts"
                    :key="alert.id"
                    class="table-row cursor-pointer"
                    @click="openDetail(alert.id)"
                  >
                    <td class="table-cell whitespace-nowrap"><RelativeDate :date="alert.firedAt" /></td>
                    <td class="table-cell">
                      <span class="badge capitalize" :class="severityBadgeClass(alert.severity)">{{ alert.severity }}</span>
                    </td>
                    <td class="table-cell">
                      <div class="text-sm font-medium truncate max-w-[320px]" :title="alert.message">{{ alert.message }}</div>
                      <div class="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[320px]" :title="alert.scopeKey">
                        {{ alert.scopeKey }}
                      </div>
                    </td>
                    <td class="table-cell">
                      <span :title="alert.ruleId">{{ ruleLabel(alert.ruleId) }}</span>
                      <span v-if="!isKnownRule(alert.ruleId)" class="text-xs text-gray-400 dark:text-gray-500 ml-1" :title="`Unknown rule id: ${alert.ruleId}`">
                        ({{ alert.ruleId }})
                      </span>
                    </td>
                    <td class="table-cell">
                      <span class="badge capitalize" :class="alertStatusBadgeClass(alert.status)">{{ alert.status }}</span>
                    </td>
                    <td class="table-cell whitespace-nowrap">
                      <template v-if="alert.ackedAt">
                        <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" :title="`Acknowledged by ${alert.ackedBy ?? 'unknown'} `">
                          <Check class="w-3.5 h-3.5 text-green-500" />
                          <RelativeDate :date="alert.ackedAt" />
                        </span>
                      </template>
                      <button
                        v-else
                        class="btn-sm btn-secondary"
                        :disabled="ackingId === alert.id"
                        @click.stop="acknowledge(alert)"
                      >
                        <Loader2 v-if="ackingId === alert.id" class="inline-block mr-1 w-3.5 h-3.5 animate-spin" />
                        <Check v-else class="inline-block mr-1 w-3.5 h-3.5" />
                        Ack
                      </button>
                    </td>
                    <td class="table-cell-right">
                      <button class="btn-link" @click.stop="openDetail(alert.id)">View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <PaginationControls
            :pagination="pagination"
            :displayed-count="monitoringStore.alerts.length"
            resource-name="alert events"
          />
        </template>
      </div>
    </div>
  </div>
</template>
