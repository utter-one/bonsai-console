/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Tool execution type: smart_function (LLM-based), webhook (HTTP call), script (JavaScript) */
export enum ToolType {
  SmartFunction = "smart_function",
  Webhook = "webhook",
  Script = "script",
}

export type UpdateToolRequest =
  | ({
      type: "smart_function";
    } & UpdateSmartFunctionTool)
  | ({
      type: "webhook";
    } & UpdateWebhookTool)
  | ({
      type: "script";
    } & UpdateScriptTool);

export type CreateToolRequest =
  | ({
      type: "smart_function";
    } & CreateSmartFunctionTool)
  | ({
      type: "webhook";
    } & CreateWebhookTool)
  | ({
      type: "script";
    } & CreateScriptTool);

export type Effect =
  | ({
      type: "end_conversation";
    } & EndConversationEffect)
  | ({
      type: "abort_conversation";
    } & AbortConversationEffect)
  | ({
      type: "go_to_stage";
    } & GoToStageEffect)
  | ({
      type: "modify_user_input";
    } & ModifyUserInputEffect)
  | ({
      type: "modify_variables";
    } & ModifyVariablesEffect)
  | ({
      type: "modify_user_profile";
    } & ModifyUserProfileEffect)
  | ({
      type: "call_tool";
    } & CallToolEffect)
  | ({
      type: "generate_response";
    } & GenerateResponseEffect)
  | ({
      type: "change_visibility";
    } & ChangeVisibilityEffect)
  | ({
      type: "ban_user";
    } & BanUserEffect);

/** List query parameters for filtering, sorting, pagination, and search */
export interface ListParams {
  /**
   * Starting index for pagination (default: 0)
   * @min 0
   * @default 0
   */
  offset?: number | null;
  /**
   * Maximum number of items to return. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   */
  limit?: number | null;
  /** Full-text search query string (optional) */
  textSearch?: string | null;
  /** Field(s) to sort by. Use "-" prefix for descending order (e.g., "-createdAt") */
  orderBy?: string | string[];
  /** Field(s) to group results by (optional) */
  groupBy?: string | string[];
  /** Dynamic field filters as key-value pairs. Use bracket notation in query string (e.g., filters[projectId]=value, filters[name][op]=like&filters[name][value]=test). Values can be direct values, arrays (for IN), or operation objects */
  filters?: Record<
    string,
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | ListFilterOperation
  >;
}

/** Filter operation with explicit operator and value */
export interface ListFilterOperation {
  /** Filter operator: eq (equals), ne (not equals), gt (greater than), gte (>=), lt (less than), lte (<=), like (pattern match), in (value in array), nin (not in array), between (range) */
  op:
    | "like"
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "between";
  /** Filter value to compare against. For "in", "nin", and "between" operations, use an array */
  value: string | number | boolean | string[] | number[] | boolean[];
}

export interface ArchiveProject {
  /** The current version number for optimistic locking */
  version: number;
}

export interface ListProjectsQuery {
  /**
   * Starting index for pagination (default: 0)
   * @min 0
   * @default 0
   */
  offset?: number | null;
  /**
   * Maximum number of items to return. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   */
  limit?: number | null;
  /** Full-text search query string (optional) */
  textSearch?: string | null;
  /** Field(s) to sort by. Use "-" prefix for descending order (e.g., "-createdAt") */
  orderBy?: string | string[];
  /** Field(s) to group results by (optional) */
  groupBy?: string | string[];
  /** Dynamic field filters as key-value pairs. Use bracket notation in query string (e.g., filters[projectId]=value, filters[name][op]=like&filters[name][value]=test). Values can be direct values, arrays (for IN), or operation objects */
  filters?: Record<
    string,
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | ListFilterOperation
  >;
  /** When true, returns only archived projects. When omitted or false, returns only active (non-archived) projects. */
  archived?: "true" | "false";
}

export interface OpenAILlmSettings {
  /**
   * Model name (e.g., gpt-4, gpt-3.5-turbo, gpt-5, o1)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum output tokens for generation (includes reasoning and output tokens for reasoning models)
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2). Not used with reasoning models - use reasoningEffort instead.
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1). Not used with reasoning models - use reasoningEffort instead.
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /** Reasoning effort for reasoning models (gpt-5, o-series). Controls how many reasoning tokens to generate. low=fast/economical, high=more complete reasoning. Default: medium. gpt-5.1 defaults to none. */
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  /** Generate a summary of reasoning performed by the model. Useful for debugging. Only for reasoning models. */
  reasoningSummary?: "auto" | "concise" | "detailed";
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface OpenAILegacyLlmSettings {
  /**
   * Model name (e.g., gpt-4, gpt-3.5-turbo, gpt-4-turbo)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface AnthropicLlmSettings {
  /**
   * Model name (e.g., claude-sonnet-4-5, claude-opus-4-5, claude-haiku-4-5)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation (includes thinking tokens when extended thinking is enabled)
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-1). Not compatible with extended thinking.
   * @min 0
   * @max 1
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1). Limited to 0.95-1 when thinking is enabled.
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /** Enable extended thinking. Use "adaptive" for Claude Opus 4.6+, "enabled" for earlier models. Allows Claude to reason internally before responding. */
  thinkingMode?: "enabled" | "adaptive";
  /**
   * Maximum tokens for internal reasoning (min: 1024). Only used with thinkingMode="enabled". Higher budgets enable deeper reasoning but increase latency.
   * @min 1024
   */
  thinkingBudgetTokens?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
  /** Anthropic API version */
  anthropicVersion?: string;
}

export interface GeminiLlmSettings {
  /**
   * Model name (e.g., gemini-2.5-flash, gemini-2.5-pro, gemini-3-flash, gemini-3-pro)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation (includes thinking tokens for thinking models)
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Default top-k for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultTopK?: number;
  /** Thinking level for Gemini 3 models. Controls reasoning depth: minimal=chat/high-throughput, low=simple tasks, medium=balanced, high=max reasoning depth. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  /** Thinking budget (tokens) for Gemini 2.5 models. Set to -1 for dynamic thinking (default), 0 to disable, or specific token count (128-32768). Use thinkingLevel for Gemini 3. */
  thinkingBudget?: number;
  /** Include thought summaries in response. Provides insight into model's reasoning process for debugging. Available for all thinking models. */
  includeThoughts?: boolean;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
  /** Safety settings configuration */
  safetySettings?: any[];
}

export interface GroqLlmSettings {
  /**
   * Model name (e.g., llama-3.3-70b-versatile, openai/gpt-oss-120b)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface MistralLlmSettings {
  /**
   * Model name (e.g., mistral-large-latest, mistral-small-latest)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface DeepSeekLlmSettings {
  /**
   * Model name (e.g., deepseek-chat, deepseek-reasoner)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface OpenRouterLlmSettings {
  /**
   * Model name in OpenRouter format (e.g., openai/gpt-4o, anthropic/claude-3-5-sonnet, meta-llama/llama-3.3-70b-instruct)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface TogetherAILlmSettings {
  /**
   * Model name (e.g., meta-llama/Llama-3.3-70B-Instruct-Turbo, mistralai/Mixtral-8x22B-Instruct-v0.1)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface FireworksAILlmSettings {
  /**
   * Model name in Fireworks format (e.g., accounts/fireworks/models/llama-v3p3-70b-instruct)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface PerplexityLlmSettings {
  /**
   * Model name (e.g., sonar-pro, sonar, sonar-reasoning-pro)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface CohereLlmSettings {
  /**
   * Model name (e.g., command-a-03-2025, command-r-plus-08-2024)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

export interface XAILlmSettings {
  /**
   * Model name (e.g., grok-3, grok-3-fast, grok-3-mini)
   * @minLength 1
   */
  model: string;
  /**
   * Default maximum tokens for generation
   * @min 0
   * @exclusiveMin true
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for generation (0-2)
   * @min 0
   * @max 2
   */
  defaultTemperature?: number;
  /**
   * Default top-p for generation (0-1)
   * @min 0
   * @max 1
   */
  defaultTopP?: number;
  /**
   * Request timeout in milliseconds
   * @min 0
   * @exclusiveMin true
   */
  timeout?: number;
}

/** LLM provider-specific settings for this stage */
export type LlmSettings =
  | OpenAILlmSettings
  | OpenAILegacyLlmSettings
  | AnthropicLlmSettings
  | GeminiLlmSettings;

export interface ElevenLabsTtsSettings {
  /** TTS provider type identifier */
  provider: "elevenlabs";
  /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
  model?: string;
  /** Voice UUID to use for speech synthesis */
  voiceId?: string;
  /** Preferred audio output format for synthesized speech */
  audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100";
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
  /**
   * Voice stability setting (0.0-1.0), defaults to 0.5
   * @min 0
   * @max 1
   */
  stability?: number | null;
  /**
   * Similarity boost setting (0.0-1.0), defaults to 0.75
   * @min 0
   * @max 1
   */
  similarityBoost?: number | null;
  /**
   * Style setting for V2+ models (0.0-1.0), defaults to 0
   * @min 0
   * @max 1
   */
  style?: number | null;
  /** Enable speaker boost for V2+ models, defaults to true */
  useSpeakerBoost?: boolean | null;
  /**
   * Speech speed (0.7-1.2), defaults to 1.0
   * @min 0.7
   * @max 1.2
   */
  speed?: number | null;
  /** Use global preview endpoint for geographic proximity optimization */
  useGlobalPreview?: boolean;
  /**
   * WebSocket inactivity timeout in seconds, defaults to 180
   * @min 0
   * @exclusiveMin true
   */
  inactivityTimeout?: number;
  /** Whether to use sentence splitter for text processing, defaults to true */
  useSentenceSplitter?: boolean;
}

export interface OpenAiTtsSettings {
  /** TTS provider type identifier */
  provider: "openai";
  /** Model ID to use for speech synthesis: "gpt-4o-mini-tts" (promptable), "tts-1" (low latency), or "tts-1-hd" (high quality) */
  model?: string;
  /** Voice ID to use (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar) */
  voiceId?: string;
  /** Preferred audio output format for synthesized speech */
  audioFormat?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm_24000";
  /**
   * Speech speed (0.25-4.0), defaults to 1.0
   * @min 0.25
   * @max 4
   */
  speed?: number;
  /** Voice control instructions for gpt-4o-mini-tts model. Controls accent, tone, emotion, speed, whispering, etc. Only supported by gpt-4o-mini-tts model */
  instructions?: string;
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
  /** Whether to use sentence splitter for text processing, defaults to true */
  useSentenceSplitter?: boolean;
}

export interface DeepgramTtsSettings {
  /** TTS provider type identifier */
  provider: "deepgram";
  /** Model version to use ("aura-1" or "aura-2") */
  model?: "aura-1" | "aura-2";
  /** Voice ID to use for speech synthesis (e.g., "thalia-en", "andromeda-en"). Combined with model to form full model string (e.g., "aura-2-thalia-en") */
  voiceId?: string;
  /** Preferred audio output format. Defaults to "pcm_16000" */
  audioFormat?:
    | "pcm_8000"
    | "pcm_16000"
    | "pcm_24000"
    | "pcm_48000"
    | "mulaw"
    | "alaw";
  /**
   * Sample rate for audio output in Hz (e.g., 8000, 16000, 24000, 48000). Availability depends on audio format
   * @min 0
   * @exclusiveMin true
   */
  sampleRate?: number;
  /**
   * Bit rate for audio output (e.g., 32000, 64000, 128000). Applies to certain formats like mp3, opus, aac
   * @min 0
   * @exclusiveMin true
   */
  bitRate?: number;
  /** Audio container format. Use "none" for raw audio, "wav" for WAV container, "ogg" for Ogg container */
  container?: "none" | "wav" | "ogg";
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
  /** Whether to use sentence splitter for text processing, defaults to true */
  useSentenceSplitter?: boolean;
}

export interface CartesiaTtsSettings {
  /** TTS provider type identifier */
  provider: "cartesia";
  /** Model ID to use for speech synthesis (e.g., "sonic-3", "sonic-3-latest", "sonic-3-2026-01-12"). Defaults to "sonic-3-latest" */
  model?: string;
  /** Voice ID to use for speech synthesis (e.g., "f786b574-daa5-4673-aa0c-cbe3e8534c02" for Katie). See Cartesia voice catalog */
  voiceId?: string;
  /** Language code for speech synthesis (e.g., "en", "es", "fr"). Sonic-3 supports 42 languages */
  language?: string;
  /** Preferred audio output format for synthesized speech. Defaults to "pcm_24000" */
  audioFormat?:
    | "pcm_16000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100"
    | "pcm_48000"
    | "mulaw"
    | "alaw";
  /** Speech speed control. Defaults to "normal" */
  speed?: "slowest" | "slow" | "normal" | "fast" | "fastest";
  /** Emotion tags for expressive speech (e.g., ["positivity:high", "curiosity"]). See Cartesia emotion documentation */
  emotion?: string[];
  /**
   * Maximum time in milliseconds to buffer text chunks before sending to TTS (0-5000ms). Defaults to 3000ms. Set to 0 to disable buffering
   * @min 0
   * @max 5000
   */
  maxBufferDelayMs?: number;
  /** Whether to use sentence splitter for text processing. Defaults to false (uses streaming with continuations instead) */
  useSentenceSplitter?: boolean;
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
}

export interface AzureTtsSettings {
  /** TTS provider type identifier */
  provider: "azure";
  /** Azure TTS model to use. Currently only "neural" is supported for high-quality neural text-to-speech */
  model?: "neural";
  /** Voice name to use for speech synthesis (e.g., "en-US-AriaNeural", "en-US-GuyNeural") */
  voiceId?: string;
  /** Preferred audio output format for synthesized speech. Defaults to "pcm_24000" */
  audioFormat?:
    | "pcm_16000"
    | "pcm_24000"
    | "pcm_48000"
    | "opus"
    | "mp3"
    | "mulaw"
    | "alaw";
  /** Speaking style for voices that support it (e.g., "cheerful", "sad", "angry", "friendly") */
  style?: string;
  /** Speaking rate adjustment (e.g., "+10%", "-5%", "1.2"). Range: 0.5 to 2.0 or percentage */
  rate?: string;
  /** Pitch adjustment (e.g., "+5%", "-10%", "high", "low"). Range typically -50% to +50% */
  pitch?: string;
  /** Whether to use sentence splitter for text processing. Defaults to true */
  useSentenceSplitter?: boolean;
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
}

export interface AmazonPollyTtsSettings {
  /** TTS provider type identifier */
  provider: "amazon-polly";
  /** Voice ID to use for speech synthesis (e.g., "Joanna", "Matthew", "Amy"). Defaults to "Joanna" */
  voiceId?: string;
  /** Polly engine to use. "neural" provides higher quality, "long-form" supports longer texts, "generative" provides most natural speech. Defaults to "neural" */
  engine?: "standard" | "neural" | "long-form" | "generative";
  /** BCP-47 language code (e.g., "en-US", "en-GB", "es-ES"). By default inferred from the selected voice */
  languageCode?: string;
  /** Preferred audio output format. "mp3" for compressed audio, "pcm_8000" or "pcm_16000" for raw PCM. Defaults to "pcm_16000" */
  audioFormat?: "mp3" | "pcm_8000" | "pcm_16000";
  /** Whether to split text into sentences and synthesize each individually. Defaults to false (full text is synthesized when end() is called) */
  useSentenceSplitter?: boolean;
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
}

export interface ServerVadConfig {
  /**
   * VAD aggressiveness level (0–3). Higher values are more aggressive at filtering non-speech. Default: 2.
   * @min 0
   * @max 3
   */
  mode?: number;
  /** Duration of each VAD processing frame in milliseconds. Must be 10, 20, or 30. Default: 20. */
  frameDurationMs?: 10 | 20 | 30;
  /**
   * Amount of silence (in ms) to prepend before the detected speech start as a pre-roll buffer. Default: 300.
   * @min 0
   * @max 1000
   */
  silencePaddingMs?: number;
  /**
   * Duration of silence (in ms) after speech that triggers end-of-utterance detection. Default: 800.
   * @min 100
   * @max 5000
   */
  autoEndSilenceDurationMs?: number;
}

/** ASR configuration settings */
export interface AsrConfig {
  /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
  asrProviderId?: string;
  /** ASR-specific settings including model, language preferences, etc. */
  settings?:
    | AzureAsrSettings
    | ElevenLabsAsrSettings
    | DeepgramAsrSettings
    | AssemblyAiAsrSettings
    | SpeechmaticsAsrSettings;
  /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
  unintelligiblePlaceholder?: string;
  /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
  voiceActivityDetection?: boolean;
  /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
  serverVad?: ServerVadConfig;
}

/** Azure Speech Recognition settings */
export interface AzureAsrSettings {
  /** The language code for speech recognition (e.g., 'en-US') */
  language?: string;
  /** The phrases to add to the speech recognition dictionary */
  dictionaryPhrases?: string[];
  /** Audio input format for speech recognition (e.g., "pcm_16000") */
  audioFormat?:
    | "mp3"
    | "opus"
    | "aac"
    | "flac"
    | "wav"
    | "pcm_8000"
    | "pcm_16000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100"
    | "pcm_48000"
    | "mulaw"
    | "alaw";
  [key: string]: any;
}

/** ElevenLabs Scribe settings */
export interface ElevenLabsAsrSettings {
  /**
   * Model ID to use for transcription (e.g., "scribe_v2_realtime"), defaults to scribe_v2_realtime
   * @default "scribe_v2_realtime"
   */
  modelId?: string;
  /**
   * Audio encoding format for speech-to-text, defaults to pcm_16000
   * @default "pcm_16000"
   */
  audioFormat?:
    | "pcm_16000"
    | "pcm_8000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100";
  /** Language code in ISO 639-1 or ISO 639-3 format (e.g., "en", "es") */
  languageCode?: string;
  /**
   * Whether to receive word-level timestamps in transcription results, defaults to false
   * @default false
   */
  includeTimestamps?: boolean;
  /**
   * Whether to include detected language code in transcription results, defaults to false
   * @default false
   */
  includeLanguageDetection?: boolean;
  /**
   * Strategy for committing transcriptions - manual or voice activity detection, defaults to manual
   * @default "manual"
   */
  commitStrategy?: "manual" | "vad";
  /**
   * Silence threshold in seconds for VAD (0.3-3), defaults to 1.5
   * @min 0.3
   * @max 3
   * @default 1.5
   */
  vadSilenceThresholdSecs?: number;
  /**
   * Threshold for voice activity detection (0.1-0.9), defaults to 0.4
   * @min 0.1
   * @max 0.9
   * @default 0.4
   */
  vadThreshold?: number;
  /**
   * Minimum speech duration in milliseconds (50-2000), defaults to 100
   * @min 50
   * @max 2000
   * @default 100
   */
  minSpeechDurationMs?: number;
  /**
   * Minimum silence duration in milliseconds (50-2000), defaults to 100
   * @min 50
   * @max 2000
   * @default 100
   */
  minSilenceDurationMs?: number;
  /**
   * When false, zero retention mode is used (enterprise only), defaults to true
   * @default true
   */
  enableLogging?: boolean;
  [key: string]: any;
}

/** Deepgram speech-to-text settings */
export interface DeepgramAsrSettings {
  /**
   * Model ID to use for transcription (e.g., "nova-3", "nova-2", "base", "enhanced"), defaults to nova-3
   * @default "nova-3"
   */
  modelId?: string;
  /**
   * Audio encoding format for speech-to-text, defaults to pcm_16000
   * @default "pcm_16000"
   */
  audioFormat?:
    | "pcm_16000"
    | "pcm_8000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100";
  /** BCP-47 language tag (e.g., "en-US", "es", "fr") */
  language?: string;
  /**
   * Enable interim (partial) transcription results during streaming, defaults to false
   * @default false
   */
  interimResults?: boolean;
  /**
   * Milliseconds of silence to wait before finalizing speech (10+) or false to disable, defaults to 300
   * @default 300
   */
  endpointing?: number | boolean;
  /**
   * Apply formatting (punctuation, capitalization, currency, etc.) to improve readability, defaults to true
   * @default true
   */
  smartFormat?: boolean;
  /**
   * Add punctuation and capitalization to transcript, defaults to true
   * @default true
   */
  punctuate?: boolean;
  /**
   * Recognize and label different speakers in the audio, defaults to false
   * @default false
   */
  diarize?: boolean;
  /**
   * Milliseconds to wait before sending UtteranceEnd event (use with interim_results)
   * @min 10
   */
  utteranceEndMs?: number;
  /**
   * Send SpeechStarted events when speech is detected, defaults to false
   * @default false
   */
  vadEvents?: boolean;
  [key: string]: any;
}

/** AssemblyAI speech-to-text settings */
export interface AssemblyAiAsrSettings {
  /**
   * Audio sample rate in Hz (8000, 16000, 22050, 24000, 44100), defaults to 16000
   * @default 16000
   */
  sampleRate?: number;
  /**
   * Enable formatted transcripts with capitalization and punctuation (adds latency, not recommended for voice agents), defaults to false
   * @default false
   */
  formatTurns?: boolean;
  /**
   * Speech model to use: English-only or multilingual (supports English, Spanish, French, German, Italian, Portuguese), defaults to universal-streaming-english
   * @default "universal-streaming-english"
   */
  speechModel?:
    | "universal-streaming-english"
    | "universal-streaming-multilingual";
  /** List of custom words or phrases to improve recognition accuracy */
  keytermsPrompt?: string[];
  /**
   * Voice activity detection confidence threshold (0.0 to 1.0) for classifying audio frames as silence, defaults to 0.4
   * @min 0
   * @max 1
   * @default 0.4
   */
  vadThreshold?: number;
  /**
   * Confidence threshold (0.0 to 1.0) for determining end of turn, defaults to 0.4
   * @min 0
   * @max 1
   * @default 0.4
   */
  endOfTurnConfidenceThreshold?: number;
  /**
   * Minimum silence in milliseconds required to detect end of turn when confident, defaults to 400
   * @min 0
   * @default 400
   */
  minEndOfTurnSilenceWhenConfident?: number;
  /**
   * Maximum silence in milliseconds allowed in a turn before triggering end of turn, defaults to 1280
   * @min 0
   * @default 1280
   */
  maxTurnSilence?: number;
  /**
   * Time in seconds of inactivity before session is terminated (5-3600), no timeout if not set
   * @min 5
   * @max 3600
   */
  inactivityTimeout?: number;
  [key: string]: any;
}

/** Speechmatics speech-to-text settings */
export interface SpeechmaticsAsrSettings {
  /** Language code for speech recognition (e.g., "en", "en-US", "es", "fr") */
  language?: string;
  /**
   * Audio input format for speech recognition, defaults to pcm_16000
   * @default "pcm_16000"
   */
  audioFormat?: "pcm_16000" | "pcm_8000" | "pcm_44100";
  /**
   * Transcription mode: "standard" for faster processing or "enhanced" for higher accuracy, defaults to standard
   * @default "standard"
   */
  transcriptionMode?: "standard" | "enhanced";
  /**
   * Enable automatic punctuation in transcripts, defaults to true
   * @default true
   */
  enablePunctuation?: boolean;
  /**
   * Enable automatic formatting (numbers, dates, currency, etc.), defaults to true
   * @default true
   */
  enableFormatting?: boolean;
  /** Custom vocabulary words or phrases to improve recognition accuracy */
  additionalVocab?: string[];
  /**
   * Enable speaker diarization to detect different speakers, defaults to false
   * @default false
   */
  enableDiarization?: boolean;
  /**
   * Maximum delay in seconds for transcription results (0-10), lower values reduce latency
   * @min 0
   * @max 10
   */
  maxDelay?: number;
  [key: string]: any;
}

/** Content moderation configuration */
export interface ModerationConfig {
  /** Whether content moderation is enabled for this project */
  enabled: boolean;
  /** ID of the LLM provider used for moderation (must support moderation API, e.g. OpenAI or Mistral) */
  llmProviderId: string;
  /** List of category names that should cause the input to be blocked. If omitted or empty, any flagged category will block the input. Category names are provider-specific. OpenAI categories: harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/instructions, self-harm/intent, sexual, sexual/minors, violence, violence/graphic. Mistral categories: sexual, hate_and_discrimination, violence_and_threats, dangerous_and_criminal_content, selfharm, health, financial, law, pii. */
  blockedCategories?: string[];
  /** Moderation execution mode. "strict" (default): moderation runs before all other processing — the turn is held until the moderation result is available. "standard": moderation runs after filler generation, in parallel with classification/knowledge retrieval (processTextInput), reducing perceived latency while still blocking flagged input before classification results are acted upon. */
  mode?: "strict" | "standard";
}

/** Sample copy configuration settings */
export interface SampleCopyConfig {
  /** ID of the classifier used to evaluate sample copy prompt triggers for all stages in this project. Individual sample copies can override this with classifierOverrideId. */
  defaultClassifierId?: string;
}

export interface FillerSettings {
  /** ID of the LLM provider used to generate the filler sentence */
  llmProviderId: string;
  /** LLM provider-specific settings for filler generation */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /**
   * Prompt instructing the LLM to produce a short neutral filler sentence (e.g. "Generate a single short neutral sentence to fill silence while processing, like "Hmm, let me think about that."")
   * @minLength 1
   */
  prompt: string;
}

export interface RequestTypeLimits {
  /**
   * Maximum tokens for completion (response generation) calls
   * @min 1
   */
  completion?: number;
  /**
   * Maximum tokens for classifier calls
   * @min 1
   */
  classification?: number;
  /**
   * Maximum tokens for smart_function tool calls
   * @min 1
   */
  tool?: number;
  /**
   * Maximum tokens for context transformer calls
   * @min 1
   */
  transformation?: number;
  /**
   * Maximum tokens for filler sentence generation calls
   * @min 1
   */
  filler?: number;
}

export interface ProviderModelLimits {
  /** Maximum output token caps per request type. Enforced as a hard ceiling over the entity-level defaultMaxTokens. */
  outputTokensLimits?: RequestTypeLimits;
  /** Maximum input context token caps per request type. When exceeded, the oldest non-system messages are trimmed from history before the call. */
  inputTokensLimits?: RequestTypeLimits;
}

export interface CostManagementConfig {
  /** Token cap definitions keyed by provider API type and model name */
  limits: Record<string, Record<string, ProviderModelLimits>>;
}

export interface S3StorageConfig {
  /** AWS access key ID */
  accessKeyId: string;
  /** AWS secret access key */
  secretAccessKey: string;
  /** AWS region (e.g., us-east-1) */
  region: string;
  /** Custom endpoint for S3-compatible services (e.g., MinIO) */
  endpoint?: string;
}

export interface S3StorageSettings {
  /** S3 bucket name */
  bucket: string;
  /** Key prefix for all operations (e.g., "projects/123/") */
  prefix?: string;
  /** Access control list for uploaded objects */
  acl?: "private" | "public-read" | "public-read-write" | "authenticated-read";
  /** Server-side encryption method */
  serverSideEncryption?: "AES256" | "aws:kms";
}

export interface AzureBlobStorageConfig {
  /** Azure storage account name */
  accountName: string;
  /** Azure storage account key */
  accountKey: string;
  /** Custom endpoint for Azure Blob Storage */
  endpoint?: string;
}

export interface AzureBlobStorageSettings {
  /** Azure Blob Storage container name */
  containerName: string;
  /** Blob prefix for all operations (e.g., "projects/123/") */
  prefix?: string;
  /** Access tier for uploaded blobs */
  tier?: "Hot" | "Cool" | "Archive";
}

export interface GcsStorageConfig {
  /** Google Cloud project ID */
  projectId: string;
  /** Service account key file content as JSON string */
  keyFileJson: string;
}

export interface GcsStorageSettings {
  /** Google Cloud Storage bucket name */
  bucketName: string;
  /** Object prefix for all operations (e.g., "projects/123/") */
  prefix?: string;
  /** Storage class for uploaded objects */
  storageClass?: "STANDARD" | "NEARLINE" | "COLDLINE" | "ARCHIVE";
}

export interface LocalStorageConfig {
  /** Base directory path for local storage */
  basePath: string;
  /** Base URL for generating file URLs (if files are served via HTTP) */
  baseUrl?: string;
}

export interface LocalStorageSettings {
  /** Subdirectory within basePath for this project */
  subPath?: string;
}

export interface FieldDescriptor {
  /** Local name of the field */
  name: string;
  /** Type of the field value */
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "object[]"
    | "image"
    | "image[]"
    | "audio"
    | "audio[]";
  /** Whether this field holds an array of values */
  isArray: boolean;
  /** Nested field definitions for object types */
  objectSchema?: FieldDescriptor[];
}

export interface EndConversationEffect {
  /** Effect type */
  type: "end_conversation";
  /** Optional reason for ending the conversation */
  reason?: string;
}

export interface AbortConversationEffect {
  /** Effect type */
  type: "abort_conversation";
  /** Optional reason for aborting the conversation */
  reason?: string;
}

export interface GoToStageEffect {
  /** Effect type */
  type: "go_to_stage";
  /**
   * ID of the stage to switch to
   * @minLength 1
   */
  stageId: string;
}

export interface ModifyUserInputEffect {
  /** Effect type */
  type: "modify_user_input";
  /**
   * Template to render and replace user input with
   * @minLength 1
   */
  template: string;
}

export interface ModifyVariablesEffect {
  /** Effect type */
  type: "modify_variables";
  /**
   * Array of variable modifications to apply
   * @minItems 1
   */
  modifications: VariableOperation[];
}

export interface VariableOperation {
  /**
   * Name of the variable to modify
   * @minLength 1
   */
  variableName: string;
  /** Operation to perform: set (assign value), reset (clear value), add (append to array), remove (remove from array) */
  operation: "set" | "reset" | "add" | "remove";
  /** Value for the operation (not used for reset operation) */
  value?: any;
}

export interface ModifyUserProfileEffect {
  /** Effect type */
  type: "modify_user_profile";
  /**
   * Array of user profile field modifications to apply
   * @minItems 1
   */
  modifications: UserProfileOperation[];
}

export interface UserProfileOperation {
  /**
   * Name of the profile field to modify
   * @minLength 1
   */
  fieldName: string;
  /** Operation to perform: set (assign value), reset (clear value), add (append to array), remove (remove from array) */
  operation: "set" | "reset" | "add" | "remove";
  /** Value for the operation (not used for reset operation) */
  value?: any;
}

export interface ChangeVisibilityEffect {
  /** Effect type */
  type: "change_visibility";
  /** Visibility setting: always (always visible), stage (visible only in current stage), never (never visible), conditional (visible based on a JavaScript condition expression) */
  visibility: "always" | "stage" | "never" | "conditional";
  /** JavaScript condition expression evaluated against the conversation context — required when visibility is "conditional" */
  condition?: string;
}

export interface BanUserEffect {
  /** Effect type */
  type: "ban_user";
  /** Optional reason for banning the user */
  reason?: string;
}

export interface CallToolEffect {
  /** Effect type */
  type: "call_tool";
  /**
   * ID of the tool to call
   * @minLength 1
   */
  toolId: string;
  /** Parameters to pass to the tool */
  parameters: Record<string, any>;
}

export interface GenerateResponseEffect {
  /** Effect type */
  type: "generate_response";
  /**
   * Type of response to generate: generated (AI-generated), prescripted (predefined response), best_match (choose the best match from predefined responses)
   * @default "generated"
   */
  responseMode?: "generated" | "prescripted";
  /**
   * Strategy to select prescripted response when multiple are provided
   * @default "random"
   */
  prescriptedSelectionStrategy?: "random" | "round_robin";
  /** Optional array of prescripted responses to use */
  prescriptedResponses?: string[];
}

export interface StageActionParameter {
  /**
   * Name of the parameter (used as key when passing to effects)
   * @minLength 1
   */
  name: string;
  /** Expected type of the parameter value */
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "object[]"
    | "image"
    | "image[]"
    | "audio"
    | "audio[]";
  /**
   * Description of what the parameter represents (helps with extraction)
   * @minLength 1
   */
  description: string;
  /** Whether this parameter must be present in the user input */
  required: boolean;
}

export interface ToolParameter {
  /**
   * Name of the parameter (used as key when passing to tool)
   * @minLength 1
   */
  name: string;
  /** Expected type of the parameter value */
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "object[]"
    | "image"
    | "image[]"
    | "audio"
    | "audio[]";
  /**
   * Description of what the parameter represents
   * @minLength 1
   */
  description: string;
  /** Whether this parameter must be provided when invoking the tool */
  required: boolean;
}

export interface StageAction {
  /**
   * Display name of the action
   * @minLength 1
   */
  name: string;
  /** Optional condition expression for action activation */
  condition?: string | null;
  /** Whether this action should be triggered on user input */
  triggerOnUserInput: boolean;
  /** Whether this action should be triggered on client commands */
  triggerOnClientCommand: boolean;
  /** Optional classification label that triggers this action */
  classificationTrigger?: string | null;
  /** Optional classifier ID - if set, this action is only enumerated for that specific classifier */
  overrideClassifierId?: string | null;
  /** Optional array of parameters to extract from user input */
  parameters: StageActionParameter[];
  /** Array of effects to execute when action is triggered */
  effects: Effect[];
  /** Example phrases that trigger this action */
  examples?: string[] | null;
  /**
   * Whether this action should be triggered on variable transformations
   * @default false
   */
  triggerOnTransformation?: boolean;
  /** Optional map of variable paths to watch for changes that trigger this action */
  watchedVariables?: Record<string, "new" | "changed" | "removed" | "any">;
  /** Additional action-specific metadata */
  metadata?: Record<string, any>;
}

export interface CreateOperatorRequest {
  /**
   * Unique identifier for the operator user (auto-generated if not provided)
   * @minLength 1
   */
  id: string;
  /**
   * Display name for the operator user
   * @minLength 1
   */
  name: string;
  /**
   * Array of role identifiers assigned to the operator (at least one required). Valid roles: super_admin, content_manager, support, developer, viewer
   * @minItems 1
   */
  roles: (
    | "super_admin"
    | "content_manager"
    | "support"
    | "developer"
    | "viewer"
  )[];
  /**
   * Operator user password (will be hashed)
   * @minLength 1
   */
  password: string;
  /** Optional metadata as key-value pairs */
  metadata?: Record<string, any>;
}

export interface UpdateOperatorRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent updates)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
  /**
   * Updated display name for the operator user
   * @minLength 1
   */
  name?: string;
  /**
   * Updated array of role identifiers. Valid roles: super_admin, content_manager, support, developer, viewer
   * @minItems 1
   */
  roles?: (
    | "super_admin"
    | "content_manager"
    | "support"
    | "developer"
    | "viewer"
  )[];
  /**
   * New password (will be hashed)
   * @minLength 1
   */
  password?: string;
  /** Updated metadata (merges with existing) */
  metadata?: Record<string, any>;
}

