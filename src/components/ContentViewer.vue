<template>
  <div class="content-viewer">
    <!-- Text Content -->
    <div v-if="content.contentType === 'text'" class="text-content">
      <pre class="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">{{ content.text }}</pre>
    </div>

    <!-- Image Content -->
    <div v-else-if="content.contentType === 'image'" class="image-content">
      <div class="relative inline-block">
        <img
          :src="`data:${content.mimeType};base64,${content.data}`"
          :alt="imageAltText"
          class="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
          :class="{ 'cursor-pointer hover:opacity-90': !isExpanded }"
          @click="toggleExpand"
          @error="handleImageError"
        />
        <button
          v-if="!isExpanded"
          @click.stop="toggleExpand"
          class="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-md text-white transition-colors"
          title="Expand image"
        >
          <Maximize2 :size="16" />
        </button>
      </div>
      <div v-if="content.metadata" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
        <span v-if="content.metadata.width && content.metadata.height">
          {{ content.metadata.width }}×{{ content.metadata.height }}px
        </span>
        <span v-if="content.mimeType" class="ml-2">{{ content.mimeType }}</span>
      </div>
      <div v-if="imageError" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
        Failed to load image
      </div>
    </div>

    <!-- Audio Content -->
    <div v-else-if="content.contentType === 'audio'" class="audio-content">
      <div class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-2">
          <button
            @click="toggleAudioPlayback"
            class="btn-icon w-8 h-8 flex items-center justify-center"
            :disabled="audioError !== null"
            :title="isPlaying ? 'Pause' : 'Play'"
          >
            <Pause v-if="isPlaying" :size="18" />
            <Play v-else :size="18" />
          </button>
          
          <div class="flex-1">
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden dark:bg-gray-700">
              <div
                class="bg-blue-500 h-full transition-all duration-200"
                :style="{ width: `${audioProgress}%` }"
              ></div>
            </div>
          </div>

          <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {{ formatAudioTime(audioCurrentTime) }} / {{ formatAudioTime(audioDuration) }}
          </span>
        </div>

        <div v-if="content.metadata" class="text-xs text-gray-600 dark:text-gray-400">
          <span v-if="content.format">Format: {{ content.format.toUpperCase() }}</span>
          <span v-if="content.metadata.sampleRate" class="ml-2">{{ content.metadata.sampleRate }}Hz</span>
          <span v-if="content.metadata.channels" class="ml-2">{{ content.metadata.channels }}ch</span>
        </div>

        <div v-if="audioError" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
          <span class="font-medium">Audio Error:</span> {{ audioError }}
        </div>
      </div>
    </div>

    <!-- Unknown Content Type -->
    <div v-else class="unknown-content">
      <div class="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
        <span class="font-medium">Unknown content type:</span> {{ (content as any).contentType }}
      </div>
    </div>

    <!-- Image Expansion Modal -->
    <Teleport to="body">
      <div
        v-if="isExpanded"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        @click="toggleExpand"
      >
        <div class="relative max-w-[90vw] max-h-[90vh]">
          <button
            @click.stop="toggleExpand"
            class="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            title="Close"
          >
            <X :size="24" />
          </button>
          <img
            v-if="content.contentType === 'image'"
            :src="`data:${content.mimeType};base64,${content.data}`"
            :alt="imageAltText"
            class="max-w-full max-h-[90vh] h-auto rounded-lg"
            @click.stop
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Play, Pause, Maximize2, X } from 'lucide-vue-next'

export type TextContent = {
  contentType: 'text'
  text: string
}

export type ImageContent = {
  contentType: 'image'
  data: string // Base64-encoded
  mimeType: string
  metadata?: {
    width?: number
    height?: number
    [key: string]: any
  }
}

export type AudioContent = {
  contentType: 'audio'
  data: string // Base64-encoded
  format: 'pcm' | 'mp3' | 'wav' | 'opus'
  mimeType: string
  metadata?: {
    sampleRate?: number
    channels?: number
    bitDepth?: number
    [key: string]: any
  }
}

export type Content = TextContent | ImageContent | AudioContent

interface Props {
  content: Content
}

const props = defineProps<Props>()

// Image state
const isExpanded = ref(false)
const imageError = ref(false)

const imageAltText = computed(() => {
  if (props.content.contentType === 'image' && props.content.metadata) {
    return `Image ${props.content.metadata.width}×${props.content.metadata.height}`
  }
  return 'Tool call result image'
})

function toggleExpand() {
  if (props.content.contentType === 'image') {
    isExpanded.value = !isExpanded.value
  }
}

function handleImageError() {
  imageError.value = true
}

// Audio state
const audioElement = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const audioError = ref<string | null>(null)
let audioTimeUpdateInterval: number | null = null

const audioProgress = computed(() => {
  if (audioDuration.value === 0) return 0
  return (audioCurrentTime.value / audioDuration.value) * 100
})

function formatAudioTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function createAudioElement() {
  if (props.content.contentType !== 'audio') return

  try {
    // Clean up existing audio element
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.src = ''
      audioElement.value = null
    }

    // Create new audio element
    const audio = new Audio()
    audio.src = `data:${props.content.mimeType};base64,${props.content.data}`
    
    audio.addEventListener('loadedmetadata', () => {
      audioDuration.value = audio.duration
    })

    audio.addEventListener('ended', () => {
      isPlaying.value = false
      audioCurrentTime.value = 0
      if (audioTimeUpdateInterval !== null) {
        clearInterval(audioTimeUpdateInterval)
        audioTimeUpdateInterval = null
      }
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e)
      audioError.value = 'Failed to load or play audio'
      isPlaying.value = false
    })

    audioElement.value = audio
  } catch (error) {
    console.error('Failed to create audio element:', error)
    audioError.value = 'Failed to initialize audio player'
  }
}

function toggleAudioPlayback() {
  if (props.content.contentType !== 'audio') return

  if (!audioElement.value) {
    createAudioElement()
  }

  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
    if (audioTimeUpdateInterval !== null) {
      clearInterval(audioTimeUpdateInterval)
      audioTimeUpdateInterval = null
    }
  } else {
    audioElement.value.play()
      .then(() => {
        isPlaying.value = true
        // Update current time periodically
        audioTimeUpdateInterval = window.setInterval(() => {
          if (audioElement.value) {
            audioCurrentTime.value = audioElement.value.currentTime
          }
        }, 100)
      })
      .catch((error) => {
        console.error('Failed to play audio:', error)
        audioError.value = 'Playback failed'
        isPlaying.value = false
      })
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
    audioElement.value = null
  }
  if (audioTimeUpdateInterval !== null) {
    clearInterval(audioTimeUpdateInterval)
  }
})
</script>

<style scoped>
.content-viewer {
  width: 100%;
}

.text-content pre {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.image-content {
  max-width: 100%;
}

.audio-content {
  max-width: 100%;
}
</style>
