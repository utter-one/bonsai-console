<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">ASR Settings</h2>

      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select an ASR provider first
        </div>

        <AsrProviderSettings
          v-else
          v-model="form.settings"
          :api-type="selectedProvider.apiType"
        />

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="!selectedProvider">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AsrProviderSettings from '@/components/asr/AsrProviderSettings.vue'
import type { ProviderResponse, AzureAsrSettings, ElevenLabsAsrSettings, DeepgramAsrSettings, AssemblyAiAsrSettings, SpeechmaticsAsrSettings } from '@/api/types'

type AsrSettings = AzureAsrSettings | ElevenLabsAsrSettings | DeepgramAsrSettings | AssemblyAiAsrSettings | SpeechmaticsAsrSettings

interface AsrConfig {
  settings: AsrSettings | Record<string, never>
  voiceActivityDetection: boolean
}

const props = defineProps<{
  selectedProvider: ProviderResponse | null
  asrConfig: AsrConfig | null
}>()

const emit = defineEmits<{
  close: []
  save: [config: AsrConfig]
}>()

const form = ref<AsrConfig>({
  settings: {},
  voiceActivityDetection: false,
})

watch(() => props.asrConfig, (config) => {
  form.value = {
    settings: config?.settings ? JSON.parse(JSON.stringify(config.settings)) : {},
    voiceActivityDetection: config?.voiceActivityDetection || false,
  }
}, { immediate: true })

function handleSubmit() {
  emit('save', {
    settings: form.value.settings,
    voiceActivityDetection: form.value.voiceActivityDetection,
  })
}
</script>


