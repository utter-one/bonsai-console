<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import FormField from '@/components/FormField.vue'
import type { AssemblyAiAsrSettings } from '@/api/types'

const settings = defineModel<AssemblyAiAsrSettings>({ required: true })

const newKeyterm = ref('')

function addKeyterm() {
  if (!newKeyterm.value.trim()) return
  if (!settings.value.keytermsPrompt) {
    settings.value.keytermsPrompt = []
  }
  settings.value.keytermsPrompt.push(newKeyterm.value.trim())
  newKeyterm.value = ''
}

function removeKeyterm(index: number) {
  settings.value.keytermsPrompt?.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">AssemblyAI ASR Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure AssemblyAI speech recognition settings for this project
      </p>
    </div>

    <FormField label="Sample Rate" required class="w-full" help="Audio sample rate (default: 16000)">
      <select
        v-model.number="settings.sampleRate"
        class="form-select-auto min-w-64"
      >
        <option :value="8000">8000 Hz</option>
        <option :value="16000">16000 Hz (default)</option>
        <option :value="22050">22050 Hz</option>
        <option :value="24000">24000 Hz</option>
        <option :value="44100">44100 Hz</option>
      </select>
    </FormField>

    <FormField label="Speech Model" required class="w-full" help="Model: English-only or multilingual support">
      <select
        v-model="settings.speechModel"
        class="form-select-auto min-w-64"
      >
        <option value="universal-streaming-english">Universal Streaming (English)</option>
        <option value="universal-streaming-multilingual">Universal Streaming (Multilingual)</option>
      </select>
    </FormField>

    <FormField v-if="settings.speechModel === 'universal-streaming-multilingual'" label="Language Code" class="w-full" help="Language for multilingual model (en, es, fr, de, it, pt)">
      <input
        v-model="settings.language"
        type="text"
        placeholder="e.g., en, es, fr, de, it, pt"
        class="form-input"
      />
    </FormField>

    <FormField label="Format Turns" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.formatTurns"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Add Capitalization &amp; Punctuation (warning: adds latency)
        </span>
      </label>
    </FormField>

    <FormField label="VAD Threshold" help="Voice activity detection threshold (0.0-1.0, default: 0.4)">
      <input
        v-model.number="settings.vadThreshold"
        type="number"
        min="0"
        max="1"
        step="0.05"
        placeholder="0.4"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="End of Turn Confidence" help="Confidence threshold for end of turn (0.0-1.0, default: 0.4)">
      <input
        v-model.number="settings.endOfTurnConfidenceThreshold"
        type="number"
        min="0"
        max="1"
        step="0.05"
        placeholder="0.4"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="Min Silence (Confident) (ms)" help="Minimum silence when confident (default: 400ms)">
      <input
        v-model.number="settings.minEndOfTurnSilenceWhenConfident"
        type="number"
        min="0"
        placeholder="400"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="Max Turn Silence (ms)" help="Maximum silence before end of turn (default: 1280ms)">
      <input
        v-model.number="settings.maxTurnSilence"
        type="number"
        min="0"
        placeholder="1280"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="Inactivity Timeout (seconds)" class="w-full" help="Time before session termination (5-3600s, optional)">
      <input
        v-model.number="settings.inactivityTimeout"
        type="number"
        min="5"
        max="3600"
        placeholder="No timeout"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="Custom Keywords" class="w-full">
      <div class="flex gap-2 mb-2 max-w-xs">
        <input
          v-model="newKeyterm"
          type="text"
          placeholder="Add a keyword"
          class="form-input"
          @keyup.enter="addKeyterm"
        />
        <button
          type="button"
          @click="addKeyterm"
          class="btn-secondary whitespace-nowrap"
        >
          <Plus class="inline-block w-4 h-4 mr-1" />
          Add
        </button>
      </div>
      <div v-if="settings.keytermsPrompt && settings.keytermsPrompt.length > 0" class="space-y-2">
        <div
          v-for="(keyterm, index) in settings.keytermsPrompt"
          :key="index"
          class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        >
          <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ keyterm }}</span>
          <button
            type="button"
            @click="removeKeyterm(index)"
            class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            title="Remove keyword"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      <p class="form-help-text mt-2">
        Custom words/phrases to improve recognition accuracy
      </p>
    </FormField>
  </div>
</template>
