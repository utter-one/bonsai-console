<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-5xl max-h-[90vh] flex flex-col" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Stage Variables</h2>
        <button @click="$emit('close')" class="btn-icon" title="Close">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <VariableNode :data="variables" :path="[]" :is-root="true" />
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" @click="copyToClipboard" class="btn-secondary">
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
import { ref } from 'vue'
import { X, Copy } from 'lucide-vue-next'
import VariableNode from './VariableNode.vue'

const props = defineProps<{
  variables: Record<string, any>
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

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
