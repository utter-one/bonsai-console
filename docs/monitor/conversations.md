# Conversations

The **Conversations** view lets you browse all conversations that have taken place (or are currently happening) across your projects.

## Conversation List

The main list shows conversations with their status and key details. Use search and filters to narrow results by project, status, date range, or user.

### Conversation States

Each conversation has a status that reflects where it is in its lifecycle:

| Status | Meaning |
|---|---|
| **Initialized** | Created but not yet started |
| **Awaiting user input** | Waiting for the user to speak or type |
| **Receiving user voice** | The user is actively streaming voice audio |
| **Processing user input** | The system is analyzing the message and running actions |
| **Generating response** | The AI is composing a reply |
| **Finished** | The conversation ended normally |
| **Aborted** | The conversation was terminated abruptly |
| **Failed** | The conversation ended due to an error |

## Conversation Details

Click on any conversation to open its detail view. The detail view has three tabs:

### Events Timeline

A chronological log of everything that happened during the conversation. Each event is displayed as a card color-coded by type:

| Event | Color | What It Records |
|---|---|---|
| **Message** | Blue | User and AI messages — the actual conversation transcript |
| **Classification** | Yellow | Which classifier ran, which actions matched, and extracted parameters |
| **Transformation** | Violet | Which context transformer ran and which fields it set |
| **Action** | Purple | Which action executed and its effects |
| **Command** | Indigo | Client commands received (e.g., button presses from the application) |
| **Tool Call** | Pink | AI tool invocations with parameters, result, and success/error status |
| **Conversation Start** | Green | When the conversation began and which stage it started in |
| **Conversation Resume** | Cyan | When a paused conversation was resumed |
| **Jump to Stage** | Teal | Navigation from one stage to another |
| **Moderation** | Amber | Moderation check result — whether the message passed or was blocked |
| **Conversation End** | Gray | Graceful end — how and why the conversation concluded |
| **Conversation Aborted** | Orange | Abrupt termination |
| **Conversation Failed** | Red | Fatal error |

Non-message events are indented slightly to visually separate them from the main conversation flow.

#### Event Card Buttons

Each event card may show action buttons in its top-right corner depending on what data is available:

| Button | When Visible | What It Opens |
|---|---|---|
| **View System Prompt** (document icon) | When a system prompt snapshot was captured | The full prompt the AI received when generating the response |
| **View Filler Prompt** (wand icon) | When a filler response was generated | The filler prompt instructions sent to the filler LLM |
| **View Raw Response** (scroll icon) | When a raw LLM response was captured | The unprocessed JSON response from the language model |
| **View Stage Variables** (braces icon) | When a variable snapshot is available | The state of all stage variables at that point in the conversation |
| **Create Issue** (bug icon) | Always (on non-archived conversations) | Opens the Issue creation form pre-filled with the conversation ID, event index, and stage — so you can file a bug report directly from the event that caused the problem |

The Create Issue button is especially useful for quality review — you can browse events, spot a problem, and create a linked issue without leaving the detail view.

### Performance

The **Performance** tab shows per-turn latency data for the conversation as a waterfall chart. Each turn is visualized as a horizontal bar broken into color-coded phases:

| Phase | Color | What It Measures |
|---|---|---|
| **ASR** | Blue | Speech-to-text transcription time |
| **Moderation** | Yellow | Content moderation check duration |
| **Processing** | Purple | Overall input processing (classification, transformers) |
| **Knowledge** | Teal | Knowledge base retrieval time |
| **Actions** | Orange | Time spent executing action effects |
| **Filler** | Gray | Filler response generation time |
| **LLM** | Green | Main language model response generation time |
| **TTS** | Pink | Text-to-speech synthesis time |

Below each bar, individual phase durations are listed alongside **TTFT** (time to first token) and, for voice turns, **First audio** (time until the first audio chunk was delivered).

### Metadata

Read-only system fields: conversation ID, project ID, user ID, starting stage ID, current stage ID, status, and timestamps.

## Lifecycle

A typical conversation follows this path:

1. **Start** — A client application connects and begins a conversation, specifying the user and starting stage.
2. **Input loop** — The user sends messages (voice or text), the system processes them and the AI responds.
3. **Stage navigation** — Actions move the conversation between stages based on what happens.
4. **End** — The conversation concludes via:
   - An **End Conversation** action effect (graceful ending — the AI may say goodbye first).
   - An **Abort Conversation** action effect (immediate termination with no AI response).
   - The user disconnecting.
   - A system error.

Conversations can also be **resumed** — if a user disconnects and reconnects, the conversation picks up where it left off. Conversations in **Awaiting user input** state have a **Resume** button in the detail view that opens them directly in the Playground.

## Tips

- **Use events to debug** — When a conversation doesn't go as expected, the event log shows exactly what the classifier matched, which actions fired, and what effects ran.
- **Check classification events** — If the wrong action fires, look at the classification result to see why.
- **Use Create Issue from event cards** — When you spot a problematic event, create the issue directly from that card. It pre-fills all the context so you don't have to copy IDs manually.
- **Monitor failure patterns** — If you see conversations frequently ending in "Failed" status, investigate the event logs for common error causes.
