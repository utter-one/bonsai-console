# TabNavigator — new shared component

## What

A compound of two components — `TabNavigator.vue` (the tab button bar) and `TabPanel.vue`
(a conditionally-visible content wrapper) — that together replace the repeated tab
navigation pattern found in 6+ files.

## Why

The following files all implement tab navigation using the same template pattern:

```vue
<nav class="tabs-nav">
  <button
    v-if="condition"
    @click="activeTab = 'details'"
    :class="['tab-button', { 'tab-button-active': activeTab === 'details' }]"
  >
    Details
  </button>
  <button
    v-if="isEditMode"
    @click="activeTab = 'history'"
    :class="['tab-button', { 'tab-button-active': activeTab === 'history' }]"
  >
    History
  </button>
</nav>

<div v-show="activeTab === 'details'">...</div>
<div v-show="activeTab === 'history'">...</div>
```

Files with this pattern: `ActionForm.vue`, `ApiKeyEditModal.vue`, `KnowledgeCategoryModal.vue`,
`StageActionModal.vue`, `AgentEditView.vue`, `StageEditView.vue` (and more edit views).

Extracting this removes ~15–20 lines of structural boilerplate per file and gives a
single place to adjust tab styling.

## New files

- `src/components/TabNavigator.vue`
- `src/components/TabPanel.vue`

---

## `TabNavigator.vue`

Renders the `<nav>` bar with tab buttons.

### Props

```typescript
interface TabDefinition {
  key: string
  label: string
  icon?: Component    // lucide-vue-next icon component
  show?: boolean      // default: true — controls v-if on the button
  badge?: string      // small text badge (e.g. "Beta", flask icon label)
}

interface Props {
  modelValue: string              // activeTab
  tabs: TabDefinition[]
}
```

### Emits

```typescript
emit('update:modelValue', key: string)
```

### Template

```vue
<nav class="tabs-nav">
  <button
    v-for="tab in visibleTabs"
    :key="tab.key"
    :class="['tab-button', { 'tab-button-active': modelValue === tab.key }]"
    type="button"
    @click="emit('update:modelValue', tab.key)"
  >
    <component v-if="tab.icon" :is="tab.icon" :size="14" class="mr-1" />
    {{ tab.label }}
    <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
  </button>
</nav>
```

`visibleTabs = computed(() => tabs.filter(t => t.show !== false))`

---

## `TabPanel.vue`

A lightweight wrapper that shows its slot only when the `name` matches the active tab.
Uses `v-show` (not `v-if`) to preserve form state between tab switches.

### Props

```typescript
interface Props {
  name: string          // this panel's tab key
  activeTab: string     // currently active tab key
}
```

### Template

```vue
<template>
  <div v-show="name === activeTab">
    <slot />
  </div>
</template>
```

---

## Usage example

```vue
<script setup>
const activeTab = ref('details')

const tabs = computed(() => [
  { key: 'details', label: 'Details' },
  { key: 'history', label: 'History', show: !!props.apiKey },
])
</script>

<template>
  <TabNavigator v-model="activeTab" :tabs="tabs" />

  <TabPanel name="details" :active-tab="activeTab">
    <!-- form fields -->
  </TabPanel>

  <TabPanel name="history" :active-tab="activeTab">
    <EntityHistoryView ... />
  </TabPanel>
</template>
```

## Rollout strategy

Migrate files incrementally, starting with the simplest:

1. `KnowledgeCategoryModal.vue` — 2 tabs (details / history)
2. `ApiKeyEditModal.vue` — 2 tabs
3. `ActionForm.vue` — 4 tabs (basic / trigger / parameters / effects)
4. `StageActionModal.vue` — delegates to `ActionForm`, may require no direct change
5. Edit views (`AgentEditView`, `StageEditView`, etc.) — 5–8 tabs each, migrate last

## Acceptance criteria

- Tab switching works correctly in all migrated files.
- The `show: false` condition hides a tab button (identical to current `v-if` guards).
- Active tab styling is identical to the current `tab-button-active` class behaviour.
- Form state is preserved when switching between tabs (v-show, not v-if).
- No TypeScript errors introduced.
