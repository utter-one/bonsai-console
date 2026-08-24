<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
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

// Pre-selected failed provider from the route query (linked from a provider's Health tab)
function queryParam(name: string): string {
  const raw = route.query[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : ''
}
const providerFilter = ref(queryParam('providerId'))
const fallbackProviderFilter = ref(queryParam('fallbackProviderId'))
const reasonFilter = ref('')
const outcomeFilter = ref<'' | 'success' | 'failed'>('')

const providerOptions = computed(() =>
  providersStore.items.slice().sort((a, b) => a.name.localeCompare(b.name))
)
const providerNameMap = computed(() => {
  const map: Record<string, string> = {}
  providersStore.items.forEach((p) => (map[p.id] = p.name))
  return map
})

// --- Pagination ---
const pagination = usePagination({
  store: { pagination: monitoringStore.fallbackEventsPagination },
  pageSize: 100,
  onPageChange: () => load(),
})

async function load() {
  try {
    await monitoringStore.fetchFallbackEvents({
      providerId: providerFilter.value || undefined,
      fallbackProviderId: fallbackProviderFilter.value || undefined,
      reason: reasonFilter.value || undefined,
      success: outcomeFilter.value === 'success' ? true : outcomeFilter.value === 'failed' ? false : undefined,
      from: dateTimeRange.value?.value[0] ?? undefined,
      to: dateTimeRange.value?.value[1] ?? undefined,
      offset: pagination.offset.value,
      limit: pagination.pageSize.value,
    })
  } catch {
    // error surfaced via monitoringStore.fallbackEventsError
  }
}

function resetFilters() {
  dateTimeRange.value = null
  providerFilter.value = ''
  fallbackProviderFilter.value = ''
  reasonFilter.value = ''
  outcomeFilter.value = ''
  pagination.reset()
}

// Keep the filters in sync when the query changes (e.g. back/forward navigation)
watch(
  [() => route.query.providerId, () => route.query.fallbackProviderId],
  ([rawId, rawFbId]) => {
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    const fbId = Array.isArray(rawFbId) ? rawFbId[0] : rawFbId
    const nextId = typeof id === 'string' ? id : ''
    const nextFbId = typeof fbId === 'string' ? fbId : ''
    if (nextId !== providerFilter.value) {
      providerFilter.value = nextId
      pagination.reset()
    }
    if (nextFbId !== fallbackProviderFilter.value) {
      fallbackProviderFilter.value = nextFbId
      pagination.reset()
    }
  },
)

// --- Row expansion (identifiers) ---
const expandedEventId = ref<string | null>(null)
function toggleEvent(id: string) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}

function hasDetails(e: (typeof monitoringStore.fallbackEvents)[number]): boolean {
  return !!(e.projectId || e.conversationId)
}

