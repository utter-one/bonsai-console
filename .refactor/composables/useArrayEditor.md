# useArrayEditor — new composable (or utility)

## What

A set of helper functions for managing arrays of typed items in a form: get the current
array value (with a default), add an item, and remove an item by index. Optionally also
provides an item factory function to create new empty items.

## Why

The following files all implement nearly identical `getArrayValue`, `addArrayItem`, and
`removeArrayItem` helpers:

| File | Context | Notes |
|------|---------|-------|
| `src/components/JavaScriptEditor.vue` | Array-type variable values in the toolbar | `getArrayValue`, `addArrayItem`, `removeArrayItem` |
| `src/components/modals/CallToolModal.vue` | Array-type parameter values | Same three functions |
| `src/components/modals/SetVariableModal.vue` | Array-type variable values | Same three functions |

Each copy is ~15–25 lines. Because the logic is duplicated rather than shared, a fix
to array handling (e.g. ensuring a deep clone on add, or a correct splice) must be
applied in three places.

These helpers are simple enough that they can be a plain utility module rather than a
composable — they take no reactive state and return no refs.

## New file

`src/utils/arrayEditor.ts`

(Alternatively exported from `src/composables/useArrayEditor.ts` if you prefer keeping
all shared logic in composables.)

## Signature

```typescript
/**
 * Returns the value cast as T[], or an empty array if it is null/undefined/not-an-array.
 */
function getArrayValue<T>(value: unknown): T[]

/**
 * Returns a new array with `item` appended.
 * If `value` is not an array, treats it as an empty array first.
 */
function addArrayItem<T>(value: unknown, item: T): T[]

/**
 * Returns a new array with the item at `index` removed.
 */
function removeArrayItem<T>(value: T[], index: number): T[]
```

## Implementation

```typescript
export function getArrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function addArrayItem<T>(value: unknown, item: T): T[] {
  return [...getArrayValue<T>(value), item]
}

export function removeArrayItem<T>(value: T[], index: number): T[] {
  return value.filter((_, i) => i !== index)
}
```

## Usage

```typescript
// In CallToolModal.vue — before:
function getArrayValue(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}
function addArrayItem(paramName: string) {
  const current = getArrayValue(form.value.params[paramName])
  form.value.params[paramName] = [...current, '']
}
function removeArrayItem(paramName: string, index: number) {
  const current = getArrayValue(form.value.params[paramName])
  form.value.params[paramName] = current.filter((_, i) => i !== index)
}

// After:
import { getArrayValue, addArrayItem, removeArrayItem } from '@/utils/arrayEditor'

function addParam(paramName: string) {
  form.value.params[paramName] = addArrayItem(form.value.params[paramName], '')
}
function removeParam(paramName: string, index: number) {
  form.value.params[paramName] = removeArrayItem(
    getArrayValue(form.value.params[paramName]),
    index
  )
}
```

## Export

Since this is a pure utility (no Vue reactivity), place it in `src/utils/arrayEditor.ts`
and import directly — no need to add to `composables/index.ts`.

## Acceptance criteria

- `getArrayValue(null)` returns `[]`.
- `getArrayValue([1, 2, 3])` returns `[1, 2, 3]`.
- `addArrayItem([1, 2], 3)` returns `[1, 2, 3]`.
- `addArrayItem(null, 'x')` returns `['x']`.
- `removeArrayItem([1, 2, 3], 1)` returns `[1, 3]`.
- Original array is never mutated (all functions return new arrays).
- All three call sites (`JavaScriptEditor`, `CallToolModal`, `SetVariableModal`)
  are migrated to use these functions.
