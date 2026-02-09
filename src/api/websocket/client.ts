import type {
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
  UserTranscribedChunk,
  StartAiGenerationOutput,
  SendAiVoiceChunk,
  EndAiGenerationOutput,
  AiTranscribedChunk,
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
} from './websocket-contracts'

/** Error message structure from server */
interface ErrorMessage {
  type: 'error'
  error: string
  requestId?: string
}

/** Union type for all server messages */
type ServerMessage =
  | AuthResponse
  | StartConversationResponse
  | ResumeConversationResponse
  | EndConversationResponse
  | StartUserVoiceInputResponse
  | SendUserVoiceChunkResponse
  | EndUserVoiceInputResponse
  | SendUserTextInputResponse
  | UserTranscribedChunk
  | StartAiGenerationOutput
  | SendAiVoiceChunk
  | EndAiGenerationOutput
  | AiTranscribedChunk
  | GoToStageResponse
  | SetVarResponse
  | GetVarResponse
  | GetAllVarsResponse
  | RunActionResponse
  | ErrorMessage

/** Event handlers for server-initiated messages */
export interface WebSocketEventHandlers {
  /** Called when a user transcribed text chunk is received (real-time ASR) */
  onUserTranscribedChunk?: (message: UserTranscribedChunk) => void
  /** Called when AI generation output starts (voice or text) */
  onAiOutputStart?: (message: StartAiGenerationOutput) => void
  /** Called when an AI voice chunk is received */
  onAiVoiceChunk?: (message: SendAiVoiceChunk) => void
  /** Called when AI generation output ends (voice or text) */
  onAiOutputEnd?: (message: EndAiGenerationOutput) => void
  /** Called when an AI transcribed text chunk is received (real-time text streaming) */
  onAiTranscribedChunk?: (message: AiTranscribedChunk) => void
  /** Called when a server error occurs */
  onError?: (message: ErrorMessage) => void
  /** Called when the WebSocket connection is established */
  onConnect?: () => void
  /** Called when the WebSocket connection is closed */
  onDisconnect?: (event: CloseEvent) => void
  /** Called when a WebSocket error occurs */
  onWebSocketError?: (event: Event) => void
}

/** Configuration options for the WebSocket client */
export interface WebSocketClientConfig {
  /** WebSocket server URL (e.g., ws://localhost:3000/ws) */
  url: string
  /** API key for authentication */
  apiKey: string
  /** Event handlers for server-initiated messages */
  handlers?: WebSocketEventHandlers
  /** Session settings for client capabilities */
  sessionSettings?: {
    sendVoiceInput: boolean
    sendTextInput: boolean
    receiveVoiceOutput: boolean
    receiveTranscriptionUpdates: boolean
  }
  /** Timeout for request-response operations (in milliseconds, default: 30000) */
  timeout?: number
  /** Enable debug logging */
  debug?: boolean
}

/** Options for starting a conversation */
export interface StartConversationOptions {
  userId: string
  stageId: string
  personaId?: string
}

/**
 * WebSocket client for real-time conversation management with the Nexus Backend.
 * 
 * This client handles:
 * - Authentication with API keys
 * - Conversation lifecycle (start, resume, end)
 * - User input (text and voice)
 * - AI responses (voice streaming)
 * - Conversation control commands (stage navigation, variables, actions)
 * 
 * @example
 * ```typescript
 * const client = new NexusWebSocketClient({
 *   url: 'ws://localhost:3000/ws',
 *   apiKey: 'your-api-key',
 *   handlers: {
 *     onAiVoiceChunk: (message) => {
 *       console.log('Received audio chunk:', message.chunkId);
 *     },
 *     onError: (error) => {
 *       console.error('WebSocket error:', error.error);
 *     }
 *   }
 * });
 * 
 * await client.connect();
 * const conversationId = await client.startConversation({
 *   userId: 'user-123',
 *   stageId: 'stage-456'
 * });
 * await client.sendTextInput('Hello!');
 * await client.endConversation();
 * client.disconnect();
 * ```
 */
export class NexusWebSocketClient {
  private ws: WebSocket | null = null
  private sessionId: string | null = null
  private conversationId: string | null = null
  private projectSettings: ProjectSettings | null = null
  private currentInputTurnId: string | null = null
  private currentVoiceChunkOrdinal: number = 0
  private requestHandlers = new Map<string, {
    resolve: (response: any) => void
    reject: (error: Error) => void
    timeout: number
  }>()
  private config: Required<Omit<WebSocketClientConfig, 'sessionSettings'>> & Pick<WebSocketClientConfig, 'sessionSettings'>

