# Bonsai Console - Copilot Instructions

## Project Overview
Vue 3 + TypeScript admin panel for managing a conversational AI platform (Bonsai). Uses Vite, Pinia, Vue Router, and Tailwind CSS 4.

## Architecture Patterns

### Store Pattern (Pinia)
All stores use the **resource store factory** pattern in `stores/utils/resource.ts`:
- Generic CRUD operations: `fetchAll`, `fetchById`, `create`, `update`, `remove`
- Consistent state structure: `items`, `currentItem`, `isLoading`, `error`, `pagination`
- Auto-syncs local state after mutations
- Usage: `createResourceStore<EntityType, CreateRequest, UpdateRequest>({ endpoint, resourceName })`

**Example:**
```typescript
export const useAdminsStore = defineStore('admins', () => {
  return createResourceStore<AdminResponse, CreateAdminRequest, UpdateAdminRequest>({
    endpoint: '/admins',
    resourceName: 'admin',
  })
})
```

### API Client
- Located in `api/client.ts`
- Axios-based with interceptors for auth tokens
- Auto-adds `Authorization: Bearer {token}` header
- Auto-refreshes expired tokens (401 responses)
- Base URL: `VITE_API_BASE_URL` or `http://localhost:3000/api`

### Routing Structure
Three main sections with nested routes:
- **Design** (`/design`) - Project-specific tools (agents, stages, classifiers, etc.)
  - All routes require `projectId` param
- **Monitor** (`/monitor`) - Conversations, users, issues, audit logs
- **Administration** (`/administration`) - Admins, projects, environments, providers

Auth guards enforce `requiresAuth` meta flag.

### Layouts
- `MainLayout.vue` - Top-level with navigation sidebar
- Section layouts (`AdministrationSectionLayout`, `DesignSectionLayout`) - Nested section-specific layouts
- Design section has project selector that syncs with route params

### Type Definitions
All API types in `types/api.ts`:
- Request/Response types mirror backend OpenAPI spec
- Pagination: `PaginationParams` + `PaginatedResponse<T>`
- Naming convention: `{Entity}Response`, `Create{Entity}Request`, `Update{Entity}Request`

## File Organization

```
src/
├── api/           - API client + OpenAPI schema
├── assets/        - Static assets
├── components/    - Reusable components (modals, etc.)
├── composables/   - Vue composables
├── layouts/       - Page layouts
├── router/        - Vue Router config
├── stores/        - Pinia stores
│   └── utils/     - Store utilities (resource factory)
├── types/         - TypeScript types
└── views/         - Route components
    ├── auth/
    ├── administration/
    ├── design/
    └── monitor/
```

## Styling Conventions

### Tailwind CSS 4
- Use utility classes extensively
- Add utility classes in `utilities.css` for common patterns if needed
- Common patterns defined in `utilities.css`

### Utility Classes (from `utilities.css`)
**Forms:**
- `.form-group` - Form field container
- `.form-label` - Field labels
- `.form-input` - Text inputs
- `.form-input-disabled` - Disabled inputs
- `.form-textarea` - Textareas
- `.form-checkbox` - Checkboxes
- `.form-select` - Dropdowns

**Buttons:**
- `.btn-primary` - Primary action (blue)
- `.btn-secondary` - Secondary action (gray)
- `.btn-alt` - Alternative action (violet) — also `.btn-alt-hardright`, `.btn-alt-hardleft` for split-button layouts
- `.btn-danger` - Destructive action (red)
- `.btn-icon` - Icon-only button

**Layout:**
- `.modal-overlay` - Modal backdrop
- `.modal-content` - Modal container
- `.modal-header` - Modal title
- `.card` - Content card
- `.table-container` - Table wrapper
- `.flex-gap` - Flex with gap

**Metadata:**
- `.metadata-container` - Metadata grid container
- `.metadata-item` - Individual metadata field
- `.metadata-label` - Metadata field label
- `.metadata-value` - Metadata field value

**Status badges:**
- `.badge-active`, `.badge-inactive`, `.badge-error`, etc.

## Component Patterns

### MetadataTab Component
Unified component for displaying read-only metadata in edit views:
- Used in all edit views (Admin, Provider, Agent, Classifier, etc.)
- Displays resource metadata (ID, version, timestamps, etc.)
- Props: `fields` array with `{ label, value, format? }` structure
- Format options: `'date'` (auto-formats timestamps), `'mono'` (monospace font), `'default'`
- Automatically handles null/undefined values (displays "N/A")
- Supports `tab` / `v-model` props for use with the tab system (same pattern as `TabContent`)

