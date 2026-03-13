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
- **Context Transformers** — Process each conversation turn using an LLM: extract structured data, inject whispers into the user's message, or generate prompt additions to steer the conversation.
- **Global Actions** — Create reusable behaviors (like "cancel" or "help") that work the same way across multiple stages.
- **Guardrails** — Define project-wide safety rules that evaluate on every turn using a classifier, enforcing policies across all stages automatically.
- **Tools** — Register callable AI functions for tasks like translation, summarization, or data lookup.
- **Knowledge Base** — Add FAQ-style content the AI can draw on to answer common questions accurately.
- **Global Memory** — Define project constants (shared values available in all prompts) and the user profile schema (custom fields stored per end user).

### Monitor Activity

In the **Monitor** section you observe what's happening:

- **Conversations** — Browse live and historical conversations with full transcripts and event details.
- **Users** — View end-user profiles and their conversation history.
- **Issues** — Review automatically flagged conversations that may need attention.
- **Analytics** — Track conversation volume, latency, and performance metrics over time.
- **Audit Logs** — See a complete record of every change made by operators in the console.

### Administer the Platform

In the **Administration** section you manage the infrastructure:

- **Projects** — Create and configure self-contained AI experiences.
- **Environments** — Connect to other Bonsai instances to pull data from (e.g., syncing configuration across setups).
- **Operators** — Add team members and control who can see and change what.
- **API Keys** — Issue credentials that client applications use to connect.
- **Providers** — Set up connections to AI services (language models, voice synthesis, speech recognition, storage).

## How a Conversation Works

When an end user connects and starts talking (or typing), here's what happens behind the scenes:

1. **Speech recognition** — If the user is speaking, their voice is transcribed to text in real time.
2. **Moderation** — If moderation is enabled, the message is checked against configured content categories before anything else runs.
3. **Classification + transformation** — The stage classifier figures out what the user wants (their _intent_), while context transformers run in parallel: extracting structured data, injecting whispers into the user message, or adding context to the prompt.
4. **Guardrail evaluation** — Project-wide safety rules are evaluated using a dedicated classifier. If a rule matches, its effects fire instead of (or in addition to) the normal action.
5. **Action execution** — Matched actions run their effects: scripts execute, webhooks fire, variables update, the conversation may move to a new stage.
6. **Response generation** — The AI composes a reply using the stage's prompt, the agent's personality, conversation history, and any relevant knowledge.
7. **Voice synthesis** — If voice is enabled, the reply is converted to speech and streamed back.

All of this happens in real time, with text and audio delivered to the user as it's being generated.

## Next Steps

- [Quick Start](./getting-started) — Log in and set up your first project.
- [Core Concepts](./core-concepts) — Understand the building blocks.
- [Navigating the Console](./navigation) — Find your way around the interface.
