# TtsProviderSettingsPanel — new component

## What

A component that renders TTS (text-to-speech) provider-specific configuration fields
based on the active provider's API type. It replaces the five sequential `v-if` blocks
in `AgentEditView`'s voice tab.

## Why

Five provider blocks — ElevenLabs, OpenAI, Deepgram, Cartesia, Azure — currently sit
inline in `AgentEditView`, adding ~350 lines of if/else template to the view. Any fix
to a shared accessibility or interaction pattern (e.g., a slider component, a label
style) must be applied in five places. A single component with type-driven rendering
fixes this.

## Source

Extracted from `src/views/design/AgentEditView.vue` — voice tab provider blocks.

## New file

`src/components/TtsProviderSettingsPanel.vue`

## Props

```typescript
interface Props {
  modelValue: AgentTtsSettings          // form.ttsSettings (full settings object)
  apiType: string | undefined           // selectedProviderApiType
  availableModels: CatalogModel[]       // computed from catalog
  availableVoices: CatalogVoice[]       // computed from catalog
  availableAudioFormats: string[]       // computed from catalog
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:modelValue', settings: AgentTtsSettings)
```

All field changes inside the panel produce a full updated `settings` object via
`update:modelValue`. This keeps the parent binding simple (`v-model="form.ttsSettings"`).

## Internal state

- `emotionTagsInput` — computed getter/setter converting Cartesia emotion array
  to/from comma-separated string (currently in `AgentEditView`)
- `modelValue_` — local computed wrapping the prop for convenience
- Watch on `modelValue.model` — resets voice when model changes
  (currently in `AgentEditView`)

## Provider blocks to render

| apiType value | Section title | Key fields |
|---------------|--------------|------------|
| `'elevenlabs'` | ElevenLabs settings | Stability, Similarity Boost, Style, Speaker Boost, Speed, Global Preview, Inactivity Timeout, Sentence Splitter, Remove Exclamation Marks |
| `'openai'` | OpenAI settings | Instructions (textarea), Speed |
| `'deepgram'` | Deepgram settings | Sample Rate, Bit Rate, Container format |
| `'cartesia'` | Cartesia settings | Language, Speed (named options), Emotion Tags, Max Buffer Delay |
| `'azure'` | Azure settings | Model (Neural/Standard), Voice ID, Audio Format, Style, Rate, Pitch |
| `'amazon_polly'` | *(no provider-specific block — Amazon Polly uses model/voice/format from shared selectors)* | — |

## Template structure

```vue
<template>
  <div v-if="apiType" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
    <!-- ElevenLabs -->
    <template v-if="apiType === 'elevenlabs'">
      <h3 class="...">ElevenLabs settings</h3>
      <!-- sliders + checkboxes -->
    </template>

    <!-- OpenAI -->
    <template v-else-if="apiType === 'openai'">
      <h3 class="...">OpenAI settings</h3>
      <!-- instructions textarea + speed slider -->
    </template>

    <!-- Deepgram -->
    <template v-else-if="apiType === 'deepgram'">
      <h3 class="...">Deepgram settings</h3>
      <!-- sample rate + bit rate + container selects -->
    </template>

    <!-- Cartesia -->
    <template v-else-if="apiType === 'cartesia'">
      <h3 class="...">Cartesia settings</h3>
      <!-- language + speed + emotion + buffer delay -->
    </template>

    <!-- Azure -->
    <template v-else-if="apiType === 'azure'">
      <h3 class="...">Azure settings</h3>
      <!-- model + voiceId + format + style + rate + pitch -->
    </template>
  </div>
</template>
```

## Acceptance criteria

- Selecting ElevenLabs provider renders all ElevenLabs-specific sliders and checkboxes.
- Selecting OpenAI renders instructions textarea and speed slider only.
- Selecting Deepgram renders sample rate, bit rate, and container selects.
- Selecting Cartesia renders language, speed (named), emotion tags, and buffer delay.
- Selecting Azure renders model, voice ID, audio format, style, rate, and pitch.
- Selecting Amazon Polly renders no provider-specific block (component renders nothing).
- All field changes propagate through `update:modelValue`.
- Changing model resets voice if the current voice is not valid for the new model.
- `AgentEditView` voice tab section is under 80 lines after this extraction.
