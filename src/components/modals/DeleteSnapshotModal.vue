<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { useSnapshotsStore } from '@/stores'
import type { SnapshotResponse } from '@/api/types'

const props = defineProps<{
  projectId: string
  snapshot: SnapshotResponse
  isLatest: boolean
}>()

const emit = defineEmits<{
  close: []
  done: []
}>()

const snapshotsStore = useSnapshotsStore()
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

async function handleDelete() {
  isDeleting.value = true
  deleteError.value = null
  try {
    await snapshotsStore.remove(props.projectId, props.snapshot.id)
    emit('done')
    emit('close')
  } catch (err: any) {
    deleteError.value = err.message || 'Failed to delete snapshot'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <BaseModal title="Delete Snapshot" size="md" @close="$emit('close')">
    <div class="flex flex-col gap-4">
      <!-- Snapshot details -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <div class="flex items-baseline gap-3 mb-1">
          <span class="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">v.{{ snapshot.version }}</span>
          <span v-if="snapshot.name" class="text-sm text-gray-700 dark:text-gray-300">{{ snapshot.name }}</span>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Created <RelativeDate :date="snapshot.createdAt" />
        </div>
      </div>

      <!-- Warning -->
      <div class="alert-warning">
        <p class="text-sm">
          This action cannot be undone. Deleting this snapshot will permanently remove it.
        </p>
      </div>

      <!-- Latest snapshot warning -->
      <div
        v-if="isLatest"
        class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-700"
      >
        <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-sm text-red-700 dark:text-red-400">
          This is the most recent snapshot. Deleting it will remove your latest backup.
        </p>
      </div>

      <!-- Error -->
      <div v-if="deleteError" class="text-sm text-red-500 dark:text-red-400">
        {{ deleteError }}
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" @click="$emit('close')" :disabled="isDeleting">Cancel</button>
      <button
        class="btn-primary"
        :class="{ 'btn-danger': true }"
        @click="handleDelete"
        :disabled="isDeleting"
      >
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </BaseModal>
</template>
