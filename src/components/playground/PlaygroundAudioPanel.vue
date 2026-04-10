<template>
  <div
    class="flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden"
    :class="[isInputFocused ? 'max-w-0 opacity-0 mr-0' : 'max-w-[200px] opacity-100 mr-2 md:mr-0', 'md:max-w-none md:opacity-100']"
  >
    <label class="hidden md:block mb-1.5 font-medium text-gray-900 dark:text-gray-200">Voice</label>
    <div class="flex gap-2 items-center">
      <!-- Record button (standard mode) -->
      <button
        v-if="!isServerVadMode && recording?.recordingState !== 'recording'"
        class="btn-secondary h-10 px-4 flex items-center gap-2 whitespace-nowrap"
        :disabled="!canRecordVoice"
        @click="emit('start-recording')"
        title="Start voice recording"
      >
        <Mic :size="20" />
        <span class="hidden md:block">Speak</span>
      </button>

      <!-- Stop button (standard mode) -->
      <button
        v-else-if="!isServerVadMode"
        class="btn-danger h-10 px-4 flex items-center gap-2 animate-pulse whitespace-nowrap"
        @click="emit('stop-recording')"
        title="Stop voice recording"
      >
        <Square :size="20" />
        <span class="hidden md:block">Stop</span>
      </button>

      <!-- VAD mode: streaming indicator with integrated VU meter -->
      <div
        v-if="isServerVadMode && recording?.recordingState === 'recording'"
        class="h-10 px-3 flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-medium whitespace-nowrap"
        title="Server VAD mode (Experimental)"
      >
        <Mic :size="16" />
        <span class="hidden md:block">Listening</span>
        <div class="flex items-end gap-px h-4">
          <div class="w-1 rounded-full bg-current transition-all duration-75" :style="{ height: `${2 + (recording?.audioLevel ?? 0) * 8}px` }"></div>
          <div class="w-1 rounded-full bg-current transition-all duration-75" :style="{ height: `${3 + (recording?.audioLevel ?? 0) * 11}px` }"></div>
          <div class="w-1 rounded-full bg-current transition-all duration-75" :style="{ height: `${4 + (recording?.audioLevel ?? 0) * 12}px` }"></div>
          <div class="w-1 rounded-full bg-current transition-all duration-75" :style="{ height: `${3 + (recording?.audioLevel ?? 0) * 11}px` }"></div>
          <div class="w-1 rounded-full bg-current transition-all duration-75" :style="{ height: `${2 + (recording?.audioLevel ?? 0) * 8}px` }"></div>
        </div>
      </div>

      <!-- Audio Settings Button -->
      <button
        @click="showAudioSettingsModal = true"
        class="btn-secondary h-10 p-0 flex items-center justify-center min-w-[40px]"
        title="Audio settings"
      >
        <Settings2 :width="20" :height="20" />
      </button>

      <!-- Audio Enhancement Indicators -->
      <div class="flex flex-col gap-0.5 justify-center">
        <Waves :size="12" :class="audioSettings.echoCancellation ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'">
          <title>{{ `Echo Cancellation: ${audioSettings.echoCancellation ? 'Enabled' : 'Disabled'}` }}</title>
        </Waves>
        <Filter :size="12" :class="audioSettings.noiseSuppression ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'">
          <title>{{ `Noise Suppression: ${audioSettings.noiseSuppression ? 'Enabled' : 'Disabled'}` }}</title>
        </Filter>
        <Gauge :size="12" :class="audioSettings.autoGainControl ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'">
          <title>{{ `Auto Gain Control: ${audioSettings.autoGainControl ? 'Enabled' : 'Disabled'}` }}</title>
        </Gauge>
      </div>

      <!-- Audio Level Indicator -->
      <div
        v-if="!isServerVadMode && recording?.recordingState === 'recording'"
        class="flex items-center gap-1"
        title="Audio level"
      >
        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
          <div
            class="h-full bg-blue-500 transition-all duration-100"
            :style="{ width: `${(recording?.audioLevel ?? 0) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <p v-if="recording?.errorMessage" class="text-xs text-red-600 whitespace-nowrap overflow-hidden text-ellipsis">
      {{ recording.errorMessage }}
    </p>
  </div>

  <AudioSettingsModal
    v-if="showAudioSettingsModal"
    :current-settings="audioSettings"
    :sample-rate="sampleRate"
    @close="showAudioSettingsModal = false"
    @save="handleSave"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Mic, Square, Settings2, Waves, Filter, Gauge } from 'lucide-vue-next'
import AudioSettingsModal from '@/components/modals/AudioSettingsModal.vue'

interface AudioSettings {
  deviceId: string | null
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

interface RecordingState {
  recordingState: 'idle' | 'recording' | 'processing' | 'error'
  audioLevel: number
  errorMessage?: string | null
  stopRecording: () => void
  startRecording: () => Promise<void>
}

const props = defineProps<{
  isServerVadMode: boolean
  canRecordVoice: boolean
  recording: RecordingState | null
  audioSettings: AudioSettings
  sampleRate: number
  isInputFocused: boolean
}>()

const emit = defineEmits<{
  'start-recording': []
  'stop-recording': []
  'settings-save': [settings: AudioSettings]
}>()

const showAudioSettingsModal = ref(false)

function handleSave(settings: AudioSettings) {
  showAudioSettingsModal.value = false
  emit('settings-save', settings)
}
</script>