export interface DeleteOperatorRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent deletions)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
}

export interface OperatorResponse {
  /** Unique identifier for the operator user */
  id: string;
  /** Display name of the operator user */
  name: string;
  /** Array of role identifiers assigned to the operator */
  roles: string[];
  /** Metadata as key-value pairs */
  metadata?: Record<string, any>;
  /** Current version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the operator user was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the operator user was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface OperatorListResponse {
  /** Array of operator users in the current page */
  items: {
    /** Unique identifier for the operator user */
    id: string;
    /** Display name of the operator user */
    name: string;
    /** Array of role identifiers assigned to the operator */
    roles: string[];
    /** Metadata as key-value pairs */
    metadata?: Record<string, any>;
    /** Current version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the operator user was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the operator user was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of operator users matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface UpdateProfileRequest {
  /**
   * Updated display name for the operator user
   * @minLength 1
   */
  name?: string;
  /**
   * Current password (required when changing password)
   * @minLength 1
   */
  oldPassword?: string;
  /**
   * New password to set (requires oldPassword)
   * @minLength 1
   */
  newPassword?: string;
}

export interface ProfileResponse {
  /** Unique identifier for the operator user */
  id: string;
  /** Display name of the operator user */
  name: string;
  /** Array of role identifiers assigned to the operator */
  roles: string[];
  /** Metadata as key-value pairs */
  metadata?: Record<string, any>;
  /** Current version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the operator user was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the operator user was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface CreateUserRequest {
  /**
   * Unique identifier for the user (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /** User profile data as flexible key-value pairs */
  profile: Record<string, any>;
}

export interface UpdateUserRequest {
  /** Updated profile data (merges with existing profile) */
  profile?: Record<string, any>;
  /** Whether the user is banned from starting conversations */
  banned?: boolean;
  /** Reason for banning the user (null to clear) */
  banReason?: string | null;
}

export interface UserResponse {
  /** Unique identifier for the user */
  id: string;
  /** Project this user belongs to */
  projectId: string;
  /** User profile data as key-value pairs */
  profile: Record<string, any>;
  /** Whether the user is banned from starting conversations */
  banned: boolean;
  /** Reason the user was banned */
  banReason?: string | null;
  /**
   * Timestamp when the user was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the user was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface UserListResponse {
  /** Array of users in the current page */
  items: {
    /** Unique identifier for the user */
    id: string;
    /** Project this user belongs to */
    projectId: string;
    /** User profile data as key-value pairs */
    profile: Record<string, any>;
    /** Whether the user is banned from starting conversations */
    banned: boolean;
    /** Reason the user was banned */
    banReason?: string | null;
    /**
     * Timestamp when the user was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the user was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of users matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateProjectRequest {
  /**
   * The name of the project
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** A description of the project */
  description?: string | null;
  /** Optional ASR configuration settings */
  asrConfig?: {
    /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
    asrProviderId?: string;
    /** ASR-specific settings including model, language preferences, etc. */
    settings?:
      | AzureAsrSettings
      | ElevenLabsAsrSettings
      | DeepgramAsrSettings
      | AssemblyAiAsrSettings
      | SpeechmaticsAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
    serverVad?: ServerVadConfig;
  };
  /**
   * Whether conversations can accept voice input (requires asrConfig fully populated)
   * @default true
   */
  acceptVoice?: boolean;
  /**
   * Whether conversations generate voice responses (requires ttsConfig fully populated in Stages)
   * @default true
   */
  generateVoice?: boolean;
  /** Optional storage configuration for conversation artifacts */
  storageConfig?: {
    /** ID of the storage provider (e.g., "s3-provider", "azure-blob-provider") */
    storageProviderId?: string;
    /** Storage-specific settings including bucket, prefix, etc. */
    settings?:
      | S3StorageSettings
      | AzureBlobStorageSettings
      | GcsStorageSettings
      | LocalStorageSettings;
  };
  /** Optional content moderation configuration */
  moderationConfig?: {
    /** Whether content moderation is enabled for this project */
    enabled: boolean;
    /** ID of the LLM provider used for moderation (must support moderation API, e.g. OpenAI or Mistral) */
    llmProviderId: string;
    /** List of category names that should cause the input to be blocked. If omitted or empty, any flagged category will block the input. Category names are provider-specific. OpenAI categories: harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/instructions, self-harm/intent, sexual, sexual/minors, violence, violence/graphic. Mistral categories: sexual, hate_and_discrimination, violence_and_threats, dangerous_and_criminal_content, selfharm, health, financial, law, pii. */
    blockedCategories?: string[];
    /** Moderation execution mode. "strict" (default): moderation runs before all other processing — the turn is held until the moderation result is available. "standard": moderation runs after filler generation, in parallel with classification/knowledge retrieval (processTextInput), reducing perceived latency while still blocking flagged input before classification results are acted upon. */
    mode?: "strict" | "standard";
  };
  /** Optional project-level LLM token cost management configuration */
  costManagementConfig?: CostManagementConfig;
  /** Key-value store of constants used in templating and conversation logic */
  constants?: Record<string, ParameterValue>;
  /** Additional metadata for the project */
  metadata?: Record<string, any>;
  /** IANA timezone identifier used as the default for conversations in this project, e.g. Europe/Warsaw or America/New_York. Defaults to UTC when not set. */
  timezone?: string | null;
  /** ISO language code for the project, e.g. en-US or pl-PL. Used as a hint for language-aware LLM prompts. */
  languageCode?: string | null;
  /**
   * When enabled, users are automatically created on first WebSocket connection if they do not exist, using the provided user ID and an empty profile
   * @default false
   */
  autoCreateUsers?: boolean;
  /**
   * Descriptors defining the data schema for user profile variables in this project
   * @default []
   */
  userProfileVariableDescriptors?: FieldDescriptor[];
  /** ID of the classifier used to evaluate guardrails for all conversations in this project. When set, all project guardrails are evaluated against this classifier on every user input turn. */
  defaultGuardrailClassifierId?: string | null;
  /** Sample copy configuration including the default classifier used to evaluate prompt triggers. */
  sampleCopyConfig?: SampleCopyConfig;
  /**
   * Timeout in seconds for active conversations with no activity. Set to 0 or omit to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
   * @min 0
   */
  conversationTimeoutSeconds?: number;
}

/** Value of the parameter, can be a primitive type, an array of primitives, a free-form JSON object, or a multimodal parameter (image or audio) */
export type ParameterValue =
  | string
  | number
  | boolean
  | Record<string, any>
  | string[]
  | number[]
  | boolean[]
  | Record<string, any>[]
  | ImageParameterValue
  | AudioParameterValue;

/** Image parameter value structure for multimodal parameters */
export interface ImageParameterValue {
  /** Base64-encoded image data */
  data: string;
  /** MIME type of the image (e.g., image/png, image/jpeg, image/webp) */
  mimeType: string;
  /** Optional metadata about the image */
  metadata?: {
    /** Image width in pixels */
    width?: number;
    /** Image height in pixels */
    height?: number;
    [key: string]: any;
  };
}

/** Audio parameter value structure for multimodal parameters */
export interface AudioParameterValue {
  /** Base64-encoded audio data */
  data: string;
  /** Audio format identifier (pcm, mp3, wav, opus) */
  format: "pcm" | "mp3" | "wav" | "opus";
  /** MIME type of the audio (e.g., audio/pcm, audio/mpeg, audio/wav) */
  mimeType: string;
  /** Optional metadata about the audio */
  metadata?: {
    /** Sample rate in Hz (e.g., 44100, 48000) */
    sampleRate?: number;
    /** Number of audio channels (1 for mono, 2 for stereo) */
    channels?: number;
    /** Bit depth per sample (e.g., 16, 24) */
    bitDepth?: number;
    [key: string]: any;
  };
}

export interface UpdateProjectRequest {
  /**
   * The updated name of the project
   * @minLength 1
   * @maxLength 255
   */
  name?: string;
  /** The updated description of the project */
  description?: string | null;
  /** Updated ASR configuration settings */
  asrConfig?: {
    /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
    asrProviderId?: string;
    /** ASR-specific settings including model, language preferences, etc. */
    settings?:
      | AzureAsrSettings
      | ElevenLabsAsrSettings
      | DeepgramAsrSettings
      | AssemblyAiAsrSettings
      | SpeechmaticsAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
    serverVad?: ServerVadConfig;
  } | null;
  /** Whether conversations can accept voice input (requires asrConfig fully populated) */
  acceptVoice?: boolean;
  /** Whether conversations generate voice responses (requires ttsConfig fully populated in Stages) */
  generateVoice?: boolean;
  /** Updated storage configuration settings */
  storageConfig?: {
    /** ID of the storage provider (e.g., "s3-provider", "azure-blob-provider") */
    storageProviderId?: string;
    /** Storage-specific settings including bucket, prefix, etc. */
    settings?:
      | S3StorageSettings
      | AzureBlobStorageSettings
      | GcsStorageSettings
      | LocalStorageSettings;
  } | null;
  /** Updated content moderation configuration */
  moderationConfig?: {
    /** Whether content moderation is enabled for this project */
    enabled: boolean;
    /** ID of the LLM provider used for moderation (must support moderation API, e.g. OpenAI or Mistral) */
    llmProviderId: string;
    /** List of category names that should cause the input to be blocked. If omitted or empty, any flagged category will block the input. Category names are provider-specific. OpenAI categories: harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/instructions, self-harm/intent, sexual, sexual/minors, violence, violence/graphic. Mistral categories: sexual, hate_and_discrimination, violence_and_threats, dangerous_and_criminal_content, selfharm, health, financial, law, pii. */
    blockedCategories?: string[];
    /** Moderation execution mode. "strict" (default): moderation runs before all other processing — the turn is held until the moderation result is available. "standard": moderation runs after filler generation, in parallel with classification/knowledge retrieval (processTextInput), reducing perceived latency while still blocking flagged input before classification results are acted upon. */
    mode?: "strict" | "standard";
  } | null;
  /** Updated project-level LLM token cost management configuration. Set to null to remove. */
  costManagementConfig?: {
    /** Token cap definitions keyed by provider API type and model name */
    limits: Record<string, Record<string, ProviderModelLimits>>;
  } | null;
  /** Updated constants key-value store */
  constants?: Record<string, ParameterValue>;
  /** Updated metadata for the project */
  metadata?: Record<string, any>;
  /** IANA timezone identifier used as the default for conversations in this project, e.g. Europe/Warsaw or America/New_York. Set to null to clear. Defaults to UTC when not set. */
  timezone?: string | null;
  /** ISO language code for the project, e.g. en-US or pl-PL. Set to null to clear. */
  languageCode?: string | null;
  /** When enabled, users are automatically created on first WebSocket connection if they do not exist, using the provided user ID and an empty profile */
  autoCreateUsers?: boolean;
  /** Updated descriptors defining the data schema for user profile variables in this project */
  userProfileVariableDescriptors?: FieldDescriptor[];
  /** Updated ID of the classifier used to evaluate guardrails. Set to null to disable guardrail classification. */
  defaultGuardrailClassifierId?: string | null;
  /** Updated sample copy configuration. Set to null to clear. */
  sampleCopyConfig?: {
    /** ID of the classifier used to evaluate sample copy prompt triggers for all stages in this project. Individual sample copies can override this with classifierOverrideId. */
    defaultClassifierId?: string;
  } | null;
  /**
   * Timeout in seconds for active conversations with no activity. Set to 0 or null to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
   * @min 0
   */
  conversationTimeoutSeconds?: number | null;
  /** The current version number for optimistic locking */
  version: number;
}

export interface ProjectResponse {
  /** The unique identifier of the project */
  id: string;
  /** The name of the project */
  name: string;
  /** A description of the project */
  description: string | null;
  /** ASR configuration settings */
  asrConfig?: {
    /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
    asrProviderId?: string;
    /** ASR-specific settings including model, language preferences, etc. */
    settings?:
      | AzureAsrSettings
      | ElevenLabsAsrSettings
      | DeepgramAsrSettings
      | AssemblyAiAsrSettings
      | SpeechmaticsAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
    serverVad?: ServerVadConfig;
  } | null;
  /** Whether conversations can accept voice input (requires asrConfig fully populated) */
  acceptVoice: boolean;
  /** Whether conversations generate voice responses (requires ttsConfig fully populated in Stages) */
  generateVoice: boolean;
  /** Storage configuration for conversation artifacts */
  storageConfig?: {
    /** ID of the storage provider (e.g., "s3-provider", "azure-blob-provider") */
    storageProviderId?: string;
    /** Storage-specific settings including bucket, prefix, etc. */
    settings?:
      | S3StorageSettings
      | AzureBlobStorageSettings
      | GcsStorageSettings
      | LocalStorageSettings;
  } | null;
  /** Content moderation configuration */
  moderationConfig: {
    /** Whether content moderation is enabled for this project */
    enabled: boolean;
    /** ID of the LLM provider used for moderation (must support moderation API, e.g. OpenAI or Mistral) */
    llmProviderId: string;
    /** List of category names that should cause the input to be blocked. If omitted or empty, any flagged category will block the input. Category names are provider-specific. OpenAI categories: harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/instructions, self-harm/intent, sexual, sexual/minors, violence, violence/graphic. Mistral categories: sexual, hate_and_discrimination, violence_and_threats, dangerous_and_criminal_content, selfharm, health, financial, law, pii. */
    blockedCategories?: string[];
    /** Moderation execution mode. "strict" (default): moderation runs before all other processing — the turn is held until the moderation result is available. "standard": moderation runs after filler generation, in parallel with classification/knowledge retrieval (processTextInput), reducing perceived latency while still blocking flagged input before classification results are acted upon. */
    mode?: "strict" | "standard";
  } | null;
  /** Project-level LLM token cost management configuration */
  costManagementConfig: CostManagementConfig;
  /** Key-value store of constants used in templating and conversation logic */
  constants: Record<string, ParameterValue>;
  /** Additional metadata for the project */
  metadata: Record<string, any>;
  /** IANA timezone identifier used as the default for conversations in this project, e.g. Europe/Warsaw or America/New_York. Null means UTC. */
  timezone: string | null;
  /** ISO language code for the project, e.g. en-US or pl-PL. Null if not set. */
  languageCode: string | null;
  /** When enabled, users are automatically created on first WebSocket connection if they do not exist, using the provided user ID and an empty profile */
  autoCreateUsers: boolean;
  /** Descriptors defining the data schema for user profile variables in this project */
  userProfileVariableDescriptors: FieldDescriptor[];
  /** ID of the classifier used to evaluate guardrails for all conversations in this project */
  defaultGuardrailClassifierId: string | null;
  /** Sample copy configuration including the default classifier used to evaluate prompt triggers. */
  sampleCopyConfig?: {
    /** ID of the classifier used to evaluate sample copy prompt triggers for all stages in this project. Individual sample copies can override this with classifierOverrideId. */
    defaultClassifierId?: string;
  } | null;
  /** Timeout in seconds for active conversations with no activity. Null or 0 means no timeout. */
  conversationTimeoutSeconds: number | null;
  /** The version number of the project */
  version: number;
  /**
   * The timestamp when the project was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * The timestamp when the project was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /**
   * The timestamp when the project was archived, or null if the project is not archived
   * @format date-time
   */
  archivedAt: string | null;
  /** The ID of the operator who archived the project, or null if the project is not archived */
  archivedBy: string | null;
}

export interface ProjectListResponse {
  /** Array of projects */
  items: {
    /** The unique identifier of the project */
    id: string;
    /** The name of the project */
    name: string;
    /** A description of the project */
    description: string | null;
    /** ASR configuration settings */
    asrConfig?: {
      /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
      asrProviderId?: string;
      /** ASR-specific settings including model, language preferences, etc. */
      settings?:
        | AzureAsrSettings
        | ElevenLabsAsrSettings
        | DeepgramAsrSettings
        | AssemblyAiAsrSettings
        | SpeechmaticsAsrSettings;
      /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
      unintelligiblePlaceholder?: string;
      /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
      voiceActivityDetection?: boolean;
      /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
      serverVad?: ServerVadConfig;
    } | null;
    /** Whether conversations can accept voice input (requires asrConfig fully populated) */
    acceptVoice: boolean;
    /** Whether conversations generate voice responses (requires ttsConfig fully populated in Stages) */
    generateVoice: boolean;
    /** Storage configuration for conversation artifacts */
    storageConfig?: {
      /** ID of the storage provider (e.g., "s3-provider", "azure-blob-provider") */
      storageProviderId?: string;
      /** Storage-specific settings including bucket, prefix, etc. */
      settings?:
        | S3StorageSettings
        | AzureBlobStorageSettings
        | GcsStorageSettings
        | LocalStorageSettings;
    } | null;
    /** Content moderation configuration */
    moderationConfig: {
      /** Whether content moderation is enabled for this project */
      enabled: boolean;
      /** ID of the LLM provider used for moderation (must support moderation API, e.g. OpenAI or Mistral) */
      llmProviderId: string;
      /** List of category names that should cause the input to be blocked. If omitted or empty, any flagged category will block the input. Category names are provider-specific. OpenAI categories: harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/instructions, self-harm/intent, sexual, sexual/minors, violence, violence/graphic. Mistral categories: sexual, hate_and_discrimination, violence_and_threats, dangerous_and_criminal_content, selfharm, health, financial, law, pii. */
      blockedCategories?: string[];
      /** Moderation execution mode. "strict" (default): moderation runs before all other processing — the turn is held until the moderation result is available. "standard": moderation runs after filler generation, in parallel with classification/knowledge retrieval (processTextInput), reducing perceived latency while still blocking flagged input before classification results are acted upon. */
      mode?: "strict" | "standard";
    } | null;
    /** Project-level LLM token cost management configuration */
    costManagementConfig: CostManagementConfig;
    /** Key-value store of constants used in templating and conversation logic */
    constants: Record<string, ParameterValue>;
    /** Additional metadata for the project */
    metadata: Record<string, any>;
    /** IANA timezone identifier used as the default for conversations in this project, e.g. Europe/Warsaw or America/New_York. Null means UTC. */
    timezone: string | null;
    /** ISO language code for the project, e.g. en-US or pl-PL. Null if not set. */
    languageCode: string | null;
    /** When enabled, users are automatically created on first WebSocket connection if they do not exist, using the provided user ID and an empty profile */
    autoCreateUsers: boolean;
    /** Descriptors defining the data schema for user profile variables in this project */
    userProfileVariableDescriptors: FieldDescriptor[];
    /** ID of the classifier used to evaluate guardrails for all conversations in this project */
    defaultGuardrailClassifierId: string | null;
    /** Sample copy configuration including the default classifier used to evaluate prompt triggers. */
    sampleCopyConfig?: {
      /** ID of the classifier used to evaluate sample copy prompt triggers for all stages in this project. Individual sample copies can override this with classifierOverrideId. */
      defaultClassifierId?: string;
    } | null;
    /** Timeout in seconds for active conversations with no activity. Null or 0 means no timeout. */
    conversationTimeoutSeconds: number | null;
    /** The version number of the project */
    version: number;
    /**
     * The timestamp when the project was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * The timestamp when the project was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /**
     * The timestamp when the project was archived, or null if the project is not archived
     * @format date-time
     */
    archivedAt: string | null;
    /** The ID of the operator who archived the project, or null if the project is not archived */
    archivedBy: string | null;
  }[];
  /** Total number of projects */
  total: number;
}

export interface CreateAgentRequest {
  /**
   * Unique identifier for the agent (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the agent
   * @minLength 1
   */
  name: string;
  /** Detailed description of the agent purpose */
  description?: string;
  /**
   * Detailed prompt defining the agent's characteristics and behavior
   * @minLength 1
   */
  prompt: string;
  /** ID of the TTS provider (e.g., "eleven-labs") */
  ttsProviderId?: string;
  /** TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings;
  /**
   * Tags for categorizing and filtering this agent
   * @default []
   */
  tags?: string[];
  /** Additional agent-specific metadata */
  metadata?: Record<string, any>;
  /** Filler response settings: a short sentence spoken through TTS at the very start of each turn while classification runs in parallel */
  fillerSettings?: FillerSettings;
}

export interface UpdateAgentRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated detailed description of the agent */
  description?: string | null;
  /**
   * Updated prompt defining behavior
   * @minLength 1
   */
  prompt?: string;
  /** Updated TTS provider ID */
  ttsProviderId?: string | null;
  /** Updated TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings
    | null;
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /** Updated filler response settings */
  fillerSettings?: {
    /** ID of the LLM provider used to generate the filler sentence */
    llmProviderId: string;
    /** LLM provider-specific settings for filler generation */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /**
     * Prompt instructing the LLM to produce a short neutral filler sentence (e.g. "Generate a single short neutral sentence to fill silence while processing, like "Hmm, let me think about that."")
     * @minLength 1
     */
    prompt: string;
  } | null;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteAgentRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface AgentResponse {
  /** Unique identifier for the agent */
  id: string;
  /** ID of the project this agent belongs to */
  projectId: string;
  /** Display name of the agent */
  name: string;
  /** Detailed description of the agent purpose */
  description: string | null;
  /** Prompt defining the agent's characteristics and behavior */
  prompt: string;
  /** ID of the TTS provider */
  ttsProviderId: string | null;
  /** TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings;
  /** Tags for categorizing and filtering this agent */
  tags: string[];
  /** Additional agent-specific metadata */
  metadata: Record<string, any>;
  /** Filler response settings */
  fillerSettings: FillerSettings;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the agent was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the agent was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface AgentListResponse {
  /** Array of agents in the current page */
  items: {
    /** Unique identifier for the agent */
    id: string;
    /** ID of the project this agent belongs to */
    projectId: string;
    /** Display name of the agent */
    name: string;
    /** Detailed description of the agent purpose */
    description: string | null;
    /** Prompt defining the agent's characteristics and behavior */
    prompt: string;
    /** ID of the TTS provider */
    ttsProviderId: string | null;
    /** TTS provider-specific settings */
    ttsSettings?:
      | ElevenLabsTtsSettings
      | OpenAiTtsSettings
      | DeepgramTtsSettings
      | CartesiaTtsSettings
      | AzureTtsSettings
      | AmazonPollyTtsSettings;
    /** Tags for categorizing and filtering this agent */
    tags: string[];
    /** Additional agent-specific metadata */
    metadata: Record<string, any>;
    /** Filler response settings */
    fillerSettings: FillerSettings;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the agent was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the agent was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of agents matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface LoginRequest {
  /**
   * Operator user ID or email
   * @minLength 1
   */
  id: string;
  /**
   * Operator user password
   * @minLength 1
   */
  password: string;
}

export interface RefreshTokenRequest {
  /**
   * Valid refresh token
   * @minLength 1
   */
  refreshToken: string;
}

export interface LoginResponse {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /**
   * Access token expiry time in seconds
   * @min 0
   * @exclusiveMin true
   */
  expiresIn: number;
  /** Operator user ID */
  operatorId: string;
  /** Operator display name */
  displayName: string;
  /** Array of role identifiers */
  roles: string[];
  /** Effective permissions derived from assigned roles (deduplicated union) */
  permissions: string[];
}

export interface RefreshTokenResponse {
  /** New JWT access token (expires in 15 minutes) */
  accessToken: string;
  /**
   * Access token expiry time in seconds
   * @min 0
   * @exclusiveMin true
   */
  expiresIn: number;
  /** Up-to-date array of role identifiers (re-fetched from database) */
  roles: string[];
  /** Up-to-date effective permissions derived from current roles (deduplicated union) */
  permissions: string[];
}

export interface InitialOperatorSetupRequest {
  /**
   * Unique identifier for the operator user (typically an email address)
   * @minLength 1
   */
  id: string;
  /**
   * Display name for the operator user
   * @minLength 1
   */
  name: string;
  /**
   * Operator user password (minimum 8 characters, will be hashed)
   * @minLength 8
   */
  password: string;
  /** Optional metadata as key-value pairs */
  metadata?: Record<string, any>;
}

export interface SetupStatusResponse {
  /** Whether the system has been set up with at least one operator account */
  isSetup: boolean;
  /** Descriptive message about the setup status */
  message: string;
}

export interface InitialOperatorSetupResponse {
  /** Created operator user details */
  operator: {
    /** Unique identifier for the operator user */
    id: string;
    /** Display name of the operator user */
    name: string;
    /** Array of role identifiers assigned to the operator */
    roles: string[];
    /** Metadata as key-value pairs */
    metadata?: Record<string, any>;
    /**
     * Timestamp when the operator user was created
     * @format date-time
     */
    createdAt: string | null;
  };
  /** JWT access token for immediate authentication */
  accessToken: string;
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string;
  /**
   * Access token expiry time in seconds
   * @min 0
   * @exclusiveMin true
   */
  expiresIn: number;
}

export interface CreateKnowledgeCategoryRequest {
  /**
   * Unique identifier for the knowledge category (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Name of the knowledge category
   * @minLength 1
   */
  name: string;
  /**
   * Trigger phrase that activates this category in conversations
   * @minLength 1
   */
  promptTrigger: string;
  /** Array of knowledge tags this category belongs to */
  tags?: string[];
  /**
   * Display order for the category (default: 0)
   * @min 0
   */
  order?: number;
}

export interface UpdateKnowledgeCategoryRequest {
  /**
   * Updated name of the category
   * @minLength 1
   */
  name?: string;
  /**
   * Updated trigger phrase
   * @minLength 1
   */
  promptTrigger?: string;
  /** Updated array of knowledge tags */
  tags?: string[];
  /**
   * Updated display order
   * @min 0
   */
  order?: number;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteKnowledgeCategoryRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface KnowledgeCategoryResponse {
  /** Unique identifier for the knowledge category */
  id: string;
  /** ID of the project this knowledge category belongs to */
  projectId: string;
  /** Name of the knowledge category */
  name: string;
  /** Trigger phrase that activates this category */
  promptTrigger: string;
  /** Array of knowledge tags */
  tags: string[];
  /** Display order for the category */
  order: number;
  /** Knowledge items within this category */
  items?: {
    /** Unique identifier for the knowledge item */
    id: string;
    /** ID of the project this item belongs to */
    projectId: string;
    /** ID of the category this item belongs to */
    categoryId: string;
    /** Question text for this knowledge item */
    question: string;
    /** Answer text for this knowledge item */
    answer: string;
    /** Display order within the category */
    order: number;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the item was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the item was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the category was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the category was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface KnowledgeCategoryListResponse {
  /** Array of knowledge categories in the current page */
  items: {
    /** Unique identifier for the knowledge category */
    id: string;
    /** ID of the project this knowledge category belongs to */
    projectId: string;
    /** Name of the knowledge category */
    name: string;
    /** Trigger phrase that activates this category */
    promptTrigger: string;
    /** Array of knowledge tags */
    tags: string[];
    /** Display order for the category */
    order: number;
    /** Knowledge items within this category */
    items?: {
      /** Unique identifier for the knowledge item */
      id: string;
      /** ID of the project this item belongs to */
      projectId: string;
      /** ID of the category this item belongs to */
      categoryId: string;
      /** Question text for this knowledge item */
      question: string;
      /** Answer text for this knowledge item */
      answer: string;
      /** Display order within the category */
      order: number;
      /** Version number for optimistic locking */
      version: number;
      /**
       * Timestamp when the item was created
       * @format date-time
       */
      createdAt: string | null;
      /**
       * Timestamp when the item was last updated
       * @format date-time
       */
      updatedAt: string | null;
    }[];
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the category was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the category was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of categories matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateKnowledgeItemRequest {
  /**
   * Unique identifier for the knowledge item (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the category this item belongs to
   * @minLength 1
   */
  categoryId: string;
  /**
   * Question text for this knowledge item
   * @minLength 1
   */
  question: string;
  /**
   * Answer text for this knowledge item
   * @minLength 1
   */
  answer: string;
  /**
   * Display order within the category (default: 0)
   * @min 0
   */
  order?: number;
}

export interface UpdateKnowledgeItemRequest {
  /**
   * Updated category ID
   * @minLength 1
   */
  categoryId?: string;
  /**
   * Updated question text
   * @minLength 1
   */
  question?: string;
  /**
   * Updated answer text
   * @minLength 1
   */
  answer?: string;
  /**
   * Updated display order
   * @min 0
   */
  order?: number;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteKnowledgeItemRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface KnowledgeItemResponse {
  /** Unique identifier for the knowledge item */
  id: string;
  /** ID of the project this item belongs to */
  projectId: string;
  /** ID of the category this item belongs to */
  categoryId: string;
  /** Question text for this knowledge item */
  question: string;
  /** Answer text for this knowledge item */
  answer: string;
  /** Display order within the category */
  order: number;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the item was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the item was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface KnowledgeItemListResponse {
  /** Array of knowledge items in the current page */
  items: {
    /** Unique identifier for the knowledge item */
    id: string;
    /** ID of the project this item belongs to */
    projectId: string;
    /** ID of the category this item belongs to */
    categoryId: string;
    /** Question text for this knowledge item */
    question: string;
    /** Answer text for this knowledge item */
    answer: string;
    /** Display order within the category */
    order: number;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the item was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the item was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of items matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateIssueRequest {
  /**
   * ID of the project this issue belongs to
   * @minLength 1
   */
  projectId: string;
  /** Environment where issue occurred (e.g., production, staging, development) */
  environment: string;
  /**
   * Application build version where the issue was encountered
   * @minLength 1
   */
  buildVersion: string;
  /** Stage identifier for tracking purposes */
  stage?: string;
  /** Reference to related conversation session ID */
  sessionId?: string;
  /** Index of event in session where issue occurred */
  eventIndex?: number;
  /** User ID who reported or encountered the issue */
  userId?: string;
  /**
   * Issue severity level (e.g., critical, high, medium, low)
   * @minLength 1
   */
  severity: string;
  /**
   * Issue category or type (e.g., bug, feature, performance)
   * @minLength 1
   */
  category: string;
  /**
   * Detailed description of the bug or issue
   * @minLength 1
   */
  bugDescription: string;
  /**
   * Description of the expected behavior
   * @minLength 1
   */
  expectedBehaviour: string;
  /**
   * Additional comments or notes about the issue
   * @default ""
   */
  comments?: string;
  /**
   * Current issue status (e.g., open, in-progress, resolved, closed)
   * @minLength 1
   */
  status: string;
}

export interface UpdateIssueRequest {
  /** Environment where issue occurred */
  environment?: string;
  /**
   * Application build version
   * @minLength 1
   */
  buildVersion?: string;
  /** Stage identifier */
  stage?: string;
  /** Related conversation session ID */
  sessionId?: string;
  /** Event index in session */
  eventIndex?: number;
  /** User ID who reported the issue */
  userId?: string | null;
  /**
   * Issue severity level
   * @minLength 1
   */
  severity?: string;
  /**
   * Issue category or type
   * @minLength 1
   */
  category?: string;
  /**
   * Detailed bug description
   * @minLength 1
   */
  bugDescription?: string;
  /**
   * Expected behavior description
   * @minLength 1
   */
  expectedBehaviour?: string;
  /** Additional comments or notes */
  comments?: string;
  /**
   * Current issue status
   * @minLength 1
   */
  status?: string;
}

export interface IssueResponse {
  /** Unique auto-incrementing identifier for the issue */
  id: number;
  /** ID of the project this issue belongs to */
  projectId: string;
  /** Environment where issue occurred */
  environment: string;
  /** Application build version */
  buildVersion: string;
  /** Stage identifier */
  stage: string | null;
  /** Related conversation session ID */
  sessionId: string | null;
  /** Event index in session */
  eventIndex: number | null;
  /** User ID who reported the issue */
  userId: string | null;
  /** Issue severity level */
  severity: string;
  /** Issue category or type */
  category: string;
  /** Detailed bug description */
  bugDescription: string;
  /** Expected behavior description */
  expectedBehaviour: string;
  /** Additional comments or notes */
  comments: string;
  /** Current issue status */
  status: string;
  /**
   * Timestamp when the issue was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the issue was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface IssueListResponse {
  /** Array of issues in the current page */
  items: {
    /** Unique auto-incrementing identifier for the issue */
    id: number;
    /** ID of the project this issue belongs to */
    projectId: string;
    /** Environment where issue occurred */
    environment: string;
    /** Application build version */
    buildVersion: string;
    /** Stage identifier */
    stage: string | null;
    /** Related conversation session ID */
    sessionId: string | null;
    /** Event index in session */
    eventIndex: number | null;
    /** User ID who reported the issue */
    userId: string | null;
    /** Issue severity level */
    severity: string;
    /** Issue category or type */
    category: string;
    /** Detailed bug description */
    bugDescription: string;
    /** Expected behavior description */
    expectedBehaviour: string;
    /** Additional comments or notes */
    comments: string;
    /** Current issue status */
    status: string;
    /**
     * Timestamp when the issue was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the issue was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of issues matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface ConversationResponse {
  /** Unique identifier for the conversation */
  id: string;
  /** Identifier of the project this conversation belongs to */
  projectId: string;
  /** Identifier of the user associated with this conversation */
  userId: string;
  /** ID of the WebSocket session that initiated this conversation */
  sessionId: string;
  /** Current stage identifier for the conversation */
  stageId: string;
  /** Stage identifier at the start of the conversation */
  startingStageId: string | null;
  /** Stage identifier when the conversation reached a terminal state (finished/failed/aborted) */
  endingStageId: string | null;
  /** Variables stored per stage in the conversation */
  stageVars: Record<string, Record<string, any>>;
  /** Current status of the conversation (e.g., initialized, active, completed, failed) */
  status: string;
  /** Optional details about the current status */
  statusDetails: string | null;
  /** Additional metadata associated with the conversation */
  metadata: Record<string, any>;
  /**
   * Timestamp when the conversation was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the conversation was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface ConversationListResponse {
  /** Array of conversations in the current page */
  items: {
    /** Unique identifier for the conversation */
    id: string;
    /** Identifier of the project this conversation belongs to */
    projectId: string;
    /** Identifier of the user associated with this conversation */
    userId: string;
    /** ID of the WebSocket session that initiated this conversation */
    sessionId: string;
    /** Current stage identifier for the conversation */
    stageId: string;
    /** Stage identifier at the start of the conversation */
    startingStageId: string | null;
    /** Stage identifier when the conversation reached a terminal state (finished/failed/aborted) */
    endingStageId: string | null;
    /** Variables stored per stage in the conversation */
    stageVars: Record<string, Record<string, any>>;
    /** Current status of the conversation (e.g., initialized, active, completed, failed) */
    status: string;
    /** Optional details about the current status */
    statusDetails: string | null;
    /** Additional metadata associated with the conversation */
    metadata: Record<string, any>;
    /**
     * Timestamp when the conversation was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the conversation was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of conversations matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface ConversationEventResponse {
  /** Unique identifier for the conversation event */
  id: string;
  /** ID of the project this event belongs to */
  projectId: string;
  /** Identifier of the conversation this event belongs to */
  conversationId: string;
  /** Type of the conversation event */
  eventType:
    | "message"
    | "classification"
    | "transformation"
    | "execution_plan"
    | "action"
    | "command"
    | "tool_call"
    | "conversation_start"
    | "conversation_resume"
    | "conversation_end"
    | "conversation_aborted"
    | "conversation_failed"
    | "jump_to_stage"
    | "moderation"
    | "variables_updated"
    | "user_profile_updated"
    | "user_input_modified"
    | "user_banned"
    | "visibility_changed"
    | "sample_copy_selection";
  /** Event data payload */
  eventData:
    | {
        role: "user" | "assistant";
        text: string;
        originalText: string;
        visibility?: {
          /** Visibility setting for the message: always (always visible), stage (visible only in current stage), never (never visible), conditional (visible based on condition) */
          visibility: "always" | "stage" | "never" | "conditional";
          /** Condition for visibility, evaluated against conversation variables */
          condition?: string;
        };
        metadata?: Record<string, any>;
      }
    | {
        classifierId: string;
        input: string;
        actions: {
          classifierId: string;
          classifierName: string;
          actions: {
            name: string;
            parameters: Record<string, ParameterValue>;
          }[];
        }[];
        metadata?: Record<string, any>;
      }
    | {
        transformerId: string;
        input: string;
        appliedFields: string[];
        metadata?: Record<string, any>;
      }
    | {
        /** ID of the stage where execution is taking place */
        stageId: string;
        /** Names of all matched actions in original order */
        actions: string[];
        /** Final ordered list of effects after filtering, sorting, and conflict resolution */
        effects: {
          /** Name of the action this effect originates from */
          actionName: string;
          /** The effect to be executed */
          effect: Effect;
        }[];
        /** Lifecycle context in which execution is taking place; null for user-input-triggered executions */
        lifecycleContext:
          | "on_enter"
          | "on_leave"
          | "on_fallback"
          | "conversation_start"
          | "conversation_resume"
          | "conversation_end"
          | "conversation_abort"
          | "conversation_failed"
          | null;
        metadata?: Record<string, any>;
      }
    | {
        actionName: string;
        stageId: string;
        effects: Effect[];
        metadata?: Record<string, any>;
      }
    | {
        command:
          | "go_to_stage"
          | "set_var"
          | "get_var"
          | "get_all_vars"
          | "run_action"
          | "call_tool";
        parameters?: Record<string, ParameterValue>;
        metadata?: Record<string, any>;
      }
    | {
        toolId: string;
        toolName: string;
        toolType?: "smart_function" | "webhook" | "script";
        parameters: Record<string, ParameterValue>;
        success: boolean;
        result?: any;
        error?: string;
        /** Name of the action that triggered this tool call, if triggered by an action effect */
        sourceActionName?: string;
        metadata?: Record<string, any>;
      }
    | {
        stageId: string;
        initialVariables?: Record<string, ParameterValue>;
        metadata?: Record<string, any>;
      }
    | {
        previousStatus:
          | "initialized"
          | "awaiting_user_input"
          | "receiving_user_voice"
          | "processing_user_input"
          | "generating_response"
          | "finished"
          | "aborted"
          | "failed";
        stageId: string;
        metadata?: Record<string, any>;
      }
    | {
        reason?: string;
        stageId: string;
        /** Name of the action that triggered conversation end, if triggered by an action effect */
        sourceActionName?: string;
        metadata?: Record<string, any>;
      }
    | {
        reason: string;
        stageId: string;
        /** Name of the action that triggered conversation abort, if triggered by an action effect */
        sourceActionName?: string;
        metadata?: Record<string, any>;
      }
    | {
        reason: string;
        stageId?: string;
        metadata?: Record<string, any>;
      }
    | {
        fromStageId: string;
        toStageId: string;
        /** Name of the action that triggered this stage jump, if triggered by an action effect */
        sourceActionName?: string;
        metadata?: Record<string, any>;
      }
    | {
        input: string;
        flagged: boolean;
        blockingCategories: string[];
        detectedCategories: string[];
        durationMs: number;
        startMs: number;
        endMs: number;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered this variable update */
        sourceActionName: string;
        /** Snapshot of all conversation variables after the update */
        variables: Record<string, ParameterValue>;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered this profile update */
        sourceActionName: string;
        /** Updated user profile data */
        profile: Record<string, ParameterValue>;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered this input modification */
        sourceActionName: string;
        /** The modified user input after template rendering */
        modifiedInput: string;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered the ban */
        sourceActionName: string;
        /** Optional reason for the ban */
        reason?: string;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered this visibility change */
        sourceActionName: string;
        /** The new visibility settings for current turn messages */
        visibility: {
          /** Visibility setting for the message: always (always visible), stage (visible only in current stage), never (never visible), conditional (visible based on condition) */
          visibility: "always" | "stage" | "never" | "conditional";
          /** Condition for visibility, evaluated against conversation variables */
          condition?: string;
        };
        metadata?: Record<string, any>;
      }
    | {
        /** ID of the classifier that performed the selection */
        classifierId: string;
        /** The user input that triggered the selection */
        input: string;
        /** Identifier of selected sample copy, or null if none was selected */
        sampleCopy: string | null;
        metadata?: Record<string, any>;
      };
  /** ID of the stage that was active when the event occurred */
  stageId: string | null;
  /**
   * Timestamp when the event occurred
   * @format date-time
   */
  timestamp: string | null;
  /** Additional metadata associated with the event */
  metadata: Record<string, any>;
}

export interface ConversationEventListResponse {
  /** Array of conversation events in the current page */
  items: {
    /** Unique identifier for the conversation event */
    id: string;
    /** ID of the project this event belongs to */
    projectId: string;
    /** Identifier of the conversation this event belongs to */
    conversationId: string;
    /** Type of the conversation event */
    eventType:
      | "message"
      | "classification"
      | "transformation"
      | "execution_plan"
      | "action"
      | "command"
      | "tool_call"
      | "conversation_start"
      | "conversation_resume"
      | "conversation_end"
      | "conversation_aborted"
      | "conversation_failed"
      | "jump_to_stage"
      | "moderation"
      | "variables_updated"
      | "user_profile_updated"
      | "user_input_modified"
      | "user_banned"
      | "visibility_changed"
      | "sample_copy_selection";
    /** Event data payload */
    eventData:
      | {
          role: "user" | "assistant";
          text: string;
          originalText: string;
          visibility?: {
            /** Visibility setting for the message: always (always visible), stage (visible only in current stage), never (never visible), conditional (visible based on condition) */
            visibility: "always" | "stage" | "never" | "conditional";
            /** Condition for visibility, evaluated against conversation variables */
            condition?: string;
          };
          metadata?: Record<string, any>;
        }
      | {
          classifierId: string;
          input: string;
          actions: {
            classifierId: string;
            classifierName: string;
            actions: {
              name: string;
              parameters: Record<string, ParameterValue>;
            }[];
          }[];
          metadata?: Record<string, any>;
        }
      | {
          transformerId: string;
          input: string;
          appliedFields: string[];
          metadata?: Record<string, any>;
        }
      | {
          /** ID of the stage where execution is taking place */
          stageId: string;
          /** Names of all matched actions in original order */
          actions: string[];
          /** Final ordered list of effects after filtering, sorting, and conflict resolution */
          effects: {
            /** Name of the action this effect originates from */
            actionName: string;
            /** The effect to be executed */
            effect: Effect;
          }[];
          /** Lifecycle context in which execution is taking place; null for user-input-triggered executions */
          lifecycleContext:
            | "on_enter"
            | "on_leave"
            | "on_fallback"
            | "conversation_start"
            | "conversation_resume"
            | "conversation_end"
            | "conversation_abort"
            | "conversation_failed"
            | null;
          metadata?: Record<string, any>;
        }
      | {
          actionName: string;
          stageId: string;
          effects: Effect[];
          metadata?: Record<string, any>;
        }
      | {
          command:
            | "go_to_stage"
            | "set_var"
            | "get_var"
            | "get_all_vars"
            | "run_action"
            | "call_tool";
          parameters?: Record<string, ParameterValue>;
          metadata?: Record<string, any>;
        }
      | {
          toolId: string;
          toolName: string;
          toolType?: "smart_function" | "webhook" | "script";
          parameters: Record<string, ParameterValue>;
          success: boolean;
          result?: any;
          error?: string;
          /** Name of the action that triggered this tool call, if triggered by an action effect */
          sourceActionName?: string;
          metadata?: Record<string, any>;
        }
      | {
          stageId: string;
          initialVariables?: Record<string, ParameterValue>;
          metadata?: Record<string, any>;
        }
      | {
          previousStatus:
            | "initialized"
            | "awaiting_user_input"
            | "receiving_user_voice"
            | "processing_user_input"
            | "generating_response"
            | "finished"
            | "aborted"
            | "failed";
          stageId: string;
          metadata?: Record<string, any>;
        }
      | {
          reason?: string;
          stageId: string;
          /** Name of the action that triggered conversation end, if triggered by an action effect */
          sourceActionName?: string;
          metadata?: Record<string, any>;
        }
      | {
          reason: string;
          stageId: string;
          /** Name of the action that triggered conversation abort, if triggered by an action effect */
          sourceActionName?: string;
          metadata?: Record<string, any>;
        }
      | {
          reason: string;
          stageId?: string;
          metadata?: Record<string, any>;
        }
      | {
          fromStageId: string;
          toStageId: string;
          /** Name of the action that triggered this stage jump, if triggered by an action effect */
          sourceActionName?: string;
          metadata?: Record<string, any>;
        }
      | {
          input: string;
          flagged: boolean;
          blockingCategories: string[];
          detectedCategories: string[];
          durationMs: number;
          startMs: number;
          endMs: number;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered this variable update */
          sourceActionName: string;
          /** Snapshot of all conversation variables after the update */
          variables: Record<string, ParameterValue>;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered this profile update */
          sourceActionName: string;
          /** Updated user profile data */
          profile: Record<string, ParameterValue>;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered this input modification */
          sourceActionName: string;
          /** The modified user input after template rendering */
          modifiedInput: string;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered the ban */
          sourceActionName: string;
          /** Optional reason for the ban */
          reason?: string;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered this visibility change */
          sourceActionName: string;
          /** The new visibility settings for current turn messages */
          visibility: {
            /** Visibility setting for the message: always (always visible), stage (visible only in current stage), never (never visible), conditional (visible based on condition) */
            visibility: "always" | "stage" | "never" | "conditional";
            /** Condition for visibility, evaluated against conversation variables */
            condition?: string;
          };
          metadata?: Record<string, any>;
        }
      | {
          /** ID of the classifier that performed the selection */
          classifierId: string;
          /** The user input that triggered the selection */
          input: string;
          /** Identifier of selected sample copy, or null if none was selected */
          sampleCopy: string | null;
          metadata?: Record<string, any>;
        };
    /** ID of the stage that was active when the event occurred */
    stageId: string | null;
    /**
     * Timestamp when the event occurred
     * @format date-time
     */
    timestamp: string | null;
    /** Additional metadata associated with the event */
    metadata: Record<string, any>;
  }[];
  /**
   * Total number of events matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateStageRequest {
  /**
   * Unique identifier for the stage (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name for the stage
   * @minLength 1
   */
  name: string;
  /** Detailed description of the stage purpose */
  description?: string;
  /**
   * System prompt that defines the stage behavior and instructions
   * @minLength 1
   */
  prompt: string;
  /**
   * ID of the LLM provider to use for this stage
   * @minLength 1
   */
  llmProviderId: string;
  /** LLM provider-specific settings for this stage */
  llmSettings: LlmSettings;
  /**
   * ID of the agent associated with this stage
   * @minLength 1
   */
  agentId: string;
  /**
   * What should happen when entering the stage
   * @default "generate_response"
   */
  enterBehavior?: "generate_response" | "await_user_input";
  /**
   * Whether to use knowledge base in this stage
   * @default false
   */
  useKnowledge?: boolean;
  /**
   * List of knowledge tags to include
   * @default []
   */
  knowledgeTags?: string[];
  /**
   * Whether to enable global actions in this stage
   * @default true
   */
  useGlobalActions?: boolean;
  /**
   * List of global action IDs available in this stage
   * @default []
   */
  globalActions?: string[];
  /**
   * Variable descriptor definitions for this stage
   * @default []
   */
  variableDescriptors?: FieldDescriptor[];
  /** Action definitions for this stage */
  actions?: Record<string, StageAction>;
  /** ID of the default classifier to use for this stage (can be overridden per action) */
  defaultClassifierId?: string | null;
  /**
   * List of context transformer IDs to use in this stage
   * @default []
   */
  transformerIds?: string[];
  /**
   * Tags for categorizing and filtering this stage
   * @default []
   */
  tags?: string[];
  /** Additional stage-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateStageRequest {
  /**
   * Updated display name for the stage
   * @minLength 1
   */
  name?: string;
  /** Updated detailed description of the stage */
  description?: string | null;
  /**
   * Updated system prompt
   * @minLength 1
   */
  prompt?: string;
  /**
   * Updated LLM provider ID
   * @minLength 1
   */
  llmProviderId?: string;
  /** Updated LLM provider-specific settings */
  llmSettings?: LlmSettings;
  /**
   * Updated agent ID
   * @minLength 1
   */
  agentId?: string;
  /** Updated behavior when entering this stage */
  enterBehavior?: "generate_response" | "await_user_input";
  /** Updated knowledge usage flag */
  useKnowledge?: boolean;
  /** Updated knowledge tags */
  knowledgeTags?: string[];
  /** Updated global actions flag */
  useGlobalActions?: boolean;
  /** Updated global action IDs */
  globalActions?: string[];
  /** Updated variable descriptor definitions */
  variableDescriptors?: FieldDescriptor[];
  /** Updated action definitions */
  actions?: Record<string, StageAction>;
  /** Updated default classifier ID */
  defaultClassifierId?: string | null;
  /** Updated transformer IDs */
  transformerIds?: string[];
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteStageRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface StageResponse {
  /** Unique identifier for the stage */
  id: string;
  /** ID of the project this stage belongs to */
  projectId: string;
  /** Display name for the stage */
  name: string;
  /** Detailed description of the stage purpose */
  description: string | null;
  /** System prompt defining the stage behavior */
  prompt: string;
  /** ID of the LLM provider */
  llmProviderId: string | null;
  /** LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** ID of the associated agent */
  agentId: string;
  /** What happens when entering the stage */
  enterBehavior: "generate_response" | "await_user_input";
  /** Whether knowledge base is enabled */
  useKnowledge: boolean;
  /** Knowledge tags included in this stage */
  knowledgeTags: string[];
  /** Whether global actions are enabled */
  useGlobalActions: boolean;
  /** Global action IDs available in this stage */
  globalActions: string[];
  /** Variable descriptor definitions */
  variableDescriptors: FieldDescriptor[];
  /** Action definitions */
  actions: Record<string, StageAction>;
  /** Default classifier ID used in this stage (actions can override with overrideClassifierId) */
  defaultClassifierId: string | null;
  /** Context transformer IDs used in this stage */
  transformerIds: string[];
  /** Tags for categorizing and filtering this stage */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the stage was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the stage was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface StageListResponse {
  /** Array of stages in the current page */
  items: {
    /** Unique identifier for the stage */
    id: string;
    /** ID of the project this stage belongs to */
    projectId: string;
    /** Display name for the stage */
    name: string;
    /** Detailed description of the stage purpose */
    description: string | null;
    /** System prompt defining the stage behavior */
    prompt: string;
    /** ID of the LLM provider */
    llmProviderId: string | null;
    /** LLM provider-specific settings */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /** ID of the associated agent */
    agentId: string;
    /** What happens when entering the stage */
    enterBehavior: "generate_response" | "await_user_input";
    /** Whether knowledge base is enabled */
    useKnowledge: boolean;
    /** Knowledge tags included in this stage */
    knowledgeTags: string[];
    /** Whether global actions are enabled */
    useGlobalActions: boolean;
    /** Global action IDs available in this stage */
    globalActions: string[];
    /** Variable descriptor definitions */
    variableDescriptors: FieldDescriptor[];
    /** Action definitions */
    actions: Record<string, StageAction>;
    /** Default classifier ID used in this stage (actions can override with overrideClassifierId) */
    defaultClassifierId: string | null;
    /** Context transformer IDs used in this stage */
    transformerIds: string[];
    /** Tags for categorizing and filtering this stage */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the stage was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the stage was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of stages matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateClassifierRequest {
  /**
   * Unique identifier for the classifier (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the classifier
   * @minLength 1
   */
  name: string;
  /** Detailed description of the classifier's purpose and behavior */
  description?: string | null;
  /**
   * Prompt that defines the classification logic and instructions
   * @minLength 1
   */
  prompt: string;
  /**
   * ID of the LLM provider to use for this classifier
   * @minLength 1
   */
  llmProviderId: string;
  /** LLM provider-specific settings for this classifier */
  llmSettings: LlmSettings;
  /**
   * Tags for categorizing and filtering this classifier
   * @default []
   */
  tags?: string[];
  /** Additional classifier-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateClassifierRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated classification prompt
   * @minLength 1
   */
  prompt?: string;
  /**
   * Updated LLM provider ID
   * @minLength 1
   */
  llmProviderId?: string;
  /** Updated LLM provider-specific settings */
  llmSettings?: LlmSettings;
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteClassifierRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface ClassifierResponse {
  /** Unique identifier for the classifier */
  id: string;
  /** ID of the project this classifier belongs to */
  projectId: string;
  /** Display name of the classifier */
  name: string;
  /** Detailed description of the classifier */
  description: string | null;
  /** Prompt defining the classification logic */
  prompt: string;
  /** ID of the LLM provider */
  llmProviderId: string | null;
  /** LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Tags for categorizing and filtering this classifier */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the classifier was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the classifier was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface ClassifierListResponse {
  /** Array of classifiers in the current page */
  items: {
    /** Unique identifier for the classifier */
    id: string;
    /** ID of the project this classifier belongs to */
    projectId: string;
    /** Display name of the classifier */
    name: string;
    /** Detailed description of the classifier */
    description: string | null;
    /** Prompt defining the classification logic */
    prompt: string;
    /** ID of the LLM provider */
    llmProviderId: string | null;
    /** LLM provider-specific settings */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /** Tags for categorizing and filtering this classifier */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the classifier was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the classifier was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of classifiers matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateContextTransformerRequest {
  /**
   * Unique identifier for the context transformer (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the context transformer
   * @minLength 1
   */
  name: string;
  /** Detailed description of the transformer's purpose and behavior */
  description?: string | null;
  /**
   * Prompt that defines the transformation logic and instructions
   * @minLength 1
   */
  prompt: string;
  /** List of context field names to be transformed */
  contextFields?: string[];
  /**
   * ID of the LLM provider to use for this transformer
   * @minLength 1
   */
  llmProviderId: string;
  /** LLM provider-specific settings for this transformer */
  llmSettings: LlmSettings;
  /**
   * Tags for categorizing and filtering this context transformer
   * @default []
   */
  tags?: string[];
  /** Additional transformer-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateContextTransformerRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated transformation prompt
   * @minLength 1
   */
  prompt?: string;
  /** Updated context field names */
  contextFields?: string[];
  /**
   * Updated LLM provider ID
   * @minLength 1
   */
  llmProviderId?: string;
  /** Updated LLM provider-specific settings */
  llmSettings?: LlmSettings;
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteContextTransformerRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface ContextTransformerResponse {
  /** Unique identifier for the context transformer */
  id: string;
  /** ID of the project this context transformer belongs to */
  projectId: string;
  /** Display name of the context transformer */
  name: string;
  /** Detailed description of the transformer */
  description: string | null;
  /** Prompt defining the transformation logic */
  prompt: string;
  /** Context field names to be transformed */
  contextFields: string[] | null;
  /** ID of the LLM provider */
  llmProviderId: string | null;
  /** LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Tags for categorizing and filtering this context transformer */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the transformer was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the transformer was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface ContextTransformerListResponse {
  /** Array of context transformers in the current page */
  items: {
    /** Unique identifier for the context transformer */
    id: string;
    /** ID of the project this context transformer belongs to */
    projectId: string;
    /** Display name of the context transformer */
    name: string;
    /** Detailed description of the transformer */
    description: string | null;
    /** Prompt defining the transformation logic */
    prompt: string;
    /** Context field names to be transformed */
    contextFields: string[] | null;
    /** ID of the LLM provider */
    llmProviderId: string | null;
    /** LLM provider-specific settings */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /** Tags for categorizing and filtering this context transformer */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the transformer was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the transformer was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of context transformers matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateSmartFunctionTool {
  /**
   * Unique identifier for the tool (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the tool
   * @minLength 1
   */
  name: string;
  /** Detailed description of the tool's purpose and behavior */
  description?: string | null;
  /**
   * Parameters that this tool expects to receive
   * @default []
   */
  parameters?: ToolParameter[];
  /**
   * Tags for categorizing and filtering this tool
   * @default []
   */
  tags?: string[];
  /** Additional tool-specific metadata */
  metadata?: Record<string, any>;
  /** Tool executes an LLM call */
  type: "smart_function";
  /**
   * Handlebars template rendered before being sent to the LLM
   * @minLength 1
   */
  prompt: string;
  /** ID of the LLM provider to use for this tool */
  llmProviderId: string;
  /** LLM provider-specific settings for this tool */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Expected input format for the tool */
  inputType: "text" | "image" | "multi-modal";
  /** Expected output format from the tool */
  outputType: "text" | "image" | "multi-modal";
}

export interface CreateWebhookTool {
  /**
   * Unique identifier for the tool (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the tool
   * @minLength 1
   */
  name: string;
  /** Detailed description of the tool's purpose and behavior */
  description?: string | null;
  /**
   * Parameters that this tool expects to receive
   * @default []
   */
  parameters?: ToolParameter[];
  /**
   * Tags for categorizing and filtering this tool
   * @default []
   */
  tags?: string[];
  /** Additional tool-specific metadata */
  metadata?: Record<string, any>;
  /** Tool makes an HTTP request */
  type: "webhook";
  /**
   * Target URL — supports Handlebars templating
   * @format uri
   */
  url: string;
  /**
   * HTTP method to use
   * @default "GET"
   */
  webhookMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** HTTP headers to send; values support Handlebars templating */
  webhookHeaders?: Record<string, string>;
  /** Request body template (Handlebars); used for POST/PUT/PATCH */
  webhookBody?: string;
}

export interface CreateScriptTool {
  /**
   * Unique identifier for the tool (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the tool
   * @minLength 1
   */
  name: string;
  /** Detailed description of the tool's purpose and behavior */
  description?: string | null;
  /**
   * Parameters that this tool expects to receive
   * @default []
   */
  parameters?: ToolParameter[];
  /**
   * Tags for categorizing and filtering this tool
   * @default []
   */
  tags?: string[];
  /** Additional tool-specific metadata */
  metadata?: Record<string, any>;
  /** Tool executes isolated JavaScript code */
  type: "script";
  /**
   * JavaScript code to execute in an isolated VM context
   * @minLength 1
   */
  code: string;
}

export interface UpdateSmartFunctionTool {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /** Updated parameters for the tool (smart_function) */
  parameters?: ToolParameter[];
  /** Updated tags (smart_function) */
  tags?: string[];
  /** Updated metadata (smart_function) */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking (smart_function)
   * @min 1
   */
  version: number;
  /** Tool executes an LLM call */
  type: "smart_function";
  /**
   * Updated Handlebars prompt template
   * @minLength 1
   */
  prompt?: string;
  /** Updated LLM provider ID */
  llmProviderId: string;
  /** Updated LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Updated input format (smart_function) */
  inputType: "text" | "image" | "multi-modal";
  /** Updated output format (smart_function) */
  outputType: "text" | "image" | "multi-modal";
}

export interface UpdateWebhookTool {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /** Updated parameters for the tool (smart_function) */
  parameters?: ToolParameter[];
  /** Updated tags (smart_function) */
  tags?: string[];
  /** Updated metadata (smart_function) */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking (smart_function)
   * @min 1
   */
  version: number;
  /** Tool makes an HTTP request */
  type: "webhook";
  /**
   * Updated target URL (webhook)
   * @format uri
   */
  url: string;
  /** Updated HTTP method (webhook) */
  webhookMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Updated HTTP headers (webhook) */
  webhookHeaders?: Record<string, string>;
  /** Updated request body template (webhook) */
  webhookBody?: string | null;
}

export interface UpdateScriptTool {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /** Updated parameters for the tool (smart_function) */
  parameters?: ToolParameter[];
  /** Updated tags (smart_function) */
  tags?: string[];
  /** Updated metadata (smart_function) */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking (smart_function)
   * @min 1
   */
  version: number;
  /** Tool executes isolated JavaScript code */
  type: "script";
  /**
   * Updated JavaScript code (script)
   * @minLength 1
   */
  code: string;
}

export interface DeleteToolRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface ToolResponse {
  /** Unique identifier for the tool */
  id: string;
  /** ID of the project this tool belongs to */
  projectId: string;
  /** Display name of the tool */
  name: string;
  /** Detailed description of the tool */
  description: string | null;
  /** Tool execution type */
  type: "smart_function" | "webhook" | "script";
  /** Handlebars prompt template (smart_function only) */
  prompt: string | null;
  /** ID of the LLM provider (smart_function only) */
  llmProviderId: string | null;
  /** LLM provider-specific settings (smart_function only) */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Expected input format (smart_function only) */
  inputType: "text" | "image" | "multi-modal" | null;
  /** Expected output format (smart_function only) */
  outputType: "text" | "image" | "multi-modal" | null;
  /** Target URL (webhook only) */
  url: string | null;
  /** HTTP method (webhook only) */
  webhookMethod: string | null;
  /** HTTP headers (webhook only) */
  webhookHeaders: Record<string, string>;
  /** Request body template (webhook only) */
  webhookBody: string | null;
  /** JavaScript code (script only) */
  code: string | null;
  /** Parameters that this tool expects to receive */
  parameters: ToolParameter[];
  /** Tags for categorizing and filtering this tool */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the tool was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the tool was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface ToolListResponse {
  /** Array of tools in the current page */
  items: {
    /** Unique identifier for the tool */
    id: string;
    /** ID of the project this tool belongs to */
    projectId: string;
    /** Display name of the tool */
    name: string;
    /** Detailed description of the tool */
    description: string | null;
    /** Tool execution type */
    type: "smart_function" | "webhook" | "script";
    /** Handlebars prompt template (smart_function only) */
    prompt: string | null;
    /** ID of the LLM provider (smart_function only) */
    llmProviderId: string | null;
    /** LLM provider-specific settings (smart_function only) */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /** Expected input format (smart_function only) */
    inputType: "text" | "image" | "multi-modal" | null;
    /** Expected output format (smart_function only) */
    outputType: "text" | "image" | "multi-modal" | null;
    /** Target URL (webhook only) */
    url: string | null;
    /** HTTP method (webhook only) */
    webhookMethod: string | null;
    /** HTTP headers (webhook only) */
    webhookHeaders: Record<string, string>;
    /** Request body template (webhook only) */
    webhookBody: string | null;
    /** JavaScript code (script only) */
    code: string | null;
    /** Parameters that this tool expects to receive */
    parameters: ToolParameter[];
    /** Tags for categorizing and filtering this tool */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the tool was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the tool was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of tools matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateGlobalActionRequest {
  /**
   * Unique identifier for the global action (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the global action
   * @minLength 1
   */
  name: string;
  /** Optional condition expression for action activation */
  condition?: string | null;
  /**
   * Whether this action should be triggered on user input
   * @default true
   */
  triggerOnUserInput?: boolean;
  /**
   * Whether this action should be triggered on client commands
   * @default false
   */
  triggerOnClientCommand?: boolean;
  /** Optional classification label that triggers this action */
  classificationTrigger?: string | null;
  /** Optional classifier ID - if set, this action is only enumerated for that specific classifier */
  overrideClassifierId?: string | null;
  /** Optional array of parameters to extract from user input */
  parameters?: StageActionParameter[];
  /** Array of effects to execute when action is triggered */
  effects?: Effect[];
  /** Example phrases that trigger this action */
  examples?: string[];
  /**
   * Tags for categorizing and filtering this global action
   * @default []
   */
  tags?: string[];
  /** Additional action-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateGlobalActionRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated condition expression */
  condition?: string | null;
  /** Updated trigger on user input flag */
  triggerOnUserInput?: boolean;
  /** Updated trigger on client command flag */
  triggerOnClientCommand?: boolean;
  /** Updated classification trigger label */
  classificationTrigger?: string | null;
  /** Updated override classifier ID */
  overrideClassifierId?: string | null;
  /** Updated parameters array */
  parameters?: StageActionParameter[];
  /** Updated effects array */
  effects?: Effect[];
  /** Updated example phrases */
  examples?: string[];
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteGlobalActionRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface GlobalActionResponse {
  /** Unique identifier for the global action */
  id: string;
  /** ID of the project this global action belongs to */
  projectId: string;
  /** Display name of the global action */
  name: string;
  /** Condition expression for action activation */
  condition: string | null;
  /** Whether this action should be triggered on user input */
  triggerOnUserInput: boolean;
  /** Whether this action should be triggered on client commands */
  triggerOnClientCommand: boolean;
  /** Optional classification label that triggers this action */
  classificationTrigger: string | null;
  /** Optional classifier ID - if set, this action is only enumerated for that specific classifier */
  overrideClassifierId: string | null;
  /** Array of parameters to extract from user input */
  parameters: StageActionParameter[];
  /** Array of effects to execute */
  effects: Effect[];
  /** Example phrases that trigger this action */
  examples: string[] | null;
  /** Tags for categorizing and filtering this global action */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the global action was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the global action was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface GlobalActionListResponse {
  /** Array of global actions in the current page */
  items: {
    /** Unique identifier for the global action */
    id: string;
    /** ID of the project this global action belongs to */
    projectId: string;
    /** Display name of the global action */
    name: string;
    /** Condition expression for action activation */
    condition: string | null;
    /** Whether this action should be triggered on user input */
    triggerOnUserInput: boolean;
    /** Whether this action should be triggered on client commands */
    triggerOnClientCommand: boolean;
    /** Optional classification label that triggers this action */
    classificationTrigger: string | null;
    /** Optional classifier ID - if set, this action is only enumerated for that specific classifier */
    overrideClassifierId: string | null;
    /** Array of parameters to extract from user input */
    parameters: StageActionParameter[];
    /** Array of effects to execute */
    effects: Effect[];
    /** Example phrases that trigger this action */
    examples: string[] | null;
    /** Tags for categorizing and filtering this global action */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the global action was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the global action was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of global actions matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateEnvironmentRequest {
  /**
   * Unique identifier for the environment (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Human-readable description of the environment
   * @minLength 1
   */
  description: string;
  /**
   * Base URL of the target server instance
   * @format uri
   */
  url: string;
  /**
   * Authentication login/username for the environment
   * @minLength 1
   */
  login: string;
  /**
   * Authentication password for the environment
   * @minLength 1
   */
  password: string;
}

export interface UpdateEnvironmentRequest {
  /**
   * Updated environment description
   * @minLength 1
   */
  description?: string;
  /**
   * Updated base URL
   * @format uri
   */
  url?: string;
  /**
   * Updated authentication login
   * @minLength 1
   */
  login?: string;
  /**
   * Updated authentication password
   * @minLength 1
   */
  password?: string;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteEnvironmentRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface EnvironmentResponse {
  /** Unique identifier for the environment */
  id: string;
  /** Human-readable description of the environment */
  description: string;
  /** Base URL of the target server instance */
  url: string;
  /** Authentication login/username */
  login: string;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the environment was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the environment was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface EnvironmentListResponse {
  /** Array of environments in the current page */
  items: {
    /** Unique identifier for the environment */
    id: string;
    /** Human-readable description of the environment */
    description: string;
    /** Base URL of the target server instance */
    url: string;
    /** Authentication login/username */
    login: string;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the environment was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the environment was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of environments matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateGuardrailRequest {
  /**
   * Unique identifier for the guardrail (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the guardrail
   * @minLength 1
   */
  name: string;
  /** Optional JavaScript condition expression — when provided, the guardrail is only active when it evaluates to truthy */
  condition?: string | null;
  /** Classification label that the guardrail classifier should output to trigger this guardrail */
  classificationTrigger?: string | null;
  /** Array of effects to execute when the guardrail is triggered */
  effects?: Effect[];
  /** Example phrases that trigger this guardrail, used to help the classifier */
  examples?: string[];
  /**
   * Tags for categorizing and filtering this guardrail
   * @default []
   */
  tags?: string[];
  /** Additional guardrail-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateGuardrailRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated condition expression */
  condition?: string | null;
  /** Updated classification trigger label */
  classificationTrigger?: string | null;
  /** Updated effects array */
  effects?: Effect[];
  /** Updated example phrases */
  examples?: string[];
  /** Updated tags */
  tags?: string[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteGuardrailRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface CloneGuardrailRequest {
  /**
   * New ID for the cloned guardrail (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Name for the cloned guardrail (defaults to "{original name} (Clone)")
   * @minLength 1
   */
  name?: string;
}

export interface GuardrailResponse {
  /** Unique identifier for the guardrail */
  id: string;
  /** ID of the project this guardrail belongs to */
  projectId: string;
  /** Display name of the guardrail */
  name: string;
  /** Condition expression for guardrail activation */
  condition: string | null;
  /** Classification label that triggers this guardrail */
  classificationTrigger: string | null;
  /** Array of effects to execute */
  effects: Effect[];
  /** Example phrases that trigger this guardrail */
  examples: string[] | null;
  /** Tags for categorizing and filtering this guardrail */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the guardrail was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the guardrail was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface GuardrailListResponse {
  /** Array of guardrails in the current page */
  items: {
    /** Unique identifier for the guardrail */
    id: string;
    /** ID of the project this guardrail belongs to */
    projectId: string;
    /** Display name of the guardrail */
    name: string;
    /** Condition expression for guardrail activation */
    condition: string | null;
    /** Classification label that triggers this guardrail */
    classificationTrigger: string | null;
    /** Array of effects to execute */
    effects: Effect[];
    /** Example phrases that trigger this guardrail */
    examples: string[] | null;
    /** Tags for categorizing and filtering this guardrail */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the guardrail was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the guardrail was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of guardrails matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateProviderRequest {
  /**
   * Unique identifier for the provider (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Human-readable name for the provider
   * @minLength 1
   */
  name: string;
  /** Detailed description of provider purpose and use case */
  description?: string;
  /** Provider category: asr, tts, llm, or embeddings */
  providerType: "asr" | "tts" | "llm" | "embeddings" | "storage" | "channel";
  /** Specific provider implementation (e.g., openai, anthropic, azure, elevenlabs) */
  apiType: string;
  /** Provider-specific configuration object (varies by providerType and apiType) */
  config:
    | {
        /** OpenAI API key */
        apiKey: string;
        /** Optional organization ID */
        organizationId?: string;
        /** Optional base URL for OpenAI-compatible APIs */
        baseUrl?: string;
      }
    | {
        /** Anthropic API key */
        apiKey: string;
        /** Optional base URL for custom endpoints */
        baseUrl?: string;
      }
    | {
        /** Google API key */
        apiKey: string;
      }
    | {
        /** API key for authenticating with ElevenLabs */
        apiKey: string;
      }
    | {
        /** API key for authenticating with OpenAI */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Deepgram */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Cartesia */
        apiKey: string;
      }
    | {
        /** The Azure region to use for the speech service (e.g., "eastus", "westeurope") */
        region: string;
        /** The subscription key to use for the speech service */
        subscriptionKey: string;
      }
    | {
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | {
        /** API key for authenticating with AssemblyAI */
        apiKey: string;
        /**
         * AssemblyAI region endpoint: "us" for streaming.assemblyai.com or "eu" for streaming.eu.assemblyai.com
         * @default "us"
         */
        region?: "us" | "eu";
      }
    | {
        /** API key for authenticating with Speechmatics */
        apiKey: string;
        /**
         * Speechmatics region endpoint: "us" for neu.rt.speechmatics.com, "eu" for eu2.rt.speechmatics.com, or "apac" for au.rt.speechmatics.com
         * @default "us"
         */
        region?: "us" | "eu" | "apac";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig;
  /** Operator user ID who created the provider */
  createdBy?: string;
  /** Searchable tags for organization (e.g., ["production", "low-latency"]) */
  tags?: string[];
}

export interface TwilioMessagingChannelConfig {
  /** Twilio Account SID (starts with AC) */
  accountSid: string;
  /** Twilio Auth Token used for request signature validation and REST API authentication */
  authToken: string;
  /** Twilio phone number or WhatsApp sender in E.164 format (e.g. +15551234567) used as the "From" address for outbound messages */
  fromNumber: string;
}

export interface TwilioVoiceChannelConfig {
  /** Twilio Account SID (starts with AC) */
  accountSid: string;
  /** Twilio Auth Token used for webhook signature validation */
  authToken: string;
  /** Twilio phone number in E.164 format (e.g. +15551234567) */
  phoneNumber: string;
}

export interface UpdateProviderRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent updates)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
  /**
   * Updated human-readable name for the provider
   * @minLength 1
   */
  name?: string;
  /** Updated description of provider purpose */
  description?: string | null;
  /** Updated provider category */
  providerType?: "asr" | "tts" | "llm" | "embeddings" | "storage" | "channel";
  /** Updated specific provider implementation */
  apiType?: string;
  /** Updated provider-specific configuration */
  config?:
    | {
        /** OpenAI API key */
        apiKey: string;
        /** Optional organization ID */
        organizationId?: string;
        /** Optional base URL for OpenAI-compatible APIs */
        baseUrl?: string;
      }
    | {
        /** Anthropic API key */
        apiKey: string;
        /** Optional base URL for custom endpoints */
        baseUrl?: string;
      }
    | {
        /** Google API key */
        apiKey: string;
      }
    | {
        /** API key for authenticating with ElevenLabs */
        apiKey: string;
      }
    | {
        /** API key for authenticating with OpenAI */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Deepgram */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Cartesia */
        apiKey: string;
      }
    | {
        /** The Azure region to use for the speech service (e.g., "eastus", "westeurope") */
        region: string;
        /** The subscription key to use for the speech service */
        subscriptionKey: string;
      }
    | {
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | {
        /** API key for authenticating with AssemblyAI */
        apiKey: string;
        /**
         * AssemblyAI region endpoint: "us" for streaming.assemblyai.com or "eu" for streaming.eu.assemblyai.com
         * @default "us"
         */
        region?: "us" | "eu";
      }
    | {
        /** API key for authenticating with Speechmatics */
        apiKey: string;
        /**
         * Speechmatics region endpoint: "us" for neu.rt.speechmatics.com, "eu" for eu2.rt.speechmatics.com, or "apac" for au.rt.speechmatics.com
         * @default "us"
         */
        region?: "us" | "eu" | "apac";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig;
  /** Updated searchable tags */
  tags?: string[] | null;
}

export interface DeleteProviderRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent deletions)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
}

export interface ProviderResponse {
  /** Unique identifier for the provider */
  id: string;
  /** Human-readable name of the provider */
  name: string;
  /** Description of provider purpose and use case */
  description: string | null;
  /** Provider category (asr, tts, llm, embeddings) */
  providerType: "asr" | "tts" | "llm" | "embeddings" | "storage" | "channel";
  /** Specific provider implementation */
  apiType: string;
  /** Provider-specific configuration object */
  config:
    | {
        /** OpenAI API key */
        apiKey: string;
        /** Optional organization ID */
        organizationId?: string;
        /** Optional base URL for OpenAI-compatible APIs */
        baseUrl?: string;
      }
    | {
        /** Anthropic API key */
        apiKey: string;
        /** Optional base URL for custom endpoints */
        baseUrl?: string;
      }
    | {
        /** Google API key */
        apiKey: string;
      }
    | {
        /** API key for authenticating with ElevenLabs */
        apiKey: string;
      }
    | {
        /** API key for authenticating with OpenAI */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Deepgram */
        apiKey: string;
      }
    | {
        /** API key for authenticating with Cartesia */
        apiKey: string;
      }
    | {
        /** The Azure region to use for the speech service (e.g., "eastus", "westeurope") */
        region: string;
        /** The subscription key to use for the speech service */
        subscriptionKey: string;
      }
    | {
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | {
        /** API key for authenticating with AssemblyAI */
        apiKey: string;
        /**
         * AssemblyAI region endpoint: "us" for streaming.assemblyai.com or "eu" for streaming.eu.assemblyai.com
         * @default "us"
         */
        region?: "us" | "eu";
      }
    | {
        /** API key for authenticating with Speechmatics */
        apiKey: string;
        /**
         * Speechmatics region endpoint: "us" for neu.rt.speechmatics.com, "eu" for eu2.rt.speechmatics.com, or "apac" for au.rt.speechmatics.com
         * @default "us"
         */
        region?: "us" | "eu" | "apac";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig;
  /** Operator user ID who created the provider */
  createdBy: string | null;
  /** Tags for organization and search */
  tags: string[] | null;
  /** Current version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the provider was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the provider was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface ProviderListResponse {
  /** Array of providers in the current page */
  items: {
    /** Unique identifier for the provider */
    id: string;
    /** Human-readable name of the provider */
    name: string;
    /** Description of provider purpose and use case */
    description: string | null;
    /** Provider category (asr, tts, llm, embeddings) */
    providerType: "asr" | "tts" | "llm" | "embeddings" | "storage" | "channel";
    /** Specific provider implementation */
    apiType: string;
    /** Provider-specific configuration object */
    config:
      | {
          /** OpenAI API key */
          apiKey: string;
          /** Optional organization ID */
          organizationId?: string;
          /** Optional base URL for OpenAI-compatible APIs */
          baseUrl?: string;
        }
      | {
          /** Anthropic API key */
          apiKey: string;
          /** Optional base URL for custom endpoints */
          baseUrl?: string;
        }
      | {
          /** Google API key */
          apiKey: string;
        }
      | {
          /** API key for authenticating with ElevenLabs */
          apiKey: string;
        }
      | {
          /** API key for authenticating with OpenAI */
          apiKey: string;
        }
      | {
          /** API key for authenticating with Deepgram */
          apiKey: string;
        }
      | {
          /** API key for authenticating with Cartesia */
          apiKey: string;
        }
      | {
          /** The Azure region to use for the speech service (e.g., "eastus", "westeurope") */
          region: string;
          /** The subscription key to use for the speech service */
          subscriptionKey: string;
        }
      | {
          /** The Azure region to use for the speech recognition service */
          region: string;
          /** The subscription key to use for the speech recognition service */
          subscriptionKey: string;
        }
      | {
          /** API key for authenticating with AssemblyAI */
          apiKey: string;
          /**
           * AssemblyAI region endpoint: "us" for streaming.assemblyai.com or "eu" for streaming.eu.assemblyai.com
           * @default "us"
           */
          region?: "us" | "eu";
        }
      | {
          /** API key for authenticating with Speechmatics */
          apiKey: string;
          /**
           * Speechmatics region endpoint: "us" for neu.rt.speechmatics.com, "eu" for eu2.rt.speechmatics.com, or "apac" for au.rt.speechmatics.com
           * @default "us"
           */
          region?: "us" | "eu" | "apac";
        }
      | S3StorageConfig
      | AzureBlobStorageConfig
      | GcsStorageConfig
      | LocalStorageConfig
      | TwilioMessagingChannelConfig
      | TwilioVoiceChannelConfig;
    /** Operator user ID who created the provider */
    createdBy: string | null;
    /** Tags for organization and search */
    tags: string[] | null;
    /** Current version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the provider was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the provider was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of providers matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface ProviderModelsResponse {
  /** Available models for the provider */
  models: LlmModelInfo[];
}

export interface LlmModelInfo {
  /** Model identifier */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the model's capabilities and use cases */
  description?: string;
  /** Whether this is a recommended or default model */
  recommended?: boolean;
  /** Whether this model supports tool calling (function calling) */
  supportsToolCalling?: boolean;
  /** Whether this model supports structured JSON output */
  supportsJsonOutput?: boolean;
  /** Whether this model supports streaming responses */
  supportsStreaming?: boolean;
  /** Whether this model supports vision/image input */
  supportsVision?: boolean;
  /** Whether this model supports image generation output */
  supportsImageGeneration?: boolean;
  /** Whether this model supports reasoning/thinking modes for deeper analysis */
  supportsReasoning?: boolean;
  /** Context window size (in tokens) for this model */
  contextWindow?: number;
}

export interface AsrModelInfo {
  /** Model identifier */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the model's capabilities and use cases */
  description?: string;
  /** Whether this is a recommended or default model */
  recommended?: boolean;
  /** Language codes supported by this model (if model-specific) */
  languages?: string[];
  /** Whether this model supports custom vocabulary/phrases */
  supportsCustomVocabulary?: boolean;
  /** Whether this model supports streaming transcription */
  supportsStreaming?: boolean;
  /** Audio input formats supported by this model */
  supportedAudioFormats?: string[];
}

export interface VoiceInfo {
  /** Voice identifier */
  id: string;
  /** Human-readable name */
  displayName: string;
  /** Description of voice characteristics */
  description?: string;
  /** Gender of the voice (if applicable) */
  gender?: "male" | "female" | "neutral";
  /** Languages supported by this voice */
  languages?: string[];
  /** Whether this is a recommended or default voice */
  recommended?: boolean;
}

export interface LanguageInfo {
  /** ISO language code (e.g., 'en-US', 'es-ES') */
  code: string;
  /** Human-readable language name */
  displayName: string;
}

export interface TtsModelInfo {
  /** Model identifier */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the model's capabilities and use cases */
  description?: string;
  /** Whether this is a recommended or default model */
  recommended?: boolean;
  /** Model-specific voices that override provider-level voices */
  voices?: VoiceInfo[];
  /** Language codes supported by this model (if model-specific) */
  languages?: string[];
  /** Whether this model supports full streaming (chunk-by-chunk) */
  supportsFullStreaming?: boolean;
  /** Whether this model supports voice customization settings */
  supportsVoiceSettings?: boolean;
  /** Audio output formats supported by this model */
  supportedAudioFormats?: string[];
}

export interface ModerationCategoryInfo {
  /** Category identifier — use this exact string in moderationConfig.blockedCategories */
  name: string;
  /** Human-readable category name */
  displayName: string;
  /** What kind of content this category covers */
  description?: string;
}

export interface ModerationModelInfo {
  /** Model identifier to use in configuration */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the model's capabilities */
  description?: string;
  /** Whether this is the recommended model for the provider */
  recommended?: boolean;
  /** Content categories detected by this model */
  categories: ModerationCategoryInfo[];
}

export interface ModerationProviderInfo {
  /** Provider API type — must match an LLM provider configured in the system */
  apiType: string;
  /** Human-readable provider name */
  displayName: string;
  /** Additional information */
  description?: string;
  /** Moderation models available for this provider */
  models: ModerationModelInfo[];
}

export interface ProviderCatalog {
  /** ASR providers */
  asr: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: AsrModelInfo[];
    /** Languages commonly supported across models (for reference) */
    languages: LanguageInfo[];
    /** Additional information */
    description?: string;
  }[];
  /** TTS providers */
  tts: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: TtsModelInfo[];
    /** Voices available (can be provider-specific or model-specific) */
    voices: VoiceInfo[];
    /** Languages commonly supported across models (for reference) */
    languages: LanguageInfo[];
    /** Additional information */
    description?: string;
  }[];
  /** LLM providers */
  llm: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: LlmModelInfo[];
    /** Additional information */
    description?: string;
  }[];
  /** Storage providers */
  storage: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Additional information */
    description?: string;
    /** List of supported features */
    features?: string[];
  }[];
  /** Moderation providers */
  moderation: ModerationProviderInfo[];
  /** Communication channel providers */
  channel: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Additional information */
    description?: string;
    /** List of supported features */
    features?: string[];
  }[];
}

export interface AsrProvidersResponse {
  /** List of ASR providers */
  providers: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: AsrModelInfo[];
    /** Languages commonly supported across models (for reference) */
    languages: LanguageInfo[];
    /** Additional information */
    description?: string;
  }[];
}

export interface TtsProvidersResponse {
  /** List of TTS providers */
  providers: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: TtsModelInfo[];
    /** Voices available (can be provider-specific or model-specific) */
    voices: VoiceInfo[];
    /** Languages commonly supported across models (for reference) */
    languages: LanguageInfo[];
    /** Additional information */
    description?: string;
  }[];
}

export interface LlmProvidersResponse {
  /** List of LLM providers */
  providers: {
    /** Provider API type */
    apiType: string;
    /** Human-readable provider name */
    displayName: string;
    /** Models available for this provider */
    models: LlmModelInfo[];
    /** Additional information */
    description?: string;
  }[];
}

export interface AsrProviderInfo {
  /** Provider API type */
  apiType: string;
  /** Human-readable provider name */
  displayName: string;
  /** Models available for this provider */
  models: AsrModelInfo[];
  /** Languages commonly supported across models (for reference) */
  languages: LanguageInfo[];
  /** Additional information */
  description?: string;
}

export interface TtsProviderInfo {
  /** Provider API type */
  apiType: string;
  /** Human-readable provider name */
  displayName: string;
  /** Models available for this provider */
  models: TtsModelInfo[];
  /** Voices available (can be provider-specific or model-specific) */
  voices: VoiceInfo[];
  /** Languages commonly supported across models (for reference) */
  languages: LanguageInfo[];
  /** Additional information */
  description?: string;
}

export interface LlmProviderInfo {
  /** Provider API type */
  apiType: string;
  /** Human-readable provider name */
  displayName: string;
  /** Models available for this provider */
  models: LlmModelInfo[];
  /** Additional information */
  description?: string;
}

export interface AuditLogResponse {
  /** Unique identifier for the audit log entry */
  id: string;
  /** ID of the operator user who performed the action */
  userId: string | null;
  /** Action performed (CREATE, UPDATE, DELETE) */
  action: string;
  /** ID of the entity that was modified */
  entityId: string;
  /** Type of the entity (e.g., "operator", "agent", "classifier") */
  entityType: string;
  /** ID of the project associated with the entity */
  projectId: string | null;
  /** Entity state before the change */
  oldEntity: Record<string, any>;
  /** Entity state after the change */
  newEntity: Record<string, any>;
  /**
   * Timestamp when the audit log was created
   * @format date-time
   */
  createdAt: string | null;
}

export interface AuditLogListResponse {
  /** Array of audit logs in the current page */
  items: {
    /** Unique identifier for the audit log entry */
    id: string;
    /** ID of the operator user who performed the action */
    userId: string | null;
    /** Action performed (CREATE, UPDATE, DELETE) */
    action: string;
    /** ID of the entity that was modified */
    entityId: string;
    /** Type of the entity (e.g., "operator", "agent", "classifier") */
    entityType: string;
    /** ID of the project associated with the entity */
    projectId: string | null;
    /** Entity state before the change */
    oldEntity: Record<string, any>;
    /** Entity state after the change */
    newEntity: Record<string, any>;
    /**
     * Timestamp when the audit log was created
     * @format date-time
     */
    createdAt: string | null;
  }[];
  /**
   * Total number of audit logs matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface ApiKeySettings {
  /** Permitted transport channels. If absent, all channels (websocket, webrtc) are allowed. */
  allowedChannels?: (
    | "websocket"
    | "webrtc"
    | "twilio_voice"
    | "twilio_messaging"
  )[];
  /** Permitted feature capabilities. If absent, all features are allowed. */
  allowedFeatures?: (
    | "conversation_control"
    | "voice_input"
    | "text_input"
    | "voice_output"
    | "text_output"
    | "vars_access"
    | "stage_control"
    | "run_action"
    | "call_tool"
    | "events"
  )[];
}

export interface CreateApiKeyRequest {
  /**
   * A descriptive name for the API key
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** Additional metadata for the API key */
  metadata?: Record<string, any>;
  /** Security settings controlling which channels and features this key permits. If absent, all channels and features are allowed. */
  keySettings?: ApiKeySettings;
}

export interface UpdateApiKeyRequest {
  /**
   * The updated name for the API key
   * @minLength 1
   * @maxLength 255
   */
  name?: string;
  /** Whether the API key is active and can be used for authentication */
  isActive?: boolean;
  /** Updated metadata for the API key */
  metadata?: Record<string, any>;
  /** Updated security settings. If absent, existing settings are preserved. */
  keySettings?: ApiKeySettings;
  /** The current version number for optimistic locking */
  version: number;
}

export interface DeleteApiKeyRequest {
  /** The current version number for optimistic locking */
  version: number;
}

export interface ApiKeyResponse {
  /** Unique identifier for the API key */
  id: string;
  /** The ID of the project this API key belongs to */
  projectId: string;
  /** Descriptive name for the API key */
  name: string;
  /** The secret API key string (only included when creating a new key) */
  key?: string;
  /** First few characters of the key for identification */
  keyPreview?: string;
  /** ISO timestamp of when the key was last used */
  lastUsedAt: string | null;
  /** Whether the API key is active */
  isActive: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Security settings controlling which channels and features this key permits */
  keySettings?: {
    /** Permitted transport channels. If absent, all channels (websocket, webrtc) are allowed. */
    allowedChannels?: (
      | "websocket"
      | "webrtc"
      | "twilio_voice"
      | "twilio_messaging"
    )[];
    /** Permitted feature capabilities. If absent, all features are allowed. */
    allowedFeatures?: (
      | "conversation_control"
      | "voice_input"
      | "text_input"
      | "voice_output"
      | "text_output"
      | "vars_access"
      | "stage_control"
      | "run_action"
      | "call_tool"
      | "events"
    )[];
  } | null;
  /** Version number for optimistic locking */
  version: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface ApiKeyListResponse {
  /** Array of API keys */
  items: {
    /** Unique identifier for the API key */
    id: string;
    /** The ID of the project this API key belongs to */
    projectId: string;
    /** Descriptive name for the API key */
    name: string;
    /** The secret API key string (only included when creating a new key) */
    key?: string;
    /** First few characters of the key for identification */
    keyPreview?: string;
    /** ISO timestamp of when the key was last used */
    lastUsedAt: string | null;
    /** Whether the API key is active */
    isActive: boolean;
    /** Additional metadata */
    metadata?: Record<string, any>;
    /** Security settings controlling which channels and features this key permits */
    keySettings?: {
      /** Permitted transport channels. If absent, all channels (websocket, webrtc) are allowed. */
      allowedChannels?: (
        | "websocket"
        | "webrtc"
        | "twilio_voice"
        | "twilio_messaging"
      )[];
      /** Permitted feature capabilities. If absent, all features are allowed. */
      allowedFeatures?: (
        | "conversation_control"
        | "voice_input"
        | "text_input"
        | "voice_output"
        | "text_output"
        | "vars_access"
        | "stage_control"
        | "run_action"
        | "call_tool"
        | "events"
      )[];
    } | null;
    /** Version number for optimistic locking */
    version: number;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /** Total number of API keys matching the query */
  total: number;
}

export interface LatencyMetric {
  /** Number of data points */
  count: number;
  /** Average value in milliseconds */
  avg: number | null;
  /** Median (p50) value in milliseconds */
  median: number | null;
  /** 95th percentile value in milliseconds */
  p95: number | null;
  /** Minimum value in milliseconds */
  min: number | null;
  /** Maximum value in milliseconds */
  max: number | null;
}

export interface PercentileSet {
  /** 50th percentile (median) in milliseconds */
  p50: number | null;
  /** 75th percentile in milliseconds */
  p75: number | null;
  /** 90th percentile in milliseconds */
  p90: number | null;
  /** 95th percentile in milliseconds */
  p95: number | null;
  /** 99th percentile in milliseconds */
  p99: number | null;
}

export interface LatencyTrendPoint {
  /** Time bucket start (ISO 8601) */
  bucket: string;
  /** Number of turns in this bucket */
  turnCount: number;
  /** Average total turn duration in this bucket */
  avgTotalTurnDurationMs: number | null;
  /** Average TTFT in this bucket */
  avgTimeToFirstTokenMs: number | null;
  /** Average LLM duration in this bucket */
  avgLlmDurationMs: number | null;
  /** Average time to first audio in this bucket */
  avgTimeToFirstAudioMs: number | null;
}

export interface TokenUsageByEventType {
  /** Event type (message, classification, transformation, tool_call) */
  eventType: string;
  /** Number of events with token usage data */
  eventCount: number;
  /** Total prompt (input) tokens */
  totalPromptTokens: number;
  /** Total completion (output) tokens */
  totalCompletionTokens: number;
  /** Total tokens (prompt + completion) */
  totalTokens: number;
}

export interface TokenUsageTrendPoint {
  /** Time bucket start (ISO 8601) */
  bucket: string;
  /** Number of events with token usage data in this bucket */
  eventCount: number;
  /** Total prompt tokens in this bucket */
  totalPromptTokens: number;
  /** Total completion tokens in this bucket */
  totalCompletionTokens: number;
  /** Total tokens in this bucket */
  totalTokens: number;
}

export interface SourceDimension {
  /** Dimension identifier used in groupBy[] and filters */
  id: string;
  /** Human-readable label */
  label: string;
  /** Known enumerable values, if applicable */
  values?: string[];
}

export interface SourceMetric {
  /** Metric identifier used in metrics[] after the aggregation function */
  id: string;
  /** Human-readable label */
  label: string;
  /** Unit of measurement */
  unit: "ms" | "tokens" | "count" | "boolean";
}

export interface SourceEntry {
  /** Source identifier used in the source query parameter */
  id: string;
  /** Human-readable label */
  label: string;
  /** Description of what this source provides */
  description: string;
  /** Available dimensions for groupBy and filtering */
  dimensions: SourceDimension[];
  /** Available numeric metrics for aggregation */
  metrics: SourceMetric[];
}

export interface SliceQueryRow {
  /** Time bucket start (ISO 8601) if interval is set, null otherwise */
  bucket: string | null;
  /** Dimension values for this group */
  dimensions: Record<string, string | null>;
  /** Metric values for this group, keyed by the metric spec from the request */
  metrics: Record<string, number | null>;
}

export interface SavedSliceQuery {
  /** Unique identifier of the saved query */
  id: string;
  /** Name of the saved query */
  name: string;
  /** Project this query belongs to */
  projectId: string;
  /** Operator who created this query, or null if the operator has been deleted */
  operatorId: string | null;
  /** The saved slice query configuration */
  query: SliceQuery;
  /** Whether this query is visible to all operators in the project */
  isShared: boolean;
  /** Arbitrary key-value metadata, e.g. chart display settings from the UI */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the query was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the query was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

/** The saved slice query configuration */
export interface SliceQuery {
  /** Analytics source to query */
  source:
    | "conversations"
    | "events"
    | "turns"
    | "tool_calls"
    | "classifications"
    | "transformations"
    | "moderation"
    | "stage_visits"
    | "llm_calls";
  /**
   * Dimension IDs to group results by (max 5)
   * @maxItems 5
   * @default []
   */
  groupBy?: string[];
  /** Time bucket interval for time-series aggregation */
  interval?: "hour" | "day" | "week" | "month";
  /**
   * Metric specifications: "count" or "{aggFn}:{metricId}" (e.g. "avg:durationMs", "p95:totalTurnDurationMs")
   * @maxItems 10
   * @minItems 1
   */
  metrics: string[];
  /** Dimension ID to use as the inner aggregation unit for two-phase aggregation. When set, metrics are first summed within each (groupBy + normalizeBy) group, then the requested aggregation function is applied across those sums. Example: normalizeBy=conversationId with avg:promptTokens gives the average total prompt tokens per conversation. Not compatible with the bare "count" metric. */
  normalizeBy?: string;
  /** Relative time range (e.g. { amount: 7, unit: "days" }). Mutually exclusive with from/to — takes precedence if all three are provided. */
  relativeTime?: RelativeTime;
  /**
   * Start of the date range (inclusive). ISO 8601 format. Ignored when relativeTime is set.
   * @format date-time
   */
  from?: string | null;
  /**
   * End of the date range (inclusive). ISO 8601 format. Ignored when relativeTime is set.
   * @format date-time
   */
  to?: string | null;
  /** Filter to a single conversation */
  conversationId?: string;
  /** Additional equality filters: key = dimension ID, value = exact match value */
  filters?: Record<string, string>;
  /**
   * Maximum number of rows to return (default 1000, max 10000)
   * @min 1
   * @max 10000
   * @default 1000
   */
  limit?: number;
}

/** Relative time range (e.g. { amount: 7, unit: "days" }). Mutually exclusive with from/to — takes precedence if all three are provided. */
export interface RelativeTime {
  /**
   * Number of units to look back
   * @min 1
   * @max 100000
   */
  amount: number;
  /** Time unit */
  unit: "hours" | "days" | "weeks" | "months";
}

export interface ChannelCapabilities {
  /** Whether the channel supports receiving audio from the user */
  supportsVoiceInput: boolean;
  /** Whether the channel supports receiving text messages from the user */
  supportsTextInput: boolean;
  /** Whether the channel supports sending audio to the user */
  supportsVoiceOutput: boolean;
  /** Whether the channel supports sending text messages to the user */
  supportsTextOutput: boolean;
  /** Whether the channel supports client-sent commands (e.g. go-to-stage, set-var) */
  supportsCommands: boolean;
  /** Whether the channel supports server-sent event notifications */
  supportsEvents: boolean;
  /** Whether the channel can accept user-initiated sessions (e.g. a client opening a WebSocket connection or a user calling a Twilio number) */
  supportsIncomingConnections: boolean;
  /** Whether the channel can initiate sessions to users (e.g. placing an outbound Twilio call or sending a proactive SMS) */
  supportsOutgoingConnections: boolean;
  /** Audio formats accepted by this channel for voice input/output. Only present when voice is supported. */
  supportedAudioFormats?: (
    | "mp3"
    | "opus"
    | "aac"
    | "flac"
    | "wav"
    | "pcm_8000"
    | "pcm_16000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100"
    | "pcm_48000"
    | "mulaw"
    | "alaw"
  )[];
}

export interface ChannelInfo {
  /** Unique channel type identifier, e.g. "websocket" or "webrtc" */
  type: string;
  /** Human-friendly channel name, e.g. "WebSocket" or "WebRTC" */
  name: string;
  /** Capabilities supported by this channel */
  capabilities: ChannelCapabilities;
}

export interface ChannelCatalogResponse {
  /** List of all channels supported by this backend instance */
  channels: ChannelInfo[];
}

export interface CreateSampleCopyRequest {
  /**
   * Unique identifier for the sample copy (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the sample copy, used as identifier throughout the system
   * @minLength 1
   */
  name: string;
  /** Optional array of stage IDs this sample copy applies to */
  stages?: string[];
  /** Optional array of agent IDs this sample copy applies to */
  agents?: string[];
  /**
   * Trigger string used by the classifier to activate this sample copy
   * @minLength 1
   */
  promptTrigger: string;
  /** ID of the classifier to use; if not set the default classifier will be used */
  classifierOverrideId?: string | null;
  /**
   * Array of variant answers to select from
   * @minItems 1
   */
  content: string[];
  /**
   * Number of samples to select from the content array
   * @min 1
   * @default 1
   */
  amount?: number;
  /**
   * Method used to select samples: random selection or sequential round-robin
   * @default "random"
   */
  samplingMethod?: "random" | "round_robin";
  /**
   * Mode of the sample copy: regular works as normal, forced enforces the prescripted response and ignores other response-related effects
   * @default "regular"
   */
  mode?: "regular" | "forced";
  /** ID of the copy decorator to apply to selected content; if not set no decoration is applied */
  decoratorId?: string | null;
}

export interface UpdateSampleCopyRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated array of stage IDs */
  stages?: string[] | null;
  /** Updated array of agent IDs */
  agents?: string[] | null;
  /**
   * Updated classifier trigger string
   * @minLength 1
   */
  promptTrigger?: string;
  /** Updated classifier override ID */
  classifierOverrideId?: string | null;
  /**
   * Updated array of variant answers
   * @minItems 1
   */
  content?: string[];
  /**
   * Updated number of samples to select
   * @min 1
   */
  amount?: number;
  /** Updated sampling method */
  samplingMethod?: "random" | "round_robin";
  /** Updated mode: regular works as normal, forced enforces the prescripted response and ignores other response-related effects */
  mode?: "regular" | "forced";
  /** Updated copy decorator ID; set to null to remove the decorator */
  decoratorId?: string | null;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteSampleCopyRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface SampleCopyResponse {
  /** Unique identifier for the sample copy */
  id: string;
  /** ID of the project this sample copy belongs to */
  projectId: string;
  /** Display name of the sample copy */
  name: string;
  /** Array of stage IDs this sample copy applies to */
  stages: string[] | null;
  /** Array of agent IDs this sample copy applies to */
  agents: string[] | null;
  /** Trigger string used by the classifier */
  promptTrigger: string;
  /** ID of the classifier override, or null if using the default */
  classifierOverrideId: string | null;
  /** Array of variant answers */
  content: string[];
  /** Number of samples to select */
  amount: number;
  /** Method used to select samples */
  samplingMethod: "random" | "round_robin";
  /** Mode of the sample copy: regular works as normal, forced enforces the prescripted response and ignores other response-related effects */
  mode: "regular" | "forced";
  /** ID of the copy decorator applied to selected content, or null if none */
  decoratorId: string | null;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the sample copy was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the sample copy was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface SampleCopyListResponse {
  /** Array of sample copies in the current page */
  items: {
    /** Unique identifier for the sample copy */
    id: string;
    /** ID of the project this sample copy belongs to */
    projectId: string;
    /** Display name of the sample copy */
    name: string;
    /** Array of stage IDs this sample copy applies to */
    stages: string[] | null;
    /** Array of agent IDs this sample copy applies to */
    agents: string[] | null;
    /** Trigger string used by the classifier */
    promptTrigger: string;
    /** ID of the classifier override, or null if using the default */
    classifierOverrideId: string | null;
    /** Array of variant answers */
    content: string[];
    /** Number of samples to select */
    amount: number;
    /** Method used to select samples */
    samplingMethod: "random" | "round_robin";
    /** Mode of the sample copy: regular works as normal, forced enforces the prescripted response and ignores other response-related effects */
    mode: "regular" | "forced";
    /** ID of the copy decorator applied to selected content, or null if none */
    decoratorId: string | null;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the sample copy was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the sample copy was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of sample copies matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface CreateCopyDecoratorRequest {
  /**
   * Unique identifier for the copy decorator (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Human-readable display name of the copy decorator
   * @minLength 1
   */
  name: string;
  /**
   * Template string used to decorate selected sample copy content
   * @minLength 1
   */
  template: string;
}

export interface UpdateCopyDecoratorRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /**
   * Updated template string
   * @minLength 1
   */
  template?: string;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteCopyDecoratorRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface CopyDecoratorResponse {
  /** Unique identifier for the copy decorator */
  id: string;
  /** ID of the project this copy decorator belongs to */
  projectId: string;
  /** Human-readable display name of the copy decorator */
  name: string;
  /** Template string used to decorate sample copy content */
  template: string;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the copy decorator was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the copy decorator was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /** Whether this entity belongs to an archived project */
  archived?: boolean;
}

export interface CopyDecoratorListResponse {
  /** Array of copy decorators in the current page */
  items: {
    /** Unique identifier for the copy decorator */
    id: string;
    /** ID of the project this copy decorator belongs to */
    projectId: string;
    /** Human-readable display name of the copy decorator */
    name: string;
    /** Template string used to decorate sample copy content */
    template: string;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the copy decorator was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the copy decorator was last updated
     * @format date-time
     */
    updatedAt: string | null;
    /** Whether this entity belongs to an archived project */
    archived?: boolean;
  }[];
  /**
   * Total number of copy decorators matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
   * @min 0
   * @exclusiveMin true
   * @max 1000
   * @default 100
   */
  limit?: number | null;
}

export interface VersionResponse {
  /** Semantic version of the application as defined in package.json (e.g. "1.2.3"). */
  version: string;
  /** First 12 hex chars of the SHA-256 hash of the REST OpenAPI schema. Changes only when a REST API contract changes. */
  restSchemaHash: string;
  /** First 12 hex chars of the SHA-256 hash of the WebSocket contracts schema. Changes only when a WebSocket contract changes. */
  wsSchemaHash: string;
  /** Short git commit SHA of the running build, injected via the GIT_COMMIT environment variable. Null when not set. */
  gitCommit: string | null;
}

export interface EntityStub {
  /** Entity ID */
  id: string;
  /** Entity name or display label */
  name: string;
  /** ID of the owning project — present for all project-scoped entities */
  projectId?: string;
}

export interface MigrationEntityCount {
  /** Entity type name (e.g. "providers", "stages") */
  entity: string;
  /** Number of records upserted, or counted in a dry run */
  count: number;
}

export interface MigrationResult {
  /** Per-entity-type counts in FK-safe dependency order */
  upserted: MigrationEntityCount[];
  /** REST schema hash embedded in the imported bundle */
  sourceRestSchemaHash: string;
  /** REST schema hash of this instance at import time */
  localRestSchemaHash: string;
  /** Whether the source and local REST schema hashes matched */
  schemaHashMatch: boolean;
  /** True if no data was written to the database */
  dryRun: boolean;
  /** Total migration duration in milliseconds */
  durationMs: number;
}

export interface MigrationJob {
  /** Unique job identifier */
  id: string;
  /** Current job status */
  status: "pending" | "running" | "completed" | "failed";
  /** Source environment ID */
  environmentId: string;
  /** Entity selection used for this pull */
  selection: MigrationSelection;
  /** Whether this is a dry run */
  dryRun: boolean;
  /**
   * ISO timestamp when the job was queued
   * @format date-time
   */
  startedAt: string;
  /**
   * ISO timestamp when the job finished (success or failure)
   * @format date-time
   */
  completedAt?: string;
  /** Migration result — available when status is "completed" */
  result?: MigrationResult;
  /** Error description — available when status is "failed" */
  error?: string;
}

/** Entity selection used for this pull */
export interface MigrationSelection {
  /** Specific project IDs to include. Pulls all child entities (stages, agents, classifiers, etc.) for these projects. */
  projectIds?: string[];
  /** Specific stage IDs to include. Transitively pulls in the stage's agent, classifiers, context transformers, global actions, and all referenced providers. */
  stageIds?: string[];
  /** Specific agent IDs to include. Pulls in referenced TTS provider. */
  agentIds?: string[];
  /** Specific classifier IDs to include. Pulls in referenced LLM provider. */
  classifierIds?: string[];
  /** Specific context transformer IDs to include. Pulls in referenced LLM provider. */
  contextTransformerIds?: string[];
  /** Specific tool IDs to include. Pulls in referenced LLM provider. */
  toolIds?: string[];
  /** Specific global action IDs to include. */
  globalActionIds?: string[];
  /** Specific knowledge category IDs to include. All child knowledge items are always included. */
  knowledgeCategoryIds?: string[];
  /** Specific provider IDs to include (in addition to any transitively required ones). */
  providerIds?: string[];
  /** Specific API key IDs to include. */
  apiKeyIds?: string[];
}

export interface MigrationPreview {
  /** Total number of entities across all types */
  totalCount: number;
  /** Provider stubs that would be included */
  providers: EntityStub[];
  /** Project stubs that would be included */
  projects: EntityStub[];
  /** Agent stubs that would be included */
  agents: EntityStub[];
  /** Classifier stubs that would be included */
  classifiers: EntityStub[];
  /** Context transformer stubs that would be included */
  contextTransformers: EntityStub[];
  /** Tool stubs that would be included */
  tools: EntityStub[];
  /** Global action stubs that would be included */
  globalActions: EntityStub[];
  /** Knowledge category stubs that would be included */
  knowledgeCategories: EntityStub[];
  /** Knowledge item stubs that would be included — name is the question text */
  knowledgeItems: EntityStub[];
  /** Stage stubs that would be included */
  stages: EntityStub[];
  /** API key stubs that would be included */
  apiKeys: EntityStub[];
}

export interface ExportBundle {
  /**
   * ISO timestamp when the bundle was generated
   * @format date-time
   */
  exportedAt: string;
  /** REST schema hash of the source instance at export time — used for compatibility checking on import */
  restSchemaHash: string;
  /** Base URL of the source instance (informational, not used for requests) */
  sourceUrl?: string;
  /** The selection criteria that produced this bundle */
  selection: MigrationSelection;
  /** Provider stub records — config (API credentials) is stripped on export; credentials must be reconfigured on the target after import */
  providers: Record<string, any>[];
  /** Project records */
  projects: Record<string, any>[];
  /** Agent records — depend on projects */
  agents: Record<string, any>[];
  /** Classifier records — depend on projects */
  classifiers: Record<string, any>[];
  /** Context transformer records — depend on projects */
  contextTransformers: Record<string, any>[];
  /** Tool records — depend on projects */
  tools: Record<string, any>[];
  /** Global action records — depend on projects */
  globalActions: Record<string, any>[];
  /** Knowledge category records — depend on projects */
  knowledgeCategories: Record<string, any>[];
  /** Knowledge item records — depend on knowledgeCategories */
  knowledgeItems: Record<string, any>[];
  /** Stage records — depend on projects, agents, and classifiers */
  stages: Record<string, any>[];
  /** API key records — depend on projects */
  apiKeys: Record<string, any>[];
}

/** Provider-agnostic reference that identifies the kind of provider needed without carrying credentials or a specific UUID */
export interface ProviderHint {
  /** Category of the provider (llm, tts, asr, storage, embeddings) */
  type: "llm" | "tts" | "asr" | "storage" | "embeddings";
  /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
  apiType: string;
  /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
  preferredModel?: string;
}

/** Entity field that references a particular provider hint */
export interface ProviderHintResolutionTarget {
  /** Type of entity that references this provider hint */
  entityType:
    | "project"
    | "agent"
    | "stage"
    | "classifier"
    | "contextTransformer"
    | "tool";
  /** New ID assigned to the entity on import */
  entityId: string;
  /** Display name of the entity */
  entityName: string;
  /** Field that holds the provider reference, e.g. "ttsProviderId", "llmProviderId", "asrConfig.asrProviderId", "fillerSettings.llmProviderId" */
  field: string;
}

/** Resolution report for a single provider hint encountered during import */
export interface ProviderHintResolution {
  /** The provider hint as it appeared in the bundle */
  hint: ProviderHint;
  /** Local provider ID the hint resolved to, or null when no matching provider was found */
  resolvedProviderId: string | null;
  /** True when a matching local provider was found; false means the corresponding provider field was set to null after import */
  resolved: boolean;
  /** Entity fields that reference this hint — shows exactly which entities were affected and which field was mapped (or left null) */
  targets: ProviderHintResolutionTarget[];
}

/** ASR configuration with provider hint instead of provider UUID */
export interface AsrConfigExchangeV1 {
  /** Provider hint identifying the ASR provider type used at export time */
  asrHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  };
  /** ASR-specific settings including model, language preferences, etc. */
  settings?:
    | AzureAsrSettings
    | ElevenLabsAsrSettings
    | DeepgramAsrSettings
    | AssemblyAiAsrSettings
    | SpeechmaticsAsrSettings;
  /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
  unintelligiblePlaceholder?: string;
  /** Whether to enable voice activity detection */
  voiceActivityDetection?: boolean;
  /** Server-side VAD configuration */
  serverVad?: ServerVadConfig;
}

/** Storage configuration with provider hint instead of provider UUID */
export interface StorageConfigExchangeV1 {
  /** Provider hint identifying the storage provider type used at export time */
  storageHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  };
  /** Storage-specific settings including bucket, prefix, etc. */
  settings?: Record<string, any>;
}

/** Content moderation configuration with provider hint instead of provider UUID */
export interface ModerationConfigExchangeV1 {
  /** Whether content moderation is enabled for this project */
  enabled: boolean;
  /** Provider hint identifying the LLM provider used for moderation */
  llmHint: ProviderHint;
  /** List of category names that should cause the input to be blocked */
  blockedCategories?: string[];
  /** Moderation execution mode: "strict" (default) runs before all processing; "standard" runs in parallel with filler generation */
  mode?: "strict" | "standard";
}

/** Filler response settings with provider hint instead of provider UUID */
export interface FillerSettingsExchangeV1 {
  /** Provider hint identifying the LLM provider used to generate filler sentences */
  llmHint: ProviderHint;
  /** LLM provider-specific settings for filler generation */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /**
   * Prompt instructing the LLM to produce a short neutral filler sentence
   * @minLength 1
   */
  prompt: string;
}

/** Project entity in the exchange format */
export interface ProjectExchangeV1 {
  /** Local document ID used as a cross-reference by child entities; remapped to a fresh UUID on import */
  id: string;
  /**
   * The name of the project
   * @minLength 1
   */
  name: string;
  /** A description of the project */
  description?: string | null;
  /** ASR configuration with provider hint */
  asrConfig?: AsrConfigExchangeV1;
  /** Whether conversations can accept voice input */
  acceptVoice?: boolean;
  /** Whether conversations generate voice responses */
  generateVoice?: boolean;
  /** Storage configuration with provider hint */
  storageConfig?: StorageConfigExchangeV1;
  /** Content moderation configuration with provider hint */
  moderationConfig?: {
    /** Whether content moderation is enabled for this project */
    enabled: boolean;
    /** Provider hint identifying the LLM provider used for moderation */
    llmHint: ProviderHint;
    /** List of category names that should cause the input to be blocked */
    blockedCategories?: string[];
    /** Moderation execution mode: "strict" (default) runs before all processing; "standard" runs in parallel with filler generation */
    mode?: "strict" | "standard";
  } | null;
  /** Key-value store of constants used in templating and conversation logic */
  constants?: Record<string, ParameterValue>;
  /** Additional metadata for the project */
  metadata?: Record<string, any>;
  /** IANA timezone identifier, e.g. Europe/Warsaw or America/New_York */
  timezone?: string | null;
  /** ISO language code for the project, e.g. en-US or pl-PL */
  languageCode?: string | null;
  /** When enabled, users are automatically created on first WebSocket connection */
  autoCreateUsers?: boolean;
  /** Descriptors defining the data schema for user profile variables */
  userProfileVariableDescriptors?: FieldDescriptor[];
  /** Local document ID of the classifier used to evaluate guardrails; remapped on import */
  defaultGuardrailClassifierId?: string | null;
  /**
   * Timeout in seconds for active conversations with no activity
   * @min 0
   */
  conversationTimeoutSeconds?: number | null;
}

/** Agent entity in the exchange format */
export interface AgentExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the agent */
  name: string;
  /** Detailed description of the agent purpose */
  description?: string | null;
  /** Prompt defining the agent's characteristics and behavior */
  prompt: string;
  /** Provider hint identifying the TTS provider used at export time */
  ttsHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  } | null;
  /** TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings;
  /** Tags for categorizing and filtering this agent */
  tags?: string[];
  /** Additional agent-specific metadata */
  metadata?: Record<string, any>;
  /** Filler response settings with provider hint */
  fillerSettings?: {
    /** Provider hint identifying the LLM provider used to generate filler sentences */
    llmHint: ProviderHint;
    /** LLM provider-specific settings for filler generation */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /**
     * Prompt instructing the LLM to produce a short neutral filler sentence
     * @minLength 1
     */
    prompt: string;
  } | null;
}

/** Stage entity in the exchange format */
export interface StageExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the stage */
  name: string;
  /** Detailed description of the stage purpose */
  description?: string | null;
  /** System prompt defining the stage behavior */
  prompt: string;
  /** Provider hint identifying the LLM provider used at export time */
  llmHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  } | null;
  /** LLM provider-specific settings for this stage */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Local document ID of the associated agent; remapped on import */
  agentId: string;
  /** What happens when entering this stage */
  enterBehavior?: "generate_response" | "await_user_input";
  /** Whether knowledge base is enabled in this stage */
  useKnowledge?: boolean;
  /** Knowledge tags included in this stage */
  knowledgeTags?: string[];
  /** Whether global actions are enabled in this stage */
  useGlobalActions?: boolean;
  /** Local document IDs of global actions available in this stage; remapped on import */
  globalActions?: string[];
  /** Variable descriptor definitions for this stage */
  variableDescriptors?: FieldDescriptor[];
  /** Action definitions for this stage */
  actions?: Record<string, StageAction>;
  /** Local document ID of the default classifier; remapped on import */
  defaultClassifierId?: string | null;
  /** Local document IDs of context transformers; remapped on import */
  transformerIds?: string[];
  /** Tags for categorizing and filtering this stage */
  tags?: string[];
  /** Additional stage-specific metadata */
  metadata?: Record<string, any>;
}

/** Classifier entity in the exchange format */
export interface ClassifierExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the classifier */
  name: string;
  /** Detailed description of the classifier */
  description?: string | null;
  /** Prompt defining the classification logic */
  prompt: string;
  /** Provider hint identifying the LLM provider used at export time */
  llmHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  } | null;
  /** LLM provider-specific settings for this classifier */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Tags for categorizing and filtering this classifier */
  tags?: string[];
  /** Additional classifier-specific metadata */
  metadata?: Record<string, any>;
}

/** Context transformer entity in the exchange format */
export interface ContextTransformerExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the context transformer */
  name: string;
  /** Detailed description of the transformer */
  description?: string | null;
  /** Prompt defining the transformation logic */
  prompt: string;
  /** Context field names to be transformed */
  contextFields?: string[] | null;
  /** Provider hint identifying the LLM provider used at export time */
  llmHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  } | null;
  /** LLM provider-specific settings for this transformer */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Tags for categorizing and filtering this context transformer */
  tags?: string[];
  /** Additional transformer-specific metadata */
  metadata?: Record<string, any>;
}

/** Tool entity in the exchange format */
export interface ToolExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the tool */
  name: string;
  /** Detailed description of the tool */
  description?: string | null;
  /**
   * Tool execution type: smart_function (LLM-based), webhook (HTTP call), script (JavaScript)
   * @default "smart_function"
   */
  type?: "smart_function" | "webhook" | "script";
  /** Handlebars template for tool invocation (smart_function only) */
  prompt?: string | null;
  /** Provider hint identifying the LLM provider used at export time (smart_function only) */
  llmHint?: {
    /** Category of the provider (llm, tts, asr, storage, embeddings) */
    type: "llm" | "tts" | "asr" | "storage" | "embeddings";
    /** Provider implementation identifier, e.g. "openai", "anthropic", "elevenlabs", "azure", "deepgram" */
    apiType: string;
    /** Optional: model name that was in use at export time, carried as a hint for the operator configuring the target instance */
    preferredModel?: string;
  } | null;
  /** LLM provider-specific settings for this tool (smart_function only) */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Expected input format for the tool (smart_function only) */
  inputType?: "text" | "image" | "multi-modal" | null;
  /** Expected output format from the tool (smart_function only) */
  outputType?: "text" | "image" | "multi-modal" | null;
  /** Target URL — supports Handlebars templating (webhook only) */
  url?: string | null;
  /** HTTP method to use (webhook only) */
  webhookMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | null;
  /** HTTP headers to send; values support Handlebars templating (webhook only) */
  webhookHeaders?: Record<string, string>;
  /** Request body template (Handlebars); used for POST/PUT/PATCH (webhook only) */
  webhookBody?: string | null;
  /** JavaScript code to execute in an isolated VM context (script only) */
  code?: string | null;
  /** Parameters that this tool expects to receive */
  parameters?: ToolParameter[];
  /** Tags for categorizing and filtering this tool */
  tags?: string[];
  /** Additional tool-specific metadata */
  metadata?: Record<string, any>;
}

/** Global action entity in the exchange format */
export interface GlobalActionExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the global action */
  name: string;
  /** Optional condition expression for action activation */
  condition?: string | null;
  /** Whether this action is triggered on user input */
  triggerOnUserInput?: boolean;
  /** Whether this action is triggered on client commands */
  triggerOnClientCommand?: boolean;
  /** Classification label that triggers this action */
  classificationTrigger?: string | null;
  /** Local document ID of an override classifier; remapped on import */
  overrideClassifierId?: string | null;
  /** Parameters to extract from user input */
  parameters?: StageActionParameter[];
  /** Effects to execute when action is triggered */
  effects?: Effect[];
  /** Example phrases that trigger this action */
  examples?: string[] | null;
  /** Tags for categorizing and filtering this global action */
  tags?: string[];
  /** Additional action-specific metadata */
  metadata?: Record<string, any>;
}

/** Guardrail entity in the exchange format */
export interface GuardrailExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Display name of the guardrail */
  name: string;
  /** Condition expression for guardrail activation */
  condition?: string | null;
  /** Classification label that triggers this guardrail */
  classificationTrigger?: string | null;
  /** Effects to execute when the guardrail is triggered */
  effects?: Effect[];
  /** Example phrases that trigger this guardrail */
  examples?: string[] | null;
  /** Tags for categorizing and filtering this guardrail */
  tags?: string[];
  /** Additional guardrail-specific metadata */
  metadata?: Record<string, any>;
}

/** Knowledge category entity in the exchange format */
export interface KnowledgeCategoryExchangeV1 {
  /** Local document ID used by knowledge items; remapped to a fresh UUID on import */
  id: string;
  /** Name of the knowledge category */
  name: string;
  /** Trigger phrase that activates this category in conversations */
  promptTrigger: string;
  /** Array of knowledge tags this category belongs to */
  tags?: string[];
  /**
   * Display order for the category
   * @min 0
   */
  order?: number;
}

/** Knowledge item entity in the exchange format */
export interface KnowledgeItemExchangeV1 {
  /** Local document ID; remapped to a fresh UUID on import */
  id: string;
  /** Local document ID of the parent knowledge category; remapped on import */
  categoryId: string;
  /** Question text for this knowledge item */
  question: string;
  /** Answer text for this knowledge item */
  answer: string;
  /**
   * Display order within the category
   * @min 0
   */
  order?: number;
}

/** Version 1 project exchange bundle — self-contained, provider-agnostic snapshot of a complete project */
export interface ProjectExchangeBundleV1 {
  /** Exchange format version. Always 1 for this schema revision. */
  formatVersion: 1;
  /**
   * ISO 8601 timestamp of when this bundle was produced
   * @format date-time
   */
  exportedAt: string;
  /** Project configuration and settings */
  project: ProjectExchangeV1;
  /** Agent entities belonging to this project */
  agents: AgentExchangeV1[];
  /** Stage entities belonging to this project */
  stages: StageExchangeV1[];
  /** Classifier entities belonging to this project */
  classifiers: ClassifierExchangeV1[];
  /** Context transformer entities belonging to this project */
  contextTransformers: ContextTransformerExchangeV1[];
  /** Tool entities belonging to this project */
  tools: ToolExchangeV1[];
  /** Global action entities belonging to this project */
  globalActions: GlobalActionExchangeV1[];
  /** Guardrail entities belonging to this project */
  guardrails: GuardrailExchangeV1[];
  /** Knowledge category entities belonging to this project */
  knowledgeCategories: KnowledgeCategoryExchangeV1[];
  /** Knowledge item entities belonging to this project */
  knowledgeItems: KnowledgeItemExchangeV1[];
}

/** Summary of a completed project import operation */
export interface ProjectExchangeImportResult {
  /** Newly assigned ID of the imported project */
  projectId: string;
  /** Count of each entity type that was created */
  counts: {
    /** Number of agents imported */
    agents: number;
    /** Number of stages imported */
    stages: number;
    /** Number of classifiers imported */
    classifiers: number;
    /** Number of context transformers imported */
    contextTransformers: number;
    /** Number of tools imported */
    tools: number;
    /** Number of global actions imported */
    globalActions: number;
    /** Number of guardrails imported */
    guardrails: number;
    /** Number of knowledge categories imported */
    knowledgeCategories: number;
    /** Number of knowledge items imported */
    knowledgeItems: number;
  };
  /** Resolution report for every unique provider hint found in the bundle. Each entry shows what the hint requested and which local provider it mapped to. Entries with resolved=false indicate provider fields that were set to null — the affected entities will need their provider re-configured manually. */
  providerResolution: ProviderHintResolution[];
}

export interface LatencyStatsResponse {
  /** Total number of turns matching the query */
  totalTurns: number;
  /** Total turn duration from start to completion */
  totalTurnDurationMs: LatencyMetric;
  /** Time from LLM call start to first token */
  timeToFirstTokenMs: LatencyMetric;
  /** Time from turn start to first LLM token */
  timeToFirstTokenFromTurnStartMs: LatencyMetric;
  /** Time from turn start to first audio chunk (voice only) */
  timeToFirstAudioMs: LatencyMetric;
  /** Total LLM call duration */
  llmDurationMs: LatencyMetric;
  /** TTS synthesis duration (voice only) */
  ttsDurationMs: LatencyMetric;
  /** TTS WebSocket connection duration (voice only) */
  ttsConnectDurationMs: LatencyMetric;
  /** Stage transition duration when a go_to_stage effect fired */
  stageTransitionDurationMs: LatencyMetric;
  /** Prompt template rendering duration */
  promptRenderDurationMs: LatencyMetric;
  /** Moderation API call duration */
  moderationDurationMs: LatencyMetric;
  /** Classification and transformation processing duration */
  processingDurationMs: LatencyMetric;
  /** Action execution duration */
  actionsDurationMs: LatencyMetric;
  /** ASR recognition duration (voice only) */
  asrDurationMs: LatencyMetric;
}

export interface LatencyPercentilesResponse {
  /** Total number of turns matching the query */
  totalTurns: number;
  /** Total turn duration percentiles */
  totalTurnDurationMs: PercentileSet;
  /** Time to first token percentiles */
  timeToFirstTokenMs: PercentileSet;
  /** Time to first token from turn start percentiles */
  timeToFirstTokenFromTurnStartMs: PercentileSet;
  /** Time to first audio percentiles (voice only) */
  timeToFirstAudioMs: PercentileSet;
  /** LLM duration percentiles */
  llmDurationMs: PercentileSet;
}

export interface LatencyTrendResponse {
  /** Aggregation interval used (hour, day, or week) */
  interval: string;
  /** Time-bucketed data points */
  points: LatencyTrendPoint[];
}

export interface ConversationTimelineResponse {
  /** Conversation ID */
  conversationId: string;
  /** Ordered list of turns with timing breakdowns */
  turns: ConversationTimelineTurn[];
}

export interface ConversationTimelineTurn {
  /** 1-based sequential turn number */
  turnIndex: number;
  /** Timestamp of the user message event (ISO 8601) */
  timestamp: string;
  /** Input source: text or voice */
  source: string | null;
  /** Unix timestamp (ms) when the turn started processing */
  turnStartMs: number | null;
  /** Unix timestamp (ms) when ASR recognition started */
  asrStartMs: number | null;
  /** Unix timestamp (ms) when ASR recognition completed */
  asrEndMs: number | null;
  /** ASR transcription duration */
  asrDurationMs: number | null;
  /** Unix timestamp (ms) when the moderation API call started */
  moderationStartMs: number | null;
  /** Unix timestamp (ms) when the moderation API call completed */
  moderationEndMs: number | null;
  /** Content moderation duration */
  moderationDurationMs: number | null;
  /** Unix timestamp (ms) when filler sentence generation started */
  fillerStartMs: number | null;
  /** Unix timestamp (ms) when filler sentence generation completed */
  fillerEndMs: number | null;
  /** Classification and transformation duration */
  processingDurationMs: number | null;
  /** Unix timestamp (ms) when user input processing (classification + transformation) started */
  processingStartMs: number | null;
  /** Unix timestamp (ms) when user input processing completed */
  processingEndMs: number | null;
  /** Knowledge base retrieval duration */
  knowledgeRetrievalDurationMs: number | null;
  /** Unix timestamp (ms) when knowledge retrieval started */
  knowledgeRetrievalStartMs: number | null;
  /** Unix timestamp (ms) when knowledge retrieval completed */
  knowledgeRetrievalEndMs: number | null;
  /** Action execution duration */
  actionsDurationMs: number | null;
  /** Unix timestamp (ms) when action execution started */
  actionsStartMs: number | null;
  /** Unix timestamp (ms) when action execution completed */
  actionsEndMs: number | null;
  /** Filler sentence generation duration */
  fillerDurationMs: number | null;
  /** Unix timestamp (ms) when a stage transition (go_to_stage effect) started; null when no transition occurred */
  stageTransitionStartMs: number | null;
  /** Unix timestamp (ms) when the stage transition completed (stage data reloaded, providers re-wired, on_enter executed) */
  stageTransitionEndMs: number | null;
  /** Stage transition duration (go_to_stage effect); null when no transition occurred */
  stageTransitionDurationMs: number | null;
  /** Unix timestamp (ms) when the TTS WebSocket connection was initiated (voice path only) */
  ttsConnectStartMs: number | null;
  /** Unix timestamp (ms) when the TTS WebSocket connection was established and ready (voice path only) */
  ttsConnectEndMs: number | null;
  /** TTS WebSocket connection establishment duration (voice path only) */
  ttsConnectDurationMs: number | null;
  /** Unix timestamp (ms) when prompt template rendering started */
  promptRenderStartMs: number | null;
  /** Unix timestamp (ms) when prompt template rendering completed */
  promptRenderEndMs: number | null;
  /** Prompt template rendering duration */
  promptRenderDurationMs: number | null;
  /** Unix timestamp (ms) when LLM generation started */
  llmStartMs: number | null;
  /** Unix timestamp (ms) when LLM generation completed */
  llmEndMs: number | null;
  /** Unix timestamp (ms) when the first LLM token was received */
  firstTokenMs: number | null;
  /** Unix timestamp (ms) when the first audio chunk was delivered to the client */
  firstAudioMs: number | null;
  /** LLM start to first token */
  timeToFirstTokenMs: number | null;
  /** Turn start to first LLM token */
  timeToFirstTokenFromTurnStartMs: number | null;
  /** Turn start to first audio chunk */
  timeToFirstAudioMs: number | null;
  /** Total LLM call duration */
  llmDurationMs: number | null;
  /** Unix timestamp (ms) when TTS synthesis started */
  ttsStartMs: number | null;
  /** Unix timestamp (ms) when TTS synthesis completed */
  ttsEndMs: number | null;
  /** TTS synthesis duration */
  ttsDurationMs: number | null;
  /** Unix timestamp (ms) when the turn completed (after TTS on voice path, after LLM on text path) */
  turnEndMs: number | null;
  /** Total turn duration from start to completion */
  totalTurnDurationMs: number | null;
}

export interface TokenUsageStatsResponse {
  /** Total number of events with token usage data */
  totalEvents: number;
  /** Total prompt (input) tokens across all event types */
  totalPromptTokens: number;
  /** Total completion (output) tokens across all event types */
  totalCompletionTokens: number;
  /** Total tokens across all event types */
  totalTokens: number;
  /** Token usage breakdown by event type */
  byEventType: TokenUsageByEventType[];
}

export interface TokenUsageTrendResponse {
  /** Aggregation interval used (hour, day, or week) */
  interval: string;
  /** Time-bucketed data points */
  points: TokenUsageTrendPoint[];
}

export interface SourceCatalogResponse {
  /** List of all available analytics sources */
  sources: SourceEntry[];
}

export interface SliceQueryResponse {
  /** Source that was queried */
  source: string;
  /** Time bucket interval used, if any */
  interval?: string;
  /** Dimensions that results are grouped by */
  groupBy: string[];
  /** Dimension used as the inner aggregation unit, if two-phase aggregation was applied */
  normalizeBy?: string;
  /** Metric specifications that were computed */
  metrics: string[];
  /** Result rows */
  rows: SliceQueryRow[];
}
