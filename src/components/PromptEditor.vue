<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView, placeholder as placeholderExt } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { autocompletion } from '@codemirror/autocomplete'
import { liquid } from '@codemirror/lang-liquid'
import { handlebarsPromptCompletionSource } from '@/components/prompt/handlebarsPromptCompletions'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
    minHeight?: string
    ariaLabel?: string
    monospace?: boolean
  }>(),
  {
    disabled: false,
    placeholder: '',
    minHeight: '20rem',
    ariaLabel: 'Prompt editor',
    monospace: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const editorRoot = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

const editableCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()

function buildTheme() {
  const monoFont =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

  return EditorView.theme(
    {
      '&': {
        height: '100%',
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
        color: '#9ca3af',
      },
    },
    { dark: false }
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

onMounted(() => {
  if (!editorRoot.value) return

  const state = EditorState.create({
    doc: props.modelValue ?? '',
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      liquid(),
      autocompletion({ override: [handlebarsPromptCompletionSource] }),
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
</script>

<template>
  <div
    class="w-full border border-gray-300 rounded-md text-sm focus-within:outline-none focus-within:border-primary-500 bg-white overflow-hidden"
    :class="{ 'opacity-60 pointer-events-none bg-gray-100': disabled }"
    :style="{ minHeight }"
  >
    <div ref="editorRoot" class="h-full" />
  </div>
</template>
