# Refactoring Checklist

Tracks implementation status of every item documented in `.refactor/`.
Check off tasks as they land in code. Each top-level group matches a doc file.

---

## Composables

### `useCopyPaste` — [`composables/useCopyPaste.md`](composables/useCopyPaste.md)
- [ ] Create `src/composables/useCopyPaste.ts`
- [ ] Export from `src/composables/index.ts`
- [ ] Migrate `GlobalMemoryView` (variables copy/paste)
- [ ] Migrate `GlobalActionsView` (actions copy/paste)
- [ ] Migrate `StageEditView` (actions + variables copy/paste)

### `useMediaUpload` — [`composables/useMediaUpload.md`](composables/useMediaUpload.md)
- [ ] Create `src/composables/useMediaUpload.ts`
- [ ] Export from `src/composables/index.ts`
- [ ] Migrate `ActionEffectsEditor.vue`
- [ ] Migrate `CallToolModal.vue`
- [ ] Migrate `SetVariableModal.vue`

### `useClickOutside` — [`composables/useClickOutside.md`](composables/useClickOutside.md)
- [ ] Create `src/composables/useClickOutside.ts`
- [ ] Export from `src/composables/index.ts`
- [ ] Migrate `LanguageSelector.vue`
- [ ] Migrate `TimezoneSelector.vue`
- [ ] Use inside `FilterDropdown.vue` (when created)

### `useArrayEditor` — [`composables/useArrayEditor.md`](composables/useArrayEditor.md)
- [ ] Create `src/utils/arrayEditor.ts`
- [ ] Migrate `JavaScriptEditor.vue`
- [ ] Migrate `CallToolModal.vue`
- [ ] Migrate `SetVariableModal.vue`

---

## Shared Components

### `BaseModal` — [`components/BaseModal.md`](components/BaseModal.md)
- [ ] Create `src/components/BaseModal.vue`
- [ ] Migrate `KnowledgeCategoryModal.vue`
- [ ] Migrate `ProfileEditModal.vue`
- [ ] Migrate `IssueEditModal.vue`
- [ ] Migrate `ApiKeyEditModal.vue`
- [ ] Migrate `StageActionModal.vue`
- [ ] Migrate remaining modals

### `TabNavigator` + `TabPanel` — [`components/TabNavigator.md`](components/TabNavigator.md)
- [ ] Create `src/components/TabNavigator.vue`
- [ ] Create `src/components/TabPanel.vue`
- [ ] Migrate `ActionForm.vue`
- [ ] Migrate `ApiKeyEditModal.vue`
- [ ] Migrate `KnowledgeCategoryModal.vue`
- [ ] Migrate `StageActionModal.vue`
- [ ] Migrate edit views (AgentEditView, StageEditView, etc.)

### `FilterDropdown` — [`components/FilterDropdown.md`](components/FilterDropdown.md)
- [ ] Create `src/components/FilterDropdown.vue` (depends on `useClickOutside`)
- [ ] Migrate `ConversationsView.vue` (4 dropdowns)

---

## Views

### V1 — `StageEditView` split — [`views/StageEditView.md`](views/StageEditView.md)
- [ ] Create `src/components/StageVariablesTab.vue` (depends on `useCopyPaste`)
- [ ] Create `src/components/StageActionsPanel.vue` (depends on `useCopyPaste`)
- [ ] Create `src/components/StageLifecycleActionsSection.vue`
- [ ] Update `StageEditView.vue`

### V2 — `AgentEditView` voice settings — [`views/AgentEditView.md`](views/AgentEditView.md)
- [x] Create `src/components/TtsProviderSettingsPanel.vue`
- [x] Update `AgentEditView.vue`
- Notes:
  - Fix: `inactivityTimeout` field was inside dead `v-if="isAzure"` + `v-if="isElevenLabs"` block — moved to ElevenLabs section
  - Removes: `isElevenLabs`, `isOpenAI`, `isDeepgram`, `isCartesia`, `isAzure` computeds from view (only `isAmazonPolly` stays)
  - Removes: `emotionTagsInput` computed, `addNoSpeechMarker`, `removeNoSpeechMarker` functions
  - Removes: `Plus`, `X` lucide imports from view

