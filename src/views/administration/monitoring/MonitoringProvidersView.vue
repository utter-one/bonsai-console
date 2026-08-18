<script setup lang="ts">
import { onMounted } from 'vue'
import { useMonitoringStore } from '@/stores'
import type { ProviderMonitoringItem } from '@/api/types'
import { useRouter } from 'vue-router'
import { RefreshCw, ExternalLink } from 'lucide-vue-next'

const router = useRouter()
const monitoringStore = useMonitoringStore()

const PROBE_BADGE: Record<string, string> = {
  ok: 'badge-success',
  degraded: 'badge-warning',
  down: 'badge-danger',
  unknown: 'badge-secondary',
}

function probeBadge(status: string | null): string {
  return status ? (PROBE_BADGE[status] ?? 'badge-secondary') : 'badge-secondary'
}
function probeLabel(status: string | null): string {
  return status ?? 'not probed'
}
function formatOkRate(rate: number | null): string {
  return rate == null ? '—' : `${Math.round(rate * 100)}%`
}
function formatMs(ms: number | null): string {
  return ms == null ? '—' : `${Math.round(ms)} ms`
}
function topErrorChips(provider: ProviderMonitoringItem): { code: string; count: number }[] {
  return (provider.rolling.topErrorCodes ?? []).map((pair) => ({
    code: String(pair[0] ?? ''),
    count: Number(pair[1] ?? 0),
  }))
}

function openProvider(providerId: string) {
  router.push({ name: 'administration.providers.edit', params: { providerId } })
}

async function load() {
  try {
    await monitoringStore.fetchProviders()
  } catch {
    // error surfaced via monitoringStore.providersError
  }
}

onMounted(load)
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Provider Health</h1>
          <p class="page-subtitle">Probe status and rolling 15-minute call statistics per provider</p>
        </div>
        <button @click="load" class="btn-secondary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Refresh
        </button>
      </div>

      <div class="section-card">
        <div v-if="monitoringStore.providersLoading" class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else-if="monitoringStore.providersError" class="alert-error">{{ monitoringStore.providersError }}</div>

        <div v-else-if="monitoringStore.providers.length === 0" class="empty-state py-8">
          <p class="text-sm text-gray-500 dark:text-gray-400">No providers configured.</p>
        </div>

        <div v-else class="table-container">
          <div class="table-wrapper">
            <table class="table">
              <thead class="table-header">
                <tr>
                  <th class="table-header-cell">Provider</th>
                  <th class="table-header-cell">Type</th>
                  <th class="table-header-cell">API</th>
                  <th class="table-header-cell">Probe</th>
                  <th class="table-header-cell table-cell-right">Calls (15m)</th>
                  <th class="table-header-cell table-cell-right">OK rate</th>
                  <th class="table-header-cell table-cell-right">p95</th>
                  <th class="table-header-cell">Top errors (15m)</th>
                </tr>
              </thead>
              <tbody class="table-body">
                <tr
                  v-for="provider in monitoringStore.providers"
                  :key="provider.id"
                  class="table-row"
                >
                  <td class="table-cell">
                    <button class="btn-link inline-flex items-center gap-1" @click="openProvider(provider.id)">
                      {{ provider.name }}
                      <ExternalLink :size="12" class="text-gray-400" />
                    </button>
                    <div class="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[220px]">
                      {{ provider.id }}
                    </div>
                  </td>
                  <td class="table-cell">
                    <span class="badge badge-info">{{ provider.providerType }}</span>
                  </td>
                  <td class="table-cell-mono text-xs">{{ provider.apiType }}</td>
                  <td class="table-cell">
                    <span class="badge" :class="probeBadge(provider.probeStatus)">{{ probeLabel(provider.probeStatus) }}</span>
                  </td>
                  <td class="table-cell-right tabular-nums">{{ provider.rolling.calls }}</td>
                  <td class="table-cell-right tabular-nums">{{ formatOkRate(provider.rolling.okRate) }}</td>
                  <td class="table-cell-right tabular-nums">{{ formatMs(provider.rolling.p95DurationMs) }}</td>
                  <td class="table-cell">
                    <template v-if="topErrorChips(provider).length">
                      <span
                        v-for="chip in topErrorChips(provider)"
                        :key="chip.code"
                        class="badge badge-danger mr-1"
                      >
                        {{ chip.code }} ×{{ chip.count }}
                      </span>
                    </template>
                    <span v-else class="text-xs text-gray-400 dark:text-gray-500">none</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 px-4 pb-3">
            Rolling window: last {{ monitoringStore.providers[0]?.rolling.windowMinutes ?? 15 }} minutes of recorded provider calls.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
