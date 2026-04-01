<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Eye, RotateCcw, RotateCw, ArrowLeft, RefreshCw, ArrowLeftRight } from 'lucide-vue-next'
import type { AuditLogResponse } from '@/api/types'
import DiffView from '@/components/DiffView.vue'

interface Props {
  loadHistory: () => Promise<{ items: AuditLogResponse[] }>
  currentVersion?: number | null
  currentObject?: any
  active?: boolean
  updateFn?: (data: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
  ignoreFields?: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  recoverSuccess: []
}>()

const view = ref<'table' | 'diff' | 'compare'>('table')
const logs = ref<AuditLogResponse[]>([])
const selectedLog = ref<AuditLogResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isRecovering = ref(false)
const recoverError = ref<string | null>(null)
const recoverSuccess = ref(false)
const compareSide = ref<'before' | 'after'>('after')

onMounted(async () => {
  await fetchHistory()
})

watch(() => props.active, (isActive) => {
  if (isActive) fetchHistory()
})

async function fetchHistory() {
  isLoading.value = true
  error.value = null
  recoverSuccess.value = false
  try {
    const res = await props.loadHistory() as any
    const rawItems: AuditLogResponse[] = Array.isArray(res) ? res : (res?.items ?? [])
    logs.value = rawItems.slice().sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tb - ta
    })
    error.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load history'
  } finally {
    isLoading.value = false
  }
}

function openDiff(log: AuditLogResponse) {
  selectedLog.value = log
  recoverError.value = null
  recoverSuccess.value = false
  view.value = 'diff'
}

function backToTable() {
  view.value = 'table'
  selectedLog.value = null
  recoverError.value = null
  recoverSuccess.value = false
}

function handleCancel() {
  if (view.value === 'compare') {
    view.value = 'diff'
    recoverError.value = null
    recoverSuccess.value = false
  } else {
    backToTable()
  }
}

function openCompare(side: 'before' | 'after') {
  compareSide.value = side
  recoverError.value = null
  recoverSuccess.value = false
  view.value = 'compare'
}

