# Nexus Admin - Copilot Instructions

## Project Overview
Vue 3 + TypeScript admin panel for managing a conversational AI platform (Nexus). Uses Vite, Pinia, Vue Router, and Tailwind CSS 4.

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
- **Design** (`/design`) - Project-specific tools (personas, stages, classifiers, etc.)
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
- `.btn-danger` - Destructive action (red)
- `.btn-icon` - Icon-only button

**Layout:**
- `.modal-overlay` - Modal backdrop
- `.modal-content` - Modal container
- `.modal-header` - Modal title
- `.card` - Content card
- `.table-container` - Table wrapper
- `.flex-gap` - Flex with gap

**Status badges:**
- `.badge-active`, `.badge-inactive`, `.badge-error`, etc.

## Component Patterns

### Modal Components
- Emit `close` and `save` events
- Props: entity to edit (optional for create)
- Form state in local refs
- Example: `AdminEditModal.vue`

### View Components
- Use section layouts via `<component :is="layout">`
- Load data in `onMounted`
- Search/filter computed properties
- Handle create/edit/delete operations
- Pagination via store

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
Design section requires project context:
- Project selector in `MainLayout` syncs with route
- All design routes have `:projectId` param
- Load projects on mount from `useProjectsStore`

## Code Style

- Use Composition API (`<script setup>`)
- TypeScript strict mode
- Use `ref` for primitives, computed for derived state
- Async/await for API calls
- Try/catch/finally for error handling
- `onMounted` for initial data loads
- Path alias `@/` maps to `src/`

## Common Tasks

**Add a new CRUD view:**
```typescript
// 1. Store
export const useThingsStore = defineStore('things', () => 
  createResourceStore<ThingResponse, CreateThingRequest, UpdateThingRequest>({
    endpoint: '/things',
    resourceName: 'thing',
  })
)

// 2. View structure
const thingsStore = useThingsStore()
const searchQuery = ref('')
const showModal = ref(false)

onMounted(() => thingsStore.fetchAll())

const filtered = computed(() => 
  thingsStore.items.filter(item => item.name.includes(searchQuery.value))
)
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
