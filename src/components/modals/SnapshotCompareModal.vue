<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import { useSnapshotsStore } from '@/stores'
import type { SnapshotResponse, AddedRemovedEntity } from '@/api/types'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  baselineSnapshot?: SnapshotResponse | null
}>()

const emit = defineEmits<{
  close: []
}>()

const snapshotsStore = useSnapshotsStore()

const fromVersion = ref<number | null>(
  props.baselineSnapshot?.version ?? null
)
const toVersion = ref<number | null>(null)
const activeTab = ref('added')
const expandedEntities = ref<Set<string>>(new Set())

// All available versions for dropdown
const allSnapshots = ref<SnapshotResponse[]>([])
const isLoadingVersions = ref(false)

// Comparison state
const hasCompared = ref(false)
const compareError = ref<string | null>(null)

const comparison = computed(() => snapshotsStore.comparison)
const isComparing = computed(() => snapshotsStore.isComparing)

// Version options
const versionOptions = computed(() => {
  return allSnapshots.value.map(s => ({ version: s.version, label: `v.${s.version}${s.name ? ' — ' + s.name : ''}` }))
})

// From/To disabled check
const compareDisabled = computed(() => {
  return !fromVersion.value || !toVersion.value || fromVersion.value === toVersion.value || isComparing.value
})

// Added entities grouped by type
const addedGrouped = computed(() => {
  const c = comparison.value
  if (!c || !c.added) return {}
  const groups: Record<string, AddedRemovedEntity[]> = {}
  for (const entity of c.added) {
    const bucket = groups[entity.entityType] ?? []
    bucket.push(entity)
    groups[entity.entityType] = bucket
  }
  return groups
})

// Removed entities grouped by type
const removedGrouped = computed(() => {
  const c = comparison.value
  if (!c || !c.removed) return {}
  const groups: Record<string, AddedRemovedEntity[]> = {}
  for (const entity of c.removed) {
    const bucket = groups[entity.entityType] ?? []
    bucket.push(entity)
    groups[entity.entityType] = bucket
  }
  return groups
})

// Summary
const summary = computed(() => comparison.value?.summary ?? null)

// Entity count helpers
const addedCount = computed(() => comparison.value?.added.length ?? 0)
const removedCount = computed(() => comparison.value?.removed.length ?? 0)
const modifiedCount = computed(() => comparison.value?.diffs.length ?? 0)

// Tabs
const tabs = computed(() => [
  { key: 'added', label: `Added (${addedCount.value})` },
  { key: 'removed', label: `Removed (${removedCount.value})` },
  { key: 'modified', label: `Modified (${modifiedCount.value})` },
])

async function loadVersions() {
  isLoadingVersions.value = true
  try {
    // Fetch all snapshots to populate version dropdowns
    await snapshotsStore.fetchAll(props.projectId, { limit: 200 })
    allSnapshots.value = snapshotsStore.items

    // Auto-set fromVersion if not already set
    const first = allSnapshots.value[0]
    const second = allSnapshots.value[1]
    if (!fromVersion.value && first) {
      fromVersion.value = first.version
    }
    // Auto-set toVersion to latest (first in desc order) if different from fromVersion
    if (!toVersion.value && first) {
      toVersion.value = first.version
      if (toVersion.value === fromVersion.value && second) {
        toVersion.value = second.version
      }
    }
  } catch {
    // error handled by store
  } finally {
    isLoadingVersions.value = false
  }
}

async function handleCompare() {
  if (compareDisabled.value) return
  compareError.value = null
  hasCompared.value = false
  try {
    await snapshotsStore.compare(props.projectId, fromVersion.value!, toVersion.value!)
    hasCompared.value = true
  } catch (err: any) {
    compareError.value = err.message || 'Failed to compare snapshots'
  }
}

function toggleExpand(entityId: string) {
  if (expandedEntities.value.has(entityId)) {
    expandedEntities.value.delete(entityId)
  } else {
    expandedEntities.value.add(entityId)
  }
}

function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

// Reset when modal closes
function handleBeforeClose() {
  snapshotsStore.resetComparison()
  fromVersion.value = null
  toVersion.value = null
  hasCompared.value = false
  allSnapshots.value = []
  expandedEntities.value.clear()
}

// Load versions on mount
loadVersions()
</script>

