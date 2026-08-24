<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMonitoringStore } from '@/stores'
import RelativeDate from '@/components/RelativeDate.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { ruleLabel, severityBadgeClass, alertStatusBadgeClass } from '@/utils/monitoringRules'
import { ArrowLeft, Check, Loader2, BellRing } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const monitoringStore = useMonitoringStore()

const activeTab = ref('overview')
const acking = ref(false)

const alertId = computed(() => route.params.alertId as string)

// Raw id is annotated when it is not in the live engine catalog
const catalogRuleIds = computed(() => new Set(monitoringStore.ruleCatalog.map((r) => r.id)))

// Notification count in the tab label
const notificationCount = computed(() => monitoringStore.alert?.notifications?.length ?? 0)
const notificationTabLabel = computed(() =>
  `Notifications${notificationCount.value ? ` (${notificationCount.value})` : ''}`
)

function goBack() {
  router.push({ name: 'system.alerts' })
}

async function load() {
  try {
    await monitoringStore.fetchAlert(alertId.value)
  } catch {
    // error surfaced via monitoringStore.alertError
  }
}

async function acknowledge() {
  if (acking.value) return
  acking.value = true
  try {
    await monitoringStore.acknowledgeAlert(alertId.value)
  } catch {
    // error surfaced via monitoringStore.ackError
  } finally {
    acking.value = false
  }
}

onMounted(() => {
  // Non-fatal: on failure the rule badge just skips the unknown-id annotation
  monitoringStore.fetchRuleCatalog().catch(() => undefined)
  load()
})
watch(alertId, (id, prev) => {
  if (id && id !== prev) {
    activeTab.value = 'overview'
    load()
  }
})

// --- Overview helpers ---
const scopeEntries = computed<[string, unknown][]>(() =>
  Object.entries(monitoringStore.alert?.scope ?? {})
)

function formatContextValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const contextEntries = computed<[string, unknown][]>(() => {
  const entries = Object.entries(monitoringStore.alert?.context ?? {})
  return entries.filter(([, v]) => v !== null && v !== undefined && v !== '')
})

const metadataFields = computed(() => {
  const alert = monitoringStore.alert
  if (!alert) return []
  return [
    { label: 'Alert ID', value: alert.id, format: 'mono' as const },
    { label: 'Rule ID', value: alert.ruleId, format: 'mono' as const },
    { label: 'Scope Key', value: alert.scopeKey, format: 'mono' as const },
    { label: 'Severity', value: alert.severity },
    { label: 'Status', value: alert.status },
    { label: 'Fired At', value: alert.firedAt, format: 'date' as const },
    { label: 'Resolved At', value: alert.resolvedAt, format: 'date' as const },
    { label: 'Acknowledged At', value: alert.ackedAt, format: 'date' as const },
    { label: 'Acknowledged By', value: alert.ackedBy, format: 'mono' as const },
  ]
})

