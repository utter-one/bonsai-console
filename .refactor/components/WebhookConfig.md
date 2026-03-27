# WebhookConfig — new component

## What

A component containing all configuration fields for a `webhook` tool: HTTP URL, method
selector, headers list (key/value pairs), and request body template.

## Why

The webhook section of `ToolEditView` is ~500 lines. Extracting it removes the section
from the already-crowded view and gives webhook-specific UI its own maintainable home.

## Source

Extracted from `src/views/design/ToolEditView.vue` — webhook section of the Config tab.

## New file

`src/components/tools/WebhookConfig.vue`

## Props

```typescript
interface Props {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers: Array<{ key: string; value: string }>  // webhookHeaderPairs
  body: string
  isReadOnly?: boolean
}
```

## Emits

```typescript
emit('update:url', value: string)
emit('update:method', value: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')
emit('update:headers', value: Array<{ key: string; value: string }>)
emit('update:body', value: string)
```

## Internal state

None — all state lives in the `form` object owned by `ToolEditView` and flows through
props/emits.

## Template structure

```
<div class="webhook-config space-y-6">
  <!-- URL -->
  <div class="form-group">
    <label>Webhook URL</label>
    <input type="url" :value="url" @input="emit('update:url', $event.target.value)" class="form-input" :disabled="isReadOnly" />
  </div>

  <!-- HTTP Method -->
  <div class="form-group">
    <label>Method</label>
    <div class="btn-group">
      <button v-for="m in ['GET','POST','PUT','PATCH','DELETE']" :key="m" :class="[method === m ? 'btn-primary' : 'btn-secondary']" @click="emit('update:method', m)">{{ m }}</button>
    </div>
  </div>

  <!-- Headers -->
  <div class="form-group">
    <label>Headers</label>
    <div v-for="(header, index) in headers" :key="index" class="flex gap-2 mb-2">
      <input :value="header.key" @input="updateHeaderKey(index, $event)" class="form-input flex-1" placeholder="Key" :disabled="isReadOnly" />
      <input :value="header.value" @input="updateHeaderValue(index, $event)" class="form-input flex-1" placeholder="Value" :disabled="isReadOnly" />
      <button @click="removeHeader(index)" :disabled="isReadOnly" class="btn-icon"><X :size="16" /></button>
    </div>
    <button @click="addHeader" :disabled="isReadOnly" class="btn-secondary">Add header</button>
  </div>

  <!-- Body -->
  <div class="form-group">
    <label>Request body</label>
    <textarea :value="body" @input="emit('update:body', $event.target.value)" class="form-textarea" :disabled="isReadOnly" />
  </div>
</div>
```

`addHeader`, `removeHeader`, `updateHeaderKey`, `updateHeaderValue` are internal helpers
that produce a new headers array and emit `update:headers`.

## Acceptance criteria

- URL input binds and saves correctly.
- Method selector updates on click.
- Headers can be added and removed; key and value inputs update independently.
- Body textarea binds and saves correctly.
- `isReadOnly` disables all inputs and buttons.
- All changes propagate through `update:*` emits into `ToolEditView`'s `form`.
