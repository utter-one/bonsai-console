# Projects

A **project** is the top-level container in Bonsai. It represents one complete conversational AI experience — everything from the stages and agents to the conversations and users lives inside a project.

## Creating a Project

Go to **Administration > Projects** and click **Create Project**.

### Basic Settings

- **Name** — A human-readable name (e.g., "Customer Support Bot", "Sales Assistant").
- **Description** — Optional notes about the project's purpose.

### Voice Settings

| Setting | Description |
|---|---|
| **Accept Voice** | Whether the project accepts voice input from users |
| **Generate Voice** | Whether the project generates spoken audio output (TTS) |

If voice is enabled, you'll also need to configure:

### ASR Configuration (Speech-to-Text)

Controls how user speech is transcribed:

- **ASR Provider** — Select a registered speech recognition provider (set up in [Providers](./providers)).
- **Unintelligible Placeholder** — Text used when speech can't be transcribed (default: `[unintelligible]`).
- **Voice Activity Detection** — Automatically detect when the user starts and stops speaking.

### Storage Configuration

Controls where conversation artifacts (audio recordings, transcripts, images) are saved:

- **Storage Provider** — Select a registered storage provider (S3, Azure Blob, Google Cloud Storage, etc.).

If no storage is configured, only inline data is preserved.

### Timezone

Set a project-wide default timezone (IANA format, e.g., `Europe/Warsaw`, `America/New_York`). This is used in prompt templates via the `time` context and can be overridden per-conversation or per-user.

::: tip Constants, Memory, and Moderation
Project-level constants, user-profile memory schema, and moderation settings are configured in the **Design** section — see [Global Memory](../design/global-memory) and [Moderation](../design/moderation) in the Design sidebar. This keeps all conversation-design configuration in one place.
:::

## Child Resources

A project contains:
- [Stages](../design/stages) — Conversation phases
- [Agents](../design/agents) — AI personalities and voices
- [Classifiers](../design/classifiers) — Intent detection
- [Context Transformers](../design/context-transformers) — Data extraction
- [Tools](../design/tools) — AI-powered functions
- [Knowledge Base](../design/knowledge) — FAQ categories and items
- [Global Actions](../design/global-actions) — Shared action definitions
- [Guardrails](../design/guardrails) — Project-wide safety rules
- [Global Memory](../design/global-memory) — User profile schema and project constants
- [Moderation](../design/moderation) — Content moderation configuration
- [API Keys](./api-keys) — Client authentication credentials
- Conversations and Users (visible in the [Monitor](../monitor/) section)

## Tips

- **One bot = one project** — Keep each conversational experience in its own project.
- **Configure storage early** — If you want to keep audio recordings and transcripts, set up storage before going live.
- **Set a timezone** — This ensures the AI gives accurate date and time information in conversations.
