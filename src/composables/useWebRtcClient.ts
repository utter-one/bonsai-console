import { ref, onUnmounted, type Ref } from 'vue'
import { NexusWebRTCClient, type WebRTCEventHandlers, type StartConversationOptions } from '@/api/webrtc'

export function useWebRtcClient(
  apiKey: string,
  options?: WebRTCEventHandlers & {
    sessionSettings?: {
      sendVoiceInput: boolean
      sendTextInput: boolean
      receiveVoiceOutput: boolean
      receiveTranscriptionUpdates: boolean
      receiveEvents: boolean
    }
  }
) {
  const client: Ref<NexusWebRTCClient | null> = ref(null)
  const isConnected = ref(false)
  const isInConversation = ref(false)
  const error = ref<Error | null>(null)
  const sessionId = ref<string | null>(null)
  const conversationId = ref<string | null>(null)
  const projectSettings = ref<any>(null)

  async function connect() {
    try {
      error.value = null
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

      client.value = new NexusWebRTCClient({
        apiBaseUrl,
        apiKey,
        sessionSettings: options?.sessionSettings,
        handlers: {
          ...options,
          onConnect: () => {
            isConnected.value = true
            options?.onConnect?.()
          },
          onDisconnect: () => {
            isConnected.value = false
            isInConversation.value = false
            sessionId.value = null
            conversationId.value = null
            options?.onDisconnect?.()
          },
        },
      })

      await client.value.connect()
      sessionId.value = client.value.getSessionId()
      projectSettings.value = client.value.getProjectSettings()
      isConnected.value = true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  async function startConversation(opts: StartConversationOptions) {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      const id = await client.value.startConversation(opts)
      conversationId.value = id
      isInConversation.value = true
      return id
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  async function resumeConversation(convId: string) {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      await client.value.resumeConversation(convId)
      conversationId.value = convId
      isInConversation.value = true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  async function endConversation() {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      await client.value.endConversation()
      conversationId.value = null
      isInConversation.value = false
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  async function sendTextInput(text: string) {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      await client.value.sendTextInput(text)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  async function startVoiceInput(): Promise<string> {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      return await client.value.startVoiceInput()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Send a raw PCM Int16 LE audio buffer over the WebRTC audio DataChannel.
   * Preferred over sendVoiceChunk for WebRTC — avoids base64 encoding overhead.
   */
  function sendVoiceChunkRaw(audioBuffer: ArrayBuffer): void {
    if (!client.value) throw new Error('Client not connected')
    client.value.sendVoiceChunkRaw(audioBuffer)
  }

  async function endVoiceInput() {
    if (!client.value) throw new Error('Client not connected')
    try {
      error.value = null
      await client.value.endVoiceInput()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  function disconnect() {
    if (client.value) {
      client.value.disconnect()
      client.value = null
    }
    isConnected.value = false
    isInConversation.value = false
    sessionId.value = null
    conversationId.value = null
    projectSettings.value = null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    client,
    isConnected,
    isInConversation,
    error,
    sessionId,
    conversationId,
    projectSettings,
    connect,
    disconnect,
    startConversation,
    resumeConversation,
    endConversation,
    sendTextInput,
    startVoiceInput,
    sendVoiceChunkRaw,
    endVoiceInput,
  }
}