</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-4 md:py-3 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div class="md:flex items-center gap-4 flex-1 mb-3 md:mb-0">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to alerts">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="page-title">Alert Details</h1>
            <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ alertId }}</p>
          </div>
        </div>
        <div v-if="monitoringStore.alert" class="flex gap-3 items-center">
          <button
            v-if="!monitoringStore.alert.ackedAt"
            @click="acknowledge"
            class="btn-primary"
            :disabled="acking"
            type="button"
          >
            <Loader2 v-if="acking" class="inline-block mr-2 w-4 h-4 animate-spin" />
            <Check v-else class="inline-block mr-2 w-4 h-4" />
            Acknowledge
          </button>
          <span v-else class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Check class="w-4 h-4 text-green-500" />
            Acknowledged
            <RelativeDate v-if="monitoringStore.alert.ackedAt" :date="monitoringStore.alert.ackedAt" />
          </span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <TabNavigator v-model="activeTab" :tabs="[
          { key: 'overview', label: 'Overview' },
          { key: 'notifications', label: notificationTabLabel },
          { key: 'context', label: 'Context' },
          { key: 'metadata', label: 'Metadata' },
        ]" />
      </div>

      <ErrorDisplay :error="monitoringStore.ackError" class="px-4 py-2" />

      <!-- Loading State -->
      <div v-if="monitoringStore.alertLoading" class="loading-state">
        Loading alert event…
      </div>

      <!-- Error State -->
      <div v-else-if="monitoringStore.alertError" class="error-state">
        {{ monitoringStore.alertError }}
        <button @click="load" class="btn-secondary mt-4">
          Retry
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="monitoringStore.alert" class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
        <div class="mx-auto">
          <!-- Overview Tab -->
          <TabContent v-model="activeTab" tab="overview">
            <div class="p-4 md:p-6 space-y-6">
              <div class="card p-4 md:p-5">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="badge capitalize" :class="severityBadgeClass(monitoringStore.alert.severity)">
                    {{ monitoringStore.alert.severity }}
                  </span>
                  <span class="badge capitalize" :class="alertStatusBadgeClass(monitoringStore.alert.status)">
                    {{ monitoringStore.alert.status }}
                  </span>
                  <span class="badge badge-violet" :title="monitoringStore.alert.ruleId">
                    {{ ruleLabel(monitoringStore.alert.ruleId) }}
                    <template v-if="catalogRuleIds.size && !catalogRuleIds.has(monitoringStore.alert.ruleId)"> ({{ monitoringStore.alert.ruleId }})</template>
                  </span>
                </div>
                <p class="text-base font-medium leading-relaxed">{{ monitoringStore.alert.message }}</p>
              </div>

              <!-- Timeline -->
              <div class="card p-4 md:p-5">
                <h2 class="section-title mb-4">Timeline</h2>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <BellRing class="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                    <div>
                      <div class="text-sm font-medium">Fired</div>
                      <div v-if="monitoringStore.alert.firedAt" class="text-xs text-gray-500 dark:text-gray-400">
                        <RelativeDate :date="monitoringStore.alert.firedAt" />
                      </div>
                      <div v-else class="text-xs text-gray-400 dark:text-gray-500">no timestamp recorded</div>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <Check class="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <div>
                      <div class="text-sm font-medium">Resolved</div>
                      <div v-if="monitoringStore.alert.resolvedAt" class="text-xs text-gray-500 dark:text-gray-400">
                        <RelativeDate :date="monitoringStore.alert.resolvedAt" />
                      </div>
                      <div v-else class="text-xs text-gray-400 dark:text-gray-500">still firing</div>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <Check class="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <div class="text-sm font-medium">Acknowledged</div>
                      <div v-if="monitoringStore.alert.ackedAt" class="text-xs text-gray-500 dark:text-gray-400">
                        <RelativeDate :date="monitoringStore.alert.ackedAt" />
                        <span v-if="monitoringStore.alert.ackedBy" class="font-mono ml-1">by {{ monitoringStore.alert.ackedBy }}</span>
                      </div>
                      <div v-else class="text-xs text-gray-400 dark:text-gray-500">not acknowledged yet</div>
                    </div>
                  </li>
                </ul>
              </div>

              <!-- Scope -->
              <div v-if="scopeEntries.length" class="card p-4 md:p-5">
                <h2 class="section-title mb-4">Scope</h2>
                <dl class="text-sm grid gap-2 sm:grid-cols-2">
                  <div v-for="[key, value] in scopeEntries" :key="key" class="flex gap-2">
                    <dt class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">{{ key }}</dt>
                    <dd class="font-mono text-xs break-all">{{ formatContextValue(value) }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabContent>

          <!-- Notifications Tab -->
          <TabContent v-model="activeTab" tab="notifications">
            <div class="p-4 md:p-6">
              <div v-if="notificationCount === 0" class="empty-state py-8">
                <p class="text-sm text-gray-500 dark:text-gray-400">No notification delivery attempts recorded for this alert.</p>
              </div>
              <div v-else class="table-container">
                <div class="table-wrapper">
                  <table class="table">
                    <thead class="table-header">
                      <tr>
                        <th class="table-header-cell">Notifier</th>
                        <th class="table-header-cell">Phase</th>
                        <th class="table-header-cell">Outcome</th>
                        <th class="table-header-cell">Detail</th>
                        <th class="table-header-cell">At</th>
                      </tr>
                    </thead>
                    <tbody class="table-body">
                      <tr v-for="(notification, index) in monitoringStore.alert!.notifications" :key="index" class="table-row">
                        <td class="table-cell-mono text-xs" :title="notification.notifierId">{{ notification.notifierId }}</td>
                        <td class="table-cell">
                          <span class="badge capitalize">{{ notification.phase === 'fired' ? 'Fired' : 'Resolved' }}</span>
                        </td>
                        <td class="table-cell">
                          <span v-if="notification.ok" class="badge badge-success">Delivered</span>
                          <span v-else class="badge badge-danger">Failed</span>
                        </td>
                        <td class="table-cell">
                          <span v-if="notification.detail" class="text-xs text-red-600 dark:text-red-400 block max-w-[320px] truncate" :title="notification.detail">
                            {{ notification.detail }}
                          </span>
                          <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
                        </td>
                        <td class="table-cell whitespace-nowrap">
                          <RelativeDate v-if="notification.at" :date="notification.at" />
                          <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabContent>

          <!-- Context Tab -->
          <TabContent v-model="activeTab" tab="context">
            <div class="p-4 md:p-6">
              <div v-if="contextEntries.length === 0" class="empty-state py-8">
                <p class="text-sm text-gray-500 dark:text-gray-400">No evaluation context recorded for this alert.</p>
              </div>
              <dl v-else class="text-sm space-y-2 max-w-3xl">
                <div v-for="[key, value] in contextEntries" :key="key" class="flex gap-2">
                  <dt class="text-gray-500 dark:text-gray-400 w-44 flex-shrink-0">{{ key }}</dt>
                  <dd class="font-mono text-xs break-all">{{ formatContextValue(value) }}</dd>
                </div>
              </dl>
            </div>
          </TabContent>

          <!-- Metadata Tab (self-registering) -->
          <MetadataTab v-model="activeTab" tab="metadata" :fields="metadataFields" />
        </div>
      </div>
    </div>
  </div>
</template>
