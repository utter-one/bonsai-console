# Playground

The **Playground** is a built-in testing tool that lets you have live conversations with your AI directly inside the Console. Use it to try out your configuration, debug conversation flows, and verify that stages, actions, and tools work as expected — all before exposing anything to real users.

## Getting Started

To use the Playground you need two things:

1. **A selected project** — choose one from the project selector in the top navigation bar.
2. **An active API key** — the project must have at least one active API key. If there are none, the Playground will prompt you to create one under **Administration → API Keys**.

Once both are in place, you'll see the main Playground interface with a conversation area, input controls, and a toolbar.

## Conversation Modes

Before starting a conversation, pick how you want to communicate using the mode dropdown next to the **Start Conversation** button:

| Mode | What it does |
|------|-------------|
| **Text Only** | Type messages and read text responses — no audio involved. |
| **Voice Input + Text** | Speak to the AI using your microphone; responses come back as text. |
| **Text + Voice Output** | Type your messages; the AI responds with synthesised voice audio. |
| **Full Voice** | Complete voice conversation — speak and listen, like a phone call. |

Your selected mode is remembered per project, so you don't have to pick it every time.

## Starting and Ending Conversations

1. Click **Start Conversation**. A dialog will ask you to select a **starting stage** (the entry point for the conversation).
2. Once connected, a green indicator appears next to the title confirming the WebSocket connection is live.
3. Chat by typing in the message box (press **Ctrl + Enter** to send) or by using the **Speak** button for voice input.
4. When you're done, click **End Conversation** to disconnect cleanly.

## Toolbar Controls

While a conversation is running, the toolbar gives you several debugging shortcuts:

| Button | Purpose |
|--------|---------|
| **Run Action** | Manually trigger any global action or an action defined on the current stage. Useful for testing actions without waiting for the classifier to match them. |
| **Jump to Stage** | Instantly move the conversation to a different stage, skipping the normal flow. Great for testing a specific part of the conversation tree. |
| **Call Tool** | Execute a tool directly and see its result. Helpful for verifying that external integrations (APIs, databases) return the expected data. |
| **Set Variable** | Create or update a stage variable on the fly. Use this to simulate conditions like "the customer already provided their order ID". |

## Conversation History

The main panel shows everything that happens during the conversation in real time:

- **User messages** (blue) — what you said or typed.
- **AI messages** (green) — the AI's responses, including real-time streaming indicators.
- **System events** (grey, indented) — behind-the-scenes events like classifications, context transformations, action executions, stage transitions, and tool calls. Toggle their visibility with the **Show system events** checkbox.
- **Conversation events** — higher-level lifecycle events. Toggle with **Show conversation events**.

Each event card may include extra inspection buttons:

- **View system prompt** (document icon) — see the exact prompt that was sent to the language model for that turn.
- **View stage variables** (braces icon) — inspect the current variable state at that point in the conversation.

## Voice & Audio Settings

When using a voice mode, click the **gear icon** next to the Speak button to configure:

- **Microphone** — select which input device to use.
- **Echo cancellation** — reduces feedback when the AI's audio plays through speakers.
- **Noise suppression** — filters out background noise from your microphone.
- **Auto gain control** — automatically adjusts microphone volume.

These settings are saved in your browser and persist across sessions.

## API Key & Timezone Selection

- **API Key** — choose which of the project's active API keys to use for the session. Different keys may have different permissions or rate limits.
- **Timezone** — optionally override the project's default timezone for the conversation. This affects any time-based logic in your stages or prompts.

Both selections are also remembered per project.

## Tips

- **Iterate quickly** — change a persona prompt or stage configuration in the Design section, then switch back to the Playground and start a new conversation to see the effect immediately.
- **Use "Jump to Stage"** to skip straight to a tricky part of the flow you're working on, instead of chatting through the whole conversation tree each time.
- **Set variables** before a conversation reaches a point that depends on them — this lets you test branches without building the entire preceding flow.
- **Watch system events** to understand exactly what the AI is doing: which classifier matched, which actions fired, which stage it transitioned to, and what the rendered prompt looked like.
