import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete'
import { snippetCompletion } from '@codemirror/autocomplete'

const variableCompletions: Completion[] = [
  { label: 'conversationId', type: 'variable', detail: 'ConversationContext' },
  { label: 'projectId', type: 'variable', detail: 'ConversationContext' },
  { label: 'stageId', type: 'variable', detail: 'ConversationContext' },

  { label: 'vars', type: 'variable', detail: 'Stage variables (object)' },
  { label: 'vars.customerName', type: 'property', detail: 'Example var' },
  { label: 'vars.orderNumber', type: 'property', detail: 'Example var' },
  { label: 'vars.language', type: 'property', detail: 'Example var' },
  { label: 'vars.currentStep', type: 'property', detail: 'Example var' },

  { label: 'userProfile', type: 'variable', detail: 'User profile (object)' },
  { label: 'userProfile.name', type: 'property', detail: 'Example profile field' },
  { label: 'userProfile.email', type: 'property', detail: 'Example profile field' },
  { label: 'userProfile.roles', type: 'property', detail: 'Example profile field' },
  { label: 'userProfile.tags', type: 'property', detail: 'Example profile field' },

  { label: 'history', type: 'variable', detail: 'Conversation message history (array)' },
  { label: 'history.length', type: 'property', detail: 'Array length' },

  { label: 'userInput', type: 'variable', detail: 'Current user input (optional)' },
  { label: 'userInputSource', type: 'variable', detail: "'text' | 'voice' (optional)" },
  { label: 'originalUserInput', type: 'variable', detail: 'Unmodified user input (optional)' },

  { label: 'actions', type: 'variable', detail: 'Detected/called actions (object)' },
  { label: 'actions.transfer_call', type: 'property', detail: 'Example action' },
  {
    label: 'actions.transfer_call.parameters.department',
    type: 'property',
    detail: 'Example action parameter',
  },

  { label: 'results', type: 'variable', detail: 'Tool/webhook results (object)' },
  {
    label: 'results.webhooks.customer_data.account_balance',
    type: 'property',
    detail: 'Example webhook result',
  },
  {
    label: 'results.tools.sentiment_analysis.score',
    type: 'property',
    detail: 'Example tool result',
  },

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
  snippetCompletion('exists ${1:value}}\n${2:...}\n{{/exists}}', {
    label: '#exists … /exists',
    type: 'keyword',
    detail: 'Block: value exists',
  }),
  snippetCompletion('hasItems ${1:array}}\n${2:...}\n{{/hasItems}}', {
    label: '#hasItems … /hasItems',
    type: 'keyword',
    detail: 'Block: array has items',
  }),

  // Core Handlebars blocks used heavily in guide examples
  snippetCompletion('if ${1:condition}}\n${2:...}\n{{/if}}', {
    label: '#if … /if',
    type: 'keyword',
    detail: 'Conditional block',
  }),
  snippetCompletion('each ${1:array}}\n${2:...}\n{{/each}}', {
    label: '#each … /each',
    type: 'keyword',
    detail: 'Loop block',
  }),
]

const allCompletions: Completion[] = [
  ...variableCompletions,
  ...inlineHelperCompletions,
  ...blockHelperCompletions,
]

const inlineOnlyCompletions: Completion[] = [
  ...variableCompletions,
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

export function handlebarsPromptCompletionSource(
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
