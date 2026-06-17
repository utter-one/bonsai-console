<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Server-side VAD Settings</h2>

      <p class="form-help-text mb-4">
        Server autonomously detects speech boundaries — clients stream audio continuously without calling start/end voice input. This feature is experimental and may behave unexpectedly.
      </p>

      <div class="border-b border-gray-200 dark:border-gray-700 mb-4">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
      </div>

      <form @submit.prevent="handleSubmit">
        <!-- General tab: algorithm + grace period -->
        <TabContent v-model="activeTab" tab="general">
          <FormField label="Algorithm" help="VAD algorithm to use for speech detection">
            <select
              v-model="form.algorithm"
              class="form-select-auto min-w-48"
              @change="onAlgorithmChange"
            >
              <option value="legacy">Silero (basic)</option>
              <option value="silero">Silero (advanced)</option>
              <option value="firered">FireRedVAD</option>
            </select>
          </FormField>

          <FormField label="Grace Period (ms)" help="Duration after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise (0–5000 ms, default: 1000)">
            <input
              v-model.number="generalForm.gracePeriodMs"
              type="number"
              min="0"
              max="5000"
              step="100"
              placeholder="1000"
              class="form-input max-w-xs"
            />
          </FormField>
        </TabContent>

        <!-- Settings tab: algorithm-specific settings -->
        <TabContent v-model="activeTab" tab="settings">
          <template v-if="form.algorithm === 'legacy'">
            <FormField label="Aggressiveness Mode" help="Higher values filter non-speech more aggressively (0–3, default: 2)">
              <select
                v-model.number="legacyForm.mode"
                class="form-select-auto min-w-48"
              >
                <option :value="undefined">Default (2)</option>
                <option :value="0">0 — Least aggressive</option>
                <option :value="1">1</option>
                <option :value="2">2 (default)</option>
                <option :value="3">3 — Most aggressive</option>
              </select>
            </FormField>

            <FormField label="Frame Duration" help="Duration of each VAD processing frame — must be 10, 20, or 30 ms (default: 20)">
              <select
                v-model.number="legacyForm.frameDurationMs"
                class="form-select-auto min-w-48"
              >
                <option :value="undefined">Default (20 ms)</option>
                <option :value="10">10 ms</option>
                <option :value="20">20 ms (default)</option>
                <option :value="30">30 ms</option>
              </select>
            </FormField>

            <FormField label="Silence Pre-roll Padding (ms)" help="Silence prepended before detected speech as a pre-roll buffer (0–1000 ms, default: 300)">
              <input
                v-model.number="legacyForm.silencePaddingMs"
                type="number"
                min="0"
                max="1000"
                step="10"
                placeholder="300"
                class="form-input max-w-xs"
              />
            </FormField>

            <FormField label="Auto-End Silence Duration (ms)" help="Silence after speech that triggers end-of-utterance detection (100–5000 ms, default: 800)">
              <input
                v-model.number="legacyForm.autoEndSilenceDurationMs"
                type="number"
                min="100"
                max="5000"
                step="50"
                placeholder="800"
                class="form-input max-w-xs"
              />
            </FormField>
          </template>

          <template v-if="form.algorithm === 'silero'">
            <FormField label="Model Version" help="Silero VAD model version. v5 is the latest; legacy is the older model (default: v5)">
              <select
                v-model="sileroForm.model"
                class="form-select-auto min-w-48"
              >
                <option :value="undefined">Default (v5)</option>
                <option value="v5">v5 (default)</option>
                <option value="legacy">legacy</option>
              </select>
            </FormField>

            <FormField label="Positive Speech Threshold" help="Probability threshold above which a frame is considered speech (0–1, default: 0.5)">
              <input
                v-model.number="sileroForm.positiveSpeechThreshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.5"
                class="form-input max-w-xs"
              />
            </FormField>

            <FormField label="Negative Speech Threshold" help="Probability threshold below which a frame is considered silence (0–1, default: 0.35)">
              <input
                v-model.number="sileroForm.negativeSpeechThreshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.35"
                class="form-input max-w-xs"
              />
            </FormField>

            <FormField label="Frame Samples" help="Number of audio samples per VAD frame. Silero was trained on 512, 1024, 1536 samples at 16kHz (default: 512)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="sileroForm.frameSamples"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="512"
                  class="form-input max-w-xs"
                />
                <span v-if="sileroForm.frameSamples" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  ({{ sileroFrameDuration }}ms/frame)
                </span>
              </div>
            </FormField>

            <FormField label="Redemption Frames" help="Number of silent frames after speech before end-of-utterance is triggered. If speech resumes during this window, the utterance is not ended (default: 8)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="sileroForm.redemptionFrames"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="8"
                  class="form-input max-w-xs"
                />
                <span v-if="sileroForm.redemptionFrames" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  (~{{ sileroFramesToMs(sileroForm.redemptionFrames) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Pre-Speech Pad Frames" help="Number of frames of pre-roll silence prepended to the audio segment on speech start (default: 1)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="sileroForm.preSpeechPadFrames"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1"
                  class="form-input max-w-xs"
                />
                <span v-if="sileroForm.preSpeechPadFrames" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  (~{{ sileroFramesToMs(sileroForm.preSpeechPadFrames) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Min Speech Frames" help="Minimum frames required to consider a segment as speech. Shorter segments trigger onVADMisfire instead (default: 3)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="sileroForm.minSpeechFrames"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="3"
                  class="form-input max-w-xs"
                />
                <span v-if="sileroForm.minSpeechFrames" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  (~{{ sileroFramesToMs(sileroForm.minSpeechFrames) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Submit User Speech On Pause" help="Whether to submit partial speech when VAD is paused">
              <select
                v-model="sileroForm.submitUserSpeechOnPause"
                class="form-select-auto min-w-48"
              >
                <option :value="undefined">Default</option>
                <option :value="true">Enabled</option>
                <option :value="false">Disabled</option>
              </select>
            </FormField>
          </template>

          <template v-if="form.algorithm === 'firered'">
            <FormField label="Speech Threshold" help="Probability threshold above which a smoothed frame is classified as speech (0–1, default: 0.5)">
              <input
                v-model.number="fireredForm.speechThreshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.5"
                class="form-input max-w-xs"
              />
            </FormField>

            <FormField label="Smooth Window Size" help="Size of the moving-average smoothing window applied to raw frame probabilities (min: 1, default: 5)">
              <input
                v-model.number="fireredForm.smoothWindowSize"
                type="number"
                min="1"
                step="1"
                placeholder="5"
                class="form-input max-w-xs"
              />
            </FormField>

            <FormField label="Min Speech Frames" help="Minimum consecutive speech frames required before speech_start is emitted (min: 1, default: 8)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fireredForm.minSpeechFrame"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="8"
                  class="form-input max-w-xs"
                />
                <span v-if="fireredForm.minSpeechFrame" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  ({{ fireredFramesToMs(fireredForm.minSpeechFrame) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Max Speech Frames" help="Maximum consecutive speech frames before a forced speech_end (long-utterance cutoff) (min: 1, default: 6000)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fireredForm.maxSpeechFrame"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="6000"
                  class="form-input max-w-xs"
                />
                <span v-if="fireredForm.maxSpeechFrame" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  ({{ fireredFramesToMs(fireredForm.maxSpeechFrame) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Min Silence Frames" help="Minimum consecutive silence frames after speech before speech_end is emitted (min: 1, default: 80)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fireredForm.minSilenceFrame"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="80"
                  class="form-input max-w-xs"
                />
                <span v-if="fireredForm.minSilenceFrame" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  ({{ fireredFramesToMs(fireredForm.minSilenceFrame) }}ms)
                </span>
              </div>
            </FormField>

            <FormField label="Pad Start Frames" help="Number of frames of pre-roll audio prepended to the detected speech start (min: 0, default: 5)">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fireredForm.padStartFrame"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  class="form-input max-w-xs"
                />
                <span v-if="fireredForm.padStartFrame" class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  ({{ fireredFramesToMs(fireredForm.padStartFrame) }}ms)
                </span>
              </div>
            </FormField>
          </template>
        </TabContent>

        <!-- Turn Detection tab -->
        <TabContent v-model="activeTab" tab="turn-detection">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Smart Turn Detection</h3>
          <p class="form-help-text mb-4">
            Runs ONNX inference on the full utterance audio after VAD detects silence to verify the speaker has finished their turn. Helps reduce premature interruptions.
          </p>

          <FormField label="Enable Smart Turn" help="When enabled, runs endpoint detection after VAD silence to verify turn completion">
            <select
              v-model="smartTurnForm.enabled"
              class="form-select-auto min-w-48"
            >
              <option :value="false">Disabled</option>
              <option :value="true">Enabled</option>
            </select>
          </FormField>

          <template v-if="smartTurnForm.enabled">
            <FormField label="Endpoint Threshold" help="Probability threshold above which the utterance is considered a completed turn (0–1, default: 0.5)">
              <input
                v-model.number="smartTurnForm.threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.5"
                class="form-input max-w-xs"
              />
            </FormField>
          </template>
        </TabContent>

        <!-- Silence tab -->
        <TabContent v-model="activeTab" tab="silence">
          <FormField label="Barge-in Silence Timeout (ms)" help="Duration to wait for the user to continue speaking after a barge-in interrupt. If silence is detected for this duration, ASR is stopped (500–10000 ms, default: 3000)">
            <input
              v-model.number="silenceForm.bargeInSilenceTimeout"
              type="number"
              min="500"
              max="10000"
              step="100"
              placeholder="3000"
              class="form-input max-w-xs"
            />
            <p v-if="silenceForm.bargeInSilenceTimeout !== undefined && silenceForm.bargeInSilenceTimeout < 3000" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Warning: Values below 3000 ms can cause instability and problems.
            </p>
          </FormField>

          <FormField label="Barge-in Silence Placeholder" help="Optional placeholder text fed to the AI as user input when the user barge-ins but then stops speaking before the bargeInSilenceTimeout. The AI generates a response based on this prompt (e.g. &quot;[you misheard something the user said]&quot;). Default: [repeat after interruption]." class="w-full">
            <input
              v-model="silenceForm.bargeInSilencePlaceholder"
              type="text"
              class="form-input"
              placeholder="[repeat after interruption]"
            />
          </FormField>
        </TabContent>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FireRedVadConfig, LegacyVadConfig, ServerVadConfig, SileroVadConfig, SmartTurnConfig } from '@/api/types'
import FormField from '@/components/FormField.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'

const props = defineProps<{
  config: ServerVadConfig
}>()

const emit = defineEmits<{
  close: []
  save: [config: ServerVadConfig]
}>()

const activeTab = ref<'general' | 'settings' | 'turn-detection' | 'silence'>('general')

const tabs: TabDefinition[] = [
  { key: 'general', label: 'General' },
  { key: 'settings', label: 'Settings' },
  { key: 'turn-detection', label: 'Turn Detection' },
  { key: 'silence', label: 'Silence' },
]

const form = ref<{ algorithm: 'legacy' | 'silero' | 'firered' }>({
  algorithm: 'legacy'
})

const generalForm = ref({
  gracePeriodMs: undefined as number | undefined,
})

const legacyForm = ref<Omit<LegacyVadConfig, 'algorithm' | 'gracePeriodMs'>>({
  mode: undefined,
  frameDurationMs: undefined,
  silencePaddingMs: undefined,
  autoEndSilenceDurationMs: undefined,
})

const sileroForm = ref<Omit<SileroVadConfig, 'algorithm' | 'gracePeriodMs'>>({
  model: undefined,
  positiveSpeechThreshold: undefined,
  negativeSpeechThreshold: undefined,
  frameSamples: undefined,
  redemptionFrames: undefined,
  preSpeechPadFrames: undefined,
  minSpeechFrames: undefined,
  submitUserSpeechOnPause: undefined,
})

const fireredForm = ref<Omit<FireRedVadConfig, 'algorithm' | 'gracePeriodMs'>>({
  speechThreshold: undefined,
  smoothWindowSize: undefined,
  minSpeechFrame: undefined,
  maxSpeechFrame: undefined,
  minSilenceFrame: undefined,
  padStartFrame: undefined,
})

const smartTurnForm = ref<Omit<SmartTurnConfig, ''>>({
  enabled: false,
  threshold: undefined,
})

const silenceForm = ref({
  bargeInSilenceTimeout: undefined as number | undefined,
  bargeInSilencePlaceholder: undefined as string | undefined,
})

const sileroFrameDuration = computed(() => {
  if (!sileroForm.value.frameSamples) return 0
  return Math.round(sileroForm.value.frameSamples / 160)
})

function sileroFramesToMs(frames: number) {
  if (!sileroForm.value.frameSamples) return 0
  return Math.round(frames * sileroFrameDuration.value)
}

function fireredFramesToMs(frames: number) {
  return frames * 10
}

const hasValue = (v: any) => v !== undefined && v !== ''

function initFromConfig() {
  if (!props.config) {
    form.value.algorithm = 'legacy'
    resetForms()
    return
  }

  form.value.algorithm = props.config.algorithm

  generalForm.value.gracePeriodMs = props.config.gracePeriodMs

  if (props.config.algorithm === 'legacy') {
    legacyForm.value = {
      mode: props.config.mode,
      frameDurationMs: props.config.frameDurationMs,
      silencePaddingMs: props.config.silencePaddingMs,
      autoEndSilenceDurationMs: props.config.autoEndSilenceDurationMs,
    }
  } else if (props.config.algorithm === 'silero') {
    sileroForm.value = {
      model: props.config.model,
      positiveSpeechThreshold: props.config.positiveSpeechThreshold,
      negativeSpeechThreshold: props.config.negativeSpeechThreshold,
      frameSamples: props.config.frameSamples,
      redemptionFrames: props.config.redemptionFrames,
      preSpeechPadFrames: props.config.preSpeechPadFrames,
      minSpeechFrames: props.config.minSpeechFrames,
      submitUserSpeechOnPause: props.config.submitUserSpeechOnPause,
    }
  } else {
    fireredForm.value = {
      speechThreshold: props.config.speechThreshold,
      smoothWindowSize: props.config.smoothWindowSize,
      minSpeechFrame: props.config.minSpeechFrame,
      maxSpeechFrame: props.config.maxSpeechFrame,
      minSilenceFrame: props.config.minSilenceFrame,
      padStartFrame: props.config.padStartFrame,
    }
  }

  if (props.config.smartTurn) {
    smartTurnForm.value = {
      enabled: props.config.smartTurn.enabled ?? false,
      threshold: props.config.smartTurn.threshold,
    }
  } else {
    smartTurnForm.value = {
      enabled: false,
      threshold: undefined,
    }
  }

  silenceForm.value = {
    bargeInSilenceTimeout: props.config.bargeInSilenceTimeout,
    bargeInSilencePlaceholder: props.config.bargeInSilencePlaceholder,
  }
}

function resetForms() {
  generalForm.value.gracePeriodMs = undefined
  legacyForm.value = {
    mode: undefined,
    frameDurationMs: undefined,
    silencePaddingMs: undefined,
    autoEndSilenceDurationMs: undefined,
  }
  sileroForm.value = {
    model: undefined,
    positiveSpeechThreshold: undefined,
    negativeSpeechThreshold: undefined,
    frameSamples: undefined,
    redemptionFrames: undefined,
    preSpeechPadFrames: undefined,
    minSpeechFrames: undefined,
    submitUserSpeechOnPause: undefined,
  }
  fireredForm.value = {
    speechThreshold: undefined,
    smoothWindowSize: undefined,
    minSpeechFrame: undefined,
    maxSpeechFrame: undefined,
    minSilenceFrame: undefined,
    padStartFrame: undefined,
  }
  smartTurnForm.value = {
    enabled: false,
    threshold: undefined,
  }
  silenceForm.value = {
    bargeInSilenceTimeout: undefined,
    bargeInSilencePlaceholder: undefined,
  }
}

function onAlgorithmChange() {
  resetForms()
  generalForm.value.gracePeriodMs = props.config?.gracePeriodMs
}

watch(() => props.config, initFromConfig, { immediate: true })

function handleSubmit() {
  const smartTurn = smartTurnForm.value.enabled
    ? {
        enabled: smartTurnForm.value.enabled,
        ...(hasValue(smartTurnForm.value.threshold) && { threshold: smartTurnForm.value.threshold }),
      }
    : undefined

  const gracePeriodMs = generalForm.value.gracePeriodMs

  if (form.value.algorithm === 'legacy') {
    const config: ServerVadConfig = {
      algorithm: 'legacy',
      ...(hasValue(legacyForm.value.mode) && { mode: legacyForm.value.mode }),
      ...(hasValue(legacyForm.value.frameDurationMs) && { frameDurationMs: legacyForm.value.frameDurationMs }),
      ...(hasValue(legacyForm.value.silencePaddingMs) && { silencePaddingMs: legacyForm.value.silencePaddingMs }),
      ...(hasValue(legacyForm.value.autoEndSilenceDurationMs) && { autoEndSilenceDurationMs: legacyForm.value.autoEndSilenceDurationMs }),
      ...(hasValue(gracePeriodMs) && { gracePeriodMs }),
      ...(smartTurn && { smartTurn }),
      ...(hasValue(silenceForm.value.bargeInSilenceTimeout) && { bargeInSilenceTimeout: silenceForm.value.bargeInSilenceTimeout }),
      ...(silenceForm.value.bargeInSilencePlaceholder !== undefined && { bargeInSilencePlaceholder: silenceForm.value.bargeInSilencePlaceholder }),
    }
    emit('save', config)
  } else if (form.value.algorithm === 'silero') {
    const config: ServerVadConfig = {
      algorithm: 'silero',
      ...(hasValue(sileroForm.value.model) && { model: sileroForm.value.model }),
      ...(hasValue(sileroForm.value.positiveSpeechThreshold) && { positiveSpeechThreshold: sileroForm.value.positiveSpeechThreshold }),
      ...(hasValue(sileroForm.value.negativeSpeechThreshold) && { negativeSpeechThreshold: sileroForm.value.negativeSpeechThreshold }),
      ...(hasValue(sileroForm.value.frameSamples) && { frameSamples: sileroForm.value.frameSamples }),
      ...(hasValue(sileroForm.value.redemptionFrames) && { redemptionFrames: sileroForm.value.redemptionFrames }),
      ...(hasValue(sileroForm.value.preSpeechPadFrames) && { preSpeechPadFrames: sileroForm.value.preSpeechPadFrames }),
      ...(hasValue(sileroForm.value.minSpeechFrames) && { minSpeechFrames: sileroForm.value.minSpeechFrames }),
      ...(hasValue(sileroForm.value.submitUserSpeechOnPause) && { submitUserSpeechOnPause: sileroForm.value.submitUserSpeechOnPause }),
      ...(hasValue(gracePeriodMs) && { gracePeriodMs }),
      ...(smartTurn && { smartTurn }),
      ...(hasValue(silenceForm.value.bargeInSilenceTimeout) && { bargeInSilenceTimeout: silenceForm.value.bargeInSilenceTimeout }),
      ...(silenceForm.value.bargeInSilencePlaceholder !== undefined && { bargeInSilencePlaceholder: silenceForm.value.bargeInSilencePlaceholder }),
    }
    emit('save', config)
  } else {
    const config: ServerVadConfig = {
      algorithm: 'firered',
      ...(hasValue(fireredForm.value.speechThreshold) && { speechThreshold: fireredForm.value.speechThreshold }),
      ...(hasValue(fireredForm.value.smoothWindowSize) && { smoothWindowSize: fireredForm.value.smoothWindowSize }),
      ...(hasValue(fireredForm.value.minSpeechFrame) && { minSpeechFrame: fireredForm.value.minSpeechFrame }),
      ...(hasValue(fireredForm.value.maxSpeechFrame) && { maxSpeechFrame: fireredForm.value.maxSpeechFrame }),
      ...(hasValue(fireredForm.value.minSilenceFrame) && { minSilenceFrame: fireredForm.value.minSilenceFrame }),
      ...(hasValue(fireredForm.value.padStartFrame) && { padStartFrame: fireredForm.value.padStartFrame }),
      ...(hasValue(gracePeriodMs) && { gracePeriodMs }),
      ...(smartTurn && { smartTurn }),
      ...(hasValue(silenceForm.value.bargeInSilenceTimeout) && { bargeInSilenceTimeout: silenceForm.value.bargeInSilenceTimeout }),
      ...(silenceForm.value.bargeInSilencePlaceholder !== undefined && { bargeInSilencePlaceholder: silenceForm.value.bargeInSilencePlaceholder }),
    }
    emit('save', config)
  }
}
</script>
