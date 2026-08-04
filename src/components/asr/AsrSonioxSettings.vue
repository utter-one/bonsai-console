<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import FormField from '@/components/FormField.vue'
import type { SonioxAsrSettings, SonioxContextKey, SonioxTranslationTerm } from '@/api/types'

const settings = defineModel<SonioxAsrSettings>({ required: true })

const translationType = ref<'one_way' | 'two_way'>('one_way')
const translationTargetLanguage = ref('')
const translationLanguageA = ref('')
const translationLanguageB = ref('')

const contextKeys = ref<SonioxContextKey[]>([])
const contextText = ref('')
const contextTerms = ref<string[]>([])
const newContextKey = ref('')
const newContextValue = ref('')
const newTerm = ref('')

const translationTerms = ref<SonioxTranslationTerm[]>([])
const newTranslationSource = ref('')
const newTranslationTarget = ref('')
const newLanguageHint = ref('')

function syncTranslation() {
  const t = settings.value?.translation
  if (t) {
    translationType.value = t.type
    if (t.type === 'one_way') {
      translationTargetLanguage.value = t.targetLanguage || ''
    } else {
      translationLanguageA.value = t.languageA || ''
      translationLanguageB.value = t.languageB || ''
    }
  } else {
    translationType.value = 'one_way'
    translationTargetLanguage.value = ''
    translationLanguageA.value = ''
    translationLanguageB.value = ''
  }
}

function syncContext() {
  const c = settings.value?.context
  if (c) {
    contextKeys.value = [...(c.general || [])]
    contextText.value = c.text || ''
    contextTerms.value = [...(c.terms || [])]
    translationTerms.value = [...(c.translationTerms || [])]
  } else {
    contextKeys.value = []
    contextText.value = ''
    contextTerms.value = []
    translationTerms.value = []
  }
}

watch(() => settings.value, () => {
  syncTranslation()
  syncContext()
}, { immediate: true })

watch([translationType, translationTargetLanguage, translationLanguageA, translationLanguageB], () => {
  if (translationType.value === 'one_way' && translationTargetLanguage.value) {
    settings.value.translation = {
      type: 'one_way',
      targetLanguage: translationTargetLanguage.value,
    }
  } else if (translationType.value === 'two_way' && translationLanguageA.value && translationLanguageB.value) {
    settings.value.translation = {
      type: 'two_way',
      languageA: translationLanguageA.value,
      languageB: translationLanguageB.value,
    }
  } else {
    settings.value.translation = undefined
  }
})

watch([contextKeys, contextText, contextTerms, translationTerms], () => {
  settings.value.context = {
    general: contextKeys.value.length > 0 ? [...contextKeys.value] : undefined,
    text: contextText.value || undefined,
    terms: contextTerms.value.length > 0 ? [...contextTerms.value] : undefined,
    translationTerms: translationTerms.value.length > 0 ? [...translationTerms.value] : undefined,
  }
})

function addContextKey() {
  if (!newContextKey.value.trim() || !newContextValue.value.trim()) return
  contextKeys.value.push({ key: newContextKey.value.trim(), value: newContextValue.value.trim() })
  newContextKey.value = ''
  newContextValue.value = ''
}

function removeContextKey(index: number) {
  contextKeys.value.splice(index, 1)
}

function addTerm() {
  if (!newTerm.value.trim()) return
  contextTerms.value.push(newTerm.value.trim())
  newTerm.value = ''
}

function removeTerm(index: number) {
  contextTerms.value.splice(index, 1)
}

function addTranslationTerm() {
  if (!newTranslationSource.value.trim() || !newTranslationTarget.value.trim()) return
  translationTerms.value.push({ source: newTranslationSource.value.trim(), target: newTranslationTarget.value.trim() })
  newTranslationSource.value = ''
  newTranslationTarget.value = ''
}

function removeTranslationTerm(index: number) {
  translationTerms.value.splice(index, 1)
}

function addLanguageHint() {
  if (!newLanguageHint.value.trim()) return
  if (!settings.value.languageHints) {
    settings.value.languageHints = []
  }
  settings.value.languageHints.push(newLanguageHint.value.trim())
  newLanguageHint.value = ''
}

