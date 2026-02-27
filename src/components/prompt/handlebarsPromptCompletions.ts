import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete'
import { snippetCompletion } from '@codemirror/autocomplete'
import type { FieldDescriptor, StageActionParameter } from '@/api/generated/data-contracts'

/**
 * Context data for generating dynamic completions
 */
export interface CompletionContextData {
  /** Stage variable descriptors */
  stageVariables?: FieldDescriptor[]
  /** Action parameters indexed by action key */
  actionParameters?: Record<string, StageActionParameter[]>
}

/**
 * Generate variable completions from stage variable descriptors
 */
function generateVariableCompletions(descriptors: FieldDescriptor[], prefix = 'vars'): Completion[] {
  const completions: Completion[] = []
  
  for (const descriptor of descriptors) {
    const fullPath = `${prefix}.${descriptor.name}`
    
    // Add completion for the variable itself
    completions.push({
      label: fullPath,
      type: 'property',
      detail: `${descriptor.type}${descriptor.isArray ? ' (array)' : ''}`,
    })
    
    // If it's an object type with nested schema, recursively add nested properties
    if ((descriptor.type === 'object' || descriptor.type === 'object[]') && descriptor.objectSchema) {
      completions.push(...generateVariableCompletions(descriptor.objectSchema, fullPath))
    }
  }
  
  return completions
}

/**
 * Generate action parameter completions
 */
function generateActionParameterCompletions(
  actionParameters: Record<string, StageActionParameter[]>
): Completion[] {
  const completions: Completion[] = []
  
  for (const [actionKey, parameters] of Object.entries(actionParameters)) {
    for (const param of parameters) {
      const fullPath = `actions.${actionKey}.parameters.${param.name}`
      completions.push({
        label: fullPath,
        type: 'property',
        detail: `${param.type}${param.required ? ' (required)' : ' (optional)'} - ${param.description}`,
      })
    }
  }
  
  return completions
}

