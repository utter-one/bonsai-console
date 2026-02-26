<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">{{ title }}</h2>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Select a stage to continue</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">Loading stages...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-6 text-center text-red-600 dark:text-red-400">
        <p>Error loading stages: {{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="sortedStages.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
        <p>No stages found for this project</p>
      </div>

      <!-- Stage List -->
      <div v-else class="max-h-96 overflow-y-auto mb-6 border border-gray-200 rounded-lg dark:border-gray-700">
        <button
          v-for="stage in sortedStages"
          :key="stage.id"
          @click="selectStage(stage)"
          class="w-full text-left px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <div class="font-medium text-gray-900 dark:text-white">{{ stage.name }}</div>
          <div v-if="stage.description" class="text-sm text-gray-600 mt-1 dark:text-gray-400">
            {{ stage.description }}
          </div>
        </button>
      </div>

      <!-- Footer -->
      <div class="flex justify-end">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStagesStore } from '@/stores'
import type { StageResponse } from '@/api/types'

const props = defineProps<{
  projectId: string
  flowId?: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', stage: StageResponse): void
}>()

const stagesStore = useStagesStore()

const isLoading = computed(() => stagesStore.isLoading)
const error = computed(() => stagesStore.error)

// Sort stages alphabetically by name
const sortedStages = computed(() => {
  return [...stagesStore.items]
    .sort((a, b) => a.name.localeCompare(b.name))
})

function selectStage(stage: StageResponse) {
  emit('select', stage)
  emit('close')
}

// Load stages on mount
onMounted(async () => {
  if (!stagesStore.items.length && props.flowId) {
    await stagesStore.fetchAll(props.projectId, props.flowId)
  }
})
</script>
