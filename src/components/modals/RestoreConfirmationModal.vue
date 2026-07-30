<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { useSnapshotsStore } from '@/stores'
import type { SnapshotResponse, RestoreWarning } from '@/api/types'
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  snapshot: SnapshotResponse
}>()

const emit = defineEmits<{
  close: []
  done: []
}>()

const snapshotsStore = useSnapshotsStore()
const confirmed = ref(false)
const isRestoring = ref(false)
const restoreError = ref<string | null>(null)
const restoreComplete = ref(false)
const restoreWarnings = ref<RestoreWarning[]>([])

const isSchemaIncompatible = computed(() => props.snapshot.schemaStatus === 'incompatible')

async function handleRestore() {
  if (!confirmed.value) return
  isRestoring.value = true
  restoreError.value = null
  try {
    const result = await snapshotsStore.restore(props.projectId, props.snapshot.id)
    if (result) {
      restoreWarnings.value = result.warnings || []
      restoreComplete.value = true
    }
  } catch (err: any) {
    restoreError.value = err.message || 'Failed to restore snapshot'
  } finally {
    isRestoring.value = false
  }
}

function handleClose() {
  snapshotsStore.resetRestore()
  confirmed.value = false
  restoreComplete.value = false
  restoreError.value = null
  restoreWarnings.value = []
  emit('close')
}

function handleDone() {
  emit('done')
  handleClose()
}
</script>

<template>
  <BaseModal title="Restore from Snapshot" size="lg" @close="handleClose">
    <template v-if="restoreComplete">
      <!-- Success state -->
      <div class="flex flex-col items-center text-center py-6">
        <CheckCircle2 class="w-12 h-12 text-green-500 mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Restore Complete</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Project has been restored to snapshot v.{{ snapshot.version }}.
        </p>

        <!-- Warnings -->
        <div v-if="restoreWarnings.length" class="w-full text-left mb-4">
          <div class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-700">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                {{ restoreWarnings.length }} warning{{ restoreWarnings.length > 1 ? 's' : '' }} during restore
              </p>
              <ul class="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <li v-for="(warning, i) in restoreWarnings" :key="i">
                  {{ warning.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" @click="handleDone">Done</button>
      </div>
    </template>

    <template v-else>
      <!-- Confirmation state -->
      <div class="flex flex-col gap-4">
        <!-- Snapshot details -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-baseline gap-3 mb-2">
            <span class="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">v.{{ snapshot.version }}</span>
            <span v-if="snapshot.name" class="text-sm text-gray-700 dark:text-gray-300">{{ snapshot.name }}</span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Created <RelativeDate :date="snapshot.createdAt" />
          </div>

          <!-- Entity counts -->
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="(count, key) in snapshot.entityCounts"
              :key="key"
              class="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              {{ count }} {{ key }}
            </span>
          </div>
        </div>

        <!-- Schema incompatible warning -->
        <div
          v-if="isSchemaIncompatible"
          class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-700"
        >
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-300">
              Schema incompatibility detected
            </p>
            <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              This snapshot was taken with a different API schema. Migration steps will be applied during restore.
              {{ snapshot.schemaStatusMessage ? ' ' + snapshot.schemaStatusMessage : '' }}
            </p>
          </div>
        </div>

        <!-- Restore warning -->
        <div class="alert-warning">
          <p class="text-sm">
            This will replace all current project configuration with the snapshot data.
            A backup snapshot will be created automatically before restore.
          </p>
        </div>

        <!-- Confirmation checkbox -->
        <label class="checkbox-label flex items-start gap-2 cursor-pointer">
          <input
            v-model="confirmed"
            type="checkbox"
            class="form-checkbox mt-0.5"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            I understand this will overwrite my current project configuration.
          </span>
        </label>

        <!-- Error -->
        <div v-if="restoreError" class="text-sm text-red-500 dark:text-red-400">
          {{ restoreError }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose" :disabled="isRestoring">Cancel</button>
        <button
          class="btn-primary"
          :class="{ 'btn-danger': true }"
          @click="handleRestore"
          :disabled="isRestoring || !confirmed"
        >
          {{ isRestoring ? 'Restoring...' : 'Restore' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
