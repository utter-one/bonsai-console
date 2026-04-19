<template>
  <BaseModal :title="apiKey ? (isReadOnly ? 'View API Key' : 'Edit API Key') : 'Create New API Key'" size="xl" @close="$emit('close')">
    <div v-if="apiKey" class="border-b border-gray-200 dark:border-gray-700 mb-4">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <form v-show="activeTab !== 'history'">
      <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
        <div v-if="!apiKey || activeTab === 'details'">
          <div v-if="isReadOnly" class="alert-warning mb-4">
            This API key is read-only because its project is archived.
          </div>

          <!-- Details tab -->
          <TabContent v-model="activeTab" tab="details">
            <FormField label="API Key Name" :path="'name'" :error="validationError" required class="w-full" help="A descriptive name to identify this API key">
              <input
                v-model="form.name"
                type="text"
                maxlength="255"
                class="form-input"
                placeholder="Production API Key"
              />
            </FormField>

            <FormField label="API Key" class="w-full" help="Store this key securely">
              <div class="flex gap-2">
                <input :value="newKeyValue" readonly class="form-input font-mono text-xs" />
                <button @click="copyToClipboard" type="button" class="btn-secondary shrink-0">
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </FormField>

            <FormField label="Project" :path="'projectId'" :error="validationError" required class="w-full" :help="apiKey || props.projectId ? 'Project cannot be changed' : 'Choose the project for this API key'">
              <select v-if="!apiKey && !props.projectId" v-model="form.projectId" class="form-select" required>
                <option value="" disabled>Select a project</option>
                <option v-for="option in projectOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input v-if="apiKey || props.projectId" :value="projects.find(p => p.id === (props.projectId || form.projectId))?.name || 'Unknown'" readonly class="form-input" />
            </FormField>

            <FormField v-if="apiKey" label="Active" class="w-full" help="Inactive keys cannot be used for authentication">
              <template #leading>
                <input v-model="form.isActive" type="checkbox" class="form-checkbox" />
              </template>
            </FormField>

            <div v-if="apiKey" class="card-info border border-gray-200 dark:border-gray-700">
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Created:</span>
                  <span><RelativeDate :date="apiKey.createdAt" /></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Last Used:</span>
                  <span><RelativeDate v-if="apiKey.lastUsedAt" :date="apiKey.lastUsedAt" /><span v-else>Never</span></span>
                </div>
              </div>
            </div>
          </TabContent>
        </div>
        <div v-if="apiKey && activeTab === 'settings'">
          <div v-if="isReadOnly" class="alert-warning mb-4">
            This API key is read-only because its project is archived.
          </div>

          <!-- Settings tab -->
          <TabContent v-model="activeTab" tab="settings">
            <!-- Channels restriction -->
            <FormField label="Restrict Channels" class="w-full">
              <template #leading>
                <input v-model="form.restrictChannels" type="checkbox" class="form-checkbox" />
              </template>
              <p class="mt-1 text-xs" :class="form.restrictChannels ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">{{ form.restrictChannels ? 'Only the selected channels are allowed.' : 'All channels are allowed.' }}</p>
              <div class="mt-2 space-y-1.5 pl-1">
                <label
                  v-for="channel in ALL_CHANNELS"
                  :key="channel"
                  class="flex items-center gap-2"
                  :class="!form.restrictChannels ? 'opacity-50' : ''"
                >
                  <input
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="!form.restrictChannels"
                    :checked="form.allowedChannels.includes(channel)"
                    @change="form.allowedChannels.includes(channel) ? form.allowedChannels.splice(form.allowedChannels.indexOf(channel), 1) : form.allowedChannels.push(channel)"
                  />
                  <span class="text-sm">{{ CHANNEL_LABELS[channel] }}</span>
                </label>
              </div>
            </FormField>

            <!-- Features restriction -->
            <FormField label="Restrict Features" :path="'features'" :error="validationError" class="w-full">
              <template #leading>
                <input v-model="form.restrictFeatures" type="checkbox" class="form-checkbox" />
              </template>
              <p class="mt-1 text-xs" :class="form.restrictFeatures ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">{{ form.restrictFeatures ? 'Only the selected features are permitted.' : 'All features are permitted.' }}</p>
              <div class="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 pl-1" :class="!form.restrictFeatures ? 'opacity-50' : ''">
                <div v-for="group in FEATURE_GROUPS" :key="group.label">
                  <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{{ group.label }}</div>
                  <div class="space-y-1.5">
                    <label
                      v-for="feature in group.features"
                      :key="feature"
                      class="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        class="form-checkbox"
                        :disabled="!form.restrictFeatures"
                        :checked="form.allowedFeatures.includes(feature)"
                        @change="form.allowedFeatures.includes(feature) ? form.allowedFeatures.splice(form.allowedFeatures.indexOf(feature), 1) : form.allowedFeatures.push(feature)"
                      />
                      <span class="text-sm">{{ FEATURE_LABELS[feature] }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </FormField>
          </TabContent>
        </div>
      </fieldset>
    </form>

    <div v-if="apiKey && activeTab === 'history'">
      <EntityHistoryView
        v-if="loadHistory"
        :load-history="loadHistory"
        :current-object="apiKey"
        :current-version="apiKey.version"
        :active="activeTab === 'history'"
        :update-fn="updateFn"
        :create-fn="createFn"
        :ignore-fields="['archived', 'updatedAt', 'version', 'key', 'keyPreview']"
        @recover-success="emit('recoverSuccess')"
      />
    </div>

    <div class="modal-footer">
      <ErrorDisplay :error="validationError" class="flex-1 mr-2 self-start" />
      <button type="button" @click="$emit('close')" class="btn-secondary">
        {{ showNewKeyAlert ? 'Close' : (isReadOnly ? 'Close' : 'Cancel') }}
      </button>
      <button v-if="!isReadOnly" @click="handleSubmit" class="btn-primary">
        {{ apiKey ? 'Save Changes' : 'Create API Key' }}
      </button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest, ParsedError, ApiErrorDetail } from '@/api/types'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useProjectsStore } from '@/stores/projects'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import BaseModal from '@/components/BaseModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import RelativeDate from '@/components/RelativeDate.vue'