  constructor(config: WebSocketClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
      debug: config.debug ?? false,
      handlers: config.handlers ?? {},
    }
  }

  /**
   * Establish WebSocket connection and authenticate.
   * @throws {Error} If connection or authentication fails
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = async () => {
          this.log('WebSocket connected')
          this.config.handlers.onConnect?.()
          
          try {
            await this.authenticate()
            resolve()
          } catch (error) {
            reject(error)
          }
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ServerMessage
            this.handleMessage(message)
          } catch (error) {
            this.log('Error parsing message:', error)
          }
        }

        this.ws.onerror = (event) => {
          this.log('WebSocket error:', event)
          this.config.handlers.onWebSocketError?.(event)
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = (event) => {
          this.log('WebSocket closed:', event.code, event.reason)
          this.config.handlers.onDisconnect?.(event)
          this.cleanup()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Authenticate with the API key and obtain a session ID.
   * @private
   */
  private async authenticate(): Promise<void> {
    const requestId = this.generateRequestId()
    
    return this.sendRequest<AuthResponse>({
      type: 'auth',
      requestId,
      apiKey: this.config.apiKey,
      sessionSettings: this.config.sessionSettings,
    } as AuthRequest, (response) => {
      if (response.success && response.sessionId) {
        this.sessionId = response.sessionId
        this.projectSettings = response.projectSettings || null
        this.log('Authenticated, session ID:', this.sessionId)
        this.log('Project settings:', this.projectSettings)
      } else {
        throw new Error(response.error || 'Authentication failed')
      }
    })
  }

  /**
   * Start a new conversation.
   * @param options - Conversation start options
   * @returns The conversation ID
   * @throws {Error} If conversation creation fails or not authenticated
   */
  async startConversation(options: StartConversationOptions): Promise<string> {
    this.ensureAuthenticated()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<StartConversationResponse>({
      type: 'start_conversation',
      requestId,
      sessionId: this.sessionId!,
      userId: options.userId,
      stageId: options.stageId,
      personaId: options.personaId,
    } as StartConversationRequest, (response) => {
      if (response.success && response.conversationId) {
        this.conversationId = response.conversationId
        this.log('Conversation started:', this.conversationId)
        return response.conversationId
      } else {
        throw new Error(response.error || 'Failed to start conversation')
      }
    })
  }

  /**
   * Resume an existing conversation.
   * @param conversationId - The conversation ID to resume
   * @throws {Error} If conversation resumption fails or not authenticated
   */
  async resumeConversation(conversationId: string): Promise<void> {
    this.ensureAuthenticated()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<ResumeConversationResponse>({
      type: 'resume_conversation',
      requestId,
      sessionId: this.sessionId!,
      conversationId,
    } as ResumeConversationRequest, (response) => {
      if (response.success) {
        this.conversationId = conversationId
        this.log('Conversation resumed:', this.conversationId)
      } else {
        throw new Error(response.error || 'Failed to resume conversation')
      }
    })
  }

  /**
   * End the current conversation.
   * @throws {Error} If conversation ending fails or no active conversation
   */
  async endConversation(): Promise<void> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<EndConversationResponse>({
      type: 'end_conversation',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
    } as EndConversationRequest, (response) => {
      if (response.success) {
        this.log('Conversation ended:', this.conversationId)
        this.conversationId = null
      } else {
        throw new Error(response.error || 'Failed to end conversation')
      }
    })
  }

  /**
   * Send text input to the conversation.
   * @param text - The text message to send
   * @throws {Error} If sending fails or no active conversation
   */
  async sendTextInput(text: string): Promise<void> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<SendUserTextInputResponse>({
      type: 'send_user_text_input',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      text,
    } as SendUserTextInputRequest, (response) => {
      if (!response.success) {
        throw new Error(response.error || 'Failed to send text input')
      }
    })
  }

  /**
   * Start voice input phase (step 1 of 3).
   * Must be followed by sendVoiceChunk() calls and endVoiceInput().
   * @returns The inputTurnId for this voice input session
   * @throws {Error} If starting voice input fails or no active conversation
   */
  async startVoiceInput(): Promise<string> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<StartUserVoiceInputResponse>({
      type: 'start_user_voice_input',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
    } as StartUserVoiceInputRequest, (response) => {
      if (response.success && response.inputTurnId) {
        this.currentInputTurnId = response.inputTurnId
        this.currentVoiceChunkOrdinal = 0
        this.log('Voice input started, inputTurnId:', this.currentInputTurnId)
        return response.inputTurnId
      } else {
        throw new Error(response.error || 'Failed to start voice input')
      }
    })
  }

  /**
   * Send a voice audio chunk (step 2 of 3).
   * Call this multiple times to stream audio data.
   * @param audioData - Base64-encoded audio data
   * @throws {Error} If sending chunk fails or no active conversation
   */
  async sendVoiceChunk(audioData: string): Promise<void> {
    this.ensureConversation()
    if (!this.currentInputTurnId) {
      throw new Error('No active voice input turn. Call startVoiceInput() first.')
    }
    const requestId = this.generateRequestId()
    
    return this.sendRequest<SendUserVoiceChunkResponse>({
      type: 'send_user_voice_chunk',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      audioData,
      ordinal: this.currentVoiceChunkOrdinal++,
      inputTurnId: this.currentInputTurnId,
    } as SendUserVoiceChunkRequest, (response) => {
      if (!response.success) {
        throw new Error(response.error || 'Failed to send voice chunk')
      }
    })
  }

  /**
   * End voice input phase (step 3 of 3).
   * Signals that the user has finished speaking.
   * @throws {Error} If ending voice input fails or no active conversation
   */
  async endVoiceInput(): Promise<void> {
    this.ensureConversation()
    if (!this.currentInputTurnId) {
      throw new Error('No active voice input turn. Call startVoiceInput() first.')
    }
    const requestId = this.generateRequestId()
    const inputTurnId = this.currentInputTurnId
    
    return this.sendRequest<EndUserVoiceInputResponse>({
      type: 'end_user_voice_input',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      inputTurnId,
    } as EndUserVoiceInputRequest, (response) => {
      if (response.success) {
        this.currentInputTurnId = null
        this.currentVoiceChunkOrdinal = 0
        this.log('Voice input ended')
      } else {
        throw new Error(response.error || 'Failed to end voice input')
      }
    })
  }

  /**
   * Navigate to a specific stage in the conversation.
   * @param stageId - The target stage ID
   * @throws {Error} If navigation fails or no active conversation
   */
  async goToStage(stageId: string): Promise<void> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<GoToStageResponse>({
      type: 'go_to_stage',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      stageId,
    } as GoToStageRequest, (response) => {
      if (!response.success) {
        throw new Error(response.error || 'Failed to navigate to stage')
      }
    })
  }

  /**
   * Set a variable value in a specific stage.
   * @param stageId - The stage ID
   * @param variableName - The variable name
   * @param variableValue - The variable value (any JSON-serializable type)
   * @throws {Error} If setting variable fails or no active conversation
   */
  async setVariable(stageId: string, variableName: string, variableValue: any): Promise<void> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<SetVarResponse>({
      type: 'set_var',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      stageId,
      variableName,
      variableValue,
    } as SetVarRequest, (response) => {
      if (!response.success) {
        throw new Error(response.error || 'Failed to set variable')
      }
    })
  }

  /**
   * Get a variable value from a specific stage.
   * @param stageId - The stage ID
   * @param variableName - The variable name
   * @returns The variable value (undefined if not found)
   * @throws {Error} If getting variable fails or no active conversation
   */
  async getVariable(stageId: string, variableName: string): Promise<any> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<GetVarResponse>({
      type: 'get_var',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      stageId,
      variableName,
    } as GetVarRequest, (response) => {
      if (response.success) {
        return response.variableValue
      } else {
        throw new Error(response.error || 'Failed to get variable')
      }
    })
  }

  /**
   * Get all variables from a specific stage.
   * @param stageId - The stage ID
   * @returns Map of variable names to values
   * @throws {Error} If getting variables fails or no active conversation
   */
  async getAllVariables(stageId: string): Promise<Record<string, any>> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<GetAllVarsResponse>({
      type: 'get_all_vars',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      stageId,
    } as GetAllVarsRequest, (response) => {
      if (response.success) {
        return response.variables
      } else {
        throw new Error(response.error || 'Failed to get variables')
      }
    })
  }

  /**
   * Execute a global action with parameters.
   * @param actionName - The action name
   * @param parameters - Array of parameters to pass to the action
   * @returns The result returned by the action
   * @throws {Error} If action execution fails or no active conversation
   */
  async runAction(actionName: string, parameters: any[] = []): Promise<any> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    
    return this.sendRequest<RunActionResponse>({
      type: 'run_action',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      actionName,
      parameters,
    } as RunActionRequest, (response) => {
      if (response.success) {
        return response.result
      } else {
        throw new Error(response.error || 'Failed to run action')
      }
    })
  }

  /**
   * Close the WebSocket connection.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.cleanup()
  }

  /**
   * Get the current session ID.
   */
  getSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Get the current conversation ID.
   */
  getConversationId(): string | null {
    return this.conversationId
  }

  /**
   * Get the project settings received during authentication.
   * Contains project configuration including voice settings and ASR config.
   */
  getProjectSettings(): ProjectSettings | null {
    return this.projectSettings
  }

  /**
   * Check if the client is connected and authenticated.
   */
  isAuthenticated(): boolean {
    return this.ws !== null && this.sessionId !== null
  }

  /**
   * Check if there is an active conversation.
   */
  hasActiveConversation(): boolean {
    return this.conversationId !== null
  }

  /**
   * Send a request and wait for response with timeout.
   * @private
   */
  private sendRequest<T>(message: any, handler: (response: T) => any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestHandlers.delete(message.requestId)
        reject(new Error(`Request timeout: ${message.type}`))
      }, this.config.timeout)

      this.requestHandlers.set(message.requestId, {
        resolve: (response: T) => {
          try {
            const result = handler(response)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        reject,
        timeout,
      })

      this.send(message)
    })
  }

  /**
   * Handle incoming messages from the server.
   * @private
   */
  private handleMessage(message: ServerMessage): void {
    this.log('Received message:', message.type)

    // Handle responses to requests (only for messages with requestId)
    const hasRequestId = (msg: ServerMessage): msg is ServerMessage & { requestId: string } => {
      return 'requestId' in msg && typeof msg.requestId === 'string'
    }
    
    if (hasRequestId(message) && this.requestHandlers.has(message.requestId)) {
      const handler = this.requestHandlers.get(message.requestId)!
      clearTimeout(handler.timeout)
      this.requestHandlers.delete(message.requestId)
      handler.resolve(message)
      return
    }

    // Handle server-initiated messages
    switch (message.type) {
      case 'user_transcribed_chunk':
        this.config.handlers.onUserTranscribedChunk?.(message as UserTranscribedChunk)
        break
      case 'start_ai_generation_output':
        this.config.handlers.onAiOutputStart?.(message as StartAiGenerationOutput)
        break
      case 'send_ai_voice_chunk':
        this.config.handlers.onAiVoiceChunk?.(message as SendAiVoiceChunk)
        break
      case 'end_ai_generation_output':
        this.config.handlers.onAiOutputEnd?.(message as EndAiGenerationOutput)
        break
      case 'ai_transcribed_chunk':
        this.config.handlers.onAiTranscribedChunk?.(message as AiTranscribedChunk)
        break
      case 'error':
        this.config.handlers.onError?.(message as ErrorMessage)
        this.log('Server error:', (message as ErrorMessage).error)
        break
      default:
        this.log('Unhandled message type:', message.type)
    }
  }

  /**
   * Send a message through the WebSocket.
   * @private
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    this.log('Sending message:', message.type)
    this.ws.send(JSON.stringify(message))
  }

  /**
   * Generate a unique request ID.
   * @private
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Ensure the client is authenticated.
   * @private
   */
  private ensureAuthenticated(): void {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call connect() first.')
    }
  }

  /**
   * Ensure there is an active conversation.
   * @private
   */
  private ensureConversation(): void {
    this.ensureAuthenticated()
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation() or resumeConversation() first.')
    }
  }

  /**
   * Clean up resources.
   * @private
   */
  private cleanup(): void {
    // Clear all pending request handlers
    for (const handler of this.requestHandlers.values()) {
      clearTimeout(handler.timeout)
      handler.reject(new Error('WebSocket connection closed'))
    }
    this.requestHandlers.clear()
    this.sessionId = null
    this.conversationId = null
    this.projectSettings = null
    this.currentInputTurnId = null
    this.currentVoiceChunkOrdinal = 0
  }

  /**
   * Log debug messages if debug mode is enabled.
   * @private
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[NexusWebSocketClient]', ...args)
    }
  }
}

/**
 * Create a WebSocket URL from an HTTP API base URL.
 * Converts http:// to ws:// and https:// to wss://, and appends /ws path.
 * 
 * @param apiBaseUrl - The HTTP API base URL (e.g., http://localhost:3000)
 * @returns The WebSocket URL (e.g., ws://localhost:3000/ws)
 * 
 * @example
 * ```typescript
 * const wsUrl = createWebSocketUrl('http://localhost:3000')
 * // Returns: 'ws://localhost:3000/ws'
 * 
 * const wsUrl = createWebSocketUrl('https://api.example.com')
 * // Returns: 'wss://api.example.com/ws'
 * ```
 */
export function createWebSocketUrl(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${url.host}/ws`
}
