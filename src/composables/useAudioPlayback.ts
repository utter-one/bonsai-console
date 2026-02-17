import { ref, computed, onUnmounted } from 'vue'
import type { AudioFormat } from '@/api/websocket/websocket-contracts'

interface AudioChunk {
  audioData: string // base64-encoded PCM audio
  audioFormat: AudioFormat
  ordinal: number
  isFinal: boolean
  sampleRate?: number
  bitRate?: number
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
  let scheduledSources: AudioBufferSourceNode[] = []
  let nextScheduledTime = 0
  let playbackStartTime = 0

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
  let lastScheduledBufferIndex = -1

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
  function getSampleRate(chunk: AudioChunk): number {
    if (chunk.sampleRate)
      return chunk.sampleRate

    const format = chunk.audioFormat
    const match = format.match(/\d+/)
    if (format as string === 'linear16') return 16000; // Deepgrams linear16 format
    return match ? parseInt(match[0], 10) : 16000
  }

  /**
   * Decode base64 PCM audio data to AudioBuffer
   */
  async function decodePCMChunk(chunk: AudioChunk): Promise<AudioBuffer> {
    const ctx = initAudioContext()
    const sampleRate = getSampleRate(chunk)

    // Decode base64 to binary
    const binaryString = atob(chunk.audioData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Parse as 16-bit little-endian PCM
    console.log(`Lenght of bytes:`, bytes.length, bytes.buffer.byteLength)
    console.log(`Chunk info:`, { ...chunk, sampleRate2: sampleRate })
    const samples = new Int16Array(bytes.buffer)
    const floatSamples = new Float32Array(samples.length)

    // Convert to float32 (-1.0 to 1.0 range)
    for (let i = 0; i < samples.length; i++) {
      floatSamples[i] = (samples[i] ?? 0) / 32768.0
    }

    console.log(`Start:`, { floatSamples: floatSamples.slice(0, 10) }) // Log first 10 samples for debugging
    console.log(`End:`, { floatSamples: floatSamples.slice(-10) }) // Log last 10 samples for debugging

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, floatSamples.length, sampleRate)
    audioBuffer.getChannelData(0).set(floatSamples)

    return audioBuffer
  }

  /**
   * Schedule a single audio buffer on the AudioContext timeline
   */
  function scheduleBuffer(buffer: AudioBuffer, startTime: number): number {
    const ctx = initAudioContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    // Schedule at specific time for gapless playback
    source.start(startTime)
    scheduledSources.push(source)

    // Handle when this buffer finishes (for cleanup and state updates)
    source.onended = () => {
      const index = scheduledSources.indexOf(source)
      if (index > -1) {
        scheduledSources.splice(index, 1)
      }

      // Check if all buffers have finished playing
      if (scheduledSources.length === 0 && lastScheduledBufferIndex >= audioBuffers.value.length - 1) {
        state.value.playing = false
        state.value.currentTime = 0
        lastScheduledBufferIndex = -1
        nextScheduledTime = 0
        playbackStartTime = 0
      }
    }

    // Return the next available start time
    return startTime + buffer.duration
  }

  /**
   * Schedule all unscheduled buffers for playback
   */
  function scheduleAllBuffers() {
    // Schedule any new buffers that haven't been scheduled yet
    for (let i = lastScheduledBufferIndex + 1; i < audioBuffers.value.length; i++) {
      const buffer = audioBuffers.value[i]
      if (!buffer) continue

      nextScheduledTime = scheduleBuffer(buffer, nextScheduledTime)
      lastScheduledBufferIndex = i
    }
  }

  /**
   * Add an audio chunk to the queue
   */
  async function addChunk(chunk: AudioChunk) {
    try {
      state.value.error = null
      
      // Skip processing if audio data is empty (e.g., in final messages with isFinal: true)
      if (!chunk.audioData || chunk.audioData.trim() === '') {
        // Add to queue for tracking but don't decode or create buffer
        chunkQueue.value.push(chunk)
        chunkQueue.value.sort((a, b) => a.ordinal - b.ordinal)
        return
      }
      
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

      // If already playing, schedule this new buffer immediately for gapless continuation
      if (state.value.playing) {
        scheduleAllBuffers()
      }
      // Auto-start playback when first chunk arrives
      else if (audioBuffers.value.length === 1 && !state.value.paused) {
        play()
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to decode audio chunk'
      state.value.buffering = false
      console.error('[AudioPlayback] Audio chunk decode error:', err)
    }
  }

  /**
   * Update current playback time (called periodically)
   */
  let timeUpdateInterval: ReturnType<typeof setInterval> | null = null

  function startTimeTracking() {
    if (timeUpdateInterval) return

    timeUpdateInterval = setInterval(() => {
      if (!state.value.playing || !audioContext || playbackStartTime === 0) {
        return
      }

      // Calculate elapsed time since playback started
      const elapsed = audioContext.currentTime - playbackStartTime
      state.value.currentTime = Math.min(elapsed, state.value.duration)
    }, 100)
  }

  function stopTimeTracking() {
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
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

      const ctx = initAudioContext()

      if (state.value.paused) {
        // Resume from pause - reschedule remaining buffers
        state.value.paused = false
        state.value.playing = true

        // Calculate where to resume from
        const currentTime = state.value.currentTime
        let accumulatedTime = 0
        let resumeBufferIndex = 0

        // Find which buffer we were on
        for (let i = 0; i < audioBuffers.value.length; i++) {
          const buffer = audioBuffers.value[i]
          if (!buffer) continue

          if (accumulatedTime + buffer.duration > currentTime) {
            resumeBufferIndex = i
            break
          }
          accumulatedTime += buffer.duration
        }

        // Schedule from resume point
        nextScheduledTime = ctx.currentTime + 0.1 // Small buffer to prevent immediate playback issues
        playbackStartTime = nextScheduledTime - accumulatedTime // Adjust for elapsed time
        lastScheduledBufferIndex = resumeBufferIndex - 1
        scheduleAllBuffers()
        startTimeTracking()
      } else if (!state.value.playing) {
        // Start fresh
        state.value.playing = true
        state.value.paused = false
        state.value.currentTime = 0

        // Schedule all buffers on the timeline
        nextScheduledTime = ctx.currentTime + 0.1 // Small buffer to prevent immediate playback issues
        playbackStartTime = nextScheduledTime
        lastScheduledBufferIndex = -1
        scheduleAllBuffers()
        startTimeTracking()
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
    if (state.value.playing) {
      // Stop all scheduled sources
      for (const source of scheduledSources) {
        try {
          source.stop()
        } catch (err) {
          // Source may have already ended, ignore
        }
      }
      scheduledSources = []

      stopTimeTracking()
      state.value.playing = false
      state.value.paused = true
    }
  }

  /**
   * Stop playback and reset
   */
  function stop() {
    // Stop all scheduled sources
    for (const source of scheduledSources) {
      try {
        source.stop()
      } catch (err) {
        // Source may have already ended, ignore
      }
    }
    scheduledSources = []

    stopTimeTracking()
    state.value.playing = false
    state.value.paused = false
    state.value.currentTime = 0
    lastScheduledBufferIndex = -1
    nextScheduledTime = 0
    playbackStartTime = 0
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
    stopTimeTracking()
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
