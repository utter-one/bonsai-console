# SmartFunctionConfig — new component

## What

A component containing all configuration fields for a `smart_function` tool: input/output
type selectors, LLM provider selector, LLM settings modal, and the prompt editor.

## Why

One of three tool-type sections in `ToolEditView` that are currently all compiled into
the same file. This section alone is ~600 lines. Separating it makes it independently
maintainable and removes the long nested `v-if` condition guarding it.

## Source

Extracted from `src/views/design/ToolEditView.vue` — smart function section of the
Config tab.

## New file

`src/components/tools/SmartFunctionConfig.vue`

## Props

```typescript
interface Props {
  prompt: string
  llmProviderId: string | null
  llmSettings: LlmSettings | null
  inputType: 'text' | 'image' | 'multi_modal'
  outputType: 'text' | 'image' | 'multi_modal'
  llmProviders: ProviderResponse[]
  stageVariables?: any[]
  actionParameters?: Record<string, any[]>
  projectConstants?: Record<string, any>
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:prompt', value: string)
emit('update:llmProviderId', value: string | null)
emit('update:llmSettings', value: LlmSettings | null)
emit('update:inputType', value: 'text' | 'image' | 'multi_modal')
emit('update:outputType', value: 'text' | 'image' | 'multi_modal')
```

Using multiple `v-model:propName` bindings in the parent (see [ToolEditView.md](../views/ToolEditView.md)).

## Internal state

- `showLLMSettingsModal: boolean`

## Template structure

```
<div class="smart-function-config space-y-6">
  <!-- Input type selector -->
  <div class="form-group">
    <label>Input type</label>
    <div class="btn-group">
      <button :class="..." @click="emit('update:inputType', 'text')">Text</button>
      <button :class="..." @click="emit('update:inputType', 'image')">Image</button>
      <button :class="..." @click="emit('update:inputType', 'multi_modal')">Multi-modal</button>
    </div>
  </div>

  <!-- Output type selector -->
  <div class="form-group">
    <label>Output type</label>
    <div class="btn-group">...</div>
  </div>

  <!-- LLM provider -->
  <div class="form-group">
    <label>LLM Provider</label>
    <select v-model="localLlmProviderId" class="form-select">...</select>
  </div>

  <!-- LLM settings button -->
  <button @click="showLLMSettingsModal = true" :disabled="!llmProviderId || isReadOnly">
    <LLMModelBadge :settings="llmSettings" />
  </button>

  <!-- Prompt editor -->
  <PromptEditor
    :model-value="prompt"
    :stage-variables="stageVariables"
    :action-parameters="actionParameters"
    :project-constants="projectConstants"
    :disabled="isReadOnly"
    @update:model-value="emit('update:prompt', $event)"
  />

  <!-- LLM settings modal -->
  <LLMSettingsModal
    v-if="showLLMSettingsModal"
    :provider-id="llmProviderId"
    :settings="llmSettings"
    @save="emit('update:llmSettings', $event); showLLMSettingsModal = false"
    @close="showLLMSettingsModal = false"
  />
</div>
```

## Acceptance criteria

- Input type and output type toggles update correctly.
- LLM provider selector populates available providers.
- LLM settings modal opens, saves, and closes; saved settings are reflected in the
  `LLMModelBadge`.
- Prompt editor renders with correct variable completion context.
- All changes emit correctly and are captured by `ToolEditView`'s `form`.
