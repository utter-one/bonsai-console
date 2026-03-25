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

import {
  AmazonPollyTtsSettings,
  AnthropicLlmSettings,
  ApiKeySettings,
  AsrModelInfo,
  AssemblyAiAsrSettings,
  AzureAsrSettings,
  AzureBlobStorageConfig,
  AzureBlobStorageSettings,
  AzureTtsSettings,
  CartesiaTtsSettings,
  ConversationTimelineResponse,
  CreateToolRequest,
  DeepgramAsrSettings,
  DeepgramTtsSettings,
  Effect,
  ElevenLabsAsrSettings,
  ElevenLabsTtsSettings,
  ExportBundle,
  FieldDescriptor,
  FillerSettings,
  GcsStorageConfig,
  GcsStorageSettings,
  GeminiLlmSettings,
  LanguageInfo,
  LatencyPercentilesResponse,
  LatencyStatsResponse,
  LatencyTrendResponse,
  ListFilterOperation,
  LlmModelInfo,
  LlmSettings,
  LocalStorageConfig,
  LocalStorageSettings,
  MigrationJob,
  MigrationPreview,
  ModerationProviderInfo,
  OpenAILegacyLlmSettings,
  OpenAILlmSettings,
  OpenAiTtsSettings,
  ParameterValue,
  ProjectExchangeBundleV1,
  ProjectExchangeImportResult,
  S3StorageConfig,
  S3StorageSettings,
  SpeechmaticsAsrSettings,
  StageAction,
  StageActionParameter,
  ToolParameter,
  TtsModelInfo,
  VoiceInfo,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Creates a new operator user with the specified credentials and roles
   *
   * @tags Operators
   * @name OperatorsCreate
   * @summary Create a new operator user
   * @request POST:/api/operators
   * @secure
   */
  operatorsCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/operators`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of operator users with optional filtering
   *
   * @tags Operators
   * @name OperatorsList
   * @summary List operator users
   * @request GET:/api/operators
   * @secure
   */
  operatorsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/operators`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single operator user by their unique identifier
   *
   * @tags Operators
   * @name OperatorsDetail
   * @summary Get operator user by ID
   * @request GET:/api/operators/{id}
   * @secure
   */
  operatorsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/operators/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing operator user with optimistic locking
   *
   * @tags Operators
   * @name OperatorsUpdate
   * @summary Update operator user
   * @request PUT:/api/operators/{id}
   * @secure
   */
  operatorsUpdate = (
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/operators/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes an operator user with optimistic locking
   *
   * @tags Operators
   * @name OperatorsDelete
   * @summary Delete operator user
   * @request DELETE:/api/operators/{id}
   * @secure
   */
  operatorsDelete = (
    id: string,
    data: {
      /**
       * Current version number for optimistic locking (prevents concurrent deletions)
       * @min 0
       * @exclusiveMin true
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/operators/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific operator user
   *
   * @tags Operators
   * @name OperatorsAuditLogsList
   * @summary Get operator audit logs
   * @request GET:/api/operators/{id}/audit-logs
   * @secure
   */
  operatorsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/operators/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves the profile information of the currently logged-in operator user
   *
   * @tags Profile
   * @name ProfileList
   * @summary Get own profile
   * @request GET:/api/profile
   * @secure
   */
  profileList = (params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/profile`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates the profile of the currently logged-in operator user. Allows changing display name and/or password. When changing password, the old password must be provided for verification.
   *
   * @tags Profile
   * @name ProfileCreate
   * @summary Update own profile
   * @request POST:/api/profile
   * @secure
   */
  profileCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/profile`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Authenticate an operator user with email/ID and password. Returns access and refresh tokens.
   *
   * @tags Authentication
   * @name AuthLoginCreate
   * @summary Login with credentials
   * @request POST:/api/auth/login
   * @secure
   */
  authLoginCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/auth/login`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get a new access token using a valid refresh token
   *
   * @tags Authentication
   * @name AuthRefreshCreate
   * @summary Refresh access token
   * @request POST:/api/auth/refresh
   * @secure
   */
  authRefreshCreate = (
    data: {
      /**
       * Valid refresh token
       * @minLength 1
       */
      refreshToken: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        /** New JWT access token (expires in 15 minutes) */
        accessToken: string;
        /**
         * Access token expiry time in seconds
         * @min 0
         * @exclusiveMin true
         */
        expiresIn: number;
      },
      void
    >({
      path: `/api/auth/refresh`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Returns whether the system has been initialized with at least one operator account
   *
   * @tags Setup
   * @name SetupStatusList
   * @summary Check system setup status
   * @request GET:/api/setup/status
   * @secure
   */
  setupStatusList = (params: RequestParams = {}) =>
    this.request<
      {
        /** Whether the system has been set up with at least one operator account */
        isSetup: boolean;
        /** Descriptive message about the setup status */
        message: string;
      },
      any
    >({
      path: `/api/setup/status`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates the first operator account with super_admin role. This endpoint only works when no operator accounts exist. Returns operator details and authentication tokens for immediate login.
   *
   * @tags Setup
   * @name SetupInitialOperatorCreate
   * @summary Create initial operator account
   * @request POST:/api/setup/initial-operator
   * @secure
   */
  setupInitialOperatorCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/setup/initial-operator`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new project that groups stages, agents, classifiers, context transformers, tools, knowledge, actions, and issues
   *
   * @tags Projects
   * @name ProjectsCreate
   * @summary Create a new project
   * @request POST:/api/projects
   * @secure
   */
  projectsCreate = (
    data: {
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
      };
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
      /**
       * Timeout in seconds for active conversations with no activity. Set to 0 or omit to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
       * @min 0
       */
      conversationTimeoutSeconds?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
        } | null;
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
      },
      void
    >({
      path: `/api/projects`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of projects with optional filtering, sorting, and searching. Use ?archived=true to list archived projects.
   *
   * @tags Projects
   * @name ProjectsList
   * @summary List projects
   * @request GET:/api/projects
   * @secure
   */
  projectsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          } | null;
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
      },
      any
    >({
      path: `/api/projects`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single project by its unique identifier
   *
   * @tags Projects
   * @name ProjectsDetail
   * @summary Get project by ID
   * @request GET:/api/projects/{id}
   * @secure
   */
  projectsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
        } | null;
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
      },
      void
    >({
      path: `/api/projects/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing project with optimistic locking support
   *
   * @tags Projects
   * @name ProjectsUpdate
   * @summary Update project
   * @request PUT:/api/projects/{id}
   * @secure
   */
  projectsUpdate = (
    id: string,
    data: {
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
      /**
       * Timeout in seconds for active conversations with no activity. Set to 0 or null to disable. Conversations that have been inactive for longer than this value will be automatically aborted.
       * @min 0
       */
      conversationTimeoutSeconds?: number | null;
      /** The current version number for optimistic locking */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
        } | null;
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
      },
      void
    >({
      path: `/api/projects/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a project and all its associated entities
   *
   * @tags Projects
   * @name ProjectsDelete
   * @summary Delete project
   * @request DELETE:/api/projects/{id}
   * @secure
   */
  projectsDelete = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/projects/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Archives a project. Archived projects cannot be modified. Pass current version for optimistic locking.
   *
   * @tags Projects
   * @name ProjectsArchiveCreate
   * @summary Archive project
   * @request POST:/api/projects/{id}/archive
   * @secure
   */
  projectsArchiveCreate = (
    id: string,
    data: {
      /** The current version number for optimistic locking */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
        } | null;
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
      },
      void
    >({
      path: `/api/projects/${id}/archive`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Restores an archived project to active status. Pass current version for optimistic locking.
   *
   * @tags Projects
   * @name ProjectsUnarchiveCreate
   * @summary Unarchive project
   * @request POST:/api/projects/{id}/unarchive
   * @secure
   */
  projectsUnarchiveCreate = (
    id: string,
    data: {
      /** The current version number for optimistic locking */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
        } | null;
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
      },
      void
    >({
      path: `/api/projects/${id}/unarchive`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific project
   *
   * @tags Projects
   * @name ProjectsAuditLogsList
   * @summary Get project audit logs
   * @request GET:/api/projects/{id}/audit-logs
   * @secure
   */
  projectsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/projects/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves a paginated list of audit logs with optional filtering by entity type, action, user, or date range. Use filters for precise queries: entityType, action (CREATE/UPDATE/DELETE), userId, entityId, or date ranges with operators (gte, lte, between).
   *
   * @tags Audit Logs
   * @name AuditLogsList
   * @summary List audit logs
   * @request GET:/api/audit-logs
   * @secure
   */
  auditLogsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/audit-logs`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns aggregated latency statistics (avg, median, p95, min, max) for key turn-level metrics across conversations in the project. Supports filtering by date range, stage, and input source.
   *
   * @tags Analytics
   * @name ProjectsAnalyticsLatencyList
   * @summary Get aggregated latency statistics
   * @request GET:/api/projects/{projectId}/analytics/latency
   * @secure
   */
  projectsAnalyticsLatencyList = (
    projectId: string,
    query?: {
      /**
       * Start of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      from?: string | null;
      /**
       * End of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      to?: string | null;
      /** Filter by stage ID */
      stageId?: string;
      /** Filter by input source (text or voice) */
      source?: "text" | "voice";
    },
    params: RequestParams = {},
  ) =>
    this.request<LatencyStatsResponse, void>({
      path: `/api/projects/${projectId}/analytics/latency`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns percentile distributions (p50, p75, p90, p95, p99) for key turn-level duration metrics. Useful for understanding latency spread and tail performance.
   *
   * @tags Analytics
   * @name ProjectsAnalyticsLatencyPercentilesList
   * @summary Get latency percentile distributions
   * @request GET:/api/projects/{projectId}/analytics/latency/percentiles
   * @secure
   */
  projectsAnalyticsLatencyPercentilesList = (
    projectId: string,
    query?: {
      /**
       * Start of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      from?: string | null;
      /**
       * End of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      to?: string | null;
      /** Filter by stage ID */
      stageId?: string;
      /** Filter by input source (text or voice) */
      source?: "text" | "voice";
    },
    params: RequestParams = {},
  ) =>
    this.request<LatencyPercentilesResponse, void>({
      path: `/api/projects/${projectId}/analytics/latency/percentiles`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns a time-series of average latency values bucketed by the specified interval (hour, day, or week). Useful for detecting latency regressions or improvements over time.
   *
   * @tags Analytics
   * @name ProjectsAnalyticsLatencyTrendList
   * @summary Get latency trend over time
   * @request GET:/api/projects/{projectId}/analytics/latency/trend
   * @secure
   */
  projectsAnalyticsLatencyTrendList = (
    projectId: string,
    query?: {
      /**
       * Start of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      from?: string | null;
      /**
       * End of the date range (inclusive). ISO 8601 format.
       * @format date-time
       */
      to?: string | null;
      /** Filter by stage ID */
      stageId?: string;
      /** Filter by input source (text or voice) */
      source?: "text" | "voice";
      /**
       * Time bucket interval for the trend (hour, day, or week)
       * @default "day"
       */
      interval?: "hour" | "day" | "week";
    },
    params: RequestParams = {},
  ) =>
    this.request<LatencyTrendResponse, void>({
      path: `/api/projects/${projectId}/analytics/latency/trend`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns an ordered list of per-turn timing breakdowns for a specific conversation. Each turn combines user-side and assistant-side timing into a single row for waterfall visualization.
   *
   * @tags Analytics
   * @name ProjectsAnalyticsConversationsTimelineList
   * @summary Get conversation timeline
   * @request GET:/api/projects/{projectId}/analytics/conversations/{conversationId}/timeline
   * @secure
   */
  projectsAnalyticsConversationsTimelineList = (
    projectId: string,
    conversationId: string,
    params: RequestParams = {},
  ) =>
    this.request<ConversationTimelineResponse, void>({
      path: `/api/projects/${projectId}/analytics/conversations/${conversationId}/timeline`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new classifier with specified name, prompt, and configuration
   *
   * @tags Classifiers
   * @name ProjectsClassifiersCreate
   * @summary Create a new classifier
   * @request POST:/api/projects/{projectId}/classifiers
   * @secure
   */
  projectsClassifiersCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/classifiers`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of classifiers with optional filtering and sorting
   *
   * @tags Classifiers
   * @name ProjectsClassifiersList
   * @summary List classifiers
   * @request GET:/api/projects/{projectId}/classifiers
   * @secure
   */
  projectsClassifiersList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/classifiers`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single classifier by its unique identifier
   *
   * @tags Classifiers
   * @name ProjectsClassifiersDetail
   * @summary Get classifier by ID
   * @request GET:/api/projects/{projectId}/classifiers/{id}
   * @secure
   */
  projectsClassifiersDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/classifiers/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing classifier with optimistic locking
   *
   * @tags Classifiers
   * @name ProjectsClassifiersUpdate
   * @summary Update classifier
   * @request PUT:/api/projects/{projectId}/classifiers/{id}
   * @secure
   */
  projectsClassifiersUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/classifiers/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a classifier with optimistic locking
   *
   * @tags Classifiers
   * @name ProjectsClassifiersDelete
   * @summary Delete classifier
   * @request DELETE:/api/projects/{projectId}/classifiers/{id}
   * @secure
   */
  projectsClassifiersDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/classifiers/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific classifier
   *
   * @tags Classifiers
   * @name ProjectsClassifiersAuditLogsList
   * @summary Get classifier audit logs
   * @request GET:/api/projects/{projectId}/classifiers/{id}/audit-logs
   * @secure
   */
  projectsClassifiersAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/classifiers/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing classifier with a new ID and optional name override
   *
   * @tags Classifiers
   * @name ProjectsClassifiersCloneCreate
   * @summary Clone classifier
   * @request POST:/api/projects/{projectId}/classifiers/{id}/clone
   * @secure
   */
  projectsClassifiersCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned classifier (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned classifier (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/classifiers/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new context transformer with specified name, prompt, and configuration
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersCreate
   * @summary Create a new context transformer
   * @request POST:/api/projects/{projectId}/context-transformers
   * @secure
   */
  projectsContextTransformersCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/context-transformers`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of context transformers with optional filtering and sorting
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersList
   * @summary List context transformers
   * @request GET:/api/projects/{projectId}/context-transformers
   * @secure
   */
  projectsContextTransformersList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/context-transformers`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single context transformer by its unique identifier
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersDetail
   * @summary Get context transformer by ID
   * @request GET:/api/projects/{projectId}/context-transformers/{id}
   * @secure
   */
  projectsContextTransformersDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/context-transformers/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing context transformer with optimistic locking
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersUpdate
   * @summary Update context transformer
   * @request PUT:/api/projects/{projectId}/context-transformers/{id}
   * @secure
   */
  projectsContextTransformersUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/context-transformers/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a context transformer with optimistic locking
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersDelete
   * @summary Delete context transformer
   * @request DELETE:/api/projects/{projectId}/context-transformers/{id}
   * @secure
   */
  projectsContextTransformersDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/context-transformers/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific context transformer
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersAuditLogsList
   * @summary Get context transformer audit logs
   * @request GET:/api/projects/{projectId}/context-transformers/{id}/audit-logs
   * @secure
   */
  projectsContextTransformersAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/context-transformers/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing context transformer with a new ID and optional name override
   *
   * @tags Context Transformers
   * @name ProjectsContextTransformersCloneCreate
   * @summary Clone context transformer
   * @request POST:/api/projects/{projectId}/context-transformers/{id}/clone
   * @secure
   */
  projectsContextTransformersCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned context transformer (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned context transformer (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/context-transformers/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single conversation by its unique identifier
   *
   * @tags Conversations
   * @name ProjectsConversationsDetail
   * @summary Get conversation by ID
   * @request GET:/api/projects/{projectId}/conversations/{id}
   * @secure
   */
  projectsConversationsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/conversations/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a conversation and all its associated events (via cascade delete)
   *
   * @tags Conversations
   * @name ProjectsConversationsDelete
   * @summary Delete conversation
   * @request DELETE:/api/projects/{projectId}/conversations/{id}
   * @secure
   */
  projectsConversationsDelete = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/conversations/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves a paginated list of conversations with optional filtering, sorting, and search. Supports filtering by userId, sessionId, stageId, status, and timestamps.
   *
   * @tags Conversations
   * @name ProjectsConversationsList
   * @summary List conversations
   * @request GET:/api/projects/{projectId}/conversations
   * @secure
   */
  projectsConversationsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/conversations`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of events for a specific conversation with optional filtering and sorting
   *
   * @tags Conversations
   * @name ProjectsConversationsEventsList
   * @summary List conversation events
   * @request GET:/api/projects/{projectId}/conversations/{id}/events
   * @secure
   */
  projectsConversationsEventsList = (
    projectId: string,
    id: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
            | "visibility_changed";
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
         * Maximum number of items requested for the current page. Defaults to 100; maximum 1000
         * @min 0
         * @exclusiveMin true
         * @max 1000
         * @default 100
         */
        limit?: number | null;
      },
      void
    >({
      path: `/api/projects/${projectId}/conversations/${id}/events`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a specific event for a conversation by its unique identifier
   *
   * @tags Conversations
   * @name ProjectsConversationsEventsDetail
   * @summary Get conversation event by ID
   * @request GET:/api/projects/{projectId}/conversations/{id}/events/{eventId}
   * @secure
   */
  projectsConversationsEventsDetail = (
    projectId: string,
    id: string,
    eventId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          | "visibility_changed";
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
            };
        /**
         * Timestamp when the event occurred
         * @format date-time
         */
        timestamp: string | null;
        /** Additional metadata associated with the event */
        metadata: Record<string, any>;
      },
      void
    >({
      path: `/api/projects/${projectId}/conversations/${id}/events/${eventId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific conversation
   *
   * @tags Conversations
   * @name ProjectsConversationsAuditLogsList
   * @summary Get conversation audit logs
   * @request GET:/api/projects/{projectId}/conversations/{id}/audit-logs
   * @secure
   */
  projectsConversationsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/conversations/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new knowledge category with trigger phrase and associated tags
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesCreate
   * @summary Create a new knowledge category
   * @request POST:/api/projects/{projectId}/knowledge/categories
   * @secure
   */
  projectsKnowledgeCategoriesCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/categories`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of knowledge categories with their items. Supports filtering, sorting, and text search
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesList
   * @summary List knowledge categories
   * @request GET:/api/projects/{projectId}/knowledge/categories
   * @secure
   */
  projectsKnowledgeCategoriesList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/categories`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single knowledge category with all its items by unique identifier
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesDetail
   * @summary Get knowledge category by ID
   * @request GET:/api/projects/{projectId}/knowledge/categories/{id}
   * @secure
   */
  projectsKnowledgeCategoriesDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/categories/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing knowledge category with optimistic locking
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesUpdate
   * @summary Update knowledge category
   * @request PUT:/api/projects/{projectId}/knowledge/categories/{id}
   * @secure
   */
  projectsKnowledgeCategoriesUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/categories/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a knowledge category with optimistic locking. This will also delete all items in the category
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesDelete
   * @summary Delete knowledge category
   * @request DELETE:/api/projects/{projectId}/knowledge/categories/{id}
   * @secure
   */
  projectsKnowledgeCategoriesDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/knowledge/categories/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Creates a new knowledge item (Q&A pair) within a specific category
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsCreate
   * @summary Create a new knowledge item
   * @request POST:/api/projects/{projectId}/knowledge/items
   * @secure
   */
  projectsKnowledgeItemsCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/items`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of knowledge items. Supports filtering by categoryId, text search, sorting, and pagination
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsList
   * @summary List knowledge items
   * @request GET:/api/projects/{projectId}/knowledge/items
   * @secure
   */
  projectsKnowledgeItemsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/items`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single knowledge item by its unique identifier
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsDetail
   * @summary Get knowledge item by ID
   * @request GET:/api/projects/{projectId}/knowledge/items/{id}
   * @secure
   */
  projectsKnowledgeItemsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/items/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing knowledge item with optimistic locking
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsUpdate
   * @summary Update knowledge item
   * @request PUT:/api/projects/{projectId}/knowledge/items/{id}
   * @secure
   */
  projectsKnowledgeItemsUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/knowledge/items/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a knowledge item with optimistic locking
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsDelete
   * @summary Delete knowledge item
   * @request DELETE:/api/projects/{projectId}/knowledge/items/{id}
   * @secure
   */
  projectsKnowledgeItemsDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/knowledge/items/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves all knowledge items belonging to a specific category, ordered by their display order
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesItemsList
   * @summary Get items by category
   * @request GET:/api/projects/{projectId}/knowledge/categories/{categoryId}/items
   * @secure
   */
  projectsKnowledgeCategoriesItemsList = (
    projectId: string,
    categoryId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      }[],
      void
    >({
      path: `/api/projects/${projectId}/knowledge/categories/${categoryId}/items`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific knowledge category
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeCategoriesAuditLogsList
   * @summary Get knowledge category audit logs
   * @request GET:/api/projects/{projectId}/knowledge/categories/{id}/audit-logs
   * @secure
   */
  projectsKnowledgeCategoriesAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/knowledge/categories/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific knowledge item
   *
   * @tags Knowledge
   * @name ProjectsKnowledgeItemsAuditLogsList
   * @summary Get knowledge item audit logs
   * @request GET:/api/projects/{projectId}/knowledge/items/{id}/audit-logs
   * @secure
   */
  projectsKnowledgeItemsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/knowledge/items/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new AI agent with specified characteristics and voice configuration
   *
   * @tags Agents
   * @name ProjectsAgentsCreate
   * @summary Create a new agent
   * @request POST:/api/projects/{projectId}/agents
   * @secure
   */
  projectsAgentsCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/agents`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of agents with optional filtering
   *
   * @tags Agents
   * @name ProjectsAgentsList
   * @summary List agents
   * @request GET:/api/projects/{projectId}/agents
   * @secure
   */
  projectsAgentsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/agents`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single agent by their unique identifier
   *
   * @tags Agents
   * @name ProjectsAgentsDetail
   * @summary Get agent by ID
   * @request GET:/api/projects/{projectId}/agents/{id}
   * @secure
   */
  projectsAgentsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/agents/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing agent with optimistic locking
   *
   * @tags Agents
   * @name ProjectsAgentsUpdate
   * @summary Update agent
   * @request PUT:/api/projects/{projectId}/agents/{id}
   * @secure
   */
  projectsAgentsUpdate = (
    projectId: string,
    id: string,
    data: {
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
        | AmazonPollyTtsSettings;
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/agents/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes an agent with optimistic locking
   *
   * @tags Agents
   * @name ProjectsAgentsDelete
   * @summary Delete agent
   * @request DELETE:/api/projects/{projectId}/agents/{id}
   * @secure
   */
  projectsAgentsDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/agents/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific agent
   *
   * @tags Agents
   * @name ProjectsAgentsAuditLogsList
   * @summary Get agent audit logs
   * @request GET:/api/projects/{projectId}/agents/{id}/audit-logs
   * @secure
   */
  projectsAgentsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/agents/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing agent with a new ID and optional name override
   *
   * @tags Agents
   * @name ProjectsAgentsCloneCreate
   * @summary Clone agent
   * @request POST:/api/projects/{projectId}/agents/{id}/clone
   * @secure
   */
  projectsAgentsCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned agent (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned agent (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/agents/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new provider configuration for AI services (ASR, TTS, LLM, Embeddings)
   *
   * @tags Providers
   * @name ProvidersCreate
   * @summary Create a new provider
   * @request POST:/api/providers
   * @secure
   */
  providersCreate = (
    data: {
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
        | LocalStorageConfig;
      /** Operator user ID who created the provider */
      createdBy?: string;
      /** Searchable tags for organization (e.g., ["production", "low-latency"]) */
      tags?: string[];
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          | LocalStorageConfig;
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
      },
      void
    >({
      path: `/api/providers`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of provider configurations with optional filtering by providerType, apiType, tags, etc.
   *
   * @tags Providers
   * @name ProvidersList
   * @summary List providers
   * @request GET:/api/providers
   * @secure
   */
  providersList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
            | LocalStorageConfig;
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
      },
      void
    >({
      path: `/api/providers`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single provider configuration by its unique identifier
   *
   * @tags Providers
   * @name ProvidersDetail
   * @summary Get provider by ID
   * @request GET:/api/providers/{id}
   * @secure
   */
  providersDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
          | LocalStorageConfig;
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
      },
      void
    >({
      path: `/api/providers/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing provider configuration with optimistic locking
   *
   * @tags Providers
   * @name ProvidersUpdate
   * @summary Update provider
   * @request PUT:/api/providers/{id}
   * @secure
   */
  providersUpdate = (
    id: string,
    data: {
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
        | LocalStorageConfig;
      /** Updated searchable tags */
      tags?: string[] | null;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          | LocalStorageConfig;
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
      },
      void
    >({
      path: `/api/providers/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a provider configuration with optimistic locking
   *
   * @tags Providers
   * @name ProvidersDelete
   * @summary Delete provider
   * @request DELETE:/api/providers/{id}
   * @secure
   */
  providersDelete = (
    id: string,
    data: {
      /**
       * Current version number for optimistic locking (prevents concurrent deletions)
       * @min 0
       * @exclusiveMin true
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/providers/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific provider configuration
   *
   * @tags Providers
   * @name ProvidersAuditLogsList
   * @summary Get provider audit logs
   * @request GET:/api/providers/{id}/audit-logs
   * @secure
   */
  providersAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/providers/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Enumerates available models for a configured LLM provider by querying the provider API. Falls back to a static model list when the API is unavailable.
   *
   * @tags Providers
   * @name ProvidersModelsList
   * @summary Enumerate LLM models
   * @request GET:/api/providers/{id}/models
   * @secure
   */
  providersModelsList = (id: string, params: RequestParams = {}) =>
    this.request<
      {
        /** Available models for the provider */
        models: LlmModelInfo[];
      },
      void
    >({
      path: `/api/providers/${id}/models`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available ASR, TTS, and LLM providers including their models, capabilities, and supported features
   *
   * @tags Provider Catalog
   * @name ProviderCatalogList
   * @summary Get complete provider catalog
   * @request GET:/api/provider-catalog
   * @secure
   */
  providerCatalogList = (params: RequestParams = {}) =>
    this.request<
      {
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
      },
      any
    >({
      path: `/api/provider-catalog`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available ASR (Automatic Speech Recognition) providers including supported languages and capabilities
   *
   * @tags Provider Catalog
   * @name ProviderCatalogAsrList
   * @summary Get ASR providers
   * @request GET:/api/provider-catalog/asr
   * @secure
   */
  providerCatalogAsrList = (params: RequestParams = {}) =>
    this.request<
      {
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
      },
      any
    >({
      path: `/api/provider-catalog/asr`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available TTS (Text-to-Speech) providers including models, voices, and supported languages
   *
   * @tags Provider Catalog
   * @name ProviderCatalogTtsList
   * @summary Get TTS providers
   * @request GET:/api/provider-catalog/tts
   * @secure
   */
  providerCatalogTtsList = (params: RequestParams = {}) =>
    this.request<
      {
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
      },
      any
    >({
      path: `/api/provider-catalog/tts`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available LLM (Large Language Model) providers including models, capabilities like tool calling, JSON output, and context windows
   *
   * @tags Provider Catalog
   * @name ProviderCatalogLlmList
   * @summary Get LLM providers
   * @request GET:/api/provider-catalog/llm
   * @secure
   */
  providerCatalogLlmList = (params: RequestParams = {}) =>
    this.request<
      {
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
      },
      any
    >({
      path: `/api/provider-catalog/llm`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available storage providers including S3, Azure Blob, Google Cloud Storage, and local filesystem
   *
   * @tags Provider Catalog
   * @name ProviderCatalogStorageList
   * @summary Get storage providers
   * @request GET:/api/provider-catalog/storage
   * @secure
   */
  providerCatalogStorageList = (params: RequestParams = {}) =>
    this.request<
      {
        /** List of storage providers */
        providers: {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Additional information */
          description?: string;
          /** List of supported features */
          features?: string[];
        }[];
      },
      any
    >({
      path: `/api/provider-catalog/storage`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns information about all available content moderation providers including supported models and detectable categories. Category names listed here are the exact strings to use in moderationConfig.blockedCategories.
   *
   * @tags Provider Catalog
   * @name ProviderCatalogModerationList
   * @summary Get moderation providers
   * @request GET:/api/provider-catalog/moderation
   * @secure
   */
  providerCatalogModerationList = (params: RequestParams = {}) =>
    this.request<
      {
        /** List of moderation providers */
        providers: ModerationProviderInfo[];
      },
      any
    >({
      path: `/api/provider-catalog/moderation`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns detailed information about a specific provider by type and API type
   *
   * @tags Provider Catalog
   * @name ProviderCatalogDetail
   * @summary Get specific provider information
   * @request GET:/api/provider-catalog/{type}/{apiType}
   * @secure
   */
  providerCatalogDetail = (
    type: "asr" | "tts" | "llm" | "storage" | "moderation",
    apiType: string,
    params: RequestParams = {},
  ) =>
    this.request<
      | {
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
      | {
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
      | {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Models available for this provider */
          models: LlmModelInfo[];
          /** Additional information */
          description?: string;
        }
      | {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Additional information */
          description?: string;
          /** List of supported features */
          features?: string[];
        },
      void
    >({
      path: `/api/provider-catalog/${type}/${apiType}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new environment configuration for data migration between server instances
   *
   * @tags Environments
   * @name EnvironmentsCreate
   * @summary Create a new environment
   * @request POST:/api/environments
   * @secure
   */
  environmentsCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/environments`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of environments with optional filtering and sorting (passwords excluded)
   *
   * @tags Environments
   * @name EnvironmentsList
   * @summary List environments
   * @request GET:/api/environments
   * @secure
   */
  environmentsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/environments`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single environment by its unique identifier (password excluded)
   *
   * @tags Environments
   * @name EnvironmentsDetail
   * @summary Get environment by ID
   * @request GET:/api/environments/{id}
   * @secure
   */
  environmentsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/environments/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing environment with optimistic locking
   *
   * @tags Environments
   * @name EnvironmentsUpdate
   * @summary Update environment
   * @request PUT:/api/environments/{id}
   * @secure
   */
  environmentsUpdate = (
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/environments/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes an environment with optimistic locking
   *
   * @tags Environments
   * @name EnvironmentsDelete
   * @summary Delete environment
   * @request DELETE:/api/environments/{id}
   * @secure
   */
  environmentsDelete = (
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/environments/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific environment
   *
   * @tags Environments
   * @name EnvironmentsAuditLogsList
   * @summary Get environment audit logs
   * @request GET:/api/environments/{id}/audit-logs
   * @secure
   */
  environmentsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/environments/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Authenticates against the stored environment and returns lightweight stubs (id + name) of all entities that would be pulled with the given selection — without writing any data. Same query params as GET /api/migration/preview on the source instance.
   *
   * @tags Environments
   * @name EnvironmentsMigrationScopeList
   * @summary Preview remote migration scope
   * @request GET:/api/environments/{id}/migration/scope
   * @secure
   */
  environmentsMigrationScopeList = (
    id: string,
    query?: {
      /** Specific project IDs to export (comma-separated or repeated). Omit for all projects. */
      projectIds?: string | string[];
      /** Specific stage IDs to export. */
      stageIds?: string | string[];
      /** Specific agent IDs to export. */
      agentIds?: string | string[];
      /** Specific classifier IDs to export. */
      classifierIds?: string | string[];
      /** Specific context transformer IDs to export. */
      contextTransformerIds?: string | string[];
      /** Specific tool IDs to export. */
      toolIds?: string | string[];
      /** Specific global action IDs to export. */
      globalActionIds?: string | string[];
      /** Specific knowledge category IDs to export. All child items are included. */
      knowledgeCategoryIds?: string | string[];
      /** Specific provider IDs to export (added on top of transitively required ones). */
      providerIds?: string | string[];
      /** Specific API key IDs to export. */
      apiKeyIds?: string | string[];
    },
    params: RequestParams = {},
  ) =>
    this.request<MigrationPreview, void>({
      path: `/api/environments/${id}/migration/scope`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Authenticates against the stored environment, checks schema compatibility, fetches the remote export bundle, and imports it locally — all server-side. Returns a job immediately with status "pending"; poll GET /api/environments/{id}/migration/jobs/{jobId} for progress.
   *
   * @tags Environments
   * @name EnvironmentsMigrationPullCreate
   * @summary Pull data from environment
   * @request POST:/api/environments/{id}/migration/pull
   * @secure
   */
  environmentsMigrationPullCreate = (
    id: string,
    data: {
      /**
       * Granular entity selection. Omit or pass {} to pull everything.
       * @default {}
       */
      selection?: {
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
      };
      /**
       * If true, bypass schema hash mismatch check
       * @default false
       */
      force?: boolean;
      /**
       * If true, simulate the pull without writing to the database
       * @default false
       */
      dryRun?: boolean;
    },
    params: RequestParams = {},
  ) =>
    this.request<MigrationJob, void>({
      path: `/api/environments/${id}/migration/pull`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Returns the current state of an async pull job scoped to this environment. Jobs are held in process memory — a server restart clears all job history.
   *
   * @tags Environments
   * @name EnvironmentsMigrationJobsDetail
   * @summary Get migration job status
   * @request GET:/api/environments/{id}/migration/jobs/{jobId}
   * @secure
   */
  environmentsMigrationJobsDetail = (
    id: string,
    jobId: string,
    params: RequestParams = {},
  ) =>
    this.request<MigrationJob, void>({
      path: `/api/environments/${id}/migration/jobs/${jobId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new global action with specified name, prompt trigger, operations, and configuration
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsCreate
   * @summary Create a new global action
   * @request POST:/api/projects/{projectId}/global-actions
   * @secure
   */
  projectsGlobalActionsCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/global-actions`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of global actions with optional filtering and sorting
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsList
   * @summary List global actions
   * @request GET:/api/projects/{projectId}/global-actions
   * @secure
   */
  projectsGlobalActionsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/global-actions`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single global action by its unique identifier
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsDetail
   * @summary Get global action by ID
   * @request GET:/api/projects/{projectId}/global-actions/{id}
   * @secure
   */
  projectsGlobalActionsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/global-actions/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing global action with optimistic locking
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsUpdate
   * @summary Update global action
   * @request PUT:/api/projects/{projectId}/global-actions/{id}
   * @secure
   */
  projectsGlobalActionsUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/global-actions/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a global action with optimistic locking
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsDelete
   * @summary Delete global action
   * @request DELETE:/api/projects/{projectId}/global-actions/{id}
   * @secure
   */
  projectsGlobalActionsDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/global-actions/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific global action
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsAuditLogsList
   * @summary Get global action audit logs
   * @request GET:/api/projects/{projectId}/global-actions/{id}/audit-logs
   * @secure
   */
  projectsGlobalActionsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/global-actions/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing global action with a new ID and optional name override
   *
   * @tags Global Actions
   * @name ProjectsGlobalActionsCloneCreate
   * @summary Clone global action
   * @request POST:/api/projects/{projectId}/global-actions/{id}/clone
   * @secure
   */
  projectsGlobalActionsCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned global action (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned global action (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/global-actions/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new guardrail with specified name, classification trigger, and effects. Guardrails fire on every stage using the project-level classifier.
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsCreate
   * @summary Create a new guardrail
   * @request POST:/api/projects/{projectId}/guardrails
   * @secure
   */
  projectsGuardrailsCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/guardrails`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of guardrails with optional filtering and sorting
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsList
   * @summary List guardrails
   * @request GET:/api/projects/{projectId}/guardrails
   * @secure
   */
  projectsGuardrailsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/guardrails`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single guardrail by its unique identifier
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsDetail
   * @summary Get guardrail by ID
   * @request GET:/api/projects/{projectId}/guardrails/{id}
   * @secure
   */
  projectsGuardrailsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/guardrails/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing guardrail with optimistic locking
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsUpdate
   * @summary Update guardrail
   * @request PUT:/api/projects/{projectId}/guardrails/{id}
   * @secure
   */
  projectsGuardrailsUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/guardrails/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a guardrail with optimistic locking
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsDelete
   * @summary Delete guardrail
   * @request DELETE:/api/projects/{projectId}/guardrails/{id}
   * @secure
   */
  projectsGuardrailsDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/guardrails/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific guardrail
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsAuditLogsList
   * @summary Get guardrail audit logs
   * @request GET:/api/projects/{projectId}/guardrails/{id}/audit-logs
   * @secure
   */
  projectsGuardrailsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/guardrails/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing guardrail with a new ID and optional name override
   *
   * @tags Guardrails
   * @name ProjectsGuardrailsCloneCreate
   * @summary Clone guardrail
   * @request POST:/api/projects/{projectId}/guardrails/{id}/clone
   * @secure
   */
  projectsGuardrailsCloneCreate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/guardrails/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new issue report with bug details, environment, and severity information
   *
   * @tags Issues
   * @name IssuesCreate
   * @summary Create a new issue
   * @request POST:/api/issues
   * @secure
   */
  issuesCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/issues`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of issues with optional filtering by projectId, status, severity, environment, and text search in bug descriptions. Use filters[projectId]=value to filter by project.
   *
   * @tags Issues
   * @name IssuesList
   * @summary List issues
   * @request GET:/api/issues
   * @secure
   */
  issuesList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/issues`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single issue by its unique identifier
   *
   * @tags Issues
   * @name IssuesDetail
   * @summary Get issue by ID
   * @request GET:/api/issues/{id}
   * @secure
   */
  issuesDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/issues/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing issue with new information, typically used to change status, add comments, or update severity
   *
   * @tags Issues
   * @name IssuesUpdate
   * @summary Update issue
   * @request PUT:/api/issues/{id}
   * @secure
   */
  issuesUpdate = (
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/issues/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes an issue from the system
   *
   * @tags Issues
   * @name IssuesDelete
   * @summary Delete issue
   * @request DELETE:/api/issues/{id}
   * @secure
   */
  issuesDelete = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/issues/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific issue showing its change history
   *
   * @tags Issues
   * @name IssuesAuditLogsList
   * @summary Get issue audit logs
   * @request GET:/api/issues/{id}/audit-logs
   * @secure
   */
  issuesAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/issues/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new stage with specified behavior, prompts, and configuration
   *
   * @tags Stages
   * @name ProjectsStagesCreate
   * @summary Create a new stage
   * @request POST:/api/projects/{projectId}/stages
   * @secure
   */
  projectsStagesCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/stages`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of stages with optional filtering and sorting
   *
   * @tags Stages
   * @name ProjectsStagesList
   * @summary List stages
   * @request GET:/api/projects/{projectId}/stages
   * @secure
   */
  projectsStagesList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/stages`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single stage by its unique identifier
   *
   * @tags Stages
   * @name ProjectsStagesDetail
   * @summary Get stage by ID
   * @request GET:/api/projects/{projectId}/stages/{id}
   * @secure
   */
  projectsStagesDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/stages/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing stage with optimistic locking
   *
   * @tags Stages
   * @name ProjectsStagesUpdate
   * @summary Update stage
   * @request PUT:/api/projects/{projectId}/stages/{id}
   * @secure
   */
  projectsStagesUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/stages/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a stage with optimistic locking
   *
   * @tags Stages
   * @name ProjectsStagesDelete
   * @summary Delete stage
   * @request DELETE:/api/projects/{projectId}/stages/{id}
   * @secure
   */
  projectsStagesDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/stages/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific stage
   *
   * @tags Stages
   * @name ProjectsStagesAuditLogsList
   * @summary Get stage audit logs
   * @request GET:/api/projects/{projectId}/stages/{id}/audit-logs
   * @secure
   */
  projectsStagesAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/stages/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing stage with a new ID and optional name override
   *
   * @tags Stages
   * @name ProjectsStagesCloneCreate
   * @summary Clone stage
   * @request POST:/api/projects/{projectId}/stages/{id}/clone
   * @secure
   */
  projectsStagesCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned stage (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned stage (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/stages/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new tool with specified name, prompt, input/output types, and configuration
   *
   * @tags Tools
   * @name ProjectsToolsCreate
   * @summary Create a new tool
   * @request POST:/api/projects/{projectId}/tools
   * @secure
   */
  projectsToolsCreate = (
    projectId: string,
    data: CreateToolRequest,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/tools`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of tools with optional filtering and sorting
   *
   * @tags Tools
   * @name ProjectsToolsList
   * @summary List tools
   * @request GET:/api/projects/{projectId}/tools
   * @secure
   */
  projectsToolsList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/tools`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single tool by its unique identifier
   *
   * @tags Tools
   * @name ProjectsToolsDetail
   * @summary Get tool by ID
   * @request GET:/api/projects/{projectId}/tools/{id}
   * @secure
   */
  projectsToolsDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/tools/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing tool with optimistic locking
   *
   * @tags Tools
   * @name ProjectsToolsUpdate
   * @summary Update tool
   * @request PUT:/api/projects/{projectId}/tools/{id}
   * @secure
   */
  projectsToolsUpdate = (
    projectId: string,
    id: string,
    data: {
      /**
       * Updated display name
       * @minLength 1
       */
      name?: string;
      /** Updated description */
      description?: string | null;
      /**
       * Updated Handlebars prompt template (smart_function)
       * @minLength 1
       */
      prompt?: string;
      /** Updated LLM provider ID (smart_function) */
      llmProviderId?: string | null;
      /** Updated LLM provider-specific settings (smart_function) */
      llmSettings?:
        | OpenAILlmSettings
        | OpenAILegacyLlmSettings
        | AnthropicLlmSettings
        | GeminiLlmSettings;
      /** Updated input format (smart_function) */
      inputType?: "text" | "image" | "multi-modal";
      /** Updated output format (smart_function) */
      outputType?: "text" | "image" | "multi-modal";
      /**
       * Updated target URL (webhook)
       * @format uri
       */
      url?: string;
      /** Updated HTTP method (webhook) */
      webhookMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      /** Updated HTTP headers (webhook) */
      webhookHeaders?: Record<string, string>;
      /** Updated request body template (webhook) */
      webhookBody?: string | null;
      /**
       * Updated JavaScript code (script)
       * @minLength 1
       */
      code?: string;
      /** Updated parameters for the tool */
      parameters?: ToolParameter[];
      /** Updated tags */
      tags?: string[];
      /** Updated metadata */
      metadata?: Record<string, any>;
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/tools/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a tool with optimistic locking
   *
   * @tags Tools
   * @name ProjectsToolsDelete
   * @summary Delete tool
   * @request DELETE:/api/projects/{projectId}/tools/{id}
   * @secure
   */
  projectsToolsDelete = (
    projectId: string,
    id: string,
    data: {
      /**
       * Current version number for optimistic locking
       * @min 1
       */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/tools/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific tool
   *
   * @tags Tools
   * @name ProjectsToolsAuditLogsList
   * @summary Get tool audit logs
   * @request GET:/api/projects/{projectId}/tools/{id}/audit-logs
   * @secure
   */
  projectsToolsAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/tools/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a copy of an existing tool with a new ID and optional name override
   *
   * @tags Tools
   * @name ProjectsToolsCloneCreate
   * @summary Clone tool
   * @request POST:/api/projects/{projectId}/tools/{id}/clone
   * @secure
   */
  projectsToolsCloneCreate = (
    projectId: string,
    id: string,
    data: {
      /**
       * New ID for the cloned tool (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /**
       * Name for the cloned tool (defaults to "{original name} (Clone)")
       * @minLength 1
       */
      name?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/tools/${id}/clone`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new user within the specified project
   *
   * @tags Users
   * @name ProjectsUsersCreate
   * @summary Create a new user
   * @request POST:/api/projects/{projectId}/users
   * @secure
   */
  projectsUsersCreate = (
    projectId: string,
    data: {
      /**
       * Unique identifier for the user (auto-generated if not provided)
       * @minLength 1
       */
      id?: string;
      /** User profile data as flexible key-value pairs */
      profile: Record<string, any>;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/users`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of users within a project with optional filtering
   *
   * @tags Users
   * @name ProjectsUsersList
   * @summary List users
   * @request GET:/api/projects/{projectId}/users
   * @secure
   */
  projectsUsersList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/users`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single user by their unique identifier within a project
   *
   * @tags Users
   * @name ProjectsUsersDetail
   * @summary Get user by ID
   * @request GET:/api/projects/{projectId}/users/{id}
   * @secure
   */
  projectsUsersDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/users/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing user within a project
   *
   * @tags Users
   * @name ProjectsUsersUpdate
   * @summary Update user
   * @request PUT:/api/projects/{projectId}/users/{id}
   * @secure
   */
  projectsUsersUpdate = (
    projectId: string,
    id: string,
    data: {
      /** Updated profile data (merges with existing profile) */
      profile?: Record<string, any>;
      /** Whether the user is banned from starting conversations */
      banned?: boolean;
      /** Reason for banning the user (null to clear) */
      banReason?: string | null;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/projects/${projectId}/users/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a user from a project
   *
   * @tags Users
   * @name ProjectsUsersDelete
   * @summary Delete user
   * @request DELETE:/api/projects/{projectId}/users/{id}
   * @secure
   */
  projectsUsersDelete = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/users/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific user within a project
   *
   * @tags Users
   * @name ProjectsUsersAuditLogsList
   * @summary Get user audit logs
   * @request GET:/api/projects/{projectId}/users/{id}/audit-logs
   * @secure
   */
  projectsUsersAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/users/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new API key for WebSocket authentication. The secret key is only returned in the response to this creation request.
   *
   * @tags API Keys
   * @name ProjectsApiKeysCreate
   * @summary Create a new API key
   * @request POST:/api/projects/{projectId}/api-keys
   * @secure
   */
  projectsApiKeysCreate = (
    projectId: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          allowedChannels?: ("websocket" | "webrtc")[];
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
      },
      void
    >({
      path: `/api/projects/${projectId}/api-keys`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a list of API keys with optional filtering, sorting, and pagination. Filter by projectId to get keys for a specific project.
   *
   * @tags API Keys
   * @name ProjectsApiKeysList
   * @summary List API keys
   * @request GET:/api/projects/{projectId}/api-keys
   * @secure
   */
  projectsApiKeysList = (
    projectId: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
            allowedChannels?: ("websocket" | "webrtc")[];
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
      },
      any
    >({
      path: `/api/projects/${projectId}/api-keys`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single API key by its unique identifier. The full secret key is never returned, only a preview.
   *
   * @tags API Keys
   * @name ProjectsApiKeysDetail
   * @summary Get API key by ID
   * @request GET:/api/projects/{projectId}/api-keys/{id}
   * @secure
   */
  projectsApiKeysDetail = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          allowedChannels?: ("websocket" | "webrtc")[];
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
      },
      void
    >({
      path: `/api/projects/${projectId}/api-keys/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing API key with optimistic locking support. Can update name, active status, and metadata.
   *
   * @tags API Keys
   * @name ProjectsApiKeysUpdate
   * @summary Update API key
   * @request PUT:/api/projects/{projectId}/api-keys/{id}
   * @secure
   */
  projectsApiKeysUpdate = (
    projectId: string,
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          allowedChannels?: ("websocket" | "webrtc")[];
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
      },
      void
    >({
      path: `/api/projects/${projectId}/api-keys/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Permanently deletes an API key. This action cannot be undone and will immediately invalidate the key.
   *
   * @tags API Keys
   * @name ProjectsApiKeysDelete
   * @summary Delete API key
   * @request DELETE:/api/projects/{projectId}/api-keys/{id}
   * @secure
   */
  projectsApiKeysDelete = (
    projectId: string,
    id: string,
    data: {
      /** The current version number for optimistic locking */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/api-keys/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves a list of all API keys across all projects with optional filtering, sorting, and pagination.
   *
   * @tags API Keys
   * @name ApiKeysList
   * @summary List all API keys
   * @request GET:/api/api-keys
   * @secure
   */
  apiKeysList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
            allowedChannels?: ("websocket" | "webrtc")[];
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
      },
      any
    >({
      path: `/api/api-keys`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific API key
   *
   * @tags API Keys
   * @name ProjectsApiKeysAuditLogsList
   * @summary Get API key audit logs
   * @request GET:/api/projects/{projectId}/api-keys/{id}/audit-logs
   * @secure
   */
  projectsApiKeysAuditLogsList = (
    projectId: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/projects/${projectId}/api-keys/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Returns lightweight stubs (id + name) for every entity that would be included in an export with the given selection — same query params as GET /api/migration/export. Use this to review what will be migrated before committing to an actual pull. No data is written and the full entity records are never serialised.
   *
   * @tags Migration
   * @name MigrationPreviewList
   * @summary Preview migration scope
   * @request GET:/api/migration/preview
   * @secure
   */
  migrationPreviewList = (
    query?: {
      /** Specific project IDs to export (comma-separated or repeated). Omit for all projects. */
      projectIds?: string | string[];
      /** Specific stage IDs to export. */
      stageIds?: string | string[];
      /** Specific agent IDs to export. */
      agentIds?: string | string[];
      /** Specific classifier IDs to export. */
      classifierIds?: string | string[];
      /** Specific context transformer IDs to export. */
      contextTransformerIds?: string | string[];
      /** Specific tool IDs to export. */
      toolIds?: string | string[];
      /** Specific global action IDs to export. */
      globalActionIds?: string | string[];
      /** Specific knowledge category IDs to export. All child items are included. */
      knowledgeCategoryIds?: string | string[];
      /** Specific provider IDs to export (added on top of transitively required ones). */
      providerIds?: string | string[];
      /** Specific API key IDs to export. */
      apiKeyIds?: string | string[];
    },
    params: RequestParams = {},
  ) =>
    this.request<MigrationPreview, void>({
      path: `/api/migration/preview`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Produces a self-contained JSON bundle of all migratable config entities. Intended to be called by a remote instance during a server-side pull. Pass one or more ID arrays (projectIds, stageIds, agentIds, …) to select specific entities — all transitive FK dependencies are resolved automatically so the bundle is always self-consistent. An empty query (no params) exports everything. Provider config (API credentials) is stripped from exported records.
   *
   * @tags Migration
   * @name MigrationExportList
   * @summary Export config bundle
   * @request GET:/api/migration/export
   * @secure
   */
  migrationExportList = (
    query?: {
      /** Specific project IDs to export (comma-separated or repeated). Omit for all projects. */
      projectIds?: string | string[];
      /** Specific stage IDs to export. */
      stageIds?: string | string[];
      /** Specific agent IDs to export. */
      agentIds?: string | string[];
      /** Specific classifier IDs to export. */
      classifierIds?: string | string[];
      /** Specific context transformer IDs to export. */
      contextTransformerIds?: string | string[];
      /** Specific tool IDs to export. */
      toolIds?: string | string[];
      /** Specific global action IDs to export. */
      globalActionIds?: string | string[];
      /** Specific knowledge category IDs to export. All child items are included. */
      knowledgeCategoryIds?: string | string[];
      /** Specific provider IDs to export (added on top of transitively required ones). */
      providerIds?: string | string[];
      /** Specific API key IDs to export. */
      apiKeyIds?: string | string[];
    },
    params: RequestParams = {},
  ) =>
    this.request<ExportBundle, void>({
      path: `/api/migration/export`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Produces a self-contained, provider-agnostic exchange bundle for the specified project. All child entities (agents, stages, classifiers, context transformers, tools, global actions, guardrails, knowledge base) are included. Provider UUID references are replaced by provider hints (`type` + `apiType`) so the bundle can be imported into any environment. Credentials are never included. Entity IDs in the bundle are preserved as local cross-references and remapped to fresh UUIDs on import.
   *
   * @tags Projects
   * @name ProjectsExportList
   * @summary Export a project as an exchange bundle
   * @request GET:/api/projects/{id}/export
   * @secure
   */
  projectsExportList = (id: string, params: RequestParams = {}) =>
    this.request<ProjectExchangeBundleV1, void>({
      path: `/api/projects/${id}/export`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Imports a project from a provider-agnostic exchange bundle. All entity IDs are remapped to fresh UUIDs so repeated imports never overwrite existing data. Provider hints are resolved to local provider IDs by matching `type` + `apiType` (first match wins). If no matching local provider is found for a hint, the corresponding provider field is set to null. Returns the newly assigned project ID and a count of created entities.
   *
   * @tags Projects
   * @name ProjectsImportCreate
   * @summary Import a project from an exchange bundle
   * @request POST:/api/projects/import
   * @secure
   */
  projectsImportCreate = (
    data: ProjectExchangeBundleV1,
    params: RequestParams = {},
  ) =>
    this.request<ProjectExchangeImportResult, void>({
      path: `/api/projects/import`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Accepts a WebRTC SDP offer from the client and returns an SDP answer with all ICE candidates embedded (gather-and-return; no trickle ICE). Before creating the offer the client must open two named DataChannels: "control" (ordered: true) for all JSON messages (same protocol as WebSocket) and "audio" (ordered: false, maxRetransmits: 0) for binary audio frames. Audio frame format: [uint16 LE: turnId byte length] [turnId UTF-8 bytes] [raw PCM audio]. Once the DataChannels are open, authenticate by sending an "auth" JSON message over the control channel.
   *
   * @tags WebRTC
   * @name WebrtcOfferCreate
   * @summary Exchange SDP offer/answer for WebRTC session
   * @request POST:/api/webrtc/offer
   */
  webrtcOfferCreate = (
    data: {
      /** SDP offer string generated by the client RTCPeerConnection */
      sdpOffer: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        /** SDP answer with all ICE candidates embedded (gather-and-return, no trickle ICE) */
        sdpAnswer: string;
      },
      void
    >({
      path: `/api/webrtc/offer`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
