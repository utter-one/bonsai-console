# Navigating the Console

This page helps you find your way around the Bonsai Console interface.

## Main Sections

The left sidebar divides the console into three main areas:

### Design
Where you build and configure your AI assistant's behavior. Everything here is scoped to the currently selected project. This includes stages, agents, classifiers, context transformers, tools, global actions, guardrails, moderation, global memory (with constants), and knowledge.

### Monitor
Where you observe what's happening in real time and review historical data. Browse conversations, view user profiles, review flagged issues, track analytics and performance metrics, and check audit logs.

### Administration
Where you manage the platform itself. Create projects, set up environments, configure AI service providers, manage API keys, and control operator access.

## Project Selector

The **project selector** is the dropdown near the top of the page. Since most features are scoped to a specific project, you'll need to select one before working in the Design or Monitor sections.

When you switch projects:
- All lists and forms reload with data from the new project.
- The URL updates so you can bookmark or share links to specific project views.

If no project is selected, the Design section will show a prompt asking you to pick one.

## Common Interface Patterns

### Lists and Search

Most resource views (Agents, Stages, Conversations, etc.) show a searchable list. Use the search bar at the top to filter by name or other fields. Results update as you type (with a brief delay for smooth performance).

### Pagination

Long lists are paginated. Use the controls at the bottom of a list to navigate between pages. The current page count and total items are displayed.

### Create, Edit, Delete

- **Create** — Look for a "Create" or "+" button, usually in the top-right area of a list view.
- **Edit** — Click on any item in a list to open its edit view, or look for an edit icon.
- **Delete** — Available in the edit view or via an action menu. Deletions require confirmation.

### Tabs in Edit Views

When editing a resource like a stage or agent, the edit view is organized into tabs. For example, a stage might have tabs for "General", "Actions", "Variables", and "Metadata". The Metadata tab shows read-only information like the resource's ID, creation date, and version number.

### Dark Mode

Toggle between light and dark themes using the icon in the top-right corner of the navigation bar.

## Keyboard Shortcuts

- Use standard browser shortcuts for navigation (Back, Forward, Refresh).
- The search bar in list views is focused when you open the page, so you can start typing immediately.
