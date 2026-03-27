# ConversationsView — Replace manual dropdown state with FilterDropdown

## Why

`ConversationsView.vue` manages four filter dropdowns (status, user, starting stage,
ending stage) each with its own `showXDropdown` boolean ref and a shared
`handleClickOutside` handler that queries the DOM by CSS selector to detect clicks
outside each dropdown. This pattern:

- Adds ~40 lines of boilerplate per dropdown (ref + DOM query + click-outside coupling)
- Requires exact selector strings (`'.status-filter-dropdown'`, etc.) to be kept in
  sync with the template
- Cannot be unit-tested without a full DOM environment

Replacing them with a self-contained `FilterDropdown` component removes ~150 lines and
eliminates the manual DOM querying entirely.

## Affected files

| Role | File |
|------|------|
| Source (modified) | `src/views/monitor/ConversationsView.vue` |
| New component | `src/components/FilterDropdown.vue` — see [FilterDropdown.md](../components/FilterDropdown.md) |

## What changes in ConversationsView

### Remove

- `showStatusDropdown`, `showUserDropdown`, `showStartingStageDropdown`,
  `showEndingStageDropdown` refs
- `handleClickOutside` function and the `dropdownPairs` array it iterates
- `onMounted` / `onUnmounted` calls that attach/detach `handleClickOutside`
- The CSS selector strings used to identify each dropdown panel

### Replace template blocks

Each current pattern:

```vue
<div class="relative status-filter-dropdown">
  <button @click="showStatusDropdown = !showStatusDropdown" class="btn-secondary">
    {{ selectedStatusLabel }}
    <ChevronDown :size="14" />
  </button>
  <div v-if="showStatusDropdown" class="dropdown-panel ...">
    <button
      v-for="option in statusOptions"
      :key="option.value"
      @click="selectStatus(option); showStatusDropdown = false"
    >
      {{ option.label }}
    </button>
  </div>
</div>
```

Becomes:

```vue
<FilterDropdown :label="selectedStatusLabel">
  <button
    v-for="option in statusOptions"
    :key="option.value"
    class="dropdown-item"
    @click="selectStatus(option)"
  >
    {{ option.label }}
  </button>
</FilterDropdown>
```

`FilterDropdown` manages its own open/close state and click-outside detection
internally (using `useClickOutside` — see [useClickOutside.md](../composables/useClickOutside.md)).

## Implementation steps

1. Create `useClickOutside` composable.
2. Create `FilterDropdown.vue` using `useClickOutside` internally.
3. In `ConversationsView.vue`:
   a. Remove the four dropdown refs and the click-outside handler.
   b. Remove `onMounted`/`onUnmounted` event listener registrations related to
      dropdowns (keep any others that exist for different purposes).
   c. Replace each dropdown `<div>` block with `<FilterDropdown>`.
4. Verify that selecting a filter option closes the dropdown automatically (the
   component closes on any slot content click via a `@click` handler on the panel).

## Acceptance criteria

- All four filter dropdowns open and close correctly.
- Clicking outside any open dropdown closes it without affecting others.
- Selecting a filter option applies the filter and closes the dropdown.
- The DOM no longer contains any `.status-filter-dropdown`, `.user-filter-dropdown`,
  etc. class identifiers used for click-outside detection.
- No TypeScript errors introduced.
