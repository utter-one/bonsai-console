<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'
import { KeyRound, Eye, EyeOff } from 'lucide-vue-next'

const url = defineModel<string>('url', { required: true })
const method = defineModel<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('method', { required: true })
const headers = defineModel<{ key: string; value: string }[]>('headers', { required: true })
const body = defineModel<string>('body', { required: true })
const asyncReplyEnabled = defineModel<boolean>('asyncReplyEnabled')
const asyncReplyTimeoutMs = defineModel<number>('asyncReplyTimeoutMs')
const asyncReplySecret = defineModel<string>('asyncReplySecret')

const props = defineProps<{
  isLoading: boolean
  error: ParsedError | null
}>()

const isAsyncReplyEnabled = computed(() => asyncReplyEnabled.value ?? false)

const showSecret = ref(false)

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  headers.value.splice(index, 1)
}

function generateSecret() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  asyncReplySecret.value = Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
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

  <div class="mt-2">
    <label class="flex items-center cursor-pointer">
      <input
        v-model="asyncReplyEnabled"
        type="checkbox"
        class="form-checkbox"
        :disabled="isLoading"
      />
      <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Enable async reply
      </span>
    </label>
    <p class="text-xs text-gray-500 ml-6 dark:text-gray-400">
      Allow the external service to respond after the initial webhook call returns.
    </p>
  </div>

  <template v-if="isAsyncReplyEnabled">
    <div class="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 space-y-4">
      <FormField label="Timeout (ms)" required :error="error" path="asyncReplyTimeoutMs" class="w-full" help="Maximum time to wait for a reply (1000–600000ms)">
        <input
          v-model.number="asyncReplyTimeoutMs"
          type="number"
          min="1000"
          max="600000"
          step="1000"
          class="form-input font-mono"
          :disabled="isLoading"
          placeholder="300000"
        />
      </FormField>

      <FormField label="Reply Secret" required :error="error" path="asyncReplySecret" class="w-full" help="Secret used to authenticate replies. The external service must include this in its response.">
        <div class="flex gap-2">
          <input
            v-model="asyncReplySecret"
            :type="showSecret ? 'text' : 'password'"
            class="form-input font-mono flex-1"
            :disabled="isLoading"
            placeholder="Enter a secret string"
          />
          <button
            type="button"
            @click="showSecret = !showSecret"
            class="btn-secondary flex items-center justify-center"
            :disabled="isLoading"
            :title="showSecret ? 'Hide secret' : 'Show secret'"
          >
            <Eye v-if="!showSecret" :size="16" />
            <EyeOff v-else :size="16" />
          </button>
          <button
            type="button"
            @click="generateSecret"
            class="btn-secondary flex items-center justify-center"
            :disabled="isLoading"
            title="Generate random secret"
          >
            <KeyRound :size="16" />
          </button>
        </div>
      </FormField>
    </div>
  </template>
</template>
