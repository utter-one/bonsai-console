<template>
  <div class="modal-overlay">
    <div class="modal-content max-w-3xl" @click.stop>
      <h2 class="modal-header">
        Paste Actions
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">
            Select Actions to Paste
          </label>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Choose which actions to paste into this stage. Actions with duplicate keys will overwrite existing ones.
          </p>
          
          <div class="border border-gray-300 dark:border-gray-600 rounded-lg max-h-96 overflow-y-auto">
            <div v-if="availableActions.length === 0" class="text-center py-8 text-gray-500">
              No actions in clipboard
            </div>
            
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <label
                v-for="action in availableActions"
                :key="action.key"
                class="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  v-model="selectedKeys"
                  type="checkbox"
                  :value="action.key"
                  class="form-checkbox mt-1"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">{{ action.key }}</code>
                    <span class="font-medium text-gray-900 dark:text-white">{{ action.action.name }}</span>
                    <span v-if="action.willOverwrite" class="text-yellow-600 dark:text-yellow-400" title="This will overwrite an existing action">
                      ⚠️
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span v-if="action.action.triggerOnUserInput" class="badge-primary">User Input</span>
                    <span v-if="action.action.triggerOnClientCommand" class="badge-primary">Client Command</span>
                    <span v-if="action.action.triggerOnTransformation" class="badge-primary">Transformation</span>
                    <span v-if="action.action.classificationTrigger" class="text-gray-500">
                      Classification: <code class="font-mono">{{ action.action.classificationTrigger }}</code>
                    </span>
                    <span class="text-gray-500">{{ action.action.effects?.length || 0 }} effect(s)</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="flex gap-2">
            <button type="button" @click="selectAll" class="btn-secondary">
              Select All
            </button>
            <button type="button" @click="selectNone" class="btn-secondary">
              Select None
            </button>
          </div>
          <div class="flex gap-2">
            <button type="button" @click="$emit('close')" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="selectedKeys.length === 0">
              Paste {{ selectedKeys.length }} Action(s)
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StageAction } from '@/api/types'

const props = defineProps<{
  clipboardActions: Record<string, StageAction>
  existingKeys: string[]
}>()

const emit = defineEmits<{
  close: []
  save: [keys: string[]]
}>()

const selectedKeys = ref<string[]>([])

const availableActions = computed(() => {
  return Object.entries(props.clipboardActions)
    .map(([key, action]) => ({ 
      key, 
      action,
      willOverwrite: props.existingKeys.includes(key)
    }))
})

// Auto-select all actions by default
if (availableActions.value.length > 0) {
  selectedKeys.value = availableActions.value.map(a => a.key)
}

function selectAll() {
  selectedKeys.value = availableActions.value.map(a => a.key)
}

function selectNone() {
  selectedKeys.value = []
}

function handleSubmit() {
  if (selectedKeys.value.length > 0) {
    emit('save', selectedKeys.value)
  }
}
</script>
