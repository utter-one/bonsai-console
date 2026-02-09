<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Call Action</h2>

      <form @submit.prevent="handleSubmit">
        <!-- Action Type Selection -->
        <div class="form-group">
          <label class="form-label">
            Action Type <span class="text-red-500">*</span>
          </label>
          <select v-model="actionType" class="form-select" required @change="onActionTypeChange">
            <option value="">Select action type...</option>
            <option value="global">Global Action</option>
            <option value="stage">Stage Action (Current Stage)</option>
          </select>
        </div>

        <!-- Action Selection -->
        <div v-if="actionType" class="form-group">
          <label class="form-label">
            Action <span class="text-red-500">*</span>
          </label>
          <select v-model="selectedActionKey" class="form-select" required @change="onActionChange">
            <option value="">
              {{ actionType === 'global' ? 'Select global action...' : 'Select stage action...' }}
            </option>
            <option v-for="action in availableActions" :key="action.key" :value="action.key">
              {{ action.name }}
            </option>
          </select>
        </div>

        <!-- Parameters Section -->
        <div v-if="selectedAction && selectedAction.parameters.length > 0" class="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-200">Parameters</h3>
          
          <div v-for="param in selectedAction.parameters" :key="param.name" class="form-group">
            <label class="form-label">
              {{ param.name }}
              <span v-if="param.required" class="text-red-500">*</span>
            </label>
            <p v-if="param.description" class="text-sm text-gray-600 mb-2 dark:text-gray-400">
              {{ param.description }}
            </p>
            
            <!-- String input -->
            <input
              v-if="param.type === 'string'"
              v-model="parameters[param.name]"
              type="text"
              class="form-input"
              :required="param.required"
              :placeholder="`Enter ${param.name}...`"
            />
            
            <!-- Number input -->
            <input
              v-else-if="param.type === 'number'"
              v-model.number="parameters[param.name]"
              type="number"
              class="form-input"
              :required="param.required"
              :placeholder="`Enter ${param.name}...`"
            />
            
            <!-- Boolean input -->
            <div v-else-if="param.type === 'boolean'" class="flex items-center gap-2">
              <input
                v-model="parameters[param.name]"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="text-sm text-gray-700 dark:text-gray-200">Enable</span>
            </div>
            
            <!-- String array input -->
            <textarea
              v-else-if="param.type === 'string[]'"
              v-model="parameters[param.name]"
              class="form-textarea"
              rows="3"
              :required="param.required"
              :placeholder="`Enter ${param.name} (one per line)...`"
            />
            
            <!-- Number array input -->
            <textarea
              v-else-if="param.type === 'number[]'"
              v-model="parameters[param.name]"
              class="form-textarea"
              rows="3"
              :required="param.required"
              :placeholder="`Enter ${param.name} (one per line)...`"
            />
            
            <!-- Boolean array input -->
            <textarea
              v-else-if="param.type === 'boolean[]'"
              v-model="parameters[param.name]"
              class="form-textarea"
              rows="3"
              :required="param.required"
              :placeholder="`Enter ${param.name} (true/false, one per line)...`"
            />
          </div>
        </div>

        <!-- No parameters message -->
        <div v-else-if="selectedAction && selectedAction.parameters.length === 0" class="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <p class="text-sm text-gray-600 italic dark:text-gray-400">This action has no parameters.</p>
        </div>

        <!-- Error display -->
        <div v-if="errorMessage" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm mt-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
          {{ errorMessage }}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="!selectedActionKey || isSubmitting"
          >
            {{ isSubmitting ? 'Calling...' : 'Call' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GlobalActionResponse, StageResponse } from '@/api/types'

const props = defineProps<{
  globalActions: GlobalActionResponse[]
  currentStage: StageResponse | null
}>()

const emit = defineEmits<{
  close: []
  call: [data: { type: 'global' | 'stage'; actionKey: string; parameters: Record<string, any> }]
}>()

// State
const actionType = ref<'global' | 'stage' | ''>('')
const selectedActionKey = ref('')
const parameters = ref<Record<string, any>>({})
const errorMessage = ref('')
const isSubmitting = ref(false)

// Available actions based on type
const availableActions = computed(() => {
  if (actionType.value === 'global') {
    return props.globalActions.map(action => ({
      key: action.id,
      name: action.name,
      parameters: [] // Global actions don't have explicit parameters in this structure
    }))
  } else if (actionType.value === 'stage' && props.currentStage) {
    return Object.entries(props.currentStage.actions || {}).map(([key, action]) => ({
      key,
      name: action.name,
      parameters: action.parameters || []
    }))
  }
  return []
})

// Get selected action details
const selectedAction = computed(() => {
  if (!selectedActionKey.value) return null
  return availableActions.value.find(a => a.key === selectedActionKey.value) || null
})

// Handlers
function onActionTypeChange() {
  selectedActionKey.value = ''
  parameters.value = {}
  errorMessage.value = ''
}

function onActionChange() {
  parameters.value = {}
  errorMessage.value = ''
  
  // Initialize parameters with default values
  if (selectedAction.value) {
    selectedAction.value.parameters.forEach(param => {
      if (param.type === 'boolean') {
        parameters.value[param.name] = false
      } else if (param.type === 'string[]' || param.type === 'number[]' || param.type === 'boolean[]') {
        parameters.value[param.name] = ''
      } else {
        parameters.value[param.name] = ''
      }
    })
  }
}

function handleSubmit() {
  errorMessage.value = ''
  
  if (!actionType.value || !selectedActionKey.value) {
    errorMessage.value = 'Please select an action type and action.'
    return
  }
  
  // Process array parameters from textarea input
  const processedParams: Record<string, any> = {}
  
  if (selectedAction.value) {
    for (const param of selectedAction.value.parameters) {
      const value = parameters.value[param.name]
      
      // Handle array types - convert from textarea string to array
      if (param.type === 'string[]') {
        processedParams[param.name] = value ? value.split('\n').filter((line: string) => line.trim()) : []
      } else if (param.type === 'number[]') {
        processedParams[param.name] = value 
          ? value.split('\n').filter((line: string) => line.trim()).map((line: string) => parseFloat(line))
          : []
      } else if (param.type === 'boolean[]') {
        processedParams[param.name] = value
          ? value.split('\n').filter((line: string) => line.trim()).map((line: string) => line.toLowerCase() === 'true')
          : []
      } else {
        processedParams[param.name] = value
      }
      
      // Validate required parameters
      if (param.required) {
        const paramValue = processedParams[param.name]
        if (paramValue === '' || paramValue === null || paramValue === undefined || 
            (Array.isArray(paramValue) && paramValue.length === 0)) {
          errorMessage.value = `Parameter "${param.name}" is required.`
          return
        }
      }
    }
  }
  
  isSubmitting.value = true
  emit('call', {
    type: actionType.value as 'global' | 'stage',
    actionKey: selectedActionKey.value,
    parameters: processedParams
  })
  
  // Reset submitting state after a short delay (in case the parent doesn't close the modal immediately)
  setTimeout(() => {
    isSubmitting.value = false
  }, 1000)
}

// Reset form when modal is opened/closed
watch(() => props.currentStage, () => {
  if (actionType.value === 'stage') {
    selectedActionKey.value = ''
    parameters.value = {}
  }
})
</script>
