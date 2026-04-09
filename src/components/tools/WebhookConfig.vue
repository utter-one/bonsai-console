<script setup lang="ts">
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

const url = defineModel<string>('url', { required: true })
const method = defineModel<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('method', { required: true })
const headers = defineModel<{ key: string; value: string }[]>('headers', { required: true })
const body = defineModel<string>('body', { required: true })

const props = defineProps<{
  isLoading: boolean
  error: ParsedError | null
}>()

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  headers.value.splice(index, 1)
}
</script>

<template>
  <FormField label="URL" required :error="error" path="url" class="w-full" help="The endpoint URL to call when this tool is invoked">
    <input
      v-model="url"
      type="url"
      placeholder="https://example.com/webhook"
      class="form-input font-mono"
      :disabled="isLoading"
    />
  </FormField>

  <FormField label="HTTP Method" :error="error" path="webhookMethod">
    <select v-model="method" class="form-select-auto" :disabled="isLoading">
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="PATCH">PATCH</option>
      <option value="DELETE">DELETE</option>
    </select>
  </FormField>

  <FormField label="Headers" class="w-full">
    <div class="space-y-2">
      <div
        v-for="(header, index) in headers"
        :key="index"
        class="flex gap-2 items-center"
      >
        <input
          v-model="header.key"
          type="text"
          placeholder="Header name"
          class="form-input font-mono flex-1"
          :disabled="isLoading"
        />
        <input
          v-model="header.value"
          type="text"
          placeholder="Value"
          class="form-input font-mono flex-1"
          :disabled="isLoading"
        />
        <button
          type="button"
          @click="removeHeader(index)"
          class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 shrink-0"
          :disabled="isLoading"
        >
          Remove
        </button>
      </div>
      <button
        type="button"
        @click="addHeader"
        class="btn-secondary"
        :disabled="isLoading"
      >
        + Add Header
      </button>
    </div>
  </FormField>

  <FormField label="Request Body Template" :error="error" path="webhookBody" class="w-full" help="Template for the request body sent to the webhook endpoint">
    <textarea
      v-model="body"
      rows="6"
      class="form-textarea font-mono"
      placeholder='{"param": context.params.myParam}'
      :disabled="isLoading"
    ></textarea>
  </FormField>
</template>
