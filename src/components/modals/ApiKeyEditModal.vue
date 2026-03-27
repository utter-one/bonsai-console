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
          <div v-show="activeTab === 'details'">
            <div class="form-group">
              <label class="form-label">
                API Key Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Production API Key"
                maxlength="255"
                class="form-input"
              />
              <p class="form-help-text">A descriptive name to identify this API key</p>
            </div>

            <div v-if="showNewKeyAlert && newKeyValue" class="form-group">
              <label class="form-label">API Key</label>
              <div class="flex gap-2">
                <input :value="newKeyValue" readonly class="form-input font-mono text-xs" />
                <button @click="copyToClipboard" type="button" class="btn-secondary shrink-0">
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <p class="form-help-text">Store this key securely</p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Project 
                <span v-if="!apiKey && !props.projectId" class="required">*</span>
              </label>
              <select v-if="!apiKey && !props.projectId" v-model="form.projectId" class="form-select" required>
                <option value="" disabled>Select a project</option>
                <option v-for="option in projectOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input v-if="apiKey || props.projectId" :value="projects.find(p => p.id === (props.projectId || form.projectId))?.name || 'Unknown'" readonly class="form-input" />
              <p class="form-help-text">{{ apiKey || props.projectId ? 'Project cannot be changed' : 'Choose the project for this API key' }}</p>
            </div>

            <div v-if="apiKey" class="form-group">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="form-label mb-0">Active</span>
              </label>
              <p class="form-help-text">Inactive keys cannot be used for authentication</p>
            </div>

            <div v-if="apiKey" class="card-info border border-gray-200 dark:border-gray-700">
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Created:</span>
                  <span>{{ formatDate(apiKey.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Last Used:</span>
                  <span>{{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="apiKey && activeTab === 'settings'">
          <div v-if="isReadOnly" class="alert-warning mb-4">
            This API key is read-only because its project is archived.
          </div>

          <!-- Settings tab -->
          <div v-show="activeTab === 'settings'">
            <!-- Channels restriction -->
            <div class="form-group">
              <label class="flex items-center gap-2">
                <input v-model="form.restrictChannels" type="checkbox" class="form-checkbox" />
                <span class="form-label mb-0">Restrict Channels</span>
              </label>
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
                  <span class="text-sm">{{ channel === 'websocket' ? 'WebSocket' : 'WebRTC' }}</span>
                </label>
              </div>
            </div>

            <!-- Features restriction -->
            <div class="form-group">
              <label class="flex items-center gap-2">
                <input v-model="form.restrictFeatures" type="checkbox" class="form-checkbox" />
                <span class="form-label mb-0">Restrict Features</span>
              </label>
              <p class="mt-1 text-xs" :class="form.restrictFeatures ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">{{ form.restrictFeatures ? 'Only the selected features are permitted.' : 'All features are permitted.' }}</p>
              <p v-if="form.restrictFeatures && !hasInputSelected" class="mt-1 text-xs text-red-500 dark:text-red-400">At least one input method must be selected.</p>
              <p v-if="form.restrictFeatures && !hasOutputSelected" class="mt-1 text-xs text-red-500 dark:text-red-400">At least one output method must be selected.</p>
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
            </div>
          </div>
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
import type { ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/api/types'
import { useProjectsStore } from '@/stores/projects'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import BaseModal from '@/components/BaseModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'

const ALL_CHANNELS = ['websocket', 'webrtc'] as const

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
  allowedChannels: [] as ('websocket' | 'webrtc')[],
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
        allowedChannels: (newApiKey.keySettings?.allowedChannels ?? []) as ('websocket' | 'webrtc')[],
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
  if (!form.value.name) return
  if (!props.apiKey && !props.projectId && !form.value.projectId) return
  if (!hasInputSelected.value || !hasOutputSelected.value) return

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

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
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
