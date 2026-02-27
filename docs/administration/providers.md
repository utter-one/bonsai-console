# Providers

**Providers** are connections to external AI services that power the platform's features. They're shared across all projects — you set up a provider once, and any project can use it.

## Provider Types

Bonsai uses four types of external services:

### LLM — Language Models

These power the AI's "brain" — text generation, intent classification, data extraction, and tool execution.

| API Type | Examples |
|---|---|
| **OpenAI** | GPT-4o, GPT-4, GPT-4o-mini |
| **Anthropic** | Claude models |
| **Google Gemini** | Gemini models |

**Used by:** Stages (response generation), Classifiers (intent detection), Context Transformers (data extraction), Tools (function execution).

### TTS — Text-to-Speech

These convert the AI's text responses into spoken audio.

| API Type | Features |
|---|---|
| **ElevenLabs** | High-quality voices, multilingual, voice cloning |
| **OpenAI TTS** | Simple, fast, several voice options |
| **Azure Speech** | Wide language support, neural voices |
| **Deepgram** | Low-latency streaming voices |
| **Cartesia** | Low-latency, multilingual |

**Used by:** Personas (voice configuration).

### ASR — Automatic Speech Recognition

These convert user speech into text in real time.

| API Type | Features |
|---|---|
| **Azure Speech** | Wide language support, real-time streaming |
| **Deepgram** | High accuracy, real-time streaming |
| **ElevenLabs** | Speech recognition capabilities |
| **AssemblyAI** | Universal streaming transcription |
| **Speechmatics** | Real-time speech-to-text |

**Used by:** Projects (ASR configuration for voice input).

### Storage

These store conversation artifacts like audio recordings and transcripts.

| API Type | Description |
|---|---|
| **Amazon S3** | S3 or any S3-compatible storage |
| **Azure Blob** | Azure Blob Storage |
| **Google Cloud Storage** | GCS buckets |
| **Local** | Local filesystem (for development) |

**Used by:** Projects (storage configuration for conversation artifacts).

## Creating a Provider

Go to **Administration > Providers** and click **Create Provider**.

### Fields

- **Name** — A descriptive label (e.g., "OpenAI GPT-4o", "ElevenLabs Production").
- **Description** — Optional notes.
- **Provider Type** — Select the category: LLM, TTS, ASR, or Storage.
- **API Type** — Select the specific service (e.g., OpenAI, Anthropic).
- **Configuration** — Provider-specific connection settings (API key, base URL, etc.).
- **Tags** — Optional labels for organizing providers.

### Configuration

Each provider type requires specific settings. At minimum, most need:
- **API Key** — Your authentication credential for the service.
- **Base URL** (optional) — Override the default endpoint, useful for proxies or self-hosted instances.

The exact fields vary by provider — the form dynamically shows the relevant settings when you select the API type.

## Where Providers Are Used

| Resource | Provider Type |
|---|---|
| **Project** | ASR (speech input), Storage (artifacts) |
| **Persona** | TTS (voice output) |
| **Stage** | LLM (response generation) |
| **Classifier** | LLM (intent classification) |
| **Context Transformer** | LLM (data extraction) |
| **Tool** | LLM (function execution) |

### LLM Settings

When you reference an LLM provider (on a stage, classifier, transformer, or tool), you also configure **LLM settings** that control how the model behaves:

- **Model** — Which specific model to use (e.g., `gpt-4o`, `claude-3-sonnet`).
- **Temperature** — How creative/random the output is (0 = deterministic, 1 = creative).
- **Max Tokens** — Maximum length of the response.
- **Top P** — Nucleus sampling parameter.
- **Frequency/Presence Penalty** — Controls repetition.

These settings are configured where the provider is referenced (e.g., on the stage), not on the provider itself. This way, one provider can be used with different settings in different contexts.

## Security

Provider configurations contain sensitive data (API keys, connection strings). Only admins with the appropriate permissions can view or modify provider settings.

## Tips

- **Name providers descriptively** — Include the service and purpose: "OpenAI - GPT-4o Production" is better than "LLM Provider".
- **Have separate providers for different uses** — You might use GPT-4o for response generation but GPT-4o-mini for classification (faster and cheaper).
- **Manage API keys carefully** — Provider API keys give access to paid external services. Keep them secure and monitor usage.
- **Use tags** for organization — If you have many providers, tags help you find them quickly.
- **Test before going live** — Create a conversation in the Playground and verify the provider is working correctly before deploying to production.
