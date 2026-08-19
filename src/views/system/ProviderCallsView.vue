<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import type { ProviderCallResponse } from '@/api/types'
import RelativeDate from '@/components/RelativeDate.vue'
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue'
import type { DateTimeRange } from '@/components/DateTimeRangePicker.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import FloatingDropdown from '@/components/FloatingDropdown.vue'
import { usePagination } from '@/composables'
import { useRouter, useRoute } from 'vue-router'
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

const ERROR_CODES = ['auth', 'rate_limited', 'timeout', 'server_error', 'client_error', 'network', 'unknown']

// --- Filters ---
const dateTimeRange = ref<DateTimeRange>(null)

// Pre-selected provider from the route query (linked from a provider's Health tab)
function queryProviderId(): string {
  const raw = route.query.providerId
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : ''
}
const providerFilter = ref(queryProviderId())
const statusFilter = ref<'' | 'ok' | 'error'>('')
const errorCodeFilter = ref('')

const providerOptions = computed(() =>
  providersStore.items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
)
const providerNameMap = computed(() => {
  const map: Record<string, string> = {}
  providersStore.items.forEach((p) => (map[p.id] = p.name))
  return map
})

// --- Pagination ---
const pagination = usePagination({
  store: { pagination: monitoringStore.providerCallsPagination },
  pageSize: 100,
  onPageChange: () => load(),
})

async function load() {
  try {
    await monitoringStore.fetchProviderCalls({
      providerId: providerFilter.value || undefined,
      ok: statusFilter.value === 'ok' ? true : statusFilter.value === 'error' ? false : undefined,
      errorCode: errorCodeFilter.value || undefined,
      from: dateTimeRange.value?.value[0] ?? undefined,
      to: dateTimeRange.value?.value[1] ?? undefined,
      offset: pagination.offset.value,
      limit: pagination.pageSize.value,
    })
  } catch {
    // error surfaced via monitoringStore.providerCallsError
  }
}

function resetFilters() {
  dateTimeRange.value = null
  providerFilter.value = ''
  statusFilter.value = ''
  errorCodeFilter.value = ''
  pagination.reset()
}

// Keep the filter in sync when the query changes (e.g. back/forward navigation)
watch(() => route.query.providerId, (raw, prev) => {
  const value = Array.isArray(raw) ? raw[0] : raw
  const next = typeof value === 'string' ? value : ''
  const prevValue = Array.isArray(prev) ? prev[0] : prev
  const prevNext = typeof prevValue === 'string' ? prevValue : ''
  if (next !== prevNext) {
    providerFilter.value = next
    pagination.reset()
  }
})

// --- Row expansion (metrics bag) ---
const expandedCallId = ref<string | null>(null)
function toggleCall(id: string) {
  expandedCallId.value = expandedCallId.value === id ? null : id
}

function metricEntries(call: ProviderCallResponse): [string, unknown][] {
  const entries = Object.entries(call.metrics ?? {})
  return entries.filter(([, v]) => v !== null && v !== undefined && v !== '')
}

