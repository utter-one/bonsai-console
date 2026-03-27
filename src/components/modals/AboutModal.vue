<script setup lang="ts">
import { onMounted } from 'vue'
import { useVersionStore } from '@/stores'
import BaseModal from '@/components/BaseModal.vue'

defineEmits<{ close: [] }>()

const versionStore = useVersionStore()

onMounted(() => {
  versionStore.fetchVersion()
})
</script>

<template>
  <BaseModal title="About Bonsai Console" size="md" @close="$emit('close')">
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
  </BaseModal>
</template>
