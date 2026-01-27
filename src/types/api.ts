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
  displayName: string
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
  displayName: string
  roles: string[]
  metadata?: Record<string, any>
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface UpdateProfileRequest {
  displayName?: string
  oldPassword?: string
  newPassword?: string
}

// Setup
export interface SetupStatusResponse {
  isSetup: boolean
  hasInitialAdmin: boolean
}

export interface InitialAdminSetupRequest {
  id: string
  displayName: string
  password: string
  metadata?: Record<string, any>
}

export interface InitialAdminSetupResponse {
  adminId: string
  displayName: string
  roles: string[]
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Admin
export interface AdminResponse {
  id: string
  displayName: string
  roles: string[]
  metadata?: Record<string, any>
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateAdminRequest {
  id: string
  displayName: string
  roles: string[]
  password: string
  metadata?: Record<string, any>
}

export interface UpdateAdminRequest {
  version: number
  displayName?: string
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
  id: string
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
  description?: string
  asrConfig?: {
    asrProviderId: string
    settings?: any
  }
  acceptVoice: boolean
  generateVoice: boolean
  constants?: Record<string, any>
  metadata?: Record<string, any>
  version: number
  createdAt: string
  updatedAt: string
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
}

export type ProjectListResponse = PaginatedResponse<ProjectResponse>

// Persona
export interface PersonaResponse {
  id: string
  projectId: string
  name: string
  prompt: string
  voiceProviderId?: string
  voiceConfig?: {
    voiceProviderId: string
    voiceId: string
    settings?: Record<string, any>
  }
  metadata?: Record<string, any> | null
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreatePersonaRequest {
  id: string
  projectId: string
  name: string
  prompt: string
  voiceConfig?: {
    voiceProviderId: string
    voiceId: string
    settings?: Record<string, any>
  }
  metadata?: Record<string, any>
}

export interface UpdatePersonaRequest {
  version: number
  name?: string
  prompt?: string
  voiceConfig?: {
    voiceProviderId: string
    voiceId: string
    settings?: Record<string, any>
  }
  metadata?: Record<string, any>
}

export type PersonaListResponse = PaginatedResponse<PersonaResponse>

// Stage
export interface StageResponse {
  id: string
  projectId: string
  name: string
  description?: string
  order: number
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStageRequest {
  projectId: string
  name: string
  description?: string
  order: number
  config?: Record<string, any>
}

export interface UpdateStageRequest {
  name?: string
  description?: string
  order?: number
  config?: Record<string, any>
  isActive?: boolean
}

export type StageListResponse = PaginatedResponse<StageResponse>

// Classifier
export interface ClassifierResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClassifierRequest {
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

export interface UpdateClassifierRequest {
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

export type ClassifierListResponse = PaginatedResponse<ClassifierResponse>

// Context Transformer
export interface ContextTransformerResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateContextTransformerRequest {
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

export interface UpdateContextTransformerRequest {
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

export type ContextTransformerListResponse = PaginatedResponse<ContextTransformerResponse>

// Tool
export interface ToolResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateToolRequest {
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

export interface UpdateToolRequest {
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

export type ToolListResponse = PaginatedResponse<ToolResponse>

// Knowledge Section
export interface KnowledgeSectionResponse {
  id: string
  projectId: string
  name: string
  description?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKnowledgeSectionRequest {
  projectId: string
  name: string
  description?: string
  order: number
}

export interface UpdateKnowledgeSectionRequest {
  name?: string
  description?: string
  order?: number
  isActive?: boolean
}

export type KnowledgeSectionListResponse = PaginatedResponse<KnowledgeSectionResponse>

// Knowledge Category
export interface KnowledgeCategoryResponse {
  id: string
  sectionId: string
  name: string
  description?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKnowledgeCategoryRequest {
  sectionId: string
  name: string
  description?: string
  order: number
}

export interface UpdateKnowledgeCategoryRequest {
  name?: string
  description?: string
  order?: number
  isActive?: boolean
}

export type KnowledgeCategoryListResponse = PaginatedResponse<KnowledgeCategoryResponse>

// Knowledge Item
export interface KnowledgeItemResponse {
  id: string
  categoryId: string
  title: string
  content: string
  metadata?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKnowledgeItemRequest {
  categoryId: string
  title: string
  content: string
  metadata?: Record<string, any>
}

export interface UpdateKnowledgeItemRequest {
  title?: string
  content?: string
  metadata?: Record<string, any>
  isActive?: boolean
}

export type KnowledgeItemListResponse = PaginatedResponse<KnowledgeItemResponse>

// Issue
export interface IssueResponse {
  id: string
  projectId: string
  title: string
  description?: string
  status: string
  priority: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateIssueRequest {
  projectId: string
  title: string
  description?: string
  status: string
  priority: string
  metadata?: Record<string, any>
}

export interface UpdateIssueRequest {
  title?: string
  description?: string
  status?: string
  priority?: string
  metadata?: Record<string, any>
}

export type IssueListResponse = PaginatedResponse<IssueResponse>

// Global Action
export interface GlobalActionResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGlobalActionRequest {
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

export interface UpdateGlobalActionRequest {
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

export type GlobalActionListResponse = PaginatedResponse<GlobalActionResponse>

// Environment
export interface EnvironmentResponse {
  id: string
  projectId: string
  name: string
  description?: string
  variables?: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEnvironmentRequest {
  projectId: string
  name: string
  description?: string
  variables?: Record<string, string>
}

export interface UpdateEnvironmentRequest {
  name?: string
  description?: string
  variables?: Record<string, string>
  isActive?: boolean
}

export type EnvironmentListResponse = PaginatedResponse<EnvironmentResponse>

// Provider
export interface ProviderResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProviderRequest {
  projectId: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

export interface UpdateProviderRequest {
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

export type ProviderListResponse = PaginatedResponse<ProviderResponse>

// Conversation
export interface ConversationResponse {
  id: string
  projectId: string
  userId?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
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
  entityType: string
  entityId: string
  action: string
  adminId?: string
  userId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  createdAt: string
}

export type AuditLogListResponse = PaginatedResponse<AuditLogResponse>
