<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useSnapshotsStore } from '@/stores'
import { usePagination, formatEnum } from '@/composables'
import { GitCompare, RotateCcw, Trash2, Search } from 'lucide-vue-next'
import type { SnapshotResponse } from '@/api/types'
import CreateSnapshotModal from '@/components/modals/CreateSnapshotModal.vue'
import SnapshotCompareModal from '@/components/modals/SnapshotCompareModal.vue'
import RestoreConfirmationModal from '@/components/modals/RestoreConfirmationModal.vue'
import DeleteSnapshotModal from '@/components/modals/DeleteSnapshotModal.vue'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const snapshotsStore = useSnapshotsStore()

const showCreate = ref(false)
const showCompare = ref(false)
const showRestore = ref(false)
const showDelete = ref(false)
const snapshotToRestore = ref<SnapshotResponse | null>(null)
const snapshotToDelete = ref<SnapshotResponse | null>(null)

// Inline rename state
const renamingId = ref<string | null>(null)
const renameValue = ref('')

// Text search
const textSearch = ref('')
const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null)

// Current modal snapshot for compare
const compareSnapshot = ref<SnapshotResponse | null>(null)

const pagination = usePagination({ store: snapshotsStore })

async function loadSnapshots() {
  const params = pagination.getParams()
  const searchParams: Record<string, any> = { ...params }
  if (textSearch.value) {
    searchParams.textSearch = textSearch.value
  }
  await snapshotsStore.fetchAll(props.projectId, searchParams)
}

function onSearchInput() {
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(() => {
    pagination.reset()
    loadSnapshots()
  }, 300)
}

// Schema status badge
function schemaStatusClass(status?: string) {
  switch (status) {
    case 'compatible': return 'badge-success'
    case 'incompatible': return 'badge-danger'
    default: return 'badge-secondary'
  }
}

function startRename(snapshot: SnapshotResponse) {
  renamingId.value = snapshot.id
  renameValue.value = snapshot.name || ''
}

async function saveRename(snapshot: SnapshotResponse) {
  try {
    await snapshotsStore.updateName(props.projectId, snapshot.id, { name: renameValue.value || null })
    renamingId.value = null
  } catch {
    // error handled by store
  }
}

function cancelRename() {
  renamingId.value = null
  renameValue.value = ''
}

function openCompare(snapshot: SnapshotResponse) {
  compareSnapshot.value = snapshot
  showCompare.value = true
}

function openRestore(snapshot: SnapshotResponse) {
  snapshotToRestore.value = snapshot
  showRestore.value = true
}

function openDelete(snapshot: SnapshotResponse) {
  snapshotToDelete.value = snapshot
  showDelete.value = true
}

function handleDeleteDone() {
  snapshotToDelete.value = null
  showDelete.value = false
}

function handleCreateSaved() {
  // Refresh list
  pagination.reset()
  loadSnapshots()
}

function handleRestoreDone() {
  snapshotToRestore.value = null
  showRestore.value = false
  // Refresh list after restore
  pagination.reset()
  loadSnapshots()
}

// Fetch on mount and when projectId changes
onMounted(() => {
  loadSnapshots()
})

watch(() => props.projectId, () => {
  pagination.reset()
  loadSnapshots()
})
</script>

