import { ref, onUnmounted } from 'vue'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

export interface AudioRecordingOptions {
  sampleRate?: number // Default: 16000 (matches backend PCM format)
  chunkDurationMs?: number // Default: 2000 (2 seconds per chunk)
  deviceId?: string // Microphone device ID (optional, uses default if not specified)
  echoCancellation?: boolean // Default: true
  noiseSuppression?: boolean // Default: true
  autoGainControl?: boolean // Default: true
  onChunk?: (base64Audio: string) => void // Callback when chunk is ready
  onError?: (error: Error) => void
}

/**
 * Composable for recording audio from microphone and encoding to PCM format.
 * Captures audio via Web Audio API, converts Float32 samples to 16-bit PCM,
 * and encodes as base64 for WebSocket transmission.
 * 
 * Based on the inverse of useAudioPlayback's decoding logic.
 */
export function useAudioRecording(options: AudioRecordingOptions = {}) {
  const {
    sampleRate = 16000,
    chunkDurationMs = 2000,
    deviceId,
    echoCancellation = true,
    noiseSuppression = true,
    autoGainControl = true,
    onChunk,
    onError,
  } = options

  const recordingState = ref<RecordingState>('idle')
  const audioLevel = ref(0) // 0-1 for visualizing input volume
  const errorMessage = ref<string | null>(null)

  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let processorNode: ScriptProcessorNode | null = null
  let audioChunks: Float32Array[] = []
  let chunkTimer: number | null = null

  /**
   * Convert Float32Array audio samples to 16-bit PCM and encode as base64.
   * This is the inverse of the decoding logic in useAudioPlayback.ts
   */
  function encodePCMToBase64(samples: Float32Array): string {
    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    const int16Samples = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      // Clamp to [-1, 1] range and scale to Int16
      const sample = samples[i] ?? 0
      const clamped = Math.max(-1, Math.min(1, sample))
      int16Samples[i] = Math.round(clamped * 32767)
    }

    // Convert Int16Array to Uint8Array (little-endian bytes)
    const bytes = new Uint8Array(int16Samples.buffer)

    // Convert bytes to base64
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i] ?? 0)
    }
    return btoa(binaryString)
  }

  /**
   * Calculate RMS (Root Mean Square) audio level for visualization
   */
  function calculateAudioLevel(samples: Float32Array): number {
    let sum = 0
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i] ?? 0
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / samples.length)
    return Math.min(1, rms * 3) // Scale for better visualization
  }

  /**
   * Process accumulated audio chunks and send to callback
   */
  function processChunks() {
    if (audioChunks.length === 0) return

    // Concatenate all chunks into a single Float32Array
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combinedSamples = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      combinedSamples.set(chunk, offset)
      offset += chunk.length
    }

    // Encode to base64 PCM
    const base64Audio = encodePCMToBase64(combinedSamples)

    // Send to callback
    if (onChunk) {
      onChunk(base64Audio)
    }

    // Clear chunks for next batch
    audioChunks = []
  }

  /**
   * Start recording audio from microphone
   */
  async function startRecording(): Promise<void> {
    try {
      recordingState.value = 'processing'
      errorMessage.value = null

      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          channelCount: 1, // Mono
          sampleRate: { ideal: sampleRate },
          echoCancellation,
          noiseSuppression,
          autoGainControl,
        },
      })

      // Create audio context with desired sample rate
      audioContext = new AudioContext({ sampleRate })
      sourceNode = audioContext.createMediaStreamSource(mediaStream)

      // Use ScriptProcessorNode for audio processing (4096 buffer size)
      // Note: ScriptProcessorNode is deprecated but widely supported
      // Consider migrating to AudioWorkletNode in the future
      const bufferSize = 4096
      processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1)

      processorNode.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        
        // Create a copy of the samples (Float32Array)
        const samples = new Float32Array(inputData)
        
        // Calculate and update audio level for visualization
        audioLevel.value = calculateAudioLevel(samples)
        
        // Add to chunk buffer
        audioChunks.push(samples)
      }

      // Connect the audio graph
      sourceNode.connect(processorNode)
      processorNode.connect(audioContext.destination)

      // Set up timer to send chunks periodically
      chunkTimer = window.setInterval(() => {
        processChunks()
      }, chunkDurationMs)

      recordingState.value = 'recording'
    } catch (error) {
      const err = error as Error
      errorMessage.value = err.message || 'Failed to access microphone'
      recordingState.value = 'error'
      
      if (onError) {
        onError(err)
      }
      
      cleanup()
    }
  }

  /**
   * Stop recording and process any remaining chunks
   */
  function stopRecording(): void {
    if (recordingState.value !== 'recording') return

    recordingState.value = 'processing'

    // Clear chunk timer
    if (chunkTimer !== null) {
      clearInterval(chunkTimer)
      chunkTimer = null
    }

    // Process any remaining chunks
    processChunks()

    // Cleanup resources
    cleanup()

    recordingState.value = 'idle'
    audioLevel.value = 0
  }

  /**
   * Cleanup audio resources
   */
  function cleanup() {
    if (processorNode) {
      processorNode.disconnect()
      processorNode.onaudioprocess = null
      processorNode = null
    }

    if (sourceNode) {
      sourceNode.disconnect()
      sourceNode = null
    }

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }

    if (chunkTimer !== null) {
      clearInterval(chunkTimer)
      chunkTimer = null
    }

    audioChunks = []
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    if (recordingState.value === 'recording') {
      stopRecording()
    }
    cleanup()
  })

  return {
    recordingState,
    audioLevel,
    errorMessage,
    startRecording,
    stopRecording,
  }
}
