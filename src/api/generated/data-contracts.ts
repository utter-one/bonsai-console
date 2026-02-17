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
      type: "run_script";
    } & RunScriptEffect)
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
      type: "call_webhook";
    } & CallWebhookEffect)
  | ({
      type: "generate_response";
    } & GenerateResponseEffect);

/** List query parameters for filtering, sorting, pagination, and search */
export interface ListParams {
  /**
   * Starting index for pagination (default: 0)
   * @min 0
   * @default 0
   */
  offset?: number | null;
  /**
   * Maximum number of items to return (optional, null for no limit)
   * @min 0
   * @exclusiveMin true
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

/** LLM provider-specific settings for this stage */
export type LlmSettings =
  | OpenAILlmSettings
  | OpenAILegacyLlmSettings
  | AnthropicLlmSettings
  | GeminiLlmSettings;

export interface ElevenLabsTtsSettings {
  /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
  model?: string;
  /** Voice UUID to use for speech synthesis */
  voiceId?: string;
  /** Preferred audio output format for synthesized speech */
  audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
  /** Model version to use ("aura-1" or "aura-2") */
  model?: "aura-1" | "aura-2";
  /** Voice ID to use for speech synthesis (e.g., "thalia-en", "andromeda-en"). Combined with model to form full model string (e.g., "aura-2-thalia-en") */
  voiceId?: string;
  /** Preferred audio output format. Streaming supports: linear16, opus, mulaw, alaw. REST-only: mp3, flac, aac */
  audioFormat?: "linear16" | "opus" | "mulaw" | "alaw" | "mp3" | "flac" | "aac";
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
    | "opus"
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

/** ASR configuration settings */
export interface AsrConfig {
  /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
  asrProviderId?: string;
  /** ASR-specific settings including model, language preferences, etc. */
  settings?: {
    /** The language code for speech recognition (e.g., "en-US") */
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
      | "alaw"
      | "linear16";
  };
  /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
  unintelligiblePlaceholder?: string;
  /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
  voiceActivityDetection?: boolean;
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

export interface RunScriptEffect {
  /** Effect type */
  type: "run_script";
  /**
   * JavaScript code to execute in isolated context
   * @minLength 1
   */
  code: string;
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

export interface CallWebhookEffect {
  /** Effect type */
  type: "call_webhook";
  /**
   * HTTP(S) URL to call
   * @format uri
   */
  url: string;
  /**
   * HTTP method to use
   * @default "GET"
   */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** HTTP headers to send with the request */
  headers?: Record<string, string>;
  /** Request body for POST/PUT/PATCH requests */
  body?: any;
  /**
   * Key name to store the webhook result under in context.results.webhooks
   * @minLength 1
   */
  resultKey: string;
}

export interface GenerateResponseEffect {
  /** Effect type */
  type: "generate_response";
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
    | "object[]";
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
    | "object[]";
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
  /** Additional action-specific metadata */
  metadata?: Record<string, any>;
}

export interface CreateAdminRequest {
  /**
   * Unique identifier for the admin user (auto-generated if not provided)
   * @minLength 1
   */
  id: string;
  /**
   * Display name for the admin user
   * @minLength 1
   */
  name: string;
  /**
   * Array of role identifiers assigned to the admin (at least one required). Valid roles: super_admin, content_manager, support, developer, viewer
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
   * Admin user password (will be hashed)
   * @minLength 1
   */
  password: string;
  /** Optional metadata as key-value pairs */
  metadata?: Record<string, any>;
}

export interface UpdateAdminRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent updates)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
  /**
   * Updated display name for the admin user
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

export interface DeleteAdminRequest {
  /**
   * Current version number for optimistic locking (prevents concurrent deletions)
   * @min 0
   * @exclusiveMin true
   */
  version: number;
}

export interface AdminResponse {
  /** Unique identifier for the admin user */
  id: string;
  /** Display name of the admin user */
  name: string;
  /** Array of role identifiers assigned to the admin */
  roles: string[];
  /** Metadata as key-value pairs */
  metadata?: Record<string, any>;
  /** Current version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the admin user was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the admin user was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface AdminListResponse {
  /** Array of admin users in the current page */
  items: {
    /** Unique identifier for the admin user */
    id: string;
    /** Display name of the admin user */
    name: string;
    /** Array of role identifiers assigned to the admin */
    roles: string[];
    /** Metadata as key-value pairs */
    metadata?: Record<string, any>;
    /** Current version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the admin user was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the admin user was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of admin users matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface UpdateProfileRequest {
  /**
   * Updated display name for the admin user
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
  /** Unique identifier for the admin user */
  id: string;
  /** Display name of the admin user */
  name: string;
  /** Array of role identifiers assigned to the admin */
  roles: string[];
  /** Metadata as key-value pairs */
  metadata?: Record<string, any>;
  /** Current version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the admin user was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the admin user was last updated
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
}

export interface UserResponse {
  /** Unique identifier for the user */
  id: string;
  /** User profile data as key-value pairs */
  profile: Record<string, any>;
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
}

export interface UserListResponse {
  /** Array of users in the current page */
  items: {
    /** Unique identifier for the user */
    id: string;
    /** User profile data as key-value pairs */
    profile: Record<string, any>;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateProjectRequest {
  /**
   * The name of the project
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** A description of the project */
  description?: string;
  /** Optional ASR configuration settings */
  asrConfig?: {
    /** ID of the ASR provider (e.g., "azure-speech", "openai-whisper") */
    asrProviderId?: string;
    /** ASR-specific settings including model, language preferences, etc. */
    settings?: {
      /** The language code for speech recognition (e.g., "en-US") */
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
        | "alaw"
        | "linear16";
    };
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
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
  /** Key-value store of constants used in templating and conversation logic */
  constants?: Record<string, any>;
  /** Additional metadata for the project */
  metadata?: Record<string, any>;
}

export interface UpdateProjectRequest {
  /**
   * The updated name of the project
   * @minLength 1
   * @maxLength 255
   */
  name?: string;
  /** The updated description of the project */
  description?: string;
  /** Updated ASR configuration settings */
  asrConfig?: AsrConfig;
  /** Whether conversations can accept voice input (requires asrConfig fully populated) */
  acceptVoice?: boolean;
  /** Whether conversations generate voice responses (requires ttsConfig fully populated in Stages) */
  generateVoice?: boolean;
  /** Updated storage configuration settings */
  storageConfig?: StorageConfig;
  /** Updated constants key-value store */
  constants?: Record<string, any>;
  /** Updated metadata for the project */
  metadata?: Record<string, any>;
  /** The current version number for optimistic locking */
  version: number;
}

/** Updated storage configuration settings */
export interface StorageConfig {
  /** ID of the storage provider (e.g., "s3-provider", "azure-blob-provider") */
  storageProviderId?: string;
  /** Storage-specific settings including bucket, prefix, etc. */
  settings?:
    | S3StorageSettings
    | AzureBlobStorageSettings
    | GcsStorageSettings
    | LocalStorageSettings;
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
    settings?: {
      /** The language code for speech recognition (e.g., "en-US") */
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
        | "alaw"
        | "linear16";
    };
    /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
    unintelligiblePlaceholder?: string;
    /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
    voiceActivityDetection?: boolean;
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
  /** Key-value store of constants used in templating and conversation logic */
  constants: Record<string, any>;
  /** Additional metadata for the project */
  metadata: Record<string, any>;
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
      settings?: {
        /** The language code for speech recognition (e.g., "en-US") */
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
          | "alaw"
          | "linear16";
      };
      /** Placeholder text to use when speech is unintelligible or cannot be transcribed */
      unintelligiblePlaceholder?: string;
      /** Whether to enable voice activity detection to automatically start/stop recording based on speech presence */
      voiceActivityDetection?: boolean;
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
    /** Key-value store of constants used in templating and conversation logic */
    constants: Record<string, any>;
    /** Additional metadata for the project */
    metadata: Record<string, any>;
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
  }[];
  /** Total number of projects */
  total: number;
}

export interface CreatePersonaRequest {
  /**
   * Unique identifier for the persona (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this persona belongs to
   * @minLength 1
   */
  projectId: string;
  /**
   * Display name of the persona
   * @minLength 1
   */
  name: string;
  /** Detailed description of the persona purpose */
  description?: string;
  /**
   * Detailed prompt defining the persona's characteristics and behavior
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
    | CartesiaTtsSettings;
  /** Additional persona-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdatePersonaRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated detailed description of the persona */
  description?: string;
  /**
   * Updated prompt defining behavior
   * @minLength 1
   */
  prompt?: string;
  /** Updated TTS provider ID */
  ttsProviderId?: string;
  /** Updated TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings;
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface DeletePersonaRequest {
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
}

export interface PersonaResponse {
  /** Unique identifier for the persona */
  id: string;
  /** ID of the project this persona belongs to */
  projectId: string;
  /** Display name of the persona */
  name: string;
  /** Detailed description of the persona purpose */
  description: string | null;
  /** Prompt defining the persona's characteristics and behavior */
  prompt: string;
  /** ID of the TTS provider */
  ttsProviderId: string | null;
  /** TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings;
  /** Additional persona-specific metadata */
  metadata: Record<string, any>;
  /** Version number for optimistic locking */
  version: number;
  /**
   * Timestamp when the persona was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the persona was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface PersonaListResponse {
  /** Array of personas in the current page */
  items: {
    /** Unique identifier for the persona */
    id: string;
    /** ID of the project this persona belongs to */
    projectId: string;
    /** Display name of the persona */
    name: string;
    /** Detailed description of the persona purpose */
    description: string | null;
    /** Prompt defining the persona's characteristics and behavior */
    prompt: string;
    /** ID of the TTS provider */
    ttsProviderId: string | null;
    /** TTS provider-specific settings */
    ttsSettings?:
      | ElevenLabsTtsSettings
      | OpenAiTtsSettings
      | DeepgramTtsSettings
      | CartesiaTtsSettings;
    /** Additional persona-specific metadata */
    metadata: Record<string, any>;
    /** Version number for optimistic locking */
    version: number;
    /**
     * Timestamp when the persona was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the persona was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of personas matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface LoginRequest {
  /**
   * Admin user ID or email
   * @minLength 1
   */
  id: string;
  /**
   * Admin user password
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
  /** JWT access token (expires in 15 minutes) */
  accessToken: string;
  /** JWT refresh token (expires in 7 days) */
  refreshToken: string;
  /**
   * Access token expiry time in seconds
   * @min 0
   * @exclusiveMin true
   */
  expiresIn: number;
  /** Admin user ID */
  adminId: string;
  /** Admin display name */
  displayName: string;
  /** Array of role identifiers */
  roles: string[];
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
}

export interface InitialAdminSetupRequest {
  /**
   * Unique identifier for the admin user (typically an email address)
   * @minLength 1
   */
  id: string;
  /**
   * Display name for the admin user
   * @minLength 1
   */
  name: string;
  /**
   * Admin user password (minimum 8 characters, will be hashed)
   * @minLength 8
   */
  password: string;
  /** Optional metadata as key-value pairs */
  metadata?: Record<string, any>;
}

export interface SetupStatusResponse {
  /** Whether the system has been set up with at least one admin account */
  isSetup: boolean;
  /** Descriptive message about the setup status */
  message: string;
}

export interface InitialAdminSetupResponse {
  /** Created admin user details */
  admin: {
    /** Unique identifier for the admin user */
    id: string;
    /** Display name of the admin user */
    name: string;
    /** Array of role identifiers assigned to the admin */
    roles: string[];
    /** Metadata as key-value pairs */
    metadata?: Record<string, any>;
    /**
     * Timestamp when the admin user was created
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

export interface CreateKnowledgeSectionRequest {
  /**
   * Unique identifier for the knowledge section (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * Name of the knowledge section
   * @minLength 1
   */
  name: string;
}

export interface UpdateKnowledgeSectionRequest {
  /**
   * Updated name of the knowledge section
   * @minLength 1
   */
  name: string;
}

export interface KnowledgeSectionResponse {
  /** Unique identifier for the knowledge section */
  id: string;
  /** Name of the knowledge section */
  name: string;
  /**
   * Timestamp when the section was created
   * @format date-time
   */
  createdAt: string | null;
  /**
   * Timestamp when the section was last updated
   * @format date-time
   */
  updatedAt: string | null;
}

export interface KnowledgeSectionListResponse {
  /** Array of knowledge sections in the current page */
  items: {
    /** Unique identifier for the knowledge section */
    id: string;
    /** Name of the knowledge section */
    name: string;
    /**
     * Timestamp when the section was created
     * @format date-time
     */
    createdAt: string | null;
    /**
     * Timestamp when the section was last updated
     * @format date-time
     */
    updatedAt: string | null;
  }[];
  /**
   * Total number of sections matching the query
   * @min 0
   */
  total: number;
  /**
   * Starting index of the current page
   * @min 0
   */
  offset: number;
  /**
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateKnowledgeCategoryRequest {
  /**
   * Unique identifier for the knowledge category (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this knowledge category belongs to
   * @minLength 1
   */
  projectId: string;
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
  /** Array of knowledge section IDs this category belongs to */
  knowledgeSections?: string[];
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
  /** Updated array of knowledge section IDs */
  knowledgeSections?: string[];
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
  /** Array of knowledge section IDs */
  knowledgeSections: string[];
  /** Display order for the category */
  order: number;
  /** Knowledge items within this category */
  items?: {
    /** Unique identifier for the knowledge item */
    id: string;
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
    /** Array of knowledge section IDs */
    knowledgeSections: string[];
    /** Display order for the category */
    order: number;
    /** Knowledge items within this category */
    items?: {
      /** Unique identifier for the knowledge item */
      id: string;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
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
}

export interface KnowledgeItemListResponse {
  /** Array of knowledge items in the current page */
  items: {
    /** Unique identifier for the knowledge item */
    id: string;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateIssueRequest {
  /**
   * ID of the project this issue belongs to
   * @minLength 1
   */
  projectId: string;
  /**
   * Environment where issue occurred (e.g., production, staging, development)
   * @minLength 1
   */
  environment: string;
  /**
   * Application build version where the issue was encountered
   * @minLength 1
   */
  buildVersion: string;
  /** Beat/sprint identifier for tracking purposes */
  beat?: string;
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
  /**
   * Environment where issue occurred
   * @minLength 1
   */
  environment?: string;
  /**
   * Application build version
   * @minLength 1
   */
  buildVersion?: string;
  /** Beat/sprint identifier */
  beat?: string;
  /** Related conversation session ID */
  sessionId?: string;
  /** Event index in session */
  eventIndex?: number;
  /** User ID who reported the issue */
  userId?: string;
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
  /** Beat/sprint identifier */
  beat: string | null;
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
    /** Beat/sprint identifier */
    beat: string | null;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface ConversationResponse {
  /** Unique identifier for the conversation */
  id: string;
  /** Identifier of the project this conversation belongs to */
  projectId: string;
  /** Identifier of the user associated with this conversation */
  userId: string;
  /** Client identifier for the conversation */
  clientId: string;
  /** Current stage identifier for the conversation */
  stageId: string;
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
    /** Client identifier for the conversation */
    clientId: string;
    /** Current stage identifier for the conversation */
    stageId: string;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface ConversationEventResponse {
  /** Unique identifier for the conversation event */
  id: string;
  /** Identifier of the conversation this event belongs to */
  conversationId: string;
  /** Type of the conversation event */
  eventType:
    | "message"
    | "classification"
    | "action"
    | "command"
    | "tool_call"
    | "conversation_start"
    | "conversation_resume"
    | "conversation_end"
    | "conversation_aborted"
    | "conversation_failed"
    | "jump_to_stage";
  /** Event data payload */
  eventData:
    | {
        role: "user" | "assistant";
        text: string;
        originalText: string;
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
            parameters: Record<string, any>;
          }[];
        }[];
        metadata?: Record<string, any>;
      }
    | {
        actionName: string;
        stageId: string;
        effects: Effect[];
        metadata?: Record<string, any>;
      }
    | {
        command: string;
        parameters?: Record<string, any>;
        metadata?: Record<string, any>;
      }
    | {
        toolId: string;
        toolName: string;
        parameters: Record<string, any>;
        success: boolean;
        result?: (
          | {
              contentType: "text";
              text: string;
            }
          | {
              contentType: "image";
              /** Base64-encoded image data */
              data: string;
              /** MIME type (e.g., image/png, image/jpeg) */
              mimeType: string;
              metadata?: {
                width?: number;
                height?: number;
                [key: string]: any;
              };
            }
          | {
              contentType: "audio";
              /** Base64-encoded audio data */
              data: string;
              /** Audio format */
              format: "pcm" | "mp3" | "wav" | "opus";
              /** MIME type (e.g., audio/pcm, audio/mpeg) */
              mimeType: string;
              metadata?: {
                sampleRate?: number;
                channels?: number;
                bitDepth?: number;
                [key: string]: any;
              };
            }
        )[];
        error?: string;
        metadata?: Record<string, any>;
      }
    | {
        stageId: string;
        initialVariables?: Record<string, any>;
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
        metadata?: Record<string, any>;
      }
    | {
        reason: string;
        stageId: string;
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
        metadata?: Record<string, any>;
      };
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
    /** Identifier of the conversation this event belongs to */
    conversationId: string;
    /** Type of the conversation event */
    eventType:
      | "message"
      | "classification"
      | "action"
      | "command"
      | "tool_call"
      | "conversation_start"
      | "conversation_resume"
      | "conversation_end"
      | "conversation_aborted"
      | "conversation_failed"
      | "jump_to_stage";
    /** Event data payload */
    eventData:
      | {
          role: "user" | "assistant";
          text: string;
          originalText: string;
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
              parameters: Record<string, any>;
            }[];
          }[];
          metadata?: Record<string, any>;
        }
      | {
          actionName: string;
          stageId: string;
          effects: Effect[];
          metadata?: Record<string, any>;
        }
      | {
          command: string;
          parameters?: Record<string, any>;
          metadata?: Record<string, any>;
        }
      | {
          toolId: string;
          toolName: string;
          parameters: Record<string, any>;
          success: boolean;
          result?: (
            | {
                contentType: "text";
                text: string;
              }
            | {
                contentType: "image";
                /** Base64-encoded image data */
                data: string;
                /** MIME type (e.g., image/png, image/jpeg) */
                mimeType: string;
                metadata?: {
                  width?: number;
                  height?: number;
                  [key: string]: any;
                };
              }
            | {
                contentType: "audio";
                /** Base64-encoded audio data */
                data: string;
                /** Audio format */
                format: "pcm" | "mp3" | "wav" | "opus";
                /** MIME type (e.g., audio/pcm, audio/mpeg) */
                mimeType: string;
                metadata?: {
                  sampleRate?: number;
                  channels?: number;
                  bitDepth?: number;
                  [key: string]: any;
                };
              }
          )[];
          error?: string;
          metadata?: Record<string, any>;
        }
      | {
          stageId: string;
          initialVariables?: Record<string, any>;
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
          metadata?: Record<string, any>;
        }
      | {
          reason: string;
          stageId: string;
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
          metadata?: Record<string, any>;
        };
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateStageRequest {
  /**
   * Unique identifier for the stage (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this stage belongs to
   * @minLength 1
   */
  projectId: string;
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
  /** ID of the LLM provider to use for this stage */
  llmProviderId?: string | null;
  /** LLM provider-specific settings for this stage */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /**
   * ID of the persona associated with this stage
   * @minLength 1
   */
  personaId: string;
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
   * List of knowledge section IDs to include
   * @default []
   */
  knowledgeSections?: string[];
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
  /** Variable definitions for this stage */
  variables?: Record<string, any>;
  /** Action definitions for this stage */
  actions?: Record<string, StageAction>;
  /** ID of the default classifier to use for this stage (can be overridden per action) */
  defaultClassifierId?: string | null;
  /**
   * List of context transformer IDs to use in this stage
   * @default []
   */
  transformerIds?: string[];
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
  description?: string;
  /**
   * Updated system prompt
   * @minLength 1
   */
  prompt?: string;
  /** Updated LLM provider ID */
  llmProviderId?: string | null;
  /** Updated LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /**
   * Updated persona ID
   * @minLength 1
   */
  personaId?: string;
  /** Updated behavior when entering this stage */
  enterBehavior?: "generate_response" | "await_user_input";
  /** Updated knowledge usage flag */
  useKnowledge?: boolean;
  /** Updated knowledge section IDs */
  knowledgeSections?: string[];
  /** Updated global actions flag */
  useGlobalActions?: boolean;
  /** Updated global action IDs */
  globalActions?: string[];
  /** Updated variable definitions */
  variables?: Record<string, any>;
  /** Updated action definitions */
  actions?: Record<string, StageAction>;
  /** Updated default classifier ID */
  defaultClassifierId?: string | null;
  /** Updated transformer IDs */
  transformerIds?: string[];
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
  /** ID of the associated persona */
  personaId: string;
  /** What happens when entering the stage */
  enterBehavior: "generate_response" | "await_user_input";
  /** Whether knowledge base is enabled */
  useKnowledge: boolean;
  /** Knowledge section IDs included in this stage */
  knowledgeSections: string[];
  /** Whether global actions are enabled */
  useGlobalActions: boolean;
  /** Global action IDs available in this stage */
  globalActions: string[];
  /** Variable definitions */
  variables: Record<string, any>;
  /** Action definitions */
  actions: Record<string, StageAction>;
  /** Default classifier ID used in this stage (actions can override with overrideClassifierId) */
  defaultClassifierId: string | null;
  /** Context transformer IDs used in this stage */
  transformerIds: string[];
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
    /** ID of the associated persona */
    personaId: string;
    /** What happens when entering the stage */
    enterBehavior: "generate_response" | "await_user_input";
    /** Whether knowledge base is enabled */
    useKnowledge: boolean;
    /** Knowledge section IDs included in this stage */
    knowledgeSections: string[];
    /** Whether global actions are enabled */
    useGlobalActions: boolean;
    /** Global action IDs available in this stage */
    globalActions: string[];
    /** Variable definitions */
    variables: Record<string, any>;
    /** Action definitions */
    actions: Record<string, StageAction>;
    /** Default classifier ID used in this stage (actions can override with overrideClassifierId) */
    defaultClassifierId: string | null;
    /** Context transformer IDs used in this stage */
    transformerIds: string[];
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateClassifierRequest {
  /**
   * Unique identifier for the classifier (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this classifier belongs to
   * @minLength 1
   */
  projectId: string;
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
  /** ID of the LLM provider to use for this classifier */
  llmProviderId?: string | null;
  /** LLM provider-specific settings for this classifier */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
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
  /** Updated LLM provider ID */
  llmProviderId?: string | null;
  /** Updated LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateContextTransformerRequest {
  /**
   * Unique identifier for the context transformer (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this context transformer belongs to
   * @minLength 1
   */
  projectId: string;
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
  /** ID of the LLM provider to use for this transformer */
  llmProviderId?: string | null;
  /** LLM provider-specific settings for this transformer */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
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
  /** Updated LLM provider ID */
  llmProviderId?: string | null;
  /** Updated LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateToolRequest {
  /**
   * Unique identifier for the tool (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this tool belongs to
   * @minLength 1
   */
  projectId: string;
  /**
   * Display name of the tool
   * @minLength 1
   */
  name: string;
  /** Detailed description of the tool's purpose and behavior */
  description?: string | null;
  /**
   * Handlebars template for tool invocation
   * @minLength 1
   */
  prompt: string;
  /** ID of the LLM provider to use for this tool */
  llmProviderId?: string | null;
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
  /**
   * Parameters that this tool expects to receive
   * @default []
   */
  parameters?: ToolParameter[];
  /** Additional tool-specific metadata */
  metadata?: Record<string, any>;
}

export interface UpdateToolRequest {
  /**
   * Updated display name
   * @minLength 1
   */
  name?: string;
  /** Updated description */
  description?: string | null;
  /**
   * Updated tool prompt template
   * @minLength 1
   */
  prompt?: string;
  /** Updated LLM provider ID */
  llmProviderId?: string | null;
  /** Updated LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Updated input format */
  inputType?: "text" | "image" | "multi-modal";
  /** Updated output format */
  outputType?: "text" | "image" | "multi-modal";
  /** Updated parameters for the tool */
  parameters?: ToolParameter[];
  /** Updated metadata */
  metadata?: Record<string, any>;
  /**
   * Current version number for optimistic locking
   * @min 1
   */
  version: number;
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
  /** Handlebars template for tool invocation */
  prompt: string;
  /** ID of the LLM provider */
  llmProviderId: string | null;
  /** LLM provider-specific settings */
  llmSettings?:
    | OpenAILlmSettings
    | OpenAILegacyLlmSettings
    | AnthropicLlmSettings
    | GeminiLlmSettings;
  /** Expected input format */
  inputType: "text" | "image" | "multi-modal";
  /** Expected output format */
  outputType: "text" | "image" | "multi-modal";
  /** Parameters that this tool expects to receive */
  parameters: ToolParameter[];
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
    /** Handlebars template for tool invocation */
    prompt: string;
    /** ID of the LLM provider */
    llmProviderId: string | null;
    /** LLM provider-specific settings */
    llmSettings?:
      | OpenAILlmSettings
      | OpenAILegacyLlmSettings
      | AnthropicLlmSettings
      | GeminiLlmSettings;
    /** Expected input format */
    inputType: "text" | "image" | "multi-modal";
    /** Expected output format */
    outputType: "text" | "image" | "multi-modal";
    /** Parameters that this tool expects to receive */
    parameters: ToolParameter[];
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateGlobalActionRequest {
  /**
   * Unique identifier for the global action (auto-generated if not provided)
   * @minLength 1
   */
  id?: string;
  /**
   * ID of the project this global action belongs to
   * @minLength 1
   */
  projectId: string;
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
  /** Array of effects to execute when action is triggered */
  effects?: Effect[];
  /** Example phrases that trigger this action */
  examples?: string[];
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
  /** Updated effects array */
  effects?: Effect[];
  /** Updated example phrases */
  examples?: string[];
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
  /** Array of effects to execute */
  effects: Effect[];
  /** Example phrases that trigger this action */
  examples: string[] | null;
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
    /** Array of effects to execute */
    effects: Effect[];
    /** Example phrases that trigger this action */
    examples: string[] | null;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
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
  providerType: "asr" | "tts" | "llm" | "embeddings" | "storage";
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
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig;
  /** Admin user ID who created the provider */
  createdBy?: string;
  /** Searchable tags for organization (e.g., ["production", "low-latency"]) */
  tags?: string[];
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
  description?: string;
  /** Updated provider category */
  providerType?: "asr" | "tts" | "llm" | "embeddings" | "storage";
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
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig;
  /** Updated searchable tags */
  tags?: string[];
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
  providerType: "asr" | "tts" | "llm" | "embeddings" | "storage";
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
        /** The Azure region to use for the speech recognition service */
        region: string;
        /** The subscription key to use for the speech recognition service */
        subscriptionKey: string;
      }
    | S3StorageConfig
    | AzureBlobStorageConfig
    | GcsStorageConfig
    | LocalStorageConfig;
  /** Admin user ID who created the provider */
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
    providerType: "asr" | "tts" | "llm" | "embeddings" | "storage";
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
          /** The Azure region to use for the speech recognition service */
          region: string;
          /** The subscription key to use for the speech recognition service */
          subscriptionKey: string;
        }
      | S3StorageConfig
      | AzureBlobStorageConfig
      | GcsStorageConfig
      | LocalStorageConfig;
    /** Admin user ID who created the provider */
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
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
  /** ID of the admin user who performed the action */
  userId: string | null;
  /** Action performed (CREATE, UPDATE, DELETE) */
  action: string;
  /** ID of the entity that was modified */
  entityId: string;
  /** Type of the entity (e.g., "admin", "persona", "classifier") */
  entityType: string;
  /** Entity state before the change */
  oldEntity: Record<string, any>;
  /** Entity state after the change */
  newEntity: Record<string, any>;
  /** Version number for the audit log */
  version: number;
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
    /** ID of the admin user who performed the action */
    userId: string | null;
    /** Action performed (CREATE, UPDATE, DELETE) */
    action: string;
    /** ID of the entity that was modified */
    entityId: string;
    /** Type of the entity (e.g., "admin", "persona", "classifier") */
    entityType: string;
    /** Entity state before the change */
    oldEntity: Record<string, any>;
    /** Entity state after the change */
    newEntity: Record<string, any>;
    /** Version number for the audit log */
    version: number;
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
   * Maximum number of items per page (null if no limit)
   * @min 0
   * @exclusiveMin true
   */
  limit: number | null;
}

export interface CreateApiKeyRequest {
  /**
   * The ID of the project this API key belongs to
   * @minLength 1
   */
  projectId: string;
  /**
   * A descriptive name for the API key
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** Additional metadata for the API key */
  metadata?: Record<string, any>;
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
  /** Version number for optimistic locking */
  version: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
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
    /** Version number for optimistic locking */
    version: number;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
  }[];
  /** Total number of API keys matching the query */
  total: number;
}