async function recoverEntity(entity: Record<string, any> | null) {
  if (!selectedLog.value) return
  isRecovering.value = true
  recoverError.value = null
  recoverSuccess.value = false
  try {
    const log = selectedLog.value
    const withVersion = (e: Record<string, any> | null) => {
      const data = { ...(e ?? {}) }
      if (props.currentVersion != null) data.version = props.currentVersion
      return data
    }
    if (log.action === 'DELETE') {
      if (props.createFn) await props.createFn(withVersion(entity))
      else throw new Error('Create operation not supported for this entity')
    } else {
      if (props.updateFn) await props.updateFn(withVersion(entity))
      else throw new Error('Update operation not supported for this entity')
    }
    recoverSuccess.value = true
    emit('recoverSuccess')
  } catch (err: any) {
    recoverError.value = err.response?.data?.message || err.message || 'Recovery failed'
  } finally {
    isRecovering.value = false
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

function actionBadgeClass(action: string): string {
  if (action === 'CREATE') return 'badge-success'
  if (action === 'DELETE') return 'badge-danger'
  return 'badge-info'
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(k => k in b && deepEqual(a[k], b[k]))
}

function getChangedProperties(log: AuditLogResponse): string[] {
  if (log.action === 'CREATE') return []
  if (log.action === 'DELETE') return []
  const old = log.oldEntity ?? {}
  const next = log.newEntity ?? {}
  const allKeys = new Set([...Object.keys(old), ...Object.keys(next)])
  const changed: string[] = []
  for (const key of allKeys) {
    if (key === 'version') continue // Ignore version changes
    if (key === 'updatedAt') continue; // Ignore updatedAt timestamp changes
    if (props.ignoreFields?.includes(key)) continue
    if (!deepEqual(old[key], next[key])) changed.push(key)
  }
  return changed
}

function diffObjectA(log: AuditLogResponse): Record<string, any> {
  if (log.action === 'CREATE') return {}
  return stripIgnored(log.oldEntity ?? {})
}

function diffObjectB(log: AuditLogResponse): Record<string, any> {
  if (log.action === 'DELETE') return {}
  return stripIgnored(log.newEntity ?? {})
}

function compareObjectSelected(log: AuditLogResponse): Record<string, any> {
  if (compareSide.value === 'before') return stripIgnored(log.oldEntity ?? {})
  if (log.action === 'DELETE') return stripIgnored(log.oldEntity ?? {})
  return stripIgnored(log.newEntity ?? {})
}

function compareSideLabel(): string {
  return compareSide.value === 'before' ? 'Before' : 'After'
}

const canRecover = computed(() => !!(props.updateFn || props.createFn))

function stripIgnored(obj: Record<string, any>): Record<string, any> {
  if (!props.ignoreFields?.length) return obj
  const result = { ...obj }
  for (const key of props.ignoreFields) delete result[key]
  return result
}
</script>

<template>
  <div>
  <!-- Table view -->
  <div v-if="view === 'table'">
    <div class="flex mb-3">
      <h3 class="text-lg font-semibold mb-2">Change Log</h3>
      <button
        type="button"
        class="btn-secondary btn-sm ml-auto"
        :disabled="isLoading"
        @click="fetchHistory"
      >
        <RefreshCw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isLoading }" />
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
      Loading history...
    </div>

    <div v-else-if="error" class="alert-error mb-3">
      {{ error }}
      <button type="button" class="ml-3 underline text-sm" @click="fetchHistory">Retry</button>
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <p class="empty-state-title">No history available</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">No audit log entries found for this entity.</p>
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Date</th>
              <th class="table-header-cell">User</th>
              <th class="table-header-cell">Action</th>
              <th class="table-header-cell">Changed Properties</th>
              <th class="table-header-cell-right"></th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="log in logs" :key="log.id" class="table-row">
              <td class="table-cell whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
              <td class="table-cell font-mono text-xs">{{ log.userId ?? 'System' }}</td>
              <td class="table-cell">
                <span :class="['badge', actionBadgeClass(log.action)]">{{ log.action }}</span>
              </td>
              <td class="table-cell">
                <template v-if="log.action === 'CREATE'">
                  <span class="text-green-600 dark:text-green-400 text-xs italic">Entity created</span>
                </template>
                <template v-else-if="log.action === 'DELETE'">
                  <span class="text-red-500 dark:text-red-400 text-xs italic">Entity deleted</span>
                </template>
                <template v-else>
                  <div class="flex flex-col items-start gap-1">
                    <span
                      v-for="prop in getChangedProperties(log)"
                      :key="prop"
                      class="px-1.5 py-0.5 rounded text-xs font-mono bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    >{{ prop }}</span>
                    <span v-if="getChangedProperties(log).length === 0" class="text-gray-400 text-xs italic">No changes detected</span>
                  </div>
                </template>
              </td>
              <td class="table-cell-right">
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  @click="openDiff(log)"
                >
                  <Eye class="w-3.5 h-3.5 mr-1" />
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Diff view -->
  <div v-else-if="view === 'diff' && selectedLog" class="tab-content">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <button type="button" class="btn-icon" @click="handleCancel" title="Back">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <span :class="['badge', actionBadgeClass(selectedLog.action)]">{{ selectedLog.action }}</span>
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(selectedLog.createdAt) }}</span>
          <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-mono">{{ selectedLog.userId ?? 'System' }}</span>
        </div>
      </div>
      <button type="button" class="btn-secondary" @click="handleCancel">Cancel</button>
    </div>

    <!-- Recover error / success -->
    <div v-if="recoverError" class="alert-error mb-4">{{ recoverError }}</div>
    <div v-if="recoverSuccess" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md text-sm text-green-700 dark:text-green-300">
      Entity recovered successfully.
    </div>

    <!-- Recover buttons + Compare above diff columns -->
    <div class="grid grid-cols-2 gap-px mb-2">
      <!-- Before column -->
      <div class="flex justify-center gap-2 py-1">
        <button
          v-if="canRecover && !recoverSuccess && selectedLog.action !== 'CREATE'"
          type="button"
          class="btn-alt btn-sm"
          :disabled="isRecovering"
          @click="recoverEntity(selectedLog.oldEntity)"
        >
          <RotateCcw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isRecovering }" />
          Recover Before
        </button>
        <button
          v-if="currentObject && selectedLog.action !== 'CREATE'"
          type="button"
          class="btn-secondary btn-sm"
          @click="openCompare('before')"
        >
          <ArrowLeftRight class="w-3.5 h-3.5 mr-1" />
          Compare with current
        </button>
      </div>
      <!-- After column -->
      <div class="flex justify-center gap-2 py-1">
        <button
          v-if="currentObject && selectedLog.action !== 'DELETE'"
          type="button"
          class="btn-secondary btn-sm"
          @click="openCompare('after')"
        >
          <ArrowLeftRight class="w-3.5 h-3.5 mr-1" />
          Compare with current
        </button>
        <button
          v-if="canRecover && !recoverSuccess && selectedLog.action !== 'DELETE'"
          type="button"
          class="btn-alt btn-sm"
          :disabled="isRecovering"
          @click="recoverEntity(selectedLog.newEntity)"
        >
          <RotateCw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isRecovering }" />
          Recover After
        </button>
      </div>
    </div>

    <!-- Diff -->
    <DiffView
      :object-a="diffObjectA(selectedLog)"
      :object-b="diffObjectB(selectedLog)"
      :label-a="selectedLog.action === 'CREATE' ? 'Empty' : 'Before'"
      :label-b="selectedLog.action === 'DELETE' ? 'Empty' : 'After'"
    />
  </div>

  <!-- Compare view: current vs selected version -->
  <div v-else-if="view === 'compare' && selectedLog" class="tab-content">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <button type="button" class="btn-icon" @click="handleCancel" title="Back to diff">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Current vs Selected Version</span>
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(selectedLog.createdAt) }}</span>
          <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-mono">{{ selectedLog.userId ?? 'System' }}</span>
        </div>
      </div>
      <button type="button" class="btn-secondary" @click="handleCancel">Cancel</button>
    </div>

    <!-- Recover error / success -->
    <div v-if="recoverError" class="alert-error mb-4">{{ recoverError }}</div>
    <div v-if="recoverSuccess" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md text-sm text-green-700 dark:text-green-300">
      Entity recovered successfully.
    </div>

    <!-- Recover Selected aligned with the right (Selected) column -->
    <div v-if="canRecover && !recoverSuccess" class="grid grid-cols-2 gap-px mb-2">
      <div></div>
      <div class="flex justify-center py-1">
        <button
          type="button"
          class="btn-alt btn-sm"
          :disabled="isRecovering"
          @click="recoverEntity(compareObjectSelected(selectedLog))"
        >
          <RotateCw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isRecovering }" />
          Recover Selected
        </button>
      </div>
    </div>

    <!-- Diff: current state on left, selected historical version on right -->
    <DiffView
      :object-a="stripIgnored(currentObject ?? {})"
      :object-b="compareObjectSelected(selectedLog)"
      label-a="Current"
      :label-b="compareSideLabel()"
    />
  </div>
  </div>
</template>
