# Project Snapshots — Frontend Specification

## Overview

Project snapshots capture a point-in-time copy of all project configuration (agents, stages, classifiers, tools, etc.). Users can create named snapshots, compare two snapshots to see diffs, and restore a project back to a previous snapshot.

**API:** All endpoints are project-scoped under `/api/projects/{id}/snapshots/`. The generated API client exposes `projectsSnapshots*` methods.

## User Stories

1. As an operator of Bonsai, I want to create a snapshot before making risky changes so I can roll back if needed.
2. As an operator of Bonsai, I want to see all snapshots for a project with their version, name, and entity counts.
3. As an operator of Bonsai, I want to compare two snapshots to understand what changed between them.
4. As an operator of Bonsai, I want to restore a project to a previous snapshot to undo changes.
5. As an operator of Bonsai, I want to rename snapshots for better identification.
6. As an operator of Bonsai, I want to delete old snapshots I no longer need.

## UI Architecture

### 1. Top Bar Button (MainLayout)

Add a **snapshot button** in the top bar, immediately to the right of the project selector dropdown. Only visible when a project is selected.

```
[Project Selector ▼] [📸 Snapshots]  |  [Dark] [Help] [User]
```

**Button design:**
- Icon: `Snapshot` (lucide-vue-next) or `ArchiveRestore` 
- Text label: "Snapshots" (hidden on narrow screens, icon-only)
- Disabled when no project is selected (same logic as project selector)
- Shows total snapshot count as a small badge when count > 0
- Clicking opens the **SnapshotListModal**

**Placement in MainLayout.vue:** Inside the `<header>` element, after the project selector `<div>` and before the `<div class="flex-1" />` spacer.

**State:**
- Import `useSnapshotsStore` + `useProjectSelectionStore`
- `v-show="projectSelectionStore.selectedProjectId"` 
- Fetch snapshot count on mount and after project change (use `fetchAll(projectId, { limit: 1 })` then read `pagination.total`)
- Refresh count after create/delete operations

### 2. SnapshotListModal

Primary modal for browsing and managing snapshots.

**Props/Emits:** `@close`

**Layout:** Table-based list with action buttons.

**Columns:**
| Column | Content | Width |
|---|---|---|
| Version | `v.1`, `v.2`, etc. (mono font, right-aligned) | 60px |
| Name | Snapshot name or "(unnamed)" in italics | flex-1 |
| Created | RelativeDate component | 120px |
| Entities | Summary badge: "3 agents, 12 stages, ..." (truncated with tooltip) | 180px |
| Schema | Badge: green "compatible", red "incompatible", gray "unknown" | 100px |
| Actions | Rename (edit icon), Compare (git-compare icon), Restore (rotate-ccw icon), Delete (trash icon) | 140px |

**Features:**
- Paginated list (50 items default, PaginationControls at bottom)
- Text search input (searches snapshot names) — uses API's `textSearch` param
- "Create Snapshot" button in header
- Sort by version descending (API default)
- Loading state while fetching
- Empty state: "No snapshots yet. Create one to save your project's current state."

**Actions per row:**
- **Rename** → opens inline edit or RenameSnapshotModal
- **Compare** → opens SnapshotCompareModal with this snapshot pre-selected as baseline
- **Restore** → opens RestoreConfirmationModal
- **Delete** → opens DeleteConfirmationModal

**Size:** `3xl` or `xl` (wide enough for the table)

### 3. CreateSnapshotModal

Simple modal for creating a new snapshot.

**Form:**
- **Name** (optional, `maxlength=256`): Single text input. Help text: "Optional label to identify this snapshot."
- **Entity counts preview**: Read-only display showing current project entity counts (fetched from current project resources or from a `/summary` endpoint). Shows: "This snapshot will capture: X agents, Y stages, Z classifiers, ..."
- **Warning**: If project has no entities, show info message: "Your project is empty. The snapshot will be created but contain no data."

**Actions:**
- "Create Snapshot" (primary, disabled during loading)
- "Cancel" (secondary)

**On success:** Close modal, emit refresh event to parent SnapshotListModal

### 4. SnapshotCompareModal

Side-by-side comparison of two snapshots.

**Header:** Two version selectors side by side
- "From: v.{X}" dropdown (select snapshot version)
- "To: v.{Y}" dropdown (select snapshot version)
- "Compare" button (disabled if same version or both empty)

**Results area (after comparison):**
- **Summary bar**: "X added, Y removed, Z modified, W unchanged"
- **Tabbed view** with tabs: Added, Removed, Modified
  - **Added tab**: List of entities added in target snapshot, grouped by type
  - **Removed tab**: List of entities removed in target snapshot, grouped by type
  - **Modified tab**: List of `EntityDiff` entries showing field-level changes

**Modified entity detail:**
- Expandable rows showing entity name and type
- On expand, shows a table of `FieldChange` entries:
  | Field | From | To |
  |---|---|---|
  | `llmSettings.model` | `gpt-4` | `claude-3` |

**Size:** `3xl` (needs width for comparison tables)

