<template>
  <div
    :class="[
      'w-full border border-gray-300 rounded-md text-sm focus-within:outline-none focus-within:border-primary-500 bg-white flex flex-col relative dark:bg-gray-900 dark:border-gray-700',
      fluid ? 'h-full' : 'max-h-[85vh]',
      { 'opacity-60 pointer-events-none bg-gray-100 dark:bg-gray-800': disabled },
    ]"
    :style="fluid ? undefined : { minHeight }"
  >
    <!-- Toolbar -->
    <div
      v-if="showToolbar"
      ref="toolbarRef"
      class="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex-shrink-0 flex-wrap"
    >
      <div class="text-xs p-2">Insert:</div>

      <!-- Variables Dropdown -->
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
        <div v-if="openDropdown === 'var'" class="toolbar-dropdown" style="z-index: 9999">
          <template v-if="stageVariables && stageVariables.length > 0">
            <div class="toolbar-dropdown-section">Stage Variables (vars)</div>
            <button
              v-for="v in stageVariables"
              :key="v.name"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertVariable(`vars.${v.name}`)"
            >
              <span class="font-mono text-purple-600 dark:text-purple-400 truncate">vars.{{ v.name }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ v.type }}</span>
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
          <template v-if="globalVariables.length > 0">
            <div class="toolbar-dropdown-section">Globals</div>
            <button
              v-for="g in globalVariables"
              :key="g.path"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertVariable(g.path)"
            >
              <span class="font-mono text-blue-600 dark:text-blue-400 truncate">{{ g.path }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ g.detail }}</span>
            </button>
          </template>
          <div v-if="!stageVariables?.length && !globalVariables.length && !Object.keys(projectConstants).length" class="toolbar-dropdown-empty">No variables available</div>
        </div>
      </div>

      <!-- Functions Dropdown -->
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          class="toolbar-btn"
          title="Insert function"
          @click.stop="toggleDropdown('fn')"
        >
          <Code :size="13" />
          <span>Function</span>
          <ChevronDown :size="11" />
        </button>
        <div v-if="openDropdown === 'fn'" class="toolbar-dropdown" style="z-index: 9999">
          <template v-if="functionList.length > 0">
            <button
              v-for="f in functionList"
              :key="f.label"
              type="button"
              class="toolbar-dropdown-item"
              @click.stop="insertAtCursor(f.insert)"
            >
              <span class="truncate">{{ f.label }}</span>
              <span class="text-gray-400 dark:text-gray-500 ml-auto pl-3 flex-shrink-0">{{ f.info }}</span>
            </button>
          </template>
          <div v-if="!functionList.length" class="toolbar-dropdown-empty">No functions available</div>
        </div>
      </div>

      <div class="h-4 w-px bg-gray-200 dark:bg-gray-600 mx-1 flex-shrink-0" />

      <a
        class="toolbar-btn ml-auto"
        href="/help/guide/scripting.html"
        target="_blank"
        rel="noopener noreferrer"
        title="Scripting documentation"
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

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { EditorView, placeholder as placeholderExt, tooltips } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { autocompletion } from '@codemirror/autocomplete'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { javascript } from '@codemirror/lang-javascript'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { ChevronDown, Braces, Code, HelpCircle } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { createJavaScriptCompletionSource } from '@/components/javascript/javascriptScriptCompletions'
import {
  type GlobalVariable,
  type ToolbarFunction,
} from '@/components/javascript/bonsaiScriptContext'
import type { FieldDescriptor } from '@/api/generated/data-contracts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
    minHeight?: string
    ariaLabel?: string
    monospace?: boolean
    stageVariables?: FieldDescriptor[]
    globalVariables?: GlobalVariable[]
    functionList?: ToolbarFunction[]
    showToolbar?: boolean
    fluid?: boolean
    projectConstants?: Record<string, any>
  }>(),
  {
    disabled: false,
    placeholder: '',
    minHeight: '12rem',
    ariaLabel: 'JavaScript editor',
    monospace: true,
    stageVariables: () => [],
    globalVariables: () => [],
    functionList: () => [],
    showToolbar: true,
    fluid: false,
    projectConstants: () => ({}),
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
// Toolbar state
const openDropdown = ref<string | null>(null)
const toolbarRef = ref<HTMLDivElement | null>(null)
let handleToolbarClickOutside: (e: MouseEvent) => void

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
  insertAtCursor(path)
  openDropdown.value = null
}

// Consolidated completion context — single source watched for reconfiguration
const completionContext = computed(() => ({
  stageVariables: props.stageVariables,
  globalVariables: props.globalVariables.length ? props.globalVariables : undefined,
  functionList: props.functionList.length ? props.functionList : undefined,
  projectConstants: Object.keys(props.projectConstants).length ? props.projectConstants : undefined,
}))

const editorRoot = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
let isSettingDoc = false

const editableCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()
const autocompletionCompartment = new Compartment()

function buildJsLintExtension() {
  return linter((view) => {
    const diagnostics: Diagnostic[] = []
    const code = view.state.doc.toString()
    try {
      // basic syntax check by creating function
      // eslint-disable-next-line no-new-func
      new Function(code)
    } catch (e: any) {
      const msg = e.message || 'Syntax error'
      let from = 0
      let to = view.state.doc.length
      // try simple location parsing if available
      const match = /<anonymous>:(\d+):(\d+)/.exec(msg)
      if (match) {
        const line = parseInt(match[1]!, 10)
        const col = parseInt(match[2]!, 10)
        const lineObj = view.state.doc.line(line)
        from = Math.min(lineObj.from + col - 1, lineObj.to)
        to = from
      }
      diagnostics.push({ from, to, severity: 'error', message: msg })
    }
    return diagnostics
  }, { delay: 500 })
}

