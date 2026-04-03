<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import FormField from '@/components/FormField.vue'
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
            <FormField label="Instructions" hint="(optional, gpt-4o-mini-tts only)" class="w-full" help="Voice control instructions for gpt-4o-mini-tts model. Only supported by gpt-4o-mini-tts.">
              <textarea
                v-model="(model as OpenAiTtsSettings).instructions"
                rows="3"
                class="form-textarea"
                placeholder="Controls accent, tone, emotion, speed, whispering, etc."
                :disabled="isLoading"
              ></textarea>
            </FormField>

            <!-- Speed -->
            <FormField :label="`Speed: ${((model as any).speed ?? 1.0).toFixed(2)}`" class="w-full" help="Speech speed (0.25-4.0), defaults to 1.0">
              <input
                v-model.number="(model as any).speed"
                type="range"
                min="0.25"
                max="4.0"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>
          </div>

          <!-- Voice Settings Section (Deepgram) -->
          <div v-if="isDeepgram" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Deepgram)</h3>

            <!-- Sample Rate -->
            <FormField label="Sample Rate (Hz)" class="w-full" help="Audio sample rate in Hz. Higher values provide better quality but larger file sizes. Common values: 8000, 16000, 24000, 48000.">
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
            </FormField>

            <!-- Bit Rate -->
            <FormField label="Bit Rate" hint="(optional)" class="w-full" help="Bit rate for compressed formats (mp3, opus, aac). Higher values provide better quality.">
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
            </FormField>

            <!-- Container -->
            <FormField label="Container Format" class="w-full" help='Audio container format. Use "none" for raw audio, "wav" for WAV container, "ogg" for Ogg container'>
              <select
                v-model="(model as DeepgramTtsSettings).container"
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="none">None (raw audio)</option>
                <option value="wav">WAV</option>
                <option value="ogg">Ogg</option>
              </select>
            </FormField>
          </div>

          <!-- Voice Settings Section (Cartesia) -->
          <div v-if="isCartesia" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Cartesia)</h3>

            <!-- Language -->
            <FormField label="Language" class="w-full" help="Language code for speech synthesis (e.g., en, es, fr). Sonic-3 supports 42 languages.">
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
            </FormField>

            <!-- Speed -->
            <FormField label="Speed" class="w-full" help='Speech speed control. Defaults to "normal".'>
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
            </FormField>

            <!-- Emotion Tags -->
            <FormField label="Emotion Tags" hint="(optional)" class="w-full" help='Emotion tags for expressive speech (comma-separated, e.g., "positivity:high, curiosity"). See Cartesia emotion documentation.'>
              <textarea
                v-model="emotionTagsInput"
                rows="2"
                class="form-textarea"
                placeholder="positivity:high, curiosity"
                :disabled="isLoading"
              ></textarea>
            </FormField>

            <!-- Max Buffer Delay -->
            <FormField :label="`Max Buffer Delay: ${(model as CartesiaTtsSettings).maxBufferDelayMs ?? 3000}ms`" class="w-full" help="Maximum time in milliseconds to buffer text chunks before sending to TTS (0-5000ms). Defaults to 3000ms. Set to 0 to disable buffering.">
              <input
                v-model.number="(model as CartesiaTtsSettings).maxBufferDelayMs"
                type="range"
                min="0"
                max="5000"
                step="100"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>
          </div>

          <!-- Voice Settings Section (ElevenLabs) -->
          <div v-if="isElevenLabs" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (ElevenLabs)</h3>

            <!-- Stability -->
            <FormField :label="`Stability: ${((model as ElevenLabsTtsSettings).stability ?? 0.5).toFixed(2)}`" class="w-full" help="Voice stability (0.0-1.0), defaults to 0.5">
              <input
                v-model.number="(model as ElevenLabsTtsSettings).stability"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Similarity Boost -->
            <FormField :label="`Similarity Boost: ${((model as ElevenLabsTtsSettings).similarityBoost ?? 0.75).toFixed(2)}`" class="w-full" help="Similarity boost (0.0-1.0), defaults to 0.75">
              <input
                v-model.number="(model as ElevenLabsTtsSettings).similarityBoost"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Style -->
            <FormField :label="`Style: ${((model as ElevenLabsTtsSettings).style ?? 0).toFixed(2)}`" class="w-full" help="Style setting for V2+ models (0.0-1.0), defaults to 0">
              <input
                v-model.number="(model as ElevenLabsTtsSettings).style"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Speed -->
            <FormField :label="`Speed: ${((model as any).speed ?? 1.0).toFixed(2)}`" class="w-full" help="Speech speed (0.7-1.2), defaults to 1.0">
              <input
                v-model.number="(model as any).speed"
                type="range"
                min="0.7"
                max="1.2"
                step="0.01"
                class="block min-w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :disabled="isLoading"
              />
            </FormField>
          </div>

          <!-- Voice Settings Section (Azure) -->
          <div v-if="isAzure" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Azure Speech)</h3>

            <!-- Style -->
            <FormField label="Style" class="w-full" help='Speaking style for voices that support it (e.g., "cheerful", "sad", "angry", "friendly"). Optional.'>
              <input
                v-model="(model as AzureTtsSettings).style"
                type="text"
                placeholder="cheerful, sad, angry, friendly, etc."
                class="form-input"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Rate -->
            <FormField label="Rate" class="w-full" help='Speaking rate adjustment. Can be decimal (0.5 to 2.0) or percentage ("+10%", "-5%"). Defaults to 1.0 (normal speed).'>
              <input
                v-model="(model as AzureTtsSettings).rate"
                type="text"
                placeholder="1.0 or +10% or -5%"
                class="form-input max-w-64"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Pitch -->
            <FormField label="Pitch" class="w-full" help='Pitch adjustment. Can be percentage ("+5%", "-10%") or descriptive ("high", "low"). Range typically -50% to +50%.'>
              <input
                v-model="(model as AzureTtsSettings).pitch"
                type="text"
                placeholder="0% or +5% or -10%"
                class="form-input max-w-64"
                :disabled="isLoading"
              />
            </FormField>

            <!-- Inactivity Timeout (ElevenLabs only) -->
            <FormField v-if="isElevenLabs" label="Inactivity Timeout (seconds)" class="w-full" help="WebSocket inactivity timeout in seconds (defaults to 180)">
              <input
                v-model.number="(model as ElevenLabsTtsSettings).inactivityTimeout"
                type="number"
                min="1"
                class="form-input max-w-xs"
                :disabled="isLoading"
              />
            </FormField>
          </div>

          <!-- Voice Settings Section (Amazon Polly) -->
          <div v-if="isAmazonPolly" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings (Amazon Polly)</h3>

            <!-- Language Code -->
            <FormField label="Language Code" hint="(optional)" class="w-full" help="BCP-47 language code override. By default inferred from the selected voice.">
              <input
                v-model="(model as AmazonPollyTtsSettings).languageCode"
                type="text"
                placeholder="e.g., en-US, en-GB, es-ES"
                class="form-input"
                :disabled="isLoading"
              />
            </FormField>
          </div>

          <!-- Boolean Settings Section -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Settings</h3>

            <!-- Use Speaker Boost (ElevenLabs only) -->
            <FormField v-if="isElevenLabs" help="Enable speaker boost for V2+ models (defaults to true)">
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
            </FormField>

            <!-- Remove Exclamation Marks -->
            <FormField help="Replace exclamation marks with periods (can reduce overly excited speech)">
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
            </FormField>

            <!-- Use Global Preview (ElevenLabs only) -->
            <FormField v-if="isElevenLabs" help="Use global preview endpoint for geographic proximity optimization (can reduce latency)">
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
            </FormField>

            <!-- Use Sentence Splitter -->
            <FormField :help="isCartesia ? 'Whether to use sentence splitter for text processing. Defaults to false (uses streaming with continuations instead).' : 'Send only full sentences to TTS (can introduce small latency)'">
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
            </FormField>
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
