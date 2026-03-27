# Refactoring Index

This directory documents planned refactoring work for the Bonsai Console Vue component codebase.
Each file describes a self-contained unit of work with motivation, affected files, proposed API, and implementation steps.

---

## Structure

```
.refactor/
  index.md                               ← this file
  views/
    StageEditView.md                     ← split 3100-line view into panels
    AgentEditView.md                     ← extract TTS voice provider blocks
    ProjectEditView.md                   ← extract ASR provider blocks
    ToolEditView.md                      ← extract tool-type config sections
    PlaygroundView.md                    ← split 1870-line playground view
    ConversationsView.md                 ← replace manual dropdown state mgmt
  components/
    StageActionsPanel.md                 ← new: actions table panel from StageEditView
    StageLifecycleActionsSection.md      ← new: lifecycle card grid from StageEditView
    StageVariablesTab.md                 ← new: variable tree tab from StageEditView
    TtsProviderSettingsPanel.md          ← new: per-provider TTS fields from AgentEditView
    AsrProviderSettings.md              ← new: per-provider ASR fields from ProjectEditView
    SmartFunctionConfig.md               ← new: smart function config section from ToolEditView
    WebhookConfig.md                     ← new: webhook config section from ToolEditView
    ScriptConfig.md                      ← new: script config section from ToolEditView
    ConversationEventCards.md            ← split ConversationEventCard into per-type components
    BaseModal.md                         ← new: shared modal wrapper for all 20+ modals
    TabNavigator.md                      ← new: shared tab nav used in 6+ files
    FilterDropdown.md                    ← new: self-contained filter dropdown
  composables/
    useCopyPaste.md                      ← extract copy/paste logic (3 duplicate sites)
    useMediaUpload.md                    ← extract file reader logic (3 duplicate sites)
    useClickOutside.md                   ← extract click-outside listener (3+ sites)
    useArrayEditor.md                    ← extract array item helpers (3 duplicate sites)
```

---

## Priority overview

| Priority | ID | File | Type | Est. lines removed |
|----------|----|------|------|--------------------|
| Critical | V1 | StageEditView | View split | ~2 000 |
| Critical | V2 | ProjectEditView | View refactor | ~1 000 |
| Critical | V3 | ToolEditView | View split | ~1 400 |
| Critical | V4 | AgentEditView | View refactor | ~350 |
| Critical | C1 | ConversationEventCards | Component split | ~500 |
| High | V5 | PlaygroundView | View split | ~1 200 |
| High | C2 | BaseModal | Shared component | ~400 total |
| High | C3 | TabNavigator | Shared component | ~200 total |
| High | X1 | useCopyPaste | Composable | ~200 total |
| Medium | V6 | ConversationsView | View refactor | ~150 |
| Medium | C4 | FilterDropdown | Shared component | ~150 |
| Medium | X2 | useMediaUpload | Composable | ~100 total |
| Medium | X3 | useClickOutside | Composable | ~60 total |
| Medium | X4 | useArrayEditor | Composable | ~60 total |

---

## Conventions used in these docs

- **Source** — existing file being modified
- **New file** — file to be created
- Props listed as `propName: Type` — required unless marked `?`
- Emits listed as `emit-name: PayloadType`
- Code examples show the intended public API, not the full implementation
