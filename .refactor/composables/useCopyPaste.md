# useCopyPaste — new composable

## What

A composable that encapsulates the copy-all / paste-all clipboard workflow used for
lists of structured objects (actions, variable descriptors, constants). It manages the
clipboard data ref, the paste-modal visibility flag, and the copy/paste handler functions.

## Why

The copy/paste-all pattern is **duplicated in three locations**:

| File | Subject | Functions duplicated |
|------|---------|---------------------|
| `src/views/design/GlobalMemoryView.vue` | User profile variable descriptors | `copyAllVariables`, `pasteVariables`, `handleVariablesPaste` |
| `src/views/design/GlobalMemoryView.vue` | Project constants | `copyAllConstants`, `pasteConstants` |
| `src/views/design/GlobalActionsView.vue` | Global actions | `copyAll`, `pasteAll`, `handlePaste` |
| `src/views/design/StageEditView.vue` | Stage actions | `copyActions`, `pasteActions`, `handleActionsPaste` |

Each implementation is ~60–80 lines. The only meaningful difference is the type of data
and which paste modal is opened. A generic composable parameterised on the item type and
a clipboard key reduces this to a single definition.

## New file

`src/composables/useCopyPaste.ts`

## Signature

```typescript
function useCopyPaste<T>(storageKey: string): {
  clipboardData: Ref<T[] | null>
  showPasteModal: Ref<boolean>
  copyAll: (items: T[]) => Promise<void>
  openPasteModal: (items: T[]) => Promise<void>   // reads clipboard → sets clipboardData → opens modal
  handlePaste: (selectedIndices: number[]) => T[]  // returns selected items from clipboardData
  closePasteModal: () => void
}
```

`storageKey` is used only for error context (e.g. toast messages). It does not affect
the clipboard API call itself.

## Implementation sketch

```typescript
import { ref } from 'vue'
import type { Ref } from 'vue'

export function useCopyPaste<T>(storageKey: string) {
  const clipboardData = ref<T[] | null>(null)
  const showPasteModal = ref(false)

  async function copyAll(items: T[]) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2))
    } catch {
      console.error(`[useCopyPaste:${storageKey}] Failed to copy to clipboard`)
    }
  }

  async function openPasteModal(currentItems?: T[]) {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text) as T[]
      if (!Array.isArray(parsed)) throw new Error('Clipboard data is not an array')
      clipboardData.value = parsed
      showPasteModal.value = true
    } catch {
      console.error(`[useCopyPaste:${storageKey}] Failed to read clipboard`)
    }
  }

  function handlePaste(selectedIndices: number[]): T[] {
    if (!clipboardData.value) return []
    return selectedIndices.map(i => clipboardData.value![i]).filter(Boolean)
  }

  function closePasteModal() {
    showPasteModal.value = false
    clipboardData.value = null
  }

  return { clipboardData, showPasteModal, copyAll, openPasteModal, handlePaste, closePasteModal }
}
```

## Usage

```typescript
// In StageActionsPanel.vue
const { clipboardData, showPasteModal, copyAll, openPasteModal, handlePaste, closePasteModal } =
  useCopyPaste<StageAction>('stage-actions')

async function copyAllActions() {
  await copyAll(Object.values(props.modelValue))
}

async function pasteActions() {
  await openPasteModal()  // reads clipboard, opens modal if valid
}

function onPasteConfirmed(indices: number[]) {
  const selected = handlePaste(indices)
  // merge selected into modelValue and emit update
  closePasteModal()
}
```

## Export

Add to `src/composables/index.ts`:

```typescript
export { useCopyPaste } from './useCopyPaste'
```

## Acceptance criteria

- `copyAll` writes a JSON array to the system clipboard.
- `openPasteModal` reads the clipboard, parses JSON, and opens the paste modal.
- `openPasteModal` does nothing (and logs a warning) when clipboard content is not a
  valid JSON array.
- `handlePaste` returns only the items at the provided indices.
- `closePasteModal` resets both `showPasteModal` and `clipboardData`.
- All three current copy/paste sites (`GlobalMemoryView` ×2, `GlobalActionsView`,
  `StageEditView`) are migrated to use this composable.