<template>
  <BaseModal title="Project Snapshots" size="xl" @close="$emit('close')">
    <!-- Header actions -->
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="textSearch"
          type="text"
          placeholder="Search by name..."
          class="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-primary-400"
          @input="onSearchInput"
        />
      </div>
      <button class="btn-primary" @click="showCreate = true">
        Create Snapshot
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="snapshotsStore.isLoading && !snapshotsStore.items.length" class="loading-state py-8 text-center">
      <div class="spinner mx-auto mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading snapshots...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="snapshotsStore.error" class="error-state py-8 text-center">
      <p class="text-sm text-red-500 dark:text-red-400">{{ snapshotsStore.error.message }}</p>
      <button class="btn-link mt-2" @click="loadSnapshots">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!snapshotsStore.items.length" class="empty-state py-8 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">No snapshots yet. Create one to save your project's current state.</p>
      <button class="btn-primary" @click="showCreate = true">Create First Snapshot</button>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="table w-full">
        <thead class="table-header">
          <tr>
            <th class="table-header-cell text-right" style="width: 60px;">Version</th>
            <th class="table-header-cell">Name</th>
            <th class="table-header-cell" style="width: 120px;">Created</th>
            <th class="table-header-cell" style="width: 100px;">Schema</th>
            <th class="table-header-cell" style="width: 140px;">Actions</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr
            v-for="snapshot in snapshotsStore.items"
            :key="snapshot.id"
            class="table-row"
          >
            <!-- Version -->
            <td class="table-cell table-cell-mono table-cell-right">v.{{ snapshot.version }}</td>

            <!-- Name -->
            <td class="table-cell">
              <template v-if="renamingId === snapshot.id">
                <div class="flex items-center gap-2">
                  <input
                    v-model="renameValue"
                    type="text"
                    maxlength="256"
                    class="form-input flex-1 text-sm"
                    @keyup.enter="saveRename(snapshot)"
                    @keyup.escape="cancelRename"
                    autofocus
                  />
                  <button class="btn-link text-xs" @click="saveRename(snapshot)">Save</button>
                  <button class="btn-link text-xs" @click="cancelRename">Cancel</button>
                </div>
              </template>
              <template v-else>
                <span v-if="snapshot.name" class="text-gray-900 dark:text-gray-100">{{ snapshot.name }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">(unnamed)</span>
              </template>
            </td>

            <!-- Created -->
            <td class="table-cell">
              <RelativeDate :date="snapshot.createdAt" />
            </td>

            <!-- Schema -->
            <td class="table-cell">
              <span :class="['badge', schemaStatusClass(snapshot.schemaStatus)]">
                {{ formatEnum(snapshot.schemaStatus || 'unknown') }}
              </span>
            </td>

            <!-- Actions -->
            <td class="table-cell">
              <div class="flex items-center gap-1">
                <button
                  class="btn-icon"
                  title="Rename"
                  @click="startRename(snapshot)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  class="btn-icon"
                  title="Compare"
                  @click="openCompare(snapshot)"
                >
                  <GitCompare class="w-4 h-4" />
                </button>
                <button
                  class="btn-icon"
                  title="Restore"
                  @click="openRestore(snapshot)"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
                <button
                  class="btn-icon btn-icon-danger"
                  title="Delete"
                  @click="openDelete(snapshot)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <PaginationControls
      v-if="snapshotsStore.items.length > 0"
      :pagination="pagination"
      :displayed-count="snapshotsStore.items.length"
      resource-name="snapshots"
    />

    <!-- Child modals -->
    <CreateSnapshotModal
      v-if="showCreate"
      :project-id="projectId"
      @close="showCreate = false"
      @saved="handleCreateSaved"
    />

    <SnapshotCompareModal
      v-if="showCompare"
      :project-id="projectId"
      :baseline-snapshot="compareSnapshot"
      @close="showCompare = false; compareSnapshot = null"
    />

    <RestoreConfirmationModal
      v-if="showRestore && snapshotToRestore"
      :project-id="projectId"
      :snapshot="snapshotToRestore"
      @close="showRestore = false; snapshotToRestore = null"
      @done="handleRestoreDone"
    />

    <DeleteSnapshotModal
      v-if="showDelete && snapshotToDelete"
      :project-id="projectId"
      :snapshot="snapshotToDelete"
      :is-latest="snapshotToDelete.version === (snapshotsStore.items[0]?.version ?? -1)"
      @close="showDelete = false; snapshotToDelete = null"
      @done="handleDeleteDone"
    />
  </BaseModal>
</template>
