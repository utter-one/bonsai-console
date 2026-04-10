<script setup lang="ts">
import FormField from '@/components/FormField.vue'
import type { ElevenLabsAsrSettings } from '@/api/types'

const settings = defineModel<ElevenLabsAsrSettings>({ required: true })
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">ElevenLabs ASR Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure ElevenLabs speech recognition settings for this project
      </p>
    </div>

    <FormField label="Model ID" class="w-full" help="Model to use for transcription (defaults to scribe_v2_realtime)">
      <input
        v-model="settings.modelId"
        type="text"
        placeholder="e.g., scribe_v2_realtime"
        class="form-input"
      />
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

    <FormField label="Language Code" class="w-full" help='Language code in ISO 639-1 or ISO 639-3 format (e.g., "en", "es")'>
      <input
        v-model="settings.languageCode"
        type="text"
        placeholder="e.g., en, es, fr"
        class="form-input"
      />
    </FormField>

    <FormField label="Include Timestamps" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.includeTimestamps"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Receive word-level timestamps in transcription results
        </span>
      </label>
    </FormField>

    <FormField label="Include Language Detection" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.includeLanguageDetection"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Include detected language code in transcription results
        </span>
      </label>
    </FormField>

    <FormField label="Commit Strategy" class="w-full" help="Strategy for committing transcriptions">
      <select
        v-model="settings.commitStrategy"
        class="form-select-auto min-w-64"
      >
        <option :value="undefined">Default (Manual)</option>
        <option value="manual">Manual</option>
        <option value="vad">Voice Activity Detection (VAD)</option>
      </select>
    </FormField>

    <div v-if="settings.commitStrategy === 'vad'" class="pl-4 border-l-2 border-green-200 bg-green-50 p-4 rounded-r space-y-4 dark:bg-green-900/20 dark:border-green-800">
      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Voice Activity Detection Settings</h4>

      <FormField label="Silence Threshold (seconds)" hint="VAD" help="Silence duration before committing (0.3-3 seconds, default: 1.5)">
        <input
          v-model.number="settings.vadSilenceThresholdSecs"
          type="number"
          min="0.3"
          max="3"
          step="0.1"
          class="form-input max-w-xs"
          placeholder="1.5"
        />
      </FormField>

      <FormField label="VAD Threshold" hint="VAD" help="Detection sensitivity (0.1-0.9, default: 0.4)">
        <input
          v-model.number="settings.vadThreshold"
          type="number"
          min="0.1"
          max="0.9"
          step="0.05"
          class="form-input max-w-xs"
          placeholder="0.4"
        />
      </FormField>

      <FormField label="Minimum Speech Duration (ms)" hint="VAD" help="Minimum speech duration (50-2000ms, default: 100)">
        <input
          v-model.number="settings.minSpeechDurationMs"
          type="number"
          min="50"
          max="2000"
          step="10"
          class="form-input max-w-xs"
          placeholder="100"
        />
      </FormField>

      <FormField label="Minimum Silence Duration (ms)" hint="VAD" help="Minimum silence duration (50-2000ms, default: 100)">
        <input
          v-model.number="settings.minSilenceDurationMs"
          type="number"
          min="50"
          max="2000"
          step="10"
          class="form-input max-w-xs"
          placeholder="100"
        />
      </FormField>
    </div>

    <FormField label="Enable Logging" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.enableLogging"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          When disabled, zero retention mode is used (enterprise only)
        </span>
      </label>
    </FormField>
  </div>
</template>