### V3 — `ProjectEditView` ASR settings — [`views/ProjectEditView.md`](views/ProjectEditView.md)
- [ ] Create `src/components/asr/` directory
- [ ] Create `AsrAzureSettings.vue`
- [ ] Create `AsrElevenLabsSettings.vue`
- [ ] Create `AsrDeepgramSettings.vue`
- [ ] Create `AsrAssemblyAiSettings.vue`
- [ ] Create `AsrSpeechmaticsSettings.vue`
- [ ] Create `AsrProviderSettings.vue` (dispatcher)
- [ ] Update `ProjectEditView.vue`

### V4 — `ToolEditView` tool-type configs — [`views/ToolEditView.md`](views/ToolEditView.md)
- [ ] Create `src/components/tools/` directory
- [ ] Create `SmartFunctionConfig.vue`
- [ ] Create `WebhookConfig.vue`
- [ ] Create `ScriptConfig.vue`
- [ ] Update `ToolEditView.vue`

### V5 — `PlaygroundView` split — [`views/PlaygroundView.md`](views/PlaygroundView.md)
- [ ] Create `src/components/playground/PlaygroundConnectionPanel.vue`
- [ ] Create `src/components/playground/PlaygroundAudioPanel.vue`
- [ ] Create `src/components/playground/PlaygroundEventFeed.vue`
- [ ] Update `PlaygroundView.vue`

### V6 — `ConversationsView` filter dropdowns — [`views/ConversationsView.md`](views/ConversationsView.md)
- [ ] Create `FilterDropdown.vue` (tracked above)
- [ ] Update `ConversationsView.vue`

---

## Component Splits

### `ConversationEventCard` split — [`components/ConversationEventCards.md`](components/ConversationEventCards.md)
- [ ] Create `src/utils/conversationEventTypeGuards.ts`
- [ ] Create `src/components/events/` directory
- [ ] Create `EventMessageCard.vue`
- [ ] Create `EventClassificationCard.vue`
- [ ] Create `EventTransformationCard.vue`
- [ ] Create `EventActionCard.vue`
- [ ] Create `EventCommandCard.vue`
- [ ] Create `EventToolCallCard.vue`
- [ ] Create `EventConversationStartCard.vue`
- [ ] Create `EventConversationResumeCard.vue`
- [ ] Create `EventConversationEndCard.vue`
- [ ] Create `EventConversationAbortedCard.vue`
- [ ] Create `EventConversationFailedCard.vue`
- [ ] Create `EventJumpToStageCard.vue`
- [ ] Create `EventModerationCard.vue`
- [ ] Create dispatcher `src/components/events/ConversationEventCard.vue`
- [ ] Update import sites or add re-export at original path

### `StageActionsPanel` — [`components/StageActionsPanel.md`](components/StageActionsPanel.md)
- [ ] (Tracked under V1 — StageEditView above)

### `StageLifecycleActionsSection` — [`components/StageLifecycleActionsSection.md`](components/StageLifecycleActionsSection.md)
- [ ] (Tracked under V1 — StageEditView above)

### `StageVariablesTab` — [`components/StageVariablesTab.md`](components/StageVariablesTab.md)
- [ ] (Tracked under V1 — StageEditView above)

### `TtsProviderSettingsPanel` — [`components/TtsProviderSettingsPanel.md`](components/TtsProviderSettingsPanel.md)
- [x] (Tracked under V2 — AgentEditView above)

### `AsrProviderSettings` family — [`components/AsrProviderSettings.md`](components/AsrProviderSettings.md)
- [ ] (Tracked under V3 — ProjectEditView above)

### `SmartFunctionConfig` — [`components/SmartFunctionConfig.md`](components/SmartFunctionConfig.md)
- [ ] (Tracked under V4 — ToolEditView above)

### `WebhookConfig` — [`components/WebhookConfig.md`](components/WebhookConfig.md)
- [ ] (Tracked under V4 — ToolEditView above)

### `ScriptConfig` — [`components/ScriptConfig.md`](components/ScriptConfig.md)
- [ ] (Tracked under V4 — ToolEditView above)
