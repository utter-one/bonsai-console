<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Select API Key</h2>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Select an API key to resume the conversation</p>
      </div>

      <!-- Empty State -->
      <div v-if="apiKeys.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
        <p>No active API keys found for this project</p>
      </div>

      <!-- API Key List -->
      <div v-else class="max-h-96 overflow-y-auto mb-6 border border-gray-200 rounded-lg dark:border-gray-700">
        <button
          v-for="apiKey in sortedApiKeys"
          :key="apiKey.id"
          @click="selectApiKey(apiKey)"
          class="w-full text-left px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <div class="font-medium text-gray-900 dark:text-white">{{ apiKey.name }}</div>
          <div v-if="apiKey.keyPreview" class="text-sm text-gray-600 mt-1 font-mono dark:text-gray-400">
            {{ apiKey.keyPreview }}...
          </div>
          <div v-if="apiKey.lastUsedAt" class="text-xs text-gray-500 mt-1 dark:text-gray-500">
            Last used: {{ new Date(apiKey.lastUsedAt).toLocaleString() }}
          </div>
        </button>
      </div>

      <!-- Footer -->
      <div class="flex justify-end">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApiKeyResponse } from '@/api/types'

const props = defineProps<{
  apiKeys: ApiKeyResponse[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', apiKeyId: string): void
}>()

// Sort API keys alphabetically by name
const sortedApiKeys = computed(() => {
  return [...props.apiKeys]
    .sort((a, b) => a.name.localeCompare(b.name))
})

function selectApiKey(apiKey: ApiKeyResponse) {
  emit('select', apiKey.id)
  emit('close')
}
</script>
