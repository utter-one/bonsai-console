# Changelog

## [v0.6.0] – 2026-06-24

### New Features
- **Email channel (SMTP/IMAP with OAuth2)** – full email sending with SMTP/IMAP configuration, OAuth2 XOAUTH2 support for Gmail, secrets manager integration for client secrets, popup callback flow with auto-close and data refresh (#434, #437, #438, #439, #440, #441, #442)
- **VAD overhaul** – granular VAD settings with Legacy and Silero configurations, FireRedVAD integration, Smart Turn endpoint detection, silence detection, barge-in silence timeout and placeholder, grace period to prevent false positives, and frame duration display (#405, #409, #410, #416, #417, #418, #422, #423, #426, #428)
- **Audio recording and artifacts** – recording configuration in project settings, default Opus format, artifact management for conversations with fetch/download support, and enhanced extension handling for audio and image types (#404, #411)
- **Knowledge base rework** – items now support multiple questions and all data can be edited in place (#433)
- **Pass/fail metrics** – pass rate column in test runs list using backend testStatistics, score and full pass stats on the pass/fail tab (#432)
- **Scenario run error handling** – error handling and status updates for scenario runs (#431)
- **Interruption indicator** – visual indicator when the user interrupts the assistant's answer (#419)
- **Async tool calls** – tools can now be configured to run asynchronously (#407, #408)
- **Starting stage and profile variables** – ability to set a starting stage and user profile variables for conversations (#406)
- **Channel in prompt context** – channel context variable added to the prompt builder (#403)
- **Provider storage** – storage option added to provider type (#403)
- **OVH and Scaleway providers** – two new LLM providers with configuration interfaces (#402)
- **Agent column in stages list** – stages table now shows the associated agent (#421)
- **Single-column diff view** – optional single-column mode for the entity history diff view with improved multi-line string handling (#435)

### Improvements
- **Deepgram TTS** – removed sample rate settings (inferred from audio format), corrected speed setting range, removed bitRate and container parameters (#427)
- **VAD settings modal** – enhanced with frame duration display for Silero and FireRed configurations; warning for barge-in silence timeout values below 3000 ms (#428)
- **SMTP/IMAP configuration form** – improved structure and help texts (#415)
- **Projects view** – replaced problematic dropdown with floating dropdown component (#413)
- **Storage tab** – simplified label and removed experimental notice (#403)
- **Filler response** – updated description for history message count field (#414)
- **Changes navigation** – adjusted styling of the changes navigation widget (#430)
- **API_BASE_URL** – trailing slashes stripped to prevent double slashes in URLs (#434)

### Bug Fixes
- Fixed OAuth2 client secret retrieval from secrets manager and callback redirect URL path (#441, #442)
- Fixed OAuth2 managed fields being sent back on provider save (#440)
- Fixed OAuth2 callback not redirecting to Vue callback view (#439)
- Fixed OAuth2 scope, callback URL, and missing clientSecret (#437)
- Fixed audio playback not stopping on conversation end in playground (#436)
- Fixed audio player dying after filler ends, preventing main audio chunks (#426)
- Fixed playground session not ending when leaving the playground view (#429)
- Fixed barge-in silence fields not round-tripping through the VAD modal (#424, #425)
- Fixed scenario test runs using simple comparison instead of full set of compare operators (#420)
- Fixed default values for Max Speech Frames and Min Silence Frames in FireRedVAD (#418)
- Fixed Smart Turn settings not parsing back into flat form on modal save (#417)
- Fixed default placeholder and help text for Frame Samples in Silero VAD (#410)
- Fixed VAD algorithm option labels for clarity (#409)
- Fixed channel context variable missing from variable dropdown in prompt editor (#406)
- Fixed analytics funnels query creation parameters for consistency (#412)
- Fixed unused `createdBy` field in provider API and related components (#412)

---

## [v0.5.0] – 2026-05-25

### New Features
- **Benchmarks** – new Benchmarking section with views, components, input validation, file form field, and batch configuration creation; hidden when user lacks permission (#387, #396)
- **Testing section** – full Testers, Scenarios, and Test Runs management with create/edit views, Run Scenarios modal, hang-up prompt, conversation opener, polling for run updates, cancellation and deletion, audit logs, and Explorer/Funnels analytics on test run detail (#348, #352, #364, #373)
- **Telegram channel** – Telegram provider configuration, channel support, and webhook deployment modal (#354, #376)
- **Outgoing conversations** – Twilio voice calls, SMS, and WhatsApp initiation modals with conversation direction, AI-generated opening messages, and application SID support (#342, #345, #346, #347)
- **Barge-in support** – turn aborted events, user speaking started events, and voice output handling to stop active outputs on turn abortion (#375)
- **Dashboard enhancements** – configuration health metrics, performance metrics, operators and API keys counts, recent issues section, and issue detail view (#367, #368, #369, #370, #384)
- **Layout mode toggle** – wide and centered layout modes with responsive visibility (#378)
- **Mobile navigation drawer** – mobile-friendly sidebar navigation with toggle (#383)
- **Tooltip component** – new `Tooltip` component integrated into `RelativeDate`, `GlobalActionsView`, and `StagesView` (#385)

### Improvements
- **Audio settings** – toggle badges for echo cancellation, noise suppression, and auto gain control (#374)
- **Groq reasoning settings** – reasoning settings added to LLM settings modal and API contracts (#353)
- **Analytics** – removed experimental badge; extracted Explorer and Funnels for reuse; added `scenarioRunId` filter; moved metric aggregation function logic to backend (#371, #366, #393)
- **Filler Responses** – removed experimental badge; added `historyMessageCount` for LLM context (#358, #371)
- **Workspace layout** – overhauled layout components with new architecture, `requiresProject` sidebar flag, divider in administration menu, and updated logo typography (#377)
- **Issue tracking** – enhanced severity and status badge styling; renamed `sessionId` to `conversationId` (#384, #397)
- **Scenario runs** – status details, refresh for queued/in-progress runs, consolidated statistics, `formatEnum` status display, expected value comparison modes (#361, #362, #363)
- **UI consistency** – unified button styles, spacing, typography, modal padding, table cells, and pagination controls across all views (#379, #380, #381, #382, #397)
- **Conversation status** – directional arrows replacing phone icons; enhanced status handling and badge classes (#343, #357)

### Bug Fixes
- Fixed empty permissions array in auth store after page refresh (#395)
- Fixed auto-scroll to event causing black bar in conversation view (#394)
- Fixed inability to add turns amount count metric (#392)
- Fixed double scroll issue with height and overflow properties (#385)
- Fixed light theme background colors for section and layout components (#344)
- Fixed missing LLM settings in OpenAPI schema (#360)
- Fixed `nonEmptyGroups` computation with undefined stubs (#364)
- Fixed Twilio application SID field in provider configuration (#347)
- Fixed `MenuItem` interface required fields in `SectionLayout` (#348)
- Fixed Docker HEALTHCHECK commands and parameters for reliability (#388, #389, #391)

### Documentation
- Added Testing section documentation covering Testers, Scenarios, and Test Runs (#373)
- Updated AGENTS.md with component guidelines, detail view patterns, and pagination accuracy (#376, #368)
- Added health check to Dockerfile and Dockerfile-docs (#388)

---

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
