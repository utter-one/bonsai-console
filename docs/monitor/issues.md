# Issues

The **Issues** view shows conversations that have been flagged for human review. Issues help you catch problems and ensure quality.

## Creating an Issue

Issues are created **manually** by team members reviewing conversations. The quickest way is to click the **Create Issue** (bug) button directly on an event card in the Conversation detail view — it pre-fills the conversation ID, event index, and stage automatically.

You can also create issues from scratch using the **Create Issue** button on the Issues list page.

## Issue Form

When creating or editing an issue, the form contains:

| Field | Required | Description |
|---|---|---|
| **Project** | Yes | The project this issue belongs to. Auto-filled when opened from a conversation. |
| **Stage** | No | The stage where the problem occurred. Auto-filled when opened from an event card. |
| **Conversation ID** | No | The conversation where the issue was observed. Auto-filled when opened from a conversation. If set on an existing issue, a link icon lets you navigate directly to that conversation. |
| **Environment** | No | The environment where the issue was found. |
| **Build Version** | Yes | The build or release version when the issue was observed (e.g., `v1.2.3`). |
| **Category** | Yes | The type of issue: `intent`, `ai answer`, `entity`, or `tool`. |
| **Severity** | Yes | Impact level: `critical`, `major`, `minor`, or `trivial`. |
| **Status** | Yes | Current state of the issue (see below). Only editable when updating an existing issue. |
| **Bug Description** | Yes | A clear description of what went wrong. |
| **Expected Behaviour** | Yes | What the AI should have done instead. |
| **Comments** | No | Additional notes or context. |

### Issue Statuses

| Status | Meaning |
|---|---|
| **awaiting** | Newly created, not yet investigated |
| **in-progress** | Someone is actively working on it |
| **ready-to-test** | A fix has been applied and is ready for verification |
| **still-occurs** | Tested but the problem persists |
| **done** | Resolved and verified |
| **cannot-reproduce** | Could not be reproduced |
| **wont-fix** | Acknowledged but not going to be fixed |

## Working with Issues

Use the Issues view to:
- **Triage** incoming issues — review what went wrong and decide if action is needed.
- **Investigate** — Click through to the linked conversation to see the full event log and trace the problem.
- **Resolve** — Update the status as work progresses through to **done**.

## Tips

- **Check issues regularly** — They're your early warning system for problems in conversation design.
- **Look for patterns** — If the same kind of issue keeps appearing, it usually means a stage prompt, classifier, or action needs improvement.
- **Use with audit logs** — If an issue started after a recent change, check the audit logs to see what was modified.
