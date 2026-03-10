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

Go to **Design > Global Actions** and click **New Global Action**.

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

## Special Actions

Besides regular global actions, there are **special actions** that are executed automatically by the system under specific conditions. You can configure their effects to control what happens when they're triggered.

To set up a special action, click the **Special Actions** dropdown (the violet button next to **New Global Action**) and select the action you want to configure.

### Moderation Blocked

The **Moderation Blocked** action (ID: <code v-pre>__moderation_blocked</code>) runs when the moderation system flags a user's message. Use it to define how the assistant responds when a message is blocked — for example, generating a polite refusal or ending the conversation.

Since the trigger is system-controlled, the edit view hides the **Trigger** and **Parameters** tabs — you only configure **Effects** (and optionally the name, examples, and tags).

If the action hasn't been set up for the project yet, clicking it shows a **Not Configured** screen with an **Initialize** button that creates it for you.

## Global vs. Stage Actions

| | Stage Actions | Global Actions |
|---|---|---|
| **Scope** | Defined inside a single stage | Defined at project level, shared across stages |
| **Lifecycle actions** | Supports `__on_enter`, `__on_leave`, `__on_fallback` | No lifecycle actions |
| **Special actions** | N/A | <code v-pre>__moderation_blocked</code> (system-triggered) |
| **Best for** | Stage-specific behaviors | Cross-cutting behaviors |
| **Maintenance** | Edited per-stage | Edit once, applies everywhere |

## Tips

- **Start with "always available" behaviors** — Help, cancel, and navigation are the classic global actions.
- **Use conditions** to control context — Even a global action can have a condition that limits when it's active. For example, "Transfer to human" might require `vars.escalationAllowed === true`.
- **Don't overuse** — If an action only makes sense in one or two stages, it's simpler as a regular stage action. Reserve global actions for genuinely cross-cutting behaviors.
