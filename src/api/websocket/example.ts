/**
 * Example usage of the Nexus WebSocket client.
 * This file demonstrates various use cases for real-time conversation management.
 */

import { NexusWebSocketClient, createWebSocketUrl } from './client'

/**
 * Example 1: Basic text-based conversation
 */
export async function basicTextConversation() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  const client = new NexusWebSocketClient({
    url: wsUrl,
    apiKey: 'your-api-key',
    debug: true,
    handlers: {
      onAiVoiceStart: (message) => {
        console.log('AI started speaking:', message.voiceOutputId)
      },
      onAiVoiceChunk: (message) => {
        console.log(`Received audio chunk ${message.ordinal}, final: ${message.isFinal}`)
        // Decode and play audioData: message.audioData
      },
      onAiVoiceEnd: (message) => {
        console.log('AI finished speaking:', message.voiceOutputId)
      },
      onError: (error) => {
        console.error('Server error:', error.error)
      },
    },
  })

  try {
    // Connect and authenticate
    await client.connect()
    console.log('Connected! Session ID:', client.getSessionId())

    // Start a new conversation
    const conversationId = await client.startConversation({
      userId: 'user-123',
      stageId: 'stage-456',
      personaId: 'persona-789', // Optional
    })
    console.log('Conversation started:', conversationId)

    // Send text input
    await client.sendTextInput('Hello, how are you?')
    console.log('Text sent, waiting for AI response...')

    // Wait for AI to respond (via voice chunks in handlers)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Send another message
    await client.sendTextInput('Tell me about the weather.')

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000))

    // End the conversation
    await client.endConversation()
    console.log('Conversation ended')

    // Disconnect
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    client.disconnect()
  }
}

/**
 * Example 2: Voice-based conversation
 */
export async function voiceConversation() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  const client = new NexusWebSocketClient({
    url: wsUrl,
    apiKey: 'your-api-key',
    debug: true,
    handlers: {
      onAiVoiceChunk: (message) => {
        // Decode base64 audio and play it
        // const audioData = atob(message.audioData)
        console.log('Received audio chunk:', message.chunkId)
        // ... play audio ...
      },
    },
  })

  try {
    await client.connect()

    await client.startConversation({
      userId: 'user-123',
      stageId: 'stage-456',
    })

    // Start voice input
    await client.startVoiceInput()
    console.log('Voice input started')

    // Simulate sending audio chunks (in reality, capture from microphone)
    const audioChunks = ['chunk1base64', 'chunk2base64', 'chunk3base64']
    for (const chunk of audioChunks) {
      await client.sendVoiceChunk(chunk)
      console.log('Sent voice chunk')
    }

    // End voice input
    await client.endVoiceInput()
    console.log('Voice input ended, waiting for AI response...')

    // Wait for AI response
    await new Promise(resolve => setTimeout(resolve, 5000))

    await client.endConversation()
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    client.disconnect()
  }
}

/**
 * Example 3: Using conversation control commands
 */
export async function conversationControl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  const client = new NexusWebSocketClient({
    url: wsUrl,
    apiKey: 'your-api-key',
  })

  try {
    await client.connect()

    await client.startConversation({
      userId: 'user-123',
      stageId: 'stage-456',
    })

    // Navigate to a different stage
    await client.goToStage('stage-789')
    console.log('Navigated to new stage')

    // Set a variable
    await client.setVariable('stage-789', 'userName', 'John Doe')
    console.log('Variable set')

    // Get a variable
    const userName = await client.getVariable('stage-789', 'userName')
    console.log('Variable value:', userName)

    // Get all variables
    const allVars = await client.getAllVariables('stage-789')
    console.log('All variables:', allVars)

    // Run a global action
    const result = await client.runAction('sendEmail', [
      'user@example.com',
      'Hello!',
      'Email body',
    ])
    console.log('Action result:', result)

    await client.endConversation()
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    client.disconnect()
  }
}

/**
 * Example 4: Resume an existing conversation
 */
export async function resumeConversation() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  const client = new NexusWebSocketClient({
    url: wsUrl,
    apiKey: 'your-api-key',
  })

  try {
    await client.connect()

    // Resume an existing conversation
    const existingConversationId = 'conv-xyz789'
    await client.resumeConversation(existingConversationId)
    console.log('Conversation resumed:', existingConversationId)

    // Continue the conversation
    await client.sendTextInput('I would like to continue our discussion.')

    await new Promise(resolve => setTimeout(resolve, 5000))

    await client.endConversation()
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    client.disconnect()
  }
}

/**
 * Example 5: Error handling and reconnection
 */
export async function errorHandlingExample() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  let client: NexusWebSocketClient | undefined
  let shouldReconnect = true

  const connect = async () => {
    client = new NexusWebSocketClient({
      url: wsUrl,
      apiKey: 'your-api-key',
      handlers: {
        onDisconnect: async (event) => {
          console.log('Disconnected:', event.code, event.reason)
          
          // Attempt to reconnect after a delay
          if (shouldReconnect) {
            console.log('Reconnecting in 3 seconds...')
            await new Promise(resolve => setTimeout(resolve, 3000))
            try {
              await connect()
            } catch (error) {
              console.error('Reconnection failed:', error)
            }
          }
        },
        onError: (error) => {
          console.error('Server error:', error.error)
        },
        onWebSocketError: (event) => {
          console.error('WebSocket error:', event)
        },
      },
    })

    try {
      await client.connect()
      console.log('Connected successfully')
    } catch (error) {
      console.error('Connection failed:', error)
      throw error
    }
  }

  try {
    await connect()

    if (!client) {
      throw new Error('Failed to initialize client')
    }

    // Use the client...
    await client.startConversation({
      userId: 'user-123',
      stageId: 'stage-456',
    })

    await client.sendTextInput('Hello!')

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10000))

    await client.endConversation()

    // Stop reconnection before disconnecting
    shouldReconnect = false
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    shouldReconnect = false
    if (client) {
      client.disconnect()
    }
  }
}

/**
 * Example 6: Real-time audio playback
 */
export async function realTimeAudioPlayback() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const wsUrl = createWebSocketUrl(apiBaseUrl)
  
  // Audio playback queue
  const audioQueue: AudioBuffer[] = []
  let isPlaying = false

  const client = new NexusWebSocketClient({
    url: wsUrl,
    apiKey: 'your-api-key',
    handlers: {
      onAiVoiceChunk: async (message) => {
        // Decode base64 audio data
        const binaryString = atob(message.audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Convert to AudioBuffer (assuming Web Audio API)
        try {
          const audioContext = new AudioContext()
          const audioBuffer = await audioContext.decodeAudioData(bytes.buffer)
          audioQueue.push(audioBuffer)

          // Start playback if not already playing
          if (!isPlaying) {
            playNextChunk()
          }
        } catch (error) {
          console.error('Error decoding audio:', error)
        }
      },
    },
  })

  function playNextChunk() {
    if (audioQueue.length === 0) {
      isPlaying = false
      return
    }

    isPlaying = true
    const audioContext = new AudioContext()
    const audioBuffer = audioQueue.shift()!
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.onended = () => {
      playNextChunk()
    }
    source.start()
  }

  try {
    await client.connect()
    await client.startConversation({
      userId: 'user-123',
      stageId: 'stage-456',
    })

    await client.sendTextInput('Tell me a story.')

    // Wait for audio playback to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isPlaying && audioQueue.length === 0) {
          clearInterval(checkInterval)
          resolve(undefined)
        }
      }, 500)
    })

    await client.endConversation()
    client.disconnect()
  } catch (error) {
    console.error('Error:', error)
    client.disconnect()
  }
}
