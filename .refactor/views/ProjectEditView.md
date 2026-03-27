# ProjectEditView — Extract ASR provider settings

## Why

The **Voice** tab of `ProjectEditView.vue` contains five `v-if` blocks covering the
five supported ASR providers: Azure, ElevenLabs, Deepgram, AssemblyAI, Speechmatics.
Each block is 80–180 lines of provider-specific form fields, three of which also include
dynamic list management (dictionary phrases / keyterms / vocabulary words). Together
these blocks account for roughly 1 000 lines — half the file.

Deepgram has additional complexity: three synchronized watchers to keep a checkbox +
numeric input + the `form.asrConfig.settings.endpointing` field in sync. This
cross-cutting state management pollutes the view's script.

Extracting ASR provider fields into a family of dedicated components shrinks
`ProjectEditView.vue` to ~850 lines and isolates each provider's unique logic.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/administration/ProjectEditView.vue` |
| New component | `src/components/asr/AsrProviderSettings.vue` — dispatcher component |
| New component | `src/components/asr/AsrAzureSettings.vue` |
| New component | `src/components/asr/AsrElevenLabsSettings.vue` |
| New component | `src/components/asr/AsrDeepgramSettings.vue` |
| New component | `src/components/asr/AsrAssemblyAiSettings.vue` |
| New component | `src/components/asr/AsrSpeechmaticsSettings.vue` |

See [AsrProviderSettings.md](../components/AsrProviderSettings.md) for the full API of
all new components.

## What moves out

### From the template

All five conditional blocks currently guarded by:

```
v-if="form.asrConfig.asrProviderId && isAzureAsrProvider"
v-if="form.asrConfig.asrProviderId && isElevenLabsAsrProvider"
v-if="form.asrConfig.asrProviderId && isDeepgramAsrProvider"
v-if="form.asrConfig.asrProviderId && isAssemblyAiAsrProvider"
v-if="form.asrConfig.asrProviderId && isSpeechmaticsAsrProvider"
```

### From the script

- `newPhrase` ref (Azure dictionary phrase input)
- `newKeyterm` ref (AssemblyAI keyterm input)
- `newVocabWord` ref (Speechmatics vocabulary input)
- `deepgramEndpointingEnabled` ref
- `deepgramEndpointingValue` ref
- The three Deepgram endpointing watchers
- Functions for adding/removing phrases, keyterms, vocabulary words

## What stays in ProjectEditView

- ASR provider selector (`<select v-model="form.asrConfig.asrProviderId">`)
- `selectedAsrProvider`, `isAzureAsrProvider`, `isElevenLabsAsrProvider`, etc. computed
  flags — can stay in the view (they drive the provider selector label) or move into
  the dispatcher; passing `apiType` as a prop is more portable.
- All other tabs (basic, storage, apiKeys, metadata, history, danger) are untouched.

## How the voice tab looks after the refactor

```vue
<!-- Voice tab — ASR section -->
<div class="form-group">
  <label class="form-label">ASR Provider</label>
  <select class="form-select" v-model="form.asrConfig.asrProviderId" ...>...</select>
</div>

<AsrProviderSettings
  v-if="form.asrConfig.asrProviderId"
  v-model="form.asrConfig.settings"
  :api-type="selectedAsrProvider?.apiType"
  :is-read-only="isArchived"
/>
```

## Implementation steps

1. Create the `src/components/asr/` directory.
2. Create `AsrAzureSettings.vue`, `AsrElevenLabsSettings.vue`, `AsrDeepgramSettings.vue`,
   `AsrAssemblyAiSettings.vue`, `AsrSpeechmaticsSettings.vue` — one file per provider
   (see [AsrProviderSettings.md](../components/AsrProviderSettings.md)).
3. Create the `AsrProviderSettings.vue` dispatcher that maps `apiType` to the correct
   sub-component.
4. In `ProjectEditView.vue`, replace the five `v-if` blocks with the single
   `<AsrProviderSettings>` call.
5. Remove the refs and watchers that moved into the Deepgram component.
6. Remove `newPhrase`, `newKeyterm`, `newVocabWord` refs and their add/remove functions.
7. Verify TypeScript types compile clean.

## Acceptance criteria

- Selecting each of the five ASR providers renders the correct fields with correct
  default values.
- Deepgram endpointing checkbox + numeric input stays in sync with
  `form.asrConfig.settings.endpointing`.
- Azure dictionary phrases, AssemblyAI keyterms, and Speechmatics vocabulary words can
  still be added and removed.
- Saving the project form persists all provider-specific settings.
- `ProjectEditView.vue` is under 900 lines after the refactor.
- No TypeScript errors introduced.
