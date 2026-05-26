<template>
  <div class="flex flex-row items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
    <!-- Settings Dropdown (API Key + Timezone + Channel) -->
    <FloatingDropdown
      class="inline-flex"
      :trigger-class="`btn-secondary flex items-center gap-2${isConnected || apiKeysLoading ? ' opacity-50 pointer-events-none' : ''}`"
      title="Connection settings"
      :min-width="'256px'"
      :max-height="'400px'"
      align="right"
    >
      <template #trigger>
        <Settings :size="18" />
        <ChevronDown :size="14" class="text-gray-500" />
      </template>
      <template #default>
        <div class="p-3 space-y-3" @click.stop>
          <!-- API Key -->
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Key :size="12" />API Key
            </div>
            <select
              v-model="apiKeyIdModel"
              class="form-select w-full text-sm"
              :disabled="isConnected || apiKeysLoading"
            >
              <option value="">Select API Key...</option>
              <option v-for="key in apiKeys" :key="key.id" :value="key.id">{{ key.name }}</option>
            </select>
          </div>
          <!-- Timezone -->
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Timezone
            </div>
            <TimezoneSelector
              v-model="timezoneModel"
              placeholder="Project Default"
              :show-icon="true"
              :disabled="isConnected"
              :width="'full'"
            />
          </div>
          <!-- Channel -->
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Channel
            </div>
            <select
              v-model="connectionTypeModel"
              class="form-select w-full text-sm"
              :disabled="isConnected"
            >
              <option value="websocket">WebSocket</option>
              <option value="webrtc">WebRTC (lower audio latency)</option>
            </select>
          </div>
        </div>
      </template>
    </FloatingDropdown>

    <div class="h-8 border-l border-gray-300 dark:border-gray-600 hidden md:block"></div>

    <!-- Conversation Controls -->
    <div class="inline-flex items-center gap-2">
      <!-- Start Split Button -->
      <div v-if="!isConversationActive" class="inline-flex">
        <button
          class="btn-primary-hardright flex items-center gap-2 whitespace-nowrap"
          @click="emit('start-conversation')"
          :disabled="!canStartConversation"
        >
          <Play :size="16" />
          <span class="hidden md:inline">{{ isConversationStarting ? 'Starting...' : 'Start' }}</span>
        </button>
        <FloatingDropdown
          class="inline-flex"
          :trigger-class="`btn-primary-hardleft${!canStartConversation ? ' opacity-50 pointer-events-none' : ''}`"
          :min-width="'180px'"
          align="right"
        >
          <template #trigger>
            <ChevronDown :size="14" />
          </template>
          <template #default="{ close }">
            <div class="py-1">
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium"
                @click="() => { emit('start-with-setup'); close() }"
              >
                <SlidersHorizontal :size="14" class="shrink-0" />
                Start with setup
              </button>
            </div>
          </template>
        </FloatingDropdown>
      </div>

      <button
        v-else
        class="btn-danger flex items-center gap-2 whitespace-nowrap"
        @click="emit('end-conversation')"
        :disabled="!canEndConversation"
      >
        <Square :size="18" />
        <span class="hidden md:inline">{{ isConversationEnding ? 'Ending...' : 'End' }}</span>
      </button>

      <!-- Mode Button -->
      <FloatingDropdown
        class="inline-flex"
        :trigger-class="`btn-secondary flex items-center gap-1.5 whitespace-nowrap${isConversationActive ? ' opacity-50 pointer-events-none' : ''}`"
        :trigger-title="isConversationActive ? 'Cannot change mode during a conversation' : `Conversation mode: ${currentPresetName}`"
        :max-width="'300px'"
        align="right"
      >
        <template #trigger>
          <component :is="currentModeIcon" :size="15" />
          <span class="hidden md:inline text-sm">{{ currentPresetName }}</span>
          <ChevronDown :size="13" class="text-gray-500" />
        </template>
        <template #default="{ close }">
          <div class="py-1">
            <button
              v-for="{ preset, disabled, reason } in availablePresets"
              :key="preset.id"
              type="button"
              @click="() => { emit('preset-select', preset.id); close() }"
              :disabled="disabled"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': preset.id === selectedConversationMode }"
            >
              <div class="flex items-start gap-2">
                <component :is="modeIcon(preset.id)" :size="15" class="mt-0.5 shrink-0" />
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {{ preset.name }}
                    <span v-if="preset.id === selectedConversationMode" class="text-primary-600 dark:text-primary-400 text-xs">(Active)</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ preset.description }}</div>
                  <div v-if="disabled && reason" class="form-field-error m-0">{{ reason }}</div>
                </div>
              </div>
            </button>
          </div>
        </template>
      </FloatingDropdown>
    </div>

    <div class="h-8 border-l border-gray-300 dark:border-gray-600 hidden md:block"></div>

    <!-- Advanced Controls -->
    <button
      class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap"
      :disabled="!canRunAction"
      @click="emit('run-action')"
    >
      <Zap :size="18" />
      <span class="hidden md:inline">Run Action</span>
    </button>

    <button
      class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap"
      :disabled="!canJumpToStage"
      @click="emit('jump-to-stage')"
    >
      <SkipForward :size="18" />
      <span class="hidden md:inline">Jump to Stage</span>
    </button>

    <button
      class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap"
      :disabled="!canCallTool"
      @click="emit('call-tool')"
    >
      <Wrench :size="18" />
      <span class="hidden md:inline">Call Tool</span>
    </button>

    <button
      class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap"
      :disabled="!canSetVariable"
      @click="emit('set-variable')"
    >
      <Braces :size="18" />
      <span class="hidden md:inline">Set Variable</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, Zap, SkipForward, Settings, ChevronDown, Wrench, Key, Braces, MessageSquare, Mic, Volume2, Headphones, SlidersHorizontal } from 'lucide-vue-next'
