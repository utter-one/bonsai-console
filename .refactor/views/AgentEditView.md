# AgentEditView — Extract TTS provider settings panel

## Why

The **Voice** tab of `AgentEditView.vue` contains five sequential `v-if` blocks — one
per supported TTS provider (ElevenLabs, OpenAI, Deepgram, Cartesia, Azure). Each block
is 30–80 lines of provider-specific form fields with no shared structure. Any bug or
UI change in the voice settings must be applied in up to five places.

Extracting these into `TtsProviderSettingsPanel.vue` shrinks the view by ~350 lines,
makes per-provider fields independently scannable, and reduces the risk of inconsistent
edits across providers.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/design/AgentEditView.vue` |
| New component | `src/components/TtsProviderSettingsPanel.vue` — see [TtsProviderSettingsPanel.md](../components/TtsProviderSettingsPanel.md) |

## What moves out

Every block that is currently guarded by one of:

```
v-if="form.ttsProviderId && isElevenLabs"
v-if="form.ttsProviderId && isOpenAI"
v-if="form.ttsProviderId && isDeepgram"
v-if="form.ttsProviderId && isCartesia"
v-if="form.ttsProviderId && isAzure"
```

Each block contains provider-specific sliders, selects, checkboxes and text inputs that
bind to fields in `form.ttsSettings`. The full field inventory per provider is
documented in [TtsProviderSettingsPanel.md](../components/TtsProviderSettingsPanel.md).

The computed helpers that only serve those blocks also move into the component:
- `availableModels`
- `availableVoices`
- `currentVoiceValue` (setter/getter)
- `availableAudioFormats`
- `audioFormatValue` (setter/getter)
- `emotionTagsInput` (setter/getter for Cartesia emotion array ↔ string)
- `isModelSelected`
- `modelValue` (setter/getter handling Amazon Polly engine mapping)

The watch on `form.value.ttsSettings.model` (resets voice on model change) also moves
into the component.

## What stays in AgentEditView

- TTS provider selector (`<select v-model="form.ttsProviderId">`) — stays because it
  controls which provider is active and is part of the main form layout.
- `selectedProvider`, `selectedProviderApiType`, `isElevenLabs`, `isOpenAI`, etc. —
  these computed flags are passed as props or can be recalculated inside the panel.
- Model + voice selectors that are shared across providers (placed above the
  provider-specific section) — reviewed on a case-by-case basis; likely stay in the
  view as they feed `modelValue` / `currentVoiceValue`.
- All other tabs (basic, prompt, filler, metadata, history) are untouched.

## How the voice tab looks after the refactor

```vue
<!-- Voice tab -->
<div v-show="activeTab === 'voice'">
  <!-- Provider selector stays here -->
  <div class="form-group">
    <label class="form-label">TTS Provider</label>
    <select class="form-select" v-model="form.ttsProviderId" ...>...</select>
  </div>

  <!-- Model / voice selectors (shared, stay here) -->
  ...

  <!-- All provider-specific settings move here -->
  <TtsProviderSettingsPanel
    v-if="form.ttsProviderId"
    v-model="form.ttsSettings"
    :api-type="selectedProviderApiType"
    :available-models="availableModels"
    :available-voices="availableVoices"
    :available-audio-formats="availableAudioFormats"
    :is-read-only="isReadOnly"
  />
</div>
```

## Implementation steps

1. Create `TtsProviderSettingsPanel.vue` with the interface documented in its own file.
2. Move all five provider `v-if` blocks from the voice tab into the panel's template,
   switching from `form.ttsSettings.*` bindings to `modelValue.*` (via `defineModel`
   or explicit `update:modelValue` emits).
3. Move the provider-only computed properties and the model-change watcher into the panel.
4. In `AgentEditView`, replace the five blocks with the single `<TtsProviderSettingsPanel>` call.
5. Remove the now-unused computed imports/declarations from the view.
6. Verify TypeScript types compile clean.

## Acceptance criteria

- Selecting each of the five providers renders the correct fields.
- Saving an agent form still persists all provider-specific settings.
- `AgentEditView.vue` voice tab section is under 80 lines.
- No TypeScript errors introduced.
