<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { EditorView, placeholder as placeholderExt, tooltips, MatchDecorator, ViewPlugin, Decoration, type DecorationSet } from '@codemirror/view'
import type { ViewUpdate } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { autocompletion } from '@codemirror/autocomplete'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { liquid } from '@codemirror/lang-liquid'
import Handlebars from 'handlebars'
import { ChevronDown, Braces, UserRound, Clock, GitBranch, Eye, Repeat2, ListChecks, Highlighter, HelpCircle, FolderOpen } from 'lucide-vue-next'
import { 
  createHandlebarsPromptCompletionSource,
  type CompletionContextData 
} from '@/components/prompt/handlebarsPromptCompletions'
import { useThemeStore } from '@/stores/theme'
import { useEditorSettingsStore } from '@/stores/editorSettings'
import type { FieldDescriptor, StageActionParameter } from '@/api/generated/data-contracts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
    minHeight?: string
    ariaLabel?: string
    monospace?: boolean
    stageVariables?: FieldDescriptor[]
    actionParameters?: Record<string, StageActionParameter[]>
    userProfileVariables?: FieldDescriptor[]
    showToolbar?: boolean
    projectConstants?: Record<string, any>
  }>(),
  {
    disabled: false,
    placeholder: '',
    minHeight: '20rem',
    ariaLabel: 'Prompt editor',
    monospace: true,
    stageVariables: () => [],
    actionParameters: () => ({}),
    userProfileVariables: () => [],
    showToolbar: false,
    projectConstants: () => ({}),
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const editorSettingsStore = useEditorSettingsStore()

// Toolbar state
const toolbarRef = ref<HTMLDivElement | null>(null)
const openDropdown = ref<string | null>(null)

interface ToolbarVariable {
  label: string
  path: string
  isArray: boolean
  detail?: string
}

function flattenVariables(descriptors: FieldDescriptor[], prefix: string): ToolbarVariable[] {
  const result: ToolbarVariable[] = []
  for (const d of descriptors) {
    const path = `${prefix}.${d.name}`
    result.push({ label: d.name, path, isArray: d.isArray, detail: d.type })
    if ((d.type === 'object' || d.type === 'object[]') && d.objectSchema) {
      result.push(...flattenVariables(d.objectSchema, path))
    }
  }
  return result
}

const contextVariables: ToolbarVariable[] = [
  { label: 'conversationId', path: 'conversationId', isArray: false, detail: 'string' },
  { label: 'projectId', path: 'projectId', isArray: false, detail: 'string' },
  { label: 'stageId', path: 'stageId', isArray: false, detail: 'string' },
  { label: 'userProfile', path: 'userProfile', isArray: false, detail: 'object' },
  { label: 'userInput', path: 'userInput', isArray: false, detail: 'string' },
  { label: 'userInputSource', path: 'userInputSource', isArray: false, detail: 'string' },
  { label: 'originalUserInput', path: 'originalUserInput', isArray: false, detail: 'string' },
  { label: 'history', path: 'history', isArray: true, detail: 'array' },
  { label: 'vars', path: 'vars', isArray: false, detail: 'object' },
  { label: 'actions', path: 'actions', isArray: false, detail: 'object' },
  { label: 'results', path: 'results', isArray: false, detail: 'object' },
  { label: 'stage', path: 'stage', isArray: false, detail: 'object' },
  { label: 'time', path: 'time', isArray: false, detail: 'object' },
  { label: 'time.calendar', path: 'time.calendar', isArray: true, detail: 'array' },
  { label: 'project', path: 'project', isArray: false, detail: 'object' },
]

const defaultUserProfileFields = [
  { key: 'name', detail: 'string — display name' },
  { key: 'email', detail: 'string — email address' },
  { key: 'phoneNumber', detail: 'string — phone number' },
  { key: 'language', detail: 'string — preferred language' },
  { key: 'timezone', detail: 'string — user timezone' },
  { key: 'metadata', detail: 'object — custom metadata' },
]

const userProfileFields = computed(() => {
  if (props.userProfileVariables && props.userProfileVariables.length > 0) {
    return flattenVariables(props.userProfileVariables, 'userProfile').map(v => ({
      key: v.path.replace(/^userProfile\./, ''),
      detail: `${v.detail}${v.isArray ? ' (array)' : ''}`,
      fullPath: v.path,
    }))
  }
  return defaultUserProfileFields.map(f => ({ ...f, fullPath: `userProfile.${f.key}` }))
})

const timeFields = [
  { key: 'anchor', detail: 'LLM grounding sentence' },
  { key: 'iso', detail: 'Full ISO 8601 timestamp' },
  { key: 'timestamp', detail: 'Unix epoch (ms)' },
  { key: 'date', detail: 'YYYY-MM-DD' },
  { key: 'time', detail: 'HH:MM:SS (24-hour)' },
  { key: 'dateTime', detail: 'YYYY-MM-DD HH:MM:SS' },
  { key: 'year', detail: 'Four-digit year' },
  { key: 'month', detail: 'Zero-padded month (01–12)' },
  { key: 'day', detail: 'Zero-padded day (01–31)' },
  { key: 'hour', detail: 'Zero-padded hour (00–23)' },
  { key: 'minute', detail: 'Zero-padded minute (00–59)' },
  { key: 'second', detail: 'Zero-padded second (00–59)' },
  { key: 'monthName', detail: 'Full month name — e.g. "February"' },
  { key: 'monthNameShort', detail: 'Abbreviated month — e.g. "Feb"' },
  { key: 'dayOfWeek', detail: 'Full weekday name — e.g. "Friday"' },
  { key: 'dayOfWeekShort', detail: 'Abbreviated weekday — e.g. "Fri"' },
  { key: 'timezone', detail: 'IANA identifier — e.g. "Europe/Warsaw"' },
  { key: 'offset', detail: 'UTC offset — e.g. "+01:00"' },
  { key: 'nextMonday', detail: 'Date of next or current Monday' },
  { key: 'nextTuesday', detail: 'Date of next or current Tuesday' },
  { key: 'nextWednesday', detail: 'Date of next or current Wednesday' },
  { key: 'nextThursday', detail: 'Date of next or current Thursday' },
  { key: 'nextFriday', detail: 'Date of next or current Friday' },
  { key: 'nextSaturday', detail: 'Date of next or current Saturday' },
  { key: 'nextSunday', detail: 'Date of next or current Sunday' },
  { key: 'calendar', detail: 'Array of next 14 days' },
]

const projectFields = [
  { key: 'timezone', detail: 'IANA timezone configured on the project — string | null' },
  { key: 'languageCode', detail: 'ISO language code — e.g. "en-US" | null' },
  { key: 'language', detail: 'Human-readable language name — e.g. "American English" | null' },
]

const flattenedStageVariables = computed<ToolbarVariable[]>(() =>
  flattenVariables(props.stageVariables, 'vars')
)

const allToolbarVariables = computed<ToolbarVariable[]>(() => [
  ...contextVariables,
  ...flattenedStageVariables.value,
])

const arrayToolbarVariables = computed<ToolbarVariable[]>(() =>
  allToolbarVariables.value.filter(v => v.isArray)
)

const arrayStageVariables = computed<ToolbarVariable[]>(() =>
  flattenedStageVariables.value.filter(v => v.isArray)
)

const arrayContextVariables = computed<ToolbarVariable[]>(() =>
  contextVariables.filter(v => v.isArray)
)

function toggleDropdown(name: string) {
  openDropdown.value = openDropdown.value === name ? null : name
}

function insertAtCursor(text: string, cursorOffset?: number) {
  if (!view) return
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + (cursorOffset ?? text.length) },
  })
  view.focus()
}