import FloatingDropdown from '@/components/FloatingDropdown.vue'
import TimezoneSelector from '@/components/TimezoneSelector.vue'
import type { ApiKeyResponse } from '@/api/types'

type ConversationMode = 'text-only' | 'voice-input' | 'voice-output' | 'full-voice'

interface ConversationPreset {
  id: ConversationMode
  name: string
  description: string
}

interface AvailablePreset {
  preset: ConversationPreset
  disabled: boolean
  reason: string | null
}

const props = defineProps<{
  isConnected: boolean
  isConversationActive: boolean
  isConversationStarting: boolean
  isConversationEnding: boolean
  canStartConversation: boolean
  canEndConversation: boolean
  canRunAction: boolean
  canJumpToStage: boolean
  canCallTool: boolean
  canSetVariable: boolean
  apiKeys: ApiKeyResponse[]
  apiKeysLoading: boolean
  selectedApiKeyId: string | null
  selectedTimezone: string
  connectionType: 'websocket' | 'webrtc'
  selectedConversationMode: ConversationMode
  availablePresets: AvailablePreset[]
  conversationPresets: ConversationPreset[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedApiKeyId', value: string | null): void
  (e: 'update:selectedTimezone', value: string): void
  (e: 'update:connectionType', value: 'websocket' | 'webrtc'): void
  (e: 'start-conversation'): void
  (e: 'start-with-setup'): void
  (e: 'end-conversation'): void
  (e: 'preset-select', mode: ConversationMode): void
  (e: 'run-action'): void
  (e: 'jump-to-stage'): void
  (e: 'call-tool'): void
  (e: 'set-variable'): void
}>()

const currentPresetName = computed(() =>
  props.conversationPresets.find(p => p.id === props.selectedConversationMode)?.name || 'Unknown'
)

function modeIcon(mode: ConversationMode) {
  switch (mode) {
    case 'text-only': return MessageSquare
    case 'voice-input': return Mic
    case 'voice-output': return Volume2
    case 'full-voice': return Headphones
  }
}

const currentModeIcon = computed(() => modeIcon(props.selectedConversationMode))

const apiKeyIdModel = computed({
  get: () => props.selectedApiKeyId ?? '',
  set: (v: string) => emit('update:selectedApiKeyId', v || null),
})

const timezoneModel = computed({
  get: () => props.selectedTimezone,
  set: (v: string) => emit('update:selectedTimezone', v),
})

const connectionTypeModel = computed({
  get: () => props.connectionType,
  set: (v: 'websocket' | 'webrtc') => emit('update:connectionType', v),
})
</script>