const ALL_CHANNELS = ['websocket', 'webrtc', 'twilio_voice', 'twilio_messaging', 'whatsapp'] as const
type AllowedChannel = typeof ALL_CHANNELS[number]

const CHANNEL_LABELS: Record<AllowedChannel, string> = {
  websocket: 'WebSocket',
  webrtc: 'WebRTC',
  twilio_voice: 'Twilio Voice',
  twilio_messaging: 'Twilio Messaging',
  whatsapp: 'WhatsApp',
}

const FEATURE_LABELS: Record<string, string> = {
  conversation_control: 'Conversation Control',
  voice_input: 'Voice Input',
  text_input: 'Text Input',
  voice_output: 'Voice Output',
  text_output: 'Text Output',
  vars_access: 'Variables Access',
  stage_control: 'Stage Control',
  run_action: 'Run Action',
  call_tool: 'Call Tool',
  events: 'Events',
}

const FEATURE_GROUPS = [
  { label: 'Input', features: ['voice_input', 'text_input'] as const },
  { label: 'Output', features: ['voice_output', 'text_output'] as const },
  { label: 'Data & Actions', features: ['vars_access', 'run_action', 'call_tool', 'events'] as const },
  { label: 'Conversation', features: ['conversation_control', 'stage_control'] as const },
]

const props = defineProps<{
  apiKey: ApiKeyResponse | null
  projectId: string
  isReadOnly?: boolean
  loadHistory?: () => Promise<any>
  updateFn?: (data: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: CreateApiKeyRequest | UpdateApiKeyRequest): void
  (e: 'created', key: string): void
  (e: 'project-selected', projectId: string): void
  (e: 'recoverSuccess'): void
}>()

const form = ref({
  name: '',
  isActive: true,
  metadata: {} as Record<string, any>,
  version: undefined as number | undefined,
  projectId: props.projectId || '',
  restrictChannels: false,
  allowedChannels: [] as AllowedChannel[],
  restrictFeatures: false,
  allowedFeatures: [] as string[],
})

const projectsStore = useProjectsStore()
onMounted(() => projectsStore.fetchAll())
const projects = computed(() => projectsStore.items)
const projectOptions = computed(() =>
  projects.value.filter(p => !p.archivedAt).map(p => ({ label: p.name, value: p.id }))
)

