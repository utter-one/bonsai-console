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
  StartAiVoiceOutput,
  SendAiVoiceChunk,
  EndAiVoiceOutput,
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
  AudioFormat,
} from './websocket-contracts'
