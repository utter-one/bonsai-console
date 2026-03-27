# StageLifecycleActionsSection — new component

## What

A panel component that replaces the **Lifecycle** tab body of `StageEditView`. It renders
the three lifecycle trigger cards (ON_ENTER, ON_LEAVE, ON_FALLBACK) and manages the
`StageActionModal` instance used to configure lifecycle actions.

## Why

The lifecycle tab is ~200 lines with its own modal visibility ref, a `v-for` over the
`lifecycleActions` computed, and configure/clear button handlers. Extracting it removes
~200 lines from `StageEditView` and gives the lifecycle concept its own focused home.

## Source

Extracted from `src/views/design/StageEditView.vue` — lifecycle tab section.

## New file

`src/components/StageLifecycleActionsSection.vue`

## Props

```typescript
interface Props {
  modelValue: Record<string, StageAction>  // form.actions — full map including lifecycle keys
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

## Lifecycle keys

The three lifecycle keys are fixed constants: `'ON_ENTER'`, `'ON_LEAVE'`, `'ON_FALLBACK'`.

## Internal state

- `showActionModal` — controls the `StageActionModal` visibility
- `editingLifecycleKey` — which of the three keys is being configured
- `editingAction` — the action object being configured (or `null` for a new empty action)

## Internal computeds

- `lifecycleActionConfigs` — array of `{ key, label, description, icon }` objects
  driving the v-for; replaces the `lifecycleActions` computed currently in the view.
- `actionForKey(key)` — returns `modelValue[key] ?? null`

## Child components

- `StageActionModal` (with `isLifecycleAction` prop set to `true`)

## Template structure

```
<div class="lifecycle-section">
  <div
    v-for="config in lifecycleActionConfigs"
    :key="config.key"
    class="card lifecycle-card"
  >
    <div class="lifecycle-card-header">
      <component :is="config.icon" ... />
      <div>
        <h4>{{ config.label }}</h4>
        <p>{{ config.description }}</p>
      </div>
    </div>

    <!-- Configured action summary (if action exists) -->
    <div v-if="actionForKey(config.key)" class="action-summary">...</div>

    <!-- Actions: Configure / Clear -->
    <div class="lifecycle-card-footer">
      <button :disabled="isReadOnly" @click="configure(config.key)">Configure</button>
      <button v-if="actionForKey(config.key)" :disabled="isReadOnly" @click="clear(config.key)">Clear</button>
    </div>
  </div>

  <StageActionModal
    v-if="showActionModal"
    :action="editingAction"
    :editing-key="editingLifecycleKey"
    :is-lifecycle-action="true"
    ...
    @close="showActionModal = false"
    @save="handleSave"
  />
</div>
```

## Acceptance criteria

- All three lifecycle cards render with correct labels and descriptions.
- Clicking Configure opens `StageActionModal` pre-populated with the current action (or empty for new).
- Saving from the modal updates `modelValue` via `update:modelValue`.
- Clear removes the lifecycle action from `modelValue`.
- Read-only mode disables Configure and Clear buttons.
