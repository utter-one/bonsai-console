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

Click on any conversation to see its full details.

### Messages

The complete transcript showing every message from the user and the AI, in order, with timestamps.

### Events

A detailed event log showing everything that happened during the conversation:

| Event | What It Records |
|---|---|
| **Conversation start** | When the conversation began and which stage it started in |
| **Message** | User and AI messages (with role, text, and any usage data) |
| **Classification** | What the classifier detected — which actions matched and what parameters were extracted |
| **Transformation** | What data the context transformers extracted |
| **Action** | Which actions were executed and their effects |
| **Tool call** | AI tool invocations with parameters, results, and success/error status |
| **Stage transition** | Navigation from one stage to another |
| **Command** | Client commands received (like button presses) |
| **Conversation end/abort/fail** | How and why the conversation concluded |

This event log is invaluable for debugging — if the AI did something unexpected, you can trace exactly what happened step by step.

### Variables

The conversation's variable state, organized by stage. Each stage maintains its own set of variables, so you can see what data was collected at each step.

### Artifacts

Binary data associated with the conversation:

| Artifact Type | Description |
|---|---|
| **User voice** | Audio recording of the user's speech |
| **User transcript** | Text transcription of the user's speech |
| **AI voice** | Audio of the AI's spoken response |
| **AI transcript** | Text of the AI's generated response |
| **Tool input/output** | Data sent to and received from tools |

Artifacts are stored based on the project's storage configuration. If no storage is set up, only inline data (like transcripts) is preserved.

## Lifecycle

A typical conversation follows this path:

1. **Start** — A client application connects and begins a conversation, specifying the user and starting stage.
2. **Input loop** — The user sends messages (voice or text), the system processes them and the AI responds.
3. **Stage navigation** — Actions move the conversation between stages based on what happens.
4. **End** — The conversation concludes via:
   - An `end_conversation` action effect (graceful ending).
   - An `abort_conversation` action effect (immediate termination).
   - The user disconnecting.
   - A system error.

Conversations can also be **resumed** — if a user disconnects and reconnects, the conversation picks up where it left off.

## Tips

- **Use events to debug** — When a conversation doesn't go as expected, the event log shows exactly what the classifier matched, which actions fired, and what effects ran.
- **Check classification events** — If the wrong action fires, look at the classification result to see why.
- **Monitor failure patterns** — If you see conversations frequently ending in "Failed" status, investigate the event logs for common error causes.
