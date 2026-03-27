<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import type {
  ElevenLabsTtsSettings,
  OpenAiTtsSettings,
  DeepgramTtsSettings,
  CartesiaTtsSettings,
  AzureTtsSettings,
  AmazonPollyTtsSettings,
} from '@/api/types'

type TtsSettings =
  | ElevenLabsTtsSettings
  | OpenAiTtsSettings
  | DeepgramTtsSettings
  | CartesiaTtsSettings
  | AzureTtsSettings
  | AmazonPollyTtsSettings

const props = defineProps<{
  apiType: string
  isLoading?: boolean
}>()

const model = defineModel<TtsSettings>({ required: true })

const isElevenLabs = computed(() => props.apiType === 'elevenlabs')
const isOpenAI = computed(() => props.apiType === 'openai')
const isDeepgram = computed(() => props.apiType === 'deepgram')
const isCartesia = computed(() => props.apiType === 'cartesia')
const isAzure = computed(() => props.apiType === 'azure')
const isAmazonPolly = computed(() => props.apiType === 'amazon-polly')

const emotionTagsInput = computed({
  get: () => {
    if (!isCartesia.value) return ''
    const emotion = (model.value as CartesiaTtsSettings).emotion
    return emotion ? emotion.join(', ') : ''
  },
  set: (value: string) => {
    if (!isCartesia.value) return
    const settings = model.value as CartesiaTtsSettings
    settings.emotion = value
      ? value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : []
  },
})

function addNoSpeechMarker() {
  const settings = model.value as any
  if (!settings.noSpeechMarkers) {
    settings.noSpeechMarkers = []
  }
  settings.noSpeechMarkers.push({ start: '', end: '' })
}

function removeNoSpeechMarker(index: number) {
  const settings = model.value as any
  if (settings.noSpeechMarkers) {
    settings.noSpeechMarkers.splice(index, 1)
  }
}
</script>