**Example:**
```typescript
import MetadataTab from '@/components/MetadataTab.vue'

const metadataFields = computed(() => {
  if (!currentResource.value) return []
  return [
    { label: 'Resource ID', value: currentResource.value.id, format: 'mono' as const },
    { label: 'Version', value: currentResource.value.version },
    { label: 'Created', value: currentResource.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentResource.value.updatedAt, format: 'date' as const },
  ]
})
```

In template:
```vue
<MetadataTab
  v-if="isEditMode && currentResource"
  v-model="activeTab"
  tab="metadata"
  :fields="metadataFields"
/>
```

### TabContent Component
Wraps a tab's content with `v-show` and `data-tab` attribute. Works with `useTabNavigation` to auto-switch tabs on validation errors.

Props:
- `tab` — the tab key string (matches `TabNavigator` key)
- `modelValue` — the currently active tab (bind with `v-model`)

**Example:**
```vue
import TabContent from '@/components/TabContent.vue'

// In script: provide activeTab ref
const activeTab = ref<'general' | 'advanced'>('general')
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

// In template:
<TabContent v-model="activeTab" tab="general">
  <!-- fields -->
</TabContent>
<TabContent v-model="activeTab" tab="advanced">
  <!-- fields -->
</TabContent>
```

Extra conditions go on the `TabContent` element itself, not inside:
```vue
<!-- Only mount when editing -->
<TabContent v-model="activeTab" tab="metadata" v-if="isEditMode">
  ...
</TabContent>
```

### FormField Component
Standard form field wrapper. Has two modes depending on whether it is a direct child of `CompositeFormField`.

**Standalone mode** (default): renders `div.form-group` with label, required/optional badge, error ring on the inner wrapper, and error/help text below.

Props:
- `label` — field label text
- `error` — `ParsedError | null` from the store
- `path` — field path for error matching (e.g. `'name'`, `['actions', 0, 'name']`)
- `required` — shows `*` badge; default shows `(optional)`
- `hint` — replaces the required/optional badge with custom text
- `help` — help text shown when no error is present
- Class passthrough: applied to the inner wrapper div. Defaults to `w-fit`; pass any `w-*` class to override.

```vue
import FormField from '@/components/FormField.vue'

<FormField label="Name" required :error="error" path="name" class="w-full" help="Human-readable name">
  <input v-model="form.name" class="form-input" />
</FormField>

<FormField label="Description" :error="error" path="description" class="w-full">
  <textarea v-model="form.description" class="form-textarea" />
</FormField>
```

**Child mode** (inside `CompositeFormField`): no label, no help text, no `form-group` wrapper. Only renders a plain div with the error ring. Path is automatically registered with the parent.

```vue
<CompositeFormField label="Provider" required :error="error" help="Select provider and configure settings">
  <div class="flex gap-2">
    <FormField path="providerId">
      <select v-model="form.providerId" class="form-select-auto" />
    </FormField>
    <FormField path="providerSettings">
      <button type="button" class="btn-secondary">Settings...</button>
    </FormField>
  </div>
</CompositeFormField>
```

### CompositeFormField Component
Container for grouped controls that share a single label and a single error text. Uses provide/inject so child `FormField`s auto-register their paths — no manual `paths` array needed.

Props: identical to `FormField` standalone (`label`, `error`, `required`, `hint`, `help`).

The parent shows the first error found across all registered child paths. Each child `FormField` shows an error ring independently.

```vue
import CompositeFormField from '@/components/CompositeFormField.vue'
import FormField from '@/components/FormField.vue'

<CompositeFormField label="LLM Provider" required :error="error" help="Select a provider then configure its settings">
  <div class="flex flex-col md:flex-row gap-2">
    <FormField path="llmProviderId">
      <select :value="form.llmProviderId" @change="handleProviderChange" class="form-select-auto min-w-64">
        <option value="">Select a provider</option>
        <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </FormField>
    <FormField path="llmSettings">
      <button type="button" @click="showSettings = true" class="btn-secondary">Settings...</button>
    </FormField>
  </div>
</CompositeFormField>
```

### Modal Components
- Emit `close` and `save` events
- Props: entity to edit (optional for create)
- Form state in local refs
- Example: `AdminEditModal.vue`

