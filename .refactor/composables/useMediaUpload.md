# useMediaUpload — new composable

## What

A composable that encapsulates the `FileReader`-based upload logic for image and audio
files, converting them to the structured `{ type, data, mimeType, format }` objects
expected by action parameters and variable values.

## Why

The following components each contain nearly identical `handleAudioUpload` and
`handleImageUpload` functions:

| File | Functions |
|------|-----------|
| `src/components/ActionEffectsEditor.vue` | `handleAudioUpload`, `handleImageUpload` |
| `src/components/modals/CallToolModal.vue` | `handleAudioUpload`, `handleImageUpload` |
| `src/components/modals/SetVariableModal.vue` | `handleAudioUpload`, `handleImageUpload` |

Each copy is ~30–50 lines: creates a `FileReader`, reads as Data URL, splits on `,` to
extract MIME type, maps MIME to a format enum string, and produces the structured output
object. Any change to format detection or MIME handling must currently be applied in
three places.

## New file

`src/composables/useMediaUpload.ts`

## Signature

```typescript
interface AudioUploadResult {
  type: 'audio'
  data: string          // base64-encoded WITHOUT the Data URL prefix
  mimeType: string      // e.g. 'audio/mpeg'
  format: 'pcm' | 'mp3' | 'wav' | 'opus'
}

interface ImageUploadResult {
  type: 'image'
  data: string          // base64-encoded WITHOUT the Data URL prefix
  mimeType: string      // e.g. 'image/png'
  format: 'png' | 'jpeg' | 'webp' | 'gif'
}

function useMediaUpload(): {
  handleAudioUpload: (event: Event) => Promise<AudioUploadResult | null>
  handleImageUpload: (event: Event) => Promise<ImageUploadResult | null>
}
```

Both functions return a Promise that resolves when the FileReader finishes, or `null`
if no file was selected or reading fails.

## Implementation sketch

```typescript
export function useMediaUpload() {
  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target!.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAudioUpload(event: Event): Promise<AudioUploadResult | null> {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return null
    const dataUrl = await readFileAsDataUrl(file)
    const [prefix, data] = dataUrl.split(',') as [string, string]
    const mimeType = prefix.match(/:(.*?);/)?.[1] ?? 'audio/mpeg'
    const format = mimeType.includes('wav') ? 'wav'
                 : mimeType.includes('opus') ? 'opus'
                 : mimeType.includes('ogg') ? 'opus'
                 : 'mp3'
    return { type: 'audio', data, mimeType, format }
  }

  async function handleImageUpload(event: Event): Promise<ImageUploadResult | null> {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return null
    const dataUrl = await readFileAsDataUrl(file)
    const [prefix, data] = dataUrl.split(',') as [string, string]
    const mimeType = prefix.match(/:(.*?);/)?.[1] ?? 'image/png'
    const format = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpeg'
                 : mimeType.includes('webp') ? 'webp'
                 : mimeType.includes('gif') ? 'gif'
                 : 'png'
    return { type: 'image', data, mimeType, format }
  }

  return { handleAudioUpload, handleImageUpload }
}
```

## Usage

```typescript
// In CallToolModal.vue
const { handleAudioUpload, handleImageUpload } = useMediaUpload()

async function onAudioFileSelected(event: Event, paramName: string) {
  const result = await handleAudioUpload(event)
  if (result) form.value.params[paramName] = result
}
```

## Export

Add to `src/composables/index.ts`:

```typescript
export { useMediaUpload } from './useMediaUpload'
```

## Acceptance criteria

- `handleAudioUpload` correctly identifies MP3, WAV, Opus/OGG formats from MIME type.
- `handleImageUpload` correctly identifies PNG, JPEG, WebP, GIF formats.
- Both functions return `null` when no file is selected (e.g. user cancels the dialog).
- The `data` field contains base64 without the `data:mime/type;base64,` prefix.
- All three call sites (`ActionEffectsEditor`, `CallToolModal`, `SetVariableModal`)
  are migrated to use this composable.
