# useClickOutside — new composable

## What

A composable that attaches a `mousedown` event listener to `document` and calls a
callback when the user clicks outside a given element ref. It cleans up automatically
on component unmount.

## Why

The following components each implement an identical click-outside detection block:

| File | Purpose |
|------|---------|
| `src/components/LanguageSelector.vue` | Close language dropdown |
| `src/components/TimezoneSelector.vue` | Close timezone dropdown |
| `src/views/monitor/ConversationsView.vue` | Close filter dropdowns (via DOM query) |

Each implementation is 10–15 lines of `onMounted` / `onUnmounted` with a
`document.addEventListener('mousedown', handler)` pair. The
`ConversationsView` version is more complex as it uses `document.querySelector` with
class selectors instead of an element ref — this is the fragile pattern that
`FilterDropdown` + `useClickOutside` will eliminate.

## New file

`src/composables/useClickOutside.ts`

## Signature

```typescript
function useClickOutside(
  target: Ref<HTMLElement | null>,
  callback: () => void
): void
```

## Implementation

```typescript
import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useClickOutside(
  target: Ref<HTMLElement | null>,
  callback: () => void
): void {
  function handler(event: MouseEvent) {
    if (target.value && !target.value.contains(event.target as Node)) {
      callback()
    }
  }

  onMounted(() => document.addEventListener('mousedown', handler))
  onUnmounted(() => document.removeEventListener('mousedown', handler))
}
```

## Usage

```typescript
// In LanguageSelector.vue
const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

useClickOutside(containerRef, () => { isOpen.value = false })
```

This replaces the current `handleClickOutside` function + `onMounted`/`onUnmounted` calls
in `LanguageSelector` and `TimezoneSelector`.

For `FilterDropdown` the composable is called internally — consumers of `FilterDropdown`
never need to call it directly.

## Export

Add to `src/composables/index.ts`:

```typescript
export { useClickOutside } from './useClickOutside'
```

## Acceptance criteria

- Clicking outside the target element calls `callback`.
- Clicking inside the target element does not call `callback`.
- The event listener is removed when the component unmounts (no memory leaks).
- Works correctly when multiple components on the same page each use `useClickOutside`.
- Works when the `target` ref is initially `null` and is set after mount
  (the check `if (target.value && ...)` handles this).