<template>
  <BaseModal title="Compare Snapshots" size="3xl" @close="handleBeforeClose(); $emit('close')">
    <!-- Version selectors -->
    <div class="flex items-center gap-3 mb-4">
      <div class="flex-1">
        <label class="form-label text-xs">From (baseline)</label>
        <select v-model="fromVersion" class="form-select w-full">
          <option :value="null" disabled>Select version</option>
          <option v-for="opt in versionOptions" :key="'from-' + opt.version" :value="opt.version">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <label class="form-label text-xs">To (target)</label>
        <select v-model="toVersion" class="form-select w-full">
          <option :value="null" disabled>Select version</option>
          <option v-for="opt in versionOptions" :key="'to-' + opt.version" :value="opt.version">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="flex items-end">
        <button class="btn-primary" @click="handleCompare" :disabled="compareDisabled">
          {{ isComparing ? 'Comparing...' : 'Compare' }}
        </button>
      </div>
    </div>

    <!-- Loading states -->
    <div v-if="isLoadingVersions" class="loading-state py-8 text-center">
      <div class="spinner mx-auto mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading snapshots...</p>
    </div>

    <!-- Compare error -->
    <div v-else-if="compareError" class="error-state py-4 text-center">
      <p class="text-sm text-red-500 dark:text-red-400">{{ compareError }}</p>
    </div>

    <!-- Results -->
    <template v-else-if="hasCompared && comparison">
      <!-- Summary bar -->
      <div class="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <span class="text-sm text-green-600 dark:text-green-400 font-medium">
          +{{ addedCount }} added
        </span>
        <span class="text-sm text-red-600 dark:text-red-400 font-medium">
          -{{ removedCount }} removed
        </span>
        <span class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
          ~{{ modifiedCount }} modified
        </span>
        <span v-if="summary" class="text-sm text-gray-500 dark:text-gray-400">
          {{ summary.entitiesUnchanged }} unchanged
        </span>
      </div>

      <!-- Tabs -->
      <TabNavigator v-model="activeTab" :tabs="tabs" />

      <!-- Added tab -->
      <div v-show="activeTab === 'added'" class="mt-4">
        <div v-if="!addedCount" class="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No entities were added.
        </div>
        <template v-else>
          <div v-for="(entities, type) in addedGrouped" :key="type" class="mb-4">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
              {{ type }} ({{ entities.length }})
            </h4>
            <div class="table-container">
              <table class="table w-full">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Entity ID</th>
                    <th class="table-header-cell">Name</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="entity in entities" :key="entity.entity.id" class="table-row">
                    <td class="table-cell table-cell-mono text-xs">{{ entity.entity.id }}</td>
                    <td class="table-cell">{{ entity.entity.name || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <!-- Removed tab -->
      <div v-show="activeTab === 'removed'" class="mt-4">
        <div v-if="!removedCount" class="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No entities were removed.
        </div>
        <template v-else>
          <div v-for="(entities, type) in removedGrouped" :key="type" class="mb-4">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
              {{ type }} ({{ entities.length }})
            </h4>
            <div class="table-container">
              <table class="table w-full">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Entity ID</th>
                    <th class="table-header-cell">Name</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="entity in entities" :key="entity.entity.id" class="table-row">
                    <td class="table-cell table-cell-mono text-xs">{{ entity.entity.id }}</td>
                    <td class="table-cell">{{ entity.entity.name || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <!-- Modified tab -->
      <div v-show="activeTab === 'modified'" class="mt-4">
        <div v-if="!modifiedCount" class="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No entities were modified.
        </div>
        <template v-else>
          <div v-for="diff in comparison.diffs" :key="diff.entityId" class="mb-2">
            <!-- Entity header -->
            <button
              class="w-full flex items-center justify-between px-3 py-2 text-left rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              @click="toggleExpand(diff.entityId)"
            >
              <div>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ diff.entityName || diff.entityId }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{{ diff.entityType }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">({{ diff.changes.length }} changes)</span>
              </div>
              <ChevronDown v-if="!expandedEntities.has(diff.entityId)" class="w-4 h-4 text-gray-400" />
              <ChevronUp v-else class="w-4 h-4 text-gray-400" />
            </button>

            <!-- Field changes -->
            <div v-if="expandedEntities.has(diff.entityId)" class="table-container mt-1">
              <table class="table w-full">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell table-header-cell-mono text-xs">Field</th>
                    <th class="table-header-cell text-xs">From</th>
                    <th class="table-header-cell text-xs">To</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="change in diff.changes" :key="change.field" class="table-row">
                    <td class="table-cell table-cell-mono text-xs">{{ change.field }}</td>
                    <td class="table-cell text-xs text-red-600 dark:text-red-400 max-w-xs truncate" :title="formatFieldValue(change.from)">
                      {{ formatFieldValue(change.from) }}
                    </td>
                    <td class="table-cell text-xs text-green-600 dark:text-green-400 max-w-xs truncate" :title="formatFieldValue(change.to)">
                      {{ formatFieldValue(change.to) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Initial state -->
    <div v-else class="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
      Select two versions and click "Compare" to see the differences.
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" @click="handleBeforeClose(); $emit('close')">Close</button>
    </div>
  </BaseModal>
</template>