const newKeyValue = ref<string | null>(null)
const showNewKeyAlert = ref(false)
const copied = ref(false)
const activeTab = ref<'details' | 'settings' | 'history'>('details')
const validationError = ref<ParsedError | null>(null)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'details', label: 'Details' },
  { key: 'settings', label: 'Settings' },
  { key: 'history', label: 'History', show: !!props.loadHistory },
])

watch(() => props.apiKey, () => {
  activeTab.value = 'details'
})

watch(
  () => form.value.projectId,
  (newProjectId) => {
    if (newProjectId) emit('project-selected', newProjectId)
  }
)

watch(
  () => form.value.restrictChannels,
  (enabled, wasEnabled) => {
    if (enabled && !wasEnabled && form.value.allowedChannels.length === 0) {
      form.value.allowedChannels = [...ALL_CHANNELS]
    }
  }
)

watch(
  () => form.value.restrictFeatures,
  (enabled, wasEnabled) => {
    if (enabled && !wasEnabled && form.value.allowedFeatures.length === 0) {
      form.value.allowedFeatures = FEATURE_GROUPS.flatMap(g => [...g.features])
    }
  }
)

watch(
  () => props.apiKey,
  (newApiKey) => {
    if (newApiKey) {
      form.value = {
        name: newApiKey.name,
        isActive: newApiKey.isActive,
        metadata: newApiKey.metadata ?? {},
        version: newApiKey.version,
        projectId: newApiKey.projectId || props.projectId || '',
        restrictChannels: !!newApiKey.keySettings?.allowedChannels,
        allowedChannels: (newApiKey.keySettings?.allowedChannels ?? []) as AllowedChannel[],
        restrictFeatures: !!newApiKey.keySettings?.allowedFeatures,
        allowedFeatures: newApiKey.keySettings?.allowedFeatures ?? [],
      }
      emit('project-selected', form.value.projectId)
      // Show the key if it was just created
      if (newApiKey.key) {
        newKeyValue.value = newApiKey.key
        showNewKeyAlert.value = true
      }
    } else {
      form.value = {
        name: '',
        isActive: true,
        metadata: {},
        version: undefined,
        projectId: props.projectId || '',
        restrictChannels: false,
        allowedChannels: [],
        restrictFeatures: false,
        allowedFeatures: [],
      }
      newKeyValue.value = null
      showNewKeyAlert.value = false
    }
  },
  { immediate: true }
)

const INPUT_FEATURES = ['voice_input', 'text_input']
const OUTPUT_FEATURES = ['voice_output', 'text_output']

const hasInputSelected = computed(() =>
  !form.value.restrictFeatures || INPUT_FEATURES.some(f => form.value.allowedFeatures.includes(f))
)
const hasOutputSelected = computed(() =>
  !form.value.restrictFeatures || OUTPUT_FEATURES.some(f => form.value.allowedFeatures.includes(f))
)

function handleSubmit() {
  const apiErrorDetails:ApiErrorDetail[] = [];
  validationError.value = null

  if (!form.value.name)
    apiErrorDetails.push({ path: ['name'], message: 'API key name is required.', code: 'too_small' })

  if (!props.apiKey && !props.projectId && !form.value.projectId)
    apiErrorDetails.push({ path: ['projectId'], message: 'A project must be selected.', code: 'required' })

  if (!hasInputSelected.value || !hasOutputSelected.value)
    apiErrorDetails.push({ path: ['features'], message: 'At least one input and one output feature must be enabled.', code: 'invalid' })

  if (apiErrorDetails.length) {
    validationError.value = {
      message: 'Please fix the validation errors and try again.',
      details: apiErrorDetails
    }
    return
  }

  const keySettings: Record<string, any> = {}
  if (form.value.restrictChannels) {
    keySettings.allowedChannels = form.value.allowedChannels
  }
  if (form.value.restrictFeatures) {
    keySettings.allowedFeatures = form.value.allowedFeatures
  }

  const data: any = {
    name: form.value.name,
    keySettings,
  }
  if (!props.apiKey) {
    // Creating new key
    data.metadata = form.value.metadata
  } else {
    // Editing existing key
    data.isActive = form.value.isActive
    data.metadata = form.value.metadata
    data.version = form.value.version
  }
  console.log('Submitting API key data:', data)
  emit('save', data)
}

async function copyToClipboard() {
  if (!newKeyValue.value) return
  
  try {
    await navigator.clipboard.writeText(newKeyValue.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>
