# Bonsai Console — Agent Instructions

## Project
Vue 3 admin panel for the [Bonsai](https://github.com/bonsai-platform) conversational AI platform. Three areas: **Design** (build AI assistants), **Monitor** (watch conversations/users), **Administration** (projects, providers, access).

- **Tech stack:** Vue 3 (`<script setup>`, `defineModel`, props destructure), TypeScript, Pinia, Vue Router 4, Tailwind CSS 4, Vite 5
- **API client:** Axios + generated from OpenAPI (`swagger-typescript-api`)
- **Editor:** CodeMirror 6 (JavaScript, Liquid, Markdown)
- **Charts:** Chart.js via vue-chartjs
- **Rich text:** Milkdown Crepe
- **Icons:** lucide-vue-next
- **Docs:** VitePress

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Builds docs, fetches OpenAPI + WS contracts from backend, regenerates API types, starts Vite |
| `npm run build` | `vue-tsc -b` → `vite build` → `npm run docs:build` (VitePress) |
| `npm run generate:api` | Regenerates typed API client from `src/api/openapi.json` |
| `npm run generate:ws-types` | Regenerates WebSocket message types |
| `npm run preview` | Preview production build locally |

**Type-checking:** `vue-tsc -b` (project references via `tsconfig.json`). No separate linter/formatter.

## Architecture
- **Entry:** `src/main.ts` → Vue app + Pinia + Router
- **Alias:** `@` → `src/`
- **API client:** Axios instance in `src/api/client.ts` with auto token refresh (401 → `/api/auth/refresh`). Generated API wrapper in `src/api/generated/Api.ts`.
- **Generated code:** `src/api/generated/` — do NOT hand-edit. Regenerate via `npm run generate:api`. Post-generation patches go in `scripts/patch-contracts.js`.
- **Types:** Re-exported from `src/api/types.ts` → `src/api/generated/data-contracts.ts` + local `ApiErrorDetail`, `ApiError`, `ParsedError` interfaces.
- **State:** Pinia stores in `src/stores/`. Most use `createResourceStore` or `createProjectResourceStore` from `stores/utils/resource.ts` (CRUD factory). Auth, conversations, editor settings, layout, playground and project selection stores are hand-written.
- **UI:** Vue 3 `<script setup>` + Tailwind CSS 4 + Lucide icons. Components in `src/components/`, views in `src/views/`.

### Directory structure
```
src/
├── api/                    # API client, generated types, contracts
│   ├── client.ts           # Axios instance with token refresh
│   ├── types.ts            # Re-exports + local error types
│   └── generated/          # Auto-generated (do NOT edit)
├── components/             # Reusable UI components
├── composables/            # Vue composables (hooks)
├── layouts/                # Page layouts
│   ├── MainLayout.vue                    # Root layout with sidebar + nav
│   ├── SectionLayout.vue                 # Base section layout component
│   ├── DesignSectionLayout.vue           # Design section layout
│   ├── TestingSectionLayout.vue          # Testing section layout
│   ├── MonitorSectionLayout.vue          # Monitor section layout
│   └── AdministrationSectionLayout.vue   # Administration section layout
├── router/                 # Route definitions + auth guard
├── stores/                 # Pinia stores
│   ├── utils/resource.ts   # CRUD factory: createResourceStore, createProjectResourceStore
│   └── index.ts            # Barrel export of all stores
├── utils/                  # Utility functions (error parsing, PDF, etc.)
└── views/                  # Page-level components
    ├── DashboardView.vue       # Dashboard page
    ├── PlaygroundView.vue      # Playground page
    ├── auth/               # Login, Setup
    ├── design/             # Design section views
    ├── monitor/            # Monitor section views
    ├── administration/     # Admin section views
    └── testing/            # Testing section views
```

## Routing
Routes defined in `src/router/index.ts` with lazy-loaded components and auth guard (`router.beforeEach`).

- **Public routes:** `/login`, `/setup` — `meta: { requiresAuth: false }`
- **Protected routes:** All under `/` in `MainLayout` — `meta: { requiresAuth: true }`
- **Auth redirect:** Unauthenticated users → `/login?redirect=...`. Authenticated users on `/login` → `/dashboard`.
- **Setup check:** Before auth check, verifies backend setup status. If incomplete → `/setup`.
- **Sections:** Design, Testing, Monitor, Administration — each has a section layout with its own sidebar navigation.

**Route pattern convention:** `design.projects/:projectId/stages`, `monitor.conversations/:conversationId`, etc.

## Stores (Pinia)
### CRUD factory stores
Most stores use the factory pattern from `src/stores/utils/resource.ts`:

```typescript
// Non-project-scoped (global resources like operators, providers)
export const useFooStore = defineStore('foo', () => {
  const { items, currentItem, isLoading, error, pagination, fetchAll, fetchById, create, update, remove } =
    createResourceStore<FooModel, FooCreateRequest, FooUpdateRequest>({
      endpoint: '/api/foos',
      resourceName: 'foos',          // maps to apiClient.foosList, fooCreate, etc.
      apiResourceName: 'foos',       // camelCase API method suffix
    })
  return { items, currentItem, isLoading, error, pagination, fetchAll, fetchById, create, update, remove }
})

// Project-scoped resources (agents, stages, classifiers, tools, etc.)
export const useBarStore = defineStore('bar', () => {
  const { items, currentItem, isLoading, error, pagination, fetchAll, fetchById, create, update, remove } =
    createProjectResourceStore<BarModel, BarCreateRequest, BarUpdateRequest>({
      endpoint: '/api/projects/:projectId/bars',
      resourceName: 'Bars',          // human-readable name
      apiResourceName: 'bars',       // maps to projectsBarsList, projectsBarsCreate, etc.
    })
  return { items, currentItem, isLoading, error, pagination, fetchAll, fetchById, create, update, remove }
})
```

**Generated API method naming:** `{resourceName}List`, `{resourceName}Detail`, `{resourceName}Create`, `{resourceName}Update`, `{resourceName}Delete`, `{resourceName}AuditLogsList`. For project resources: `projects{Capitalized}{ResourceName}List`, etc.

**Counting items:** Use `store.pagination.total` (from the API response) instead of `store.items.length` for accurate counts. This works even when fetching with a small `limit` parameter, avoiding unnecessary data transfer. E.g., `fetchAll(pid, { limit: 1 })` then read `pagination.total`.

### Hand-written stores
- `auth.ts` — Authentication (login, logout, refresh, profile)
- `conversations.ts` — Conversation list/detail management
- `editorSettings.ts` — Editor block highlight settings (persisted in localStorage)
- `layout.ts` — UI layout state (sidebar items, titles)
- `playground.ts` — Playground conversation active state
- `projectSelection.ts` — Currently selected project across the app (persisted in localStorage)
- `theme.ts` — Dark/light theme toggle (persisted in localStorage)

### CRUD factory stores
Project-scoped resources: `agents`, `classifiers`, `contextTransformers`, `knowledge`, `stages`, `tools`
Global resources: `analytics`, `apiKeys`, `auditLogs`, `copyDecorators`, `environments`, `globalActions`, `guardrails`, `issues`, `languages`, `operators`, `projects`, `providerCatalog`, `providers`, `sampleCopies`, `scenarioRuns`, `scenarios`, `testers`, `timezones`, `users`, `version`

### Project selection store
`useProjectSelectionStore` manages selected project globally. Pattern:
```typescript
const projectSelectionStore = useProjectSelectionStore()
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
```

## Component patterns
### FormField + CompositeFormField
- **FormField** — `<FormField label="Name" required :error="error" path="name">`. Use standalone mode with label for top-level fields, child mode (no label) inside `CompositeFormField`.
- **Standalone width:** Always add `class="w-full"` on standalone FormFields in modals/forms. Without a width class, FormField defaults to `w-fit` (content-width), which will not stretch to fill the container.
- **CompositeFormField** — groups child FormFields under one label/error via provide/inject. Use for multi-section forms.
- Fields register their `path` for nested error resolution.

### BaseModal + Modals
- **BaseModal** — `<BaseModal title="..." size="lg" @close="...">`. Sizes: `sm`, `md`, `lg`, `3xl`, `xl`, `full`. Pressing Escape emits `close`.
- **Modal components** (in `components/modals/`) — emit `close` and `save` events. Form state in local refs.

### TabNavigator
```vue
<TabNavigator v-model="activeTab" :tabs="[
  { key: 'general', label: 'General' },
  { key: 'advanced', label: 'Advanced' }
]" />
<template #general>...</template>
```

### MetadataTab
Displays read-only metadata with `{ label, value, format? }` fields. Formats: `'date'`, `'mono'`, `'default'`. Use `v-model` + `tab` props to self-register as a tab panel (e.g., `<MetadataTab v-model="activeTab" tab="metadata" :fields="...">`).

### TagsEditor
Standard component for editing tag arrays. Takes `v-model` (string array), optional `disabled` and `helpText`. Has its own label built-in, so don't wrap in FormField.

### Other reusable components
- **TabContent** — Tab panel wrapper matching `TabNavigator`
- **PaginationControls** — Page navigation for paginated lists
- **FloatingDropdown** — Dropdown menus with click-outside dismissal
- **ErrorDisplay** — Renders `ParsedError` messages
- **RelativeDate** — Relative time display with full-date tooltip
- **DateTimeRangePicker** — Date range selection component

## Composables (src/composables/)
| Composable | Purpose |
|---|---|
| `useActionForm` | Form submission with loading/error states |
| `useSearch` | Debounced search input |
| `useTabNavigation` | Keyboard tab navigation within components |
| `useClickOutside` | Click-outside detection for dropdowns/modals |
| `useContextualHelp` | Contextual help tooltip system |
| `useCopyPaste` | Copy-to-clipboard and paste handling |
| `useMediaUpload` | File upload with progress tracking |
| `useSpreadsheetBehavior` | Spreadsheet-like cell navigation (arrow keys, tab) |
| `useWebSocketClient` | WebSocket connection management |
| `useWebRtcClient` | WebRTC client for voice/video conversations |
| `useAudioRecording` / `useAudioPlayback` / `useAudioDevices` | Audio recording and playback |
| `useConversationPreviews` | Conversation preview generation |
| `useVersionPoller` | Periodic version polling for changes |
| `useLlmProviderSelect` | LLM provider selection dropdown |
| `useProjectReadOnly` | Read-only project data loading |

### Built-in utilities in `composables/index.ts`
- `useApiOperation<T>()` — Generic API operation with loading/error/data state
- `usePagination({ store, pageSize })` — Pagination helper for paginated stores
- `useTableSort(storageKey)` — Table sorting with localStorage persistence. Returns `{ sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon }`. Use `ArrowUpDown`, `ArrowUp`, `ArrowDown` from lucide-vue-next via `getSortIcon()`.
- `useConfirm()` — Simple `window.confirm` wrapper
- `useAuth()` — Auth helper returning `{ isAuthenticated, currentUser, requireAuth, login, logout }`
- `formatEnum()`, `formatDate()`, `formatRelativeTime()` — Display formatters

## TypeScript patterns
- **Project model interface:** All resources have a model type with `id: string | number` and `version?: number`.
- **Create/Update requests:** Separate types for create (all required fields) vs update (all optional). Usually auto-generated from OpenAPI.
- **Error types:** Use `ParsedError` from `@/api/types` for API errors. Parse with `parseApiError(err)` from `@/utils/errors`.
- **Type re-exports:** All generated types re-exported via `src/api/types.ts`. Import from `@/api/types`, not directly from generated files.

## View patterns
Views follow a consistent structure:
1. Load resources on mount (or when projectId changes)
2. Show loading state while fetching
3. Show empty state if no items
4. Render list/detail view with appropriate components
5. Use section layout sidebar for navigation context

**Detail views** (`UserDetailView`, `DistributionListDetailView`, `OutboundCampaignDetailView`) share a common pattern:
- **Container**: Flex column with border, rounded corners, white/gray-800 background: `flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800`
- **Header**: Larger title (`text-2xl font-bold`), icon-only back button, resource name + ID subtitle in monospace
- **Tabs**: `tabs-container` wrapper around `<TabNavigator>`. First tab is "General" or "Overview", last tab is "Metadata" (self-registering `<MetadataTab>`). Custom tabs use `<TabContent v-model="activeTab" tab="key">`.
- **Content area**: `flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800` with `mx-auto` inner div

**Common imports:**
```typescript
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectSelectionStore } from '@/stores'
import { useFooStore } from '@/stores/foo'
```

## Tailwind utility classes (from `utilities.css`)
### Buttons
`.btn-primary`, `.btn-primary-hardright`, `.btn-primary-hardleft`, `.btn-secondary`, `.btn-alt`, `.btn-alt-hardright`, `.btn-alt-hardleft`, `.btn-danger`, `.btn-sm`, `.btn-link`, `.btn-icon`, `.btn-icon-danger`, `.filter-btn`, `.filter-btn-icon`

### Forms
`.form-group`, `.form-label`, `.form-input`, `.form-input-error`, `.form-input-mono`, `.form-input-disabled`, `.form-textarea`, `.form-select`, `.form-select-auto`, `.form-help-text`, `.form-checkbox`, `.checkbox-label`, `.input-icon-container`, `.input-icon-left`, `.input-icon-right`, `.input-with-left-icon`, `.input-with-right-icon`, `.input-with-both-icons`

### Layout
`.card`, `.card-info`, `.table-container`, `.table-wrapper`, `.table`, `.table-header`, `.table-header-cell`, `.table-header-cell-sortable`, `.table-body`, `.table-row`, `.table-cell`, `.table-cell-mono`, `.table-cell-right`, `.table-footer`, `.project-card`, `.stat-card`, `.action-card`, `.section-card`, `.list-item`, `.container-constrained`

### Modals
`.modal-overlay`, `.modal-content`, `.modal-content-sm`, `.modal-content-lg`, `.modal-header`, `.modal-footer`, `.fixed-height-modal`

### Badges & Tags
`.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-active`, `.badge-error`, `.badge-secondary`, `.badge-violet`, `.badge-orange`, `.tag-list`, `.tag-item`, `.badge-configured`, `.badge-unconfigured`

### Other
`.page-header`, `.page-title`, `.page-subtitle`, `.empty-state`, `.loading-state`, `.error-state`, `.search-container`, `.search-input`, `.tabs-nav`, `.tab-button`, `.tab-button-active`, `.metadata-container`, `.construction-view`, `.pagination`, `.auth-container`, `.auth-card`, `.alert-error`, `.alert-success`, `.alert-info`, `.alert-warning`, `.spinner`

## Dark mode
Dark mode is supported via `dark:` Tailwind variants. Toggle via the theme store (`useThemeStore`). CSS classes use `dark:` prefix for dark mode styling throughout.

## Environment variables
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/` | Backend API base URL |

## Key conventions
- API types are generated from a local `openapi.json` fetched at dev-time from the backend (`VITE_API_BASE_URL`). If the backend adds new endpoints, run `npm run dev` to regenerate.
- Manual type changes to `data-contracts.ts` will be lost on regeneration — put them in `scripts/patch-contracts.js` or fix at the source (OpenAPI spec).
- Auth tokens stored in `localStorage` (`accessToken`, `refreshToken`). Cleared on logout.
- Builder panel state persisted in `localStorage` keys: `builderPanelOpen`, `builderSessionId_{projectId}`.
- Project selection persisted in `localStorage` (`selectedProjectId`).

## Vite config notes
- `defineModel: true` and `propsDestructure: true` enabled in Vue plugin
- Source maps enabled for production
- Chunk splitting: `vue-vendor` (vue, vue-router, pinia), `ui-vendor` (lucide-vue-next)
- VitePress docs served at `/help/` during development

## Documentation (VitePress)
- Any `{{ }}` expressions outside fenced code blocks break the build (interpreted as Vue interpolation). Wrap in `<code v-pre>...</code>` instead of backticks.
- Docs live in `docs/`, built via `vitepress build docs`.

## Finishing changes
- ALWAYS run `npm run build` before finishing. Update docs for any new features or changes.

## CI
Runs on `dev` branch only: Node 24 → `npm install` → `npm run build`.
