import { ref, onUnmounted, type Ref } from 'vue'
import { NexusWebSocketClient, createWebSocketUrl, type WebSocketEventHandlers, type StartConversationOptions } from '@/api/websocket'

/**
 * Composable for managing a WebSocket conversation client.
 * Handles connection, authentication, and cleanup automatically.
 * 
 * @param apiKey - API key for authentication
 * @param handlers - Event handlers for WebSocket events
 * @returns WebSocket client utilities and state
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useWebSocketClient } from '@/composables/useWebSocketClient'
 * 
 * const { client, isConnected, isInConversation, connect, disconnect } = useWebSocketClient('api-key', {
 *   onAiVoiceChunk: (message) => {
 *     console.log('Audio chunk:', message.chunkId)
 *   }
 * })
 * 
 * onMounted(async () => {
 *   await connect()
 *   await client.value?.startConversation({ userId: 'user-123', stageId: 'stage-456' })
 * })
 * </script>
 * ```
 */
export function useWebSocketClient(apiKey: string, handlers?: WebSocketEventHandlers) {
  const client: Ref<NexusWebSocketClient | null> = ref(null)
  const isConnected = ref(false)
  const isInConversation = ref(false)
  const error = ref<Error | null>(null)
  const sessionId = ref<string | null>(null)
  const conversationId = ref<string | null>(null)

  /**
   * Connect to the WebSocket server and authenticate
   */
  async function connect() {
    try {
      error.value = null
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      const wsUrl = createWebSocketUrl(apiBaseUrl)

      client.value = new NexusWebSocketClient({
        url: wsUrl,
        apiKey,
        handlers: {
          ...handlers,
          onConnect: () => {
            isConnected.value = true
            handlers?.onConnect?.()
          },
          onDisconnect: (event) => {
            isConnected.value = false
            isInConversation.value = false
            sessionId.value = null
            conversationId.value = null
            handlers?.onDisconnect?.(event)
          },
        },
      })

      await client.value.connect()
      sessionId.value = client.value.getSessionId()
      isConnected.value = true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Start a new conversation
   */
  async function startConversation(options: StartConversationOptions) {
    if (!client.value) {
      throw new Error('Client not connected')
    }

    try {
      error.value = null
      const id = await client.value.startConversation(options)
      conversationId.value = id
      isInConversation.value = true
      return id
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Resume an existing conversation
   */
  async function resumeConversation(convId: string) {
    if (!client.value) {
      throw new Error('Client not connected')
    }

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

  /**
   * End the current conversation
   */
  async function endConversation() {
    if (!client.value) {
      throw new Error('Client not connected')
    }

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

  /**
   * Send a text message
   */
  async function sendTextInput(text: string) {
    if (!client.value) {
      throw new Error('Client not connected')
    }

    try {
      error.value = null
      await client.value.sendTextInput(text)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Start voice input phase
   */
  async function startVoiceInput() {
    if (!client.value) {
      throw new Error('Client not connected')
    }

    try {
      error.value = null
      await client.value.startVoiceInput()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Send voice audio chunk
   */
  async function sendVoiceChunk(base64Audio: string) {
    if (!client.value) {
      throw new Error('Client not connected')
    }

    try {
      error.value = null
      await client.value.sendVoiceChunk(base64Audio)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * End voice input phase
   */
  async function endVoiceInput() {
    if (!client.value) {
      throw new Error('Client not connected')
    }

    try {
      error.value = null
      await client.value.endVoiceInput()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  function disconnect() {
    if (client.value) {
      client.value.disconnect()
      client.value = null
    }
    isConnected.value = false
    isInConversation.value = false
    sessionId.value = null
    conversationId.value = null
  }

  // Auto cleanup on unmount
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
    connect,
    disconnect,
    startConversation,
    resumeConversation,
    endConversation,
    sendTextInput,
    startVoiceInput,
    sendVoiceChunk,
    endVoiceInput,
  }
}