const baseVariableCompletions: Completion[] = [
  { label: 'conversationId', type: 'variable', detail: 'ConversationContext' },
  { label: 'projectId', type: 'variable', detail: 'ConversationContext' },
  { label: 'stageId', type: 'variable', detail: 'ConversationContext' },

  { label: 'vars', type: 'variable', detail: 'Stage variables (object)' },

  { label: 'userProfile', type: 'variable', detail: 'User profile (object)' },
  { label: 'userProfile.name', type: 'property', detail: 'User display name' },
  { label: 'userProfile.email', type: 'property', detail: 'User email address' },
  { label: 'userProfile.phoneNumber', type: 'property', detail: 'User phone number' },
  { label: 'userProfile.language', type: 'property', detail: 'User preferred language' },
  { label: 'userProfile.timezone', type: 'property', detail: 'User timezone' },
  { label: 'userProfile.metadata', type: 'property', detail: 'Custom user metadata' },

  { label: 'history', type: 'variable', detail: 'Conversation message history (array)' },
  { label: 'history.length', type: 'property', detail: 'Array length' },

  { label: 'userInput', type: 'variable', detail: 'Current user input (optional)' },
  { label: 'userInputSource', type: 'variable', detail: "'text' | 'voice' (optional)" },
  { label: 'originalUserInput', type: 'variable', detail: 'Unmodified user input (optional)' },

  { label: 'actions', type: 'variable', detail: 'Detected/called actions (object)' },

  { label: 'results', type: 'variable', detail: 'Tool/webhook results (object)' },
  { label: 'results.webhooks', type: 'property', detail: 'Webhook results' },
  { label: 'results.tools', type: 'property', detail: 'Tool results' },

  { label: 'stage', type: 'variable', detail: 'Stage configuration (optional object)' },
  { label: 'stage.name', type: 'property', detail: 'Stage display name' },
  { label: 'stage.availableActions', type: 'property', detail: 'Available actions (array)' },
  { label: 'stage.useKnowledge', type: 'property', detail: 'Knowledge enabled (boolean)' },
  {
    label: 'stage.enterBehavior',
    type: 'property',
    detail: "'generate_response' | 'await_user_input'",
  },
  { label: 'stage.metadata', type: 'property', detail: 'Custom stage metadata' },

  // Time context
  { label: 'time', type: 'variable', detail: 'Current date/time context (timezone-aware)' },
  { label: 'time.anchor', type: 'property', detail: 'Pre-formatted LLM grounding sentence' },
  { label: 'time.iso', type: 'property', detail: 'Full ISO 8601 timestamp — e.g. "2026-02-27T14:30:00.000+01:00"' },
  { label: 'time.timestamp', type: 'property', detail: 'Unix epoch in milliseconds' },
  { label: 'time.date', type: 'property', detail: 'Date in YYYY-MM-DD' },
  { label: 'time.time', type: 'property', detail: 'Time in HH:MM:SS (24-hour)' },
  { label: 'time.dateTime', type: 'property', detail: 'Combined date and time — "YYYY-MM-DD HH:MM:SS"' },
  { label: 'time.year', type: 'property', detail: 'Four-digit year' },
  { label: 'time.month', type: 'property', detail: 'Zero-padded month (01–12)' },
  { label: 'time.day', type: 'property', detail: 'Zero-padded day of month (01–31)' },
  { label: 'time.hour', type: 'property', detail: 'Zero-padded hour in 24-hour format (00–23)' },
  { label: 'time.minute', type: 'property', detail: 'Zero-padded minute (00–59)' },
  { label: 'time.second', type: 'property', detail: 'Zero-padded second (00–59)' },
  { label: 'time.monthName', type: 'property', detail: 'Full month name — e.g. "February"' },
  { label: 'time.monthNameShort', type: 'property', detail: 'Abbreviated month name — e.g. "Feb"' },
  { label: 'time.dayOfWeek', type: 'property', detail: 'Full weekday name — e.g. "Friday"' },
  { label: 'time.dayOfWeekShort', type: 'property', detail: 'Abbreviated weekday name — e.g. "Fri"' },
  { label: 'time.timezone', type: 'property', detail: 'IANA timezone identifier — e.g. "Europe/Warsaw"' },
  { label: 'time.offset', type: 'property', detail: 'UTC offset string — e.g. "+01:00"' },
  { label: 'time.nextMonday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Monday' },
  { label: 'time.nextTuesday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Tuesday' },
  { label: 'time.nextWednesday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Wednesday' },
  { label: 'time.nextThursday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Thursday' },
  { label: 'time.nextFriday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Friday' },
  { label: 'time.nextSaturday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Saturday' },
  { label: 'time.nextSunday', type: 'property', detail: 'Date (YYYY-MM-DD) of next or current Sunday' },
  { label: 'time.calendar', type: 'property', detail: 'Array of the next 14 days (date, dayName, dayNameShort, month, dayOfMonth, isToday)' },
]

const inlineHelperCompletions: Completion[] = [
  snippetCompletion('get ${1:obj} "${2:path}"', {
    label: 'get',
    type: 'function',
    detail: 'Safe nested access',
  }),
  snippetCompletion('default ${1:value} "${2:fallback}"', {
    label: 'default',
    type: 'function',
    detail: 'Fallback value',
  }),
  snippetCompletion('join ${1:array} ", "', {
    label: 'join',
    type: 'function',
    detail: 'Join array values',
  }),
  snippetCompletion('contains ${1:array} "${2:value}"', {
    label: 'contains',
    type: 'function',
    detail: 'Array contains',
  }),
  snippetCompletion('eq ${1:a} ${2:b}', {
    label: 'eq',
    type: 'function',
    detail: 'Equality',
  }),
  snippetCompletion('ne ${1:a} ${2:b}', {
    label: 'ne',
    type: 'function',
    detail: 'Not equal',
  }),
  snippetCompletion('gt ${1:a} ${2:b}', {
    label: 'gt',
    type: 'function',
    detail: 'Greater than',
  }),
  snippetCompletion('gte ${1:a} ${2:b}', {
    label: 'gte',
    type: 'function',
    detail: 'Greater/equal',
  }),
  snippetCompletion('lt ${1:a} ${2:b}', {
    label: 'lt',
    type: 'function',
    detail: 'Less than',
  }),
  snippetCompletion('lte ${1:a} ${2:b}', {
    label: 'lte',
    type: 'function',
    detail: 'Less/equal',
  }),
  snippetCompletion('and ${1:a} ${2:b}', {
    label: 'and',
    type: 'function',
    detail: 'Logical AND',
  }),
  snippetCompletion('or ${1:a} ${2:b}', {
    label: 'or',
    type: 'function',
    detail: 'Logical OR',
  }),
  snippetCompletion('not ${1:value}', {
    label: 'not',
    type: 'function',
    detail: 'Logical NOT',
  }),
  snippetCompletion('json ${1:value}', {
    label: 'json',
    type: 'function',
    detail: 'To JSON',
  }),
  snippetCompletion('json ${1:value} true', {
    label: 'json (pretty)',
    type: 'function',
    detail: 'Pretty JSON',
  }),

  // Used in examples (even if not listed in the helper section)
  snippetCompletion('slice ${1:array} ${2:-3}', {
    label: 'slice',
    type: 'function',
    detail: 'Slice an array',
  }),
]

