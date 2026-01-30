// Pagination
export interface PaginationParams {
  offset?: number
  limit?: number | null
  textSearch?: string
  orderBy?: string | string[]
  groupBy?: string | string[]
  filters?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  offset: number
  limit: number | null
}

// Authentication
export interface LoginRequest {
  id: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  adminId: string
  name: string
  roles: string[]
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

// Profile
export interface ProfileResponse {
  id: string
  name: string
  roles: string[]
  metadata?: Record<string, any>
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface UpdateProfileRequest {
  name?: string
  oldPassword?: string
  newPassword?: string
}

// Setup
export interface SetupStatusResponse {
  isSetup: boolean
  message: string
}

export interface InitialAdminSetupRequest {
  id: string
  name: string
  password: string
  metadata?: Record<string, any>
}

export interface InitialAdminSetupResponse {
  admin: {
    id: string
    name: string
    roles: string[]
    metadata?: Record<string, any>
    createdAt: string | null
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Admin
export interface AdminResponse {
  id: string
  name: string
  roles: string[]
  metadata?: Record<string, any>
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateAdminRequest {
  id: string
  name: string
  roles: string[]
  password: string
  metadata?: Record<string, any>
}

export interface UpdateAdminRequest {
  version: number
  name?: string
  roles?: string[]
  password?: string
  metadata?: Record<string, any>
}

export type AdminListResponse = PaginatedResponse<AdminResponse>

// User
export interface UserResponse {
  id: string
  profile: Record<string, any>
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateUserRequest {
  id?: string
  profile: Record<string, any>
}

export interface UpdateUserRequest {
  profile?: Record<string, any>
}

export type UserListResponse = PaginatedResponse<UserResponse>

// Project
export interface ProjectResponse {
  id: string
  name: string
  description: string | null
  asrConfig?: {
    asrProviderId: string
    settings?: any
  } | null
  acceptVoice: boolean
  generateVoice: boolean
  constants: Record<string, any> | null
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateProjectRequest {
  name: string
  description?: string
  asrConfig?: {
    asrProviderId: string
    settings?: any
  }
  acceptVoice?: boolean
  generateVoice?: boolean
  constants?: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  asrConfig?: {
    asrProviderId: string
    settings?: any
  }
  acceptVoice?: boolean
  generateVoice?: boolean
  constants?: Record<string, any>
  metadata?: Record<string, any>
  version: number
}

export type ProjectListResponse = PaginatedResponse<ProjectResponse>

// Persona
export interface NoSpeechMarker {
  start: string
  end: string
}

export interface VoiceConfig {
  model?: string
  voiceId?: string
  noSpeechMarkers?: NoSpeechMarker[]
  removeExclamationMarks?: boolean
  stability?: number | null
  similarityBoost?: number | null
  style?: number | null
  useSpeakerBoost?: boolean | null
  speed?: number | null
  useGlobalPreview?: boolean
  inactivityTimeout?: number
  useSentenceSplitter?: boolean
}

export interface PersonaResponse {
  id: string
  projectId: string
  name: string
  description: string | null
  prompt: string
  ttsProviderId?: string | null
  voiceConfig?: VoiceConfig | null
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreatePersonaRequest {
  id?: string
  projectId: string
  name: string
  description?: string
  prompt: string
  ttsProviderId?: string
  voiceConfig?: VoiceConfig
  metadata?: Record<string, any>
}

export interface UpdatePersonaRequest {
  name?: string
  description?: string
  prompt?: string
  ttsProviderId?: string
  voiceConfig?: VoiceConfig
  metadata?: Record<string, any>
  version: number
}

export type PersonaListResponse = PaginatedResponse<PersonaResponse>

// LLM Settings
export interface OpenAILLMSettings {
  model: string
  defaultMaxTokens?: number
  defaultTemperature?: number
  defaultTopP?: number
  timeout?: number
}

export interface AnthropicLLMSettings {
  model: string
  defaultMaxTokens?: number
  defaultTemperature?: number
  defaultTopP?: number
  timeout?: number
  anthropicVersion?: string
}

export interface GeminiLLMSettings {
  model: string
  defaultMaxTokens?: number
  defaultTemperature?: number
  defaultTopP?: number
  defaultTopK?: number
  timeout?: number
  safetySettings?: any[]
}

export type LLMSettings = OpenAILLMSettings | AnthropicLLMSettings | GeminiLLMSettings

// Stage
// Stage Actions
export interface StageActionOperation {
  type: 'end_conversation' | 'abort_conversation' | 'go_to_stage' | 'run_script' | 'modify_user_input' | 'modify_variables' | 'modify_user_profile' | 'call_tool' | 'call_webhook'
  reason?: string
  stageId?: string
  code?: string
  template?: string
  modifications?: Array<{
    variableName?: string
    fieldName?: string
    operation: 'set' | 'reset' | 'add' | 'remove'
    value?: any
  }>
  toolId?: string
  parameters?: Record<string, any>
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  resultKey?: string
}

export interface StageAction {
  name: string
  condition?: string | null
  triggerOnUserInput: boolean
  triggerOnClientCommand: boolean
  classificationTrigger?: string | null
  overrideClassifierId?: string | null
  operations: StageActionOperation[]
  template?: string | null
  examples?: string[] | null
  metadata?: Record<string, any> | null
}

export interface StageResponse {
  id: string
  projectId: string
  name: string
  description: string | null
  prompt: string
  llmProviderId: string | null
  llmSettings: LLMSettings | null
  personaId: string
  enterBehavior: 'generate_response' | 'await_user_input'
  useKnowledge: boolean
  knowledgeSections: string[]
  useGlobalActions: boolean
  globalActions: string[]
  variables: Record<string, any>
  actions: Record<string, StageAction>
  classifierIds: string[]
  transformerIds: string[]
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateStageRequest {
  id?: string
  projectId: string
  name: string
  description?: string
  prompt: string
  llmProviderId?: string | null
  llmSettings?: LLMSettings
  personaId: string
  enterBehavior?: 'generate_response' | 'await_user_input'
  useKnowledge?: boolean
  knowledgeSections?: string[]
  useGlobalActions?: boolean
  globalActions?: string[]
  variables?: Record<string, any>
  actions?: Record<string, StageAction>
  classifierIds?: string[]
  transformerIds?: string[]
  metadata?: Record<string, any>
}

export interface UpdateStageRequest {
  name?: string
  description?: string
  prompt?: string
  llmProviderId?: string | null
  llmSettings?: LLMSettings
  personaId?: string
  enterBehavior?: 'generate_response' | 'await_user_input'
  useKnowledge?: boolean
  knowledgeSections?: string[]
  useGlobalActions?: boolean
  globalActions?: string[]
  variables?: Record<string, any>
  actions?: Record<string, StageAction>
  classifierIds?: string[]
  transformerIds?: string[]
  metadata?: Record<string, any>
  version: number
}

export type StageListResponse = PaginatedResponse<StageResponse>

// Classifier
export interface ClassifierResponse {
  id: string
  projectId: string
  name: string
  description: string | null
  prompt: string
  llmProviderId: string | null
  llmSettings: LLMSettings | null
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateClassifierRequest {
  id?: string
  projectId: string
  name: string
  description?: string | null
  prompt: string
  llmProviderId?: string | null
  llmSettings?: LLMSettings
  metadata?: Record<string, any>
}

export interface UpdateClassifierRequest {
  name?: string
  description?: string | null
  prompt?: string
  llmProviderId?: string | null
  llmSettings?: LLMSettings
  metadata?: Record<string, any>
  version: number
}

export type ClassifierListResponse = PaginatedResponse<ClassifierResponse>

// Context Transformer
export interface ContextTransformerResponse {
  id: string
  projectId: string
  name: string
  description: string | null
  prompt: string
  contextFields: string[] | null
  llmProviderId: string | null
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateContextTransformerRequest {
  id?: string
  projectId: string
  name: string
  description?: string | null
  prompt: string
  contextFields?: string[]
  llmProviderId?: string | null
  metadata?: Record<string, any>
}

export interface UpdateContextTransformerRequest {
  name?: string
  description?: string | null
  prompt?: string
  contextFields?: string[]
  llmProviderId?: string | null
  metadata?: Record<string, any>
  version: number
}

export type ContextTransformerListResponse = PaginatedResponse<ContextTransformerResponse>

// Tool
export interface ToolResponse {
  id: string
  projectId: string
  name: string
  description: string | null
  prompt: string
  llmProviderId: string | null
  inputType: string
  outputType: string
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateToolRequest {
  id?: string
  projectId: string
  name: string
  description?: string | null
  prompt: string
  llmProviderId?: string | null
  inputType: string
  outputType: string
  metadata?: Record<string, any>
}

export interface UpdateToolRequest {
  name?: string
  description?: string | null
  prompt?: string
  llmProviderId?: string | null
  inputType?: string
  outputType?: string
  metadata?: Record<string, any>
  version: number
}

export type ToolListResponse = PaginatedResponse<ToolResponse>

// Knowledge Section
export interface KnowledgeSectionResponse {
  id: string
  name: string
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateKnowledgeSectionRequest {
  id?: string
  name: string
}

export interface UpdateKnowledgeSectionRequest {
  name: string
}

export type KnowledgeSectionListResponse = PaginatedResponse<KnowledgeSectionResponse>

// Knowledge Category
export interface KnowledgeCategoryResponse {
  id: string
  projectId: string
  name: string
  promptTrigger: string
  knowledgeSections: string[]
  order: number
  items?: KnowledgeItemResponse[]
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateKnowledgeCategoryRequest {
  id?: string
  projectId: string
  name: string
  promptTrigger: string
  knowledgeSections?: string[]
  order?: number
}

export interface UpdateKnowledgeCategoryRequest {
  name?: string
  promptTrigger?: string
  knowledgeSections?: string[]
  order?: number
  version: number
}

export type KnowledgeCategoryListResponse = PaginatedResponse<KnowledgeCategoryResponse>

// Knowledge Item
export interface KnowledgeItemResponse {
  id: string
  categoryId: string
  question: string
  answer: string
  order: number
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateKnowledgeItemRequest {
  id?: string
  categoryId: string
  question: string
  answer: string
  order?: number
}

export interface UpdateKnowledgeItemRequest {
  categoryId?: string
  question?: string
  answer?: string
  order?: number
  version: number
}

export type KnowledgeItemListResponse = PaginatedResponse<KnowledgeItemResponse>

// Issue
export interface IssueResponse {
  id: number
  projectId: string
  environment: string
  buildVersion: string
  beat: string | null
  sessionId: string | null
  eventIndex: number | null
  userId: string | null
  severity: string
  category: string
  bugDescription: string
  expectedBehaviour: string
  comments: string
  status: string
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateIssueRequest {
  projectId: string
  environment: string
  buildVersion: string
  beat?: string
  sessionId?: string
  eventIndex?: number
  userId?: string
  severity: string
  category: string
  bugDescription: string
  expectedBehaviour: string
  comments?: string
  status: string
}

export interface UpdateIssueRequest {
  environment?: string
  buildVersion?: string
  beat?: string
  sessionId?: string
  eventIndex?: number
  userId?: string
  severity?: string
  category?: string
  bugDescription?: string
  expectedBehaviour?: string
  comments?: string
  status?: string
}

export type IssueListResponse = PaginatedResponse<IssueResponse>

// Global Action
export interface GlobalActionResponse {
  id: string
  projectId: string
  name: string
  condition: string | null
  promptTrigger: string
  operations: any[]
  template: string | null
  examples: string[] | null
  metadata: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateGlobalActionRequest {
  id?: string
  projectId: string
  name: string
  condition?: string | null
  promptTrigger: string
  operations?: any[]
  template?: string | null
  examples?: string[]
  metadata?: Record<string, any>
}

export interface UpdateGlobalActionRequest {
  name?: string
  condition?: string | null
  promptTrigger?: string
  operations?: any[]
  template?: string | null
  examples?: string[]
  metadata?: Record<string, any>
  version: number
}

export type GlobalActionListResponse = PaginatedResponse<GlobalActionResponse>

// Environment
export interface EnvironmentResponse {
  id: string
  description: string
  url: string
  login: string
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateEnvironmentRequest {
  id?: string
  description: string
  url: string
  login: string
  password: string
}

export interface UpdateEnvironmentRequest {
  description?: string
  url?: string
  login?: string
  password?: string
  version: number
}

export type EnvironmentListResponse = PaginatedResponse<EnvironmentResponse>

// Provider Configs
export interface OpenAIConfig {
  apiKey: string
  organizationId?: string
  baseUrl?: string
}

export interface AnthropicConfig {
  apiKey: string
  baseUrl?: string
}

export interface GoogleConfig {
  apiKey: string
}

export interface ElevenLabsConfig {
  apiKey: string
}

export interface AzureASRConfig {
  region: string
  subscriptionKey: string
}

export type ProviderConfig = OpenAIConfig | AnthropicConfig | GoogleConfig | ElevenLabsConfig | AzureASRConfig

// Provider
export interface ProviderResponse {
  id: string
  name: string
  description: string | null
  providerType: 'asr' | 'tts' | 'llm' | 'embeddings'
  apiType: string
  config: ProviderConfig
  createdBy: string | null
  tags: string[] | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateProviderRequest {
  id?: string
  name: string
  description?: string
  providerType: 'asr' | 'tts' | 'llm' | 'embeddings'
  apiType: string
  config: ProviderConfig
  createdBy?: string
  tags?: string[]
}

export interface UpdateProviderRequest {
  name?: string
  description?: string
  providerType?: 'asr' | 'tts' | 'llm' | 'embeddings'
  apiType?: string
  config?: ProviderConfig
  tags?: string[]
  version: number
}

export type ProviderListResponse = PaginatedResponse<ProviderResponse>

// Conversation
export interface ConversationResponse {
  id: string
  projectId: string
  userId: string
  clientId: string
  stageId: string
  state: {
    variables: Record<string, Record<string, any>>
    currentActions: string[]
  } | null
  status: string
  statusReason: string | null
  metadata: Record<string, any> | null
  createdAt: string | null
  updatedAt: string | null
}

export type ConversationListResponse = PaginatedResponse<ConversationResponse>

// Conversation Event
export interface ConversationEventResponse {
  id: string
  conversationId: string
  type: string
  data?: Record<string, any>
  createdAt: string
}

export type ConversationEventListResponse = PaginatedResponse<ConversationEventResponse>

// Audit Log
export interface AuditLogResponse {
  id: string
  userId: string | null
  action: string
  entityId: string
  entityType: string
  oldEntity: Record<string, any> | null
  newEntity: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export type AuditLogListResponse = PaginatedResponse<AuditLogResponse>

// Provider Catalog
export interface ProviderCatalogLanguage {
  code: string
  displayName: string
}

export interface ProviderCatalogModel {
  id: string
  displayName: string
  description?: string
  recommended?: boolean
}

export interface ProviderCatalogVoice {
  id: string
  displayName: string
  description?: string
  gender?: 'male' | 'female' | 'neutral'
  languages?: string[]
}

export interface AsrProviderInfo {
  apiType: string
  displayName: string
  languages: ProviderCatalogLanguage[]
  supportsCustomVocabulary: boolean
  supportsStreaming: boolean
  description?: string
}

export interface TtsProviderInfo {
  apiType: string
  displayName: string
  models: ProviderCatalogModel[]
  voices: ProviderCatalogVoice[]
  languages: ProviderCatalogLanguage[]
  supportsFullStreaming: boolean
  supportsVoiceSettings: boolean
  description?: string
}

export interface LlmProviderInfo {
  apiType: string
  displayName: string
  models: ProviderCatalogModel[]
  supportsToolCalling: boolean
  supportsJsonOutput: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  contextWindows?: Record<string, number>
  description?: string
}

export interface ProviderCatalogResponse {
  asr: AsrProviderInfo[]
  tts: TtsProviderInfo[]
  llm: LlmProviderInfo[]
}
