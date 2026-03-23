<script setup lang="ts">
import { onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useVersionStore } from '@/stores'

defineEmits<{ close: [] }>()

const versionStore = useVersionStore()

onMounted(() => {
  versionStore.fetchVersion()
})
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content max-w-lg w-full">
      <div class="flex items-center justify-between mb-5">
        <h2 class="modal-header m-0 mb-0">About Bonsai Console</h2>
        <button class="btn-icon" @click="$emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div v-if="versionStore.isLoading" class="text-sm text-gray-500 dark:text-gray-400">
        Loading version info...
      </div>
      <div v-else-if="versionStore.error" class="text-sm text-red-500 dark:text-red-400">
        {{ versionStore.error }}
      </div>
      <div v-else-if="versionStore.versionData" class="flex flex-col gap-3">
        <div class="flex items-baseline gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 flex-shrink-0">Version</span>
          <span class="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">{{ versionStore.versionData.version }}</span>
        </div>
        <div class="flex items-baseline gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 flex-shrink-0">REST Schema Hash</span>
          <span class="text-sm font-mono text-gray-900 dark:text-gray-100">{{ versionStore.versionData.restSchemaHash }}</span>
        </div>
        <div class="flex items-baseline gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 flex-shrink-0">WebSocket Schema Hash</span>
          <span class="text-sm font-mono text-gray-900 dark:text-gray-100">{{ versionStore.versionData.wsSchemaHash }}</span>
        </div>
        <div class="flex items-baseline gap-4 py-2.5">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 flex-shrink-0">Git Commit Hash</span>
          <span class="text-sm font-mono text-gray-900 dark:text-gray-100">{{ versionStore.versionData.gitCommit ?? 'N/A' }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
