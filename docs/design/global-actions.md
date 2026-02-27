# Global Actions

**Global actions** are actions defined once at the project level and shared across multiple stages. They work just like regular stage actions, but you create them separately and then reference them in whichever stages need them.

## Why Use Global Actions?

Some behaviors need to be available everywhere in the conversation. Without global actions, you'd have to duplicate them in every stage — and keep every copy in sync when something changes. Global actions solve this by letting you define something once and reuse it.

## Common Use Cases

- **Help/Escalation** — _"I need to talk to a human"_ should work no matter which stage the user is in.
- **Cancel/Exit** — _"I want to stop"_ should end the conversation from anywhere.
- **Language switching** — _"Speak Spanish"_ should change the language globally.
- **Navigation** — _"Go back to the main menu"_ should work from any stage.
- **Error recovery** — Consistent error-handling behavior across all stages.

## Creating a Global Action

Go to **Design > Global Actions** and click **Create Global Action**.

The fields are the same as a regular stage action:

- **Name** — A descriptive label (e.g., "Escalate to Human").
- **Classification Trigger** — What user intent activates this action.
- **Examples** — Sample phrases.
- **Parameters** — Any values to extract.
- **Condition** — Optional condition to control when it's available.
- **Effects** — The list of things that happen when triggered.
- **Trigger modes** — Whether it can be triggered by user input, client commands, or both.

See [Actions & Effects](./actions) for details on all these fields.

## Enabling Global Actions on a Stage

On the stage edit view:

1. Enable **Use Global Actions**.
2. Optionally select **specific global action IDs** to include. If you leave this empty, all project global actions are available in the stage.

## Global vs. Stage Actions

| | Stage Actions | Global Actions |
|---|---|---|
| **Scope** | Defined inside a single stage | Defined at project level, shared across stages |
| **Lifecycle actions** | Supports `__on_enter`, `__on_leave`, `__on_fallback` | No lifecycle actions |
| **Best for** | Stage-specific behaviors | Cross-cutting behaviors |
| **Maintenance** | Edited per-stage | Edit once, applies everywhere |

## Tips

- **Start with "always available" behaviors** — Help, cancel, and navigation are the classic global actions.
- **Use conditions** to control context — Even a global action can have a condition that limits when it's active. For example, "Transfer to human" might require `vars.escalationAllowed === true`.
- **Don't overuse** — If an action only makes sense in one or two stages, it's simpler as a regular stage action. Reserve global actions for genuinely cross-cutting behaviors.
