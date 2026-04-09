<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import FormField from '@/components/FormField.vue'
import type { AzureAsrSettings } from '@/api/types'

const settings = defineModel<AzureAsrSettings>({ required: true })

const newPhrase = ref('')

function addDictionaryPhrase() {
  if (!newPhrase.value.trim()) return
  if (!settings.value.dictionaryPhrases) {
    settings.value.dictionaryPhrases = []
  }
  settings.value.dictionaryPhrases.push(newPhrase.value.trim())
  newPhrase.value = ''
}

function removeDictionaryPhrase(index: number) {
  settings.value.dictionaryPhrases?.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Azure Speech Recognition Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure Azure Speech Recognition settings for this project
      </p>
    </div>

    <FormField label="Language" class="w-full" help='Language code for speech recognition (e.g., "en-US", "es-ES", "fr-FR")'>
      <input
        v-model="settings.language"
        type="text"
        placeholder="e.g., en-US, es-ES, fr-FR"
        class="form-input"
      />
    </FormField>

    <FormField label="Audio Format" class="w-full" help="Audio input format for speech recognition">
      <select
        v-model="settings.audioFormat"
        class="form-select-auto min-w-64"
      >
        <option :value="undefined">Default</option>
        <option value="mp3">MP3</option>
        <option value="opus">Opus</option>
        <option value="aac">AAC</option>
        <option value="flac">FLAC</option>
        <option value="wav">WAV</option>
        <option value="pcm_8000">PCM 8kHz</option>
        <option value="pcm_16000">PCM 16kHz</option>
        <option value="pcm_22050">PCM 22.05kHz</option>
        <option value="pcm_24000">PCM 24kHz</option>
        <option value="pcm_44100">PCM 44.1kHz</option>
        <option value="pcm_48000">PCM 48kHz</option>
        <option value="mulaw">μ-law</option>
        <option value="alaw">A-law</option>
        <option value="linear16">Linear16</option>
      </select>
    </FormField>

    <FormField label="Dictionary Phrases" class="w-full">
      <div class="flex gap-2 mb-2">
        <input
          v-model="newPhrase"
          type="text"
          placeholder="Add a phrase"
          class="form-input max-w-64"
          @keyup.enter="addDictionaryPhrase"
        />
        <button
          type="button"
          @click="addDictionaryPhrase"
          class="btn-secondary whitespace-nowrap"
        >
          <Plus class="inline-block w-4 h-4 mr-1" />
          Add
        </button>
      </div>
      <div v-if="settings.dictionaryPhrases && settings.dictionaryPhrases.length > 0" class="space-y-2">
        <div
          v-for="(phrase, index) in settings.dictionaryPhrases"
          :key="index"
          class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        >
          <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ phrase }}</span>
          <button
            type="button"
            @click="removeDictionaryPhrase(index)"
            class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            title="Remove phrase"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      <p class="form-help-text mt-2">
        Custom phrases to improve recognition accuracy for domain-specific terms
      </p>
    </FormField>
  </div>
</template>
