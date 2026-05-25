# Providers

**Providers** are connections to external AI services that power the platform's features. They're shared across all projects — you set up a provider once, and any project can use it.

## Provider Types

Bonsai uses four types of external services:

### LLM — Language Models

These power the AI's "brain" — text generation, intent classification, data extraction, and tool execution. The same providers can also be used for **Embeddings**.

| API Type | Provider | Notes |
|---|---|---|
| **OpenAI** | OpenAI | GPT-4o, GPT-4o-mini, o1, o3, etc. Native OpenAI integration. |
| **Anthropic** | Anthropic | Claude 3.5, Claude 3 Opus, Claude 4, etc. Native Anthropic integration. |
| **Google Gemini** | Google | Gemini 2.0, Gemini 2.5, Gemini 3, etc. Native Gemini integration. |
| **Mistral AI** | Mistral | Mistral Large, Small, Codestral, etc. |
| **Groq** | Groq | Ultra-fast inference for Llama, Mixtral, and other models. |
| **DeepSeek** | DeepSeek | DeepSeek-V3, DeepSeek-R1, etc. |
| **xAI (Grok)** | xAI | Grok models. |
| **OpenRouter** | OpenRouter | Unified gateway to hundreds of models from many providers. |
| **Together AI** | Together AI | Open-source and proprietary models. |
| **Fireworks AI** | Fireworks AI | Fast inference for open-source models. |
| **Perplexity AI** | Perplexity | Models with built-in web search. |
| **Cohere** | Cohere | Command R+ and other Cohere models. |
| **Ollama** | Ollama | Local model inference via Ollama. Dedicated configuration interface with built-in model catalog and connection settings. |
| **OpenAI-compatible** | Any | Generic OpenAI-compatible API endpoint. Use for self-hosted models (vLLM, LM Studio) or any provider not listed above. |

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

**Used by:** Agents (voice configuration).

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
| **Agent** | TTS (voice output) |
| **Stage** | LLM (response generation) |
| **Classifier** | LLM (intent classification) |
| **Context Transformer** | LLM (data extraction) |
| **Tool** | LLM (function execution) |

### LLM Settings

When you reference an LLM provider (on a stage, classifier, transformer, or tool), you also configure **LLM settings** that control how the model behaves:

- **Model** — Which specific model to use (e.g., `gpt-4o`, `claude-3-5-sonnet`). You can pick from the provider's catalog or enter a custom model name.
- **Max Tokens** — Maximum number of output tokens in the response.
- **Temperature** — How creative/random the output is (0 = deterministic, higher = more creative). Disabled when reasoning/thinking is active.
- **Top P** — Nucleus sampling threshold. Disabled (or limited) when reasoning/thinking is active.
- **Timeout** — Request timeout in milliseconds.

**Provider-specific reasoning/thinking settings:**

*OpenAI (o1, o3, and reasoning models):*
- **Reasoning Effort** — Controls the depth of internal reasoning (`low`, `medium`, `high`, `xhigh`). When set, temperature and Top P are disabled.
- **Reasoning Summary** — Optionally include a summary of the model's reasoning (`concise`, `detailed`, or `auto`).

*Anthropic (Claude extended thinking):*
- **Thinking Mode** — Enable Claude's extended thinking (`enabled` for a manual token budget, `adaptive` for Claude Opus 4.6+ which auto-adjusts). When active, temperature is disabled and Top P is limited to 0.95–1.0.
- **Thinking Budget Tokens** — Maximum tokens for internal reasoning when using `enabled` mode (minimum 1024).

*Google Gemini (thinking models):*
- **Thinking Level** — Predefined reasoning depth for Gemini 3 models (`minimal`, `low`, `medium`, `high`).
- **Thinking Budget** — Token budget for Gemini 2.5 models (`-1` for dynamic, `0` to disable, or a specific value from 128–32768).
- **Include Thoughts** — Attach thought summaries to the response for debugging.

These settings are configured where the provider is referenced (e.g., on the stage), not on the provider itself. This way, one provider can be used with different settings in different contexts.

## Security

Provider configurations contain sensitive data (API keys, tokens, connection strings). These fields are **encrypted at rest** — they are never stored in plain text.

When viewing an existing provider, sensitive fields are masked by default. Operators with the **super admin** role can reveal the current value of a masked field using the reveal button next to it.

## Channel Configurations

Beyond the core LLM/TTS/ASR/Storage providers, Bonsai supports **channel integrations** that allow your AI to communicate through external messaging and voice platforms. Each channel is configured as a separate provider entry with its own connection settings.

### Telegram

Connects your AI assistant to Telegram bots. Users can interact with the bot through direct messages or group chats.

| Field | Description |
|---|---|
| **Bot Token** | The token obtained from [@BotFather](https://t.me/BotFather) when creating a Telegram bot. |

### WhatsApp (Meta API)

Connects your AI assistant to WhatsApp via the Meta Cloud API. Users can send and receive messages through WhatsApp.

| Field | Description |
|---|---|
| **Phone Number ID** | Your Meta phone number ID from the Meta Developer Portal. |
| **WhatsApp Business Account ID** | Your WhatsApp Business Account ID. |
| **Access Token** | A temporary or permanent access token from the Meta Developer Portal. |
| **Webhook Verify Token** | A custom verify token used to validate incoming webhook requests from Meta. |

### Twilio Voice

Routes phone calls to your AI assistant using Twilio's voice API. Users call a phone number and interact with the AI through speech.

| Field | Description |
|---|---|
| **Account SID** | Your Twilio account SID. |
| **Auth Token** | Your Twilio auth token. |
| **From Number** | The Twilio phone number that will appear as the caller ID. |
| **Call Status Callback URL** — optional | A webhook URL for receiving call status updates (answered, completed, failed). |

### Twilio Messaging

Sends and receives SMS messages via Twilio. Users text a phone number and receive AI-generated responses.

| Field | Description |
|---|---|
| **Account SID** | Your Twilio account SID. |
| **Auth Token** | Your Twilio auth token. |
| **From Number** | The Twilio phone number that will appear as the sender. |

### Creating a Channel Provider

1. Go to **Administration > Providers** and click **Create Provider**.
2. Select the appropriate **Provider Type** (ASR or TTS channels may use existing providers; messaging channels are configured separately).
3. For channel-specific setup, navigate to the provider's configuration page from the providers list. Each channel type has its own dedicated configuration interface with the relevant fields described above.

### Tips

- **Test each channel thoroughly** — Messaging and voice channels involve external services with their own rate limits, costs, and failure modes.
- **Monitor channel health** — Use the [Analytics](../monitor/analytics) section to track usage and latency by source (voice vs. text).
- **Keep credentials secure** — Channel tokens and API keys are sensitive. Never share them publicly or commit them to version control.

## Tips

- **Name providers descriptively** — Include the service and purpose: "OpenAI - GPT-4o Production" is better than "LLM Provider".
- **Have separate providers for different uses** — You might use GPT-4o for response generation but GPT-4o-mini for classification (faster and cheaper).
- **Manage API keys carefully** — Provider API keys give access to paid external services. Keep them secure and monitor usage.
- **Use tags** for organization — If you have many providers, tags help you find them quickly.
- **Test before going live** — Create a conversation in the Playground and verify the provider is working correctly before deploying to production.
