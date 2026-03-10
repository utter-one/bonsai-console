<template>
  <div class="modal-overlay">
    <div class="modal-content max-w-2xl" @click.stop>
      <h2 class="modal-header">Audio Settings</h2>
      
      <div class="space-y-6">
        <!-- Device Selection -->
        <div class="form-group">
          <label class="form-label">Microphone Device</label>
          <div class="flex gap-2">
            <select
              v-model="selectedDeviceId"
              class="form-select flex-1"
              :disabled="!audioDevices.hasPermission.value || audioDevices.isLoading.value"
            >
              <option :value="null">System Default</option>
              <option
                v-for="device in audioDevices.devices.value"
                :key="device.deviceId"
                :value="device.deviceId"
              >
                {{ device.label }}
              </option>
            </select>
            <button
              v-if="!audioDevices.hasPermission.value"
              @click="requestPermission"
              :disabled="audioDevices.isLoading.value"
              class="btn-secondary whitespace-nowrap"
            >
              {{ audioDevices.isLoading.value ? 'Requesting...' : 'Allow Access' }}
            </button>
          </div>
          <p v-if="audioDevices.error.value" class="text-sm text-red-600 mt-1 dark:text-red-400">
            {{ audioDevices.error.value }}
          </p>
          <p v-else-if="!audioDevices.hasPermission.value" class="text-sm text-gray-600 mt-1 dark:text-gray-400">
            Microphone permission required to list available devices
          </p>
        </div>

        <!-- Audio Processing Options -->
        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-200">Audio Processing</h3>
          <div class="space-y-3">
            <label class="flex items-start md:items-center gap-2 cursor-pointer">
              <input
                v-model="echoCancellation"
                type="checkbox"
                class="form-checkbox"
              />
              <Waves :size="16" :class="echoCancellation ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'" />
              <div class="flex flex-col md:flex-row items-start md:items-center gap-1 relative -top-1 md:top-0">
                <span class="text-sm text-gray-700 dark:text-gray-200">Echo Cancellation</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">(Reduces echo from speakers)</span>
              </div>
            </label>

            <label class="flex items-start md:items-center gap-2 cursor-pointer">
              <input
                v-model="noiseSuppression"
                type="checkbox"
                class="form-checkbox"
              />
              <Filter :size="16" :class="noiseSuppression ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'" />
              <div class="flex flex-col md:flex-row items-start md:items-center gap-1 relative -top-1 md:top-0">
                <span class="text-sm text-gray-700 dark:text-gray-200">Noise Suppression</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">(Reduces background noise)</span>
              </div>
            </label>

            <label class="flex items-start md:items-center gap-2 cursor-pointer">
              <input
                v-model="autoGainControl"
                type="checkbox"
                class="form-checkbox"
              />
              <Gauge :size="16" :class="autoGainControl ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'" />
              <div class="flex flex-col md:flex-row items-start md:items-center gap-1 relative -top-1 md:top-0">
                <span class="text-sm text-gray-700 dark:text-gray-200">Auto Gain Control</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">(Automatically adjusts volume)</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Audio Level Testing -->
        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Test Microphone</h3>
            <div class="flex gap-2">
              <button
                v-if="playback.isReady.value && (!testRecording || testRecording.recordingState === 'idle')"
                @click="clearRecording"
                class="btn-secondary text-sm"
              >
                Clear
              </button>
              <button
                v-if="!testRecording || testRecording.recordingState === 'idle'"
                @click="startTest"
                :disabled="!canTest"
                class="btn-secondary text-sm"
              >
                Record
              </button>
              <button
                v-else-if="testRecording.recordingState === 'recording'"
                @click="stopTest"
                class="btn-danger text-sm"
              >
                Stop
              </button>
            </div>
          </div>

          <!-- Audio Level Visualization -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-600 w-16 dark:text-gray-400">Level:</span>
              <div class="flex-1 h-6 bg-gray-200 rounded-md overflow-hidden relative dark:bg-gray-700">
                <div
                  class="h-full transition-all duration-100"
                  :class="{
                    'bg-green-500': (testRecording?.audioLevel ?? 0) < 0.7,
                    'bg-yellow-500': (testRecording?.audioLevel ?? 0) >= 0.7 && (testRecording?.audioLevel ?? 0) < 0.9,
                    'bg-red-500': (testRecording?.audioLevel ?? 0) >= 0.9
                  }"
                  :style="{ width: `${(testRecording?.audioLevel ?? 0) * 100}%` }"
                ></div>
                <!-- Reference lines -->
                <div class="absolute inset-0 flex items-center pointer-events-none">
                  <div class="w-full h-full flex">
                    <div class="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                    <div class="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                    <div class="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                    <div class="flex-1"></div>
                  </div>
                </div>
              </div>
              <span class="text-xs text-gray-600 w-12 text-right dark:text-gray-400">
                {{ Math.round((testRecording?.audioLevel ?? 0) * 100) }}%
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <template v-if="testRecording?.recordingState === 'recording'">
                🎤 Speak into your microphone to test the audio level
              </template>
              <template v-else-if="testRecording?.recordingState === 'error'">
                ❌ {{ testRecording.errorMessage }}
              </template>
              <template v-else-if="!playback.isReady.value">
                Click "Record" to capture and review your microphone audio
              </template>
            </p>

            <!-- Recorded Audio Playback -->
            <div v-if="playback.isReady.value" class="border-t border-gray-100 pt-3 dark:border-gray-600">
              <p class="text-xs font-medium text-gray-600 mb-2 dark:text-gray-400">Recording Preview</p>
              <AudioPlayer
                :state="playback.state.value"
                :is-ready="playback.isReady.value"
                :progress="playback.progress.value"
                @play="playback.play()"
                @pause="playback.pause()"
                @stop="playback.stop()"
              />
            </div>
          </div>
        </div>

        <!-- Current Configuration Summary -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-900/20 dark:border-blue-800">
          <div class="flex items-start gap-2">
            <Info :size="16" class="text-blue-600 mt-0.5 flex-shrink-0 dark:text-blue-400" />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">Current Configuration</p>
              <ul class="space-y-1 text-xs">
                <li>Device: {{ currentDeviceName }}</li>
                <li>Sample Rate: {{ sampleRate }}Hz</li>
                <li>Processing: {{ processingStatus }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
        <button type="button" @click="handleSave" class="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAudioDevices } from '@/composables/useAudioDevices'
import { useAudioRecording } from '@/composables/useAudioRecording'
import { useAudioPlayback } from '@/composables/useAudioPlayback'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { Info, Waves, Filter, Gauge } from 'lucide-vue-next'
import type { AudioFormat } from '@/api/websocket/websocket-contracts'

export interface AudioSettings {
  deviceId: string | null
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

interface Props {
  currentSettings?: AudioSettings
  sampleRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  sampleRate: 16000,
})

const emit = defineEmits<{
  close: []
  save: [settings: AudioSettings]
}>()

// Audio devices management
const audioDevices = useAudioDevices()

// Form state
const selectedDeviceId = ref<string | null>(props.currentSettings?.deviceId ?? null)
const echoCancellation = ref(props.currentSettings?.echoCancellation ?? true)
const noiseSuppression = ref(props.currentSettings?.noiseSuppression ?? true)
const autoGainControl = ref(props.currentSettings?.autoGainControl ?? true)

// Test recording instance - stored as ref so we can replace it
const testRecording = ref<ReturnType<typeof useAudioRecording> | null>(null)

// Playback instance for reviewing recordings
const playback = useAudioPlayback()

// Collected audio chunks from the current test recording session
const recordedChunks = ref<Array<{ data: string; ordinal: number }>>([])

let chunkOrdinalCounter = 0

// Initialize test recording
function createTestRecording() {
  recordedChunks.value = []
  chunkOrdinalCounter = 0

  return useAudioRecording({
    sampleRate: props.sampleRate,
    chunkDurationMs: 500, // Shorter chunks for testing
    deviceId: selectedDeviceId.value ?? undefined,
    echoCancellation: echoCancellation.value,
    noiseSuppression: noiseSuppression.value,
    autoGainControl: autoGainControl.value,
    onChunk: (base64Audio: string) => {
      recordedChunks.value.push({ data: base64Audio, ordinal: chunkOrdinalCounter++ })
    },
    onError: (error) => {
      console.error('Test recording error:', error)
    },
  })
}

// Update test recording when settings change - stop recording and clear playback
watch([selectedDeviceId, echoCancellation, noiseSuppression, autoGainControl], () => {
  if (testRecording.value?.recordingState === 'recording') {
    testRecording.value.stopRecording()
  }
  recordedChunks.value = []
  playback.clear()
})

const canTest = computed(() => {
  return audioDevices.hasPermission.value && 
         (!testRecording.value || testRecording.value.recordingState === 'idle')
})

const currentDeviceName = computed(() => {
  if (!selectedDeviceId.value) return 'System Default'
  const device = audioDevices.getDeviceById(selectedDeviceId.value)
  return device?.label || 'Unknown Device'
})

const processingStatus = computed(() => {
  const enabled = []
  if (echoCancellation.value) enabled.push('Echo Cancellation')
  if (noiseSuppression.value) enabled.push('Noise Suppression')
  if (autoGainControl.value) enabled.push('Auto Gain')
  return enabled.length > 0 ? enabled.join(', ') : 'None'
})

async function requestPermission() {
  await audioDevices.requestPermission()
}

async function startTest() {
  try {
    // Stop any existing test
    if (testRecording.value?.recordingState === 'recording') {
      testRecording.value.stopRecording()
    }
    // Clear previous recording data when starting fresh
    playback.clear()

    // Create fresh recording instance with current settings
    testRecording.value = createTestRecording()

    // Start recording
    if (testRecording.value) {
      await testRecording.value.startRecording()
    }
  } catch (error) {
    console.error('Failed to start test:', error)
  }
}

async function stopTest() {
  if (testRecording.value) {
    testRecording.value.stopRecording()
  }

  if (recordedChunks.value.length > 0) {
    playback.clear()
    const audioFormat = `pcm_${props.sampleRate}` as AudioFormat
    for (const chunk of recordedChunks.value) {
      await playback.addChunk({
        audioData: chunk.data,
        audioFormat,
        ordinal: chunk.ordinal,
        isFinal: false,
        sampleRate: props.sampleRate,
      })
    }
  }
}

function clearRecording() {
  if (testRecording.value?.recordingState === 'recording') {
    testRecording.value.stopRecording()
  }
  recordedChunks.value = []
  playback.clear()
}

function handleSave() {
  // Stop test if running
  if (testRecording.value?.recordingState === 'recording') {
    testRecording.value.stopRecording()
  }
  playback.stop()

  emit('save', {
    deviceId: selectedDeviceId.value,
    echoCancellation: echoCancellation.value,
    noiseSuppression: noiseSuppression.value,
    autoGainControl: autoGainControl.value,
  })
}

// Cleanup
onUnmounted(() => {
  if (testRecording.value?.recordingState === 'recording') {
    testRecording.value.stopRecording()
  }
  playback.stop()
})
</script>
