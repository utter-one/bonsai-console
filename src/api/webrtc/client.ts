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
  EndUserVoiceInputRequest,
  EndUserVoiceInputResponse,
  SendUserTextInputRequest,
  SendUserTextInputResponse,
  UserTranscribedChunk,
  StartAiGenerationOutput,
  EndAiGenerationOutput,
  AiTranscribedChunk,
  ConversationEvent,
  ConversationEventUpdate,
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
  CallToolRequest,
  CallToolResponse,
} from '../websocket/websocket-contracts'

interface ErrorMessage {
  type: 'error'
  error: string
  requestId?: string
}

type ControlMessage =
  | AuthResponse
  | StartConversationResponse
  | ResumeConversationResponse
  | EndConversationResponse
  | StartUserVoiceInputResponse
  | EndUserVoiceInputResponse
  | SendUserTextInputResponse
  | UserTranscribedChunk
  | StartAiGenerationOutput
  | EndAiGenerationOutput
  | AiTranscribedChunk
  | ConversationEvent
  | ConversationEventUpdate
  | GoToStageResponse
  | SetVarResponse
  | GetVarResponse
  | GetAllVarsResponse
  | RunActionResponse
  | CallToolResponse
  | ErrorMessage

export interface WebRTCEventHandlers {
  onUserTranscribedChunk?: (message: UserTranscribedChunk) => void
  onAiOutputStart?: (message: StartAiGenerationOutput) => void
  /** Called when a binary audio frame arrives from the AI on the audio DataChannel */
  onAiAudioFrame?: (turnId: string, audioData: ArrayBuffer) => void
  onAiOutputEnd?: (message: EndAiGenerationOutput) => void
  onAiTranscribedChunk?: (message: AiTranscribedChunk) => void
  onConversationEvent?: (message: ConversationEvent) => void
  onConversationEventUpdate?: (message: ConversationEventUpdate) => void
  onError?: (message: ErrorMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export interface WebRTCClientConfig {
  /** HTTP base URL used to derive the signaling endpoint (e.g. http://localhost:3000) */
  apiBaseUrl: string
  apiKey: string
  handlers?: WebRTCEventHandlers
  sessionSettings?: {
    sendVoiceInput: boolean
    sendTextInput: boolean
    receiveVoiceOutput: boolean
    receiveTranscriptionUpdates: boolean
    receiveEvents?: boolean
  }
  timeout?: number
  debug?: boolean
}

export type { StartConversationOptions } from '../websocket/client'
import type { StartConversationOptions } from '../websocket/client'

export class NexusWebRTCClient {
  private pc: RTCPeerConnection | null = null
  private controlChannel: RTCDataChannel | null = null
  private audioChannel: RTCDataChannel | null = null
  private sessionId: string | null = null
  private conversationId: string | null = null
  private projectSettings: ProjectSettings | null = null
  private currentInputTurnId: string | null = null
  private requestHandlers = new Map<string, {
    resolve: (response: any) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  }>()
  private config: Required<Omit<WebRTCClientConfig, 'sessionSettings'>> & Pick<WebRTCClientConfig, 'sessionSettings'>

  constructor(config: WebRTCClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
      debug: config.debug ?? false,
      handlers: config.handlers ?? {},
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        })

        this.controlChannel = this.pc.createDataChannel('control', { ordered: true })
        this.audioChannel = this.pc.createDataChannel('audio', {
          ordered: false,
          maxRetransmits: 0,
        })

        let controlOpen = false
        let audioOpen = false

        const onBothOpen = async () => {
          this.config.handlers.onConnect?.()
          try {
            await this.authenticate()
            resolve()
          } catch (error) {
            reject(error)
          }
        }

        this.controlChannel.onopen = () => {
          controlOpen = true
          if (audioOpen) onBothOpen()
        }
        this.audioChannel.onopen = () => {
          audioOpen = true
          if (controlOpen) onBothOpen()
        }

        this.controlChannel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as ControlMessage
            this.handleControlMessage(message)
          } catch (error) {
            this.log('Error parsing control message:', error)
          }
        }

        this.audioChannel.onmessage = (event: MessageEvent) => {
          const raw = event.data
          const toBuffer: Promise<ArrayBuffer> =
            raw instanceof ArrayBuffer
              ? Promise.resolve(raw)
              : (raw as Blob).arrayBuffer()

          toBuffer.then((buf) => {
            if (buf.byteLength < 2) return
            const view = new DataView(buf)
            const turnIdLength = view.getUint16(0, true)
            if (buf.byteLength < 2 + turnIdLength) return
            const turnId = new TextDecoder().decode(new Uint8Array(buf, 2, turnIdLength))
            const audioData = buf.slice(2 + turnIdLength)
            this.config.handlers.onAiAudioFrame?.(turnId, audioData)
          })
        }

        this.controlChannel.onclose = () => {
          this.log('Control channel closed')
          this.config.handlers.onDisconnect?.()
          this.cleanup()
        }

        this.pc.onconnectionstatechange = () => {
          const state = this.pc?.connectionState
          this.log('RTCPeerConnection state:', state)
          if (state === 'failed' || state === 'closed') {
            this.config.handlers.onDisconnect?.()
            this.cleanup()
          }
        }

        this.pc.createOffer().then(async (offer) => {
          await this.pc!.setLocalDescription(offer)

          const signalingUrl = `${this.config.apiBaseUrl}api/webrtc/offer`
          const response = await fetch(signalingUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sdpOffer: offer.sdp }),
          })

          if (!response.ok) {
            const text = await response.text()
            reject(new Error(`WebRTC signaling failed: ${response.status} ${text}`))
            return
          }

          const { sdpAnswer } = await response.json() as { sdpAnswer: string }
          await this.pc!.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })
          this.log('Remote description set, waiting for DataChannels to open...')
        }).catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

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
        this.projectSettings = response.projectSettings ?? null
        this.log('Authenticated, sessionId:', this.sessionId)
      } else {
        throw new Error(response.error || 'Authentication failed')
      }
    })
  }

  async startConversation(options: StartConversationOptions): Promise<string> {
    this.ensureAuthenticated()
    const requestId = this.generateRequestId()
    return this.sendRequest<StartConversationResponse>({
      type: 'start_conversation',
      requestId,
      sessionId: this.sessionId!,
      userId: options.userId,
      stageId: options.stageId,
      agentId: options.agentId,
      timezone: options.timezone,
    } as StartConversationRequest, (response) => {
      if (response.success && response.conversationId) {
        this.conversationId = response.conversationId
        return response.conversationId
      }
      throw new Error(response.error || 'Failed to start conversation')
    })
  }

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
      } else {
        throw new Error(response.error || 'Failed to resume conversation')
      }
    })
  }

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
        this.conversationId = null
      } else {
        throw new Error(response.error || 'Failed to end conversation')
      }
    })
  }

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
      if (!response.success) throw new Error(response.error || 'Failed to send text input')
    })
  }

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
        this.log('Voice input started, inputTurnId:', this.currentInputTurnId)
        return response.inputTurnId
      }
      throw new Error(response.error || 'Failed to start voice input')
    })
  }

  /**
   * Send a raw PCM audio chunk over the audio DataChannel.
   * The buffer must be Int16 LE PCM matching the project's ASR sample rate.
   * @param audioBuffer - Raw Int16 LE PCM bytes
   */
  sendVoiceChunkRaw(audioBuffer: ArrayBuffer): void {
    if (!this.currentInputTurnId) {
      throw new Error('No active voice input turn. Call startVoiceInput() first.')
    }
    if (!this.audioChannel || this.audioChannel.readyState !== 'open') {
      throw new Error('Audio DataChannel is not open')
    }
    const frame = this.encodeAudioFrame(this.currentInputTurnId, audioBuffer)
    this.audioChannel.send(frame)
  }

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
      } else {
        throw new Error(response.error || 'Failed to end voice input')
      }
    })
  }

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
      if (!response.success) throw new Error(response.error || 'Failed to navigate to stage')
    })
  }

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
      if (!response.success) throw new Error(response.error || 'Failed to set variable')
    })
  }

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
      if (response.success) return response.variableValue
      throw new Error(response.error || 'Failed to get variable')
    })
  }

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
      if (response.success) return response.variables
      throw new Error(response.error || 'Failed to get variables')
    })
  }

  async runAction(actionName: string, parameters: Record<string, any> = {}): Promise<any> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    return this.sendRequest<RunActionResponse>({
      type: 'run_action',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      actionName,
      parameters,
    } as any as RunActionRequest, (response) => {
      if (response.success) return response.result
      throw new Error(response.error || 'Failed to run action')
    })
  }

  async callTool(toolId: string, parameters: Record<string, any> = {}): Promise<any> {
    this.ensureConversation()
    const requestId = this.generateRequestId()
    return this.sendRequest<CallToolResponse>({
      type: 'call_tool',
      requestId,
      sessionId: this.sessionId!,
      conversationId: this.conversationId!,
      toolId,
      parameters,
    } as CallToolRequest, (response) => {
      if (response.success) return response.result
      throw new Error(response.error || 'Failed to call tool')
    })
  }

  disconnect(): void {
    this.cleanup()
  }

  getSessionId(): string | null { return this.sessionId }
  getConversationId(): string | null { return this.conversationId }
  getProjectSettings(): ProjectSettings | null { return this.projectSettings }
  isAuthenticated(): boolean { return this.pc !== null && this.sessionId !== null }
  hasActiveConversation(): boolean { return this.conversationId !== null }

  private encodeAudioFrame(turnId: string, audioBuffer: ArrayBuffer): ArrayBuffer {
    const turnIdBytes = new TextEncoder().encode(turnId)
    const out = new Uint8Array(2 + turnIdBytes.length + audioBuffer.byteLength)
    new DataView(out.buffer).setUint16(0, turnIdBytes.length, true)
    out.set(turnIdBytes, 2)
    out.set(new Uint8Array(audioBuffer), 2 + turnIdBytes.length)
    return out.buffer
  }

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

      this.sendControl(message)
    })
  }

  private handleControlMessage(message: ControlMessage): void {
    this.log('Received control message:', message.type)

    const hasRequestId = (msg: ControlMessage): msg is ControlMessage & { requestId: string } =>
      'requestId' in msg && typeof (msg as any).requestId === 'string'

    if (hasRequestId(message) && this.requestHandlers.has(message.requestId)) {
      const handler = this.requestHandlers.get(message.requestId)!
      clearTimeout(handler.timeout)
      this.requestHandlers.delete(message.requestId)
      handler.resolve(message)
      return
    }

    switch (message.type) {
      case 'user_transcribed_chunk':
        this.config.handlers.onUserTranscribedChunk?.(message as UserTranscribedChunk)
        break
      case 'start_ai_generation_output':
        this.config.handlers.onAiOutputStart?.(message as StartAiGenerationOutput)
        break
      case 'end_ai_generation_output':
        this.config.handlers.onAiOutputEnd?.(message as EndAiGenerationOutput)
        break
      case 'ai_transcribed_chunk':
        this.config.handlers.onAiTranscribedChunk?.(message as AiTranscribedChunk)
        break
      case 'conversation_event':
        this.config.handlers.onConversationEvent?.(message as ConversationEvent)
        break
      case 'conversation_event_update':
        this.config.handlers.onConversationEventUpdate?.(message as ConversationEventUpdate)
        break
      case 'error':
        this.config.handlers.onError?.(message as ErrorMessage)
        this.log('Server error:', (message as ErrorMessage).error)
        break
      default:
        this.log('Unhandled control message type:', (message as any).type)
    }
  }

  private sendControl(message: any): void {
    if (!this.controlChannel || this.controlChannel.readyState !== 'open') {
      throw new Error('Control DataChannel is not open')
    }
    this.log('Sending control message:', message.type)
    this.controlChannel.send(JSON.stringify(message))
  }

  private generateRequestId(): string {
    return `rtc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  private ensureAuthenticated(): void {
    if (!this.sessionId) throw new Error('Not authenticated. Call connect() first.')
  }

  private ensureConversation(): void {
    this.ensureAuthenticated()
    if (!this.conversationId) throw new Error('No active conversation. Call startConversation() first.')
  }

  private cleanup(): void {
    for (const [, handler] of this.requestHandlers) {
      clearTimeout(handler.timeout)
      handler.reject(new Error('WebRTC connection closed'))
    }
    this.requestHandlers.clear()

    if (this.controlChannel) {
      try { this.controlChannel.close() } catch { /* ignore */ }
      this.controlChannel = null
    }
    if (this.audioChannel) {
      try { this.audioChannel.close() } catch { /* ignore */ }
      this.audioChannel = null
    }
    if (this.pc) {
      try { this.pc.close() } catch { /* ignore */ }
      this.pc = null
    }

    this.sessionId = null
    this.conversationId = null
    this.projectSettings = null
    this.currentInputTurnId = null
  }

  private log(...args: any[]): void {
    if (this.config.debug) console.log('[WebRTC]', ...args)
  }
}
