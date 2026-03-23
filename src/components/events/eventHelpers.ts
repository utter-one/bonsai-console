export interface NormalizedEvent {
  id: string
  eventType:
  | 'message'
  | 'classification'
  | 'transformation'
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
  eventData: any
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
