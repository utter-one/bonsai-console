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
  templateName: '',
  templateParamsRaw: '',
  stageId: '',
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const whatsappProviders = computed(() =>
  providersStore.items.filter(p => p.apiType === 'whatsapp')
)

const activeApiKeys = computed(() =>
  apiKeysStore.items.filter(k => k.isActive)
)

const selectedApiKey = computed(() =>
  apiKeysStore.items.find(k => k.id === form.value.apiKeyId)
)

const templateParams = computed(() => {
  const raw = form.value.templateParamsRaw.trim()
  if (!raw) return undefined
  return raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
})

onMounted(async () => {
  await Promise.all([
    providersStore.fetchAll({ filters: { providerType: 'channel' } }),
    stagesStore.fetchAll(props.projectId, { limit: 1000 }),
    apiKeysStore.fetchAll(props.projectId, { filters: { isActive: true } }),
  ])
})

const isValid = computed(() =>
  form.value.channelProviderId && form.value.apiKeyId && selectedApiKey.value?.key && form.value.to && form.value.templateName
)

async function handleSubmit() {
  submitError.value = null
  isSubmitting.value = true
  try {
    const conversationId = await conversationsStore.initiateWhatsApp({
      apiKey: selectedApiKey.value!.key!,
      channelProviderId: form.value.channelProviderId,
      to: form.value.to,
      templateName: form.value.templateName,
      templateParams: templateParams.value,
      stageId: form.value.stageId || undefined,
    })
    emit('close')
    router.push({ name: 'monitor.conversationDetail', params: { conversationId } })
  } catch (err: any) {
    submitError.value = err.response?.data?.message || 'Failed to send WhatsApp message'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal title="Send WhatsApp Message" size="md" @close="$emit('close')">
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Send an approved WhatsApp template message to initiate a conversation. Future replies from the recipient will be attached to the same conversation.
    </p>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <FormField label="Channel Provider" path="channelProviderId" :error="null" required class="w-full">
        <select v-model="form.channelProviderId" class="form-select">
          <option value="" disabled>Select a WhatsApp provider</option>
          <option v-for="p in whatsappProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </FormField>

      <FormField label="API Key" path="apiKeyId" :error="null" required class="w-full">
        <select v-model="form.apiKeyId" class="form-select">
          <option value="" disabled>Select an API key</option>
          <option v-for="k in activeApiKeys" :key="k.id" :value="k.id" :disabled="!k.key">{{ k.name }}</option>
        </select>
      </FormField>

      <FormField label="Phone Number" path="to" :error="null" required class="w-full" help="Destination number in E.164 format, e.g. +15551234567">
        <input v-model="form.to" type="text" class="form-input" placeholder="+15551234567" />
      </FormField>

      <FormField label="Template Name" path="templateName" :error="null" required class="w-full" help="Name of the approved WhatsApp message template">
        <input v-model="form.templateName" type="text" class="form-input" placeholder="e.g. welcome_message" />
      </FormField>

      <FormField label="Template Parameters" path="templateParamsRaw" :error="null" class="w-full" help="Comma-separated values substituted into {{1}}, {{2}}, … placeholders">
        <input v-model="form.templateParamsRaw" type="text" class="form-input" placeholder="John, Monday, 3pm" />
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
          {{ isSubmitting ? 'Sending...' : 'Send Message' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
