# ToolEditView — Extract tool-type config sections

## Why

`ToolEditView.vue` is ~2 000 lines. Its **Config** tab has three completely different
schemas depending on the tool type:

- `smart_function` — LLM provider + settings modal + I/O type selectors + prompt editor
- `webhook` — URL + method + headers list + body template
- `script` — JavaScript code editor

These three sections currently coexist inside one flat component under long `v-if`
conditions. This means ~1 400 lines of unrelated UI are always compiled together.
Extracting each into its own component makes the variant logic independently readable
and eliminates the nested `(!isEditMode && form.type === 'x') || (isEditMode && currentTool?.type === 'x')` guard pattern.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/design/ToolEditView.vue` |
| New component | `src/components/tools/SmartFunctionConfig.vue` — see [SmartFunctionConfig.md](../components/SmartFunctionConfig.md) |
| New component | `src/components/tools/WebhookConfig.vue` — see [WebhookConfig.md](../components/WebhookConfig.md) |
| New component | `src/components/tools/ScriptConfig.vue` — see [ScriptConfig.md](../components/ScriptConfig.md) |

## What moves out

### `SmartFunctionConfig`

Fields in `form` that belong here:
- `form.prompt`
- `form.llmProviderId`
- `form.llmSettings`
- `form.inputType`
- `form.outputType`

Template blocks moved:
- Input type selector (3-button toggle: text / image / multi-modal)
- Output type selector (3-button toggle)
- LLM provider `<select>`
- LLM settings button + `LLMSettingsModal` dialog
- `PromptEditor` with its toolbar context

Computed/refs moved:
- `showLLMSettingsModal`
- `llmProviders`
- `configTabLabel` (can be replaced by a static title inside the component)

### `WebhookConfig`

Fields in `form` that belong here:
- `form.url`
- `form.webhookMethod`
- `form.webhookHeaderPairs` — array of `{ key: string; value: string }`
- `form.webhookBody`

Template blocks moved:
- URL `<input>`
- HTTP method selector (GET / POST / PUT / PATCH / DELETE)
- Headers grid with add / remove row buttons
- Webhook body `<textarea>`

No state refs move — all bindings go through `defineModel` on the form fields.

### `ScriptConfig`

Fields in `form` that belong here:
- `form.code`

Template blocks moved:
- The `JavaScriptEditor` instance with its full prop set (stage variables, project
  constants, function list)

## What stays in ToolEditView

- Type selector (three-button toggle for create mode) — stays in the **basic** tab.
- `form` ref — owned by the view; slices are passed as props / v-model to sub-components.
- `currentTool` ref and `isEditMode` computed.
- Tool ID, name, description, tags (basic tab — compact, stays inline).
- Parameters tab (also compact).
- `MetadataTab` and `EntityHistoryView` tabs.
- `submit()` function — collects `form` and calls the store.

## How the config tab looks after the refactor

```vue
<div v-show="activeTab === 'config'">
  <SmartFunctionConfig
    v-if="resolvedType === 'smart_function'"
    v-model:prompt="form.prompt"
    v-model:llm-provider-id="form.llmProviderId"
    v-model:llm-settings="form.llmSettings"
    v-model:input-type="form.inputType"
    v-model:output-type="form.outputType"
    :llm-providers="llmProviders"
    :stage-variables="stageVariablesForCompletion"
    :project-constants="projectConstantsForCompletion"
    :is-read-only="isReadOnly"
  />

  <WebhookConfig
    v-else-if="resolvedType === 'webhook'"
    v-model:url="form.url"
    v-model:method="form.webhookMethod"
    v-model:headers="form.webhookHeaderPairs"
    v-model:body="form.webhookBody"
    :is-read-only="isReadOnly"
  />

  <ScriptConfig
    v-else-if="resolvedType === 'script'"
    v-model="form.code"
    :stage-variables="stageVariablesForCompletion"
    :project-constants="projectConstantsForCompletion"
    :is-read-only="isReadOnly"
  />
</div>
```

`resolvedType` is a computed that returns `currentTool?.type ?? form.type` — this
replaces the repeated `(!isEditMode && form.type === 'x') || (isEditMode && currentTool?.type === 'x')` conditions.

## Implementation steps

1. Create `src/components/tools/` directory.
2. Create `SmartFunctionConfig.vue` — move prompt/LLM/I/O section, including
   `LLMSettingsModal` and its show ref.
3. Create `WebhookConfig.vue` — move URL/method/headers/body section.
4. Create `ScriptConfig.vue` — move code editor section.
5. Add `resolvedType` computed to `ToolEditView.vue`.
6. Replace the three large `v-if` blocks in the config tab with the new components.
7. Remove the refs/computeds that moved out.
8. Verify TypeScript types compile clean.

## Acceptance criteria

- Type selection in create mode correctly switches the active component.
- In edit mode, the correct component is shown based on `currentTool.type`.
- Smart function: prompt saves, LLM settings modal opens and closes correctly.
- Webhook: headers can be added and removed; URL and body save correctly.
- Script: JavaScript editor renders and saves code correctly.
- `ToolEditView.vue` is under 500 lines after the refactor.
- No TypeScript errors introduced.
