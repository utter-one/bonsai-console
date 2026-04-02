<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldAlert, ShieldOff, EyeOff, Minus, ExternalLink } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useGlobalActionsStore } from '@/stores'
import type { GlobalActionResponse } from '@/api/types'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const globalActionsStore = useGlobalActionsStore()

type ModerationMode = 'strict' | 'standard' | 'redact-only' | 'do-nothing'

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const selectedMode = ref<ModerationMode>('standard')
const standardResponse = ref(
  "I'm sorry, but I'm unable to process your request as it contains content that may violate our usage policies. Please rephrase your message and try again."
)

const existingAction = ref<GlobalActionResponse | null>(null)

const DEFAULT_REDACT_TEMPLATE = '[Message redacted by moderation]'
const redactTemplate = ref(DEFAULT_REDACT_TEMPLATE)

const modes: { key: ModerationMode; label: string; description: string }[] = [
  {
    key: 'strict',
    label: 'Strict',
    description: 'Abort the conversation immediately. No response is sent to the user.',
  },
  {
    key: 'standard',
    label: 'Standard',
    description: 'Send a prescripted response and redact the user\'s message. The original input is replaced before further processing.',
  },
  {
    key: 'redact-only',
    label: 'Redact Only',
    description: 'Silently replace the user\'s message with a placeholder. No explicit response is sent.',
  },
  {
    key: 'do-nothing',
    label: 'Do Nothing',
    description: 'Pass through without taking any action. The conversation continues as normal.',
  },
]

onMounted(async () => {
  await loadExistingAction()
})

async function loadExistingAction() {
  isLoading.value = true
  error.value = null
  try {
    existingAction.value = await globalActionsStore.fetchById(props.projectId, '__moderation_blocked')
    detectModeFromAction(existingAction.value)
  } catch (err: any) {
    if (err.response?.status === 404) {
      existingAction.value = null
      selectedMode.value = 'standard'
    } else {
      error.value = err.response?.data?.message || 'Failed to load moderation action'
    }
  } finally {
    isLoading.value = false
  }
}

function detectModeFromAction(action: GlobalActionResponse) {
  const effects = action.effects ?? []
  const hasAbort = effects.some(e => e.type === 'abort_conversation')
  const hasGenerateResponse = effects.some(e => e.type === 'generate_response')
  const hasModifyInput = effects.some(e => e.type === 'modify_user_input')

  if (effects.length === 0) {
    selectedMode.value = 'do-nothing'
  } else if (hasAbort && effects.length === 1) {
    selectedMode.value = 'strict'
  } else if (hasModifyInput && !hasGenerateResponse && effects.length === 1) {
    selectedMode.value = 'redact-only'
    const modifyEffect = effects.find(e => e.type === 'modify_user_input') as any
    if (modifyEffect?.template) redactTemplate.value = modifyEffect.template
  } else if (hasGenerateResponse && hasModifyInput) {
    selectedMode.value = 'standard'
    const genEffect = effects.find(e => e.type === 'generate_response') as any
    const firstResponse = genEffect?.prescriptedResponses?.[0]
    if (firstResponse) standardResponse.value = firstResponse
    const modifyEffect = effects.find(e => e.type === 'modify_user_input') as any
    if (modifyEffect?.template) redactTemplate.value = modifyEffect.template
  } else {
    selectedMode.value = 'standard'
  }
}

function buildEffects() {
  switch (selectedMode.value) {
    case 'strict':
      return [{ type: 'abort_conversation' as const }]
    case 'standard':
      return [
        {
          type: 'generate_response' as const,
          responseMode: 'prescripted' as const,
          prescriptedResponses: [standardResponse.value],
        },
        {
          type: 'modify_user_input' as const,
          template: redactTemplate.value,
        },
      ]
    case 'redact-only':
      return [
        {
          type: 'modify_user_input' as const,
          template: redactTemplate.value,
        },
      ]
    case 'do-nothing':
    default:
      return []
  }
}

async function apply() {
  isSaving.value = true
  error.value = null
  try {
    const effects = buildEffects()
    if (existingAction.value) {
      await globalActionsStore.update(props.projectId, '__moderation_blocked', {
        version: existingAction.value.version,
        name: 'Moderation Blocked',
        effects,
      })
    } else {
      await globalActionsStore.create(props.projectId, {
        id: '__moderation_blocked',
        name: 'Moderation Blocked',
        effects,
        triggerOnUserInput: false,
        triggerOnClientCommand: false,
      })
    }
    emit('close')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save moderation action'
  } finally {
    isSaving.value = false
  }
}

function configureManually() {
  emit('close')
  router.push({
    name: 'design.globalActions.edit',
    params: { projectId: props.projectId, globalActionId: '__moderation_blocked' },
  })
}
</script>

<template>
  <BaseModal title="Configure Moderation Action" size="md" @close="emit('close')">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
      Select how the system responds when a user message is blocked by content moderation.
    </p>

    <div v-if="isLoading" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      Loading current configuration...
    </div>

    <div v-else class="space-y-3">
      <div v-if="error" class="alert-error mb-4">{{ error }}</div>

      <label
        v-for="mode in modes"
        :key="mode.key"
        class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
        :class="selectedMode === mode.key
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-500'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
      >
        <input
          type="radio"
          :value="mode.key"
          v-model="selectedMode"
          class="mt-0.5 shrink-0 accent-violet-600"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-0.5">
            <ShieldAlert v-if="mode.key === 'strict'" class="w-4 h-4 text-red-500 shrink-0" />
            <ShieldOff v-else-if="mode.key === 'standard'" class="w-4 h-4 text-violet-500 shrink-0" />
            <EyeOff v-else-if="mode.key === 'redact-only'" class="w-4 h-4 text-amber-500 shrink-0" />
            <Minus v-else class="w-4 h-4 text-gray-400 shrink-0" />
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ mode.label }}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ mode.description }}</p>

          <div v-if="mode.key === 'standard' && selectedMode === 'standard'" class="mt-3 space-y-3">
            <div>
              <label class="form-label text-xs">Prescripted response</label>
              <textarea
                v-model="standardResponse"
                class="form-textarea text-sm"
                rows="3"
                placeholder="Enter the response message sent to users when their message is blocked..."
              />
            </div>
            <div>
              <label class="form-label text-xs">Redact template</label>
              <input
                v-model="redactTemplate"
                type="text"
                class="form-input text-sm"
                placeholder="e.g. [Message redacted by moderation]"
              />
              <p class="form-help-text text-xs mt-1">The text that replaces the user's original message in the conversation context.</p>
            </div>
          </div>
          <div v-if="mode.key === 'redact-only' && selectedMode === 'redact-only'" class="mt-3">
            <label class="form-label text-xs">Redact template</label>
            <input
              v-model="redactTemplate"
              type="text"
              class="form-input text-sm"
              placeholder="e.g. [Message redacted by moderation]"
            />
            <p class="form-help-text text-xs mt-1">The text that replaces the user's original message in the conversation context.</p>
          </div>
        </div>
      </label>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="configureManually" class="btn-secondary text-sm flex items-center gap-2">
          <ExternalLink class="w-4 h-4" />
          Configure Manually
        </button>
        <div class="flex items-center gap-2">
          <button @click="emit('close')" class="btn-secondary">Cancel</button>
          <button
            @click="apply"
            class="btn-primary"
            :disabled="isSaving || isLoading"
          >
            {{ isSaving ? 'Applying...' : 'Apply' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
