<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { EditorView, placeholder as placeholderExt, tooltips } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { autocompletion } from '@codemirror/autocomplete'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { liquid } from '@codemirror/lang-liquid'
import Handlebars from 'handlebars'
import { ChevronDown, Braces, UserRound, GitBranch, Eye, Repeat2, ListChecks } from 'lucide-vue-next'
import { 
  createHandlebarsPromptCompletionSource,
  type CompletionContextData 
} from '@/components/prompt/handlebarsPromptCompletions'
import { useThemeStore } from '@/stores/theme'
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
    showToolbar?: boolean
  }>(),
  {
    disabled: false,
    placeholder: '',
    minHeight: '20rem',
    ariaLabel: 'Prompt editor',
    monospace: true,
    stageVariables: () => [],
    actionParameters: () => ({}),
    showToolbar: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

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
]

const userProfileFields = [
  { key: 'name', detail: 'string — display name' },
  { key: 'email', detail: 'string — email address' },
  { key: 'phoneNumber', detail: 'string — phone number' },
  { key: 'language', detail: 'string — preferred language' },
  { key: 'timezone', detail: 'string — user timezone' },
  { key: 'metadata', detail: 'object — custom metadata' },
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

// Computed completion context based on props
const completionContext = computed<CompletionContextData>(() => ({
  stageVariables: props.stageVariables,
  actionParameters: props.actionParameters,
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
            @click.stop="insertVariable(`userProfile.${f.key}`)"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400">userProfile.{{ f.key }}</span>
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
    </div>

    <!-- CodeMirror Editor -->
    <div ref="editorRoot" class="flex-1 overflow-y-auto min-h-0" />
  </div>
</template>

<style>
/* Ensure CodeMirror autocomplete tooltips appear above modal content */
.cm-tooltip-autocomplete {
  z-index: 10000 !important;
}

.cm-tooltip {
  z-index: 10000 !important;
}

/* Toolbar */
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  line-height: 1rem;
  border-radius: 0.25rem;
  color: #4b5563;
  white-space: nowrap;
  user-select: none;
  transition: background-color 0.1s;
}
.dark .toolbar-btn {
  color: #d1d5db;
}
.toolbar-btn:hover:not(:disabled) {
  background-color: #e5e7eb;
}
.dark .toolbar-btn:hover:not(:disabled) {
  background-color: #374151;
}
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  z-index: 9999;
  min-width: 17rem;
  max-height: 14rem;
  overflow-y: auto;
}
.dark .toolbar-dropdown {
  background-color: #1f2937;
  border-color: #374151;
}

.toolbar-dropdown-section {
  padding: 0.2rem 0.625rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  position: sticky;
  top: 0;
  background-color: #ffffff;
}
.dark .toolbar-dropdown-section {
  color: #6b7280;
  background-color: #1f2937;
}

.toolbar-dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.3rem 0.625rem;
  font-size: 0.7rem;
  text-align: left;
  transition: background-color 0.1s;
}
.toolbar-dropdown-item:hover {
  background-color: #f9fafb;
}
.dark .toolbar-dropdown-item:hover {
  background-color: #374151;
}

.toolbar-dropdown-empty {
  padding: 0.5rem 0.625rem;
  font-size: 0.7rem;
  color: #9ca3af;
  font-style: italic;
}
</style>
