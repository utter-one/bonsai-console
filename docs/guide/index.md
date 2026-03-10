# What is Bonsai?

Bonsai is a platform for building conversational AI experiences — both voice and text. It lets you design AI-powered assistants that can talk to your customers, answer questions, collect information, and perform actions, all in real time.

**Bonsai Console** is the web-based control panel where you set everything up and keep an eye on how things are going.

## What Can You Do With It?

### Design Conversations

In the **Design** section you build the brain of your AI assistant:

- **Agents** — Give your AI a personality, tone of voice, and (optionally) a speaking voice.
- **Stages** — Map out the steps of a conversation, like "greeting", "collect info", "resolve issue".
- **Actions** — Define what happens when the user says something — navigate to a different stage, call an external service, set a variable, and more.
- **Classifiers** — Teach the system to understand what users mean and route them to the right action.
- **Context Transformers** — Automatically pull structured data (like names, order numbers, dates) out of what users say.
- **Knowledge Base** — Add FAQ-style content the AI can draw on to answer common questions accurately.
- **Tools** — Register callable AI functions for tasks like translation, summarization, or data lookup.
- **Global Actions** — Create reusable behaviors (like "cancel" or "help") that work the same way across multiple stages.
- **Guardrails** — Define project-wide safety rules that evaluate on every turn using a classifier, enforcing policies across all stages automatically.

### Monitor Activity

In the **Monitor** section you observe what's happening:

- **Conversations** — Browse live and historical conversations with full transcripts and event details.
- **Users** — View end-user profiles and their conversation history.
- **Issues** — Review automatically flagged conversations that may need attention.
- **Audit Logs** — See a complete record of every change made by operators in the console.

### Administer the Platform

In the **Administration** section you manage the infrastructure:

- **Projects** — Create and configure self-contained AI experiences.
- **Environments** — Manage deployment targets (development, staging, production).
- **Operators** — Add team members and control who can see and change what.
- **API Keys** — Issue credentials that client applications use to connect.
- **Providers** — Set up connections to AI services (language models, voice synthesis, speech recognition, storage).

## How a Conversation Works

When an end user connects and starts talking (or typing), here's what happens behind the scenes:

1. **Speech recognition** — If the user is speaking, their voice is transcribed to text in real time.
2. **Classification** — The system analyzes the text and figures out what the user wants (their _intent_).
3. **Data extraction** — Context transformers pull out any useful information (names, numbers, dates) and store it as variables.
4. **Action execution** — Matched actions run their effects: scripts execute, webhooks fire, variables update, the conversation may move to a new stage.
5. **Response generation** — The AI composes a reply using the stage's prompt, the agent's personality, conversation history, and any relevant knowledge.
6. **Voice synthesis** — If voice is enabled, the reply is converted to speech and streamed back.

All of this happens in real time, with text and audio delivered to the user as it's being generated.

## Next Steps

- [Quick Start](./getting-started) — Log in and set up your first project.
- [Core Concepts](./core-concepts) — Understand the building blocks.
- [Navigating the Console](./navigation) — Find your way around the interface.