function insertVariable(path: string) {
  insertAtCursor(`{{${path}}}`)
  openDropdown.value = null
}

function insertBlock(helper: string, varPath: string) {
  if (!view) {
    openDropdown.value = null
    return
  }
  const { from, to } = view.state.selection.main
  const selected = from !== to ? view.state.doc.sliceString(from, to) : ''
  const opening = `{{#${helper} ${varPath}}}\n`
  const closing = `\n{{/${helper}}}`
  const body = selected || ''
  const full = opening + body + closing
  const cursorPos = selected ? full.length : opening.length
  view.dispatch({
    changes: { from, to, insert: full },
    selection: { anchor: from + cursorPos },
  })
  view.focus()
  openDropdown.value = null
}

let handleToolbarClickOutside: (e: MouseEvent) => void

const editorRoot = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

const editableCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()
const autocompletionCompartment = new Compartment()
const blockBgCompartment = new Compartment()

interface HandlebarsError {
  message?: string
  lineNumber?: number
  column?: number
  endLineNumber?: number
  endColumn?: number
}

function buildHandlebarsLintExtension() {
  return linter(
    (view) => {
      const content = view.state.doc.toString()
      const diagnostics: Diagnostic[] = []
      try {
        Handlebars.parse(content)
      } catch (e: unknown) {
        const err = e as HandlebarsError
        const message = err.message ?? 'Handlebars syntax error'

        let from = 0
        let to = Math.max(content.length, 1)

        if (err.lineNumber != null) {
          const lineCount = view.state.doc.lines
          const lineNum = Math.min(Math.max(1, err.lineNumber), lineCount)
          const line = view.state.doc.line(lineNum)
          const col = err.column ?? 0
          from = Math.min(line.from + col, line.to)

          if (err.endLineNumber != null && err.endColumn != null) {
            const endLineNum = Math.min(Math.max(1, err.endLineNumber), lineCount)
            const endLine = view.state.doc.line(endLineNum)
            to = Math.min(endLine.from + err.endColumn, endLine.to)
          } else {
            to = line.to
          }

          if (to <= from) to = Math.min(from + 1, content.length)
        }

        diagnostics.push({ from, to, severity: 'error', message })
      }
      return diagnostics
    },
    { delay: 500 }
  )
}

