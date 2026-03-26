<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">ASR Settings</h2>

      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select an ASR provider first
        </div>

        <template v-else>
          <!-- Azure ASR Settings -->
          <div v-if="isAzureAsrProvider" class="space-y-6 mt-4">
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Azure Speech Recognition Settings</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure Azure Speech Recognition settings for this project
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Language <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.settings.language"
                type="text"
                placeholder="e.g., en-US, es-ES, fr-FR"
                class="form-input"
              />
              <p class="form-help-text">
                Language code for speech recognition (e.g., "en-US", "es-ES", "fr-FR")
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Audio Format <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.settings.audioFormat"
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
              <p class="form-help-text">
                Audio input format for speech recognition
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Dictionary Phrases <span class="text-gray-500">(optional)</span>
              </label>
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
              <div v-if="form.settings.dictionaryPhrases && form.settings.dictionaryPhrases.length > 0" class="space-y-2">
                <div
                  v-for="(phrase, index) in form.settings.dictionaryPhrases"
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
            </div>
          </div>

          <!-- ElevenLabs ASR Settings -->
          <div v-if="isElevenLabsAsrProvider" class="space-y-6 mt-4">
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">ElevenLabs ASR Settings</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure ElevenLabs speech recognition settings for this project
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Model ID <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.settings.modelId"
                type="text"
                placeholder="e.g., scribe_v2_realtime"
                class="form-input"
              />
              <p class="form-help-text">
                Model to use for transcription (defaults to scribe_v2_realtime)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Audio Format <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.settings.audioFormat"
                class="form-select-auto min-w-64"
              >
                <option :value="undefined">Default (PCM 16kHz)</option>
                <option value="pcm_8000">PCM 8kHz</option>
                <option value="pcm_16000">PCM 16kHz</option>
                <option value="pcm_22050">PCM 22.05kHz</option>
                <option value="pcm_24000">PCM 24kHz</option>
                <option value="pcm_44100">PCM 44.1kHz</option>
              </select>
              <p class="form-help-text">
                Audio encoding format for speech-to-text
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Language Code <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.settings.languageCode"
                type="text"
                placeholder="e.g., en, es, fr"
                class="form-input"
              />
              <p class="form-help-text">
                Language code in ISO 639-1 or ISO 639-3 format (e.g., "en", "es")
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.includeTimestamps"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Include Timestamps
                </span>
              </label>
              <p class="form-help-text mt-1">
                Receive word-level timestamps in transcription results
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.includeLanguageDetection"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Include Language Detection
                </span>
              </label>
              <p class="form-help-text mt-1">
                Include detected language code in transcription results
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Commit Strategy <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.settings.commitStrategy"
                class="form-select-auto min-w-64"
              >
                <option :value="undefined">Default (Manual)</option>
                <option value="manual">Manual</option>
                <option value="vad">Voice Activity Detection (VAD)</option>
              </select>
              <p class="form-help-text">
                Strategy for committing transcriptions
              </p>
            </div>

            <!-- VAD Settings (shown when commit strategy is VAD) -->
            <div v-if="form.settings.commitStrategy === 'vad'" class="pl-4 border-l-2 border-green-200 bg-green-50 p-4 rounded-r space-y-4 dark:bg-green-900/20 dark:border-green-800">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Voice Activity Detection Settings</h4>
              
              <div class="form-group">
                <label class="form-label">
                  Silence Threshold (seconds)
                </label>
                <input
                  v-model.number="form.settings.vadSilenceThresholdSecs"
                  type="number"
                  min="0.3"
                  max="3"
                  step="0.1"
                  class="form-input max-w-xs"
                  placeholder="1.5"
                />
                <p class="form-help-text">
                  Silence duration before committing (0.3-3 seconds, default: 1.5)
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  VAD Threshold
                </label>
                <input
                  v-model.number="form.settings.vadThreshold"
                  type="number"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  class="form-input max-w-xs"
                  placeholder="0.4"
                />
                <p class="form-help-text">
                  Detection sensitivity (0.1-0.9, default: 0.4)
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Minimum Speech Duration (ms)
                </label>
                <input
                  v-model.number="form.settings.minSpeechDurationMs"
                  type="number"
                  min="50"
                  max="2000"
                  step="10"
                  class="form-input max-w-xs"
                  placeholder="100"
                />
                <p class="form-help-text">
                  Minimum speech duration (50-2000ms, default: 100)
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Minimum Silence Duration (ms)
                </label>
                <input
                  v-model.number="form.settings.minSilenceDurationMs"
                  type="number"
                  min="50"
                  max="2000"
                  step="10"
                  class="form-input max-w-xs"
                  placeholder="100"
                />
                <p class="form-help-text">
                  Minimum silence duration (50-2000ms, default: 100)
                </p>
              </div>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.enableLogging"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable Logging
                </span>
              </label>
              <p class="form-help-text mt-1">
                When disabled, zero retention mode is used (enterprise only)
              </p>
            </div>
          </div>

          <!-- Deepgram ASR Settings -->
          <div v-if="isDeepgramAsrProvider" class="space-y-6 mt-4">
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Deepgram ASR Settings</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure Deepgram speech recognition settings for this project
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Model ID <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.settings.modelId"
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
              <p class="form-help-text">
                Model to use for transcription (defaults to nova-3)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Audio Format <span class="text-gray-500">(optional)</span>
              </label>
              <select
                v-model="form.settings.audioFormat"
                class="form-select-auto min-w-64"
              >
                <option :value="undefined">Default (PCM 16kHz)</option>
                <option value="pcm_8000">PCM 8kHz</option>
                <option value="pcm_16000">PCM 16kHz</option>
                <option value="pcm_22050">PCM 22.05kHz</option>
                <option value="pcm_24000">PCM 24kHz</option>
                <option value="pcm_44100">PCM 44.1kHz</option>
              </select>
              <p class="form-help-text">
                Audio encoding format for speech-to-text
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Language <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.settings.language"
                type="text"
                placeholder="e.g., en-US, es, fr"
                class="form-input"
              />
              <p class="form-help-text">
                BCP-47 language tag (e.g., "en-US", "es", "fr")
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.interimResults"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable Interim Results
                </span>
              </label>
              <p class="form-help-text mt-1">
                Enable interim (partial) transcription results during streaming
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="deepgramEndpointingEnabled"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable Endpointing
                </span>
              </label>
              <p class="form-help-text mt-1">
                Automatically finalize speech after a period of silence
              </p>
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
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.smartFormat"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Smart Format
                </span>
              </label>
              <p class="form-help-text mt-1">
                Apply formatting (punctuation, capitalization, currency, etc.) to improve readability
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.punctuate"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Punctuate
                </span>
              </label>
              <p class="form-help-text mt-1">
                Add punctuation and capitalization to transcript
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.diarize"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Diarize
                </span>
              </label>
              <p class="form-help-text mt-1">
                Recognize and label different speakers in the audio
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Utterance End (ms) <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model.number="form.settings.utteranceEndMs"
                type="number"
                min="10"
                placeholder="Leave empty for default"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Milliseconds to wait before sending UtteranceEnd event (use with interim results)
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.vadEvents"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  VAD Events
                </span>
              </label>
              <p class="form-help-text mt-1">
                Send SpeechStarted events when speech is detected
              </p>
            </div>
          </div>

          <!-- AssemblyAI ASR Settings -->
          <div v-if="isAssemblyAiAsrProvider" class="space-y-6 mt-4">
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">AssemblyAI ASR Settings</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure AssemblyAI speech recognition settings for this project
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Sample Rate <span class="required">*</span>
              </label>
              <select
                v-model.number="form.settings.sampleRate"
                class="form-select-auto min-w-64"
                required
              >
                <option :value="8000">8000 Hz</option>
                <option :value="16000">16000 Hz (default)</option>
                <option :value="22050">22050 Hz</option>
                <option :value="24000">24000 Hz</option>
                <option :value="44100">44100 Hz</option>
              </select>
              <p class="form-help-text">
                Audio sample rate (default: 16000)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Speech Model <span class="required">*</span>
              </label>
              <select
                v-model="form.settings.speechModel"
                class="form-select-auto min-w-64"
                required
              >
                <option value="universal-streaming-english">Universal Streaming (English)</option>
                <option value="universal-streaming-multilingual">Universal Streaming (Multilingual)</option>
              </select>
              <p class="form-help-text">
                Model: English-only or multilingual support
              </p>
            </div>

            <div v-if="form.settings.speechModel === 'universal-streaming-multilingual'" class="form-group">
              <label class="form-label">
                Language Code
              </label>
              <input
                v-model="form.settings.language"
                type="text"
                placeholder="e.g., en, es, fr, de, it, pt"
                class="form-input"
              />
              <p class="form-help-text">
                Language for multilingual model (en, es, fr, de, it, pt)
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.settings.formatTurns"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Format Turns (Add Capitalization & Punctuation)
                </span>
              </label>
              <p class="form-help-text mt-1">
                Warning: Adds latency, not recommended for voice agents
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                VAD Threshold
              </label>
              <input
                v-model.number="form.settings.vadThreshold"
                type="number"
                min="0"
                max="1"
                step="0.05"
                placeholder="0.4"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Voice activity detection threshold (0.0-1.0, default: 0.4)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                End of Turn Confidence
              </label>
              <input
                v-model.number="form.settings.endOfTurnConfidenceThreshold"
                type="number"
                min="0"
                max="1"
                step="0.05"
                placeholder="0.4"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Confidence threshold for end of turn (0.0-1.0, default: 0.4)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Min Silence (Confident) (ms)
              </label>
              <input
                v-model.number="form.settings.minEndOfTurnSilenceWhenConfident"
                type="number"
                min="0"
                placeholder="400"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Minimum silence when confident (default: 400ms)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Max Turn Silence (ms)
              </label>
              <input
                v-model.number="form.settings.maxTurnSilence"
                type="number"
                min="0"
                placeholder="1280"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Maximum silence before end of turn (default: 1280ms)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Inactivity Timeout (seconds) <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model.number="form.settings.inactivityTimeout"
                type="number"
                min="5"
                max="3600"
                placeholder="No timeout"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Time before session termination (5-3600s, optional)
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Custom Keywords <span class="text-gray-500">(optional)</span>
              </label>
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
              <div v-if="form.settings.keytermsPrompt && form.settings.keytermsPrompt.length > 0" class="space-y-2">
                <div
                  v-for="(keyterm, index) in form.settings.keytermsPrompt"
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
            </div>
          </div>

          <!-- Speechmatics Settings -->
          <div 
            v-if="isSpeechmaticsAsrProvider" 
            class="space-y-6 mt-4"
          >
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-1 dark:text-white">Speechmatics Settings</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configure Speechmatics speech recognition settings for this project
              </p>
            </div>

            <!-- Audio Format -->
            <div class="form-group">
              <label class="form-label">
                Audio Format <span class="required">*</span>
              </label>
              <select
                v-model="form.settings.audioFormat"
                class="form-select-auto min-w-64"
                required
              >
                <option value="pcm_16000">PCM 16kHz (Recommended)</option>
                <option value="pcm_8000">PCM 8kHz</option>
                <option value="pcm_44100">PCM 44.1kHz</option>
              </select>
              <p class="form-help-text">
                Audio input format for speech recognition
              </p>
            </div>

            <!-- Transcription Mode -->
            <div class="form-group">
              <label class="form-label">
                Transcription Mode <span class="required">*</span>
              </label>
              <select
                v-model="form.settings.transcriptionMode"
                class="form-select-auto min-w-64"
                required
              >
                <option value="standard">Standard (Faster processing)</option>
                <option value="enhanced">Enhanced (Higher accuracy)</option>
              </select>
              <p class="form-help-text">
                Standard for faster processing or Enhanced for higher accuracy
              </p>
            </div>

            <!-- Language -->
            <div class="form-group">
              <label class="form-label">
                Language <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.settings.language"
                type="text"
                placeholder="e.g., en, en-US, es, fr"
                class="form-input"
              />
              <p class="form-help-text">
                Language code for speech recognition (BCP-47 format)
              </p>
            </div>

            <!-- Max Delay -->
            <div class="form-group">
              <label class="form-label">
                Max Delay (seconds) <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model.number="form.settings.maxDelay"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="0-10"
                class="form-input max-w-xs"
              />
              <p class="form-help-text">
                Maximum delay for transcription results (0-10 seconds). Lower values reduce latency
              </p>
            </div>

            <!-- Feature Toggles -->
            <div class="space-y-4">
              <h5 class="text-sm font-medium text-gray-900 dark:text-white">Features</h5>
              
              <!-- Enable Punctuation -->
              <div class="flex items-start">
                <input
                  id="speechmatics-punctuation"
                  v-model="form.settings.enablePunctuation"
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

              <!-- Enable Formatting -->
              <div class="flex items-start">
                <input
                  id="speechmatics-formatting"
                  v-model="form.settings.enableFormatting"
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

              <!-- Enable Diarization -->
              <div class="flex items-start">
                <input
                  id="speechmatics-diarization"
                  v-model="form.settings.enableDiarization"
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

            <!-- Custom Vocabulary -->
            <div class="form-group">
              <label class="form-label">
                Custom Vocabulary <span class="text-gray-500">(optional)</span>
              </label>
              <div class="space-y-3">
                <div class="flex gap-2 max-w-xs">
                  <input
                    v-model="newVocabWord"
                    type="text"
                    placeholder="Enter word or phrase"
                    class="form-input flex-1"
                    @keyup.enter="addSpeechmaticsVocab"
                  />
                  <button
                    type="button"
                    @click="addSpeechmaticsVocab"
                    class="btn-secondary whitespace-nowrap"
                  >
                    <Plus class="inline-block w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                <div v-if="form.settings.additionalVocab && form.settings.additionalVocab.length > 0" class="space-y-2">
                  <div
                    v-for="(word, index) in form.settings.additionalVocab"
                    :key="index"
                    class="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  >
                    <span class="flex-1 text-sm text-gray-900 dark:text-gray-200">{{ word }}</span>
                    <button
                      type="button"
                      @click="removeSpeechmaticsVocab(index)"
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
            </div>
          </div>
        </template>

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
import { ref, computed, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import type { ProviderResponse } from '@/api/types'

interface AsrConfig {
  settings: any
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

const newPhrase = ref('')
const newKeyterm = ref('')
const newVocabWord = ref('')
const deepgramEndpointingEnabled = ref(true)
const deepgramEndpointingValue = ref(300)

const isAzureAsrProvider = computed(() => {
  const apiType = props.selectedProvider?.apiType?.toLowerCase()
  return apiType === 'azure-speech' || apiType === 'azure'
})

const isElevenLabsAsrProvider = computed(() => {
  const apiType = props.selectedProvider?.apiType?.toLowerCase()
  return apiType === 'elevenlabs-scribe' || apiType === 'elevenlabs'
})

const isDeepgramAsrProvider = computed(() => {
  const apiType = props.selectedProvider?.apiType?.toLowerCase()
  return apiType === 'deepgram'
})

const isAssemblyAiAsrProvider = computed(() => {
  const apiType = props.selectedProvider?.apiType?.toLowerCase()
  return apiType === 'assemblyai'
})

const isSpeechmaticsAsrProvider = computed(() => {
  const apiType = props.selectedProvider?.apiType?.toLowerCase()
  return apiType === 'speechmatics'
})

watch(() => props.asrConfig, (config) => {
  form.value = {
    settings: config?.settings ? JSON.parse(JSON.stringify(config.settings)) : {},
    voiceActivityDetection: config?.voiceActivityDetection || false,
  }
  syncDeepgramEndpointing()
}, { immediate: true })

function syncDeepgramEndpointing() {
  const value = form.value.settings?.endpointing
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

watch(deepgramEndpointingEnabled, (enabled) => {
  if (isDeepgramAsrProvider.value) {
    form.value.settings.endpointing = enabled ? deepgramEndpointingValue.value : false
  }
})

watch(deepgramEndpointingValue, (value) => {
  if (isDeepgramAsrProvider.value && deepgramEndpointingEnabled.value) {
    form.value.settings.endpointing = value
  }
})

function addDictionaryPhrase() {
  if (!newPhrase.value.trim()) return
  if (!form.value.settings.dictionaryPhrases) {
    form.value.settings.dictionaryPhrases = []
  }
  form.value.settings.dictionaryPhrases.push(newPhrase.value.trim())
  newPhrase.value = ''
}

function removeDictionaryPhrase(index: number | string) {
  form.value.settings.dictionaryPhrases?.splice(Number(index), 1)
}

function addKeyterm() {
  if (!newKeyterm.value.trim()) return
  if (!form.value.settings.keytermsPrompt) {
    form.value.settings.keytermsPrompt = []
  }
  form.value.settings.keytermsPrompt.push(newKeyterm.value.trim())
  newKeyterm.value = ''
}

function removeKeyterm(index: number | string) {
  form.value.settings.keytermsPrompt?.splice(Number(index), 1)
}

function addSpeechmaticsVocab() {
  if (!newVocabWord.value.trim()) return
  if (!form.value.settings.additionalVocab) {
    form.value.settings.additionalVocab = []
  }
  form.value.settings.additionalVocab.push(newVocabWord.value.trim())
  newVocabWord.value = ''
}

function removeSpeechmaticsVocab(index: number | string) {
  form.value.settings.additionalVocab?.splice(Number(index), 1)
}

function handleSubmit() {
  emit('save', {
    settings: form.value.settings,
    voiceActivityDetection: form.value.voiceActivityDetection,
  })
}
</script>

<style scoped>
.required {
  color: #ef4444;
}
</style>