### 5. RestoreConfirmationModal

Confirmation modal for restoring from a snapshot.

**Content:**
- Snapshot details: version, name, created date
- Entity counts summary
- Schema status warning if `schemaStatus === 'incompatible'`: "⚠️ This snapshot was taken with a different API schema. Migration steps will be applied during restore."
- **Warning**: "This will replace all current project configuration with the snapshot data. A backup snapshot will be created automatically before restore."
- Confirmation checkbox: "I understand this will overwrite my current project"

**On success:**
- Show restore result with `SnapshotRestoreResponse`
- Display warnings if any (`RestoreWarning[]`)
- Show entity counts after restore
- Close modal and emit refresh event

**Size:** `lg`

### 6. DeleteConfirmationModal

Standard confirmation modal for deleting a snapshot.

**Content:**
- Snapshot details: version, name
- **Warning**: "This action cannot be undone. Deleting this snapshot will permanently remove it."
- If it's the latest snapshot: additional warning about losing the most recent backup

**Size:** `md`

### 7. RenameSnapshotModal (optional — or inline)

Simple inline rename within SnapshotListModal, or a small modal.

**Form:**
- Single text input pre-filled with current name
- "Save" / "Cancel" buttons

**Size:** `sm` (if modal) or inline (preferred)

## Implementation Plan

### Phase 1: Store
- `src/stores/snapshots.ts` — hand-written store (non-standard CRUD due to compare/restore endpoints)
- Reuse patterns from `createProjectResourceStore` for list/detail/create/update/delete
- Add custom methods: `compare(projectId, fromVersion, toVersion)`, `restore(projectId, snapshotId)`, `fetchByVersion(projectId, version)`

### Phase 2: Modals
- `src/components/modals/SnapshotListModal.vue`
- `src/components/modals/CreateSnapshotModal.vue`
- `src/components/modals/SnapshotCompareModal.vue`
- `src/components/modals/RestoreConfirmationModal.vue`

### Phase 3: Top Bar Integration
- Add snapshot button to `MainLayout.vue` header
- Wire up store + modal state
- Badge counter logic

### Phase 4: Polish
- Dark mode styling
- Empty states, loading states, error handling
- Responsive behavior (mobile-friendly modals)

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `projectsSnapshotsList(id, query?)` | `GET /api/projects/{id}/snapshots` | Paginated list with `offset`, `limit`, `textSearch` |
| `projectsSnapshotsCreate(id, data)` | `POST /api/projects/{id}/snapshots` | Create snapshot with optional `name` |
| `projectsSnapshotsDetail(id, snapshotId)` | `GET /api/projects/{id}/snapshots/{snapshotId}` | Full snapshot with entity data |
| `projectsSnapshotsVersionDetail(id, version)` | `GET /api/projects/{id}/snapshots/version/{version}` | Get by version number |
| `projectsSnapshotsPartialUpdate(id, snapshotId, data)` | `PATCH /api/projects/{id}/snapshots/{snapshotId}` | Update `name` only |
| `projectsSnapshotsDelete(id, snapshotId)` | `DELETE /api/projects/{id}/snapshots/{snapshotId}` | Delete snapshot |
| `projectsSnapshotsCompareList(id, query)` | `GET /api/projects/{id}/snapshots/compare` | Compare `fromVersion` vs `toVersion` |
| `projectsSnapshotsRestoreCreate(id, snapshotId)` | `POST /api/projects/{id}/snapshots/{snapshotId}/restore` | Restore project from snapshot |

## Types (from `data-contracts.ts`)

All types are auto-generated and re-exported via `@/api/types`:
- `SnapshotResponse` — metadata (id, version, name, createdBy, createdAt, schemaStatus, entityCounts)
- `SnapshotFullResponse` — full snapshot with `entityData: Record<string, any>`
- `SnapshotListResponse` — paginated `{ items, total, offset, limit }`
- `CreateSnapshotRequest` — `{ name?: string | null }`
- `UpdateSnapshotNameRequest` — `{ name?: string | null }`
- `SnapshotComparisonResponse` — `{ fromVersion, toVersion, summary, diffs, added, removed }`
- `ComparisonSummary` — `{ entitiesAdded[], entitiesRemoved[], entitiesModified[], entitiesUnchanged }`
- `EntityDiff` — `{ entityType, entityId, entityName, changes: FieldChange[] }`
- `FieldChange` — `{ field, from?, to? }`
- `AddedRemovedEntity` — `{ entityType, entity: Record<string, any> }`
- `SnapshotRestoreResponse` — `{ restored, snapshotVersion, schemaMigrated?, schemaMigrationSteps?, entityCounts, warnings? }`
- `RestoreWarning` — `{ type, entityType?, entityId?, entityName?, field?, message }`
- `SnapshotDeleteResponse` — `{ deleted, snapshotId }`
- `EntityCounts` — counts for agents, stages, classifiers, contextTransformers, tools, globalActions, guardrails, knowledgeCategories, knowledgeItems, sampleCopies, copyDecorators, testers, scenarios, quickPrompts
