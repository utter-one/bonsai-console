<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Server-side VAD Settings</h2>

      <form @submit.prevent="handleSubmit">
        <p class="form-help-text mb-4">
          Server autonomously detects speech boundaries — clients stream audio continuously without calling start/end voice input. This feature is experimental and may behave unexpectedly.
        </p>

        <FormField label="Algorithm" help="VAD algorithm to use for speech detection">
          <select
            v-model="form.algorithm"
            class="form-select-auto min-w-48"
            @change="onAlgorithmChange"
          >
            <option value="legacy">Silero (legacy)</option>
            <option value="silero">Silero</option>
          </select>
        </FormField>

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

          <FormField label="Grace Period (ms)" help="Duration after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise (0–5000 ms, default: 1000)">
            <input
              v-model.number="legacyForm.gracePeriodMs"
              type="number"
              min="0"
              max="5000"
              step="100"
              placeholder="1000"
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

          <FormField label="Frame Samples" help="Number of audio samples per VAD frame. Silero was trained on 512, 1024, 1536 samples at 16kHz (default: 1536)">
            <input
              v-model.number="sileroForm.frameSamples"
              type="number"
              min="1"
              step="1"
              placeholder="1536"
              class="form-input max-w-xs"
            />
          </FormField>

          <FormField label="Redemption Frames" help="Number of silent frames after speech before end-of-utterance is triggered. If speech resumes during this window, the utterance is not ended (default: 8)">
            <input
              v-model.number="sileroForm.redemptionFrames"
              type="number"
              min="1"
              step="1"
              placeholder="8"
              class="form-input max-w-xs"
            />
          </FormField>

          <FormField label="Pre-Speech Pad Frames" help="Number of frames of pre-roll silence prepended to the audio segment on speech start (default: 1)">
            <input
              v-model.number="sileroForm.preSpeechPadFrames"
              type="number"
              min="0"
              step="1"
              placeholder="1"
              class="form-input max-w-xs"
            />
          </FormField>

          <FormField label="Min Speech Frames" help="Minimum frames required to consider a segment as speech. Shorter segments trigger onVADMisfire instead (default: 3)">
            <input
              v-model.number="sileroForm.minSpeechFrames"
              type="number"
              min="1"
              step="1"
              placeholder="3"
              class="form-input max-w-xs"
            />
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

          <FormField label="Grace Period (ms)" help="Duration after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise (0–5000 ms, default: 1000)">
            <input
              v-model.number="sileroForm.gracePeriodMs"
              type="number"
              min="0"
              max="5000"
              step="100"
              placeholder="1000"
              class="form-input max-w-xs"
            />
          </FormField>
        </template>

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
import { ref, watch } from 'vue'
import type { LegacyVadConfig, ServerVadConfig, SileroVadConfig } from '@/api/types'
import FormField from '@/components/FormField.vue'

const props = defineProps<{
  config: ServerVadConfig
}>()

const emit = defineEmits<{
  close: []
  save: [config: ServerVadConfig]
}>()

const form = ref<{ algorithm: 'legacy' | 'silero' }>({
  algorithm: 'legacy'
})

const legacyForm = ref<Omit<LegacyVadConfig, 'algorithm'>>({
  mode: undefined,
  frameDurationMs: undefined,
  silencePaddingMs: undefined,
  autoEndSilenceDurationMs: undefined,
  gracePeriodMs: undefined,
})

const sileroForm = ref<Omit<SileroVadConfig, 'algorithm'>>({
  model: undefined,
  positiveSpeechThreshold: undefined,
  negativeSpeechThreshold: undefined,
  frameSamples: undefined,
  redemptionFrames: undefined,
  preSpeechPadFrames: undefined,
  minSpeechFrames: undefined,
  submitUserSpeechOnPause: undefined,
  gracePeriodMs: undefined,
})

function initFromConfig() {
  if (!props.config) {
    form.value.algorithm = 'legacy'
    resetForms()
    return
  }

  form.value.algorithm = props.config.algorithm

  if (props.config.algorithm === 'legacy') {
    legacyForm.value = {
      mode: props.config.mode,
      frameDurationMs: props.config.frameDurationMs,
      silencePaddingMs: props.config.silencePaddingMs,
      autoEndSilenceDurationMs: props.config.autoEndSilenceDurationMs,
      gracePeriodMs: props.config.gracePeriodMs,
    }
  } else {
    sileroForm.value = {
      model: props.config.model,
      positiveSpeechThreshold: props.config.positiveSpeechThreshold,
      negativeSpeechThreshold: props.config.negativeSpeechThreshold,
      frameSamples: props.config.frameSamples,
      redemptionFrames: props.config.redemptionFrames,
      preSpeechPadFrames: props.config.preSpeechPadFrames,
      minSpeechFrames: props.config.minSpeechFrames,
      submitUserSpeechOnPause: props.config.submitUserSpeechOnPause,
      gracePeriodMs: props.config.gracePeriodMs,
    }
  }
}

function resetForms() {
  legacyForm.value = {
    mode: undefined,
    frameDurationMs: undefined,
    silencePaddingMs: undefined,
    autoEndSilenceDurationMs: undefined,
    gracePeriodMs: undefined,
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
    gracePeriodMs: undefined,
  }
}

function onAlgorithmChange() {
  resetForms()
}

watch(() => props.config, initFromConfig, { immediate: true })

function handleSubmit() {
  if (form.value.algorithm === 'legacy') {
    const config: LegacyVadConfig = {
      algorithm: 'legacy',
      ...(legacyForm.value.mode !== undefined && { mode: legacyForm.value.mode }),
      ...(legacyForm.value.frameDurationMs !== undefined && { frameDurationMs: legacyForm.value.frameDurationMs }),
      ...(legacyForm.value.silencePaddingMs !== undefined && { silencePaddingMs: legacyForm.value.silencePaddingMs }),
      ...(legacyForm.value.autoEndSilenceDurationMs !== undefined && { autoEndSilenceDurationMs: legacyForm.value.autoEndSilenceDurationMs }),
      ...(legacyForm.value.gracePeriodMs !== undefined && { gracePeriodMs: legacyForm.value.gracePeriodMs }),
    }
    emit('save', config)
  } else {
    const config: SileroVadConfig = {
      algorithm: 'silero',
      ...(sileroForm.value.model !== undefined && { model: sileroForm.value.model }),
      ...(sileroForm.value.positiveSpeechThreshold !== undefined && { positiveSpeechThreshold: sileroForm.value.positiveSpeechThreshold }),
      ...(sileroForm.value.negativeSpeechThreshold !== undefined && { negativeSpeechThreshold: sileroForm.value.negativeSpeechThreshold }),
      ...(sileroForm.value.frameSamples !== undefined && { frameSamples: sileroForm.value.frameSamples }),
      ...(sileroForm.value.redemptionFrames !== undefined && { redemptionFrames: sileroForm.value.redemptionFrames }),
      ...(sileroForm.value.preSpeechPadFrames !== undefined && { preSpeechPadFrames: sileroForm.value.preSpeechPadFrames }),
      ...(sileroForm.value.minSpeechFrames !== undefined && { minSpeechFrames: sileroForm.value.minSpeechFrames }),
      ...(sileroForm.value.submitUserSpeechOnPause !== undefined && { submitUserSpeechOnPause: sileroForm.value.submitUserSpeechOnPause }),
      ...(sileroForm.value.gracePeriodMs !== undefined && { gracePeriodMs: sileroForm.value.gracePeriodMs }),
    }
    emit('save', config)
  }
}
</script>