function formatErrorCode(code: string): string {
  return code
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function openConversation(conversationId: string) {
  router.push({ name: 'monitor.conversation', params: { conversationId } })
}

onMounted(async () => {
  try {
    await providersStore.fetchAll()
  } catch {
    // non-fatal — provider name lookup degrades to raw ids
  }
  load()
})
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Provider Calls</h1>
          <p class="page-subtitle">Raw third-party call logs with per-call streaming metrics</p>
        </div>
        <button @click="pagination.reset()" class="btn-secondary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Refresh
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <DateTimeRangePicker v-model="dateTimeRange" placeholder="All time" @update:model-value="pagination.reset()" />

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ providerOptions.find((p) => p.id === providerFilter)?.name ?? 'All providers' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button class="filter-dropdown-item" :class="{ 'filter-dropdown-item-active': providerFilter === '' }" @click="providerFilter = ''; pagination.reset(); close()">
              All providers
            </button>
            <button
              v-for="provider in providerOptions"
              :key="provider.id"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': providerFilter === provider.id }"
              @click="providerFilter = provider.id; pagination.reset(); close()"
            >
              {{ provider.name }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ statusFilter === '' ? 'All statuses' : statusFilter === 'ok' ? 'OK' : 'Errors' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button v-for="option in [
              { value: '', label: 'All statuses' },
              { value: 'ok', label: 'OK' },
              { value: 'error', label: 'Errors' },
            ]" :key="option.value"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': statusFilter === option.value }"
              @click="statusFilter = option.value as any; pagination.reset(); close()"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ errorCodeFilter ? `Error: ${errorCodeFilter}` : 'All error codes' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button class="filter-dropdown-item" :class="{ 'filter-dropdown-item-active': errorCodeFilter === '' }" @click="errorCodeFilter = ''; pagination.reset(); close()">
              All error codes
            </button>
            <button
              v-for="code in ERROR_CODES"
              :key="code"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': errorCodeFilter === code }"
              @click="errorCodeFilter = code; pagination.reset(); close()"
            >
              {{ code }}
            </button>
          </template>
        </FloatingDropdown>

        <button v-if="dateTimeRange || providerFilter || statusFilter || errorCodeFilter" class="btn-link" @click="resetFilters">
          Clear filters
        </button>
      </div>

      <!-- Results -->
      <div class="section-card">
        <div v-if="monitoringStore.providerCallsLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.providerCallsError" class="alert-error">{{ monitoringStore.providerCallsError }}</div>

        <div v-else-if="monitoringStore.providerCalls.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No provider calls recorded for this filter.</p>
        </div>

        <template v-else>
          <div class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell w-8"></th>
                    <th class="table-header-cell">Time</th>
                    <th class="table-header-cell">Provider</th>
                    <th class="table-header-cell">Operation</th>
                    <th class="table-header-cell">Model</th>
                    <th class="table-header-cell">Status</th>
                    <th class="table-header-cell table-cell-right">HTTP</th>
                    <th class="table-header-cell table-cell-right">Duration</th>
                    <th class="table-header-cell">Error</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <template v-for="call in monitoringStore.providerCalls" :key="call.id">
                    <tr class="table-row cursor-pointer" @click="metricEntries(call).length ? toggleCall(call.id) : undefined">
                      <td class="table-cell">
                        <ChevronRight v-if="expandedCallId !== call.id && metricEntries(call).length" :size="14" class="text-gray-400" />
                        <ChevronDown v-else-if="expandedCallId === call.id" :size="14" class="text-gray-400" />
                      </td>
                      <td class="table-cell whitespace-nowrap"><RelativeDate :date="call.createdAt" /></td>
                      <td class="table-cell">
                        <div class="text-sm font-medium truncate max-w-[180px]">
                          {{ providerNameMap[call.providerId] ?? call.providerId }}
                        </div>
                        <div class="text-xs text-gray-400 dark:text-gray-500">{{ call.providerType }} · {{ call.apiType }}</div>
                      </td>
                      <td class="table-cell-mono text-xs">{{ call.operation }}</td>
                      <td class="table-cell-mono text-xs">
                        <span v-if="call.model" :title="call.model" class="block max-w-[160px] truncate">{{ call.model }}</span>
                        <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                      </td>
                      <td class="table-cell">
                        <span v-if="call.ok" class="badge badge-success">Ok</span>
                        <span v-else class="badge badge-danger">{{ formatErrorCode(call.errorCode ?? 'error') }}</span>
                        <span
                          v-if="call.fallbackProviderId"
                          class="badge badge-warning ml-1"
                          :title="`Ran on fallback provider ${call.fallbackProviderId}`"
                        >
                          Fallback
                        </span>
                      </td>
                      <td class="table-cell-right tabular-nums text-xs">
                        {{ call.statusHttp ?? '—' }}
                      </td>
                      <td class="table-cell-right tabular-nums text-xs">{{ call.durationMs }} ms</td>
                      <td class="table-cell">
                        <span v-if="call.errorText" class="text-xs text-red-600 dark:text-red-400 block max-w-[220px] truncate" :title="call.errorText">
                          {{ call.errorText }}
                        </span>
                        <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
                      </td>
                    </tr>
                    <tr v-if="expandedCallId === call.id">
                      <td class="table-cell" colspan="9">
                        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Details</h4>
                            <dl class="text-xs space-y-1">
                              <div class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Call ID</dt>
                                <dd class="font-mono">{{ call.id }}</dd>
                              </div>
                              <div class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Provider ID</dt>
                                <dd class="font-mono truncate">{{ call.providerId }}</dd>
                              </div>
                              <div v-if="call.fallbackProviderId" class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Fallback</dt>
                                <dd class="font-mono truncate">{{ call.fallbackProviderId }}</dd>
                              </div>
                              <div v-if="call.projectId" class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Project</dt>
                                <dd class="font-mono truncate">{{ call.projectId }}</dd>
                              </div>
                              <div v-if="call.conversationId" class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Conversation</dt>
                                <dd>
                                  <button class="btn-link font-mono text-xs inline-flex items-center gap-1" @click.stop="openConversation(call.conversationId!)">
                                    <ChevronRight :size="12" /> {{ call.conversationId }}
                                  </button>
                                </dd>
                              </div>
                              <div v-if="call.errorText" class="flex gap-2">
                                <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Error</dt>
                                <dd class="text-red-600 dark:text-red-400 break-all">{{ call.errorText }}</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Streaming metrics</h4>
                            <template v-if="metricEntries(call).length">
                              <table class="w-full text-xs">
                                <tbody>
                                  <tr v-for="[key, value] in metricEntries(call)" :key="key" class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <td class="py-1 pr-3 font-mono text-gray-500 dark:text-gray-400">{{ key }}</td>
                                    <td class="py-1 text-right font-mono">{{ formatMetricValue(value) }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </template>
                            <span v-else class="text-xs text-gray-400 dark:text-gray-500">No streaming metrics recorded for this call.</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
          <PaginationControls
            :pagination="pagination"
            :displayed-count="monitoringStore.providerCalls.length"
            resource-name="provider calls"
          />
        </template>
      </div>
    </div>
  </div>
</template>
