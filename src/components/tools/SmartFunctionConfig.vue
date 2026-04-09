<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Image as ImageIcon, Layers, Settings } from 'lucide-vue-next'
import type { LlmSettings, ParsedError, ProviderResponse } from '@/api/types'
import { useLlmProviderSelect } from '@/composables/useLlmProviderSelect'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import FormField from '@/components/FormField.vue'
import CompositeFormField from '@/components/CompositeFormField.vue'

const prompt = defineModel<string>('prompt', { required: true })
const llmProviderId = defineModel<string>('llmProviderId', { required: true })
const llmSettings = defineModel<LlmSettings | null>('llmSettings', { required: true })
const inputType = defineModel<'text' | 'image' | 'multi-modal' | ''>('inputType', { required: true })
const outputType = defineModel<'text' | 'image' | 'multi-modal' | ''>('outputType', { required: true })

const props = defineProps<{
  llmProviders: ProviderResponse[]
  isLoading: boolean
  error: ParsedError | null
}>()

const showLLMSettingsModal = ref(false)

function handleLLMSettingsSave(settings: Record<string, any>) {
  llmSettings.value = settings as LlmSettings
  showLLMSettingsModal.value = false
}

const { handleProviderChange: handleLlmProviderChange } = useLlmProviderSelect(
  () => llmProviderId.value,
  (v) => { llmProviderId.value = v },
  () => llmSettings.value,
  (v) => { llmSettings.value = v }
)
</script>

<template>
  <FormField label="Input Type" required :error="error" path="inputType" help="The expected data type for tool input">
    <div class="flex gap-2">
      <button
        type="button"
        @click="inputType = 'text'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          inputType === 'text'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <FileText class="w-5 h-5" />
        Text
      </button>
      <button
        type="button"
        @click="inputType = 'image'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          inputType === 'image'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <ImageIcon class="w-5 h-5" />
        Image
      </button>
      <button
        type="button"
        @click="inputType = 'multi-modal'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          inputType === 'multi-modal'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <Layers class="w-5 h-5" />
        Multi-modal
      </button>
    </div>
  </FormField>

  <FormField label="Output Type" required :error="error" path="outputType" help="The expected data type for tool output">
    <div class="flex gap-2">
      <button
        type="button"
        @click="outputType = 'text'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          outputType === 'text'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <FileText class="w-5 h-5" />
        Text
      </button>
      <button
        type="button"
        @click="outputType = 'image'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          outputType === 'image'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <ImageIcon class="w-5 h-5" />
        Image
      </button>
      <button
        type="button"
        @click="outputType = 'multi-modal'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-all',
          outputType === 'multi-modal'
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-primary-700'
        ]"
        :disabled="isLoading"
      >
        <Layers class="w-5 h-5" />
        Multi-modal
      </button>
    </div>
  </FormField>

  <CompositeFormField label="LLM Provider" required :error="error" help="The LLM provider to use for this tool">
    <div class="flex flex-col md:flex-row gap-2 items-center">
      <FormField path="llmProviderId">
        <select
          :value="llmProviderId"
          @change="handleLlmProviderChange"
          class="form-select-auto min-w-64"
          :disabled="isLoading"
        >
          <option value="">Select an LLM provider</option>
          <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </FormField>
      <FormField path="llmSettings">
        <button
          type="button"
          @click="showLLMSettingsModal = true"
          class="btn-secondary whitespace-nowrap"
          :disabled="isLoading"
        >
          <Settings class="inline-block mr-1 w-4 h-4" />
          Settings...
        </button>
      </FormField>
      <LLMModelBadge :settings="llmSettings" />
    </div>
  </CompositeFormField>

  <FormField label="Tool Prompt" required :error="error" path="prompt" class="w-full" help="The system prompt or instructions for this tool's operation">
    <PromptEditor
      v-model="prompt"
      :disabled="isLoading"
      show-toolbar
      placeholder="You are a tool that analyzes data and provides insights..."
      aria-label="Tool prompt"
      min-height="28rem"
    />
  </FormField>

  <LLMSettingsModal
    v-if="showLLMSettingsModal"
    :settings="llmSettings"
    :selected-provider-id="llmProviderId"
    :providers="llmProviders"
    @close="showLLMSettingsModal = false"
    @save="handleLLMSettingsSave"
  />
</template>