### View Components
- Use section layouts via `<component :is="layout">`
- Load data in `onMounted`
- Search/filter computed properties
- Delay search where user is typing (300ms debounce)
- Handle create/edit/delete operations
- Pagination via `usePagination` composable + `PaginationControls` component

### Icons
Use `lucide-vue-next` for all icons:
```vue
import { User, Search, X } from 'lucide-vue-next'
```

## Development Guidelines

### Adding New Resources
1. Define types in `types/api.ts` (`{Entity}Response`, `Create{Entity}Request`, `Update{Entity}Request`)
2. Create store using `createResourceStore` in `stores/{entity}.ts`
3. Add routes to `router/index.ts`
4. Create view in `views/{section}/{Entity}View.vue`
5. Create edit modal in `components/modals/{Entity}EditModal.vue` if needed
6. **For Design views:** Use `useProjectSelectionStore` and watch `projectId` computed to reload data

### Authentication
- Tokens stored in `localStorage`: `accessToken`, `refreshToken`
- `useAuthStore` manages auth state
- Protected routes use `requiresAuth: true` meta
- Navigation guard redirects to `/login` if not authenticated

### Error Handling
- Stores catch errors and set `error.value`
- Display errors in UI using store's `error` ref
- API errors include `message` field

### Project-Specific Features
**Project Selection Store:**
- `useProjectSelectionStore` manages currently selected project across app
- Used in both Design and Monitor sections for filtering data by project
- MainLayout syncs store with route params and project selector dropdown
- **Design views:** All list and edit views use `projectSelectionStore.selectedProjectId` instead of `route.params.projectId`
- **Monitor views:** Use `projectSelectionStore.selectedProjectId` for optional project filtering
- Pattern: `const projectId = computed(() => projectSelectionStore.selectedProjectId || '')`

**Design Section:**
- All Design routes have `:projectId` param in URL for bookmarking/sharing
- DesignSectionLayout shows "No Project Selected" message if store is empty
- MainLayout syncs project selector with route and auto-navigates on selection
- Views watch `projectId` computed (derived from store) to reload data

## Code Style

- Use Composition API (`<script setup>`)
- TypeScript strict mode
- Use `ref` for primitives, computed for derived state
- Async/await for API calls
- Try/catch/finally for error handling
- `onMounted` for initial data loads
- Path alias `@/` maps to `src/`
- Don't use horizontal bars in comments (like ──) to divide sections of code

## Common Tasks

**Add a new CRUD view with pagination:**
```typescript
// 1. Store
export const useThingsStore = defineStore('things', () => 
  createResourceStore<ThingResponse, CreateThingRequest, UpdateThingRequest>({
    endpoint: '/things',
    resourceName: 'thing',
  })
)

// 2. View structure
import { usePagination } from '@/composables'
import PaginationControls from '@/components/PaginationControls.vue'

const thingsStore = useThingsStore()
const searchQuery = ref('')
const showModal = ref(false)

const pagination = usePagination({
  store: thingsStore,
  pageSize: 20,
  onPageChange: loadThings
})

async function loadThings() {
  await thingsStore.fetchAll(pagination.getParams())
}

onMounted(() => loadThings())

const filtered = computed(() => 
  thingsStore.items.filter(item => item.name.includes(searchQuery.value))
)
```

In template:
```vue
<PaginationControls
  :pagination="pagination"
  :displayed-count="filtered.length"
  resource-name="things"
/>
```

**Update route params:**
```typescript
watch(selectedProjectId, (newId) => {
  router.push({ name: route.name, params: { ...route.params, projectId: newId } })
})
```

**Handle form submission:**
```typescript
async function submit() {
  try {
    await store.create(form.value)
    showModal.value = false
    form.value = initialState()
  } catch (err) {
    // Error already set in store
  }
}
```

## Documentation Conventions

Docs are built with VitePress (`npm run docs:build`). VitePress uses Vue under the hood, so `{{ }}` outside of fenced code blocks is interpreted as Vue template interpolation and will break the build.

### Handlebars / Template Expressions in Docs

Any Handlebars-style expression (e.g. `{{schema}}`, `{{vars.name}}`, `{{{json context}}}`) referenced **outside a fenced code block** — such as in prose, tables, or bullet points — must be wrapped in `<code v-pre>` instead of backticks:

```markdown
<!-- ✗ breaks the build -->
`{{schema}}`

<!-- ✓ correct -->
<code v-pre>{{schema}}</code>
```

Inside fenced code blocks (` ``` `) the expressions are safe as-is and do not need `v-pre`.
