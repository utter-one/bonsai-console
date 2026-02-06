import { ref, computed, onUnmounted } from 'vue'
import type { AudioFormat } from '@/api/websocket/websocket-contracts'

interface AudioChunk {
  audioData: string // base64-encoded PCM audio
  audioFormat: AudioFormat
  ordinal: number
  isFinal: boolean
}

export interface AudioPlaybackState {
  playing: boolean
  paused: boolean
  buffering: boolean
  error: string | null
  currentTime: number
  duration: number
  volume: number
}

/**
 * Composable for managing audio playback from base64-encoded PCM chunks
 * Handles decoding, buffering, and sequential playback of audio data
 */
export function useAudioPlayback() {
  // Audio context (initialized on first use due to browser autoplay restrictions)
  let audioContext: AudioContext | null = null
  let currentSource: AudioBufferSourceNode | null = null
  let startTime = 0

  // State
  const state = ref<AudioPlaybackState>({
    playing: false,
    paused: false,
    buffering: false,
    error: null,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
  })

  // Chunk queue (sorted by ordinal) - must be reactive for computed properties
  const chunkQueue = ref<AudioChunk[]>([])
  const audioBuffers = ref<AudioBuffer[]>([])
  let currentBufferIndex = 0

  /**
   * Initialize AudioContext (must be called after user gesture for autoplay policy)
   */
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    return audioContext
  }

  /**
   * Parse PCM format to extract sample rate
   * e.g., 'pcm_16000' -> 16000
   */
  function parseSampleRate(format: AudioFormat): number {
    const match = format.match(/\d+/)
    return match ? parseInt(match[0], 10) : 16000
  }

  /**
   * Decode base64 PCM audio data to AudioBuffer
   */
  async function decodePCMChunk(chunk: AudioChunk): Promise<AudioBuffer> {
    const ctx = initAudioContext()
    const sampleRate = parseSampleRate(chunk.audioFormat)

    // Decode base64 to binary
    const binaryString = atob(chunk.audioData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Parse as 16-bit little-endian PCM
    const samples = new Int16Array(bytes.buffer)
    const floatSamples = new Float32Array(samples.length)

    // Convert to float32 (-1.0 to 1.0 range)
    for (let i = 0; i < samples.length; i++) {
      floatSamples[i] = (samples[i] ?? 0) / 32768.0
    }

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, floatSamples.length, sampleRate)
    audioBuffer.getChannelData(0).set(floatSamples)

    return audioBuffer
  }

  /**
   * Add an audio chunk to the queue
   */
  async function addChunk(chunk: AudioChunk) {
    try {
      state.value.error = null
      state.value.buffering = true

      // Add to queue in order
      chunkQueue.value.push(chunk)
      chunkQueue.value.sort((a, b) => a.ordinal - b.ordinal)

      // Decode chunk
      const audioBuffer = await decodePCMChunk(chunk)
      audioBuffers.value.push(audioBuffer)

      // Update total duration
      state.value.duration = audioBuffers.value.reduce((sum, buf) => sum + buf.duration, 0)

      state.value.buffering = false

      // Auto-start playback when first chunk arrives
      if (audioBuffers.value.length === 1 && !state.value.playing && !state.value.paused) {
        play()
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to decode audio chunk'
      state.value.buffering = false
      console.error('[AudioPlayback] Audio chunk decode error:', err)
    }
  }

  /**
   * Play the next audio buffer in the queue
   */
  function playNextBuffer() {
    if (currentBufferIndex >= audioBuffers.value.length) {
      // Playback complete
      state.value.playing = false
      currentBufferIndex = 0
      state.value.currentTime = 0
      return
    }

    const ctx = initAudioContext()
    const buffer = audioBuffers.value[currentBufferIndex]
    
    if (!buffer) return

    // Create source node
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    // Handle playback end
    source.onended = () => {
      if (state.value.playing) {
        currentBufferIndex++
        playNextBuffer()
      }
    }

    // Start playback
    currentSource = source
    startTime = ctx.currentTime
    source.start(0)

    // Update current time periodically
    const updateInterval = setInterval(() => {
      if (!state.value.playing || !audioContext) {
        clearInterval(updateInterval)
        return
      }

      const elapsed = audioContext.currentTime - startTime
      const previousDuration = audioBuffers.value
        .slice(0, currentBufferIndex)
        .reduce((sum, buf) => sum + buf.duration, 0)
      
      state.value.currentTime = previousDuration + elapsed
    }, 100)
  }

  /**
   * Start or resume playback
   */
  function play() {
    try {
      if (audioBuffers.value.length === 0) {
        state.value.error = 'No audio data to play'
        return
      }

      initAudioContext()

      if (state.value.paused) {
        // Resume from pause
        state.value.paused = false
        state.value.playing = true
        playNextBuffer()
      } else if (!state.value.playing) {
        // Start fresh
        currentBufferIndex = 0
        state.value.playing = true
        state.value.paused = false
        state.value.currentTime = 0
        playNextBuffer()
      }

      state.value.error = null
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to play audio'
      console.error('Audio playback error:', err)
    }
  }

  /**
   * Pause playback
   */
  function pause() {
    if (currentSource && state.value.playing) {
      currentSource.stop()
      currentSource = null
      state.value.playing = false
      state.value.paused = true
    }
  }

  /**
   * Stop playback and reset
   */
  function stop() {
    if (currentSource) {
      currentSource.stop()
      currentSource = null
    }

    state.value.playing = false
    state.value.paused = false
    state.value.currentTime = 0
    currentBufferIndex = 0
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  function setVolume(volume: number) {
    state.value.volume = Math.max(0, Math.min(1, volume))
    // Note: To implement volume control properly, we'd need to use GainNode
    // For simplicity, we're just tracking the value here
  }

  /**
   * Clear all audio buffers and reset state
   */
  function clear() {
    stop()
    chunkQueue.value = []
    audioBuffers.value = []
    state.value.duration = 0
    state.value.error = null
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    clear()
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  })

  // Computed properties
  const isReady = computed(() => audioBuffers.value.length > 0)
  const progress = computed(() => {
    if (state.value.duration === 0) return 0
    return (state.value.currentTime / state.value.duration) * 100
  })

  return {
    state: computed(() => state.value),
    isReady,
    progress,
    addChunk,
    play,
    pause,
    stop,
    setVolume,
    clear,
  }
}