// One Dark-inspired palette for dark mode
const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword,                                               color: '#c678dd' },
  { tag: [t.controlKeyword, t.moduleKeyword],                     color: '#c678dd' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#61afef' },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)],          color: '#e06c75' },
  { tag: [t.typeName, t.className, t.namespace],                  color: '#e5c07b' },
  { tag: [t.number, t.bool, t.null],                              color: '#d19a66' },
  { tag: [t.string, t.special(t.string), t.regexp],               color: '#98c379' },
  { tag: [t.operator, t.operatorKeyword],                         color: '#56b6c2' },
  { tag: t.propertyName,                                          color: '#abb2bf' },
  { tag: [t.variableName, t.self],                                color: '#e5e7eb' },
  { tag: t.comment,                                               color: '#7d8799', fontStyle: 'italic' },
  { tag: t.punctuation,                                           color: '#abb2bf' },
  { tag: t.invalid,                                               color: '#f44747', textDecoration: 'underline' },
])

// VS Code light-ish palette for light mode
const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword,                                               color: '#7c3aed' },
  { tag: [t.controlKeyword, t.moduleKeyword],                     color: '#7c3aed' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#1d4ed8' },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)],          color: '#b91c1c' },
  { tag: [t.typeName, t.className, t.namespace],                  color: '#d97706' },
  { tag: [t.number, t.bool, t.null],                              color: '#b45309' },
  { tag: [t.string, t.special(t.string), t.regexp],               color: '#047857' },
  { tag: [t.operator, t.operatorKeyword],                         color: '#0369a1' },
  { tag: t.propertyName,                                          color: '#374151' },
  { tag: [t.variableName, t.self],                                color: '#1f2937' },
  { tag: t.comment,                                               color: '#6b7280', fontStyle: 'italic' },
  { tag: t.punctuation,                                           color: '#374151' },
  { tag: t.invalid,                                               color: '#dc2626', textDecoration: 'underline' },
])

function buildTheme() {
  const monoFont =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  const dark = isDark.value
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: dark ? '#111827' : '#ffffff',
        color: dark ? '#e5e7eb' : '#1f2937',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent !important',
      },
      '.cm-scroller': {
        fontFamily: props.monospace ? monoFont : 'inherit',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      },
      '.cm-content': {
        padding: '0.625rem 0.75rem',
      },
      '.cm-placeholder': {
        color: dark ? '#9ca3af' : '#9ca3af',
      },
      '.cm-cursor': {
        borderLeftColor: dark ? '#e5e7eb' : '#000000',
      },
      '.cm-selectionBackground': {
        backgroundColor: dark ? '#2563eb' : '#bfdbfe',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: dark ? '#2563eb' : '#bfdbfe',
      },
    },
    { dark }
  )
}

function buildThemeExtensions() {
  const base = buildTheme()
  const highlight = isDark.value
    ? syntaxHighlighting(darkHighlightStyle)
    : syntaxHighlighting(lightHighlightStyle)
  return [base, highlight]
}

function getDocText() {
  return view ? view.state.doc.toString() : ''
}

function setDocText(next: string) {
  if (!view) return
  const current = getDocText()
  if (next === current) return
  isSettingDoc = true
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } })
  isSettingDoc = false
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
  view.dispatch({ effects: placeholderCompartment.reconfigure(ext) })
}

function reconfigureTheme() {
  if (!view) return
  view.dispatch({ effects: themeCompartment.reconfigure(buildThemeExtensions()) })
}

function reconfigureAutocompletion() {
  if (!view) return
  const completionSource = createJavaScriptCompletionSource(completionContext.value)
  view.dispatch({
    effects: autocompletionCompartment.reconfigure(
      autocompletion({ override: [completionSource] })
    ),
  })
}

onMounted(() => {
  if (!editorRoot.value) return
  const completionSource = createJavaScriptCompletionSource(completionContext.value)

  const state = EditorState.create({
    doc: props.modelValue ?? '',
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      javascript(),
      tooltips({ parent: document.body }),
      autocompletionCompartment.of(
        autocompletion({ override: [completionSource] })
      ),
      lintGutter(),
      buildJsLintExtension(),
      editableCompartment.of([
        EditorView.editable.of(!props.disabled),
        EditorState.readOnly.of(props.disabled),
      ]),
      placeholderCompartment.of(props.placeholder ? placeholderExt(props.placeholder) : []),
      themeCompartment.of(buildThemeExtensions()),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isSettingDoc) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
      EditorView.domEventHandlers({
        blur: () => { emit('blur') },
      }),
    ],
  })

  view = new EditorView({
    state,
    parent: editorRoot.value,
  })

  view.contentDOM.setAttribute('aria-label', props.ariaLabel)

  handleToolbarClickOutside = (e: MouseEvent) => {
    if (toolbarRef.value && !toolbarRef.value.contains(e.target as Node)) {
      openDropdown.value = null
    }
  }
  document.addEventListener('click', handleToolbarClickOutside, { capture: true })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
  document.removeEventListener('click', handleToolbarClickOutside, { capture: true })
})

// expose helper for parent to read current value
function getValue(): string {
  return view ? view.state.doc.toString() : ''
}

defineExpose({ getValue })

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

watch(isDark, () => { reconfigureTheme() })

watch(() => props.monospace, () => { reconfigureTheme() })

watch(
  completionContext,
  () => { reconfigureAutocompletion() },
  { deep: true }
)
</script>


