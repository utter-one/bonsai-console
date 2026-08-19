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

export enum ScenarioRunStatus {
  Queued = "queued",
  InProgress = "in_progress",
  Passed = "passed",
  Failed = "failed",
  Cancelled = "cancelled",
  Error = "error",
}

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
      type: "save_artifact";
    } & SaveArtifactEffect)
  | ({
      type: "generate_response";
    } & GenerateResponseEffect)
  | ({
      type: "change_visibility";
    } & ChangeVisibilityEffect)
  | ({
      type: "ban_user";
    } & BanUserEffect)
  | ({
      type: "attach_file";
    } & AttachFileEffect);

/** Translation settings for translating speech to another language */
export type SonioxTranslation =
  | ({
      type: "one_way";
    } & SonioxTranslationOneWay)
  | ({
      type: "two_way";
    } & SonioxTranslationTwoWay);

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
  /** Controls how reasoning is presented in the response. "parsed" separates reasoning into a dedicated message.reasoning field, "raw" includes reasoning within <think> tags in the main text content, "hidden" returns only the final answer without reasoning. Not supported for GPT-OSS models — use includeReasoning instead. Mutually exclusive with includeReasoning. */
  reasoningFormat?: "parsed" | "raw" | "hidden";
  /** Controls the level of reasoning effort. For Qwen 3 32B: "none" disables reasoning, "default" enables it. For GPT-OSS 20B and 120B: "low", "medium", or "high" controls the number of reasoning tokens used. */
  reasoningEffort?: "none" | "default" | "low" | "medium" | "high";
  /** Whether to include reasoning in the response. Only supported by GPT-OSS models (openai/gpt-oss-20b, openai/gpt-oss-120b). Mutually exclusive with reasoningFormat. */
  includeReasoning?: boolean;
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

