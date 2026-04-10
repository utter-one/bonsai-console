<script setup lang="ts">
import { ref, watch } from 'vue'
import FormField from '@/components/FormField.vue'
import type { DeepgramAsrSettings } from '@/api/types'

const settings = defineModel<DeepgramAsrSettings>({ required: true })

const deepgramEndpointingEnabled = ref(true)
const deepgramEndpointingValue = ref(300)

function syncEndpointing() {
  const value = settings.value?.endpointing
  if (value === false) {
    deepgramEndpointingEnabled.value = false
    deepgramEndpointingValue.value = 300
  } else if (typeof value === 'number') {
    deepgramEndpointingEnabled.value = true
    deepgramEndpointingValue.value = value
  } else {
    deepgramEndpointingEnabled.value = true
    deepgramEndpointingValue.value = 300
  }
}

watch(() => settings.value, () => {
  syncEndpointing()
}, { immediate: true })

watch(deepgramEndpointingEnabled, (enabled) => {
  settings.value.endpointing = enabled ? deepgramEndpointingValue.value : false
})

watch(deepgramEndpointingValue, (value) => {
  if (deepgramEndpointingEnabled.value) {
    settings.value.endpointing = value
  }
})
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Deepgram ASR Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure Deepgram speech recognition settings for this project
      </p>
    </div>

    <FormField label="Model ID" class="w-full" help="Model to use for transcription (defaults to nova-3)">
      <select
        v-model="settings.modelId"
        class="form-select-auto min-w-64"
      >
        <option :value="undefined">Default (nova-3)</option>
        <option value="nova-3">nova-3</option>
        <option value="nova-3-general">nova-3-general</option>
        <option value="nova-3-medical">nova-3-medical</option>
        <option value="nova-2">nova-2</option>
        <option value="nova-2-general">nova-2-general</option>
        <option value="nova-2-meeting">nova-2-meeting</option>
        <option value="nova-2-finance">nova-2-finance</option>
        <option value="nova-2-conversationalai">nova-2-conversationalai</option>
        <option value="nova-2-voicemail">nova-2-voicemail</option>
        <option value="nova-2-video">nova-2-video</option>
        <option value="nova-2-medical">nova-2-medical</option>
        <option value="nova-2-drivethru">nova-2-drivethru</option>
        <option value="nova-2-automotive">nova-2-automotive</option>
        <option value="nova">nova</option>
        <option value="nova-general">nova-general</option>
        <option value="nova-phonecall">nova-phonecall</option>
        <option value="nova-medical">nova-medical</option>
        <option value="enhanced">enhanced</option>
        <option value="enhanced-general">enhanced-general</option>
        <option value="enhanced-meeting">enhanced-meeting</option>
        <option value="enhanced-phonecall">enhanced-phonecall</option>
        <option value="enhanced-finance">enhanced-finance</option>
        <option value="base">base</option>
        <option value="meeting">meeting</option>
        <option value="phonecall">phonecall</option>
        <option value="finance">finance</option>
        <option value="conversationalai">conversationalai</option>
        <option value="voicemail">voicemail</option>
        <option value="video">video</option>
        <option value="custom">custom</option>
      </select>
    </FormField>

    <FormField label="Audio Format" class="w-full" help="Audio encoding format for speech-to-text">
      <select
        v-model="settings.audioFormat"
        class="form-select-auto min-w-64"
      >
        <option :value="undefined">Default (PCM 16kHz)</option>
        <option value="pcm_8000">PCM 8kHz</option>
        <option value="pcm_16000">PCM 16kHz</option>
        <option value="pcm_22050">PCM 22.05kHz</option>
        <option value="pcm_24000">PCM 24kHz</option>
        <option value="pcm_44100">PCM 44.1kHz</option>
      </select>
    </FormField>

    <FormField label="Language" class="w-full" help='BCP-47 language tag (e.g., "en-US", "es", "fr")'>
      <input
        v-model="settings.language"
        type="text"
        placeholder="e.g., en-US, es, fr"
        class="form-input"
      />
    </FormField>

    <FormField label="Enable Interim Results" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.interimResults"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Enable interim (partial) transcription results during streaming
        </span>
      </label>
    </FormField>

    <FormField label="Enable Endpointing" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="deepgramEndpointingEnabled"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Automatically finalize speech after a period of silence
        </span>
      </label>
      <div v-if="deepgramEndpointingEnabled" class="mt-3">
        <label class="form-label text-sm">
          Silence Duration (ms)
        </label>
        <input
          v-model.number="deepgramEndpointingValue"
          type="number"
          min="10"
          required
          placeholder="300"
          class="form-input max-w-xs"
        />
        <p class="form-help-text">
          Milliseconds of silence to wait before finalizing speech (minimum: 10)
        </p>
      </div>
    </FormField>

    <FormField label="Smart Format" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.smartFormat"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Apply formatting (punctuation, capitalization, currency, etc.) to improve readability
        </span>
      </label>
    </FormField>

    <FormField label="Punctuate" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.punctuate"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Add punctuation and capitalization to transcript
        </span>
      </label>
    </FormField>

    <FormField label="Diarize" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.diarize"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Recognize and label different speakers in the audio
        </span>
      </label>
    </FormField>

    <FormField label="Utterance End (ms)" class="w-full" help="Milliseconds to wait before sending UtteranceEnd event (use with interim results)">
      <input
        v-model.number="settings.utteranceEndMs"
        type="number"
        min="10"
        placeholder="Leave empty for default"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="VAD Events" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.vadEvents"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Send SpeechStarted events when speech is detected
        </span>
      </label>
    </FormField>
  </div>
</template>
