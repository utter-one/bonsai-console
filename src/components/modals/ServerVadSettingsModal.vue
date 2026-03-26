<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Server-side VAD Settings</h2>

      <form @submit.prevent="handleSubmit">
        <p class="form-help-text mb-4">
          Server autonomously detects speech boundaries — clients stream audio continuously without calling start/end voice input. This feature is experimental and may behave unexpectedly.
        </p>

        <div class="form-group">
          <label class="form-label">
            Aggressiveness Mode <span class="text-gray-500">(optional)</span>
          </label>
          <select
            v-model.number="form.mode"
            class="form-select-auto min-w-48"
          >
            <option :value="undefined">Default (2)</option>
            <option :value="0">0 — Least aggressive</option>
            <option :value="1">1</option>
            <option :value="2">2 (default)</option>
            <option :value="3">3 — Most aggressive</option>
          </select>
          <p class="form-help-text">
            Higher values filter non-speech more aggressively (0–3, default: 2)
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Frame Duration <span class="text-gray-500">(optional)</span>
          </label>
          <select
            v-model.number="form.frameDurationMs"
            class="form-select-auto min-w-48"
          >
            <option :value="undefined">Default (20 ms)</option>
            <option :value="10">10 ms</option>
            <option :value="20">20 ms (default)</option>
            <option :value="30">30 ms</option>
          </select>
          <p class="form-help-text">
            Duration of each VAD processing frame — must be 10, 20, or 30 ms (default: 20)
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Silence Pre-roll Padding (ms) <span class="text-gray-500">(optional)</span>
          </label>
          <input
            v-model.number="form.silencePaddingMs"
            type="number"
            min="0"
            max="1000"
            step="10"
            placeholder="300"
            class="form-input max-w-xs"
          />
          <p class="form-help-text">
            Silence prepended before detected speech as a pre-roll buffer (0–1000 ms, default: 300)
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Auto-End Silence Duration (ms) <span class="text-gray-500">(optional)</span>
          </label>
          <input
            v-model.number="form.autoEndSilenceDurationMs"
            type="number"
            min="100"
            max="5000"
            step="50"
            placeholder="800"
            class="form-input max-w-xs"
          />
          <p class="form-help-text">
            Silence after speech that triggers end-of-utterance detection (100–5000 ms, default: 800)
          </p>
        </div>

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

interface ServerVadConfig {
  mode: number | undefined
  frameDurationMs: (10 | 20 | 30) | undefined
  silencePaddingMs: number | undefined
  autoEndSilenceDurationMs: number | undefined
}

const props = defineProps<{
  config: ServerVadConfig
}>()

const emit = defineEmits<{
  close: []
  save: [config: ServerVadConfig]
}>()

const form = ref<ServerVadConfig>({
  mode: undefined,
  frameDurationMs: undefined,
  silencePaddingMs: undefined,
  autoEndSilenceDurationMs: undefined,
})

watch(() => props.config, (config) => {
  form.value = {
    mode: config?.mode,
    frameDurationMs: config?.frameDurationMs,
    silencePaddingMs: config?.silencePaddingMs,
    autoEndSilenceDurationMs: config?.autoEndSilenceDurationMs,
  }
}, { immediate: true })

function handleSubmit() {
  emit('save', {
    mode: form.value.mode,
    frameDurationMs: form.value.frameDurationMs,
    silencePaddingMs: form.value.silencePaddingMs,
    autoEndSilenceDurationMs: form.value.autoEndSilenceDurationMs,
  })
}
</script>