export interface OllamaLlmSettings {
  /**
   * Model name as pulled locally (e.g., llama3.2, gemma3, qwen3:8b)
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

export interface OVHLlmSettings {
  /**
   * Model name (e.g., llama-3.3-70b-instruct, mistral-7b-instruct-v0.3)
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

export interface ScalewayLlmSettings {
  /**
   * Model name (e.g., llama-3.3-70b-instruct, mistral-7b-instruct-v0.3)
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
  | GeminiLlmSettings
  | GroqLlmSettings
  | MistralLlmSettings
  | DeepSeekLlmSettings
  | OpenRouterLlmSettings
  | TogetherAILlmSettings
  | FireworksAILlmSettings
  | PerplexityLlmSettings
  | CohereLlmSettings
  | XAILlmSettings
  | OllamaLlmSettings
  | OVHLlmSettings
  | ScalewayLlmSettings;

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
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    start: string;
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
  /** Whether to use sentence splitter for text processing, defaults to true */
  useSentenceSplitter?: boolean;
  /**
   * Speaking rate multiplier (0.75 to 1.5, default: 1.0)
   * @min 0.75
   * @max 1.5
   */
  speed?: number;
  [key: string]: any;
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

export interface SonioxTtsSettings {
  /** TTS provider type identifier */
  provider: "soniox";
  /**
   * TTS model to use. Defaults to "tts-rt-v1"
   * @default "tts-rt-v1"
   */
  model?: string;
  /**
   * Voice ID to use for speech synthesis. Defaults to "Adrian"
   * @default "Adrian"
   */
  voiceId?: string;
  /**
   * Language code for speech synthesis (e.g., "en", "es", "fr"). Defaults to "en"
   * @default "en"
   */
  language?: string;
  /** Preferred audio output format. Defaults to "pcm_16000" */
  audioFormat?:
    | "pcm_8000"
    | "pcm_16000"
    | "pcm_22050"
    | "pcm_24000"
    | "pcm_44100"
    | "mulaw"
    | "alaw"
    | "mp3"
    | "opus"
    | "flac"
    | "aac";
  /**
   * Speaking rate multiplier (0.7 to 1.3, default: 1.0)
   * @min 0.7
   * @max 1.3
   */
  speed?: number;
  /**
   * Codec bitrate in bps for compressed formats (e.g., 128000)
   * @min 0
   * @exclusiveMin true
   */
  bitrate?: number;
  /** Markers to identify sections of text that should not be spoken */
  noSpeechMarkers?: {
    /** @minLength 1 */
    start: string;
    /** @minLength 1 */
    end: string;
  }[];
  /** Whether to replace exclamation marks with periods */
  removeExclamationMarks?: boolean;
  /** Whether to use sentence splitter for text processing. Defaults to true */
  useSentenceSplitter?: boolean;
  [key: string]: any;
}

export type ServerVadConfig = (
  | ({
      algorithm: "legacy";
    } & LegacyVadConfig)
  | ({
      algorithm: "silero";
    } & SileroVadConfig)
  | ({
      algorithm: "firered";
    } & FireRedVadConfig)
) & {
  /** Optional Smart Turn endpoint detection configuration. Runs after VAD silence detection to verify turn completion. */
  smartTurn?: SmartTurnConfig;
  /**
   * Duration in milliseconds to wait for the user to continue speaking after a barge-in interrupt. If silence is detected for this duration, ASR is stopped. Default: 3000.
   * @min 500
   * @max 10000
   * @default 3000
   */
  bargeInSilenceTimeout?: number;
  /** Optional placeholder text fed to the AI as user input when the user barge-ins but then stops speaking before the bargeInSilenceTimeout. The AI generates a response based on this prompt (e.g. "[you misheard something the user said]"). Default: [repeat after interruption]. */
  bargeInSilencePlaceholder?: string;
};

export interface LegacyVadConfig {
  /** Legacy VAD algorithm using millisecond-based parameters with mode-based threshold selection */
  algorithm: "legacy";
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
  /**
   * Duration (in ms) after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise. Default: 1000.
   * @min 0
   * @max 5000
   */
  gracePeriodMs?: number;
}

export interface SileroVadConfig {
  /** Silero VAD algorithm with direct frame-based configuration */
  algorithm: "silero";
  /** Silero VAD model version. "v5" is the latest; "legacy" is the older model. Default: v5. */
  model?: "v5" | "legacy";
  /**
   * Probability threshold above which a frame is considered speech. Default: 0.5.
   * @min 0
   * @max 1
   */
  positiveSpeechThreshold?: number;
  /**
   * Probability threshold below which a frame is considered silence. Default: 0.35.
   * @min 0
   * @max 1
   */
  negativeSpeechThreshold?: number;
  /**
   * Number of audio samples per VAD frame. Silero was trained on 512, 1024, 1536 samples at 16kHz. Default: 1536.
   * @min 1
   */
  frameSamples?: number;
  /**
   * Number of silent frames after speech before end-of-utterance is triggered. If speech resumes during this window, the utterance is not ended. Default: 8.
   * @min 1
   */
  redemptionFrames?: number;
  /**
   * Number of frames of pre-roll silence prepended to the audio segment on speech start. Default: 1.
   * @min 0
   */
  preSpeechPadFrames?: number;
  /**
   * Minimum frames required to consider a segment as speech. Shorter segments trigger onVADMisfire instead. Default: 3.
   * @min 1
   */
  minSpeechFrames?: number;
  /** Whether to submit partial speech when VAD is paused. Default: library default. */
  submitUserSpeechOnPause?: boolean;
  /**
   * Duration (in ms) after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise. Default: 1000.
   * @min 0
   * @max 5000
   */
  gracePeriodMs?: number;
}

export interface FireRedVadConfig {
  /** FireRedVAD algorithm using NCNN runtime with packed-cache streaming inference */
  algorithm: "firered";
  /**
   * Probability threshold above which a smoothed frame is classified as speech. Default: 0.5.
   * @min 0
   * @max 1
   */
  speechThreshold?: number;
  /**
   * Size of the moving-average smoothing window applied to raw frame probabilities. Default: 5.
   * @min 1
   */
  smoothWindowSize?: number;
  /**
   * Minimum consecutive speech frames required before speech_start is emitted. Default: 8.
   * @min 1
   */
  minSpeechFrame?: number;
  /**
   * Maximum consecutive speech frames before a forced speech_end (long-utterance cutoff). Default: 6000.
   * @min 1
   */
  maxSpeechFrame?: number;
  /**
   * Minimum consecutive silence frames after speech before speech_end is emitted. Default: 80.
   * @min 1
   */
  minSilenceFrame?: number;
  /**
   * Number of frames of pre-roll audio prepended to the detected speech start. Default: 5.
   * @min 0
   */
  padStartFrame?: number;
  /**
   * Duration (in ms) after VAD initialization during which speech_start is suppressed. Prevents false positives from phone connection noise. Default: 1000.
   * @min 0
   * @max 5000
   */
  gracePeriodMs?: number;
}

/** Optional Smart Turn endpoint detection configuration. Runs after VAD silence detection to verify turn completion. */
export interface SmartTurnConfig {
  /**
   * Enable Smart Turn endpoint detection. When enabled, runs ONNX inference on the full utterance audio after VAD detects silence to determine if the speaker has finished their turn. Default: false.
   * @default false
   */
  enabled?: boolean;
  /**
   * Probability threshold for Smart Turn endpoint classification. Values above this threshold are considered turn endings. Default: 0.5.
   * @min 0
   * @max 1
   * @default 0.5
   */
  threshold?: number;
}

/** VAD algorithm-specific settings for voice activity detection */
export type VadSettings = LegacyVadConfig | SileroVadConfig | FireRedVadConfig;

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
    | SpeechmaticsAsrSettings
    | SonioxAsrSettings;
  /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
  unintelligiblePlaceholder?: string;
  /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
  voiceActivityDetection?: boolean;
  /**
   * Milliseconds of user silence in voice conversations before triggering an AI response. Set to 0 or omit to disable.
   * @min 0
   */
  silenceTimeoutMs?: number;
  /**
   * Maximum number of consecutive silence responses before ending the conversation. Set to 0 or omit for unlimited.
   * @min 0
   */
  maxSilences?: number;
  /** Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response. */
  silencePlaceholder?: string | null;
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

/** Soniox speech-to-text settings */
export interface SonioxAsrSettings {
  /**
   * Model ID for transcription (e.g., "stt-rt-v5"), defaults to stt-rt-v5
   * @default "stt-rt-v5"
   */
  model?: string;
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
  /**
   * Number of audio channels for multi-speaker diarization
   * @min 1
   * @max 8
   */
  numChannels?: number;
  /** Array of language codes for transcription hints (e.g., ["en", "es"]) */
  languageHints?: string[];
  /**
   * When true, only transcribe in the specified language, defaults to false
   * @default false
   */
  languageHintsStrict?: boolean;
  /**
   * Enable speaker identification to distinguish different speakers, defaults to false
   * @default false
   */
  enableSpeakerDiarization?: boolean;
  /**
   * Enable automatic language detection when language is not specified, defaults to false
   * @default false
   */
  enableLanguageIdentification?: boolean;
  /** Translation settings for translating speech to another language */
  translation?: SonioxTranslation;
  /** Context settings to improve recognition accuracy for specific domains or terminology */
  context?: SonioxContext;
  [key: string]: any;
}

export interface SonioxTranslationOneWay {
  type: "one_way";
  /** Target language code for translation (e.g., "es") */
  targetLanguage: string;
}

export interface SonioxTranslationTwoWay {
  type: "two_way";
  /** First language code for bidirectional translation (e.g., "en") */
  languageA: string;
  /** Second language code for bidirectional translation (e.g., "es") */
  languageB: string;
}

/** Context settings to improve recognition accuracy for specific domains or terminology */
export interface SonioxContext {
  /** General context key-value pairs for improved recognition */
  general?: SonioxContextKey[];
  /** Custom context text to guide transcription */
  text?: string;
  /** Important terms or phrases to prioritize in recognition */
  terms?: string[];
  /** Translation-specific term pairs for improved translation accuracy */
  translationTerms?: SonioxTranslationTerm[];
}

export interface SonioxContextKey {
  /** Context key or term */
  key: string;
  /** Context value or hint */
  value: string;
}

export interface SonioxTranslationTerm {
  /** Source language term */
  source: string;
  /** Target language translation */
  target: string;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
  /**
   * Prompt instructing the LLM to produce a short neutral filler sentence (e.g. "Generate a single short neutral sentence to fill silence while processing, like "Hmm, let me think about that."")
   * @minLength 1
   */
  prompt: string;
  /**
   * Number of recent conversation messages to include in the filler LLM call context (0 = no history, -1 = all history, N > 0 = last N messages)
   * @min -1
   * @default 0
   */
  historyMessageCount?: number;
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
  /** Optional execution priority override. Lower numbers execute first. Default: 11000. */
  priority?: number;
}

export interface AbortConversationEffect {
  /** Effect type */
  type: "abort_conversation";
  /** Optional reason for aborting the conversation */
  reason?: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 12000. */
  priority?: number;
}

export interface GoToStageEffect {
  /** Effect type */
  type: "go_to_stage";
  /**
   * ID of the stage to switch to
   * @minLength 1
   */
  stageId: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 13000. */
  priority?: number;
}

export interface ModifyUserInputEffect {
  /** Effect type */
  type: "modify_user_input";
  /**
   * Template to render and replace user input with
   * @minLength 1
   */
  template: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 5000. */
  priority?: number;
}

export interface ModifyVariablesEffect {
  /** Effect type */
  type: "modify_variables";
  /**
   * Array of variable modifications to apply
   * @minItems 1
   */
  modifications: VariableOperation[];
  /** Optional execution priority override. Lower numbers execute first. Default: 3000. */
  priority?: number;
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
  /** Optional execution priority override. Lower numbers execute first. Default: 4000. */
  priority?: number;
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
  /** Optional execution priority override. Lower numbers execute first. Default: 9000. */
  priority?: number;
}

export interface BanUserEffect {
  /** Effect type */
  type: "ban_user";
  /** Optional reason for banning the user */
  reason?: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 7000. */
  priority?: number;
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
  /**
   * When true, the tool runs in the background without blocking the conversation. The result is not stored in context and flow control signals (go_to_stage, end_conversation, etc.) are discarded. Use for fire-and-forget operations such as logging or saving data.
   * @default false
   */
  asynchronous?: boolean;
  /** Optional execution priority override. Lower numbers execute first. Default: 1000 (webhook), 2000 (smart_function), 6000 (script). */
  priority?: number;
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
  /** Optional execution priority override. Lower numbers execute first. Default: 10000. */
  priority?: number;
}

export interface SaveArtifactEffect {
  /** Effect type */
  type: "save_artifact";
  /** Data to save: inline value (string, base64, object) or a variable reference template such as {{vars.myFile}} */
  data?: any;
  /**
   * Encoding of the data: raw (store as-is), base64 (decode before storing)
   * @default "raw"
   */
  dataEncoding?: "raw" | "base64";
  /**
   * Display name for the stored file; supports Handlebars templating
   * @minLength 1
   */
  fileName: string;
  /**
   * MIME type for the stored file
   * @minLength 1
   */
  mimeType?: string;
  /**
   * Variable name to store the artifactId in (e.g. "myArtifactId")
   * @minLength 1
   */
  variableName: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 8000. */
  priority?: number;
}

export interface AttachFileEffect {
  /** Effect type */
  type: "attach_file";
  /**
   * Artifact ID of the file in storage to attach. Typically from a save_artifact effect or a tool result.
   * @minLength 1
   */
  artifactId: string;
  /**
   * Display name for the attachment. Defaults to the artifact's stored name when omitted.
   * @minLength 1
   */
  fileName?: string;
  /**
   * MIME type override. When omitted, uses the artifact's stored MIME type.
   * @minLength 1
   */
  mimeType?: string;
  /** Optional execution priority override. Lower numbers execute first. Default: 9500. */
  priority?: number;
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
  /**
   * Whether this action can be triggered by external services via the external trigger endpoint
   * @default false
   */
  triggerOnExternal?: boolean;
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
      | SpeechmaticsAsrSettings
      | SonioxAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /**
     * Milliseconds of user silence in voice conversations before triggering an AI response. Set to 0 or omit to disable.
     * @min 0
     */
    silenceTimeoutMs?: number;
    /**
     * Maximum number of consecutive silence responses before ending the conversation. Set to 0 or omit for unlimited.
     * @min 0
     */
    maxSilences?: number;
    /** Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response. */
    silencePlaceholder?: string | null;
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
  /** ID of the stage to start new conversations at when no stageId is provided at conversation start time. Acts as the project-level default starting stage. */
  startingStageId?: string | null;
  /**
   * Timeout in seconds for active conversations with no activity. Set to 0 or omit to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
   * @min 0
   */
  conversationTimeoutSeconds?: number;
  /** Audio recording configuration for conversation debugging */
  recordingConfig?: RecordingConfig;
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

/** Audio recording configuration for conversation debugging */
export interface RecordingConfig {
  /** Whether audio recording is enabled for this project */
  enabled: boolean;
  /**
   * Whether to record user voice input. Defaults to true.
   * @default true
   */
  recordInput?: boolean;
  /**
   * Whether to record AI voice output. Defaults to true.
   * @default true
   */
  recordOutput?: boolean;
  /**
   * Audio format for saved recordings. Defaults to pcm_16000.
   * @default "pcm_16000"
   */
  format?:
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
      | SpeechmaticsAsrSettings
      | SonioxAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /**
     * Milliseconds of user silence in voice conversations before triggering an AI response. Set to 0 or omit to disable.
     * @min 0
     */
    silenceTimeoutMs?: number;
    /**
     * Maximum number of consecutive silence responses before ending the conversation. Set to 0 or omit for unlimited.
     * @min 0
     */
    maxSilences?: number;
    /** Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response. */
    silencePlaceholder?: string | null;
    /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
    serverVad?: ServerVadConfig;
  };
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
  /** Updated ID of the stage to start new conversations at when no stageId is provided at conversation start time. Set to null to remove the default starting stage. */
  startingStageId?: string | null;
  /**
   * Timeout in seconds for active conversations with no activity. Set to 0 or null to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
   * @min 0
   */
  conversationTimeoutSeconds?: number | null;
  /** Updated audio recording configuration. Set to null to disable. */
  recordingConfig?: {
    /** Whether audio recording is enabled for this project */
    enabled: boolean;
    /**
     * Whether to record user voice input. Defaults to true.
     * @default true
     */
    recordInput?: boolean;
    /**
     * Whether to record AI voice output. Defaults to true.
     * @default true
     */
    recordOutput?: boolean;
    /**
     * Audio format for saved recordings. Defaults to pcm_16000.
     * @default "pcm_16000"
     */
    format?:
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
  } | null;
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
      | SpeechmaticsAsrSettings
      | SonioxAsrSettings;
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
    /**
     * Milliseconds of user silence in voice conversations before triggering an AI response. Set to 0 or omit to disable.
     * @min 0
     */
    silenceTimeoutMs?: number;
    /**
     * Maximum number of consecutive silence responses before ending the conversation. Set to 0 or omit for unlimited.
     * @min 0
     */
    maxSilences?: number;
    /** Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response. */
    silencePlaceholder?: string | null;
    /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
    serverVad?: ServerVadConfig;
  };
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
  /** ID of the stage to start new conversations at when no stageId is provided at conversation start time. Null means no default is set. */
  startingStageId: string | null;
  /** Timeout in seconds for active conversations with no activity. Null or 0 means no timeout. */
  conversationTimeoutSeconds: number | null;
  /** Audio recording configuration for conversation debugging */
  recordingConfig?: {
    /** Whether audio recording is enabled for this project */
    enabled: boolean;
    /**
     * Whether to record user voice input. Defaults to true.
     * @default true
     */
    recordInput?: boolean;
    /**
     * Whether to record AI voice output. Defaults to true.
     * @default true
     */
    recordOutput?: boolean;
    /**
     * Audio format for saved recordings. Defaults to pcm_16000.
     * @default "pcm_16000"
     */
    format?:
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
  } | null;
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
        | SpeechmaticsAsrSettings
        | SonioxAsrSettings;
      /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
      unintelligiblePlaceholder?: string;
      /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
      voiceActivityDetection?: boolean;
      /**
       * Milliseconds of user silence in voice conversations before triggering an AI response. Set to 0 or omit to disable.
       * @min 0
       */
      silenceTimeoutMs?: number;
      /**
       * Maximum number of consecutive silence responses before ending the conversation. Set to 0 or omit for unlimited.
       * @min 0
       */
      maxSilences?: number;
      /** Text fed to the AI as user input when silence is detected. The stage prompt can reference this text to generate an appropriate response. */
      silencePlaceholder?: string | null;
      /** Server-side VAD configuration. When set, the server autonomously detects speech boundaries — clients send continuous audio without calling start/end_user_voice_input. */
      serverVad?: ServerVadConfig;
    };
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
    /** ID of the stage to start new conversations at when no stageId is provided at conversation start time. Null means no default is set. */
    startingStageId: string | null;
    /** Timeout in seconds for active conversations with no activity. Null or 0 means no timeout. */
    conversationTimeoutSeconds: number | null;
    /** Audio recording configuration for conversation debugging */
    recordingConfig?: {
      /** Whether audio recording is enabled for this project */
      enabled: boolean;
      /**
       * Whether to record user voice input. Defaults to true.
       * @default true
       */
      recordInput?: boolean;
      /**
       * Whether to record AI voice output. Defaults to true.
       * @default true
       */
      recordOutput?: boolean;
      /**
       * Audio format for saved recordings. Defaults to pcm_16000.
       * @default "pcm_16000"
       */
      format?:
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
    } | null;
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
    | AmazonPollyTtsSettings
    | SonioxTtsSettings;
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
    | SonioxTtsSettings
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
    /**
     * Prompt instructing the LLM to produce a short neutral filler sentence (e.g. "Generate a single short neutral sentence to fill silence while processing, like "Hmm, let me think about that."")
     * @minLength 1
     */
    prompt: string;
    /**
     * Number of recent conversation messages to include in the filler LLM call context (0 = no history, -1 = all history, N > 0 = last N messages)
     * @min -1
     * @default 0
     */
    historyMessageCount?: number;
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
    | AmazonPollyTtsSettings
    | SonioxTtsSettings;
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
      | AmazonPollyTtsSettings
      | SonioxTtsSettings;
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
    /** Array of question texts for this knowledge item */
    questions: string[];
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
      /** Array of question texts for this knowledge item */
      questions: string[];
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
   * Array of question texts for this knowledge item
   * @minItems 1
   */
  questions: string[];
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
   * Updated array of question texts
   * @minItems 1
   */
  questions?: string[];
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
  /** Array of question texts for this knowledge item */
  questions: string[];
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
    /** Array of question texts for this knowledge item */
    questions: string[];
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
  /** Reference to related conversation ID */
  conversationId?: string;
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
  /** Related conversation ID */
  conversationId?: string;
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
  /** Related conversation ID */
  conversationId: string | null;
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
    /** Related conversation ID */
    conversationId: string | null;
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
  /** Direction of the conversation – incoming (user-initiated) or outgoing (Bonsai-initiated) */
  direction: "incoming" | "outgoing";
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
  /** Summary of artifacts associated with this conversation */
  artifacts?: {
    /** Unique identifier for the artifact */
    id: string;
    /** Type of artifact */
    artifactType: string;
    /** Size of the artifact in bytes */
    fileSize: number;
    /**
     * Timestamp when the artifact was created
     * @format date-time
     */
    createdAt: string | null;
  }[];
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
    /** Direction of the conversation – incoming (user-initiated) or outgoing (Bonsai-initiated) */
    direction: "incoming" | "outgoing";
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
    /** Summary of artifacts associated with this conversation */
    artifacts?: {
      /** Unique identifier for the artifact */
      id: string;
      /** Type of artifact */
      artifactType: string;
      /** Size of the artifact in bytes */
      fileSize: number;
      /**
       * Timestamp when the artifact was created
       * @format date-time
       */
      createdAt: string | null;
    }[];
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
    | "sample_copy_selection"
    | "turn_aborted";
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
        /** Names of the variables that were changed by this update */
        changedVariableNames: string[];
        /** Snapshot of all conversation variables after the update */
        variables: Record<string, ParameterValue>;
        metadata?: Record<string, any>;
      }
    | {
        /** Name of the action that triggered this profile update */
        sourceActionName: string;
        /** Names of the profile fields that were changed by this update */
        changedProfileNames: string[];
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
      }
    | {
        /** Identifier of the input turn that was aborted */
        inputTurnId: string;
        /** Identifier of the AI generation turn that was aborted */
        outputTurnId: string;
        /** Full text generated before the barge-in interruption */
        accumulatedText: string;
        /** Unix timestamp in milliseconds when the generation was aborted */
        abortTimestampMs: number;
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
      | "sample_copy_selection"
      | "turn_aborted";
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
          /** Names of the variables that were changed by this update */
          changedVariableNames: string[];
          /** Snapshot of all conversation variables after the update */
          variables: Record<string, ParameterValue>;
          metadata?: Record<string, any>;
        }
      | {
          /** Name of the action that triggered this profile update */
          sourceActionName: string;
          /** Names of the profile fields that were changed by this update */
          changedProfileNames: string[];
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
        }
      | {
          /** Identifier of the input turn that was aborted */
          inputTurnId: string;
          /** Identifier of the AI generation turn that was aborted */
          outputTurnId: string;
          /** Full text generated before the barge-in interruption */
          accumulatedText: string;
          /** Unix timestamp in milliseconds when the generation was aborted */
          abortTimestampMs: number;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
  /** JavaScript code (script) */
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
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
    /** JavaScript code (script) */
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
  /**
   * Whether this action can be triggered by external services via the external trigger endpoint
   * @default false
   */
  triggerOnExternal?: boolean;
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
  /** Updated trigger on external flag */
  triggerOnExternal?: boolean;
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
  /** Whether this action can be triggered by external services via the external trigger endpoint */
  triggerOnExternal: boolean;
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
    /** Whether this action can be triggered by external services via the external trigger endpoint */
    triggerOnExternal: boolean;
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
        /** Base URL of the Ollama server (defaults to http://localhost:11434 for local, or https://ollama.com for cloud) */
        baseUrl?: string;
        /** API key — required for Ollama Cloud (ollama.com); ignored by local Ollama instances */
        apiKey?: string;
      }
    | {
        /** OVH AI Endpoints API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://oai.endpoints.kepler.ai.cloud.ovh.net/v1) */
        baseUrl?: string;
      }
    | {
        /** Scaleway API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://api.scaleway.ai/v1) */
        baseUrl?: string;
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
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (default), "eu", or "jp"
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
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
    | {
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (stt-rt.soniox.com), "eu" (stt-rt.eu.soniox.com), or "jp" (stt-rt.jp.soniox.com)
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TelegramChannelConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig
    | WhatsAppChannelConfig
    | SmtpImapChannelConfig;
  /** Searchable tags for organization (e.g., ["production", "low-latency"]) */
  tags?: string[];
}

export interface TelegramChannelConfig {
  /** Telegram Bot Token obtained from @BotFather */
  botToken: string;
  /**
   * Minimum delay in milliseconds before processing an incoming message. 0 means immediate processing.
   * @min 0
   * @default 0
   */
  processingDelayMinMs?: number;
  /**
   * Maximum delay in milliseconds before processing an incoming message. Must be >= processingDelayMinMs.
   * @min 0
   * @default 0
   */
  processingDelayMaxMs?: number;
}

export interface TwilioMessagingChannelConfig {
  /** Twilio Account SID (starts with AC) */
  accountSid: string;
  /** Twilio Auth Token used for request signature validation and REST API authentication */
  authToken: string;
  /** Twilio phone number or WhatsApp sender in E.164 format (e.g. +15551234567) used as the "From" address for outbound messages */
  fromNumber: string;
  /**
   * Minimum delay in milliseconds before processing an incoming message. 0 means immediate processing.
   * @min 0
   * @default 0
   */
  processingDelayMinMs?: number;
  /**
   * Maximum delay in milliseconds before processing an incoming message. Must be >= processingDelayMinMs.
   * @min 0
   * @default 0
   */
  processingDelayMaxMs?: number;
}

export interface TwilioVoiceChannelConfig {
  /** Twilio Account SID (starts with AC) */
  accountSid: string;
  /** Twilio Auth Token used for webhook signature validation */
  authToken: string;
  /** Twilio phone number in E.164 format (e.g. +15551234567) */
  phoneNumber: string;
  /** Twilio Application SID (starts with AP) whose voice webhook URL is called when an outgoing call connects. Required for outgoing calls; unused for incoming-only deployments. */
  applicationSid?: string;
}

export interface WhatsAppChannelConfig {
  /** Meta phone number ID used in the Graph API URL for outbound messages (e.g. 123456789012345) */
  phoneNumberId: string;
  /** Permanent Meta access token used as Bearer auth for outbound Graph API calls */
  accessToken: string;
  /** Meta app secret used to validate incoming webhook signatures via HMAC-SHA256 */
  appSecret: string;
  /** Static verification token echoed back during the one-time Meta webhook challenge/verification GET request */
  verifyToken: string;
  /**
   * Minimum delay in milliseconds before processing an incoming message. 0 means immediate processing.
   * @min 0
   * @default 0
   */
  processingDelayMinMs?: number;
  /**
   * Maximum delay in milliseconds before processing an incoming message. Must be >= processingDelayMinMs.
   * @min 0
   * @default 0
   */
  processingDelayMaxMs?: number;
}

export interface SmtpImapChannelConfig {
  /** Default project ID for inbound email routing. Required when emailToProject is not set. When emailToProject is set, used as fallback for unmatched recipient addresses. */
  projectId?: string;
  /**
   * Sender email address
   * @format email
   */
  fromAddress: string;
  /** SMTP server configuration for sending emails */
  smtp: SmtpImapSmtpConfig;
  /** IMAP server configuration for receiving inbound email replies */
  imap: SmtpImapImapConfig;
  /**
   * How to derive thread ID for conversation continuity
   * @default "messageId"
   */
  threadingStrategy?: "messageId" | "senderSubject";
  /** Maps email addresses to routing entries for multi-project routing. Each entry can specify projectId, cc, bcc, fromAddress, subject, stageId, and agentId. Plain string values (projectId only) are supported for backward compatibility. Inbound: matched against To: field. Outbound: matched against fromAddress. */
  emailToProject?: Record<string, string | EmailRoutingEntry>;
  /** Optional OAuth2/XOAUTH2 configuration. When present, supersedes password-based authentication for both SMTP and IMAP. */
  oauth2?: SmtpImapOauth2Config;
  /**
   * IMAP folder name to move processed inbound messages to after the AI response is sent. The folder and its parents will be auto-created if they do not exist.
   * @default "Bonsai/Processed"
   */
  processedFolder?: string;
  /**
   * When enabled, a reply from a CC/BCC recipient (not the conversation user) is treated as a human hand-off: the conversation is closed and no AI response is sent.
   * @default true
   */
  ccBccReplyAsHandOff?: boolean;
  /**
   * Minimum delay in milliseconds before processing an incoming message. 0 means immediate processing.
   * @min 0
   * @default 0
   */
  processingDelayMinMs?: number;
  /**
   * Maximum delay in milliseconds before processing an incoming message. Must be >= processingDelayMinMs.
   * @min 0
   * @default 0
   */
  processingDelayMaxMs?: number;
}

/** SMTP server configuration for sending emails */
export interface SmtpImapSmtpConfig {
  /** SMTP server hostname */
  host: string;
  /**
   * SMTP server port (e.g., 587 for STARTTLS, 465 for implicit TLS)
   * @min 1
   * @max 65535
   */
  port: number;
  /**
   * Use implicit TLS (true) or STARTTLS (false)
   * @default false
   */
  secure?: boolean;
  /** SMTP authentication credentials */
  auth: SmtpImapSmtpAuth;
}

/** SMTP authentication credentials */
export interface SmtpImapSmtpAuth {
  /** SMTP authentication username (usually the sender email address) */
  user: string;
  /** SMTP authentication password or application-specific password */
  pass: string;
}

/** IMAP server configuration for receiving inbound email replies */
export interface SmtpImapImapConfig {
  /** IMAP server hostname */
  host: string;
  /**
   * IMAP server port (e.g., 993 for TLS, 143 for STARTTLS)
   * @min 1
   * @max 65535
   */
  port: number;
  /**
   * Use implicit TLS (true) or STARTTLS (false)
   * @default true
   */
  secure?: boolean;
  /** IMAP authentication credentials */
  auth: SmtpImapImapAuth;
  /**
   * Fallback polling interval in milliseconds when IDLE is unavailable
   * @min 1000
   * @default 30000
   */
  pollingIntervalMs?: number;
}

/** IMAP authentication credentials */
export interface SmtpImapImapAuth {
  /** IMAP authentication username (usually the mailbox email address) */
  user: string;
  /** IMAP authentication password or application-specific password */
  pass: string;
}

export interface EmailRoutingEntry {
  /** Target project ID for this email address */
  projectId: string;
  /**
   * CC address for all emails sent from this identity
   * @format email
   */
  cc?: string;
  /**
   * BCC address for all emails sent from this identity
   * @format email
   */
  bcc?: string;
  /**
   * Override sender email address for this identity
   * @format email
   */
  fromAddress?: string;
  /** Default subject line for outbound-initiated conversations (not applied to inbound replies) */
  subject?: string;
  /** Default starting stage for conversations from this identity */
  stageId?: string;
  /** Default agent for conversations from this identity */
  agentId?: string;
}

/** Optional OAuth2/XOAUTH2 configuration. When present, supersedes password-based authentication for both SMTP and IMAP. */
export interface SmtpImapOauth2Config {
  /**
   * OAuth2 token endpoint URL (e.g. https://oauth2.googleapis.com/token for Gmail)
   * @format uri
   */
  tokenUrl: string;
  /**
   * OAuth2 authorization endpoint URL (e.g. https://accounts.google.com/o/oauth2/v2/auth for Gmail). Required for initial authorization flow.
   * @format uri
   */
  authorizationUrl?: string;
  /** OAuth2 client ID */
  clientId: string;
  /** OAuth2 client secret */
  clientSecret: string;
  /** OAuth2 refresh token (long-lived, managed by the OAuth2 callback/refresh service) */
  refreshToken?: string;
  /** Current OAuth2 access token (managed by the OAuth2 callback/refresh service) */
  accessToken?: string;
  /** Unix timestamp in milliseconds when the access token expires (managed by the OAuth2 callback/refresh service) */
  accessTokenExpiry?: number;
  /** OAuth2 scope string (e.g. https://www.googleapis.com/auth/gmail.modify for Gmail) */
  scope: string;
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
        /** Base URL of the Ollama server (defaults to http://localhost:11434 for local, or https://ollama.com for cloud) */
        baseUrl?: string;
        /** API key — required for Ollama Cloud (ollama.com); ignored by local Ollama instances */
        apiKey?: string;
      }
    | {
        /** OVH AI Endpoints API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://oai.endpoints.kepler.ai.cloud.ovh.net/v1) */
        baseUrl?: string;
      }
    | {
        /** Scaleway API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://api.scaleway.ai/v1) */
        baseUrl?: string;
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
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (default), "eu", or "jp"
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
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
    | {
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (stt-rt.soniox.com), "eu" (stt-rt.eu.soniox.com), or "jp" (stt-rt.jp.soniox.com)
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TelegramChannelConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig
    | WhatsAppChannelConfig
    | SmtpImapChannelConfig;
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
        /** Base URL of the Ollama server (defaults to http://localhost:11434 for local, or https://ollama.com for cloud) */
        baseUrl?: string;
        /** API key — required for Ollama Cloud (ollama.com); ignored by local Ollama instances */
        apiKey?: string;
      }
    | {
        /** OVH AI Endpoints API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://oai.endpoints.kepler.ai.cloud.ovh.net/v1) */
        baseUrl?: string;
      }
    | {
        /** Scaleway API key */
        apiKey: string;
        /** Optional base URL override (defaults to https://api.scaleway.ai/v1) */
        baseUrl?: string;
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
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (default), "eu", or "jp"
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
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
    | {
        /** API key for authenticating with Soniox */
        apiKey: string;
        /**
         * Soniox region: "us" (stt-rt.soniox.com), "eu" (stt-rt.eu.soniox.com), or "jp" (stt-rt.jp.soniox.com)
         * @default "us"
         */
        region?: "us" | "eu" | "jp";
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig
    | TelegramChannelConfig
    | TwilioMessagingChannelConfig
    | TwilioVoiceChannelConfig
    | WhatsAppChannelConfig
    | SmtpImapChannelConfig;
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
          /** Base URL of the Ollama server (defaults to http://localhost:11434 for local, or https://ollama.com for cloud) */
          baseUrl?: string;
          /** API key — required for Ollama Cloud (ollama.com); ignored by local Ollama instances */
          apiKey?: string;
        }
      | {
          /** OVH AI Endpoints API key */
          apiKey: string;
          /** Optional base URL override (defaults to https://oai.endpoints.kepler.ai.cloud.ovh.net/v1) */
          baseUrl?: string;
        }
      | {
          /** Scaleway API key */
          apiKey: string;
          /** Optional base URL override (defaults to https://api.scaleway.ai/v1) */
          baseUrl?: string;
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
          /** API key for authenticating with Soniox */
          apiKey: string;
          /**
           * Soniox region: "us" (default), "eu", or "jp"
           * @default "us"
           */
          region?: "us" | "eu" | "jp";
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
      | {
          /** API key for authenticating with Soniox */
          apiKey: string;
          /**
           * Soniox region: "us" (stt-rt.soniox.com), "eu" (stt-rt.eu.soniox.com), or "jp" (stt-rt.jp.soniox.com)
           * @default "us"
           */
          region?: "us" | "eu" | "jp";
        }
      | S3StorageConfig
      | AzureBlobStorageConfig
      | GcsStorageConfig
      | LocalStorageConfig
      | TelegramChannelConfig
      | TwilioMessagingChannelConfig
      | TwilioVoiceChannelConfig
      | WhatsAppChannelConfig
      | SmtpImapChannelConfig;
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
    | "whatsapp"
    | "telegram"
    | "sendgrid"
    | "ses"
    | "smtp_imap"
    | "testing"
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
    | "abort_generation"
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
      | "whatsapp"
      | "telegram"
      | "sendgrid"
      | "ses"
      | "smtp_imap"
      | "testing"
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
      | "abort_generation"
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
        | "whatsapp"
        | "telegram"
        | "sendgrid"
        | "ses"
        | "smtp_imap"
        | "testing"
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
        | "abort_generation"
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
  /** Aggregation functions available for this metric */
  aggregateFunctions: (
    | "count"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "p50"
    | "p75"
    | "p90"
    | "p95"
    | "p99"
  )[];
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
    | "llm_calls"
    | "actions"
    | "variables"
    | "user_profile";
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
  /** Filter analytics to conversations used by this scenario run */
  scenarioRunId?: string;
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

export interface FunnelStep {
  /** Event type that defines this funnel step */
  eventType:
    | "enter_stage"
    | "end_stage"
    | "action_fire"
    | "variable_changed"
    | "user_profile_changed"
    | "session_started"
    | "tool_response";
  /** Event-specific filter parameters; see FunnelStep documentation for required keys per eventType */
  params: Record<string, string>;
}

export interface FunnelQuery {
  /**
   * Ordered list of funnel steps; minimum 2, maximum 15
   * @maxItems 15
   */
  steps: FunnelStep[];
  /** Relative look-back window (mutually exclusive with from/to) */
  relativeTime?: RelativeTime;
  /**
   * Time window start, inclusive (ISO 8601; mutually exclusive with relativeTime)
   * @format date-time
   */
  from?: string | null;
  /**
   * Time window end, inclusive (ISO 8601; mutually exclusive with relativeTime)
   * @format date-time
   */
  to?: string | null;
}

export interface FunnelStepResult {
  /** 1-based index of this step in the input steps array */
  stepNumber: number;
  /** Human-readable label generated by the server */
  label: string;
  /** Absolute count of unique users who reached this step */
  userCount: number;
  /** userCount / usersAtStart × 100; always 100.0 for step 1 */
  percentage: number;
  /** Users lost relative to the previous step; 0 for step 1 */
  dropoffCount: number;
  /** dropoffCount / usersAtStart × 100; 0.0 for step 1 */
  dropoffPercentage: number;
}

export interface FunnelQueryResponse {
  /** Percentage of step-1 users who reached the last step (0.0–100.0) */
  totalConversionRate: number;
  /** Absolute count of unique users who matched step 1 */
  usersAtStart: number;
  /** Absolute count of unique users who matched the last step */
  usersAtEnd: number;
  /** One result entry per input step, in order */
  steps: FunnelStepResult[];
}

export interface SavedFunnelQuery {
  /** Unique identifier of the saved funnel query */
  id: string;
  /** Name of the saved funnel query */
  name: string;
  /** Project this query belongs to */
  projectId: string;
  /** Operator who created this query, or null if the operator has been deleted */
  operatorId: string | null;
  /** The saved funnel query configuration */
  query: FunnelQuery;
  /** Whether this query is visible to all operators in the project */
  isShared: boolean;
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

/** Single entity reference using this provider */
export interface ProviderUsageEntry {
  /** Type of entity referencing the provider */
  entityType:
    | "agent"
    | "stage"
    | "classifier"
    | "tool"
    | "contextTransformer"
    | "tester"
    | "project";
  /** ID of the entity using this provider */
  entityId: string;
  /** Name of the entity using this provider */
  entityName: string;
  /** LLM or TTS model name configured on the entity (only set when the entity has llmSettings/ttsSettings with a model field) */
  modelName?: string | null;
}

/** Availability status of a single model */
export interface ModelAvailability {
  /** Model name as configured on the entity */
  model: string;
  /** Whether the model is available on the provider */
  status: "available" | "unavailable";
  /** List of entity IDs that depend on this model */
  usedBy: string[];
}

/** Availability information for a provider */
export interface ProviderAvailability {
  /** Overall availability: available (all models OK), partially_available (some models missing), unavailable (no models OK), not_applicable (non-LLM provider) */
  status:
    | "available"
    | "partially_available"
    | "unavailable"
    | "not_applicable";
  /** Per-model availability breakdown (only populated when checkIfAvailable is true and provider is LLM) */
  models: ModelAvailability[];
}

/** Provider with its usage references within the project */
export interface UsedProviderDetail {
  /** Provider ID */
  id: string;
  /** Provider display name */
  name: string;
  /** Type of provider service */
  providerType: "asr" | "tts" | "llm" | "embeddings" | "storage" | "channel";
  /** Specific provider implementation (e.g., openai, anthropic, elevenlabs) */
  apiType: string;
  /** List of entities within the project that reference this provider */
  usage: ProviderUsageEntry[];
  /** Availability check results (only populated when checkIfAvailable query parameter is true) */
  availability?: {
    /** Overall availability: available (all models OK), partially_available (some models missing), unavailable (no models OK), not_applicable (non-LLM provider) */
    status:
      | "available"
      | "partially_available"
      | "unavailable"
      | "not_applicable";
    /** Per-model availability breakdown (only populated when checkIfAvailable is true and provider is LLM) */
    models: ModelAvailability[];
  };
}

/** Count of providers grouped by type */
export interface ProviderTypeSummary {
  /**
   * Number of LLM providers used
   * @min 0
   */
  llm: number;
  /**
   * Number of TTS providers used
   * @min 0
   */
  tts: number;
  /**
   * Number of ASR providers used
   * @min 0
   */
  asr: number;
  /**
   * Number of embeddings providers used
   * @min 0
   */
  embeddings: number;
  /**
   * Number of storage providers used
   * @min 0
   */
  storage: number;
  /**
   * Number of channel providers used
   * @min 0
   */
  channel: number;
}

/** Comprehensive report of providers used in the project */
export interface ProjectProviderUsageResponse {
  /** List of providers actively referenced by entities in the project */
  providers: UsedProviderDetail[];
  /** Summary statistics of provider usage */
  summary: {
    /**
     * Total number of distinct providers used in the project
     * @min 0
     */
    totalProviders: number;
    /** Count of providers grouped by type */
    byType: ProviderTypeSummary;
  };
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

export interface ExternalTriggerRequest {
  /** The conversation ID to trigger the action in */
  conversationId: string;
  /** Optional session ID. Required when multiple sessions exist for the conversation. If omitted and only one session exists, it is used automatically. */
  sessionId?: string;
  /** The action ID or name to trigger. The action must have triggerOnExternal enabled. */
  actionName: string;
  /**
   * Parameters to pass to the action
   * @default {}
   */
  parameters?: Record<string, any>;
}

export interface ExternalTriggerResponse {
  /** Whether the action was triggered successfully */
  success: boolean;
  /** The conversation ID */
  conversationId: string;
  /** The session ID where the action was triggered */
  sessionId: string;
  /** The action that was triggered */
  actionName: string;
  /** Outcome metadata from the action execution */
  outcome: {
    /** Whether the action modified user input */
    hasModifiedUserInput: boolean;
    /** Whether the action modified variables */
    hasModifiedVars: boolean;
    /** Whether the AI will generate a response after this action */
    shouldGenerateResponse: boolean;
    /** Whether the action aborted the conversation */
    shouldAbortConversation: boolean;
    /** Whether the action ended the conversation */
    shouldEndConversation: boolean;
  };
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
  /** Specific tester IDs to include. */
  testerIds?: string[];
  /** Specific scenario IDs to include. */
  scenarioIds?: string[];
  /** Specific guardrail IDs to include. */
  guardrailIds?: string[];
  /** Specific copy decorator IDs to include. */
  copyDecoratorIds?: string[];
  /** Specific sample copy IDs to include. Transitively pulls in referenced copyDecorators and classifiers. */
  sampleCopyIds?: string[];
  /** Specific saved slice query IDs to include. */
  savedSliceQueryIds?: string[];
  /** Specific saved funnel query IDs to include. */
  savedFunnelQueryIds?: string[];
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
  /** Knowledge item stubs that would be included — name is the first question text */
  knowledgeItems: EntityStub[];
  /** Guardrail stubs that would be included */
  guardrails: EntityStub[];
  /** Copy decorator stubs that would be included */
  copyDecorators: EntityStub[];
  /** Sample copy stubs that would be included */
  sampleCopies: EntityStub[];
  /** Saved slice query stubs that would be included */
  savedSliceQueries: EntityStub[];
  /** Saved funnel query stubs that would be included */
  savedFunnelQueries: EntityStub[];
  /** Stage stubs that would be included */
  stages: EntityStub[];
  /** API key stubs that would be included */
  apiKeys: EntityStub[];
  /** Tester stubs that would be included */
  testers: EntityStub[];
  /** Scenario stubs that would be included */
  scenarios: EntityStub[];
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
  /** Copy decorator template records — depend on projects */
  copyDecorators: Record<string, any>[];
  /** Sample copy records — depend on projects and copyDecorators */
  sampleCopies: Record<string, any>[];
  /** Saved slice query records — depend on projects */
  savedSliceQueries: Record<string, any>[];
  /** Saved funnel query records — depend on projects */
  savedFunnelQueries: Record<string, any>[];
  /** Guardrail records — depend on projects */
  guardrails: Record<string, any>[];
  /** Stage records — depend on projects, agents, and classifiers */
  stages: Record<string, any>[];
  /** API key records — depend on projects */
  apiKeys: Record<string, any>[];
  /** Tester records — depend on projects */
  testers: Record<string, any>[];
  /** Scenario records — depend on projects */
  scenarios: Record<string, any>[];
  /** Encrypted provider secret values keyed by their original @sec:manager:id reference string. Present only when a bundlePassword was supplied at export time. Each entry must be decrypted (using a key derived from bundlePassword) and re-stored under the target's master encryption key during import. */
  bundleSecrets?: Record<string, BundleSecretEntry>;
}

export interface BundleSecretEntry {
  /** Base64-encoded AES-256-GCM ciphertext */
  encryptedValue: string;
  /** Base64-encoded 12-byte initialization vector */
  iv: string;
  /** Base64-encoded 16-byte authentication tag */
  tag: string;
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
    | SpeechmaticsAsrSettings
    | SonioxAsrSettings;
  /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
  unintelligiblePlaceholder?: string;
  /** Whether to enable voice activity detection */
  voiceActivityDetection?: boolean;
  /**
   * Timeout in milliseconds before silence triggers an AI response
   * @min 0
   */
  silenceTimeoutMs?: number;
  /**
   * Maximum consecutive silence-triggered responses before ending conversation
   * @min 0
   */
  maxSilences?: number;
  /** Text sent as user input when silence is detected */
  silencePlaceholder?: string;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
  /**
   * Prompt instructing the LLM to produce a short neutral filler sentence
   * @minLength 1
   */
  prompt: string;
  /**
   * Number of recent conversation messages to include in the filler LLM call context (0 = no history, -1 = all history, N > 0 = last N messages)
   * @min -1
   * @default 0
   */
  historyMessageCount?: number;
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
  /** Sample copy configuration including the default classifier used to evaluate prompt triggers */
  sampleCopyConfig?: SampleCopyConfigExchangeV1;
  /** Local document ID of the stage to start new conversations at; remapped on import */
  startingStageId?: string | null;
  /**
   * Timeout in seconds for active conversations with no activity
   * @min 0
   */
  conversationTimeoutSeconds?: number | null;
  /** Audio recording configuration for conversation debugging */
  recordingConfig?: RecordingConfigExchangeV1;
  /** Project-level LLM token cost management configuration with provider hints */
  costManagementConfig?: CostManagementConfigExchangeV1;
}

/** Sample copy configuration including the default classifier used to evaluate prompt triggers */
export interface SampleCopyConfigExchangeV1 {
  /** Local document ID of the classifier used to evaluate sample copy prompt triggers; remapped on import */
  defaultClassifierId?: string;
}

/** Audio recording configuration for conversation debugging */
export interface RecordingConfigExchangeV1 {
  /** Whether audio recording is enabled for this project */
  enabled: boolean;
  /**
   * Whether to record user voice input. Defaults to true.
   * @default true
   */
  recordInput?: boolean;
  /**
   * Whether to record AI voice output. Defaults to true.
   * @default true
   */
  recordOutput?: boolean;
  /**
   * Audio format for saved recordings. Defaults to pcm_16000.
   * @default "pcm_16000"
   */
  format?:
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
}

/** Project-level LLM token cost management configuration with provider hints */
export interface CostManagementConfigExchangeV1 {
  /** Token cap definitions keyed by provider hint and model name */
  limits: Record<string, Record<string, ProviderModelLimits>>;
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
    | AmazonPollyTtsSettings
    | SonioxTtsSettings;
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
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
    /**
     * Prompt instructing the LLM to produce a short neutral filler sentence
     * @minLength 1
     */
    prompt: string;
    /**
     * Number of recent conversation messages to include in the filler LLM call context (0 = no history, -1 = all history, N > 0 = last N messages)
     * @min -1
     * @default 0
     */
    historyMessageCount?: number;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
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
  /** Array of question texts for this knowledge item */
  questions: string[];
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

export interface SecretResponse {
  /** Unique secret identifier (e.g. sec_xxxx) */
  id: string;
  /** Full secret reference string in @sec:name:id format */
  ref: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
}

export interface SecretListResponse {
  /** List of secret entries */
  items: SecretResponse[];
  /** Secret refs that exist in the store but are not referenced by any provider config or environment */
  orphans: string[];
}

export interface SecretValueResponse {
  /** Secret identifier */
  id: string;
  /** Decrypted plaintext secret value */
  value: string;
}

export interface DataExtractionEntry {
  /**
   * ID of the stage whose variable should be extracted
   * @minLength 1
   */
  stageId: string;
  /**
   * Name of the stage variable to extract
   * @minLength 1
   */
  varName: string;
  /** Expected value of the variable — defines a successful outcome when provided */
  expectedValue?: any;
  /** Comparison mode for this value. Default is "eq" (strict equality) */
  expectedMode?:
    | "exists"
    | "not_exists"
    | "eq"
    | "contains"
    | "includes"
    | "matches"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin";
}

export interface CreateTesterRequest {
  /**
   * Unique identifier for the tester (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the tester persona
   * @minLength 1
   */
  name: string;
  /** Detailed description of the tester persona and its behaviour */
  description?: string | null;
  /**
   * Prompt that defines the tester persona behaviour during a conversation
   * @minLength 1
   */
  prompt: string;
  /** Mini-prompt evaluated at each turn to decide whether the tester should hang up (used when personaCanHangUp is enabled on the scenario); must return true to continue or false to hang up */
  hangUpPrompt?: string | null;
  /**
   * ID of the LLM provider to use for this tester
   * @minLength 1
   */
  llmProviderId?: string;
  /** LLM provider-specific settings for this tester */
  llmSettings?: LlmSettings;
  /** Key-value user profile data passed when the tester starts a conversation */
  userProfile?: Record<string, any>;
  /**
   * Tags for categorizing and filtering this tester
   * @default []
   */
  tags?: string[];
  /** Additional tester-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateTesterRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated persona prompt
   * @minLength 1
   */
  prompt?: string;
  /** Updated hang-up decision mini-prompt */
  hangUpPrompt?: string | null;
  /**
   * Updated LLM provider ID
   * @minLength 1
   */
  llmProviderId?: string;
  /** Updated LLM provider-specific settings */
  llmSettings?: LlmSettings;
  /** Updated user profile data */
  userProfile?: Record<string, any>;
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

export interface DeleteTesterRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface TesterResponse {
  /** Unique identifier for the tester */
  id: string;
  /** ID of the project this tester belongs to */
  projectId: string;
  /** Display name of the tester persona */
  name: string;
  /** Detailed description of the tester persona */
  description: string | null;
  /** Prompt that defines the tester persona behaviour */
  prompt: string;
  /** Mini-prompt evaluated at each turn to decide whether the tester should hang up */
  hangUpPrompt: string | null;
  /** ID of the LLM provider */
  llmProviderId: string | null;
  /** LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings
    | GroqLlmSettings
    | MistralLlmSettings
    | DeepSeekLlmSettings
    | OpenRouterLlmSettings
    | TogetherAILlmSettings
    | FireworksAILlmSettings
    | PerplexityLlmSettings
    | CohereLlmSettings
    | XAILlmSettings
    | OllamaLlmSettings
    | OVHLlmSettings
    | ScalewayLlmSettings;
  /** Key-value user profile data */
  userProfile: Record<string, any>;
  /** Tags for categorizing and filtering this tester */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the tester was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the tester was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface TesterListResponse {
  /** Array of testers in the current page */
  items: {
    /** Unique identifier for the tester */
    id: string;
    /** ID of the project this tester belongs to */
    projectId: string;
    /** Display name of the tester persona */
    name: string;
    /** Detailed description of the tester persona */
    description: string | null;
    /** Prompt that defines the tester persona behaviour */
    prompt: string;
    /** Mini-prompt evaluated at each turn to decide whether the tester should hang up */
    hangUpPrompt: string | null;
    /** ID of the LLM provider */
    llmProviderId: string | null;
    /** LLM provider-specific settings */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings
      | GroqLlmSettings
      | MistralLlmSettings
      | DeepSeekLlmSettings
      | OpenRouterLlmSettings
      | TogetherAILlmSettings
      | FireworksAILlmSettings
      | PerplexityLlmSettings
      | CohereLlmSettings
      | XAILlmSettings
      | OllamaLlmSettings
      | OVHLlmSettings
      | ScalewayLlmSettings;
    /** Key-value user profile data */
    userProfile: Record<string, any>;
    /** Tags for categorizing and filtering this tester */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the tester was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the tester was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of testers matching the query
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

export interface CreateScenarioRequest {
  /**
   * Unique identifier for the scenario (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Display name of the scenario
   * @minLength 1
   */
  name: string;
  /** Detailed description of the scenario purpose and expected flow */
  description?: string | null;
  /**
   * Language code of the conversation (e.g. en-US)
   * @minLength 1
   */
  language: string;
  /**
   * ID of the stage where the conversation begins
   * @minLength 1
   */
  startingStageId: string;
  /**
   * Maximum number of conversation turns before the scenario is terminated
   * @min 1
   */
  maxTurns: number;
  /**
   * Stage IDs that signal a successful conversation ending
   * @default []
   */
  endingStageIds?: string[];
  /**
   * Whether the tester persona is allowed to hang up the conversation
   * @default false
   */
  personaCanHangUp?: boolean;
  /** Opening message sent by the tester when the first stage awaits user input, instead of calling the LLM. Defaults to "[Conversation begins.]" when not set. */
  conversationOpener?: string;
  /** Stage variables to extract at the end of the run and their expected values */
  dataExtraction?: DataExtractionEntry[];
  /**
   * ID of the context transformer used to post-process extracted data
   * @minLength 1
   */
  contextTransformerId?: string;
  /** Expected values after post-processing — each entry has an optional value and comparison mode (default "eq") */
  dataPostProcessingExpected?: Record<string, ExpectedValueEntry>;
  /**
   * Tags for categorizing and filtering this scenario
   * @default []
   */
  tags?: string[];
  /** Additional scenario-specific metadata */
  metadata?: Record<string, any>;
}

export interface ExpectedValueEntry {
  /** Expected value to compare against */
  value?: any;
  /** Comparison mode. Default is "eq" (strict equality) */
  mode?:
    | "exists"
    | "not_exists"
    | "eq"
    | "contains"
    | "includes"
    | "matches"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin";
}

export interface UpdateScenarioRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated language code
   * @minLength 1
   */
  language?: string;
  /**
   * Updated starting stage ID
   * @minLength 1
   */
  startingStageId?: string;
  /**
   * Updated maximum turn count
   * @min 1
   */
  maxTurns?: number;
  /** Updated ending stage IDs */
  endingStageIds?: string[];
  /** Updated hang-up flag */
  personaCanHangUp?: boolean;
  /** Updated conversation opener message */
  conversationOpener?: string | null;
  /** Updated data extraction configuration */
  dataExtraction?: DataExtractionEntry[];
  /**
   * Updated context transformer ID
   * @minLength 1
   */
  contextTransformerId?: string | null;
  /** Updated post-processing expected values — each entry has an optional value and comparison mode (default "eq") */
  dataPostProcessingExpected?: Record<string, ExpectedValueEntry>;
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

export interface DeleteScenarioRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface ScenarioResponse {
  /** Unique identifier for the scenario */
  id: string;
  /** ID of the project this scenario belongs to */
  projectId: string;
  /** Display name of the scenario */
  name: string;
  /** Detailed description of the scenario */
  description: string | null;
  /** Language code of the conversation */
  language: string;
  /** ID of the stage where the conversation begins */
  startingStageId: string;
  /** Maximum number of conversation turns */
  maxTurns: number;
  /** Stage IDs that signal a successful ending */
  endingStageIds: string[];
  /** Whether the tester persona is allowed to hang up */
  personaCanHangUp: boolean;
  /** Opening message sent by the tester when the first stage awaits user input */
  conversationOpener: string | null;
  /** Data extraction configuration */
  dataExtraction: DataExtractionEntry[] | null;
  /** ID of the context transformer for post-processing */
  contextTransformerId: string | null;
  /** Expected values after post-processing — each entry has an optional value and comparison mode (default "eq") */
  dataPostProcessingExpected: Record<string, ExpectedValueEntry>;
  /** Tags for categorizing and filtering */
  tags: string[];
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the scenario was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the scenario was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface ScenarioListResponse {
  /** Array of scenarios in the current page */
  items: {
    /** Unique identifier for the scenario */
    id: string;
    /** ID of the project this scenario belongs to */
    projectId: string;
    /** Display name of the scenario */
    name: string;
    /** Detailed description of the scenario */
    description: string | null;
    /** Language code of the conversation */
    language: string;
    /** ID of the stage where the conversation begins */
    startingStageId: string;
    /** Maximum number of conversation turns */
    maxTurns: number;
    /** Stage IDs that signal a successful ending */
    endingStageIds: string[];
    /** Whether the tester persona is allowed to hang up */
    personaCanHangUp: boolean;
    /** Opening message sent by the tester when the first stage awaits user input */
    conversationOpener: string | null;
    /** Data extraction configuration */
    dataExtraction: DataExtractionEntry[] | null;
    /** ID of the context transformer for post-processing */
    contextTransformerId: string | null;
    /** Expected values after post-processing — each entry has an optional value and comparison mode (default "eq") */
    dataPostProcessingExpected: Record<string, ExpectedValueEntry>;
    /** Tags for categorizing and filtering */
    tags: string[];
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the scenario was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the scenario was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of scenarios matching the query
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

export interface CreateScenarioRunRequest {
  /**
   * ID of the scenario to run
   * @minLength 1
   */
  scenarioId: string;
  /** Map of tester persona ID to number of conversations to run for that tester */
  testers: Record<string, number>;
  /** Additional metadata for this run */
  metadata?: Record<string, any>;
}

export interface ScenarioRunResponse {
  /** Unique identifier for the scenario run */
  id: string;
  /** ID of the project this run belongs to */
  projectId: string;
  /** ID of the scenario being run */
  scenarioId: string;
  /** Map of tester persona ID to number of conversations assigned to that tester */
  testers: Record<string, number>;
  /** Computed total number of conversations across all testers */
  totalConversations: number;
  /** Current status of the scenario run */
  status: ScenarioRunStatus;
  /** Human-readable details about the current status, e.g. failure reason or cancellation actor */
  statusDetails: string | null;
  /**
   * Number of conversations that errored during execution (excluded from pass/fail evaluation)
   * @min 0
   */
  errorCount: number;
  /** Detailed test statistics for this run */
  testStatistics: {
    /**
     * Total number of individual test assertions that passed across all conversations
     * @min 0
     */
    passedTests: number;
    /**
     * Total number of individual test assertions that failed across all conversations
     * @min 0
     */
    failedTests: number;
  } | null;
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the run was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the run was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface ScenarioRunListResponse {
  /** Array of scenario runs in the current page */
  items: {
    /** Unique identifier for the scenario run */
    id: string;
    /** ID of the project this run belongs to */
    projectId: string;
    /** ID of the scenario being run */
    scenarioId: string;
    /** Map of tester persona ID to number of conversations assigned to that tester */
    testers: Record<string, number>;
    /** Computed total number of conversations across all testers */
    totalConversations: number;
    /** Current status of the scenario run */
    status: ScenarioRunStatus;
    /** Human-readable details about the current status, e.g. failure reason or cancellation actor */
    statusDetails: string | null;
    /**
     * Number of conversations that errored during execution (excluded from pass/fail evaluation)
     * @min 0
     */
    errorCount: number;
    /** Detailed test statistics for this run */
    testStatistics: {
      /**
       * Total number of individual test assertions that passed across all conversations
       * @min 0
       */
      passedTests: number;
      /**
       * Total number of individual test assertions that failed across all conversations
       * @min 0
       */
      failedTests: number;
    } | null;
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the run was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the run was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of scenario runs matching the query
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

export interface ScenarioConversationResponse {
  /** Unique identifier for the scenario conversation */
  id: string;
  /** ID of the project this conversation belongs to */
  projectId: string;
  /** ID of the scenario run this conversation belongs to */
  scenarioRunId: string;
  /** ID of the scenario being tested */
  scenarioId: string;
  /** ID of the tester persona used in this conversation */
  testerId: string;
  /** ID of the underlying conversation used to run this scenario conversation */
  conversationId: string | null;
  /** Current execution status of this conversation */
  status:
    | "queued"
    | "in_progress"
    | "passed"
    | "failed"
    | "cancelled"
    | "error";
  /** How the test conversation ended */
  testRunStatus:
    | "conversation_ended"
    | "conversation_aborted"
    | "conversation_failed"
    | "max_turns_reached"
    | "tester_hung_up"
    | null;
  /** Extracted stage variable values at the end of the conversation */
  dataExtractionResults: Record<string, any>;
  /** Post-processed data transformation results */
  dataTransformationResults: Record<string, any>;
  /** Detailed test statistics for this conversation */
  testStatistics: {
    /**
     * Number of individual test assertions that passed
     * @min 0
     */
    passedTests: number;
    /**
     * Number of individual test assertions that failed
     * @min 0
     */
    failedTests: number;
  } | null;
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the scenario conversation was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the scenario conversation was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface ScenarioConversationListResponse {
  /** Array of scenario conversations in the current page */
  items: {
    /** Unique identifier for the scenario conversation */
    id: string;
    /** ID of the project this conversation belongs to */
    projectId: string;
    /** ID of the scenario run this conversation belongs to */
    scenarioRunId: string;
    /** ID of the scenario being tested */
    scenarioId: string;
    /** ID of the tester persona used in this conversation */
    testerId: string;
    /** ID of the underlying conversation used to run this scenario conversation */
    conversationId: string | null;
    /** Current execution status of this conversation */
    status:
      | "queued"
      | "in_progress"
      | "passed"
      | "failed"
      | "cancelled"
      | "error";
    /** How the test conversation ended */
    testRunStatus:
      | "conversation_ended"
      | "conversation_aborted"
      | "conversation_failed"
      | "max_turns_reached"
      | "tester_hung_up"
      | null;
    /** Extracted stage variable values at the end of the conversation */
    dataExtractionResults: Record<string, any>;
    /** Post-processed data transformation results */
    dataTransformationResults: Record<string, any>;
    /** Detailed test statistics for this conversation */
    testStatistics: {
      /**
       * Number of individual test assertions that passed
       * @min 0
       */
      passedTests: number;
      /**
       * Number of individual test assertions that failed
       * @min 0
       */
      failedTests: number;
    } | null;
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the scenario conversation was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the scenario conversation was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of scenario conversations matching the query
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

export interface BenchmarkTimingStats {
  /** Arithmetic mean in milliseconds */
  avg: number;
  /** Median value (alias for p50) in milliseconds */
  median: number;
  /** 50th percentile in milliseconds */
  p50: number;
  /** 95th percentile in milliseconds */
  p95: number;
  /** 99th percentile in milliseconds */
  p99: number;
  /** Minimum value in milliseconds */
  min: number;
  /** Maximum value in milliseconds */
  max: number;
}

export interface BenchmarkStats {
  /** Total iteration duration statistics */
  totalDurationMs: BenchmarkTimingStats;
  /** Time-to-first-chunk statistics; null when provider does not stream */
  timeToFirstChunkMs: BenchmarkTimingStats;
  /** Inter-chunk interval statistics; null when fewer than 2 chunks received */
  chunkIntervalMs: BenchmarkTimingStats;
  /**
   * Fraction of iterations that completed without error (0–1)
   * @min 0
   * @max 1
   */
  successRate: number;
  /**
   * Number of iterations that completed successfully
   * @min 0
   */
  completedIterations: number;
  /**
   * Number of iterations that failed
   * @min 0
   */
  failedIterations: number;
}

export interface CreateBenchmarkSuiteRequest {
  /**
   * Human-readable name for the suite
   * @minLength 1
   */
  name: string;
  /** Optional description of what this suite tests */
  description?: string;
  /** node-cron expression for scheduled execution, e.g. "0 * * * *". Omit for manual-only suites. */
  cronExpression?: string;
  /**
   * Whether the suite is active and eligible for scheduled execution
   * @default true
   */
  isActive?: boolean;
  /**
   * Optional tags for filtering and organisation
   * @default []
   */
  tags?: string[];
}

export interface UpdateBenchmarkSuiteRequest {
  /** Current version for optimistic locking */
  version: number;
  /**
   * Human-readable name for the suite
   * @minLength 1
   */
  name?: string;
  /** Optional description */
  description?: string | null;
  /** node-cron expression; set to null to remove the schedule */
  cronExpression?: string | null;
  /** Whether the suite is active */
  isActive?: boolean;
  /** Tags for filtering */
  tags?: string[];
}

export interface BenchmarkSuiteResponse {
  /** Unique benchmark suite ID */
  id: string;
  /** Suite name */
  name: string;
  /** Suite description */
  description: string | null;
  /** Cron expression for scheduled runs */
  cronExpression: string | null;
  /** Whether the suite is active */
  isActive: boolean;
  /** Tags */
  tags: string[];
  /** Operator ID who created the suite */
  createdBy: string | null;
  /** Optimistic locking version */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface BenchmarkSuiteListResponse {
  /** Benchmark suites in the current page */
  items: {
    /** Unique benchmark suite ID */
    id: string;
    /** Suite name */
    name: string;
    /** Suite description */
    description: string | null;
    /** Cron expression for scheduled runs */
    cronExpression: string | null;
    /** Whether the suite is active */
    isActive: boolean;
    /** Tags */
    tags: string[];
    /** Operator ID who created the suite */
    createdBy: string | null;
    /** Optimistic locking version */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of suites matching the query
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

export interface CreateBenchmarkProviderConfigRequest {
  /**
   * Human-readable name for this provider config
   * @minLength 1
   */
  name: string;
  /** Type of provider being configured */
  providerType: "llm" | "tts" | "asr";
  /**
   * ID of the provider entity to use
   * @minLength 1
   */
  providerId: string;
  /** Provider-specific settings (model, voice, language, etc.) */
  settings: Record<string, any>;
  /** Additional provider-specific configuration to apply on top of settings. TTS example: { model, voiceId, audioFormat, speed, languageCode, etc. } */
  providerSettings?: Record<string, any>;
}

export interface UpdateBenchmarkProviderConfigRequest {
  /** Current version for optimistic locking */
  version: number;
  /**
   * Human-readable name
   * @minLength 1
   */
  name?: string;
  /**
   * Provider entity ID
   * @minLength 1
   */
  providerId?: string;
  /** Provider-specific settings */
  settings?: Record<string, any>;
  /** Additional provider-specific configuration; set to null to clear */
  providerSettings?: Record<string, any>;
}

export interface BenchmarkProviderConfigResponse {
  /** Unique ID */
  id: string;
  /** Name */
  name: string;
  /** Provider type */
  providerType: "llm" | "tts" | "asr";
  /** Provider entity ID */
  providerId: string;
  /** Provider settings */
  settings: Record<string, any>;
  /** Additional provider-specific configuration (e.g. TTS model, voiceId, audioFormat, speed, languageCode) */
  providerSettings: Record<string, any>;
  /** Optimistic locking version */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface BenchmarkProviderConfigListResponse {
  /** Benchmark provider configs in the current page */
  items: {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Provider type */
    providerType: "llm" | "tts" | "asr";
    /** Provider entity ID */
    providerId: string;
    /** Provider settings */
    settings: Record<string, any>;
    /** Additional provider-specific configuration (e.g. TTS model, voiceId, audioFormat, speed, languageCode) */
    providerSettings: Record<string, any>;
    /** Optimistic locking version */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of provider configs matching the query
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

export interface CreateBenchmarkConfigRequest {
  /**
   * ID of the benchmark suite this config belongs to
   * @minLength 1
   */
  suiteId: string;
  /**
   * Human-readable name for this test case
   * @minLength 1
   */
  name: string;
  /** Optional description */
  description?: string;
  /**
   * ID of the benchmark provider config to use
   * @minLength 1
   */
  providerConfigId: string;
  /** Type of input data: messages (LLM), text (TTS), or audio (ASR) */
  inputType: "messages" | "text" | "audio";
  /** Input payload. LLM: { messages: LlmMessage[] }. TTS: { text: string }. ASR: { audioBase64: string, mimeType: string, fileName?: string } */
  inputData: Record<string, any>;
  /**
   * Number of times to repeat the test per run
   * @min 1
   * @max 100
   * @default 3
   */
  repeats?: number;
}

export interface UpdateBenchmarkConfigRequest {
  /** Current version for optimistic locking */
  version: number;
  /**
   * Test case name
   * @minLength 1
   */
  name?: string;
  /** Description */
  description?: string | null;
  /**
   * Provider config ID
   * @minLength 1
   */
  providerConfigId?: string;
  /** Input type */
  inputType?: "messages" | "text" | "audio";
  /** Input payload */
  inputData?: Record<string, any>;
  /**
   * Repeat count
   * @min 1
   * @max 100
   */
  repeats?: number;
}

export interface BenchmarkConfigResponse {
  /** Unique ID */
  id: string;
  /** Parent suite ID */
  suiteId: string;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /** Provider config ID */
  providerConfigId: string;
  /** Input type */
  inputType: "messages" | "text" | "audio";
  /** Input payload */
  inputData: Record<string, any>;
  /** Repeat count per run */
  repeats: number;
  /** Optimistic locking version */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface BenchmarkConfigListResponse {
  /** Benchmark configs in the current page */
  items: {
    /** Unique ID */
    id: string;
    /** Parent suite ID */
    suiteId: string;
    /** Name */
    name: string;
    /** Description */
    description: string | null;
    /** Provider config ID */
    providerConfigId: string;
    /** Input type */
    inputType: "messages" | "text" | "audio";
    /** Input payload */
    inputData: Record<string, any>;
    /** Repeat count per run */
    repeats: number;
    /** Optimistic locking version */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of configs matching the query
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

export interface TriggerBenchmarkRunRequest {
  /**
   * ID of the benchmark suite to execute
   * @minLength 1
   */
  suiteId: string;
}

export interface BenchmarkConfigExecutionResponse {
  /** Unique execution ID (the unique run_id that links a config to its results) */
  id: string;
  /** Parent benchmark run ID */
  runId: string;
  /** Benchmark config ID */
  configId: string;
  /** Execution status */
  status: "pending" | "in_progress" | "completed" | "failed";
  /** Aggregated statistics, populated after completion */
  stats: BenchmarkStats;
  /**
   * When this execution started
   * @format date-time
   */
  startedAt: string | null;
  /**
   * When this execution completed
   * @format date-time
   */
  completedAt: string | null;
  /** Error message if the execution failed */
  error: string | null;
  /** Optimistic locking version */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface BenchmarkRunResponse {
  /** Unique benchmark run ID */
  id: string;
  /** Suite ID */
  suiteId: string;
  /** How the run was triggered */
  trigger: "manual" | "scheduled";
  /** Run status */
  status: "pending" | "in_progress" | "completed" | "failed";
  /**
   * When the run started
   * @format date-time
   */
  startedAt: string | null;
  /**
   * When the run completed
   * @format date-time
   */
  completedAt: string | null;
  /** Top-level error message if the run failed */
  error: string | null;
  /** Config executions within this run (included on single-run GET) */
  executions?: {
    /** Unique execution ID (the unique run_id that links a config to its results) */
    id: string;
    /** Parent benchmark run ID */
    runId: string;
    /** Benchmark config ID */
    configId: string;
    /** Execution status */
    status: "pending" | "in_progress" | "completed" | "failed";
    /** Aggregated statistics, populated after completion */
    stats: BenchmarkStats;
    /**
     * When this execution started
     * @format date-time
     */
    startedAt: string | null;
    /**
     * When this execution completed
     * @format date-time
     */
    completedAt: string | null;
    /** Error message if the execution failed */
    error: string | null;
    /** Optimistic locking version */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /** Optimistic locking version */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface BenchmarkRunListResponse {
  /** Benchmark runs in the current page */
  items: {
    /** Unique benchmark run ID */
    id: string;
    /** Suite ID */
    suiteId: string;
    /** How the run was triggered */
    trigger: "manual" | "scheduled";
    /** Run status */
    status: "pending" | "in_progress" | "completed" | "failed";
    /**
     * When the run started
     * @format date-time
     */
    startedAt: string | null;
    /**
     * When the run completed
     * @format date-time
     */
    completedAt: string | null;
    /** Top-level error message if the run failed */
    error: string | null;
    /** Config executions within this run (included on single-run GET) */
    executions?: {
      /** Unique execution ID (the unique run_id that links a config to its results) */
      id: string;
      /** Parent benchmark run ID */
      runId: string;
      /** Benchmark config ID */
      configId: string;
      /** Execution status */
      status: "pending" | "in_progress" | "completed" | "failed";
      /** Aggregated statistics, populated after completion */
      stats: BenchmarkStats;
      /**
       * When this execution started
       * @format date-time
       */
      startedAt: string | null;
      /**
       * When this execution completed
       * @format date-time
       */
      completedAt: string | null;
      /** Error message if the execution failed */
      error: string | null;
      /** Optimistic locking version */
      version: number;
      /**
       * Creation timestamp
       * @format date-time
       */
      createdAt: string | null;
      /**
       * Last update timestamp
       * @format date-time
       */
      updatedAt: string | null;
    }[];
    /** Optimistic locking version */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of runs matching the query
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

export interface LlmIterationOutput {
  /** Generated text */
  text: string;
  /** Character count of the generated text */
  charCount: number;
  /** Word count of the generated text */
  wordCount: number;
  /** Reason generation stopped (e.g. stop, max_tokens); null if not reported by provider */
  stopReason: string | null;
  /** Prompt tokens consumed; null if not reported by provider */
  inputTokens: number | null;
  /** Completion tokens generated; null if not reported by provider */
  outputTokens: number | null;
  /** Output tokens per second; null if token count unavailable */
  tokensPerSecond: number | null;
}

export interface TtsIterationOutput {
  /** Total audio bytes synthesised */
  byteCount: number;
  /** Character count of the input text */
  inputCharCount: number;
  /** Synthesis throughput in bytes per second; null if no audio produced */
  bytesPerSecond: number | null;
}

export interface AsrIterationOutput {
  /** Recognised transcript */
  text: string;
  /** Character count of the recognised transcript */
  charCount: number;
  /** Word count of the recognised transcript */
  wordCount: number;
  /** Number of partial recognition events received */
  partialCount: number;
  /** Number of final recognition events received */
  finalCount: number;
}

export interface BenchmarkIterationResultData {
  /** Error message if the iteration failed, null otherwise */
  error: string | null;
  /** Milliseconds from start to first chunk/token; null if no chunks received */
  timeToFirstChunkMs: number | null;
  /** Total number of chunks received */
  chunkCount: number;
  /** Milliseconds between consecutive chunks (gap from chunk[i-1] to chunk[i]) */
  chunkTimings: number[];
  /** Provider-specific output data; null on error */
  output: LlmIterationOutput | TtsIterationOutput | AsrIterationOutput;
}

export interface BenchmarkResultResponse {
  /** Unique result ID */
  id: string;
  /** Parent config execution ID */
  configExecutionId: string;
  /**
   * Zero-based iteration index
   * @min 0
   */
  iterationIndex: number;
  /**
   * When this iteration started
   * @format date-time
   */
  startedAt: string | null;
  /**
   * When this iteration completed
   * @format date-time
   */
  completedAt: string | null;
  /** Full iteration result data */
  result: BenchmarkIterationResultData;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
}

export interface QuickPromptRouteParams {
  /** Quick Prompt ID */
  id: string;
}

export interface QuickPromptProjectRouteParams {
  /**
   * Project ID
   * @minLength 1
   */
  projectId: string;
  /** Quick Prompt ID */
  id: string;
}

export interface CreateQuickPromptRequest {
  /**
   * Unique identifier (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /** Prompt category */
  categoryId:
    | "agent"
    | "stage"
    | "filler"
    | "transformer"
    | "classifier"
    | "tool"
    | "tester"
    | "summarization";
  /**
   * Display name of the prompt
   * @minLength 1
   */
  name: string;
  /** Optional description */
  description?: string | null;
  /**
   * Prompt template text
   * @minLength 1
   */
  content: string;
  /**
   * Tags for organization and filtering
   * @default []
   */
  tags?: string[];
  /**
   * Whether the prompt is visible to all operators
   * @default true
   */
  isPublic?: boolean;
}

export interface CreateProjectQuickPromptRequest {
  /**
   * Unique identifier (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /** Prompt category */
  categoryId:
    | "agent"
    | "stage"
    | "filler"
    | "transformer"
    | "classifier"
    | "tool"
    | "tester"
    | "summarization";
  /**
   * Display name of the prompt
   * @minLength 1
   */
  name: string;
  /** Optional description */
  description?: string | null;
  /**
   * Prompt template text
   * @minLength 1
   */
  content: string;
  /**
   * Tags for organization and filtering
   * @default []
   */
  tags?: string[];
  /**
   * Whether the prompt is visible to project members
   * @default true
   */
  isPublic?: boolean;
}

export interface UpdateQuickPromptRequest {
  /** Updated category */
  categoryId?:
    | "agent"
    | "stage"
    | "filler"
    | "transformer"
    | "classifier"
    | "tool"
    | "tester"
    | "summarization";
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated prompt template text
   * @minLength 1
   */
  content?: string;
  /** Updated tags */
  tags?: string[];
  /** Updated visibility */
  isPublic?: boolean;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeleteQuickPromptRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface CloneQuickPromptRequest {
  /**
   * New ID for the cloned prompt (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Name for the cloned prompt (defaults to "{original name} (Clone)")
   * @minLength 1
   */
  name?: string;
}

export interface QuickPromptResponse {
  /** Unique identifier */
  id: string;
  /** Project ID (null for global prompts) */
  projectId: string | null;
  /** Prompt category */
  categoryId:
    | "agent"
    | "stage"
    | "filler"
    | "transformer"
    | "classifier"
    | "tool"
    | "tester"
    | "summarization";
  /** Owner operator ID */
  ownerId: string | null;
  /** Display name */
  name: string;
  /** Description */
  description: string | null;
  /** Prompt template text */
  content: string;
  /** Tags */
  tags: string[];
  /** Visibility flag */
  isPublic: boolean;
  /** Whether this is a system-seeded prompt */
  isSystem: boolean;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Last update timestamp
   * @format date-time
   */
  updatedAt: string | null;
}

export interface QuickPromptListResponse {
  /** Array of quick prompts */
  items: {
    /** Unique identifier */
    id: string;
    /** Project ID (null for global prompts) */
    projectId: string | null;
    /** Prompt category */
    categoryId:
      | "agent"
      | "stage"
      | "filler"
      | "transformer"
      | "classifier"
      | "tool"
      | "tester"
      | "summarization";
    /** Owner operator ID */
    ownerId: string | null;
    /** Display name */
    name: string;
    /** Description */
    description: string | null;
    /** Prompt template text */
    content: string;
    /** Tags */
    tags: string[];
    /** Visibility flag */
    isPublic: boolean;
    /** Whether this is a system-seeded prompt */
    isSystem: boolean;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of prompts matching the query
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

export interface DeferredProcessingEntry {
  /** Unique identifier for the deferred processing entry */
  id: string;
  /** Session ID associated with this entry */
  sessionId: string;
  /** Channel provider ID that received the original message */
  providerId: string;
  /** Project ID this entry belongs to */
  projectId: string;
  /** Conversation ID if the message was for an existing conversation */
  conversationId: string | null;
  /** Channel type (smtp_imap, sendgrid, ses, twilio_messaging, whatsapp, telegram) */
  channelType: string;
  /**
   * Scheduled processing time — message will be dispatched after this timestamp
   * @format date-time
   */
  processAt: string | null;
  /** The original CAL input message that was queued */
  message: Record<string, any>;
  /** Current processing status */
  status: "pending" | "processed" | "failed" | "cancelled";
  /** Number of retry attempts so far */
  retryCount: number;
  /** Error message from the last failed attempt, if any */
  lastError: string | null;
  /**
   * Timestamp when the entry was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the entry was last updated
   * @format date-time
   */
  updatedAt: string | null;
  /**
   * Timestamp when the entry was successfully processed
   * @format date-time
   */
  processedAt: string | null;
}

export interface DeferredProcessingList {
  /** Array of deferred processing entries */
  items: DeferredProcessingEntry[];
  /**
   * Total number of entries matching the query
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

export interface RescheduleDeferredProcessing {
  /**
   * New scheduled processing time. Use a past date to trigger immediate processing.
   * @format date-time
   */
  processAt: string | null;
}

export type CancelDeferredProcessing = object;

/** One health check result */
export interface HealthCheckItem {
  /** Check name (db, process, service_heartbeat:<name>, provider:<id>) */
  name: string;
  /** Check status */
  status: "ok" | "degraded" | "down" | "unknown";
  /** Check duration in milliseconds, when measured (absent for unmeasured checks) */
  latencyMs?: number | null;
  /** Check-specific detail payload (absent when none) */
  detail?: Record<string, any>;
}

export interface HealthMonitoringResponse {
  /**
   * When the last check cycle ran (null before the first cycle)
   * @format date-time
   */
  checkedAt: string | null;
  /** All checks from the last completed cycle */
  checks: HealthCheckItem[];
}

export interface HealthCheckResponse {
  /** Row id */
  id: string;
  /** Check name */
  checkName: string;
  /** Check status (ok | degraded | down | unknown) */
  status: string;
  /** Check duration in milliseconds */
  latencyMs: number | null;
  /** Check-specific detail payload */
  detail: Record<string, any>;
  /**
   * When the check ran
   * @format date-time
   */
  createdAt: string | null;
}

export interface HealthMonitoringListResponse {
  /** Health check rows in the current page */
  items: {
    /** Row id */
    id: string;
    /** Check name */
    checkName: string;
    /** Check status (ok | degraded | down | unknown) */
    status: string;
    /** Check duration in milliseconds */
    latencyMs: number | null;
    /** Check-specific detail payload */
    detail: Record<string, any>;
    /**
     * When the check ran
     * @format date-time
     */
    createdAt: string | null;
  }[];
  /**
   * Total matching rows
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

/** Rolling provider call-log window */
export interface ProviderRolling {
  /** Rolling window length in minutes (15) */
  windowMinutes: number;
  /**
   * Provider calls in the window (0 when none)
   * @min 0
   */
  calls: number;
  /**
   * Success ratio in the window (null when no calls)
   * @min 0
   * @max 1
   */
  okRate: number | null;
  /** 95th percentile call duration in the window */
  p95DurationMs: number | null;
  /** Top failing error codes in the window as [code, count] pairs, count desc (max 3) */
  topErrorCodes: (string | number)[][];
}

export interface ProviderMonitoringItem {
  /** Provider id */
  id: string;
  /** Provider name */
  name: string;
  /** Provider type (llm, asr, tts, embeddings, storage) */
  providerType: string;
  /** API type (openai, anthropic, elevenlabs, s3, ...) */
  apiType: string;
  /** Latest health-check status for this provider (provider:<id> check); null when not checked yet */
  probeStatus: "ok" | "degraded" | "down" | "unknown" | null;
  /** Rolling 15-minute call-log window */
  rolling: ProviderRolling;
}

export interface ProvidersMonitoringResponse {
  /** All providers with their rolling stats */
  providers: {
    /** Provider id */
    id: string;
    /** Provider name */
    name: string;
    /** Provider type (llm, asr, tts, embeddings, storage) */
    providerType: string;
    /** API type (openai, anthropic, elevenlabs, s3, ...) */
    apiType: string;
    /** Latest health-check status for this provider (provider:<id> check); null when not checked yet */
    probeStatus: "ok" | "degraded" | "down" | "unknown" | null;
    /** Rolling 15-minute call-log window */
    rolling: ProviderRolling;
  }[];
}

export interface ProviderCallResponse {
  /** Row id */
  id: string;
  /** Provider id */
  providerId: string;
  /** Provider type */
  providerType: string;
  /** API type */
  apiType: string;
  /** Operation (llm.generate, channel.send_message, ...) */
  operation: string;
  /** Model, when the operation has one */
  model: string | null;
  /** Owning project, when known */
  projectId: string | null;
  /** Owning conversation, when known */
  conversationId: string | null;
  /** Whether the call succeeded */
  ok: boolean;
  /** Error class (null on success): auth | rate_limited | timeout | server_error | client_error | network | unknown */
  errorCode: string | null;
  /** HTTP status when the error carried one */
  statusHttp: number | null;
  /** Call duration in milliseconds */
  durationMs: number;
  /** Truncated error message (1KB) */
  errorText: string | null;
  /** Set when the call ran on a fallback provider */
  fallbackProviderId: string | null;
  /** Variant phase fields (TTFT, tokens, chunk gaps, ...) */
  metrics: Record<string, any>;
  /**
   * When the call happened
   * @format date-time
   */
  createdAt: string | null;
}

export interface ProviderCallListResponse {
  /** Call log rows in the current page */
  items: {
    /** Row id */
    id: string;
    /** Provider id */
    providerId: string;
    /** Provider type */
    providerType: string;
    /** API type */
    apiType: string;
    /** Operation (llm.generate, channel.send_message, ...) */
    operation: string;
    /** Model, when the operation has one */
    model: string | null;
    /** Owning project, when known */
    projectId: string | null;
    /** Owning conversation, when known */
    conversationId: string | null;
    /** Whether the call succeeded */
    ok: boolean;
    /** Error class (null on success): auth | rate_limited | timeout | server_error | client_error | network | unknown */
    errorCode: string | null;
    /** HTTP status when the error carried one */
    statusHttp: number | null;
    /** Call duration in milliseconds */
    durationMs: number;
    /** Truncated error message (1KB) */
    errorText: string | null;
    /** Set when the call ran on a fallback provider */
    fallbackProviderId: string | null;
    /** Variant phase fields (TTFT, tokens, chunk gaps, ...) */
    metrics: Record<string, any>;
    /**
     * When the call happened
     * @format date-time
     */
    createdAt: string | null;
  }[];
  /**
   * Total matching rows
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

export interface ProviderStatsQuery {
  /**
   * Window start (inclusive). ISO 8601.
   * @format date-time
   */
  from: string | null;
  /**
   * Window end (exclusive). ISO 8601.
   * @format date-time
   */
  to: string | null;
  /**
   * Bucket granularity (default hour)
   * @default "hour"
   */
  groupBy?: "hour" | "day";
  /** Restrict to one provider */
  providerId?: string;
  /** Restrict to one operation */
  operation?: string;
}

/** One provider-stats aggregate row */
export interface ProviderStatsBucket {
  /**
   * Bucket start (top of the hour / top of the day, UTC)
   * @format date-time
   */
  bucket: string | null;
  /** Provider id */
  providerId: string;
  /** Operation */
  operation: string;
  /**
   * Call count in the bucket
   * @min 0
   */
  count: number;
  /**
   * Total call duration in the bucket
   * @min 0
   */
  sumDurationMs: number;
  /** Shortest call duration */
  minDurationMs: number;
  /** Longest call duration */
  maxDurationMs: number;
  /** Median time-to-first-token (LLM rows only, null when none) */
  p50TtftMs: number | null;
  /** 95th percentile time-to-first-token */
  p95TtftMs: number | null;
  /** 99th percentile time-to-first-token */
  p99TtftMs: number | null;
  /** 95th percentile max streaming chunk gap */
  p95MaxChunkGapMs: number | null;
  /**
   * Calls with a chunk gap over 10s
   * @min 0
   */
  stalledCount: number;
  /**
   * TTS calls slower than real time
   * @min 0
   */
  rtfOver1Count: number;
}

export interface ProviderStatsMonitoringResponse {
  /**
   * Window start (inclusive)
   * @format date-time
   */
  from: string | null;
  /**
   * Window end (exclusive)
   * @format date-time
   */
  to: string | null;
  /** Bucket granularity used */
  groupBy: "hour" | "day";
  /** Aggregate rows, oldest bucket first */
  buckets: ProviderStatsBucket[];
}

export interface MetricSeriesQuery {
  /**
   * Metric name (must be a registered metric)
   * @minLength 1
   */
  name: string;
  /** Exact label-set match (e.g. labels[provider_id]=prov_1&labels[ok]=true) */
  labels?: Record<string, string>;
  /**
   * Window start (inclusive). ISO 8601.
   * @format date-time
   */
  from: string | null;
  /**
   * Window end (exclusive). ISO 8601.
   * @format date-time
   */
  to: string | null;
  /**
   * Bucket granularity (default 15m)
   * @default "15m"
   */
  step?: "1m" | "15m" | "1h";
}

/** One metric time-series point */
export interface MetricSeriesPoint {
  /**
   * Bucket start
   * @format date-time
   */
  bucket: string | null;
  /**
   * Summed sample counts in the bucket (counters: delta, gauges: 1 per sample, histograms: delta)
   * @min 0
   */
  count: number;
  /** Summed sample sums in the bucket */
  sum: number | null;
  /** Minimum sample min in the bucket */
  min: number | null;
  /** Maximum sample max in the bucket */
  max: number | null;
}

export interface MetricSeries {
  /** The label set of this series */
  labels: Record<string, string>;
  /** Points, oldest bucket first */
  points: MetricSeriesPoint[];
}

export interface MetricSeriesMonitoringResponse {
  /** Metric name */
  name: string;
  /**
   * Window start (inclusive)
   * @format date-time
   */
  from: string | null;
  /**
   * Window end (exclusive)
   * @format date-time
   */
  to: string | null;
  /** Bucket granularity used */
  step: "1m" | "15m" | "1h";
  /** One series per matching label set */
  series: {
    /** The label set of this series */
    labels: Record<string, string>;
    /** Points, oldest bucket first */
    points: MetricSeriesPoint[];
  }[];
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

export interface ArtifactResponse {
  /** Unique identifier for the artifact */
  id: string;
  /** Type of artifact (e.g., user_voice, ai_voice) */
  artifactType: string;
  /** Storage key in the storage provider */
  storageKey: string | null;
  /** URL of the artifact in storage */
  storageUrl: string | null;
  /** MIME type of the artifact */
  mimeType: string;
  /** Size of the artifact in bytes */
  fileSize: number;
  /** Additional metadata for the artifact */
  metadata: Record<string, any>;
  /**
   * Timestamp when the artifact was created
   * @format date-time
   */
  createdAt: string | null;
}

export interface DeployTelegramWebhookResponse {
  /** Whether the webhook was deployed successfully */
  success: boolean;
  /**
   * The full webhook URL that was registered with Telegram
   * @format uri
   */
  webhookUrl: string;
  /** Raw response body from the Telegram Bot API (present on success) */
  telegramResponse?: any;
  /** Error message from the Telegram Bot API (present when success is false) */
  error?: string;
}

/** Snapshot metadata response */
export interface SnapshotResponse {
  /** Snapshot ID */
  id: string;
  /** Project ID */
  projectId: string;
  /**
   * Sequential version number
   * @min 0
   * @exclusiveMin true
   */
  version: number;
  /** Human-readable name */
  name?: string | null;
  /** Operator ID who created this snapshot */
  createdBy?: string | null;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** REST schema hash at capture time */
  schemaHash?: string | null;
  /** Schema compatibility status */
  schemaStatus?: "compatible" | "incompatible" | "unknown";
  /** Human-readable schema status message */
  schemaStatusMessage?: string | null;
  /** Entity counts summary */
  entityCounts: EntityCounts;
}

/** Entity counts summary */
export interface EntityCounts {
  /**
   * Number of agents
   * @min 0
   */
  agents: number;
  /**
   * Number of stages
   * @min 0
   */
  stages: number;
  /**
   * Number of classifiers
   * @min 0
   */
  classifiers: number;
  /**
   * Number of context transformers
   * @min 0
   */
  contextTransformers: number;
  /**
   * Number of tools
   * @min 0
   */
  tools: number;
  /**
   * Number of global actions
   * @min 0
   */
  globalActions: number;
  /**
   * Number of guardrails
   * @min 0
   */
  guardrails: number;
  /**
   * Number of knowledge categories
   * @min 0
   */
  knowledgeCategories: number;
  /**
   * Number of knowledge items
   * @min 0
   */
  knowledgeItems: number;
  /**
   * Number of sample copies
   * @min 0
   */
  sampleCopies: number;
  /**
   * Number of copy decorators
   * @min 0
   */
  copyDecorators: number;
  /**
   * Number of testers
   * @min 0
   */
  testers: number;
  /**
   * Number of scenarios
   * @min 0
   */
  scenarios: number;
  /**
   * Number of quick prompts
   * @min 0
   */
  quickPrompts: number;
  /**
   * Number of saved slice queries
   * @min 0
   */
  savedSliceQueries: number;
  /**
   * Number of saved funnel queries
   * @min 0
   */
  savedFunnelQueries: number;
}

/** Request body for creating a project snapshot */
export interface CreateSnapshotRequest {
  /**
   * Optional human-readable name for this snapshot
   * @maxLength 256
   */
  name?: string | null;
}

/** Paginated list of snapshots */
export interface SnapshotListResponse {
  /** Array of snapshot metadata */
  items: SnapshotResponse[];
  /**
   * Total number of snapshots
   * @min 0
   */
  total: number;
  /**
   * Current offset
   * @min 0
   */
  offset: number;
  /**
   * Current limit
   * @min 0
   * @exclusiveMin true
   */
  limit: number;
}

/** Full snapshot response with entity data */
export interface SnapshotFullResponse {
  /** Snapshot ID */
  id: string;
  /** Project ID */
  projectId: string;
  /**
   * Sequential version number
   * @min 0
   * @exclusiveMin true
   */
  version: number;
  /** Human-readable name */
  name?: string | null;
  /** Operator ID who created this snapshot */
  createdBy?: string | null;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** REST schema hash at capture time */
  schemaHash?: string | null;
  /** Schema compatibility status */
  schemaStatus?: "compatible" | "incompatible" | "unknown";
  /** Human-readable schema status message */
  schemaStatusMessage?: string | null;
  /** Full entity data captured in this snapshot */
  entityData: Record<string, any>;
}

/** Snapshot comparison result */
export interface SnapshotComparisonResponse {
  /**
   * Baseline version number
   * @min 0
   * @exclusiveMin true
   */
  fromVersion: number;
  /**
   * Target version number
   * @min 0
   * @exclusiveMin true
   */
  toVersion: number;
  /** Comparison summary */
  summary: ComparisonSummary;
  /** Detailed diffs for modified entities */
  diffs: EntityDiff[];
  /** Entities added in the target */
  added: AddedRemovedEntity[];
  /** Entities removed in the target */
  removed: AddedRemovedEntity[];
}

/** Comparison summary */
export interface ComparisonSummary {
  /** IDs of entities added in the target */
  entitiesAdded: string[];
  /** IDs of entities removed in the target */
  entitiesRemoved: string[];
  /** IDs of entities modified between snapshots */
  entitiesModified: string[];
  /**
   * Number of entities unchanged between snapshots
   * @min 0
   */
  entitiesUnchanged: number;
}

/** Entity-level diff */
export interface EntityDiff {
  /** Entity type (e.g., "stage", "agent") */
  entityType: string;
  /** Entity ID */
  entityId: string;
  /** Entity name */
  entityName: string;
  /** List of field-level changes */
  changes: FieldChange[];
}

/** A single field-level change */
export interface FieldChange {
  /** Dot-notation field path (e.g., "llmSettings.model") */
  field: string;
  /** Value in the baseline snapshot */
  from?: any;
  /** Value in the target snapshot */
  to?: any;
}

/** Added or removed entity */
export interface AddedRemovedEntity {
  /** Entity type */
  entityType: string;
  /** Full entity data */
  entity: Record<string, any>;
}

/** Request body for updating a snapshot name */
export interface UpdateSnapshotNameRequest {
  /**
   * New human-readable name for this snapshot, or null to clear
   * @maxLength 256
   */
  name?: string | null;
}

/** Snapshot restore result */
export interface SnapshotRestoreResponse {
  /** Whether the restore was successful */
  restored: boolean;
  /**
   * Version of the snapshot that was restored
   * @min 0
   * @exclusiveMin true
   */
  snapshotVersion: number;
  /** Whether schema migration was applied before restore */
  schemaMigrated?: boolean;
  /**
   * Number of transform steps applied during schema migration
   * @min 0
   */
  schemaMigrationSteps?: number;
  /** Entity counts after restore */
  entityCounts: EntityCounts;
  /** Warnings generated during restore */
  warnings?: RestoreWarning[];
}

/** Restore warning entry */
export interface RestoreWarning {
  /** Warning type (e.g., "stale_provider_reference", "schema_migration_applied") */
  type: string;
  /** Entity type affected */
  entityType?: string | null;
  /** Entity ID affected */
  entityId?: string | null;
  /** Entity name affected */
  entityName?: string | null;
  /** Field affected */
  field?: string | null;
  /** Human-readable warning message */
  message: string;
}

/** Snapshot deletion result */
export interface SnapshotDeleteResponse {
  /** Whether the snapshot was deleted */
  deleted: boolean;
  /** ID of the deleted snapshot */
  snapshotId: string;
}

/** One alert delivery attempt */
export interface AlertNotification {
  /** Notifier id from the monitoring config */
  notifierId: string;
  /** Which event phase this delivery attempted */
  phase: "fired" | "resolved";
  /** Whether the delivery attempt succeeded */
  ok: boolean;
  /** Failure detail (HTTP status, error message, cap overrun) */
  detail?: string;
  /**
   * When the attempt happened
   * @format date-time
   */
  at: string | null;
}

export interface NotifierConfig {
  /**
   * Notifier id (synthesized on first boot for env-derived notifiers)
   * @minLength 1
   */
  id: string;
  /** Notifier type (Phase 1: webhook, email) */
  type: "webhook" | "email";
  /**
   * Email channel provider id (required for email notifiers)
   * @minLength 1
   */
  channelProviderId?: string;
  /**
   * Webhook delivery URL, http(s) (required for webhook notifiers)
   * @format uri
   */
  url?: string;
  /**
   * Recipient email address (required for email notifiers)
   * @format email
   */
  to?: string;
  /** Only deliver alerts at or above this severity (default: all) */
  minSeverity?: "info" | "warning" | "critical";
  /** Disabled notifiers are skipped by the publisher */
  enabled: boolean;
}

export interface RuleOverride {
  /** Disable the rule without deleting its override */
  enabled?: boolean;
  /** Rule threshold (rate, count, or ms — per-rule semantics) */
  threshold?: number;
  /**
   * Evaluation window in minutes
   * @min 0
   * @exclusiveMin true
   */
  windowMinutes?: number;
  /**
   * Minimum samples before the rule may fire
   * @min 0
   * @exclusiveMin true
   */
  minSamples?: number;
  /**
   * Sustainment in minutes before firing
   * @min 0
   */
  forMinutes?: number;
  /**
   * Consecutive good evaluations to auto-resolve
   * @min 0
   */
  resolveAfterGoodChecks?: number;
  /**
   * Minimum gap between re-fires of the same key
   * @min 0
   */
  cooldownMinutes?: number;
  /**
   * Auto-resolve safety valve in hours
   * @min 0
   * @exclusiveMin true
   */
  maxUnresolvedHours?: number;
  /** Override the rule default severity */
  severity?: "info" | "warning" | "critical";
}

/**
 * Provider health probe policy (P1-05 consumes this)
 * @default {"llmProbe":"models","cooldownMinutes":10}
 */
export interface ProbeSettings {
  /**
   * LLM health probe mode: 'models' = enumerateModels() (free), 'one_token' = 1-token generation (costs money), 'off' = call-log inference only
   * @default "models"
   */
  llmProbe?: "models" | "one_token" | "off";
  /**
   * Minimum minutes between probes of the same provider
   * @min 0
   * @default 10
   */
  cooldownMinutes?: number;
}

/**
 * Alert engine settings (P2-01 consumes this)
 * @default {"engineIntervalMinutes":1,"defaultCooldownMinutes":15}
 */
export interface AlertingSettings {
  /**
   * Alert rule engine interval in minutes (P2-01)
   * @min 1
   * @default 1
   */
  engineIntervalMinutes?: number;
  /**
   * Default per-key re-fire cooldown in minutes (P2-01)
   * @min 0
   * @default 15
   */
  defaultCooldownMinutes?: number;
}
