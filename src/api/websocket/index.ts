/**
 * WebSocket client exports for Bonsai conversations.
 */

export {
  BonsaiWebSocketClient,
  createWebSocketUrl,
  type WebSocketClientConfig,
  type WebSocketEventHandlers,
  type StartConversationOptions,
} from './client'

// Re-export types from contracts
export type {
  AuthRequest,
  AuthResponse,
  ProjectSettings,
  StartConversationRequest,
  StartConversationResponse,
  ResumeConversationRequest,
  ResumeConversationResponse,
  EndConversationRequest,
  EndConversationResponse,
  StartUserVoiceInputRequest,
  StartUserVoiceInputResponse,
  SendUserVoiceChunkRequest,
  SendUserVoiceChunkResponse,
  EndUserVoiceInputRequest,
  EndUserVoiceInputResponse,
  SendUserTextInputRequest,
  SendUserTextInputResponse,
  StartAiGenerationOutput,
  SendAiVoiceChunk,
  EndAiGenerationOutput,
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
  ConversationEventUpdate,
  AudioFormat,
} from './websocket-contracts'
