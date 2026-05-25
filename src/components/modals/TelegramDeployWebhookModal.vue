<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import apiClient from '@/api/client'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import type { ProviderResponse, ApiKeyResponse } from '@/api/types'
import { useProjectsStore, useApiKeysStore } from '@/stores'
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  provider: ProviderResponse
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()

const form = ref({
  projectId: '',
  apiKeyId: '',
  origin: '',
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref<{ webhookUrl: string; telegramResponse?: any } | null>(null)

const activeProjects = computed(() =>
  projectsStore.items.filter(p => !p.archivedAt)
)

const projectApiKeys = computed(() =>
  apiKeysStore.items.filter(k => k.isActive)
)

const selectedApiKey = computed<ApiKeyResponse | undefined>(() =>
  apiKeysStore.items.find(k => k.id === form.value.apiKeyId)
)

const isValid = computed(() => form.value.projectId && form.value.apiKeyId)

watch(() => form.value.projectId, async (newProjectId) => {
  form.value.apiKeyId = ''
  if (newProjectId) {
    await apiKeysStore.fetchAll(newProjectId, { filters: { isActive: true } })
  } else {
    apiKeysStore.items = []
  }
})

onMounted(() => {
  loadProjects()
})

async function loadProjects() {
  if (projectsStore.items.length === 0) {
    await projectsStore.fetchAll({ orderBy: 'name' })
  }
}

async function handleSubmit() {
  submitError.value = null
  submitSuccess.value = null
  isSubmitting.value = true

  try {
    const selectedKey = selectedApiKey.value!
    const apiKeyValue = selectedKey.key || selectedKey.id

    const response: any = await apiClient.telegramDeployWebhookCreate({
      channelProviderId: props.provider.id,
      apiKey: apiKeyValue,
      ...(form.value.origin.trim() ? { origin: form.value.origin.trim() } : {}),
    })

    if (response.success) {
      submitSuccess.value = {
        webhookUrl: response.webhookUrl,
        telegramResponse: response.telegramResponse,
      }
    } else {
      submitError.value = response.error || 'Webhook deployment failed'
    }
  } catch (err: any) {
    submitError.value = err.response?.data?.message || 'Failed to deploy webhook. Please check your API key and try again.'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal title="Deploy Telegram Webhook" size="md" @close="handleClose">
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Register the server webhook URL with the Telegram Bot API so incoming messages are forwarded to this instance.
    </p>

    <div v-if="!submitSuccess" class="space-y-4">
      <div class="card-info border border-gray-200 dark:border-gray-700 mb-4">
        <div class="text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Provider:</span>
            <span class="font-medium">{{ provider.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Provider ID:</span>
            <span class="font-mono text-xs">{{ provider.id }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <FormField label="Project" path="projectId" :error="null" required class="w-full" help="Select the project whose API key will authenticate incoming webhook requests.">
          <select v-model="form.projectId" class="form-select">
            <option value="" disabled>Select a project</option>
            <option v-for="project in activeProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </FormField>

        <FormField label="API Key" path="apiKeyId" :error="null" required class="w-full" help="The API key embedded in the webhook URL for callback authentication.">
          <select v-model="form.apiKeyId" class="form-select" :disabled="!form.projectId">
            <option value="" disabled>Select an API key</option>
            <option v-for="key in projectApiKeys" :key="key.id" :value="key.id">
              {{ key.name }}{{ key.keyPreview ? ` (${key.keyPreview}...)` : '' }}
            </option>
          </select>
        </FormField>

        <FormField label="Origin" path="origin" :error="null" class="w-full" help="Custom origin (protocol + host) for the webhook URL, e.g. https://api.example.com. Leave empty to auto-detect.">
          <input
            v-model="form.origin"
            type="text"
            class="form-input"
            placeholder="https://api.example.com"
          />
        </FormField>

        <div v-if="submitError" class="alert-error flex items-start gap-2">
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ submitError }}</span>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="alert-success flex items-start gap-3">
        <CheckCircle2 class="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p class="font-medium">Webhook deployed successfully!</p>
          <p class="text-sm mt-1">The Telegram Bot API will now forward messages to:</p>
          <code class="block mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded break-all">{{ submitSuccess.webhookUrl }}</code>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <template v-if="!submitSuccess">
          <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!isValid || isSubmitting"
            @click="handleSubmit"
          >
            <Loader2 v-if="isSubmitting" class="inline-block mr-1.5 w-4 h-4 animate-spin" />
            <Send v-else class="inline-block mr-1.5 w-4 h-4" />
            {{ isSubmitting ? 'Deploying...' : 'Deploy Webhook' }}
          </button>
        </template>
        <template v-else>
          <div class="flex-1" />
          <button type="button" class="btn-primary" @click="handleClose">Done</button>
        </template>
      </div>
    </template>
  </BaseModal>
</template>
