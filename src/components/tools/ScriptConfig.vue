<script setup lang="ts">
import type { ParsedError, ToolStorageConfig } from '@/api/types'
import JavaScriptEditor from '@/components/JavaScriptEditor.vue'
import FormField from '@/components/FormField.vue'
import StorageConfigSection from '@/components/tools/StorageConfigSection.vue'

const code = defineModel<string>({ required: true })
const storageConfig = defineModel<ToolStorageConfig | null>('storageConfig', { required: true })

const props = defineProps<{
  isLoading: boolean
  isReadOnly: boolean
  error: ParsedError | null
}>()
</script>

<template>
  <FormField label="Script Code" required :error="error" path="code" class="w-full" help="JavaScript code to execute when this tool is invoked. Has full flow control (stage navigation, end/abort conversation).">
    <JavaScriptEditor
      v-model="code"
      :disabled="isLoading || isReadOnly"
      show-toolbar
      min-height="28rem"
      />
    </FormField>

    <StorageConfigSection
      v-model:storage-config="storageConfig"
      :is-loading="isLoading"
      :error="error"
    />
  </template>
