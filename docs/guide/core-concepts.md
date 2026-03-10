# Core Concepts

This page explains the building blocks of Bonsai and how they fit together. Understanding these concepts will help you design better conversational experiences.

## Projects — The Top Level

A **project** is the container for everything. It represents one complete conversational AI experience. All the design resources (stages, agents, classifiers, etc.) live inside a project, and all conversations happen within a project.

Think of a project as "the bot" — if you have a customer service bot and a sales bot, those would be two separate projects.

## Stages — Conversation Steps

**Stages** are the heart of conversation design. Each stage represents a distinct phase in the conversation, like:

- A **greeting** stage where the AI introduces itself
- A **collect information** stage where the AI asks for the user's details
- A **troubleshooting** stage that walks the user through fixing a problem
- A **farewell** stage that wraps things up

Each stage has its own:
- **Prompt** — Instructions that tell the AI what to do and how to behave at this point
- **Agent** — Which personality and voice to use
- **Actions** — What the AI can do when triggered by user input
- **Variables** — Data being tracked at this step

Conversations move between stages through actions (specifically, the "go to stage" effect).

## Agents — Personality & Voice

A **agent** defines _who_ the AI is in the conversation. It includes:

- A **personality prompt** that describes tone, style, and behavioral rules (e.g., "Be friendly and professional, avoid jargon")
- **Voice settings** (optional) that control which synthetic voice is used for spoken output

You can have multiple agents in a project (e.g., a casual helper and a formal escalation agent) and assign different agents to different stages.

## Actions & Effects — Making Things Happen

**Actions** are how the AI does more than just talk. An action is triggered when a user says something that matches it (via a classifier), or by other events. Each action contains a list of **effects** — the actual things that happen:

| Effect | What It Does |
|---|---|
| **Go to stage** | Move the conversation to a different stage |
| **Run script** | Execute custom logic (JavaScript) |
| **Modify variables** | Set, reset, or update conversation data |
| **Call webhook** | Send a request to an external API |
| **Call tool** | Invoke an AI-powered tool (translation, lookup, etc.) |
| **Generate response** | Produce an AI reply (or a fixed, pre-written message) |
| **Modify user input** | Change what the AI "sees" as the user's message |
| **Modify user profile** | Update the end user's stored profile data |
| **End conversation** | Gracefully close the conversation |
| **Abort conversation** | Immediately terminate the conversation |

Effects run in order within an action. You can chain them — for example: _call a webhook to check an order status → store the result in a variable → generate a response that includes the status._

## Classifiers — Understanding Intent

A **classifier** is an AI-powered component that looks at what the user said and decides which action (if any) should be triggered. Behind the scenes, it sends the user's message plus a list of available actions to a language model, which picks the best match.

Each stage has a default classifier. You can also create specialized classifiers for specific actions.

## Context Transformers — Extracting Data

**Context transformers** automatically extract structured information from the conversation. For example, if a user says _"My name is Sarah and my order number is 12345"_, a transformer can pull out:

- `customerName` → "Sarah"
- `orderNumber` → "12345"

This data is stored in the stage's variables and can be used in prompts, conditions, and scripts.

## Knowledge Base — FAQ Content

The **knowledge base** stores question-and-answer pairs organized into categories. When knowledge is enabled on a stage, the AI can draw on this content to give accurate, consistent answers to common questions — without you having to write specific actions for each one.

## Tools — AI-Powered Functions

**Tools** are callable AI functions that process input using a language model. They're useful for things like translation, summarization, or image analysis. Tools are invoked through action effects or directly by client applications.

## Global Actions — Shared Behaviors

**Global actions** are actions defined once at the project level and shared across multiple stages. They're perfect for behaviors that should work the same way everywhere, like:
- "I need help" → Escalate to a human
- "Cancel" → End the conversation
- "Switch to Spanish" → Change the language

There are also **special actions** (like **Moderation Blocked**) that are triggered automatically by the system. You configure their effects but not their triggers.

## Global Constants — Project-Wide Values

**Global constants** are key-value pairs defined at the project level and available in all prompts via <span v-pre>`{{constants.key}}`</span>. Use them for values that don't change per conversation — company name, support hours, policy limits, plan pricing.

Constants support String, Number, Boolean, and JSON types. Manage them in **Design > Global Memory > Constants** tab.

## Global Memory — User Profile Schema

**Global memory** defines the schema for custom fields stored on each end user's profile. Declaring fields here (with their types) enables autocomplete in the prompt editor and documents your data model for the team.

Custom profile fields are accessed in prompts as <span v-pre>`{{userProfile.fieldName}}`</span> and set at runtime via `modify_user_profile` effects or scripts. Manage the schema in **Design > Global Memory > User Profile** tab.

## Moderation — Content Safety

**Moderation** lets you enable automatic content safety checks on user messages. When enabled, each user message is evaluated by a moderation model and flagged if it matches any blocked category.

Configure moderation in **Design > Moderation** by selecting an LLM provider (OpenAI or Mistral) and choosing which categories to block. To control what happens when a message is blocked, set up the **Moderation Blocked** special action in **Design > Global Actions**.

## Providers — External AI Services

**Providers** are connections to external services that power the AI features:

| Type | Purpose | Examples |
|---|---|---|
| **LLM** | Text generation, classification, extraction | OpenAI, Anthropic, Google Gemini |
| **TTS** | Converting text to speech | ElevenLabs, OpenAI TTS, Azure, Deepgram, Cartesia |
| **ASR** | Converting speech to text | Azure, Deepgram, ElevenLabs, AssemblyAI, Speechmatics |
| **Storage** | Saving conversation recordings and files | Amazon S3, Azure Blob, Google Cloud Storage |

Providers are shared across all projects, so you only need to set up your API key once.

## How It All Fits Together

```
Project
├── Stages (conversation steps)
│   ├── Agent (personality + voice)
│   ├── LLM Provider (for generating AI responses)
│   ├── Classifier (for understanding user intent)
│   ├── Context Transformers (for extracting data)
│   ├── Actions → Effects (behaviors)
│   ├── Variables (data tracked in this step)
│   ├── Global Actions (shared behaviors)
│   └── Knowledge tags (FAQ content to include)
│
├── Agents (reusable across stages)
├── Classifiers (reusable across stages)
├── Context Transformers (reusable across stages)
├── Tools (AI-powered functions)
├── Knowledge Categories → Items (FAQ)
├── Global Actions (shared actions)
├── Global Constants (project-wide values)
├── Global Memory (user profile schema)
├── Moderation (content safety)
└── API Keys (for client apps to connect)
```

## Optimistic Locking

When multiple people are editing the same project in the console, Bonsai uses **version numbers** to prevent accidental overwrites. Every time you save a change, the version number increases. If someone else saved a change while you were editing, you'll be notified so you can refresh and try again.

## Next Steps

- [Navigating the Console](./navigation) — Learn your way around the interface.
- [Design Overview](../design/) — Start building your conversation.
