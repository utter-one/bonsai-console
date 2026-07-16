<template>
  <BaseModal title="Trigger External Action" size="lg" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Trigger an action with external triggering enabled in an active conversation. This uses the REST API endpoint and does not require a WebSocket connection.
      </p>

      <!-- Session ID -->
      <div class="form-group">
        <label class="form-label">
          Session ID <span class="text-gray-500">(optional)</span>
        </label>
        <input
          v-model="sessionId"
          type="text"
          class="form-input font-mono"
          placeholder="Auto-detected when single session exists"
        />
        <p class="form-help-text">
          Required when multiple sessions exist for the conversation.
        </p>
      </div>

      <!-- Action Selection -->
      <div class="form-group">
        <label class="form-label">
          Action <span class="text-red-500">*</span>
        </label>
        <select v-model="selectedActionName" class="form-select" required>
          <option value="">Select action...</option>
          <option v-for="action in externalActions" :key="action.id" :value="action.id">
            {{ action.name }}
          </option>
        </select>
        <p v-if="externalActions.length === 0" class="form-help-text">
          No actions with external triggering enabled. Enable it in the action's Trigger settings.
        </p>
      </div>

      <!-- Parameters -->
      <div class="form-group">
        <label class="form-label">
          Parameters <span class="text-gray-500">(optional)</span>
        </label>
        <textarea
          v-model="parametersJson"
          class="form-textarea font-mono"
          rows="4"
          placeholder='{"key": "value"}'
        />
        <p class="form-help-text">
          JSON object with parameters to pass to the action.
        </p>
      </div>

      <!-- Result -->
      <div v-if="result" class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Result</h3>
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-sm overflow-auto max-h-64">
          <pre class="m-0">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="alert-error mt-4">
        {{ errorMessage }}
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Close
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="!selectedActionName || isSubmitting || externalActions.length === 0"
        >
          {{ isSubmitting ? 'Triggering...' : 'Trigger Action' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import BaseModal from '@/components/BaseModal.vue'
import type { GlobalActionResponse, ExternalTriggerResponse } from '@/api/types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const props = defineProps<{
  globalActions: GlobalActionResponse[]
  conversationId: string
  apiKey: string | undefined
}>()

const emit = defineEmits<{
  close: []
}>()

const sessionId = ref('')
const selectedActionName = ref('')
const parametersJson = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const result = ref<ExternalTriggerResponse | null>(null)

const externalActions = computed(() => {
  return props.globalActions.filter(action => action.triggerOnExternal)
})

async function handleSubmit() {
  errorMessage.value = ''
  result.value = null

  if (!selectedActionName.value || !props.apiKey) {
    errorMessage.value = 'Please select an action and ensure an API key is configured.'
    return
  }

  let parameters: Record<string, any> | undefined = undefined
  if (parametersJson.value.trim()) {
    try {
      parameters = JSON.parse(parametersJson.value)
    } catch (e) {
      errorMessage.value = `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`
      return
    }
  }

  isSubmitting.value = true
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/conversations/trigger`,
      {
        conversationId: props.conversationId,
        sessionId: sessionId.value || undefined,
        actionName: selectedActionName.value,
        parameters: parameters || {},
      },
      {
        headers: {
          Authorization: `Bearer ${props.apiKey!}`,
          'Content-Type': 'application/json',
        },
      },
    )
    result.value = response.data
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Failed to trigger action'
    errorMessage.value = msg
  } finally {
    isSubmitting.value = false
  }
}
</script>
