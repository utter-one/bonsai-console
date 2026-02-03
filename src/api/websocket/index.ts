/**
 * WebSocket client exports for Nexus conversations.
 */

export {
  NexusWebSocketClient,
  createWebSocketUrl,
  type WebSocketClientConfig,
  type WebSocketEventHandlers,
  type StartConversationOptions,
} from './client'

// Re-export types from contracts
export type {
  AuthRequest,
  AuthResponse,
} from './contracts/auth'

export type {
  StartConversationRequest,
  StartConversationResponse,
  ResumeConversationRequest,
  ResumeConversationResponse,
  EndConversationRequest,
  EndConversationResponse,
} from './contracts/session'

export type {
  StartUserVoiceInputRequest,
  StartUserVoiceInputResponse,
  SendUserVoiceChunkRequest,
  SendUserVoiceChunkResponse,
  EndUserVoiceInputRequest,
  EndUserVoiceInputResponse,
  SendUserTextInputRequest,
  SendUserTextInputResponse,
} from './contracts/userInput'

export type {
  StartAiVoiceOutputMessage,
  SendAiVoiceChunkMessage,
  EndAiVoiceOutputMessage,
} from './contracts/aiResponse'

export type {
  GoToStageRequest,
  GoToStageResponse,
  SetVarRequest,
  SetVarResponse,
  GetVarRequest,
  GetVarResponse,
  GetAllVarsRequest,
  GetAllVarsResponse,
  RunActionRequest,
  RunActionResponse,
} from './contracts/command'
