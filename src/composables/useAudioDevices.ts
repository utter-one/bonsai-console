import { ref, onMounted, onUnmounted } from 'vue'

export interface AudioDevice {
  deviceId: string
  label: string
  groupId: string
}

/**
 * Composable for managing audio input devices.
 * Handles device enumeration, permission states, and device change events.
 */
export function useAudioDevices() {
  const devices = ref<AudioDevice[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasPermission = ref(false)

  /**
   * Enumerate available audio input devices
   */
  async function enumerateDevices(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error('Device enumeration not supported by browser')
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = allDevices.filter((device) => device.kind === 'audioinput')

      devices.value = audioInputs.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${devices.value.length + 1}`,
        groupId: device.groupId,
      }))

      // Check if we have permission (labels will be populated if we do)
      hasPermission.value = audioInputs.length > 0 && (audioInputs[0]?.label ?? '') !== ''
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to enumerate devices'
      devices.value = []
      hasPermission.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Request microphone permission and refresh device list
   */
  async function requestPermission(): Promise<boolean> {
    try {
      isLoading.value = true
      error.value = null

      // Request permission by attempting to access microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop())

      // Now enumerate devices with permission
      await enumerateDevices()

      return hasPermission.value
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          error.value = 'Microphone permission denied. Please enable in browser settings.'
        } else if (err.name === 'NotFoundError') {
          error.value = 'No microphone found. Please connect a microphone.'
        } else {
          error.value = err.message
        }
      } else {
        error.value = 'Failed to access microphone'
      }
      hasPermission.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get device by ID
   */
  function getDeviceById(deviceId: string): AudioDevice | undefined {
    return devices.value.find((device) => device.deviceId === deviceId)
  }

  /**
   * Get default device (first in list or system default)
   */
  function getDefaultDevice(): AudioDevice | undefined {
    // Try to find 'default' device
    const defaultDevice = devices.value.find((device) => device.deviceId === 'default')
    if (defaultDevice) return defaultDevice

    // Otherwise return first device
    return devices.value[0]
  }

  /**
   * Handle device change events (plug/unplug)
   */
  function handleDeviceChange() {
    enumerateDevices()
  }

  // Set up device change listener
  onMounted(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    }
    // Initial enumeration (will show devices without labels if no permission yet)
    enumerateDevices()
  })

  onUnmounted(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  })

  return {
    devices,
    isLoading,
    error,
    hasPermission,
    enumerateDevices,
    requestPermission,
    getDeviceById,
    getDefaultDevice,
  }
}
