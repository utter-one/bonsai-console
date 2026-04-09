<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import FormField from '@/components/FormField.vue'
import type { SpeechmaticsAsrSettings } from '@/api/types'

const settings = defineModel<SpeechmaticsAsrSettings>({ required: true })

const newVocabWord = ref('')

function addVocabWord() {
  if (!newVocabWord.value.trim()) return
  if (!settings.value.additionalVocab) {
    settings.value.additionalVocab = []
  }
  settings.value.additionalVocab.push(newVocabWord.value.trim())
  newVocabWord.value = ''
}

function removeVocabWord(index: number) {
  settings.value.additionalVocab?.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Speechmatics Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure Speechmatics speech recognition settings for this project
      </p>
    </div>

    <FormField label="Audio Format" required class="w-full" help="Audio input format for speech recognition">
      <select
        v-model="settings.audioFormat"
        class="form-select-auto min-w-64"
      >
        <option value="pcm_16000">PCM 16kHz (Recommended)</option>
        <option value="pcm_8000">PCM 8kHz</option>
        <option value="pcm_44100">PCM 44.1kHz</option>
      </select>
    </FormField>

    <FormField label="Transcription Mode" required class="w-full" help="Standard for faster processing or Enhanced for higher accuracy">
      <select
        v-model="settings.transcriptionMode"
        class="form-select-auto min-w-64"
      >
        <option value="standard">Standard (Faster processing)</option>
        <option value="enhanced">Enhanced (Higher accuracy)</option>
      </select>
    </FormField>

    <FormField label="Language" class="w-full" help="Language code for speech recognition (BCP-47 format)">
      <input
        v-model="settings.language"
        type="text"
        placeholder="e.g., en, en-US, es, fr"
        class="form-input"
      />
    </FormField>

    <FormField label="Max Delay (seconds)" class="w-full" help="Maximum delay for transcription results (0-10 seconds). Lower values reduce latency">
      <input
        v-model.number="settings.maxDelay"
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="0-10"
        class="form-input max-w-xs"
      />
    </FormField>

    <div class="space-y-4">
      <h5 class="text-sm font-medium text-gray-900 dark:text-white">Features</h5>

      <div class="flex items-start">
        <input
          id="speechmatics-punctuation"
          v-model="settings.enablePunctuation"
          type="checkbox"
          class="form-checkbox mt-1"
        />
        <label for="speechmatics-punctuation" class="ml-3 flex-1">
          <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Punctuation</span>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Add automatic punctuation to transcripts (default: enabled)
          </p>
        </label>
      </div>

      <div class="flex items-start">
        <input
          id="speechmatics-formatting"
          v-model="settings.enableFormatting"
          type="checkbox"
          class="form-checkbox mt-1"
        />
        <label for="speechmatics-formatting" class="ml-3 flex-1">
          <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Formatting</span>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Format numbers, dates, currency, and other entities automatically
          </p>
        </label>
      </div>

      <div class="flex items-start">
        <input
          id="speechmatics-diarization"
          v-model="settings.enableDiarization"
          type="checkbox"
          class="form-checkbox mt-1"
        />
        <label for="speechmatics-diarization" class="ml-3 flex-1">
          <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Speaker Diarization</span>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Detect and label different speakers in the audio
          </p>
        </label>
      </div>
    </div>

    <FormField label="Custom Vocabulary" class="w-full">
      <div class="space-y-3">
        <div class="flex gap-2 max-w-xs">
          <input
            v-model="newVocabWord"
            type="text"
            placeholder="Enter word or phrase"
            class="form-input flex-1"
            @keyup.enter="addVocabWord"
          />
          <button
            type="button"
            @click="addVocabWord"
            class="btn-secondary whitespace-nowrap"
          >
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        <div v-if="settings.additionalVocab && settings.additionalVocab.length > 0" class="space-y-2">
          <div
            v-for="(word, index) in settings.additionalVocab"
            :key="index"
            class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ word }}</span>
            <button
              type="button"
              @click="removeVocabWord(index)"
              class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              title="Remove vocabulary item"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="form-help-text mt-2">
          Custom words or phrases to improve recognition accuracy
        </p>
      </div>
    </FormField>
  </div>
</template>