function buildHandlebarsBlockBackgroundExtension() {
  function findLineDepths(doc: EditorView['state']['doc']): Map<number, number> {
    const text = doc.toString()
    const tokenRe = /\{\{(#|\/)\w+[^}]*\}\}/g
    const lineTokens = new Map<number, { opens: number; closes: number }>()
    let match: RegExpExecArray | null
    while ((match = tokenRe.exec(text)) !== null) {
      const type = match[1]
      if (!type) continue
      const lineFrom = doc.lineAt(match.index).from
      if (!lineTokens.has(lineFrom)) lineTokens.set(lineFrom, { opens: 0, closes: 0 })
      const entry = lineTokens.get(lineFrom)!
      if (type === '#') entry.opens++
      else entry.closes++
    }

    const result = new Map<number, number>()
    let depth = 0
    for (let n = 1; n <= doc.lines; n++) {
      const line = doc.line(n)
      const entry = lineTokens.get(line.from)
      if (entry) {
        depth += entry.opens
        if (depth > 0) result.set(line.from, depth)
        depth = Math.max(0, depth - entry.closes)
      } else {
        if (depth > 0) result.set(line.from, depth)
      }
    }
    return result
  }

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = this.build(view)
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.build(update.view)
        }
      }
      build(view: EditorView): DecorationSet {
        const depths = findLineDepths(view.state.doc)
        const deco = [...depths.entries()]
          .sort(([a], [b]) => a - b)
          .map(([from, depth]) => {
            const level = Math.min(depth, 3)
            return Decoration.line({ class: `cm-hbs-block-bg-${level}` }).range(from)
          })
        return Decoration.set(deco)
      }
    },
    { decorations: (v) => v.decorations }
  )
}

function buildHandlebarsHighlightExtension() {
  // Block control flow: {{#if}}, {{#each}}, {{/if}}, {{/each}}, {{else}}, {{else if ...}}
  const blockMatcher = new MatchDecorator({
    regexp: /\{\{(?:#[^}]*|\/[^}]*|else(?:\s[^}]*)?)\}\}/g,
    decoration: Decoration.mark({ class: 'cm-hbs-block' }),
  })

  // Template variables: {{variable}}, {{variable.path}} — excludes block/closing/comment/partial tags
  const varMatcher = new MatchDecorator({
    regexp: /\{\{(?![#/!>~])([^}]+)\}\}/g,
    decoration: Decoration.mark({ class: 'cm-hbs-variable' }),
  })

  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet
        constructor(view: EditorView) {
          this.decorations = blockMatcher.createDeco(view)
        }
        update(update: ViewUpdate) {
          this.decorations = blockMatcher.updateDeco(update, this.decorations)
        }
      },
      { decorations: (v) => v.decorations }
    ),
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet
        constructor(view: EditorView) {
          this.decorations = varMatcher.createDeco(view)
        }
        update(update: ViewUpdate) {
          this.decorations = varMatcher.updateDeco(update, this.decorations)
        }
      },
      { decorations: (v) => v.decorations }
    ),
  ]
}

// Computed completion context based on props
const completionContext = computed<CompletionContextData>(() => ({
  stageVariables: props.stageVariables,
  actionParameters: props.actionParameters,
  userProfileVariables: props.userProfileVariables,
  projectConstants: props.projectConstants,
}))

function buildTheme() {
  const monoFont =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  
  const dark = isDark.value

  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: dark ? '#111827' : '#ffffff', // gray-900 : white
        color: dark ? '#e5e7eb' : '#1f2937', // gray-200 : gray-800
      },
      '.cm-scroller': {
        fontFamily: props.monospace ? monoFont : 'inherit',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      },
      '.cm-content': {
        padding: '0.625rem 0.75rem',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-placeholder': {
        color: dark ? '#9ca3af' : '#9ca3af',
      },
      '.cm-cursor': {
        borderLeftColor: dark ? '#e5e7eb' : '#000000',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent !important',
      },
      '.cm-selectionBackground': {
        backgroundColor: dark ? '#2563eb' : '#bfdbfe', // blue-600 : blue-200
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: dark ? '#2563eb' : '#bfdbfe',
      },
    },
    { dark }
  )
}

