/**
 * Bonsai scripting runtime context: global variables and built-in functions
 * available inside stage scripts. These are used by both the JavaScriptEditor
 * toolbar dropdowns and the CodeMirror autocomplete source.
 *
 * When consuming JavaScriptEditor outside the Bonsai scripting context simply
 * pass your own `globalVariables` / `functionList` props instead of using
 * these defaults.
 */

export interface GlobalVariable {
  path: string
  detail: string
}

export interface ToolbarFunction {
  label: string
  insert: string
  info: string
}

export const bonsaiDefaultGlobalVariables: GlobalVariable[] = [
  { path: 'conversationId', detail: 'string' },
  { path: 'projectId', detail: 'string' },
  { path: 'stageId', detail: 'string' },
  { path: 'stage', detail: 'object' },
  { path: 'history', detail: 'array' },
  { path: 'events', detail: 'array' },
  { path: 'actions', detail: 'object' },
  { path: 'results', detail: 'object' },
  { path: 'time', detail: 'object' },
  { path: 'originalUserInput', detail: 'string|null' },
  { path: 'userInputSource', detail: "'text'|'voice'|null" },
  { path: 'userProfile', detail: 'object' },
  { path: 'userInput', detail: 'string|null' },
  { path: 'vars', detail: 'object' },
  { path: 'stageVars', detail: 'object|null' },
  { path: 'consts', detail: 'object — project constants' },
]

export const bonsaiDefaultFunctions: ToolbarFunction[] = [
  { label: 'goToStage(stageId)', insert: 'goToStage("stageId")', info: 'Move to another stage' },
  { label: 'endConversation(reason)', insert: 'endConversation()', info: 'End conversation' },
  { label: 'abortConversation(reason)', insert: 'abortConversation()', info: 'Abort conversation' },
  { label: 'prescriptResponse(text)', insert: 'prescriptResponse("")', info: 'Inject assistant response' },
  { label: 'suppressResponse()', insert: 'suppressResponse()', info: 'Suppress output' },
  { label: 'lastMessage(role)', insert: 'lastMessage()', info: 'Last message text' },
  { label: 'messageCount(role)', insert: 'messageCount()', info: 'Message count' },
  { label: 'historyText({n,role})', insert: 'historyText()', info: 'Concatenate history' },
  { label: 'historyContains(text, role)', insert: 'historyContains("", "user")', info: 'Check history contents' },
  { label: 'stageMessages(role)', insert: 'stageMessages()', info: 'Messages for current stage' },
  { label: 'uuid()', insert: 'uuid()', info: 'Generate UUID' },
  { label: 'formatDate(iso, locale, opts)', insert: 'formatDate("", "")', info: 'Format timestamp' },
  { label: 'console.log()', insert: 'console.log()', info: 'Log to console' },
  { label: 'console.warn()', insert: 'console.warn()', info: 'Warn to console' },
  { label: 'console.error()', insert: 'console.error()', info: 'Error to console' },
]
