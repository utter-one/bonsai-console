# StageEditView — Split into sub-panels

## Why

`StageEditView.vue` is ~3 100 lines and manages eight conceptually independent tabs
inside a single flat component. Three of those tabs are large enough to be standalone
features: a full action management table with filtering/sorting/pagination, a lifecycle
card grid, and a variable tree editor that duplicates logic already present in
`GlobalMemoryView.vue`. The remaining tabs (basic, prompt, features) are compact
enough to stay inline.

Splitting the three heavy tabs into dedicated panel components reduces the view to
~900 lines and makes each concern independently readable and testable.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/design/StageEditView.vue` |
| New component | `src/components/StageActionsPanel.vue` — see [StageActionsPanel.md](../components/StageActionsPanel.md) |
| New component | `src/components/StageLifecycleActionsSection.vue` — see [StageLifecycleActionsSection.md](../components/StageLifecycleActionsSection.md) |
| New component | `src/components/StageVariablesTab.vue` — see [StageVariablesTab.md](../components/StageVariablesTab.md) |
| New composable | `src/composables/useCopyPaste.ts` — see [useCopyPaste.md](../composables/useCopyPaste.md) |

## What moves out of StageEditView

### Memory tab → `StageVariablesTab`

Everything inside `v-show="activeTab === 'memory'"`:
- `VariableTreeNode` recursive rendering
- Copy / paste all variables buttons
- `VariablesPasteModal` trigger and handler (`showVariablesPasteModal`, `clipboardVariables`, `copyAllVariables`, `pasteVariables`, `handleVariablesPaste`)
- `expandedNodes` Set ref
- `duplicateVariableNames` computed

The view passes down `form.value.variableDescriptors` as a v-model and the
`projectConstantsForCompletion` + `userProfileVariablesForCompletion` for the
completion context.

### Actions tab → `StageActionsPanel`

Everything inside `v-show="activeTab === 'actions'"`:
- Search input + classifier filter dropdown (`actionsSearchQuery`, `actionsClassifierFilter`, `showClassifierDropdown`, `actionsClassifierOptions`, `currentClassifierFilterLabel`, `actionsList` computed)
- Action table with all inline badges/icons per row
- Add / duplicate / paste actions toolbar (`showActionModal`, `showDuplicateModal`, `showPasteModal`, `clipboardActions`)
- `StageActionModal` and `ActionDuplicateModal` and `ActionsPasteModal` dialogs
- `classifierNameById` computed
- Copy / paste all actions functions (`copyActions`, `pasteActions`, `handleActionsPaste`)

The view passes down the `form.value.actions` record as a v-model together with
classifier / stage / tool lists needed for the modals.

### Lifecycle tab → `StageLifecycleActionsSection`

Everything inside `v-show="activeTab === 'lifecycle'"`:
- The v-for over `lifecycleActions` computed
- Configure / clear button handlers
- `isLifecycleActionKey` ref
- The `StageActionModal` instance dedicated to lifecycle events

## What stays in StageEditView

- Data loading, `currentStage` ref, `isEditMode`, `isReadOnly`, `projectIsArchived`
- `form` ref (the full stage form object)
- `submit()` function
- Tab navigation (`activeTab`)
- Basic tab markup (name, description, tags, agent, enter behaviour, VAD)
- Prompt tab markup (LLM provider selector, `LLMSettingsModal`, `PromptEditor`)
- Features tab markup (knowledge, global actions, default classifier, transformers)
- `metadataFields` computed + `MetadataTab`
- `EntityHistoryView`
- All store fetches (`agentsStore`, `classifiersStore`, `providersStore`, etc.)

## How the view looks after the split

```vue
<template>
  <div v-show="activeTab === 'memory'">
    <StageVariablesTab
      v-model="form.variableDescriptors"
      :project-constants="projectConstantsForCompletion"
      :user-profile-variables="userProfileVariablesForCompletion"
      :is-read-only="isReadOnly"
    />
  </div>

  <div v-show="activeTab === 'actions'">
    <StageActionsPanel
      v-model="form.actions"
      :classifiers="projectClassifiers"
      :stages="projectStages"
      :tools="projectTools"
      :stage-variables="stageVariablesForCompletion"
      :action-parameters="actionParametersForCompletion"
      :project-constants="projectConstantsForCompletion"
      :is-read-only="isReadOnly"
    />
  </div>

  <div v-show="activeTab === 'lifecycle'">
    <StageLifecycleActionsSection
      v-model="form.actions"
      :stage-variables="stageVariablesForCompletion"
      :action-parameters="actionParametersForCompletion"
      :project-constants="projectConstantsForCompletion"
      :is-read-only="isReadOnly"
    />
  </div>
</template>
```

## Implementation steps

1. Create `useCopyPaste.ts` composable (deduplicates logic shared with `GlobalMemoryView` and `GlobalActionsView`).
2. Create `StageVariablesTab.vue` — move memory tab content, use `useCopyPaste` internally.
3. Create `StageActionsPanel.vue` — move actions tab content + its modals, use `useCopyPaste` internally.
4. Create `StageLifecycleActionsSection.vue` — move lifecycle tab content.
5. In `StageEditView.vue`: replace the three tab bodies with the new components, remove all refs/computeds that moved out, clean up now-unused imports.
6. Verify that `form` mutations inside the child components propagate correctly (use `v-model` / `defineModel` or explicit `update:` emits).

## Acceptance criteria

- Navigating through all 8 tabs works and saves correctly in both create and edit mode.
- Copy/paste for variables and actions works identically to before.
- Lifecycle action configure/clear buttons still open `StageActionModal` and save to `form.actions`.
- `StageEditView.vue` is under 1 000 lines after the split.
- No TypeScript errors.
