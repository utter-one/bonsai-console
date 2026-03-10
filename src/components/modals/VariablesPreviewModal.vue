<template>
  <div class="modal-overlay">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-5xl max-h-[90vh] flex flex-col" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Stage Variables</h2>
      </div>
      
      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div v-if="isEmpty" class="text-center text-gray-500 dark:text-gray-400 italic">
            No variables
          </div>
          <VariableNode v-else :data="variables" :path="[]" :is-root="true" />
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" @click="copyToClipboard" class="btn-secondary gap-2 py-2.5">
          <Copy class="w-4 h-4" />
          {{ copied ? 'Copied!' : 'Copy to Clipboard' }}
        </button>
        <button type="button" @click="$emit('close')" class="btn-primary">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy } from 'lucide-vue-next'
import VariableNode from './VariableNode.vue'

const props = defineProps<{
  variables: Record<string, any>
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

const isEmpty = computed(() => {
  return !props.variables || Object.keys(props.variables).length === 0
})

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.variables, null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}
</script>
