<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  ArrowLeftRight,
  GitBranch,
  Zap,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  Wrench,
  Globe,
  Code,
  Sparkles,
  FileText,
  ScrollText,
  Wand2,
  Braces,
  Bug,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  Eye,
  UserCircle,
  Pencil,
  UserX,
  ListOrdered,
} from 'lucide-vue-next'
import ContentViewer from '@/components/ContentViewer.vue'

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
  /** Event payload (same union shape from the API) */
  eventData: any
  /** Formatted timestamp string to display */
  timestamp: string
}

const props = defineProps<{
  event: NormalizedEvent
  /** Whether to show the bug report button on events */
  showBugReport?: boolean
  /** Whether to highlight this event (e.g. when navigating from an issue report) */
  highlighted?: boolean
  /** Optional ID-to-name lookup maps for resolving stage/classifier/transformer IDs */
  entityNames?: {
    stages?: Record<string, string>
    classifiers?: Record<string, string>
    transformers?: Record<string, string>
  }
}>()

const emit = defineEmits<{
  (e: 'open-prompt', prompt: string): void
  (e: 'open-filler-prompt', prompt: string): void
  (e: 'open-raw-response', rawResponse: string): void
  (e: 'open-variables', variables: Record<string, any>): void
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const expanded = ref(false)
const hasHovered = ref(false)

function toggle() {
  expanded.value = !expanded.value
}

function onHighlightMouseEnter() {
  if (props.highlighted && !hasHovered.value) {
    hasHovered.value = true
  }
}

// Type guards
function isMessageEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'message'
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

function isTopLevelEvent(event: NormalizedEvent): boolean {
  return TOP_LEVEL_EVENT_TYPES.has(event.eventType)
}

function isClassificationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'classification'
}

function isTransformationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'transformation'
}

function isActionEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'action'
}

function isCommandEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'command'
}

function isToolCallEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'tool_call'
}

function isConversationStartEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_start'
}

function isConversationResumeEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_resume'
}

function isConversationEndEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_end'
}

function isConversationAbortedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_aborted'
}

function isConversationFailedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'conversation_failed'
}

function isJumpToStageEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'jump_to_stage'
}

function isModerationEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'moderation'
}

function isVariablesUpdatedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'variables_updated'
}

function isUserProfileUpdatedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'user_profile_updated'
}

function isUserInputModifiedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'user_input_modified'
}

function isUserBannedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'user_banned'
}

function isVisibilityChangedEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'visibility_changed'
}

function isExecutionPlanEvent(event: NormalizedEvent): boolean {
  return event.eventType === 'execution_plan'
}

