# AsrProviderSettings — new component family

## What

A dispatcher component plus five provider-specific child components that together replace
the five ASR provider `v-if` blocks in `ProjectEditView`'s voice tab.

## Why

The five provider blocks (Azure, ElevenLabs, Deepgram, AssemblyAI, Speechmatics) account
for ~1 000 lines in `ProjectEditView`. Three of them manage dynamic lists (dictionary
phrases, keyterms, vocabulary words) with their own add/remove refs. Deepgram has three
interconnected watchers for its endpointing checkbox/value pair. Isolating each provider
in its own file makes the complexity contained and eliminates three refs + three watchers
from the view's script.

## Source

Extracted from `src/views/administration/ProjectEditView.vue` — voice tab ASR section.

## New files

```
src/components/asr/
  AsrProviderSettings.vue       ← dispatcher
  AsrAzureSettings.vue
  AsrElevenLabsSettings.vue
  AsrDeepgramSettings.vue
  AsrAssemblyAiSettings.vue
  AsrSpeechmaticsSettings.vue
```

---

## `AsrProviderSettings.vue` — dispatcher

### Props

```typescript
interface Props {
  modelValue: AsrSettings            // form.asrConfig.settings
  apiType: string | undefined        // selectedAsrProvider?.apiType
  isReadOnly?: boolean
}
```

### Emits

```typescript
emit('update:modelValue', settings: AsrSettings)
```

### Template

```vue
<template>
  <component
    :is="activeComponent"
    v-if="activeComponent"
    v-model="localSettings"
    :is-read-only="isReadOnly"
    class="asr-provider-settings"
  />
</template>
```

`activeComponent` is a computed that maps `apiType` to the correct child component:

```typescript
const componentMap: Record<string, Component> = {
  azure: AsrAzureSettings,
  elevenlabs: AsrElevenLabsSettings,
  deepgram: AsrDeepgramSettings,
  assemblyai: AsrAssemblyAiSettings,
  speechmatics: AsrSpeechmaticsSettings,
}
const activeComponent = computed(() => apiType ? componentMap[apiType] : undefined)
```

---

## `AsrAzureSettings.vue`

### Props / Emits

```typescript
// v-model: AsrAzureConfig
interface AsrAzureConfig {
  language?: string
  audioFormat?: string
  dictionaryPhrases?: string[]
}
```

### Fields rendered

- Language text input
- Audio Format select (MP3, Opus, AAC, FLAC, WAV, PCM variants, μ-law, A-law, Linear16)
- Dictionary Phrases list: add input + add button, removable pill list

### Internal state

- `newPhrase: string` — input ref for adding a phrase (moved from `ProjectEditView`)

---

## `AsrElevenLabsSettings.vue`

### Props / Emits

```typescript
// v-model: AsrElevenLabsConfig
interface AsrElevenLabsConfig {
  modelId?: string
  audioFormat?: string
  languageCode?: string
  includeTimestamps?: boolean
  includeLanguageDetection?: boolean
  commitStrategy?: 'manual' | 'vad'
  vadSilenceThreshold?: number
  vadThreshold?: number
  minSpeechDuration?: number
  minSilenceDuration?: number
  enableLogging?: boolean
}
```

### Fields rendered

- Model ID input
- Audio Format select (PCM variants)
- Language Code input
- Include Timestamps checkbox
- Include Language Detection checkbox
- Commit Strategy select (manual / VAD)
- VAD sub-section (shown only when `commitStrategy === 'vad'`):
  - VAD Silence Threshold, VAD Threshold, Min Speech Duration, Min Silence Duration
- Enable Logging checkbox

---

## `AsrDeepgramSettings.vue`

### Props / Emits

```typescript
// v-model: AsrDeepgramConfig
interface AsrDeepgramConfig {
  modelId?: string
  audioFormat?: string
  language?: string
  interimResults?: boolean
  endpointing?: number | false            // false = disabled
  smartFormat?: boolean
  punctuate?: boolean
  diarize?: boolean
  utteranceEnd?: number
  vadEvents?: boolean
  enableLogging?: boolean
}
```

### Fields rendered

- Model ID input
- Audio Format select
- Language input
- Interim Results checkbox
- **Endpointing** — checkbox (enabled/disabled) + numeric input (ms value)
  - The three-watcher sync pattern from `ProjectEditView` is encapsulated here
- Smart Format, Punctuate, Diarize checkboxes
- Utterance End numeric input
- VAD Events checkbox
- Enable Logging checkbox

### Internal state

- `endpointingEnabled: boolean` — local checkbox ref
- `endpointingValue: number` — local numeric ref
- Two watchers syncing `endpointingEnabled` + `endpointingValue` → `modelValue.endpointing`
- One watcher initialising local refs from incoming `modelValue.endpointing`

---

## `AsrAssemblyAiSettings.vue`

### Props / Emits

```typescript
// v-model: AsrAssemblyAiConfig
interface AsrAssemblyAiConfig {
  sampleRate?: number
  formatTurns?: boolean
  speechModel?: string
  language?: string
  keytermPrompts?: string[]
  vadThreshold?: number
  endOfTurnConfidence?: number
  minEndOfTurnSilence?: number
  maxTurnSilence?: number
  inactivityTimeout?: number
}
```

### Fields rendered

- Sample Rate select
- Format Turns checkbox
- Speech Model select
- Language input
- Keyterm Prompts list: add input + button, removable pill list
- VAD Threshold, End of Turn Confidence, Min End of Turn Silence,
  Max Turn Silence, Inactivity Timeout numeric inputs

### Internal state

- `newKeyterm: string` — input ref for adding a keyterm (moved from `ProjectEditView`)

---

## `AsrSpeechmaticsSettings.vue`

### Props / Emits

```typescript
// v-model: AsrSpeechmaticsConfig
interface AsrSpeechmaticsConfig {
  audioFormat?: string
  transcriptionMode?: 'standard' | 'enhanced'
  enablePunctuation?: boolean
  enableFormatting?: boolean
  enableDiarization?: boolean
  language?: string
  additionalVocab?: string[]
  maxDelay?: number
}
```

### Fields rendered

- Audio Format select
- Transcription Mode select (standard / enhanced)
- Enable Punctuation, Enable Formatting, Enable Diarization checkboxes
- Language input
- Additional Vocabulary list: add input + button, removable pill list
- Max Delay numeric input

### Internal state

- `newVocabWord: string` — input ref (moved from `ProjectEditView`)

---

## Container styling

Each provider component uses the existing styled container from `ProjectEditView`:

```html
<div class="space-y-6 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r mt-4
            dark:bg-blue-900/20 dark:border-blue-800">
```

## Acceptance criteria

- Dispatcher renders the correct child for each of the five provider api types.
- Unknown / empty `apiType` renders nothing.
- Azure dictionary phrases, AssemblyAI keyterms, and Speechmatics vocabulary words
  can be added and removed.
- Deepgram endpointing checkbox + numeric field stay in sync with `modelValue.endpointing`.
- ElevenLabs VAD sub-section shows only when commit strategy is `'vad'`.
- All field changes propagate up through `update:modelValue` to `ProjectEditView`.
- Saving the project persists all provider-specific settings.
- `ProjectEditView.vue` is under 900 lines after this extraction.
