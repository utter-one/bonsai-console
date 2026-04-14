<template>
  <BaseModal :title="title ?? 'Select Stage'" size="lg" @close="$emit('close')">
      
      <!-- Use default starting stage checkbox -->
      <div v-if="defaultStageId" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="useDefault"
            type="checkbox"
            class="form-checkbox"
          />
          <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">Use default starting stage</span>
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">The project's configured default starting stage will be used automatically.</p>
      </div>

      <template v-if="!useDefault">
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
      </template>

      <!-- Footer -->
      <div class="flex justify-end gap-2">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Close
        </button>
        <button v-if="useDefault" type="button" @click="selectDefault" class="btn-primary">
          Start
        </button>
      </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { useStagesStore } from '@/stores'
import type { StageResponse } from '@/api/types'

const props = defineProps<{
  projectId: string
  title?: string
  defaultStageId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', stage: StageResponse | null): void
}>()

const stagesStore = useStagesStore()

const useDefault = ref(!!props.defaultStageId)

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

function selectDefault() {
  emit('select', null)
  emit('close')
}

// Load stages on mount
onMounted(async () => {
  await stagesStore.fetchAll(props.projectId)
})
</script>