const EXECUTION_PLAN_COLORS = [
  { actionClasses: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700', stroke: '#9333ea' },
  { actionClasses: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700', stroke: '#2563eb' },
  { actionClasses: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700', stroke: '#10b981' },
  { actionClasses: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700', stroke: '#f97316' },
  { actionClasses: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700', stroke: '#ec4899' },
  { actionClasses: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700', stroke: '#14b8a6' },
  { actionClasses: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700', stroke: '#f59e0b' },
  { actionClasses: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700', stroke: '#6366f1' },
] as const

const executionPlanActionColorMap = computed<Record<string, number>>(() => {
  if (props.event.eventType !== 'execution_plan') return {}
  const actions: string[] = (props.event.eventData as any)?.actions ?? []
  const map: Record<string, number> = {}
  actions.forEach((name, idx) => { map[name] = idx % EXECUTION_PLAN_COLORS.length })
  return map
})

function getExecutionPlanActionClasses(idx: number): string {
  return EXECUTION_PLAN_COLORS[idx % EXECUTION_PLAN_COLORS.length].actionClasses
}

function getEffectTypeClasses(type: string | undefined): string {
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

function formatEffectType(type: string | undefined): string {
  if (!type) return 'Effect'
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatLifecycleContext(ctx: string): string {
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

type ExecutionPlanDisplayedEffect =
  | { kind: 'normal'; effectEntry: any; displayIdx: number }
  | { kind: 'shared'; actionNames: string[]; displayIdx: number }

const executionPlanDisplayedEffects = computed<ExecutionPlanDisplayedEffect[]>(() => {
  if (props.event.eventType !== 'execution_plan') return []
  const effects: any[] = (props.event.eventData as any)?.effects ?? []

  const genRespActionNames = effects
    .filter(e => e.effect?.type === 'generate_response')
    .map(e => e.actionName)
  const isShared = genRespActionNames.length > 1

  const result: ExecutionPlanDisplayedEffect[] = []
  let sharedAdded = false

  for (const entry of effects) {
    if (entry.effect?.type === 'generate_response' && isShared) {
      if (!sharedAdded) {
        result.push({ kind: 'shared', actionNames: genRespActionNames, displayIdx: result.length })
        sharedAdded = true
      }
    } else {
      result.push({ kind: 'normal', effectEntry: entry, displayIdx: result.length })
    }
  }

  return result
})

const executionPlanContainerRef = ref<HTMLElement | null>(null)
const executionPlanActionBadgeRefs = new Map<string, HTMLElement>()
const executionPlanEffectBadgeRefs = new Map<number, HTMLElement>()
const executionPlanArrows = ref<{ path: string; color: string; colorIdx: number }[]>([])

function setActionBadgeRef(actionName: string, el: HTMLElement | null) {
  if (el) executionPlanActionBadgeRefs.set(actionName, el)
  else executionPlanActionBadgeRefs.delete(actionName)
}

function setEffectBadgeRef(idx: number, el: HTMLElement | null) {
  if (el) executionPlanEffectBadgeRefs.set(idx, el)
  else executionPlanEffectBadgeRefs.delete(idx)
}

async function recomputeExecutionPlanArrows() {
  await nextTick()
  const container = executionPlanContainerRef.value
  if (!container) {
    executionPlanArrows.value = []
    return
  }
  const containerRect = container.getBoundingClientRect()
  const paths: { path: string; color: string; colorIdx: number }[] = []

  for (const displayed of executionPlanDisplayedEffects.value) {
    const effectEl = executionPlanEffectBadgeRefs.get(displayed.displayIdx)
    if (!effectEl) continue

    const sourceActions = displayed.kind === 'shared'
      ? displayed.actionNames
      : [displayed.effectEntry.actionName]

    for (const actionName of sourceActions) {
      const actionEl = executionPlanActionBadgeRefs.get(actionName)
      if (!actionEl) continue

      const ar = actionEl.getBoundingClientRect()
      const er = effectEl.getBoundingClientRect()
      const x1 = ar.right - containerRect.left
      const y1 = ar.top + ar.height / 2 - containerRect.top
      const x2 = er.left - containerRect.left
      const y2 = er.top + er.height / 2 - containerRect.top
      const mx = (x1 + x2) / 2

      const colorIdx = executionPlanActionColorMap.value[actionName] ?? 0
      paths.push({
        path: `M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
        color: EXECUTION_PLAN_COLORS[colorIdx].stroke,
        colorIdx,
      })
    }
  }

  executionPlanArrows.value = paths
}

watch(expanded, (val) => {
  if (val && isExecutionPlanEvent(props.event)) {
    recomputeExecutionPlanArrows()
  } else if (!val) {
    executionPlanArrows.value = []
  }
})

function getEventTypeColor(eventType: string): string {
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
    // Note: color is overridden inline in the template based on blocking state
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  }
}

function resolveName(id: string | null | undefined, map?: Record<string, string>): string {
  if (!id) return ''
  return (map && map[id]) || id
}

function getEventSummary(event: NormalizedEvent): string {
  const data = event.eventData as any
  switch (event.eventType) {
    case 'execution_plan':
      return `${data.actions?.length ?? 0} action(s) · ${data.effects?.length ?? 0} effect(s)`
    case 'classification':
      return `${resolveName(data.classifierId, props.entityNames?.classifiers)} · ${data.actions?.length ?? 0} action(s) matched`
    case 'transformation':
      return `${resolveName(data.transformerId, props.entityNames?.transformers)} · ${data.appliedFields?.length ?? 0} field(s) applied`
    case 'action':
      return data.actionName
    case 'command':
      return data.command
    case 'tool_call':
      return `${data.toolName} · ${data.success ? 'success' : 'failed'}${
        data.toolType ? ' · ' + getToolTypeLabel(data.toolType) : ''
      }`
    case 'conversation_start':
      return `stage: ${resolveName(data.stageId, props.entityNames?.stages)}`
    case 'conversation_resume':
      return `${data.previousStatus} → stage: ${resolveName(data.stageId, props.entityNames?.stages)}`
    case 'conversation_end':
      return data.reason ? data.reason : `stage: ${resolveName(data.stageId, props.entityNames?.stages)}`
    case 'conversation_aborted':
      return data.reason
    case 'conversation_failed':
      return data.reason
    case 'jump_to_stage':
      return `${resolveName(data.fromStageId, props.entityNames?.stages)} → ${resolveName(data.toStageId, props.entityNames?.stages)}`
    case 'moderation': {
      const blocking: string[] = data.blockingCategories ?? []
      const detected: string[] = data.detectedCategories ?? []
      if (blocking.length > 0) return `Blocked · ${blocking.join(', ')}`
      if (detected.length > 0) return `Detected · ${detected.join(', ')}`
      return 'Passed'
    }
    case 'variables_updated':
      return `${data.sourceActionName} · ${Object.keys(data.variables ?? {}).length} var(s) updated`
    case 'user_profile_updated':
      return `${data.sourceActionName} · ${Object.keys(data.profile ?? {}).length} field(s) updated`
    case 'user_input_modified':
      return data.sourceActionName
    case 'user_banned':
      return data.reason ? `${data.sourceActionName} · ${data.reason}` : data.sourceActionName
    case 'visibility_changed':
      return `${data.sourceActionName} · ${data.visibility?.visibility}`
    default:
      return ''
  }
}

function getToolTypeLabel(toolType: string | undefined): string {
  switch (toolType) {
    case 'smart_function': return 'Smart Function'
    case 'webhook': return 'Webhook'
    case 'script': return 'Script'
    default: return 'Tool'
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function hasSystemPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.systemPrompt && typeof metadata.systemPrompt === 'string')
}

function hasRawResponse(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.rawResponse && typeof metadata.rawResponse === 'string')
}

function hasFillerPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.fillerPrompt && typeof metadata.fillerPrompt === 'string')
}

function hasCurrentVariables(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.currentVariables && typeof metadata.currentVariables === 'object')
}

function formatMs(ms: number | null | undefined): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function hasAssistantTiming(metadata: Record<string, any> | undefined): boolean {
  if (!metadata) return false
  return ['llmDurationMs', 'timeToFirstTokenMs', 'timeToFirstTokenFromTurnStartMs', 'timeToFirstAudioMs', 'totalTurnDurationMs']
    .some(key => metadata[key] != null)
}

function onOpenPrompt(prompt: string) {
  emit('open-prompt', prompt)
}

function onOpenFillerPrompt(prompt: string) {
  emit('open-filler-prompt', prompt)
}

function onOpenRawResponse(rawResponse: string) {
  emit('open-raw-response', rawResponse)
}

function onOpenVariables(variables: Record<string, any>) {
  emit('open-variables', variables)
}

function onBugReport() {
  emit('open-bug-report', props.event)
}
</script>

<template>
  <div
    class="border rounded-lg p-1 shadow-sm transition-shadow hover:shadow-md"
    :class="[
      getEventTypeColor(event.eventType),
      { 'ml-8': !isTopLevelEvent(event) },
      { 'highlight-pulse': highlighted && !hasHovered },
      { 'highlight-finish': highlighted && hasHovered }
    ]"
    @mouseenter="onHighlightMouseEnter"
  >
    <!-- Message Event -->
    <div v-if="isMessageEvent(event)">
      <div class="flex items-start p-2 gap-3">
        <MessageSquare class="w-5 h-5 mt-0.5"
          :class="event.eventData.role === 'user' ? 'text-blue-600' : 'text-green-600'" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold"
                :class="event.eventData.role === 'user' ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'">
                {{ event.eventData.role === 'user' ? 'User' : 'Assistant' }}
              </span>
              <span class="text-xs text-gray-500">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="text-gray-900 whitespace-pre-wrap dark:text-gray-100">{{ event.eventData.text }}</div>
          <div v-if="event.eventData.role === 'user' && (event.eventData.metadata?.processingDurationMs != null || event.eventData.metadata?.actionsDurationMs != null || event.eventData.metadata?.fillerDurationMs != null || event.eventData.metadata?.moderationDurationMs != null)"
            class="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-1.5 dark:border-blue-900">
            <span v-if="event.eventData.metadata?.moderationDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Moderation</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.moderationDurationMs) }}</span></span>
            <span v-if="event.eventData.metadata?.processingDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Processing</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.processingDurationMs) }}</span></span>
            <span v-if="event.eventData.metadata?.actionsDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Actions</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.actionsDurationMs) }}</span></span>
            <span v-if="event.eventData.metadata?.fillerDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Filler</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.eventData.metadata.fillerDurationMs) }}</span></span>
          </div>
          <div v-if="event.eventData.role === 'assistant' && hasAssistantTiming(event.eventData.metadata)"
            class="mt-2 pt-2 border-t border-green-200 flex flex-wrap gap-1.5 dark:border-green-900">
            <span v-if="event.eventData.metadata?.totalTurnDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">Total</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.totalTurnDurationMs) }}</span></span>
            <span v-if="event.eventData.metadata?.llmDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">LLM</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.llmDurationMs) }}</span></span>
            <span v-if="event.eventData.metadata?.timeToFirstTokenMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstTokenMs) }}</span></span>
            <span v-if="event.eventData.metadata?.timeToFirstTokenFromTurnStartMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT (turn)</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstTokenFromTurnStartMs) }}</span></span>
            <span v-if="event.eventData.metadata?.timeToFirstAudioMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">First audio</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.eventData.metadata.timeToFirstAudioMs) }}</span></span>
          </div>
          <div v-if="event.eventData.originalText && event.eventData.originalText !== event.eventData.text"
            class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</span>
            <div class="text-sm text-gray-700 mt-1 whitespace-pre-wrap dark:text-gray-300">{{ event.eventData.originalText }}</div>
          </div>
          <div v-if="event.eventData.visibility" class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 flex items-center gap-1.5">
            <Eye class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Visibility:</span>
            <span
              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': event.eventData.visibility.visibility === 'always',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.eventData.visibility.visibility === 'stage',
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': event.eventData.visibility.visibility === 'never',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': event.eventData.visibility.visibility === 'conditional',
              }"
            >
              {{ event.eventData.visibility.visibility }}
            </span>
            <span v-if="event.eventData.visibility.visibility === 'conditional' && event.eventData.visibility.condition"
              class="font-mono text-xs text-gray-600 dark:text-gray-400 truncate">
              {{ event.eventData.visibility.condition }}
            </span>
          </div>
          <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0"
            class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
            <details class="group">
              <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                Message Metadata ({{ Object.keys(event.eventData.metadata).length }})
              </summary>
              <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Classification Event -->
    <div v-else-if="isClassificationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <GitBranch class="w-5 h-5 mt-0.5 text-yellow-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-yellow-900 dark:text-yellow-100 shrink-0 text-left">Classification</button>
              <span v-if="!expanded" class="text-xs font-medium text-yellow-700 dark:text-yellow-300 min-w-0 truncate">{{ resolveName(event.eventData.classifierId, entityNames?.classifiers) }}</span>
              <span v-if="!expanded" class="text-xs text-gray-400 shrink-0">· {{ event.eventData.actions?.length ?? 0 }} action(s) matched</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 shrink-0"><span class="text-yellow-600 dark:text-yellow-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Classifier:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.classifierId, entityNames?.classifiers) }}</div>
              <div v-if="entityNames?.classifiers?.[event.eventData.classifierId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.classifierId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.actions && event.eventData.actions.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Matched Actions:</span>
              <div class="mt-1 space-y-2">
                <div v-for="(actionGroup, idx) in event.eventData.actions" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-2.5 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-xs font-medium text-gray-700 mb-1.5">
                    {{ actionGroup.classifierName }}
                  </div>
                  <div v-if="actionGroup.classifierId" class="text-[10px] text-gray-500 font-mono mb-2">{{ actionGroup.classifierId }}</div>
                  <div class="space-y-2.5">
                    <div v-for="(action, aidx) in actionGroup.actions" :key="aidx"
                      class="pl-2.5 border-l-2 border-yellow-300">
                      <div class="text-sm font-semibold text-gray-900 mb-1.5 dark:text-white">{{ action.name }}</div>
                      <div v-if="action.parameters && Object.keys(action.parameters).length > 0"
                        class="space-y-1">
                        <div v-for="(value, key) in action.parameters" :key="key"
                          class="md:flex items-start gap-2 text-xs">
                          <span class="text-gray-600 font-medium min-w-[80px] shrink-0 dark:text-gray-400">{{ key }}:</span>
                          <span class="text-gray-900 break-words dark:text-gray-200">{{ 
                            typeof value === 'object' ? JSON.stringify(value) : String(value) 
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transformation Event -->
    <div v-else-if="isTransformationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <ArrowLeftRight class="w-5 h-5 mt-0.5 text-violet-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-violet-900 dark:text-violet-100 shrink-0 text-left">Transformation</button>
              <span v-if="!expanded" class="text-xs font-medium text-violet-700 dark:text-violet-300 min-w-0 truncate">{{ resolveName(event.eventData.transformerId, entityNames?.transformers) }}</span>
              <span v-if="!expanded" class="text-xs text-gray-400 shrink-0">· {{ event.eventData.appliedFields?.length ?? 0 }} field(s) applied</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 shrink-0"><span class="text-violet-600 dark:text-violet-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Transformer:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.transformerId, entityNames?.transformers) }}</div>
              <div v-if="entityNames?.transformers?.[event.eventData.transformerId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.transformerId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.appliedFields && event.eventData.appliedFields.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Applied Fields ({{ event.eventData.appliedFields.length }}):</span>
              <div class="mt-1 flex flex-wrap gap-1.5">
                <span v-for="field in event.eventData.appliedFields" :key="field"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  {{ field }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Execution Plan Event -->
    <div v-else-if="isExecutionPlanEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <ListOrdered class="w-5 h-5 mt-0.5 text-lime-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-3': expanded }">
            <div class="flex items-center gap-2 min-w-0 flex-wrap">
              <button @click="toggle()" class="font-semibold text-lime-900 dark:text-lime-100 shrink-0 text-left">Execution Plan</button>
              <span v-if="event.eventData.lifecycleContext"
                class="text-xs px-1.5 py-0.5 rounded bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 shrink-0">
                {{ formatLifecycleContext(event.eventData.lifecycleContext) }}
              </span>
              <span v-if="!expanded" class="text-xs text-gray-400 shrink-0">
                {{ event.eventData.actions?.length ?? 0 }} action(s) · {{ event.eventData.effects?.length ?? 0 }} effect(s)
              </span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-lime-100 dark:hover:bg-lime-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-show="expanded" class="space-y-3">
            <div v-if="event.eventData.stageId" class="text-xs text-gray-600 dark:text-gray-400">
              Stage: <span class="text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</span>
            </div>

            <div
              v-if="(event.eventData.actions?.length ?? 0) > 0 || (event.eventData.effects?.length ?? 0) > 0"
              ref="executionPlanContainerRef"
              class="relative"
            >
              <div class="grid grid-cols-2 gap-x-10">
                <!-- Left column: Actions -->
                <div class="flex flex-col gap-2">
                  <div
                    v-for="(action, idx) in (event.eventData.actions as string[])"
                    :key="action"
                    :ref="(el) => setActionBadgeRef(action, el as HTMLElement | null)"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border w-full"
                    :class="getExecutionPlanActionClasses(idx)"
                  >
                    <Zap class="w-3 h-3 shrink-0" />
                    <span class="truncate">{{ action }}</span>
                  </div>
                </div>

                <!-- Right column: Effects in order -->
                <div class="flex flex-col gap-2">
                  <template v-for="displayedEffect in executionPlanDisplayedEffects" :key="displayedEffect.displayIdx">
                    <!-- Shared generate_response box -->
                    <div
                      v-if="displayedEffect.kind === 'shared'"
                      :ref="(el) => setEffectBadgeRef(displayedEffect.displayIdx, el as HTMLElement | null)"
                      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border w-full"
                      :class="getEffectTypeClasses('generate_response')"
                    >
                      <span class="truncate">Generate Response</span>
                    </div>
                    <!-- Normal effect box -->
                    <div
                      v-else
                      :ref="(el) => setEffectBadgeRef(displayedEffect.displayIdx, el as HTMLElement | null)"
                      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border w-full"
                      :class="getEffectTypeClasses(displayedEffect.effectEntry?.effect?.type)"
                    >
                      <span class="truncate">{{ formatEffectType(displayedEffect.effectEntry?.effect?.type) }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- SVG arrow overlay -->
              <svg
                class="absolute top-0 left-0 w-full pointer-events-none overflow-visible"
                style="height: 0px"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    v-for="(color, idx) in EXECUTION_PLAN_COLORS"
                    :key="idx"
                    :id="`ep-ah-${event.id}-${idx}`"
                    markerWidth="7"
                    markerHeight="7"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                  >
                    <path d="M0,0 L7,3.5 L0,7 z" :fill="color.stroke" fill-opacity="0.65" />
                  </marker>
                </defs>
                <path
                  v-for="(arrow, idx) in executionPlanArrows"
                  :key="idx"
                  :d="arrow.path"
                  fill="none"
                  :stroke="arrow.color"
                  stroke-width="1.5"
                  stroke-opacity="0.65"
                  :marker-end="`url(#ep-ah-${event.id}-${arrow.colorIdx})`"
                />
              </svg>
            </div>

            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Event -->
    <div v-else-if="isActionEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Zap class="w-5 h-5 mt-0.5 text-purple-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-purple-900 dark:text-purple-100 shrink-0 text-left">Action</button>
              <span v-if="!expanded" class="text-xs font-medium text-purple-700 dark:text-purple-300 min-w-0 truncate">{{ event.eventData.actionName }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="event.eventData.result != null"
                @click="onOpenRawResponse(JSON.stringify(event.eventData.result, null, 2))"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View result">
                <Layers class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Action Name:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.actionName }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.effects && event.eventData.effects.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Effects ({{ event.eventData.effects.length }}):</span>
              <div class="mt-1 space-y-2">
                <div v-for="(effect, idx) in event.eventData.effects" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-2.5 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-sm font-semibold text-purple-900 mb-2 dark:text-purple-100">
                    {{ effect.type || 'Effect' }} {{ (idx as number) + 1 }}
                  </div>
                  <div class="space-y-1">
                    <div v-for="(value, key) in effect" :key="key"
                      class="md:flex items-start gap-2 text-xs">
                      <span class="text-gray-600 font-medium min-w-[100px] shrink-0 dark:text-gray-400">{{ key }}: </span>
                      <span class="text-gray-900 break-words font-mono dark:text-gray-200">{{
                        typeof value === 'object' ? JSON.stringify(value) : String(value)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Command Event -->
    <div v-else-if="isCommandEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Terminal class="w-5 h-5 mt-0.5 text-indigo-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-indigo-900 dark:text-indigo-100 shrink-0 text-left">Command</button>
              <span v-if="!expanded" class="text-xs font-medium text-indigo-700 dark:text-indigo-300 font-mono min-w-0 truncate">{{ event.eventData.command }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Command:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.command }}</div>
            </div>
            <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Parameters ({{ Object.keys(event.eventData.parameters).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tool Call Event -->
    <div v-else-if="isToolCallEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Wrench class="w-5 h-5 mt-0.5 text-pink-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-pink-900 dark:text-pink-100 shrink-0 text-left">Tool Call</button>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                :class="event.eventData.toolType === 'webhook'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                  : event.eventData.toolType === 'script'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'"
              >
                <Globe v-if="event.eventData.toolType === 'webhook'" class="w-3 h-3" />
                <Code v-else-if="event.eventData.toolType === 'script'" class="w-3 h-3" />
                <Sparkles v-else class="w-3 h-3" />
                {{ getToolTypeLabel(event.eventData.toolType) }}
              </span>
              <span v-if="event.eventData.success" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
                <CheckCircle class="w-3 h-3" />
                Success
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shrink-0">
                <XCircle class="w-3 h-3" />
                Failed
              </span>
              <span v-if="!expanded" class="text-xs font-medium text-pink-700 dark:text-pink-300 min-w-0 truncate">{{ event.eventData.toolName }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
              <span v-if="event.eventData.metadata?.durationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-pink-50 border border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 shrink-0"><span class="text-pink-600 dark:text-pink-400">{{ formatMs(event.eventData.metadata.durationMs) }}</span></span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="event.eventData.result != null"
                @click="onOpenRawResponse(JSON.stringify(event.eventData.result, null, 2))"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View result">
                <Layers class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool Name:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.toolName }}</div>
            </div>
            <div v-if="event.eventData.toolId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Tool ID:</span>
              <div class="text-sm font-mono text-gray-900 dark:text-gray-200">{{ event.eventData.toolId }}</div>
            </div>
            <div v-if="event.eventData.toolType">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Type:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ getToolTypeLabel(event.eventData.toolType) }}</div>
            </div>
            <div v-if="event.eventData.parameters && Object.keys(event.eventData.parameters).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Parameters ({{ Object.keys(event.eventData.parameters).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.parameters, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.success && event.eventData.result != null && Array.isArray(event.eventData.result) && event.eventData.result.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Result ({{ event.eventData.result.length }} item{{ event.eventData.result.length !== 1 ? 's' : '' }}):</span>
              <div class="mt-2 space-y-3">
                <div v-for="(content, idx) in event.eventData.result" :key="idx"
                  class="bg-white bg-opacity-60 rounded p-3 dark:bg-gray-900 dark:bg-opacity-60">
                  <div class="text-xs font-medium text-gray-500 mb-2 uppercase dark:text-gray-400">{{ content.contentType }}</div>
                  <ContentViewer :content="content" />
                </div>
              </div>
            </div>
            <div v-if="!event.eventData.success && event.eventData.error">
              <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-800">
                <span class="text-xs font-medium text-red-700 dark:text-red-300">Error:</span>
                <div class="text-sm text-red-900 mt-1 dark:text-red-200">{{ event.eventData.error }}</div>
              </div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Start Event -->
    <div v-else-if="isConversationStartEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Play class="w-5 h-5 mt-0.5 text-green-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2" :class="{ 'mb-2': expanded }">
            <div class="flex items-center gap-2 min-w-0">
              <button @click="toggle()" class="font-semibold text-green-900 dark:text-green-100 shrink-0 text-left">Conversation Started</button>
              <template v-if="!expanded">
                <span class="text-xs text-gray-400 shrink-0">stage:</span>
                <span class="text-xs font-medium text-green-700 dark:text-green-300 min-w-0 truncate">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</span>
              </template>
              <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                v-if="hasSystemPrompt(event.eventData.metadata)"
                @click="onOpenPrompt(event.eventData.metadata!.systemPrompt as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View system prompt">
                <FileText class="w-4 h-4" />
              </button>
              <button
                v-if="hasFillerPrompt(event.eventData.metadata)"
                @click="onOpenFillerPrompt(event.eventData.metadata!.fillerPrompt as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View filler prompt">
                <Wand2 class="w-4 h-4" />
              </button>
              <button
                v-if="hasRawResponse(event.eventData.metadata)"
                @click="onOpenRawResponse(event.eventData.metadata!.rawResponse as string)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View raw response">
                <ScrollText class="w-4 h-4" />
              </button>
              <button
                v-if="hasCurrentVariables(event.eventData.metadata)"
                @click="onOpenVariables(event.eventData.metadata!.currentVariables as Record<string, any>)"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="View stage variables">
                <Braces class="w-4 h-4" />
              </button>
              <button
                v-if="showBugReport"
                @click="onBugReport"
                class="btn-icon p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="Report bug">
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Initial Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.initialVariables && Object.keys(event.eventData.initialVariables).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Initial Variables ({{ Object.keys(event.eventData.initialVariables).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.initialVariables, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Resume Event -->
    <div v-else-if="isConversationResumeEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <RotateCcw class="w-5 h-5 mt-0.5 text-cyan-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-cyan-900 dark:text-cyan-100 shrink-0 text-left">Conversation Resumed</button>
            <template v-if="!expanded">
              <span class="text-xs text-gray-400 shrink-0">{{ event.eventData.previousStatus }} → stage:</span>
              <span class="text-xs font-medium text-cyan-700 dark:text-cyan-300 min-w-0 truncate">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</span>
            </template>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Previous Status:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.previousStatus }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation End Event -->
    <div v-else-if="isConversationEndEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <CheckCircle class="w-5 h-5 mt-0.5 text-gray-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-gray-900 dark:text-white shrink-0 text-left">Conversation Ended</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div v-if="event.eventData.reason">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Aborted Event -->
    <div v-else-if="isConversationAbortedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <XCircle class="w-5 h-5 mt-0.5 text-orange-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-orange-900 dark:text-orange-100 shrink-0 text-left">Conversation Aborted</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Failed Event -->
    <div v-else-if="isConversationFailedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <AlertCircle class="w-5 h-5 mt-0.5 text-red-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-red-900 dark:text-red-100 shrink-0 text-left">Conversation Failed</button>
            <span v-if="!expanded" class="text-xs text-gray-500 truncate">{{ getEventSummary(event) }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Error:</span>
              <div class="text-sm text-red-900 font-mono bg-red-100 bg-opacity-50 rounded p-2 mt-1 dark:bg-red-900/40 dark:text-red-100">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.stageId">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Stage:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.stageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.stageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jump to Stage Event -->
    <div v-else-if="isJumpToStageEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Layers class="w-5 h-5 mt-0.5 text-teal-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-teal-900 dark:text-teal-100 shrink-0 text-left">Stage Transition</button>
            <template v-if="!expanded">
              <span class="text-xs font-medium text-teal-700 dark:text-teal-300 shrink-0 truncate">{{ resolveName(event.eventData.fromStageId, entityNames?.stages) }}</span>
              <span class="text-xs text-gray-400 shrink-0">→</span>
              <span class="text-xs font-medium text-teal-700 dark:text-teal-300 min-w-0 truncate">{{ resolveName(event.eventData.toStageId, entityNames?.stages) }}</span>
            </template>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">From:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.fromStageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.fromStageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.fromStageId }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">To:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.toStageId, entityNames?.stages) }}</div>
              <div v-if="entityNames?.stages?.[event.eventData.toStageId]" class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ event.eventData.toStageId }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Moderation Event -->
    <div v-else-if="isModerationEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <ShieldAlert
          class="w-5 h-5 mt-0.5 shrink-0"
          :class="event.eventData.blockingCategories?.length > 0
            ? 'text-red-600'
            : event.eventData.detectedCategories?.length > 0
              ? 'text-amber-500'
              : 'text-green-600'"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button
              @click="toggle()"
              class="font-semibold shrink-0 text-left"
              :class="event.eventData.blockingCategories?.length > 0
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'"
            >Moderation</button>
            <span
              class="text-xs font-medium px-1.5 py-0.5 rounded shrink-0"
              :class="event.eventData.blockingCategories?.length > 0
                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                : event.eventData.detectedCategories?.length > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'"
            >
              {{ event.eventData.blockingCategories?.length > 0 ? 'Blocked' : event.eventData.detectedCategories?.length > 0 ? 'Detected' : 'Passed' }}
            </span>
            <span v-if="!expanded && event.eventData.blockingCategories?.length > 0" class="text-xs text-gray-500 truncate">{{ event.eventData.blockingCategories.join(', ') }}</span>
            <span v-else-if="!expanded && event.eventData.detectedCategories?.length > 0" class="text-xs text-gray-500 truncate">{{ event.eventData.detectedCategories.join(', ') }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200 bg-white bg-opacity-60 rounded p-2 mt-1 dark:bg-gray-900 dark:bg-opacity-60">{{ event.eventData.input }}</div>
            </div>
            <div v-if="event.eventData.blockingCategories?.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Blocking categories:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="category in event.eventData.blockingCategories"
                  :key="category"
                  class="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                >
                  {{ category }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.detectedCategories?.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Detected categories:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="category in event.eventData.detectedCategories"
                  :key="category"
                  class="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                >
                  {{ category }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.durationMs != null">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Duration:</span>
              <span class="text-sm text-gray-900 dark:text-gray-200 ml-1">{{ event.eventData.durationMs }}ms</span>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Variables Updated Event -->
    <div v-else-if="isVariablesUpdatedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Braces class="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-emerald-900 dark:text-emerald-100 shrink-0 text-left">Variables Updated</button>
            <span v-if="!expanded" class="text-xs font-medium text-emerald-700 dark:text-emerald-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
            <span v-if="!expanded && event.eventData.variables" class="text-xs text-gray-400 shrink-0">· {{ Object.keys(event.eventData.variables).length }} var(s)</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
            </div>
            <div v-if="event.eventData.variables && Object.keys(event.eventData.variables).length > 0">
              <details class="group" open>
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Variables ({{ Object.keys(event.eventData.variables).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.variables, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Profile Updated Event -->
    <div v-else-if="isUserProfileUpdatedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <UserCircle class="w-5 h-5 mt-0.5 text-sky-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-sky-900 dark:text-sky-100 shrink-0 text-left">Profile Updated</button>
            <span v-if="!expanded" class="text-xs font-medium text-sky-700 dark:text-sky-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
            <span v-if="!expanded && event.eventData.profile" class="text-xs text-gray-400 shrink-0">· {{ Object.keys(event.eventData.profile).length }} field(s)</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
            </div>
            <div v-if="event.eventData.profile && Object.keys(event.eventData.profile).length > 0">
              <details class="group" open>
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Profile Fields ({{ Object.keys(event.eventData.profile).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.profile, null, 2) }}</pre>
                </div>
              </details>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Input Modified Event -->
    <div v-else-if="isUserInputModifiedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Pencil class="w-5 h-5 mt-0.5 text-fuchsia-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-fuchsia-900 dark:text-fuchsia-100 shrink-0 text-left">Input Modified</button>
            <span v-if="!expanded" class="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Modified Input:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200 bg-white bg-opacity-60 rounded p-2 mt-1 whitespace-pre-wrap dark:bg-gray-900 dark:bg-opacity-60">{{ event.eventData.modifiedInput }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Banned Event -->
    <div v-else-if="isUserBannedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <UserX class="w-5 h-5 mt-0.5 text-rose-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-rose-900 dark:text-rose-100 shrink-0 text-left">User Banned</button>
            <span v-if="!expanded" class="text-xs font-medium text-rose-700 dark:text-rose-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
            <span v-if="!expanded && event.eventData.reason" class="text-xs text-gray-500 shrink-0 truncate">· {{ event.eventData.reason }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
            </div>
            <div v-if="event.eventData.reason">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Reason:</span>
              <div class="text-sm text-gray-900 dark:text-gray-200">{{ event.eventData.reason }}</div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visibility Changed Event -->
    <div v-else-if="isVisibilityChangedEvent(event)">
      <div class="flex items-start gap-2">
        <button @click.stop="toggle()" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <Eye class="w-5 h-5 mt-0.5 text-slate-500 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2" :class="{ 'mb-2': expanded }">
            <button @click="toggle()" class="font-semibold text-slate-700 dark:text-slate-200 shrink-0 text-left">Visibility Changed</button>
            <span v-if="!expanded" class="text-xs font-medium text-slate-600 dark:text-slate-300 min-w-0 truncate">{{ event.eventData.sourceActionName }}</span>
            <span
              v-if="!expanded && event.eventData.visibility"
              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
              :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': event.eventData.visibility.visibility === 'always',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.eventData.visibility.visibility === 'stage',
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': event.eventData.visibility.visibility === 'never',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': event.eventData.visibility.visibility === 'conditional',
              }"
            >
              {{ event.eventData.visibility.visibility }}
            </span>
            <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
          </div>
          <div v-show="expanded" class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Source Action:</span>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ event.eventData.sourceActionName }}</div>
            </div>
            <div v-if="event.eventData.visibility">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">New Visibility:</span>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': event.eventData.visibility.visibility === 'always',
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.eventData.visibility.visibility === 'stage',
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': event.eventData.visibility.visibility === 'never',
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': event.eventData.visibility.visibility === 'conditional',
                  }"
                >
                  {{ event.eventData.visibility.visibility }}
                </span>
                <span v-if="event.eventData.visibility.visibility === 'conditional' && event.eventData.visibility.condition"
                  class="font-mono text-xs text-gray-600 dark:text-gray-400 truncate">
                  {{ event.eventData.visibility.condition }}
                </span>
              </div>
            </div>
            <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
              <details class="group">
                <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
                  Metadata ({{ Object.keys(event.eventData.metadata).length }})
                </summary>
                <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
                  <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generic Event (Fallback) -->
    <div v-else>
      <div class="flex items-center gap-2" :class="{ 'mb-3': expanded }">
        <button @click.stop="toggle()" class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ChevronDown v-if="expanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <button @click="toggle()" class="font-semibold text-gray-900 dark:text-white shrink-0 text-left">
            {{ formatEventType(event.eventType) }}
          </button>
          <span v-if="!expanded" class="text-xs text-gray-500 font-mono truncate">{{ event.id }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
        </div>
      </div>
      <div v-if="expanded && Object.keys(event.eventData).length > 0" class="mt-3">
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none dark:text-gray-300 dark:hover:text-gray-100">
            Event Data
            <span class="text-xs text-gray-500 ml-1">(click to expand)</span>
          </summary>
          <div class="mt-2 bg-white bg-opacity-60 rounded p-3 font-mono text-xs overflow-x-auto">
            <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(event.eventData, null, 2) }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details summary::marker {
  display: none;
}

details[open] summary {
  margin-bottom: 0.5rem;
}

@keyframes highlight-infinite {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.08);
    outline: 2px solid rgba(59, 130, 246, 0.15);
    outline-offset: 4px;
  }
}

@keyframes highlight-finish {
  0%, 60% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
}

.highlight-pulse {
  animation: highlight-infinite 1.5s ease-in-out infinite;
}

.highlight-finish {
  animation: highlight-finish 5s ease-out forwards;
}
</style>