function formatReason(code: string): string {
  return code
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function openConversation(conversationId: string) {
  router.push({ name: 'monitor.conversationDetail', params: { conversationId } })
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
          <h1 class="page-title">Fallback Events</h1>
          <p class="page-subtitle">Recorded failover transitions — which provider failed, which one served, and why</p>
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
            <span>{{ providerNameMap[providerFilter] ?? 'All providers' }}</span>
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
            <span>{{ fallbackProviderFilter ? `→ ${providerNameMap[fallbackProviderFilter] ?? fallbackProviderFilter}` : 'All fallbacks' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button class="filter-dropdown-item" :class="{ 'filter-dropdown-item-active': fallbackProviderFilter === '' }" @click="fallbackProviderFilter = ''; pagination.reset(); close()">
              All fallbacks
            </button>
            <button
              v-for="provider in providerOptions"
              :key="provider.id"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': fallbackProviderFilter === provider.id }"
              @click="fallbackProviderFilter = provider.id; pagination.reset(); close()"
            >
              {{ provider.name }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ reasonFilter ? `Reason: ${reasonFilter}` : 'All reasons' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button class="filter-dropdown-item" :class="{ 'filter-dropdown-item-active': reasonFilter === '' }" @click="reasonFilter = ''; pagination.reset(); close()">
              All reasons
            </button>
            <button
              v-for="code in ERROR_CODES"
              :key="code"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': reasonFilter === code }"
              @click="reasonFilter = code; pagination.reset(); close()"
            >
              {{ code }}
            </button>
          </template>
        </FloatingDropdown>

        <FloatingDropdown align="left" trigger-class="filter-btn !shadow-none">
          <template #trigger>
            <span>{{ outcomeFilter === '' ? 'All outcomes' : outcomeFilter === 'success' ? 'Succeeded' : 'Failed' }}</span>
            <ChevronDown class="w-4 h-4 ml-2" />
          </template>
          <template #default="{ close }">
            <button v-for="option in [
              { value: '', label: 'All outcomes' },
              { value: 'success', label: 'Succeeded' },
              { value: 'failed', label: 'Failed' },
            ]" :key="option.value"
              class="filter-dropdown-item"
              :class="{ 'filter-dropdown-item-active': outcomeFilter === option.value }"
              @click="outcomeFilter = option.value as any; pagination.reset(); close()"
            >
              {{ option.label }}
            </button>
          </template>
        </FloatingDropdown>

        <button v-if="dateTimeRange || providerFilter || fallbackProviderFilter || reasonFilter || outcomeFilter" class="btn-link" @click="resetFilters">
          Clear filters
        </button>
      </div>

      <!-- Results -->
      <div class="section-card">
        <div v-if="monitoringStore.fallbackEventsLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.fallbackEventsError" class="alert-error">{{ monitoringStore.fallbackEventsError }}</div>

        <div v-else-if="monitoringStore.fallbackEvents.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No failover transitions recorded for this filter.</p>
        </div>

        <template v-else>
          <div class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell w-8"></th>
                    <th class="table-header-cell">Time</th>
                    <th class="table-header-cell">Failed provider</th>
                    <th class="table-header-cell">Fallback</th>
                    <th class="table-header-cell">Operation</th>
                    <th class="table-header-cell">Reason</th>
                    <th class="table-header-cell">Outcome</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <template v-for="event in monitoringStore.fallbackEvents" :key="event.id">
                    <tr class="table-row cursor-pointer" @click="hasDetails(event) ? toggleEvent(event.id) : undefined">
                      <td class="table-cell">
                        <ChevronRight v-if="expandedEventId !== event.id && hasDetails(event)" :size="14" class="text-gray-400" />
                        <ChevronDown v-else-if="expandedEventId === event.id" :size="14" class="text-gray-400" />
                      </td>
                      <td class="table-cell whitespace-nowrap"><RelativeDate :date="event.createdAt" /></td>
                      <td class="table-cell">
                        <div class="text-sm font-medium truncate max-w-[180px]">
                          {{ providerNameMap[event.providerId] ?? event.providerId }}
                        </div>
                        <div class="text-xs text-gray-400 dark:text-gray-500">{{ event.providerType }}</div>
                      </td>
                      <td class="table-cell">
                        <span class="text-sm truncate max-w-[180px] inline-block align-middle">
                          {{ providerNameMap[event.fallbackProviderId] ?? event.fallbackProviderId }}
                        </span>
                      </td>
                      <td class="table-cell-mono text-xs">{{ event.operation }}</td>
                      <td class="table-cell">
                        <span class="badge badge-danger">{{ formatReason(event.reason) }}</span>
                      </td>
                      <td class="table-cell">
                        <span v-if="event.success === true" class="badge badge-success">Served</span>
                        <span v-else-if="event.success === false" class="badge badge-danger">Failed</span>
                        <span v-else class="badge badge-secondary">Unknown</span>
                      </td>
                    </tr>
                    <tr v-if="expandedEventId === event.id">
                      <td class="table-cell" colspan="7">
                        <div class="whitespace-normal bg-gray-50 dark:bg-gray-900/50 rounded-md p-4">
                          <dl class="text-xs space-y-1">
                            <div class="flex gap-2">
                              <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Event ID</dt>
                              <dd class="font-mono">{{ event.id }}</dd>
                            </div>
                            <div class="flex gap-2">
                              <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Failed provider ID</dt>
                              <dd class="font-mono truncate">{{ event.providerId }}</dd>
                            </div>
                            <div class="flex gap-2">
                              <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Fallback ID</dt>
                              <dd class="font-mono truncate">{{ event.fallbackProviderId }}</dd>
                            </div>
                            <div v-if="event.projectId" class="flex gap-2">
                              <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Project</dt>
                              <dd class="font-mono truncate">{{ event.projectId }}</dd>
                            </div>
                            <div v-if="event.conversationId" class="flex gap-2">
                              <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Conversation</dt>
                              <dd>
                                <button class="btn-link font-mono text-xs inline-flex items-center gap-1" @click.stop="openConversation(event.conversationId!)">
                                  <ChevronRight :size="12" /> {{ event.conversationId }}
                                </button>
                              </dd>
                            </div>
                          </dl>
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
            :displayed-count="monitoringStore.fallbackEvents.length"
            resource-name="fallback events"
          />
        </template>
      </div>
    </div>
  </div>
</template>
