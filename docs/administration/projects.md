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

### Constants

The **Constants** tab lets you define project-wide key-value pairs available in all stage prompts and conversation logic via <span v-pre>`{{consts.key}}`</span>.

Each constant has a **key**, a **type**, and a **value**:

| Type | Description | Example value |
|---|---|---|
| `String` | Plain text | `Acme Corp` |
| `Number` | Integer or decimal | `42` |
| `Boolean` | `true` or `false` | `true` |
| `JSON` | Inline JSON object or array | `{"tier": "pro", "limit": 100}` |

**Example constants:**

| Key | Type | Value |
|---|---|---|
| `companyName` | String | `Acme Corp` |
| `supportHours` | String | `9am – 5pm EST` |
| `supportEmail` | String | `support@acme.com` |
| `maxRetries` | Number | `3` |
| `debugMode` | Boolean | `false` |

Use **Copy** to export all constants as JSON and **Paste** to import them from the clipboard. Pasting merges with existing constants — existing keys are updated, new keys are added.

### User Profile Variables

The **User Profile** tab defines the schema for custom data stored on each end user. Use this to declare what fields your conversations will read or write on user profiles.

#### Custom Fields

Click **Add Variable** to define additional fields. Each descriptor has:

| Property | Description |
|---|---|
| **Name** | Field name (e.g., `tier`, `accountId`, `preferences`) |
| **Type** | `string`, `number`, `boolean`, `object`, or array variants |
| **Object Schema** | For `object` types, define nested fields inline |

Custom fields are accessed in prompts and scripts exactly like built-in ones:

```handlebars
{{userProfile.tier}}
{{userProfile.preferences.language}}
```

The schema is informational — it documents the expected shape to the prompt editor (autocomplete) and your team. Values are set at runtime via `modify_user_profile` action effects or scripts.

Use **Copy** and **Paste** to transfer variable schemas between projects in JSON format.

## Child Resources

A project contains:
- [Stages](../design/stages) — Conversation phases
- [Agents](../design/agents) — AI personalities and voices
- [Classifiers](../design/classifiers) — Intent detection
- [Context Transformers](../design/context-transformers) — Data extraction
- [Tools](../design/tools) — AI-powered functions
- [Knowledge Base](../design/knowledge) — FAQ categories and items
- [Global Actions](../design/global-actions) — Shared action definitions
- [API Keys](./api-keys) — Client authentication credentials
- Conversations and Users (visible in the [Monitor](../monitor/) section)

## Tips

- **One bot = one project** — Keep each conversational experience in its own project.
- **Use constants generously** — Company name, support hours, URLs — anything repeated across prompts belongs in constants.
- **Define your user profile schema** — Declaring custom profile fields gives you autocomplete in the prompt editor and makes your data model explicit for the whole team.
- **Configure storage early** — If you want to keep audio recordings and transcripts, set up storage before going live.
- **Set a timezone** — This ensures the AI gives accurate date and time information in conversations.
