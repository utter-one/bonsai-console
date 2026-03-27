# ScriptConfig — new component

## What

A minimal wrapper component that renders the `JavaScriptEditor` for a `script`-type
tool, with the correct context props wired in.

## Why

Even though the script section of `ToolEditView` is the smallest of the three type
sections (~300 lines), extracting it keeps the split consistent: every tool type has its
own component, which makes adding a new tool type in the future a simple
add-a-new-component operation rather than editing the view.

## Source

Extracted from `src/views/design/ToolEditView.vue` — script section of the Config tab.

## New file

`src/components/tools/ScriptConfig.vue`

## Props

```typescript
interface Props {
  modelValue: string                    // form.code
  stageVariables?: any[]
  actionParameters?: Record<string, any[]>
  projectConstants?: Record<string, any>
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:modelValue', value: string)
```

## Template structure

```vue
<template>
  <div class="script-config">
    <JavaScriptEditor
      :model-value="modelValue"
      :stage-variables="stageVariables"
      :action-parameters="actionParameters"
      :project-constants="projectConstants"
      :disabled="isReadOnly"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
```

This component intentionally has no logic — it is a props-forwarding adapter that
gives the `script` tool type the same structural weight as the `smart_function` and
`webhook` types.

## Acceptance criteria

- `JavaScriptEditor` renders with correct variable/constant completion context.
- Code changes emit `update:modelValue` and are captured by `ToolEditView`'s `form.code`.
- `isReadOnly` disables the editor.
