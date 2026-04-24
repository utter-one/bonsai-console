# Changelog

## [v0.4.0] – 2026-04-24

### New Features
- **Analytics Funnels** – new funnel analysis view in Analytics; step-based funnel construction using action fire events (including guardrail events); draft saving for both funnels and explorer views (#326, #327, #329)
- **Ollama LLM provider** – Ollama added as a supported LLM provider with a configuration interface and API settings (#321)
- **Secrets management** – new UI for revealing masked secret values in provider configurations; `RevealSecretModal` component with secure reveal flow (#336)
- **Markdown in playground** – message events in the playground now render as Markdown using `marked` and DOMPurify for safe HTML output (#324, #325)
- **Version update notifications** – new `useVersionPoller` composable periodically checks for a newer app version and shows an in-app notification when one is available (#337, #338)
- **Starting stage in conversations** – `startingStageId` surfaced through API data contracts; jump-to-stage handles null stage gracefully (#322)
- **Relative timestamps** – new `RelativeDate` component renders dates as human-readable relative times (e.g. "2 hours ago"); rolled out across list and detail views (#333, #334, #335)

### Improvements
- **WebRTC audio channel** – voice recording in WebRTC mode now uses the native media channel; improved remote audio stream handling and playback quality (#328)
- **Stages list simplified** – "Enter Behavior" column removed from the stages table; stage rows now show additional action-type icons for a denser overview (#323)
- **Stage feature tooltips** – stage feature icon badges now display descriptive tooltips for improved discoverability (#332)
- **Playground components extracted** – `PlaygroundAudioPanel`, `PlaygroundConnectionPanel`, and `PlaygroundEventFeed` split out of `PlaygroundView`; conversation status badge and label evaluation extracted to utility functions; shared preview-modal logic moved to a composable (#316)
- **Navigation layout** – top navigation bar styles improved with better auto-sizing for varying project name lengths (#331)

### Bug Fixes
- Fixed null-stage crash in the jump-to-stage handler (#322)

### Documentation
- Updated Providers documentation to clarify sensitive data handling and secret value masking (#336)

---

## [v0.3.0] – 2026-04-10

### New Features
- **Server-side VAD** – full end-to-end implementation of server-side Voice Activity Detection: streaming controls with auto-start/stop, integrated VU meter, VAD mode audio streaming, and a project-level VAD settings modal (#265, #266, #267, #268)
- **Sample Copies** – new Sample Copies section in Design: spreadsheet-like editing with multi-select cells, column width persistence, copy decorator support, enforcement mode, and save-on-demand for both copies and decorators (#272, #278, #279)
- **Analytics Explorer** – new `ExploreView` for ad-hoc data exploration with dimension/metric pickers, drill-down, chart visualisation, two-phase aggregation (`normalizeBy`), relative time range, and saved queries with create/rename/share/unshare support (#281, #282, #283, #285, #287)
- **Token usage analytics** – token usage tracking view with trend chart; improved latency analysis view; both views updated with `DateTimeRangePicker` (#280, #288)
- **Project cost management** – project-level token cost limits with per-model entries, `CostLimitEntryModal` with validation, and sortable cost table in the project edit view (#290)
- **Moderation execution modes** – new moderation execution mode options in the Moderation section; `ConfigureModerationActionModal` for managing moderation responses with visibility change effect support (#291, #292, #294)
- **Twilio channels** – Twilio provider support for messaging and voice channels (#297)
- **API key permissions** – expanded API key editor with channel and feature security settings, input/output feature validation, and a sortable table layout for keys (#263)
- **User banning** – operators can now ban users directly from the Users view; new `ban user` action effect added (#256)
- **Execution plan in conversation timeline** – new execution plan event type with detailed structure, Gantt chart rendering, and entity name resolution for stages, classifiers, and transformers (#261)
- **Detailed timing metrics** – stage transition and prompt rendering times now shown in the conversation timeline (#258)
- **Conversation events pagination** – timeline in the conversation detail view is now paginated for long conversations (#269)
- **Audit log enhancements** – entity type filter added; audit log entries now show human-readable entity names and version numbers (#273, #275)
- **Dashboard improvements** – issue counts and aborted conversation statistics added to the dashboard (#260)
- **WebRTC client** – preliminary `BonsaiWebRTCClient` for audio streaming via WebRTC
- **Profile edit API validation** – API validation errors are now surfaced properly in the operator profile edit flow (#304)
- **Auth permissions** – authentication store extended with permissions handling and updated operator profile structure (#295)
- **Documentation Dockerfile** – separate `Dockerfile-docs` for building and serving the documentation site (#309)

### Improvements
- Unified data validation and error handling across all entity editors — errors from the API are now consistently parsed and displayed in form fields (#296, #303)
- `FloatingDropdown` component now used throughout the application, replacing ad-hoc custom filter dropdowns
- `BaseModal` and `TabNavigator` components introduced and rolled out across modals and tabbed views
- Provider type filter no longer shows embeddings and storage options (#298)
- `StageEditView` memory, actions, and lifecycle tabs extracted into dedicated sub-components (#308)
- Tool type-specific tabs extracted into separate component files (#307)
- ASR settings extracted into separate components; ASR configuration moved to a modal in `ProjectEditView` (#266, #268)
- `formatDate` utility centralised in composables; removed duplicate definitions across views (#310)
- `MemoryVariablesTab` component (formerly `StageVariablesTab`) is now reused in `GlobalMemoryView` (#310)
- Repeating composables extracted: click-outside, copy/paste variables, and media upload (#282)
- Conversation event cards split into event-specific components for maintainability
- Sample copies table switches from fixed-width to dynamic column widths

### Bug Fixes
- Fixed double AI response box appearing in the playground when a filler response is configured (#306)
- Fixed operator ID field rejecting email address format (#305)
- Fixed full voice mode being auto-selected when it is unavailable (#302)
- Fixed LLM provider settings not resetting when cancelling a provider change (#301)
- Fixed LLM provider settings not clearing when switching to a different provider (#284)
- Fixed stage action modal tabs dismissing the modal instead of switching tabs (#276)
- Fixed custom dropdown being obscured by other UI elements (#270)
- Fixed API key settings not being saved; updated layout of the API key edit modal
- Fixed SVG marker references for Chromium compatibility in the execution plan view (#262)
- Fixed undefined execution plan colours causing rendering errors (#261)
- Fixed voice audio chunks being sent after a conversation ends or becomes inactive
- Fixed double disconnect event when ending a conversation from the UI
- Fixed VAD-related errors occurring when text input mode is selected (#289)
- Fixed various data validation and error display inconsistencies across editors (#303)

### Style
- Sample copies table header and row styles updated for improved readability
- `btn-icon` padding adjusted
- `color-scheme` CSS property set for proper light/dark mode base styles

### Documentation
- Added Sample Copies section documentation (#272)
- Updated analytics documentation to cover token usage and custom data exploration
- Added server-side VAD configuration and settings documentation in the Projects section

---

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
- **Conversation start/end stage** – starting and ending stage are now shown in the conversation detail metadata tab and in the conversations list table (#243, #246)
- **Conversations view filters** – new filter options added to the conversations list view (#248)
- **API key creation in setup wizard** – the setup wizard now creates an API key (#249)
- **String diff highlighting in history** – the entity history diff view now displays character-level diffs with inline change highlights (#244)

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
- Fixed `conversation-event-update` event type not being recognised; corrected message event handling in the playground (#245)
- Fixed playground send/end controls remaining disabled after a server-side conversation end (#247)
- Fixed history tab content not being wrapped correctly, causing layout issues (#242)

### Style
- Updated type badge styling for improved visibility in the effects editor
- Adjusted padding and layout for the effect selection modal

### Documentation
- Updated tool documentation for clarity and consistency
- Updated contributing guidelines to clarify branching and versioning practices

---

## [v0.1.0] – initial release
