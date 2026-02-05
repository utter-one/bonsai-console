<template>
  <div class="audio-player bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <!-- Transcript Text -->
    <div v-if="transcript" class="mb-3 text-sm text-gray-700 leading-relaxed">
      {{ transcript }}
    </div>

    <!-- Error State -->
    <div v-if="state.error" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
      <span class="font-medium">Playback Error:</span> {{ state.error }}
    </div>

    <!-- Progress Bar -->
    <div class="mb-3">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{{ formatTime(state.currentTime) }}</span>
        <span>{{ formatTime(state.duration) }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          class="bg-blue-500 h-full transition-all duration-200"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-3">
      <!-- Play/Pause Button -->
      <button
        @click="togglePlayPause"
        :disabled="!isReady || state.buffering"
        class="btn-icon w-10 h-10 flex items-center justify-center"
        :class="{ 'opacity-50 cursor-not-allowed': !isReady || state.buffering }"
        :title="state.playing ? 'Pause' : 'Play'"
      >
        <Pause v-if="state.playing" :size="20" />
        <Play v-else :size="20" />
      </button>

      <!-- Stop Button -->
      <button
        @click="handleStop"
        :disabled="!isReady || (!state.playing && !state.paused)"
        class="btn-icon w-10 h-10 flex items-center justify-center"
        :class="{ 'opacity-50 cursor-not-allowed': !isReady || (!state.playing && !state.paused) }"
        title="Stop"
      >
        <Square :size="18" />
      </button>

      <!-- Volume Control -->
      <div class="flex items-center gap-2 ml-auto">
        <Volume2 :size="18" class="text-gray-500" />
        <input
          type="range"
          min="0"
          max="100"
          :value="state.volume * 100"
          @input="handleVolumeChange"
          class="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style="
            accent-color: #3b82f6;
          "
        />
        <span class="text-xs text-gray-500 w-8 text-right">{{ Math.round(state.volume * 100) }}%</span>
      </div>

      <!-- Buffering Indicator -->
      <div v-if="state.buffering" class="flex items-center gap-2 text-sm text-gray-500">
        <div class="animate-spin">
          <Loader :size="16" />
        </div>
        <span>Buffering...</span>
      </div>

      <!-- Status Indicator -->
      <div v-else-if="isReady && !state.playing && !state.paused" class="text-sm text-gray-500">
        Ready to play
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Pause, Square, Volume2, Loader } from 'lucide-vue-next'
import type { AudioPlaybackState } from '@/composables/useAudioPlayback'

interface Props {
  state: AudioPlaybackState
  isReady: boolean
  progress: number
  transcript?: string
}

interface Emits {
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'stop'): void
  (e: 'volume-change', volume: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Format time in seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Toggle between play and pause
 */
function togglePlayPause() {
  if (props.state.playing) {
    emit('pause')
  } else {
    emit('play')
  }
}

/**
 * Handle stop button click
 */
function handleStop() {
  emit('stop')
}

/**
 * Handle volume slider change
 */
function handleVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  const volume = parseInt(target.value) / 100
  emit('volume-change', volume)
}
</script>

<style scoped>
/* Custom range input styling for better cross-browser support */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
}

input[type="range"]::-moz-range-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
}
</style>
