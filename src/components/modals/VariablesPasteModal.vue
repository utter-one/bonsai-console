<template>
  <BaseModal title="Paste Variables" size="3xl" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <FormField label="Select Variables to Paste" class="w-full">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Choose which top-level variables to paste into this stage. Variables with duplicate names will overwrite existing ones.
          </p>
          
          <div class="border border-gray-300 dark:border-gray-600 rounded-lg max-h-96 overflow-y-auto">
            <div v-if="availableVariables.length === 0" class="text-center py-8 text-gray-500">
              No variables in clipboard
            </div>
            
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <label
                v-for="variable in availableVariables"
                :key="variable.index"
                class="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  v-model="selectedIndices"
                  type="checkbox"
                  :value="variable.index"
                  class="form-checkbox mt-1"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-gray-900 dark:text-white font-mono">{{ variable.descriptor.name }}</span>
                    <span v-if="variable.willOverwrite" class="text-yellow-600 dark:text-yellow-400" title="This will overwrite an existing variable">
                      ⚠️
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span class="badge-secondary">{{ variable.descriptor.type }}</span>
                    <span v-if="variable.descriptor.isArray" class="badge-secondary">Array</span>
                    <span v-if="isObjectType(variable.descriptor)" class="text-gray-500">
                      {{ getNestedFieldCount(variable.descriptor) }} nested field(s)
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </FormField>

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
            <button type="submit" class="btn-primary" :disabled="selectedIndices.length === 0">
              Paste {{ selectedIndices.length }} Variable(s)
            </button>
          </div>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'

type VariableDescriptor = {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
  isArray: boolean
  objectSchema?: Array<any>
}

const props = defineProps<{
  clipboardVariables: VariableDescriptor[]
  existingNames: string[]
}>()

const emit = defineEmits<{
  close: []
  save: [indices: number[]]
}>()

const selectedIndices = ref<number[]>([])

const availableVariables = computed(() => {
  return props.clipboardVariables.map((descriptor, index) => ({
    index,
    descriptor,
    willOverwrite: props.existingNames.includes(descriptor.name)
  }))
})

function isObjectType(descriptor: VariableDescriptor) {
  return descriptor.type === 'object' || descriptor.type === 'object[]'
}

function getNestedFieldCount(descriptor: VariableDescriptor) {
  return descriptor.objectSchema?.length || 0
}

// Auto-select all variables by default
if (availableVariables.value.length > 0) {
  selectedIndices.value = availableVariables.value.map(v => v.index)
}

function selectAll() {
  selectedIndices.value = availableVariables.value.map(v => v.index)
}

function selectNone() {
  selectedIndices.value = []
}

function handleSubmit() {
  if (selectedIndices.value.length > 0) {
    emit('save', selectedIndices.value)
  }
}
</script>
