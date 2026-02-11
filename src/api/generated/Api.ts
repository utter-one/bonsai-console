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
  AnthropicLlmSettings,
  AsrConfig,
  Effect,
  GeminiLlmSettings,
  ListFilterOperation,
  OpenAILegacyLlmSettings,
  OpenAILlmSettings,
  StageAction,
  ToolParameter,
  VoiceConfig,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Creates a new admin user with the specified credentials and roles
   *
   * @tags Admins
   * @name AdminsCreate
   * @summary Create a new admin user
   * @request POST:/api/admins
   * @secure
   */
  adminsCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/admins`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of admin users with optional filtering
   *
   * @tags Admins
   * @name AdminsList
   * @summary List admin users
   * @request GET:/api/admins
   * @secure
   */
  adminsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/admins`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single admin user by their unique identifier
   *
   * @tags Admins
   * @name AdminsDetail
   * @summary Get admin user by ID
   * @request GET:/api/admins/{id}
   * @secure
   */
  adminsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/admins/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing admin user with optimistic locking
   *
   * @tags Admins
   * @name AdminsUpdate
   * @summary Update admin user
   * @request PUT:/api/admins/{id}
   * @secure
   */
  adminsUpdate = (
    id: string,
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/admins/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes an admin user with optimistic locking
   *
   * @tags Admins
   * @name AdminsDelete
   * @summary Delete admin user
   * @request DELETE:/api/admins/{id}
   * @secure
   */
  adminsDelete = (
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
      path: `/api/admins/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific admin user
   *
   * @tags Admins
   * @name AdminsAuditLogsList
   * @summary Get admin audit logs
   * @request GET:/api/admins/{id}/audit-logs
   * @secure
   */
  adminsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/admins/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves the profile information of the currently logged-in admin user
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
   * @description Updates the profile of the currently logged-in admin user. Allows changing display name and/or password. When changing password, the old password must be provided for verification.
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
   * @description Authenticate an admin user with email/ID and password. Returns access and refresh tokens.
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
       * Admin user ID or email
       * @minLength 1
       */
      id: string;
      /**
       * Admin user password
       * @minLength 1
       */
      password: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
   * @description Returns whether the system has been initialized with at least one admin account
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
        /** Whether the system has been set up with at least one admin account */
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
   * @description Creates the first admin account with super_admin role. This endpoint only works when no admin accounts exist. Returns admin details and authentication tokens for immediate login.
   *
   * @tags Setup
   * @name SetupInitialAdminCreate
   * @summary Create initial admin account
   * @request POST:/api/setup/initial-admin
   * @secure
   */
  setupInitialAdminCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/setup/initial-admin`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new project that groups stages, personas, classifiers, context transformers, tools, knowledge, actions, and issues
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
          audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
      /** Key-value store of constants used in templating and conversation logic */
      constants?: Record<string, any>;
      /** Additional metadata for the project */
      metadata?: Record<string, any>;
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
          settings?: {
            /** The language code for speech recognition (e.g., "en-US") */
            language?: string;
            /** The phrases to add to the speech recognition dictionary */
            dictionaryPhrases?: string[];
            /** Audio input format for speech recognition (e.g., "pcm_16000") */
            audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
   * @description Retrieves a paginated list of projects with optional filtering, sorting, and searching
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
            settings?: {
              /** The language code for speech recognition (e.g., "en-US") */
              language?: string;
              /** The phrases to add to the speech recognition dictionary */
              dictionaryPhrases?: string[];
              /** Audio input format for speech recognition (e.g., "pcm_16000") */
              audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
          settings?: {
            /** The language code for speech recognition (e.g., "en-US") */
            language?: string;
            /** The phrases to add to the speech recognition dictionary */
            dictionaryPhrases?: string[];
            /** Audio input format for speech recognition (e.g., "pcm_16000") */
            audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
      description?: string;
      /** Updated ASR configuration settings */
      asrConfig?: AsrConfig;
      /** Whether conversations can accept voice input (requires asrConfig fully populated) */
      acceptVoice?: boolean;
      /** Whether conversations generate voice responses (requires ttsConfig fully populated in Stages) */
      generateVoice?: boolean;
      /** Updated constants key-value store */
      constants?: Record<string, any>;
      /** Updated metadata for the project */
      metadata?: Record<string, any>;
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
          settings?: {
            /** The language code for speech recognition (e.g., "en-US") */
            language?: string;
            /** The phrases to add to the speech recognition dictionary */
            dictionaryPhrases?: string[];
            /** Audio input format for speech recognition (e.g., "pcm_16000") */
            audioFormat?: "pcm_16000" | "pcm_22050" | "pcm_44100";
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
   * @description Creates a new classifier with specified name, prompt, and configuration
   *
   * @tags Classifiers
   * @name ClassifiersCreate
   * @summary Create a new classifier
   * @request POST:/api/classifiers
   * @secure
   */
  classifiersCreate = (
    data: {
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
      },
      void
    >({
      path: `/api/classifiers`,
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
   * @name ClassifiersList
   * @summary List classifiers
   * @request GET:/api/classifiers
   * @secure
   */
  classifiersList = (
    query?: {
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
      },
      void
    >({
      path: `/api/classifiers`,
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
   * @name ClassifiersDetail
   * @summary Get classifier by ID
   * @request GET:/api/classifiers/{id}
   * @secure
   */
  classifiersDetail = (id: string, params: RequestParams = {}) =>
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
      },
      void
    >({
      path: `/api/classifiers/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing classifier with optimistic locking
   *
   * @tags Classifiers
   * @name ClassifiersUpdate
   * @summary Update classifier
   * @request PUT:/api/classifiers/{id}
   * @secure
   */
  classifiersUpdate = (
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
      },
      void
    >({
      path: `/api/classifiers/${id}`,
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
   * @name ClassifiersDelete
   * @summary Delete classifier
   * @request DELETE:/api/classifiers/{id}
   * @secure
   */
  classifiersDelete = (
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
      path: `/api/classifiers/${id}`,
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
   * @name ClassifiersAuditLogsList
   * @summary Get classifier audit logs
   * @request GET:/api/classifiers/{id}/audit-logs
   * @secure
   */
  classifiersAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/classifiers/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new context transformer with specified name, prompt, and configuration
   *
   * @tags Context Transformers
   * @name ContextTransformersCreate
   * @summary Create a new context transformer
   * @request POST:/api/context-transformers
   * @secure
   */
  contextTransformersCreate = (
    data: {
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
      },
      void
    >({
      path: `/api/context-transformers`,
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
   * @name ContextTransformersList
   * @summary List context transformers
   * @request GET:/api/context-transformers
   * @secure
   */
  contextTransformersList = (
    query?: {
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
      },
      void
    >({
      path: `/api/context-transformers`,
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
   * @name ContextTransformersDetail
   * @summary Get context transformer by ID
   * @request GET:/api/context-transformers/{id}
   * @secure
   */
  contextTransformersDetail = (id: string, params: RequestParams = {}) =>
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
      },
      void
    >({
      path: `/api/context-transformers/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing context transformer with optimistic locking
   *
   * @tags Context Transformers
   * @name ContextTransformersUpdate
   * @summary Update context transformer
   * @request PUT:/api/context-transformers/{id}
   * @secure
   */
  contextTransformersUpdate = (
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
      },
      void
    >({
      path: `/api/context-transformers/${id}`,
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
   * @name ContextTransformersDelete
   * @summary Delete context transformer
   * @request DELETE:/api/context-transformers/{id}
   * @secure
   */
  contextTransformersDelete = (
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
      path: `/api/context-transformers/${id}`,
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
   * @name ContextTransformersAuditLogsList
   * @summary Get context transformer audit logs
   * @request GET:/api/context-transformers/{id}/audit-logs
   * @secure
   */
  contextTransformersAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/context-transformers/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves a single conversation by its unique identifier
   *
   * @tags Conversations
   * @name ConversationsDetail
   * @summary Get conversation by ID
   * @request GET:/api/conversations/{id}
   * @secure
   */
  conversationsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/conversations/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a conversation and all its associated events (via cascade delete)
   *
   * @tags Conversations
   * @name ConversationsDelete
   * @summary Delete conversation
   * @request DELETE:/api/conversations/{id}
   * @secure
   */
  conversationsDelete = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/conversations/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves a paginated list of conversations with optional filtering, sorting, and search. Supports filtering by userId, clientId, stageId, status, and timestamps.
   *
   * @tags Conversations
   * @name ConversationsList
   * @summary List conversations
   * @request GET:/api/conversations
   * @secure
   */
  conversationsList = (
    query?: {
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
      },
      void
    >({
      path: `/api/conversations`,
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
   * @name ConversationsEventsList
   * @summary List conversation events
   * @request GET:/api/conversations/{id}/events
   * @secure
   */
  conversationsEventsList = (
    id: string,
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/conversations/${id}/events`,
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
   * @name ConversationsEventsDetail
   * @summary Get conversation event by ID
   * @request GET:/api/conversations/{id}/events/{eventId}
   * @secure
   */
  conversationsEventsDetail = (
    id: string,
    eventId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/conversations/${id}/events/${eventId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific conversation
   *
   * @tags Conversations
   * @name ConversationsAuditLogsList
   * @summary Get conversation audit logs
   * @request GET:/api/conversations/{id}/audit-logs
   * @secure
   */
  conversationsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/conversations/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new knowledge section that can contain multiple categories
   *
   * @tags Knowledge
   * @name KnowledgeSectionsCreate
   * @summary Create a new knowledge section
   * @request POST:/api/knowledge/sections
   * @secure
   */
  knowledgeSectionsCreate = (
    data: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/sections`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of knowledge sections with optional filtering and sorting
   *
   * @tags Knowledge
   * @name KnowledgeSectionsList
   * @summary List knowledge sections
   * @request GET:/api/knowledge/sections
   * @secure
   */
  knowledgeSectionsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/sections`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single knowledge section by its unique identifier
   *
   * @tags Knowledge
   * @name KnowledgeSectionsDetail
   * @summary Get knowledge section by ID
   * @request GET:/api/knowledge/sections/{id}
   * @secure
   */
  knowledgeSectionsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/sections/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing knowledge section
   *
   * @tags Knowledge
   * @name KnowledgeSectionsUpdate
   * @summary Update knowledge section
   * @request PUT:/api/knowledge/sections/{id}
   * @secure
   */
  knowledgeSectionsUpdate = (
    id: string,
    data: {
      /**
       * Updated name of the knowledge section
       * @minLength 1
       */
      name: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/sections/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a knowledge section
   *
   * @tags Knowledge
   * @name KnowledgeSectionsDelete
   * @summary Delete knowledge section
   * @request DELETE:/api/knowledge/sections/{id}
   * @secure
   */
  knowledgeSectionsDelete = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/knowledge/sections/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new knowledge category with trigger phrase and associated sections
   *
   * @tags Knowledge
   * @name KnowledgeCategoriesCreate
   * @summary Create a new knowledge category
   * @request POST:/api/knowledge/categories
   * @secure
   */
  knowledgeCategoriesCreate = (
    data: {
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
      },
      void
    >({
      path: `/api/knowledge/categories`,
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
   * @name KnowledgeCategoriesList
   * @summary List knowledge categories
   * @request GET:/api/knowledge/categories
   * @secure
   */
  knowledgeCategoriesList = (
    query?: {
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
      },
      void
    >({
      path: `/api/knowledge/categories`,
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
   * @name KnowledgeCategoriesDetail
   * @summary Get knowledge category by ID
   * @request GET:/api/knowledge/categories/{id}
   * @secure
   */
  knowledgeCategoriesDetail = (id: string, params: RequestParams = {}) =>
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
      },
      void
    >({
      path: `/api/knowledge/categories/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing knowledge category with optimistic locking
   *
   * @tags Knowledge
   * @name KnowledgeCategoriesUpdate
   * @summary Update knowledge category
   * @request PUT:/api/knowledge/categories/{id}
   * @secure
   */
  knowledgeCategoriesUpdate = (
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
      },
      void
    >({
      path: `/api/knowledge/categories/${id}`,
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
   * @name KnowledgeCategoriesDelete
   * @summary Delete knowledge category
   * @request DELETE:/api/knowledge/categories/{id}
   * @secure
   */
  knowledgeCategoriesDelete = (
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
      path: `/api/knowledge/categories/${id}`,
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
   * @name KnowledgeItemsCreate
   * @summary Create a new knowledge item
   * @request POST:/api/knowledge/items
   * @secure
   */
  knowledgeItemsCreate = (
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
      },
      void
    >({
      path: `/api/knowledge/items`,
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
   * @name KnowledgeItemsList
   * @summary List knowledge items
   * @request GET:/api/knowledge/items
   * @secure
   */
  knowledgeItemsList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/items`,
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
   * @name KnowledgeItemsDetail
   * @summary Get knowledge item by ID
   * @request GET:/api/knowledge/items/{id}
   * @secure
   */
  knowledgeItemsDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/knowledge/items/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing knowledge item with optimistic locking
   *
   * @tags Knowledge
   * @name KnowledgeItemsUpdate
   * @summary Update knowledge item
   * @request PUT:/api/knowledge/items/{id}
   * @secure
   */
  knowledgeItemsUpdate = (
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
      },
      void
    >({
      path: `/api/knowledge/items/${id}`,
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
   * @name KnowledgeItemsDelete
   * @summary Delete knowledge item
   * @request DELETE:/api/knowledge/items/{id}
   * @secure
   */
  knowledgeItemsDelete = (
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
      path: `/api/knowledge/items/${id}`,
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
   * @name KnowledgeCategoriesItemsList
   * @summary Get items by category
   * @request GET:/api/knowledge/categories/{categoryId}/items
   * @secure
   */
  knowledgeCategoriesItemsList = (
    categoryId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      }[],
      void
    >({
      path: `/api/knowledge/categories/${categoryId}/items`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new AI persona with specified characteristics and voice configuration
   *
   * @tags Personas
   * @name PersonasCreate
   * @summary Create a new persona
   * @request POST:/api/personas
   * @secure
   */
  personasCreate = (
    data: {
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
      /** Optional voice configuration settings for TTS */
      voiceConfig?: VoiceConfig;
      /** Additional persona-specific metadata */
      metadata?: Record<string, any>;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
        /** Voice configuration settings */
        voiceConfig?: {
          /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
          model?: string;
          /** Text-to-speech voice identifier */
          voiceId?: string;
          /** Preferred audio output format for synthesized speech (e.g., "pcm_16000") */
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
          /** WebSocket inactivity timeout in seconds, defaults to 180 */
          inactivityTimeout?: number;
          /** Whether to use sentence splitter for text processing, defaults to true */
          useSentenceSplitter?: boolean;
        };
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
      },
      void
    >({
      path: `/api/personas`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of personas with optional filtering
   *
   * @tags Personas
   * @name PersonasList
   * @summary List personas
   * @request GET:/api/personas
   * @secure
   */
  personasList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
          /** Voice configuration settings */
          voiceConfig?: {
            /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
            model?: string;
            /** Text-to-speech voice identifier */
            voiceId?: string;
            /** Preferred audio output format for synthesized speech (e.g., "pcm_16000") */
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
            /** WebSocket inactivity timeout in seconds, defaults to 180 */
            inactivityTimeout?: number;
            /** Whether to use sentence splitter for text processing, defaults to true */
            useSentenceSplitter?: boolean;
          };
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
      },
      void
    >({
      path: `/api/personas`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single persona by their unique identifier
   *
   * @tags Personas
   * @name PersonasDetail
   * @summary Get persona by ID
   * @request GET:/api/personas/{id}
   * @secure
   */
  personasDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
        /** Voice configuration settings */
        voiceConfig?: {
          /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
          model?: string;
          /** Text-to-speech voice identifier */
          voiceId?: string;
          /** Preferred audio output format for synthesized speech (e.g., "pcm_16000") */
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
          /** WebSocket inactivity timeout in seconds, defaults to 180 */
          inactivityTimeout?: number;
          /** Whether to use sentence splitter for text processing, defaults to true */
          useSentenceSplitter?: boolean;
        };
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
      },
      void
    >({
      path: `/api/personas/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing persona with optimistic locking
   *
   * @tags Personas
   * @name PersonasUpdate
   * @summary Update persona
   * @request PUT:/api/personas/{id}
   * @secure
   */
  personasUpdate = (
    id: string,
    data: {
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
      /** Updated voice configuration */
      voiceConfig?: VoiceConfig;
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
        /** Voice configuration settings */
        voiceConfig?: {
          /** Model ID to use for speech synthesis (e.g., "eleven_flash_v2_5", "eleven_multilingual_v2") */
          model?: string;
          /** Text-to-speech voice identifier */
          voiceId?: string;
          /** Preferred audio output format for synthesized speech (e.g., "pcm_16000") */
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
          /** WebSocket inactivity timeout in seconds, defaults to 180 */
          inactivityTimeout?: number;
          /** Whether to use sentence splitter for text processing, defaults to true */
          useSentenceSplitter?: boolean;
        };
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
      },
      void
    >({
      path: `/api/personas/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a persona with optimistic locking
   *
   * @tags Personas
   * @name PersonasDelete
   * @summary Delete persona
   * @request DELETE:/api/personas/{id}
   * @secure
   */
  personasDelete = (
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
      path: `/api/personas/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific persona
   *
   * @tags Personas
   * @name PersonasAuditLogsList
   * @summary Get persona audit logs
   * @request GET:/api/personas/{id}/audit-logs
   * @secure
   */
  personasAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/personas/${id}/audit-logs`,
      method: "GET",
      secure: true,
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
      providerType: "asr" | "tts" | "llm" | "embeddings";
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
            /** The Azure region to use for the speech recognition service */
            region: string;
            /** The subscription key to use for the speech recognition service */
            subscriptionKey: string;
          };
      /** Admin user ID who created the provider */
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
        providerType: "asr" | "tts" | "llm" | "embeddings";
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
              /** The Azure region to use for the speech recognition service */
              region: string;
              /** The subscription key to use for the speech recognition service */
              subscriptionKey: string;
            };
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
          providerType: "asr" | "tts" | "llm" | "embeddings";
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
                /** The Azure region to use for the speech recognition service */
                region: string;
                /** The subscription key to use for the speech recognition service */
                subscriptionKey: string;
              };
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
        providerType: "asr" | "tts" | "llm" | "embeddings";
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
              /** The Azure region to use for the speech recognition service */
              region: string;
              /** The subscription key to use for the speech recognition service */
              subscriptionKey: string;
            };
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
      description?: string;
      /** Updated provider category */
      providerType?: "asr" | "tts" | "llm" | "embeddings";
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
            /** The Azure region to use for the speech recognition service */
            region: string;
            /** The subscription key to use for the speech recognition service */
            subscriptionKey: string;
          };
      /** Updated searchable tags */
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
        providerType: "asr" | "tts" | "llm" | "embeddings";
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
              /** The Azure region to use for the speech recognition service */
              region: string;
              /** The subscription key to use for the speech recognition service */
              subscriptionKey: string;
            };
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
          /** Languages supported by this provider */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio input formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether custom vocabulary/phrases are supported */
          supportsCustomVocabulary: boolean;
          /** Whether streaming transcription is supported */
          supportsStreaming: boolean;
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
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Voices available (can be provider-specific or model-specific) */
          voices: {
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
          }[];
          /** Languages supported */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio output formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether full streaming (chunk-by-chunk) is supported */
          supportsFullStreaming: boolean;
          /** Whether voice customization settings are supported */
          supportsVoiceSettings: boolean;
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
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Whether tool calling (function calling) is supported */
          supportsToolCalling: boolean;
          /** Whether structured JSON output is supported */
          supportsJsonOutput: boolean;
          /** Whether streaming responses are supported */
          supportsStreaming: boolean;
          /** Whether vision/image input is supported */
          supportsVision: boolean;
          /** Context window size (in tokens) for each model */
          contextWindows?: Record<string, number>;
          /** Additional information */
          description?: string;
        }[];
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
          /** Languages supported by this provider */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio input formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether custom vocabulary/phrases are supported */
          supportsCustomVocabulary: boolean;
          /** Whether streaming transcription is supported */
          supportsStreaming: boolean;
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
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Voices available (can be provider-specific or model-specific) */
          voices: {
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
          }[];
          /** Languages supported */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio output formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether full streaming (chunk-by-chunk) is supported */
          supportsFullStreaming: boolean;
          /** Whether voice customization settings are supported */
          supportsVoiceSettings: boolean;
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
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Whether tool calling (function calling) is supported */
          supportsToolCalling: boolean;
          /** Whether structured JSON output is supported */
          supportsJsonOutput: boolean;
          /** Whether streaming responses are supported */
          supportsStreaming: boolean;
          /** Whether vision/image input is supported */
          supportsVision: boolean;
          /** Context window size (in tokens) for each model */
          contextWindows?: Record<string, number>;
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
   * @description Returns detailed information about a specific provider by type and API type
   *
   * @tags Provider Catalog
   * @name ProviderCatalogDetail
   * @summary Get specific provider information
   * @request GET:/api/provider-catalog/{type}/{apiType}
   * @secure
   */
  providerCatalogDetail = (
    type: "asr" | "tts" | "llm",
    apiType: string,
    params: RequestParams = {},
  ) =>
    this.request<
      | {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Languages supported by this provider */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio input formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether custom vocabulary/phrases are supported */
          supportsCustomVocabulary: boolean;
          /** Whether streaming transcription is supported */
          supportsStreaming: boolean;
          /** Additional information */
          description?: string;
        }
      | {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Models available for this provider */
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Voices available (can be provider-specific or model-specific) */
          voices: {
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
          }[];
          /** Languages supported */
          languages: {
            /** ISO language code (e.g., 'en-US', 'es-ES') */
            code: string;
            /** Human-readable language name */
            displayName: string;
          }[];
          /** Audio output formats supported by this provider */
          supportedAudioFormats: string[];
          /** Whether full streaming (chunk-by-chunk) is supported */
          supportsFullStreaming: boolean;
          /** Whether voice customization settings are supported */
          supportsVoiceSettings: boolean;
          /** Additional information */
          description?: string;
        }
      | {
          /** Provider API type */
          apiType: string;
          /** Human-readable provider name */
          displayName: string;
          /** Models available for this provider */
          models: {
            /** Model identifier */
            id: string;
            /** Human-readable display name */
            displayName: string;
            /** Description of the model's capabilities and use cases */
            description?: string;
            /** Whether this is a recommended or default model */
            recommended?: boolean;
          }[];
          /** Whether tool calling (function calling) is supported */
          supportsToolCalling: boolean;
          /** Whether structured JSON output is supported */
          supportsJsonOutput: boolean;
          /** Whether streaming responses are supported */
          supportsStreaming: boolean;
          /** Whether vision/image input is supported */
          supportsVision: boolean;
          /** Context window size (in tokens) for each model */
          contextWindows?: Record<string, number>;
          /** Additional information */
          description?: string;
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
         * Maximum number of items per page (null if no limit)
         * @min 0
         * @exclusiveMin true
         */
        limit: number | null;
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
   * @description Creates a new global action with specified name, prompt trigger, operations, and configuration
   *
   * @tags Global Actions
   * @name GlobalActionsCreate
   * @summary Create a new global action
   * @request POST:/api/global-actions
   * @secure
   */
  globalActionsCreate = (
    data: {
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
      },
      void
    >({
      path: `/api/global-actions`,
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
   * @name GlobalActionsList
   * @summary List global actions
   * @request GET:/api/global-actions
   * @secure
   */
  globalActionsList = (
    query?: {
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
      },
      void
    >({
      path: `/api/global-actions`,
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
   * @name GlobalActionsDetail
   * @summary Get global action by ID
   * @request GET:/api/global-actions/{id}
   * @secure
   */
  globalActionsDetail = (id: string, params: RequestParams = {}) =>
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
      },
      void
    >({
      path: `/api/global-actions/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing global action with optimistic locking
   *
   * @tags Global Actions
   * @name GlobalActionsUpdate
   * @summary Update global action
   * @request PUT:/api/global-actions/{id}
   * @secure
   */
  globalActionsUpdate = (
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
      },
      void
    >({
      path: `/api/global-actions/${id}`,
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
   * @name GlobalActionsDelete
   * @summary Delete global action
   * @request DELETE:/api/global-actions/{id}
   * @secure
   */
  globalActionsDelete = (
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
      path: `/api/global-actions/${id}`,
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
   * @name GlobalActionsAuditLogsList
   * @summary Get global action audit logs
   * @request GET:/api/global-actions/{id}/audit-logs
   * @secure
   */
  globalActionsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/global-actions/${id}/audit-logs`,
      method: "GET",
      secure: true,
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
   * @description Retrieves a paginated list of issues with optional filtering by status, severity, environment, and text search in bug descriptions
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
   * @name StagesCreate
   * @summary Create a new stage
   * @request POST:/api/stages
   * @secure
   */
  stagesCreate = (
    data: {
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
      /**
       * List of classifier IDs to use in this stage
       * @default []
       */
      classifierIds?: string[];
      /**
       * List of context transformer IDs to use in this stage
       * @default []
       */
      transformerIds?: string[];
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
        /** Classifier IDs used in this stage */
        classifierIds: string[];
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
      },
      void
    >({
      path: `/api/stages`,
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
   * @name StagesList
   * @summary List stages
   * @request GET:/api/stages
   * @secure
   */
  stagesList = (
    query?: {
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
          /** Classifier IDs used in this stage */
          classifierIds: string[];
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
      },
      void
    >({
      path: `/api/stages`,
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
   * @name StagesDetail
   * @summary Get stage by ID
   * @request GET:/api/stages/{id}
   * @secure
   */
  stagesDetail = (id: string, params: RequestParams = {}) =>
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
        /** Classifier IDs used in this stage */
        classifierIds: string[];
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
      },
      void
    >({
      path: `/api/stages/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing stage with optimistic locking
   *
   * @tags Stages
   * @name StagesUpdate
   * @summary Update stage
   * @request PUT:/api/stages/{id}
   * @secure
   */
  stagesUpdate = (
    id: string,
    data: {
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
      /** Updated classifier IDs */
      classifierIds?: string[];
      /** Updated transformer IDs */
      transformerIds?: string[];
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
        /** Classifier IDs used in this stage */
        classifierIds: string[];
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
      },
      void
    >({
      path: `/api/stages/${id}`,
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
   * @name StagesDelete
   * @summary Delete stage
   * @request DELETE:/api/stages/{id}
   * @secure
   */
  stagesDelete = (
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
      path: `/api/stages/${id}`,
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
   * @name StagesAuditLogsList
   * @summary Get stage audit logs
   * @request GET:/api/stages/{id}/audit-logs
   * @secure
   */
  stagesAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/stages/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new tool with specified name, prompt, input/output types, and configuration
   *
   * @tags Tools
   * @name ToolsCreate
   * @summary Create a new tool
   * @request POST:/api/tools
   * @secure
   */
  toolsCreate = (
    data: {
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
      },
      void
    >({
      path: `/api/tools`,
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
   * @name ToolsList
   * @summary List tools
   * @request GET:/api/tools
   * @secure
   */
  toolsList = (
    query?: {
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
      },
      void
    >({
      path: `/api/tools`,
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
   * @name ToolsDetail
   * @summary Get tool by ID
   * @request GET:/api/tools/{id}
   * @secure
   */
  toolsDetail = (id: string, params: RequestParams = {}) =>
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
      },
      void
    >({
      path: `/api/tools/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing tool with optimistic locking
   *
   * @tags Tools
   * @name ToolsUpdate
   * @summary Update tool
   * @request PUT:/api/tools/{id}
   * @secure
   */
  toolsUpdate = (
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
      },
      void
    >({
      path: `/api/tools/${id}`,
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
   * @name ToolsDelete
   * @summary Delete tool
   * @request DELETE:/api/tools/{id}
   * @secure
   */
  toolsDelete = (
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
      path: `/api/tools/${id}`,
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
   * @name ToolsAuditLogsList
   * @summary Get tool audit logs
   * @request GET:/api/tools/{id}/audit-logs
   * @secure
   */
  toolsAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/tools/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new user with the specified profile data
   *
   * @tags Users
   * @name UsersCreate
   * @summary Create a new user
   * @request POST:/api/users
   * @secure
   */
  usersCreate = (
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
      },
      void
    >({
      path: `/api/users`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a paginated list of users with optional filtering
   *
   * @tags Users
   * @name UsersList
   * @summary List users
   * @request GET:/api/users
   * @secure
   */
  usersList = (
    query?: {
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
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/users`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieves a single user by their unique identifier
   *
   * @tags Users
   * @name UsersDetail
   * @summary Get user by ID
   * @request GET:/api/users/{id}
   * @secure
   */
  usersDetail = (id: string, params: RequestParams = {}) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/users/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing user
   *
   * @tags Users
   * @name UsersUpdate
   * @summary Update user
   * @request PUT:/api/users/{id}
   * @secure
   */
  usersUpdate = (
    id: string,
    data: {
      /** Updated profile data (merges with existing profile) */
      profile?: Record<string, any>;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
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
      },
      void
    >({
      path: `/api/users/${id}`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Deletes a user
   *
   * @tags Users
   * @name UsersDelete
   * @summary Delete user
   * @request DELETE:/api/users/{id}
   * @secure
   */
  usersDelete = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/users/${id}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Retrieves audit logs for a specific user
   *
   * @tags Users
   * @name UsersAuditLogsList
   * @summary Get user audit logs
   * @request GET:/api/users/{id}/audit-logs
   * @secure
   */
  usersAuditLogsList = (id: string, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/api/users/${id}/audit-logs`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates a new API key for WebSocket authentication. The secret key is only returned in the response to this creation request.
   *
   * @tags API Keys
   * @name ApiKeysCreate
   * @summary Create a new API key
   * @request POST:/api/api-keys
   * @secure
   */
  apiKeysCreate = (
    data: {
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
        /** Version number for optimistic locking */
        version: number;
        /** ISO timestamp of creation */
        createdAt: string;
        /** ISO timestamp of last update */
        updatedAt: string;
      },
      void
    >({
      path: `/api/api-keys`,
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
   * @name ApiKeysList
   * @summary List API keys
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
          /** Version number for optimistic locking */
          version: number;
          /** ISO timestamp of creation */
          createdAt: string;
          /** ISO timestamp of last update */
          updatedAt: string;
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
   * @description Retrieves a single API key by its unique identifier. The full secret key is never returned, only a preview.
   *
   * @tags API Keys
   * @name ApiKeysDetail
   * @summary Get API key by ID
   * @request GET:/api/api-keys/{id}
   * @secure
   */
  apiKeysDetail = (id: string, params: RequestParams = {}) =>
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
        /** Version number for optimistic locking */
        version: number;
        /** ISO timestamp of creation */
        createdAt: string;
        /** ISO timestamp of last update */
        updatedAt: string;
      },
      void
    >({
      path: `/api/api-keys/${id}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates an existing API key with optimistic locking support. Can update name, active status, and metadata.
   *
   * @tags API Keys
   * @name ApiKeysUpdate
   * @summary Update API key
   * @request PUT:/api/api-keys/{id}
   * @secure
   */
  apiKeysUpdate = (
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
        /** Version number for optimistic locking */
        version: number;
        /** ISO timestamp of creation */
        createdAt: string;
        /** ISO timestamp of last update */
        updatedAt: string;
      },
      void
    >({
      path: `/api/api-keys/${id}`,
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
   * @name ApiKeysDelete
   * @summary Delete API key
   * @request DELETE:/api/api-keys/{id}
   * @secure
   */
  apiKeysDelete = (
    id: string,
    data: {
      /** The current version number for optimistic locking */
      version: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/api/api-keys/${id}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