function getDocText() {
  return view ? view.state.doc.toString() : ''
}

function setDocText(next: string) {
  if (!view) return

  const current = getDocText()
  if (next === current) return

  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: next },
  })
}

function reconfigureEditable() {
  if (!view) return

  view.dispatch({
    effects: editableCompartment.reconfigure([
      EditorView.editable.of(!props.disabled),
      EditorState.readOnly.of(props.disabled),
    ]),
  })
}

function reconfigurePlaceholder() {
  if (!view) return

  const ext = props.placeholder ? placeholderExt(props.placeholder) : []
  view.dispatch({
    effects: placeholderCompartment.reconfigure(ext),
  })
}

function reconfigureTheme() {
  if (!view) return

  view.dispatch({
    effects: themeCompartment.reconfigure(buildTheme()),
  })
}

function reconfigureAutocompletion() {
  if (!view) return

  const completionSource = createHandlebarsPromptCompletionSource(completionContext.value)
  view.dispatch({
    effects: autocompletionCompartment.reconfigure(
      autocompletion({ override: [completionSource] })
    ),
  })
}

function toggleBlockHighlight() {
  editorSettingsStore.toggleBlockHighlight()
}

onMounted(() => {
  if (!editorRoot.value) return

  const completionSource = createHandlebarsPromptCompletionSource(completionContext.value)

  const state = EditorState.create({
    doc: props.modelValue ?? '',
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      liquid(),
      tooltips({ parent: document.body }),
      autocompletionCompartment.of(
        autocompletion({ override: [completionSource] })
      ),
      EditorView.domEventHandlers({
        blur: () => {
          emit('blur')
        },
      }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        emit('update:modelValue', update.state.doc.toString())
      }),
      editableCompartment.of([
        EditorView.editable.of(!props.disabled),
        EditorState.readOnly.of(props.disabled),
      ]),
      placeholderCompartment.of(props.placeholder ? placeholderExt(props.placeholder) : []),
      themeCompartment.of(buildTheme()),
      lintGutter(),
      buildHandlebarsLintExtension(),
      blockBgCompartment.of(editorSettingsStore.showBlockHighlight ? buildHandlebarsBlockBackgroundExtension() : []),
      ...buildHandlebarsHighlightExtension(),
    ],
  })

  view = new EditorView({
    state,
    parent: editorRoot.value,
  })

  // Accessibility
  view.contentDOM.setAttribute('aria-label', props.ariaLabel)

  handleToolbarClickOutside = (e: MouseEvent) => {
    if (toolbarRef.value && !toolbarRef.value.contains(e.target as Node)) {
      openDropdown.value = null
    }
  }
  document.addEventListener('click', handleToolbarClickOutside)
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
  document.removeEventListener('click', handleToolbarClickOutside)
})

watch(
  () => editorSettingsStore.showBlockHighlight,
  (enabled) => {
    if (!view) return
    view.dispatch({
      effects: blockBgCompartment.reconfigure(
        enabled ? buildHandlebarsBlockBackgroundExtension() : []
      ),
    })
  }
)

watch(
  () => props.modelValue,
  (next) => {
    if (next == null) return
    setDocText(next)
  }
)

