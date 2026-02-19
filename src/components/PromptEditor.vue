<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { EditorView, placeholder as placeholderExt, tooltips } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { autocompletion } from '@codemirror/autocomplete'
import { liquid } from '@codemirror/lang-liquid'
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
  }>(),
  {
    disabled: false,
    placeholder: '',
    minHeight: '20rem',
    ariaLabel: 'Prompt editor',
    monospace: true,
    stageVariables: () => [],
    actionParameters: () => ({}),
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const editorRoot = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

const editableCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()
const autocompletionCompartment = new Compartment()

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
    ],
  })

  view = new EditorView({
    state,
    parent: editorRoot.value,
  })

  // Accessibility
  view.contentDOM.setAttribute('aria-label', props.ariaLabel)
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
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
    class="w-full border border-gray-300 rounded-md text-sm focus-within:outline-none focus-within:border-primary-500 bg-white overflow-hidden dark:bg-gray-900 dark:border-gray-700"
    :class="{ 'opacity-60 pointer-events-none bg-gray-100 dark:bg-gray-800': disabled }"
    :style="{ minHeight }"
  >
    <div ref="editorRoot" class="h-full" />
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
</style>
