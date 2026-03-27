# StageVariablesTab — new component

## What

A component that replaces the **Memory** tab body of `StageEditView`. It renders the
editable variable descriptor tree and provides copy/paste-all controls for the variable
list.

## Why

The memory tab is ~300 lines and contains the `VariableTreeNode` recursive render loop,
`expandedNodes` Set management, copy/paste-all buttons with `VariablesPasteModal`, and
the `duplicateVariableNames` computed. Critically, this logic is **already duplicated**
in `GlobalMemoryView.vue` (its user profile variables tab). Extracting the tab content
into a shared component eliminates that duplication.

## Source

Extracted from `src/views/design/StageEditView.vue` — memory tab.
Also consolidates duplicate logic from `src/views/design/GlobalMemoryView.vue`.

## New file

`src/components/StageVariablesTab.vue`

## Props

```typescript
interface Props {
  modelValue: VariableDescriptor[]         // form.variableDescriptors
  projectConstants?: Record<string, any>   // for completion context
  userProfileVariables?: any[]             // for completion context
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:modelValue', descriptors: VariableDescriptor[])
```

## Internal state

- `expandedNodes: Set<string>` — which tree nodes are expanded
- `showVariablesPasteModal: boolean`
- `clipboardVariables: VariableDescriptor[] | null`

## Internal computeds

- `duplicateVariableNames` — set of names that appear more than once at their level,
  used to highlight duplicates in the tree

## Composable usage

```typescript
const { copyAll, pasteAll, clipboardData, showPasteModal } =
  useCopyPaste<VariableDescriptor>('stage-variables')
```

## Child components

- `VariableTreeNode` (existing)
- `VariablesPasteModal` (existing)

## Template structure

```
<div class="variables-tab">
  <!-- Toolbar -->
  <div class="toolbar">
    <button @click="addRootVariable" :disabled="isReadOnly">Add variable</button>
    <button @click="copyAll">Copy all</button>
    <button @click="pasteAll" :disabled="isReadOnly">Paste all</button>
  </div>

  <!-- Duplicate name warning -->
  <div v-if="duplicateVariableNames.size" class="alert-warning">...</div>

  <!-- Variable tree -->
  <div v-if="modelValue.length === 0" class="empty-state">No variables defined.</div>
  <VariableTreeNode
    v-for="(descriptor, index) in modelValue"
    :key="index"
    :descriptor="descriptor"
    :path="[index]"
    :level="0"
    :expanded-nodes="expandedNodes"
    :is-read-only="isReadOnly"
    @toggle="toggleNode"
    @update-name="updateName"
    @update-type="updateType"
    @delete="deleteDescriptor"
    @add-nested="addNestedDescriptor"
  />

  <VariablesPasteModal
    v-if="showPasteModal"
    :clipboard-variables="clipboardData"
    @paste="handlePaste"
    @close="showPasteModal = false"
  />
</div>
```

## Usage in GlobalMemoryView

After this component is created, `GlobalMemoryView`'s user profile variables tab can
also be replaced with:

```vue
<StageVariablesTab
  v-model="form.userProfileVariableDescriptors"
  :is-read-only="isReadOnly"
/>
```

This eliminates the duplicated variable tree logic from `GlobalMemoryView`.

## Acceptance criteria

- Variables can be added, renamed, typed, nested, and deleted.
- Expanded/collapsed state of tree nodes is preserved within the session.
- Duplicate variable name warning appears when two siblings share a name.
- Copy all writes valid JSON to the clipboard.
- Paste all opens the `VariablesPasteModal` and merges/overwrites correctly.
- `GlobalMemoryView` user profile variables tab works identically after adopting this component.
- No TypeScript errors introduced.
