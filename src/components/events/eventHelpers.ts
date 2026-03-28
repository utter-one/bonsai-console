/**
 * Normalized event interface that abstracts over both ConversationEventResponse
 * (from the REST API) and WSConversationEvent (from WebSocket).
 */
export interface NormalizedEvent {
  /** Unique identifier used for expand/collapse tracking */
  id: string
  /** The event type discriminator */
  eventType:
  | 'message'
  | 'classification'
  | 'transformation'
  | 'execution_plan'
  | 'action'
  | 'command'
  | 'tool_call'
  | 'conversation_start'
  | 'conversation_resume'
  | 'conversation_end'
  | 'conversation_aborted'
  | 'conversation_failed'
  | 'jump_to_stage'
  | 'moderation'
  | 'variables_updated'
  | 'user_profile_updated'
  | 'user_input_modified'
  | 'user_banned'
  | 'visibility_changed'
  | 'sample_copy_selection'
  /** Event payload (same union shape from the API) */
  eventData: any
  /** Formatted timestamp string to display */
  timestamp: string
}

const TOP_LEVEL_EVENT_TYPES = new Set([
  'message',
  'command',
  'conversation_start',
  'conversation_resume',
  'conversation_end',
  'conversation_aborted',
  'conversation_failed',
])

export function isTopLevelEvent(event: NormalizedEvent): boolean {
  return TOP_LEVEL_EVENT_TYPES.has(event.eventType)
}

export function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'message':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
    case 'classification':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
    case 'transformation':
      return 'bg-violet-50 border-violet-200 dark:bg-violet-900/10 dark:border-violet-800'
    case 'execution_plan':
      return 'bg-lime-50 border-lime-200 dark:bg-lime-900/10 dark:border-lime-800'
    case 'action':
      return 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
    case 'command':
      return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800'
    case 'tool_call':
      return 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-800'
    case 'conversation_start':
      return 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
    case 'conversation_resume':
      return 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-800'
    case 'conversation_end':
      return 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
    case 'conversation_aborted':
      return 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
    case 'conversation_failed':
      return 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
    case 'jump_to_stage':
      return 'bg-teal-50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800'
    case 'moderation':
      return 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
    case 'variables_updated':
      return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
    case 'user_profile_updated':
      return 'bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-800'
    case 'user_input_modified':
      return 'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-900/10 dark:border-fuchsia-800'
    case 'user_banned':
      return 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800'
    case 'visibility_changed':
      return 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-600'
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  }
}

export function formatMs(ms: number | null | undefined): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function hasSystemPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.systemPrompt && typeof metadata.systemPrompt === 'string')
}

export function hasRawResponse(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.rawResponse && typeof metadata.rawResponse === 'string')
}

export function hasFillerPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.fillerPrompt && typeof metadata.fillerPrompt === 'string')
}

export function hasCurrentVariables(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.currentVariables && typeof metadata.currentVariables === 'object')
}

export function hasAssistantTiming(metadata: Record<string, any> | undefined): boolean {
  if (!metadata) return false
  return ['llmDurationMs', 'timeToFirstTokenMs', 'timeToFirstTokenFromTurnStartMs', 'timeToFirstAudioMs', 'totalTurnDurationMs']
    .some(key => metadata[key] != null)
}

export function getToolTypeLabel(toolType: string | undefined): string {
  switch (toolType) {
    case 'smart_function': return 'Smart Function'
    case 'webhook': return 'Webhook'
    case 'script': return 'Script'
    default: return 'Tool'
  }
}

export function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function resolveName(id: string | null | undefined, map?: Record<string, string>): string {
  if (!id) return ''
  return (map && map[id]) || id
}

export function formatLifecycleContext(ctx: string): string {
  switch (ctx) {
    case 'on_enter': return 'On Enter'
    case 'on_leave': return 'On Leave'
    case 'on_fallback': return 'On Fallback'
    case 'conversation_start': return 'Conversation Start'
    case 'conversation_resume': return 'Conversation Resume'
    case 'conversation_end': return 'Conversation End'
    case 'conversation_abort': return 'Conversation Abort'
    case 'conversation_failed': return 'Conversation Failed'
    default: return ctx.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
}

export function getEffectTypeClasses(type: string | undefined): string {
  switch (type) {
    case 'end_conversation':
      return 'border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
    case 'abort_conversation':
      return 'border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-900/10 dark:border-orange-800 dark:text-orange-300'
    case 'go_to_stage':
      return 'border-teal-200 bg-teal-50 text-teal-800 dark:bg-teal-900/10 dark:border-teal-800 dark:text-teal-300'
    case 'modify_user_input':
      return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-900/10 dark:border-fuchsia-800 dark:text-fuchsia-300'
    case 'modify_variables':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-300'
    case 'modify_user_profile':
      return 'border-sky-200 bg-sky-50 text-sky-800 dark:bg-sky-900/10 dark:border-sky-800 dark:text-sky-300'
    case 'call_tool':
      return 'border-pink-200 bg-pink-50 text-pink-800 dark:bg-pink-900/10 dark:border-pink-800 dark:text-pink-300'
    case 'change_visibility':
      return 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
    case 'ban_user':
      return 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-900/10 dark:border-rose-800 dark:text-rose-300'
    case 'generate_response':
    default:
      return 'border-gray-200 bg-white/60 text-gray-800 dark:bg-gray-900/60 dark:border-gray-700 dark:text-gray-200'
  }
}

export function formatEffectType(type: string | undefined): string {
  if (!type) return 'Effect'
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
