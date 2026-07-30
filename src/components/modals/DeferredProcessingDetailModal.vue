<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDeferredProcessingStore } from '@/stores'
import BaseModal from '@/components/BaseModal.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { Clock, XCircle, CheckCircle, AlertTriangle, Hourglass } from 'lucide-vue-next'
import type { DeferredProcessingEntry } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  entry: DeferredProcessingEntry | null
  projectId: string
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const store = useDeferredProcessingStore()

const isProcessing = ref(false)

function handleClose() {
  emit('close')
}

async function handleReschedule() {
  if (!props.entry) return
  isProcessing.value = true
  try {
    await store.reschedule(props.projectId, props.entry.id, new Date().toISOString())
    emit('refresh')
    emit('close')
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to reschedule entry')
  } finally {
    isProcessing.value = false
  }
}

async function handleCancel() {
  if (!props.entry) return
  if (!confirm(`Cancel deferred processing entry ${props.entry.id}?`)) return
  isProcessing.value = true
  try {
    await store.cancel(props.projectId, props.entry.id)
    emit('refresh')
    emit('close')
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to cancel entry')
  } finally {
    isProcessing.value = false
  }
}

function formatChannelType(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'badge-warning'
    case 'processed': return 'badge-success'
    case 'failed': return 'badge-error'
    case 'cancelled': return 'badge-secondary'
    default: return 'badge'
  }
}

function statusIcon(status: string): any {
  switch (status) {
    case 'pending': return Hourglass
    case 'processed': return CheckCircle
    case 'failed': return AlertTriangle
    case 'cancelled': return XCircle
    default: return Clock
  }
}

function formatMessage(message: Record<string, any>): string {
  try {
    return JSON.stringify(message, null, 2)
  } catch {
    return String(message)
  }
}

const isPending = computed(() => props.entry?.status === 'pending')
</script>

<template>
  <BaseModal
    :model-value="true"
    size="3xl"
    title="Deferred Processing Entry"
    @close="handleClose"
  >
    <div v-if="entry" class="space-y-6">
      <!-- Status and Channel -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Status</label>
          <span class="badge" :class="statusBadgeClass(entry.status)">
            <component :is="statusIcon(entry.status)" class="inline-block mr-1 w-3 h-3" />
            {{ entry.status }}
          </span>
        </div>
        <div>
          <label class="form-label">Channel Type</label>
          <p class="text-sm text-gray-900 dark:text-white">{{ formatChannelType(entry.channelType) }}</p>
        </div>
      </div>

      <!-- Identifiers -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Entry ID</label>
          <div class="flex items-center gap-2">
            <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ entry.id }}</code>
          </div>
        </div>
        <div>
          <label class="form-label">Session ID</label>
          <div class="flex items-center gap-2">
            <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ entry.sessionId }}</code>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Provider ID</label>
          <div class="flex items-center gap-2">
            <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ entry.providerId }}</code>
          </div>
        </div>
        <div>
          <label class="form-label">Conversation ID</label>
          <div class="flex items-center gap-2">
            <code v-if="entry.conversationId" class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ entry.conversationId }}</code>
            <span v-else class="text-sm text-gray-400">—</span>
          </div>
        </div>
      </div>

      <!-- Timing -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Scheduled Process At</label>
          <p class="text-sm text-gray-900 dark:text-white">
            <RelativeDate v-if="entry.processAt" :date="entry.processAt" />
            <span v-else class="text-gray-400">—</span>
          </p>
        </div>
        <div>
          <label class="form-label">Retry Count</label>
          <p class="text-sm text-gray-900 dark:text-white">{{ entry.retryCount }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="form-label">Created</label>
          <p class="text-sm text-gray-900 dark:text-white">
            <RelativeDate :date="entry.createdAt || new Date().toISOString()" />
          </p>
        </div>
        <div>
          <label class="form-label">Updated</label>
          <p class="text-sm text-gray-900 dark:text-white">
            <RelativeDate :date="entry.updatedAt || new Date().toISOString()" />
          </p>
        </div>
        <div>
          <label class="form-label">Processed</label>
          <p class="text-sm text-gray-900 dark:text-white">
            <RelativeDate v-if="entry.processedAt" :date="entry.processedAt" />
            <span v-else class="text-gray-400">—</span>
          </p>
        </div>
      </div>

      <!-- Last Error -->
      <div v-if="entry.lastError">
        <label class="form-label">Last Error</label>
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <pre class="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">{{ entry.lastError }}</pre>
        </div>
      </div>

      <!-- Message -->
      <div>
        <label class="form-label">Original Message</label>
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-60 overflow-auto">
          <pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{{ formatMessage(entry.message) }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <button @click="handleClose" class="btn-secondary">Close</button>
        <button v-if="isPending" @click="handleCancel" :disabled="isProcessing" class="btn-danger">
          <XCircle class="inline-block mr-2 w-4 h-4" />
          Cancel
        </button>
        <button v-if="isPending" @click="handleReschedule" :disabled="isProcessing" class="btn-primary">
          <Clock class="inline-block mr-2 w-4 h-4" />
          Process Now
        </button>
      </div>
    </template>
  </BaseModal>
</template>
