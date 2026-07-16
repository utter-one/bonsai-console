<script setup lang="ts">
import { computed } from 'vue'
import FormField from '@/components/FormField.vue'
import type { ToolStorageConfig } from '@/api/types'

const storageConfig = defineModel<ToolStorageConfig | null>('storageConfig', { required: true })

const props = defineProps<{
  isLoading: boolean
  error: any
}>()

const isConfigured = computed(() => !!storageConfig.value?.fileName)

function enable() {
  if (!storageConfig.value) {
    storageConfig.value = { fileName: '', mimeType: '' }
  }
}

function disable() {
  storageConfig.value = null
}
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900">
      <div>
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Store Result as File</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Upload the tool result to storage. Use the Attach File effect to include it in conversation output.
        </p>
      </div>
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          :checked="isConfigured"
          @change="isConfigured ? disable() : enable()"
          class="form-checkbox"
          :disabled="isLoading"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enabled</span>
      </label>
    </div>
    <div v-if="isConfigured" class="p-4 space-y-3">
      <FormField label="File Name" required :error="error" path="storageConfig.fileName" class="w-full" help="Display name for the stored file. Supports Handlebars templating (e.g. {{params.filename}})">
        <input
          v-model="storageConfig!.fileName"
          type="text"
          placeholder="report.pdf"
          class="form-input font-mono"
          :disabled="isLoading"
        />
      </FormField>
      <FormField label="MIME Type" required :error="error" path="storageConfig.mimeType" class="w-full" help="MIME type for the stored file (e.g. application/pdf, image/png)">
        <input
          v-model="storageConfig!.mimeType"
          type="text"
          placeholder="application/pdf"
          class="form-input font-mono"
          :disabled="isLoading"
        />
      </FormField>
    </div>
  </div>
</template>
