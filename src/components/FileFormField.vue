<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, Download, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: { base64: string; mimeType: string; fileName: string } | null
  accept?: string
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { base64: string; mimeType: string; fileName: string } | null]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const hasFile = computed(() => !!props.modelValue?.base64)
const displayName = computed(() => props.modelValue?.fileName || 'unknown')
const displayMime = computed(() => props.modelValue?.mimeType || '')

function openPicker() {
  fileInputRef.value?.click()
}

function handleChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    const base64 = dataUrl.split(',')[1] || ''
    emit('update:modelValue', {
      base64,
      mimeType: file.type,
      fileName: file.name || 'unknown',
    })
  }
  reader.readAsDataURL(file)
  // Reset so re-selecting the same file still fires change
  ;(event.target as HTMLInputElement).value = ''
}

function clearFile() {
  emit('update:modelValue', null)
}

function download() {
  if (!props.modelValue?.base64) return
  const { base64, mimeType, fileName } = props.modelValue
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob = new Blob([arr], { type: mimeType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'file'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :disabled="disabled"
      class="sr-only"
      tabindex="-1"
      @change="handleChange"
    />

    <div
      class="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-sm"
      :class="hasFile
        ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
        : 'border-dashed border-gray-300 dark:border-gray-600 bg-transparent'"
    >
      <span v-if="hasFile" class="flex-1 text-gray-800 dark:text-gray-200 truncate font-medium">
        {{ displayName }}
        <span v-if="displayMime" class="font-normal text-gray-400 dark:text-gray-500 ml-1">({{ displayMime }})</span>
      </span>
      <span v-else class="flex-1 text-gray-400 dark:text-gray-500 italic">
        {{ placeholder ?? 'No file selected' }}
      </span>
    </div>

    <button
      v-if="hasFile"
      type="button"
      :disabled="disabled"
      class="btn-secondary btn-sm shrink-0"
      title="Download file"
      @click="download"
    >
      <Download class="w-3.5 h-3.5 mr-1 inline-block" />
      Download
    </button>

    <button
      type="button"
      :disabled="disabled"
      class="btn-secondary btn-sm shrink-0"
      @click="openPicker"
    >
      <Upload class="w-3.5 h-3.5 mr-1 inline-block" />
      {{ hasFile ? 'Replace' : 'Choose file' }}
    </button>

    <button
      v-if="hasFile"
      type="button"
      :disabled="disabled"
      class="btn-icon text-gray-400 hover:text-red-500 dark:hover:text-red-400 shrink-0"
      title="Remove file"
      @click="clearFile"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
