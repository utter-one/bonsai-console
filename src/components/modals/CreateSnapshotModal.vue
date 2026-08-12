<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { useSnapshotsStore } from '@/stores'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { projectId } = defineProps<{
  projectId: string
}>()

const snapshotsStore = useSnapshotsStore()
const name = ref('')
const isCreating = ref(false)
const createError = ref<string | null>(null)

async function handleCreate() {
  isCreating.value = true
  createError.value = null
  try {
    await snapshotsStore.create(projectId, { name: name.value || null })
    emit('saved')
    emit('close')
  } catch (err: any) {
    createError.value = err.message || 'Failed to create snapshot'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <BaseModal title="Create Snapshot" size="md" @close="$emit('close')">
    <div class="flex flex-col gap-4">
      <FormField
        label="Name"
        :error="createError"
        help-text="Optional label to identify this snapshot."
      >
        <input
          v-model="name"
          type="text"
          maxlength="256"
          class="form-input w-full"
          placeholder="e.g., before migrating to Claude 3"
          @keyup.enter="handleCreate"
        />
      </FormField>

      <div class="alert-info">
        <p class="text-sm">
          This snapshot will capture the current state of all your project's configuration (agents, stages, classifiers, tools, etc.).
        </p>
      </div>
    </div>

    <div v-if="createError" class="mt-4 text-sm text-red-500 dark:text-red-400">
      {{ createError }}
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" @click="$emit('close')" :disabled="isCreating">Cancel</button>
      <button class="btn-primary" @click="handleCreate" :disabled="isCreating">
        {{ isCreating ? 'Creating...' : 'Create Snapshot' }}
      </button>
    </div>
  </BaseModal>
</template>