function removeLanguageHint(index: number) {
  if (!settings.value.languageHints) return
  settings.value.languageHints.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6 mt-4">
    <div>
      <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Soniox ASR Settings</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Configure Soniox speech recognition settings for this project
      </p>
    </div>

    <FormField label="Model ID" class="w-full" help="Model to use for transcription (defaults to stt-rt-v5)">
      <input
        v-model="settings.model"
        type="text"
        placeholder="e.g., stt-rt-v5"
        class="form-input"
      />
    </FormField>

    <FormField label="Audio Format" class="w-full" help="Audio encoding format for speech-to-text">
      <select
        v-model="settings.audioFormat"
        class="form-select-auto min-w-64"
      >
        <option :value="undefined">Default (PCM 16kHz)</option>
        <option value="pcm_16000">PCM 16kHz</option>
        <option value="pcm_8000">PCM 8kHz</option>
        <option value="pcm_22050">PCM 22.05kHz</option>
        <option value="pcm_24000">PCM 24kHz</option>
        <option value="pcm_44100">PCM 44.1kHz</option>
      </select>
    </FormField>

    <FormField label="Num Channels" class="w-full" help="Number of audio channels for multi-speaker diarization (1-8)">
      <input
        v-model.number="settings.numChannels"
        type="number"
        min="1"
        max="8"
        placeholder="Leave empty for default"
        class="form-input max-w-xs"
      />
    </FormField>

    <FormField label="Language Hints" class="w-full" help="Array of language codes for transcription hints (e.g., en, es)">
      <div class="flex gap-2 mb-2">
        <input
          v-model="newLanguageHint"
          type="text"
          placeholder="Add language code"
          class="form-input max-w-64"
          @keyup.enter="addLanguageHint"
        />
        <button
          type="button"
          @click="addLanguageHint"
          class="btn-secondary whitespace-nowrap"
        >
          <Plus class="inline-block w-4 h-4 mr-1" />
          Add
        </button>
      </div>
      <div v-if="settings.languageHints && settings.languageHints.length > 0" class="space-y-2">
        <div
          v-for="(hint, index) in settings.languageHints"
          :key="index"
          class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        >
          <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ hint }}</span>
          <button
            type="button"
            @click="removeLanguageHint(index)"
            class="btn-icon-action-danger"
            title="Remove language hint"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </FormField>

    <FormField label="Language Hints Strict" class="w-full" help="When true, only transcribe in the specified language">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.languageHintsStrict"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Only transcribe in the specified language
        </span>
      </label>
    </FormField>

    <FormField label="Speaker Diarization" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.enableSpeakerDiarization"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Enable speaker identification to distinguish different speakers
        </span>
      </label>
    </FormField>

    <FormField label="Language Identification" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="settings.enableLanguageIdentification"
          type="checkbox"
          class="form-checkbox"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Enable automatic language detection when language is not specified
        </span>
      </label>
    </FormField>

    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h5 class="text-sm font-semibold text-gray-900 mb-3 dark:text-white">Translation</h5>

      <FormField label="Translation Type" class="w-full">
        <select
          v-model="translationType"
          class="form-select-auto min-w-64"
        >
          <option value="one_way">One-way translation</option>
          <option value="two_way">Two-way translation</option>
        </select>
      </FormField>

      <div v-if="translationType === 'one_way'" class="space-y-4 mt-3">
        <FormField label="Target Language" class="w-full" help="Target language code for translation (e.g., 'es')">
          <input
            v-model="translationTargetLanguage"
            type="text"
            placeholder="e.g., es"
            class="form-input"
          />
        </FormField>
      </div>

      <div v-if="translationType === 'two_way'" class="space-y-4 mt-3">
        <FormField label="Language A" class="w-full" help="First language code for bidirectional translation (e.g., 'en')">
          <input
            v-model="translationLanguageA"
            type="text"
            placeholder="e.g., en"
            class="form-input"
          />
        </FormField>

        <FormField label="Language B" class="w-full" help="Second language code for bidirectional translation (e.g., 'es')">
          <input
            v-model="translationLanguageB"
            type="text"
            placeholder="e.g., es"
            class="form-input"
          />
        </FormField>
      </div>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h5 class="text-sm font-semibold text-gray-900 mb-3 dark:text-white">Context</h5>

      <FormField label="Context Keys" class="w-full" help="Key-value pairs for improved recognition">
        <div class="flex gap-2 mb-2">
          <input
            v-model="newContextKey"
            type="text"
            placeholder="Key"
            class="form-input max-w-32"
          />
          <input
            v-model="newContextValue"
            type="text"
            placeholder="Value"
            class="form-input max-w-32"
            @keyup.enter="addContextKey"
          />
          <button
            type="button"
            @click="addContextKey"
            class="btn-secondary whitespace-nowrap"
          >
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        <div v-if="contextKeys.length > 0" class="space-y-2">
          <div
            v-for="(item, index) in contextKeys"
            :key="index"
            class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <span class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ item.key }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">=</span>
            <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ item.value }}</span>
            <button
              type="button"
              @click="removeContextKey(index)"
              class="btn-icon-action-danger"
              title="Remove context key"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </FormField>

      <FormField label="Context Text" class="w-full" help="Custom context text to guide transcription">
        <textarea
          v-model="contextText"
          rows="3"
          placeholder="Enter custom context text..."
          class="form-input"
        />
      </FormField>

      <FormField label="Context Terms" class="w-full" help="Important terms or phrases to prioritize in recognition">
        <div class="flex gap-2 mb-2">
          <input
            v-model="newTerm"
            type="text"
            placeholder="Add a term"
            class="form-input max-w-64"
            @keyup.enter="addTerm"
          />
          <button
            type="button"
            @click="addTerm"
            class="btn-secondary whitespace-nowrap"
          >
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        <div v-if="contextTerms.length > 0" class="space-y-2">
          <div
            v-for="(term, index) in contextTerms"
            :key="index"
            class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ term }}</span>
            <button
              type="button"
              @click="removeTerm(index)"
              class="btn-icon-action-danger"
              title="Remove term"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </FormField>

      <FormField label="Translation Terms" class="w-full" help="Source-target term pairs for improved translation accuracy">
        <div class="flex gap-2 mb-2">
          <input
            v-model="newTranslationSource"
            type="text"
            placeholder="Source"
            class="form-input max-w-32"
          />
          <input
            v-model="newTranslationTarget"
            type="text"
            placeholder="Target"
            class="form-input max-w-32"
            @keyup.enter="addTranslationTerm"
          />
          <button
            type="button"
            @click="addTranslationTerm"
            class="btn-secondary whitespace-nowrap"
          >
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        <div v-if="translationTerms.length > 0" class="space-y-2">
          <div
            v-for="(item, index) in translationTerms"
            :key="index"
            class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <span class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ item.source }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">→</span>
            <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ item.target }}</span>
            <button
              type="button"
              @click="removeTranslationTerm(index)"
              class="btn-icon-action-danger"
              title="Remove translation term"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </FormField>
    </div>
  </div>
</template>
