# Changelog

## [v0.2.0] – 2026-03-20

### New Features
- **Entity history tab** – all editable entities now have a History tab showing full change history (#239)
- **Stage actions search** – client-side search/filter for actions within the stage editor (#240)
- **Project language** – projects can now have a language code configured; new `LanguageSelector` component (#237)
- **Change Visibility effect** – new effect type for controlling UI element visibility (#236)
- **LLM Model Badge** – model names are now displayed as badges across agent, stage, and related views (#235)
- **App version & About modal** – version number shown in the UI with an About modal (#227)
- **Project import / export** – projects can be exported to and imported from JSON (#224)
- **Date range filter** – conversations and audit log views now support filtering by date range (#231)
- **Issue status change** – issue status can be updated directly from the Issues list view (#230)
- **User profile editing** – operator user profile variables can be edited from the Users view (#229)
- **Tool type categorization** – tools now carry a `toolType` property for grouping and display (#232)
- **Webhooks & scripts as tools** – webhook and script run operations moved from actions into the Tools section

### Improvements
- Command events are now included in conversation turn event ordering and classification (#238, #241)
- Action effects editor refactored into a dedicated `ActionEffectsEditor` component with full-tab modal layout
- Provider edit view reorganized: config sections split into separate components, provider registry extracted (#223)
- Renamed "Guardrails & Moderation" section to "Guardrails" (#228)

### Bug Fixes
- Fixed missing `command` event type in conversation event classification (#241)
- Fixed incorrect turn event display ordering for command events
- Fixed missing types for the Change Visibility effect
- Fixed Import button showing wrong icon (was Upload)

### Style
- Updated type badge styling for improved visibility in the effects editor
- Adjusted padding and layout for the effect selection modal

### Documentation
- Updated tool documentation for clarity and consistency
- Updated contributing guidelines to clarify branching and versioning practices

---

## [v0.1.0] – initial release
