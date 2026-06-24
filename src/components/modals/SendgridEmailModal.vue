<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore, useProvidersStore, useStagesStore, useApiKeysStore } from '@/stores'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const conversationsStore = useConversationsStore()
const providersStore = useProvidersStore()
const stagesStore = useStagesStore()
const apiKeysStore = useApiKeysStore()

const form = ref({
  channelProviderId: '',
  apiKeyId: '',
  to: '',
  subject: '',
  stageId: '',
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const sendgridProviders = computed(() =>
  providersStore.items.filter(p => p.apiType === 'sendgrid')
)

const activeApiKeys = computed(() =>
  apiKeysStore.items.filter(k => k.isActive)
)

const selectedApiKey = computed(() =>
  apiKeysStore.items.find(k => k.id === form.value.apiKeyId)
)

onMounted(async () => {
  await Promise.all([
    providersStore.fetchAll({ filters: { providerType: 'channel' } }),
    stagesStore.fetchAll(props.projectId, { limit: 1000 }),
    apiKeysStore.fetchAll(props.projectId, { filters: { isActive: true } }),
  ])
})

const isValid = computed(() =>
  form.value.channelProviderId && form.value.apiKeyId && selectedApiKey.value?.key && form.value.to
)

async function handleSubmit() {
  submitError.value = null
  isSubmitting.value = true
  try {
    // @ts-ignore - SendGrid channel removed from backend
    const conversationId = await conversationsStore.initiateSendgrid({
      apiKey: selectedApiKey.value!.key!,
      channelProviderId: form.value.channelProviderId,
      to: form.value.to,
      subject: form.value.subject || undefined,
      stageId: form.value.stageId || undefined,
    })
    emit('close')
    router.push({ name: 'monitor.conversationDetail', params: { conversationId } })
  } catch (err: any) {
    submitError.value = err.response?.data?.message || 'Failed to send email'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal title="Send Email (SendGrid)" size="md" @close="$emit('close')">
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Send an outgoing email via SendGrid. The conversation record is created immediately. Future replies from the recipient will be attached to the same conversation.
    </p>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <FormField label="Channel Provider" path="channelProviderId" :error="null" required class="w-full">
        <select v-model="form.channelProviderId" class="form-select">
          <option value="" disabled>Select a SendGrid provider</option>
          <option v-for="p in sendgridProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </FormField>

      <FormField label="API Key" path="apiKeyId" :error="null" required class="w-full">
        <select v-model="form.apiKeyId" class="form-select">
          <option value="" disabled>Select an API key</option>
          <option v-for="k in activeApiKeys" :key="k.id" :value="k.id" :disabled="!k.key">{{ k.name }}</option>
        </select>
      </FormField>

      <FormField label="Recipient Email" path="to" :error="null" required class="w-full" help="Destination email address">
        <input v-model="form.to" type="email" class="form-input" placeholder="recipient@example.com" />
      </FormField>

      <FormField label="Subject" path="subject" :error="null" class="w-full" help="Defaults to the agent name if left empty">
        <input v-model="form.subject" type="text" class="form-input" placeholder="Email subject..." />
      </FormField>

      <FormField label="Starting Stage" path="stageId" :error="null" class="w-full" help="Overrides the project-level default">
        <select v-model="form.stageId" class="form-select">
          <option value="">Project default</option>
          <option v-for="s in stagesStore.items" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </FormField>

      <div v-if="submitError" class="alert-error">{{ submitError }}</div>
    </form>

    <template #footer>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button type="button" class="btn-primary" :disabled="!isValid || isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? 'Sending...' : 'Send Email' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