<template>
  <!-- Voice Settings Section (OpenAI) -->
          <div v-if="isOpenAI" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (OpenAI)</h3>

            <!-- Instructions -->
            <div class="form-group">
              <label class="form-label">
                Instructions <span class="text-gray-500">(optional, gpt-4o-mini-tts only)</span>
              </label>
              <textarea
                v-model="(model as OpenAiTtsSettings).instructions"
                rows="3"
                class="form-textarea"
                placeholder="Controls accent, tone, emotion, speed, whispering, etc."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Voice control instructions for gpt-4o-mini-tts model. Only supported by gpt-4o-mini-tts.
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">
                Speed: {{ ((model as any).speed ?? 1.0).toFixed(2) }}
              </label>
              <input
                v-model.number="(model as any).speed"
                type="range"
                min="0.25"
                max="4.0"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speech speed (0.25-4.0), defaults to 1.0
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Deepgram) -->
          <div v-if="isDeepgram" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Deepgram)</h3>

            <!-- Sample Rate -->
            <div class="form-group">
              <label class="form-label">Sample Rate (Hz)</label>
              <select
                v-model.number="(model as DeepgramTtsSettings).sampleRate"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option :value="undefined">Default</option>
                <option :value="8000">8000 Hz</option>
                <option :value="16000">16000 Hz</option>
                <option :value="24000">24000 Hz (Recommended)</option>
                <option :value="48000">48000 Hz</option>
              </select>
              <p class="form-help-text">
                Audio sample rate in Hz. Higher values provide better quality but larger file sizes. Common values: 8000, 16000, 24000, 48000.
              </p>
            </div>

            <!-- Bit Rate -->
            <div class="form-group">
              <label class="form-label">
                Bit Rate <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model.number="(model as DeepgramTtsSettings).bitRate"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option :value="undefined">Default</option>
                <option :value="32000">32 kbps</option>
                <option :value="64000">64 kbps</option>
                <option :value="96000">96 kbps</option>
                <option :value="128000">128 kbps</option>
                <option :value="192000">192 kbps</option>
                <option :value="256000">256 kbps</option>
              </select>
              <p class="form-help-text">
                Bit rate for compressed formats (mp3, opus, aac). Higher values provide better quality.
              </p>
            </div>

            <!-- Container -->
            <div class="form-group">
              <label class="form-label">Container Format</label>
              <select
                v-model="(model as DeepgramTtsSettings).container"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="none">None (raw audio)</option>
                <option value="wav">WAV</option>
                <option value="ogg">Ogg</option>
              </select>
              <p class="form-help-text">
                Audio container format. Use "none" for raw audio, "wav" for WAV container, "ogg" for Ogg container
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Cartesia) -->
          <div v-if="isCartesia" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Cartesia)</h3>

            <!-- Language -->
            <div class="form-group">
              <label class="form-label">Language</label>
              <select
                v-model="(model as CartesiaTtsSettings).language"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="it">Italian (it)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="nl">Dutch (nl)</option>
                <option value="pl">Polish (pl)</option>
                <option value="ru">Russian (ru)</option>
                <option value="zh">Chinese (zh)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="ko">Korean (ko)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="tr">Turkish (tr)</option>
                <option value="sv">Swedish (sv)</option>
                <option value="da">Danish (da)</option>
                <option value="no">Norwegian (no)</option>
                <option value="fi">Finnish (fi)</option>
                <option value="cs">Czech (cs)</option>
              </select>
              <p class="form-help-text">
                Language code for speech synthesis (e.g., en, es, fr). Sonic-3 supports 42 languages.
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">Speed</label>
              <select
                v-model="(model as CartesiaTtsSettings).speed"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="slowest">Slowest</option>
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
                <option value="fastest">Fastest</option>
              </select>
              <p class="form-help-text">
                Speech speed control. Defaults to "normal".
              </p>
            </div>

            <!-- Emotion Tags -->
            <div class="form-group">
              <label class="form-label">
                Emotion Tags <span class="text-gray-500">(optional)</span>
              </label>
              <textarea
                v-model="emotionTagsInput"
                rows="2"
                class="form-textarea"
                placeholder="positivity:high, curiosity"
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Emotion tags for expressive speech (comma-separated, e.g., "positivity:high, curiosity"). See Cartesia emotion documentation.
              </p>
            </div>

            <!-- Max Buffer Delay -->
            <div class="form-group">
              <label class="form-label">
                Max Buffer Delay: {{ (model as CartesiaTtsSettings).maxBufferDelayMs ?? 3000 }}ms
              </label>
              <input
                v-model.number="(model as CartesiaTtsSettings).maxBufferDelayMs"
                type="range"
                min="0"
                max="5000"
                step="100"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Maximum time in milliseconds to buffer text chunks before sending to TTS (0-5000ms). Defaults to 3000ms. Set to 0 to disable buffering.
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (ElevenLabs) -->
          <div v-if="isElevenLabs" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (ElevenLabs)</h3>

            <!-- Stability -->
            <div class="form-group">
              <label class="form-label">
                Stability: {{ ((model as ElevenLabsTtsSettings).stability ?? 0.5).toFixed(2) }}
              </label>
              <input
                v-model.number="(model as ElevenLabsTtsSettings).stability"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Voice stability (0.0-1.0), defaults to 0.5
              </p>
            </div>

            <!-- Similarity Boost -->
            <div class="form-group">
              <label class="form-label">
                Similarity Boost: {{ ((model as ElevenLabsTtsSettings).similarityBoost ?? 0.75).toFixed(2) }}
              </label>
              <input
                v-model.number="(model as ElevenLabsTtsSettings).similarityBoost"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Similarity boost (0.0-1.0), defaults to 0.75
              </p>
            </div>

            <!-- Style -->
            <div class="form-group">
              <label class="form-label">
                Style: {{ ((model as ElevenLabsTtsSettings).style ?? 0).toFixed(2) }}
              </label>
              <input
                v-model.number="(model as ElevenLabsTtsSettings).style"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Style setting for V2+ models (0.0-1.0), defaults to 0
              </p>
            </div>

            <!-- Speed -->
            <div class="form-group">
              <label class="form-label">
                Speed: {{ ((model as any).speed ?? 1.0).toFixed(2) }}
              </label>
              <input
                v-model.number="(model as any).speed"
                type="range"
                min="0.7"
                max="1.2"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speech speed (0.7-1.2), defaults to 1.0
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Azure) -->
          <div v-if="isAzure" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Azure Speech)</h3>

            <!-- Style -->
            <div class="form-group">
              <label class="form-label">
                Style
              </label>
              <input
                v-model="(model as AzureTtsSettings).style"
                type="text"
                placeholder="cheerful, sad, angry, friendly, etc."
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speaking style for voices that support it (e.g., "cheerful", "sad", "angry", "friendly"). Optional.
              </p>
            </div>

            <!-- Rate -->
            <div class="form-group">
              <label class="form-label">
                Rate
              </label>
              <input
                v-model="(model as AzureTtsSettings).rate"
                type="text"
                placeholder="1.0 or +10% or -5%"
                class="form-input max-w-64"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Speaking rate adjustment. Can be decimal (0.5 to 2.0) or percentage ("+10%", "-5%"). Defaults to 1.0 (normal speed).
              </p>
            </div>

            <!-- Pitch -->
            <div class="form-group">
              <label class="form-label">
                Pitch
              </label>
              <input
                v-model="(model as AzureTtsSettings).pitch"
                type="text"
                placeholder="0% or +5% or -10%"
                class="form-input max-w-64"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Pitch adjustment. Can be percentage ("+5%", "-10%") or descriptive ("high", "low"). Range typically -50% to +50%.
              </p>
            </div>

            <!-- Inactivity Timeout (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="form-label">
                Inactivity Timeout (seconds)
              </label>
              <input
                v-model.number="(model as ElevenLabsTtsSettings).inactivityTimeout"
                type="number"
                min="1"
                class="form-input max-w-xs"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                WebSocket inactivity timeout in seconds (defaults to 180)
              </p>
            </div>
          </div>

          <!-- Voice Settings Section (Amazon Polly) -->
          <div v-if="isAmazonPolly" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Amazon Polly)</h3>

            <!-- Language Code -->
            <div class="form-group">
              <label class="form-label">
                Language Code <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="(model as AmazonPollyTtsSettings).languageCode"
                type="text"
                placeholder="e.g., en-US, en-GB, es-ES"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                BCP-47 language code override. By default inferred from the selected voice.
              </p>
            </div>
          </div>

          <!-- Boolean Settings Section -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Settings</h3>

            <!-- Use Speaker Boost (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(model as ElevenLabsTtsSettings).useSpeakerBoost"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Speaker Boost
                </span>
              </label>
              <p class="form-help-text mt-1">
                Enable speaker boost for V2+ models (defaults to true)
              </p>
            </div>

            <!-- Remove Exclamation Marks -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(model as any).removeExclamationMarks"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Remove Exclamation Marks
                </span>
              </label>
              <p class="form-help-text mt-1">
                Replace exclamation marks with periods (can reduce overly excited speech)
              </p>
            </div>

            <!-- Use Global Preview (ElevenLabs only) -->
            <div v-if="isElevenLabs" class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(model as ElevenLabsTtsSettings).useGlobalPreview"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Use Global Preview
                </span>
              </label>
              <p class="form-help-text mt-1">
                Use global preview endpoint for geographic proximity optimization (can reduce latency)
              </p>
            </div>

            <!-- Use Sentence Splitter -->
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="(model as any).useSentenceSplitter"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Use Sentence Splitter
                </span>
              </label>
              <p v-if="isCartesia" class="form-help-text mt-1">
                Whether to use sentence splitter for text processing. Defaults to false (uses streaming with continuations instead).
              </p>
              <p v-else class="form-help-text mt-1">
                Send only full sentences to TTS (can introduce small latency)
              </p>
            </div>
          </div>

          <!-- No Speech Markers Section -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No Speech Markers</h3>
              <button
                @click="addNoSpeechMarker"
                type="button"
                class="btn-secondary text-sm"
                :disabled="isLoading"
              >
                <Plus class="inline-block mr-1 w-4 h-4" />
                Add Marker
              </button>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Define start and end markers to identify text sections that should not be spoken
            </p>

            <div v-if="!((model as any).noSpeechMarkers?.length)" class="text-center py-6 text-gray-500 text-sm">
              No speech markers defined
            </div>

            <div
              v-for="(marker, index) in ((model as any).noSpeechMarkers || [])"
              :key="index"
              class="flex gap-3 mb-3 items-start"
            >
              <div class="flex-1">
                <input
                  v-model="marker.start"
                  type="text"
                  placeholder="Start marker"
                  class="form-input"
                  :disabled="isLoading"
                />
              </div>
              <div class="flex-1">
                <input
                  v-model="marker.end"
                  type="text"
                  placeholder="End marker"
                  class="form-input"
                  :disabled="isLoading"
                />
              </div>
              <button
                @click="removeNoSpeechMarker(Number(index))"
                type="button"
                class="btn-icon text-red-600 hover:bg-red-50 mt-1"
                title="Remove marker"
                :disabled="isLoading"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
</template>
