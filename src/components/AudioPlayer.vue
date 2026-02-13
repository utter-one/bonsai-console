<template>
  <div class="audio-player bg-white border border-gray-200 rounded-lg p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
    <!-- Transcript Text -->
    <div v-if="transcript" class="mb-3 text-sm text-gray-700 leading-relaxed dark:text-gray-200">
      {{ transcript }}
    </div>

    <!-- Error State -->
    <div v-if="state.error" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
      <span class="font-medium">Playback Error:</span> {{ state.error }}
    </div>

    <!-- Progress Bar -->
    <div class="mb-3">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
        <span>{{ formatTime(state.currentTime) }}</span>
        <span>{{ formatTime(state.duration) }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-700">
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

      <!-- Buffering Indicator -->
      <div v-if="state.buffering" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="animate-spin">
          <Loader :size="16" />
        </div>
        <span>Buffering...</span>
      </div>

      <!-- Status Indicator -->
      <div v-else-if="isReady && !state.playing && !state.paused" class="text-sm text-gray-500 dark:text-gray-400">
        Ready to play
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Pause, Square, Loader } from 'lucide-vue-next'
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

:root.dark input[type="range"]::-webkit-slider-runnable-track {
  background: #374151; /* gray-700 */
}

:root.dark input[type="range"]::-moz-range-track {
  background: #374151; /* gray-700 */
}
</style>