watch(
  () => props.disabled,
  () => {
    reconfigureEditable()
  }
)

watch(
  () => props.placeholder,
  () => {
    reconfigurePlaceholder()
  }
)

watch(
  () => props.monospace,
  () => {
    reconfigureTheme()
  }
)

watch(
  isDark,
  () => {
    reconfigureTheme()
  }
)

watch(
  completionContext,
  () => {
    reconfigureAutocompletion()
  },
  { deep: true }
)
</script>

<template>
  <div
    class="w-full border border-gray-300 rounded-md text-sm focus-within:outline-none focus-within:border-primary-500 bg-white flex flex-col relative dark:bg-gray-900 dark:border-gray-700 max-h-[85vh]"
    :class="{ 'opacity-60 pointer-events-none bg-gray-100 dark:bg-gray-800': disabled }"
    :style="{ minHeight }"
  >
    <!-- Prompt Toolbar -->
    <div
      v-if="showToolbar"
      ref="toolbarRef"
      class="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex-shrink-0 flex-wrap"
    >
      <div class="text-xs p-2">Insert:</div>
      <!-- Insert Variable -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert variable"
          @click.stop="toggleDropdown('var')"
        >
          <Braces :size="13" />
          <span>Variable</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'var'" class="toolbar-dropdown">
          <template v-if="flattenedStageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables</div>
            <button
              v-for="v in flattenedStageVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertVariable(v.path)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
          <template v-if="Object.keys(projectConstants).length > 0">
            <div class="toolbar-dropdown-section">Constants</div>
            <button
              v-for="(_, key) in projectConstants"
              :key="key"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertVariable(`consts.${String(key)}`)"
            >
              <span class="font-mono text-orange-600 dark:text-orange-400 truncate">consts.{{ key }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">constant</span>
            </button>
          </template>
          <div class="toolbar-dropdown-section">Context</div>
          <button
            v-for="v in contextVariables"
            :key="v.path"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertVariable(v.path)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ v.path }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
          </button>
        </div>
      </div>

      <!-- Insert User Profile value -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert user profile field"
          @click.stop="toggleDropdown('userProfile')"
        >
          <UserRound :size="13" />
          <span>Profile</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'userProfile'" class="toolbar-dropdown">
          <button
            v-for="f in userProfileFields"
            :key="f.key"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertVariable(f.fullPath)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ f.fullPath }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ f.detail }}</span>
          </button>
        </div>
      </div>

      <!-- Insert time field -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert time field"
          @click.stop="toggleDropdown('time')"
        >
          <Clock :size="13" />
          <span>Time</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'time'" class="toolbar-dropdown">
          <button
            v-for="f in timeFields"
            :key="f.key"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertVariable(`time.${f.key}`)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400">time.{{ f.key }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ f.detail }}</span>
          </button>
        </div>
      </div>

      <!-- Insert project field -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert project field"
          @click.stop="toggleDropdown('project')"
        >
          <FolderOpen :size="13" />
          <span>Project</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'project'" class="toolbar-dropdown">
          <button
            v-for="f in projectFields"
            :key="f.key"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertVariable(`project.${f.key}`)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400">project.{{ f.key }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ f.detail }}</span>
          </button>
        </div>
      </div>

      <div class="h-4 w-px bg-gray-200 dark:bg-gray-600 mx-1 flex-shrink-0" />

      <div class="text-xs p-2">Add Block:</div>

      <!-- Insert #if block -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert #if block"
          @click.stop="toggleDropdown('if')"
        >
          <GitBranch :size="13" />
          <span>#if</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'if'" class="toolbar-dropdown">
          <div v-if="allToolbarVariables.length === 0" class="toolbar-dropdown-empty">No variables available</div>
          <template v-if="flattenedStageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables</div>
            <button
              v-for="v in flattenedStageVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('if', v.path)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
          <div class="toolbar-dropdown-section">Context</div>
          <button
            v-for="v in contextVariables"
            :key="v.path"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertBlock('if', v.path)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ v.path }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
          </button>
        </div>
      </div>

      <!-- Insert #exists block -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert #exists block"
          @click.stop="toggleDropdown('exists')"
        >
          <Eye :size="13" />
          <span>#exists</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'exists'" class="toolbar-dropdown">
          <div v-if="allToolbarVariables.length === 0" class="toolbar-dropdown-empty">No variables available</div>
          <template v-if="flattenedStageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables</div>
            <button
              v-for="v in flattenedStageVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('exists', v.path)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
          <div class="toolbar-dropdown-section">Context</div>
          <button
            v-for="v in contextVariables"
            :key="v.path"
            type="button"
            class="toolbar-dropdown-item"
            @click.stop="insertBlock('exists', v.path)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ v.path }}</span>
            <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
          </button>
        </div>
      </div>

      <!-- Insert #each block -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert #each loop block"
          @click.stop="toggleDropdown('each')"
        >
          <Repeat2 :size="13" />
          <span>#each</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'each'" class="toolbar-dropdown">
          <div v-if="arrayToolbarVariables.length === 0" class="toolbar-dropdown-empty">No array variables</div>
          <template v-if="arrayStageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables</div>
            <button
              v-for="v in arrayStageVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('each', v.path)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
          <template v-if="arrayContextVariables.length > 0">
            <div class="toolbar-dropdown-section">Context</div>
            <button
              v-for="v in arrayContextVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('each', v.path)"
            >
              <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Insert #hasItems block (checks if array is non-empty) -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert #hasItems block"
          @click.stop="toggleDropdown('hasItems')"
        >
          <ListChecks :size="13" />
          <span>#hasItems</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'hasItems'" class="toolbar-dropdown">
          <div v-if="arrayToolbarVariables.length === 0" class="toolbar-dropdown-empty">No array variables</div>
          <template v-if="arrayStageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables</div>
            <button
              v-for="v in arrayStageVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('hasItems', v.path)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
          <template v-if="arrayContextVariables.length > 0">
            <div class="toolbar-dropdown-section">Context</div>
            <button
              v-for="v in arrayContextVariables"
              :key="v.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertBlock('hasItems', v.path)"
            >
              <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ v.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.detail }}</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Block highlight toggle -->
      <button
        type="button"
        class="toolbar-btn ml-auto"
        :class="{ 'toolbar-btn-active': editorSettingsStore.showBlockHighlight }"
        title="Toggle block background highlighting"
        @click.stop="toggleBlockHighlight"
      >
        <Highlighter :size="13" />
      </button>

      <!-- Templating help link -->
      <a
        href="/help/guide/templating.html"
        target="_blank"
        rel="noopener noreferrer"
        class="toolbar-btn toolbar-btn-help"
        title="Templating documentation"
        @click.stop
      >
        <HelpCircle :size="13" />
        <span>Need help?</span>
      </a>
    </div>

    <!-- CodeMirror Editor -->
    <div ref="editorRoot" class="flex-1 overflow-y-auto min-h-0" />
  </div>
