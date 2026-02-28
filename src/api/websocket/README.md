# WebSocket Client for Nexus Conversations

This directory contains the WebSocket client implementation for real-time conversation management with the Nexus Backend.

## Files

- **`client.ts`** - Main WebSocket client implementation
- **`index.ts`** - Public exports
- **`example.ts`** - Usage examples
- **`WEBSOCKET.md`** - Complete API documentation
- **`contracts/`** - TypeScript types for all message formats (using Zod schemas)

## Quick Start

### Using the Client Directly

```typescript
import { NexusWebSocketClient, createWebSocketUrl } from '@/api/websocket'

// Create client
const wsUrl = createWebSocketUrl('http://localhost:3000')
const client = new NexusWebSocketClient({
  url: wsUrl,
  apiKey: 'your-api-key',
  debug: true,
  handlers: {
    onAiVoiceChunk: (message) => {
      console.log('Received audio chunk:', message.chunkId)
      // Play audio: atob(message.audioData)
    },
    onError: (error) => {
      console.error('Error:', error.error)
    }
  }
})

// Connect and authenticate
await client.connect()

// Start conversation
const conversationId = await client.startConversation({
  userId: 'user-123',
  stageId: 'stage-456',
  agentId: 'agent-789' // optional
})

// Send text input
await client.sendTextInput('Hello!')

// End conversation
await client.endConversation()

// Disconnect
client.disconnect()
```

### Using the Vue Composable

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useWebSocketClient } from '@/composables'

const {
  client,
  isConnected,
  isInConversation,
  error,
  connect,
  startConversation,
  sendTextInput,
  endConversation,
} = useWebSocketClient('your-api-key', {
  onAiVoiceChunk: (message) => {
    console.log('Received audio:', message.chunkId)
  }
})

onMounted(async () => {
  try {
    await connect()
    await startConversation({
      userId: 'user-123',
      stageId: 'stage-456'
    })
  } catch (err) {
    console.error('Failed to connect:', err)
  }
})

async function handleSendMessage(text: string) {
  try {
    await sendTextInput(text)
  } catch (err) {
    console.error('Failed to send:', err)
  }
}
</script>

<template>
  <div>
    <div v-if="isConnected">Connected ✓</div>
    <div v-if="isInConversation">In conversation</div>
    <div v-if="error">Error: {{ error.message }}</div>
    
    <input @keyup.enter="handleSendMessage($event.target.value)" />
  </div>
</template>
```

## Features

### ✅ Complete Message Type Coverage
- ✓ Authentication
- ✓ Conversation management (start, resume, end)
- ✓ Text input
- ✓ Voice input (start, stream chunks, end)
- ✓ AI voice output (streaming)
- ✓ Stage navigation
- ✓ Variable management (get, set, get all)
- ✓ Action execution

### ✅ TypeScript Support
- Full TypeScript types for all messages
- Zod schemas for runtime validation (in contracts/)
- Type-safe API methods
- Comprehensive JSDoc documentation

### ✅ Error Handling
- Request timeouts
- Automatic cleanup on disconnect
- Typed error messages
- Promise-based async/await API

### ✅ Event Handlers
- Server-initiated messages (AI voice, errors)
- Connection lifecycle events
- WebSocket error events

### ✅ Vue Integration
- `useWebSocketClient` composable
- Reactive state (isConnected, isInConversation, error)
- Automatic cleanup on component unmount

## API Overview

### Client Methods

#### Connection
- `connect()` - Connect and authenticate
- `disconnect()` - Close connection
- `isAuthenticated()` - Check authentication status
- `hasActiveConversation()` - Check conversation status

#### Conversation Management
- `startConversation(options)` - Start new conversation
- `resumeConversation(conversationId)` - Resume existing conversation
- `endConversation()` - End current conversation

#### User Input
- `sendTextInput(text)` - Send text message
- `startVoiceInput()` - Start voice input phase
- `sendVoiceChunk(audioData)` - Stream voice chunk
- `endVoiceInput()` - End voice input phase

#### Conversation Control
- `goToStage(stageId)` - Navigate to stage
- `setVariable(stageId, name, value)` - Set variable
- `getVariable(stageId, name)` - Get variable
- `getAllVariables(stageId)` - Get all variables
- `runAction(actionName, parameters)` - Execute action

### Event Handlers

```typescript
interface WebSocketEventHandlers {
  onAiOutputStart?: (message) => void
  onAiVoiceChunk?: (message) => void
  onAiOutputEnd?: (message) => void
  onError?: (message) => void
  onConnect?: () => void
  onDisconnect?: (event) => void
  onWebSocketError?: (event) => void
}
```

## Examples

See [`example.ts`](./example.ts) for complete examples:

1. **Basic text conversation** - Simple text-based interaction
2. **Voice conversation** - Streaming voice input
3. **Conversation control** - Stage navigation, variables, actions
4. **Resume conversation** - Continue existing conversation
5. **Error handling** - Reconnection logic
6. **Real-time audio playback** - Audio buffering and playback

## Message Types

All message types are defined in the `contracts/` directory:

- **`auth.ts`** - Authentication messages
- **`session.ts`** - Conversation lifecycle messages
- **`userInput.ts`** - User input messages (text & voice)
- **`aiResponse.ts`** - AI voice output messages
- **`command.ts`** - Conversation control commands
- **`common.ts`** - Base message schemas

Each file exports both Zod schemas and TypeScript types.

## Configuration

```typescript
interface WebSocketClientConfig {
  url: string                      // WebSocket URL (ws:// or wss://)
  apiKey: string                   // API key for authentication
  handlers?: WebSocketEventHandlers // Event handlers
  timeout?: number                 // Request timeout (default: 30000ms)
  debug?: boolean                  // Enable debug logging (default: false)
}
```

## Utilities

### `createWebSocketUrl(apiBaseUrl: string): string`

Converts HTTP API base URL to WebSocket URL:
- `http://` → `ws://`
- `https://` → `wss://`
- Appends `/ws` path

```typescript
createWebSocketUrl('http://localhost:3000')
// Returns: 'ws://localhost:3000/ws'

createWebSocketUrl('https://api.example.com')
// Returns: 'wss://api.example.com/ws'
```

## Testing

To test the WebSocket client:

1. Start the Nexus backend server
2. Ensure you have a valid API key
3. Run the examples:

```typescript
import { basicTextConversation } from '@/api/websocket/example'
await basicTextConversation()
```

Or use the client in your Vue components with the composable.

## Documentation

For complete API documentation, see [WEBSOCKET.md](./WEBSOCKET.md).
