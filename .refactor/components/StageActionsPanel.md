# StageActionsPanel — new component

## What

A self-contained panel that replaces the entire **Actions** tab body of `StageEditView`.
It owns: the search + classifier filter bar, the actions table, the action modals
(create / edit / duplicate / paste), and the copy/paste toolbar buttons.

## Why

The actions tab in `StageEditView` is ~600 lines. It contains filtering computed
properties, sorting logic, three modal visibility refs, clipboard state, and the full
table markup — all co-located with five other tabs. Extracting it to a dedicated
component makes the concern independently readable and removes ~600 lines from
`StageEditView`.

Additionally, the copy/paste-all pattern it implements is identical to `GlobalActionsView`
— both will share the `useCopyPaste` composable after this refactor.

## Source

Extracted from `src/views/design/StageEditView.vue` — actions tab section.

## New file

`src/components/StageActionsPanel.vue`

## Props

```typescript
interface Props {
  modelValue: Record<string, StageAction>  // form.actions
  classifiers: ClassifierResponse[]
  stages: StageResponse[]
  tools: ToolResponse[]
  stageVariables: any[]
  actionParameters: Record<string, any[]>
  projectConstants: Record<string, any>
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:modelValue', actions: Record<string, StageAction>)
```

All mutations (add, edit, delete, duplicate, paste) emit `update:modelValue` with the
full updated actions map so the parent `form.actions` stays in sync.

## Internal state (not exposed)

- `actionsSearchQuery` — search input ref
- `actionsClassifierFilter` — selected classifier ID ref
- `showClassifierDropdown` — dropdown open flag
- `showActionModal`, `showDuplicateModal`, `showPasteModal` — modal visibility refs
- `editingAction`, `editingActionKey`, `duplicatingActionKey` — editing context refs
- `clipboardActions` — clipboard data for paste
- `isLifecycleActionKey` — always `false` here (lifecycle actions are managed in `StageLifecycleActionsSection`)

## Internal computeds

- `classifierNameById` — map for display
- `currentClassifierFilterLabel` — label for filter button
- `actionsClassifierOptions` — options list
- `actionsList` — filtered + sorted array of `[key, action]` tuples (excludes lifecycle keys)

## Composable usage

Uses `useCopyPaste` for the copy/paste all flow:

```typescript
const { copyAll, pasteAll, clipboardData, showPasteModal } =
  useCopyPaste<StageAction>('stage-actions')
```

## Child components used internally

- `StageActionModal`
- `ActionDuplicateModal`
- `ActionsPasteModal`

## Template structure

```
<div class="actions-panel">
  <!-- Toolbar: search + classifier filter + add + copy/paste buttons -->
  <div class="toolbar">
    <input v-model="actionsSearchQuery" ... />
    <FilterDropdown ...>...</FilterDropdown>   <!-- classifier filter -->
    <button @click="openAddModal">Add action</button>
    <button @click="copyAll">Copy all</button>
    <button @click="pasteAll">Paste all</button>
  </div>

  <!-- Actions table -->
  <table>
    <thead>...</thead>
    <tbody>
      <tr v-for="[key, action] in actionsList" :key="key">...</tr>
    </tbody>
  </table>

  <!-- Modals -->
  <StageActionModal v-if="showActionModal" ... @close @save />
  <ActionDuplicateModal v-if="showDuplicateModal" ... @close @save />
  <ActionsPasteModal v-if="showPasteModal" ... @close @paste />
</div>
```

## Acceptance criteria

- Actions can be created, edited, duplicated, and deleted.
- Search and classifier filter narrow the table correctly.
- Copy/paste all works (uses clipboard API).
- All mutations propagate through `update:modelValue` so `StageEditView` form saves correctly.
- No lifecycle action keys (`ON_ENTER`, `ON_LEAVE`, `ON_FALLBACK`) appear in this panel.
