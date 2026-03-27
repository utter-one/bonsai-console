# BaseModal — new shared component

## What

A generic modal wrapper component used as the structural shell for all modal dialogs.
It provides the overlay, container, header, and footer regions via named slots, so each
modal focuses on its form content only.

## Why

All 20+ modal components in `src/components/modals/` follow an identical structural
pattern:

```html
<div class="modal-overlay" @click.self="emit('close')">
  <div class="modal-content" @click.stop>
    <h2 class="modal-header">{{ title }}</h2>
    <!-- form content -->
    <div class="modal-footer">
      <button class="btn-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" type="submit">Save</button>
    </div>
  </div>
</div>
```

This is ~15–20 lines repeated in every modal. Centralising it in `BaseModal` means:
- Consistent keyboard/accessibility behaviour (Escape key, focus trap) added once
- Container size variants managed via a single prop
- Click-outside-to-close logic in one place

## New file

`src/components/BaseModal.vue`

## Props

```typescript
interface Props {
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'  // default: 'md'
  fixedHeight?: boolean                         // adds fixed-height-modal class
  closeOnOverlayClick?: boolean                // default: true
}
```

## Emits

```typescript
emit('close')
```

## Slots

| Slot | Purpose |
|------|---------|
| `default` | Main modal body content (form fields, tabs, etc.) |
| `header` | Replaces the default `<h2>` title — use for custom headers with badges/links |
| `footer` | Replaces the default Cancel + Save footer — use for custom button sets |

## Template

```vue
<template>
  <div class="modal-overlay" @click.self="onOverlayClick">
    <div
      class="modal-content"
      :class="[sizeClass, { 'fixed-height-modal': fixedHeight }]"
      @click.stop
    >
      <slot name="header">
        <h2 class="modal-header">{{ title }}</h2>
      </slot>

      <slot />

      <slot name="footer">
        <div class="modal-footer">
          <button class="btn-secondary" type="button" @click="emit('close')">Cancel</button>
          <button class="btn-primary" type="submit">Save</button>
        </div>
      </slot>
    </div>
  </div>
</template>
```

`sizeClass` maps `size` prop to Tailwind width classes:
- `'sm'` → `max-w-sm`
- `'md'` → `max-w-lg` (current default for most modals)
- `'lg'` → `modal-content-lg` (existing class)
- `'xl'` → `max-w-4xl`
- `'full'` → `max-w-6xl` (current `StageActionModal` size)

## Usage example

```vue
<!-- Before -->
<div class="modal-overlay" @click.self="emit('close')">
  <div class="modal-content-lg" @click.stop>
    <h2 class="modal-header">Edit Category</h2>
    <form @submit.prevent="submit">
      <!-- fields -->
    </form>
    <div class="modal-footer">
      <button class="btn-secondary" @click="emit('close')">Cancel</button>
      <button class="btn-primary" type="submit">Save</button>
    </div>
  </div>
</div>

<!-- After -->
<BaseModal title="Edit Category" size="lg" @close="emit('close')">
  <form @submit.prevent="submit">
    <!-- fields only -->
  </form>
</BaseModal>
```

## Rollout strategy

Modals should be migrated to `BaseModal` incrementally. Priority order:

1. `KnowledgeCategoryModal` — simplest structure, good first candidate
2. `ProfileEditModal`, `IssueEditModal` — also simple
3. `ApiKeyEditModal`, `StageActionModal` — more complex (tabs + history), migrate last

## Acceptance criteria

- All migrated modals look identical to their original versions.
- Click on overlay closes the modal (when `closeOnOverlayClick` is true).
- Escape key closes the modal.
- Custom footer slot works (e.g., for modals with three action buttons).
- Custom header slot works (e.g., for modals with help links next to the title).
- No visual regression in any migrated modal.
