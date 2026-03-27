# PlaygroundView — Split into focused panels

## Why

`PlaygroundView.vue` is ~1 870 lines and handles three distinct responsibilities in a
single component:

1. **Connection management** — WebSocket URL, API key selector, capability flags,
   connect/disconnect logic
2. **Audio I/O** — recording controls, playback controls, device selection, audio
   visualisation
3. **Event feed** — live event stream display, filtering, message rendering, tool call
   display, variable inspection

These three concerns have minimal coupling: the connection panel produces a connected
WebSocket client; the audio panel interacts with the client to send/receive audio; the
event feed purely consumes events. Splitting them reduces the main view to an
orchestration shell and makes each panel independently comprehensible.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/PlaygroundView.vue` |
| New component | `src/components/playground/PlaygroundConnectionPanel.vue` |
| New component | `src/components/playground/PlaygroundAudioPanel.vue` |
| New component | `src/components/playground/PlaygroundEventFeed.vue` |

## Panel responsibilities

### `PlaygroundConnectionPanel`

Owns:
- WebSocket URL input and connection state display
- API key selector
- Capability flag checkboxes (voice input enabled, voice output enabled, etc.)
- Connect / Disconnect button
- Connection status badge

Emits:
- `connect: (config: PlaygroundConnectionConfig) => void`
- `disconnect: () => void`

Receives:
- `isConnected: boolean`
- `isConnecting: boolean`
- `projects: ProjectResponse[]`
- `apiKeys: ApiKeyResponse[]`

### `PlaygroundAudioPanel`

Owns:
- Record button + recording level visualiser
- Playback controls (`AudioPlayer`)
- Send audio / cancel controls
- `AudioSettingsModal` trigger
- Mute / unmute toggle

Depends on:
- `useAudioRecording` composable (already exists)
- `useAudioPlayback` composable (already exists)
- Connection state (passed as prop to disable when not connected)

Emits:
- `send-audio: (blob: Blob) => void`

Receives:
- `isConnected: boolean`
- `playbackState: AudioPlaybackState`
- `playbackProgress: number`

### `PlaygroundEventFeed`

Owns:
- Event list with `ConversationEventCard` for each event
- Event type filter toolbar
- Auto-scroll toggle
- Clear events button
- Performance latency waterfall chart toggle

Receives:
- `events: NormalizedConversationEvent[]`
- `isConnected: boolean`

Emits:
- `clear: () => void`

## How the view looks after the split

```vue
<template>
  <div class="playground-layout">
    <PlaygroundConnectionPanel
      :is-connected="isConnected"
      :is-connecting="isConnecting"
      :projects="projectsStore.items"
      :api-keys="apiKeys"
      @connect="handleConnect"
      @disconnect="handleDisconnect"
    />

    <PlaygroundAudioPanel
      v-if="connectionConfig?.voiceEnabled"
      :is-connected="isConnected"
      :playback-state="playbackState"
      :playback-progress="playbackProgress"
      @send-audio="sendAudio"
    />

    <PlaygroundEventFeed
      :events="events"
      :is-connected="isConnected"
      @clear="clearEvents"
    />
  </div>
</template>
```

The view keeps:
- The `useWebSocketClient` composable instance
- Top-level `events` array ref
- `handleConnect` / `handleDisconnect` orchestration functions
- Routing / project selection sync

## Implementation steps

1. Create `src/components/playground/` directory.
2. Create `PlaygroundConnectionPanel.vue` — extract connection form and state display.
3. Create `PlaygroundAudioPanel.vue` — extract audio recording/playback section,
   reusing existing `useAudioRecording` and `useAudioPlayback` composables.
4. Create `PlaygroundEventFeed.vue` — extract event list, filtering toolbar, and
   clear functionality.
5. In `PlaygroundView.vue`, replace extracted sections with the three new components
   wired via props and emits.
6. Confirm that the WebSocket message handling (event routing to `events` array) stays
   in the view and is not spread across panels.

## Acceptance criteria

- Connect / disconnect flow works end-to-end.
- Audio recording and playback function correctly when connected.
- Events appear in real time in the feed.
- Clearing events works.
- `PlaygroundView.vue` is under 400 lines after the split.
- No TypeScript errors introduced.