const blockHelperCompletions: Completion[] = [
  snippetCompletion('exists ${1:value}}}\n${2:...}\n{{/exists', {
    label: '#exists … /exists',
    type: 'keyword',
    detail: 'Block: value exists',
  }),
  snippetCompletion('hasItems ${1:array}}}\n${2:...}\n{{/hasItems', {
    label: '#hasItems … /hasItems',
    type: 'keyword',
    detail: 'Block: array has items',
  }),

  // Core Handlebars blocks used heavily in guide examples
  snippetCompletion('if ${1:condition}}}\n${2:...}\n{{/if', {
    label: '#if … /if',
    type: 'keyword',
    detail: 'Conditional block',
  }),
  snippetCompletion('each ${1:array}}}\n${2:...}\n{{/each', {
    label: '#each … /each',
    type: 'keyword',
    detail: 'Loop block',
  }),
]

/**
 * Create a completion source function with the provided context data
 */
export function createHandlebarsPromptCompletionSource(
  contextData?: CompletionContextData
) {
  // Build dynamic completions from context data
  const dynamicVariableCompletions: Completion[] = []
  const dynamicActionCompletions: Completion[] = []

  if (contextData?.stageVariables && contextData.stageVariables.length > 0) {
    dynamicVariableCompletions.push(...generateVariableCompletions(contextData.stageVariables))
  }

  if (contextData?.actionParameters && Object.keys(contextData.actionParameters).length > 0) {
    dynamicActionCompletions.push(...generateActionParameterCompletions(contextData.actionParameters))
  }

  const allVariableCompletions = [
    ...baseVariableCompletions,
    ...dynamicVariableCompletions,
    ...dynamicActionCompletions,
  ]

  const allCompletions: Completion[] = [
    ...allVariableCompletions,
    ...inlineHelperCompletions,
    ...blockHelperCompletions,
  ]

  const inlineOnlyCompletions: Completion[] = [
    ...allVariableCompletions,
    ...inlineHelperCompletions,
  ]

  function isLikelyInsideHandlebars(context: CompletionContext): boolean {
    const lookback = 200
    const from = Math.max(0, context.pos - lookback)
    const before = context.state.sliceDoc(from, context.pos)

    const open = before.lastIndexOf('{{')
    if (open < 0) return false

    // If we have a closing braces after that opening in the lookback window, treat as outside.
    const close = before.lastIndexOf('}}')
    return close < open
  }

  return function handlebarsPromptCompletionSource(
    context: CompletionContext
  ): CompletionResult | null {
    if (!context.explicit && !isLikelyInsideHandlebars(context)) return null

    const open = context.matchBefore(/\{\{[#/]?[\w.]*$/)
    if (!open) {
      return context.explicit ? { from: context.pos, options: inlineOnlyCompletions } : null
    }

    const isBlock = open.text.startsWith('{{#') || open.text.startsWith('{{/')
    const options = isBlock ? allCompletions : inlineOnlyCompletions

    const token = context.matchBefore(/[#/]?[\w.]*$/)
    if (!token) return null

    let from = token.from
    if (token.text.startsWith('#') || token.text.startsWith('/')) {
      from = Math.min(token.from + 1, context.pos)
    }

    return {
      from,
      options,
      validFor: /[\w.]*$/,
    }
  }
}

/**
 * Default completion source with no dynamic context
 * @deprecated Use createHandlebarsPromptCompletionSource() instead for dynamic completions
 */
export const handlebarsPromptCompletionSource = createHandlebarsPromptCompletionSource()