</template>

<style>
/* Handlebars block background highlighting (depth levels 1–3) */
.cm-hbs-block-bg-1 {
  background-color: rgba(234, 92, 12, 0.05);
  border-left: 2px solid rgba(234, 92, 12, 0.25) !important;
  padding-left: 6px !important;
}
.dark .cm-hbs-block-bg-1 {
  background-color: rgba(251, 146, 60, 0.07);
  border-left: 2px solid rgba(251, 146, 60, 0.25) !important;
}
.cm-hbs-block-bg-2 {
  background-color: rgba(234, 92, 12, 0.11);
  border-left: 2px solid rgba(234, 92, 12, 0.45) !important;
  padding-left: 6px !important;
}
.dark .cm-hbs-block-bg-2 {
  background-color: rgba(251, 146, 60, 0.14);
  border-left: 2px solid rgba(251, 146, 60, 0.45) !important;
}
.cm-hbs-block-bg-3 {
  background-color: rgba(234, 92, 12, 0.19);
  border-left: 2px solid rgba(234, 92, 12, 0.65) !important;
  padding-left: 6px !important;
}
.dark .cm-hbs-block-bg-3 {
  background-color: rgba(251, 146, 60, 0.22);
  border-left: 2px solid rgba(251, 146, 60, 0.65) !important;
}

/* Handlebars syntax highlighting */
.cm-hbs-block {
  color: #ea580c;
}
.dark .cm-hbs-block {
  color: #fb923c;
}
.cm-hbs-variable {
  color: #0891b2;
}
.dark .cm-hbs-variable {
  color: #22d3ee;
}

</style>
