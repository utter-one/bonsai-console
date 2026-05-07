### 🎫 **Task: Refactor Bonsai Console Layout to Match New Workspace Architecture**

#### 📌 **Objective**
Update the current UI shell to align with the new app layout specification. This involves restructuring the topbar, sidebar, and main content areas, implementing a CSS variable-based theming system, and adopting the refined visual style (typography, spacing, components).

---

#### 🧩 **Scope of Changes**

| Zone | Current State (Screenshot) | Target State (Reference Code) | Action Required |
|------|----------------------------|-------------------------------|-----------------|
| **Topbar** | Logo + Horizontal nav tabs (Dashboard, Design, etc.) + Project selector + Utilities | Logo + Project selector (left) • Utilities: Search shortcut, Notifications, Theme toggle, Avatar (right) | Remove horizontal nav tabs. Reorganize flex layout to match target. Bind project selector to cycle/dropdown logic. |
| **Sidebar** | Flat list under "Design" header • Version number at bottom • No search/favorites | Top search bar • Favorites section (draggable) • Collapsible groups with child items • Independent scroll | Implement search filter, favorites pinning, group accordion behavior. Replace flat list with nested structure. Remove version footer or move to settings. |
| **Main Header** | Title + subtitle + `+ New Stage` button • Search bar below | Breadcrumb trail • Title + Favorite toggle • Metadata row (updated, author, status) | Restructure header DOM. Replace static title/subtitle with dynamic breadcrumb + meta. Move search to sidebar or keep as contextual if needed. |
| **Main Body** | Data table with pagination footer • Fixed scroll on main container | Independent scrollable area • Stats grid → Activity list → Notes placeholder | Wrap content in `.main-body` with `overflow-y: auto`. Replace/adapt table view into card/list components or embed within new structure. Remove pagination footer if using infinite/scroll layout. |
| **Styling & Theme** | Dark mode default • Flat borders • Green/Red accents • System font | CSS variable tokens • Light/Dark toggle • Warm amber accent • `DM Sans` + `DM Mono` • Rounded corners (`8px`/`12px`) • Custom thin scrollbars | Migrate to `:root` variables. Implement theme toggle. Swap fonts, border radii, and color palette. Add scrollbar styling. |

---

#### ✅ **Acceptance Criteria**
- [ ] Topbar displays logo + project selector on left, utilities on right (no horizontal nav tabs)
- [ ] Sidebar contains search input, favorites section, and collapsible groups with child items
- [ ] Main panel shows breadcrumb → title/fav toggle → metadata row
- [ ] Main body scrolls independently from topbar/sidebar
- [ ] Dark/Light theme toggle works via `[data-theme="dark"]` attribute swap
- [ ] Typography uses `DM Sans` (body) and `DM Mono` (code/mono)
- [ ] Accent color changes to warm amber (`#d97706`) with proper semantic colors
- [ ] Custom thin scrollbars applied to sidebar and main body
- [ ] All existing functionality (search, table actions, project switch) remains intact or is adapted to new structure
- [ ] Layout is stable at `≥1024px` viewport width (responsive breakpoints can be added in follow-up task)

---

#### 🛠️ **Technical Notes**
- Use CSS variables for all colors, spacing, radii, and transitions (`:root` + `[data-theme="dark"]`)
- Implement event delegation for sidebar clicks to avoid inline handlers
- Favorites drag-and-drop should use native HTML5 DnD (touch support can be added later)
- Keep existing data table logic but wrap it inside the new `.main-body` container; consider adapting rows to match the new list/card aesthetic if needed
- Reference implementation: `app.html` structure with `.topbar`, `.body > .sidebar + .main`, `.toast-wrap`
