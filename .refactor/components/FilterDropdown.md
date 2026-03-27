# FilterDropdown — new shared component

## What

A self-contained dropdown button component that manages its own open/close state and
handles click-outside detection internally. Used to replace the repeated per-dropdown
ref + click-outside-handler pattern in `ConversationsView` and potentially elsewhere.

## Why

`ConversationsView` currently has four separate `showXDropdown` boolean refs and a
`handleClickOutside` function that iterates a `dropdownPairs` array, using
`document.querySelector` with hard-coded CSS class selectors to find each dropdown's
container. This creates tight coupling between script logic and template class names.

A self-contained `FilterDropdown` component encapsulates open state and click-outside
detection, removing ~40 lines of boilerplate per dropdown.

## New file

`src/components/FilterDropdown.vue`

## Props

```typescript
interface Props {
  label: string             // button label (e.g. "All statuses", "User: abc123")
  active?: boolean          // true when a non-default filter is applied — highlights button
  disabled?: boolean
  align?: 'left' | 'right' // dropdown panel alignment, default 'left'
}
```

## Emits

None — the component manages its own open state and closes when an item inside the
slot is clicked (via event delegation on the panel wrapper).

## Slots

| Slot | Purpose |
|------|---------|
| `default` | Dropdown panel items (buttons, dividers, etc.) |

## Template

```vue
<template>
  <div ref="containerRef" class="relative">
    <!-- Trigger button -->
    <button
      :class="['btn-secondary', { 'filter-active': active }]"
      :disabled="disabled"
      type="button"
      @click="toggle"
    >
      {{ label }}
      <ChevronDown :size="14" class="ml-1" />
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="isOpen"
      class="dropdown-panel absolute z-20 mt-1 min-w-48 bg-white dark:bg-gray-800
             border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      :class="align === 'right' ? 'right-0' : 'left-0'"
      @click="close"
    >
      <slot />
    </div>
  </div>
</template>
```

The `@click="close"` on the panel wrapper means clicking any item inside (a `<button>`
or `<a>`) automatically closes the dropdown — no explicit close call needed in the
slot content.

## Composable usage

Uses `useClickOutside` internally:

```typescript
const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

function toggle() { isOpen.value = !isOpen.value }
function close() { isOpen.value = false }

useClickOutside(containerRef, close)
```

## Usage in ConversationsView

```vue
<!-- Before -->
<div class="relative status-filter-dropdown">
  <button @click="showStatusDropdown = !showStatusDropdown" class="btn-secondary">
    {{ selectedStatusLabel }}
    <ChevronDown :size="14" />
  </button>
  <div v-if="showStatusDropdown" class="dropdown-panel ...">
    <button v-for="s in statusOptions" @click="selectStatus(s); showStatusDropdown = false">
      {{ s.label }}
    </button>
  </div>
</div>

<!-- After -->
<FilterDropdown :label="selectedStatusLabel" :active="statusFilter !== null">
  <button
    v-for="s in statusOptions"
    :key="s.value"
    class="dropdown-item"
    @click="selectStatus(s)"
  >
    {{ s.label }}
  </button>
</FilterDropdown>
```

## Acceptance criteria

- Clicking the trigger button opens the dropdown panel.
- Clicking any item in the slot content closes the panel.
- Clicking outside the component closes the panel.
- The `active` prop changes the button appearance to indicate a filter is applied.
- Multiple `FilterDropdown` instances on the page operate independently.
- `disabled` prop prevents opening.
- No TypeScript errors introduced.
