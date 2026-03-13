# Global Actions

**Global actions** are actions defined once at the project level and shared across multiple stages. They work just like regular stage actions, but you create them separately and then reference them in whichever stages need them.

For project-wide safety and policy rules that should fire on every turn regardless of stage, see [Guardrails](./guardrails).

## Why Use Global Actions?

Some behaviors need to be available everywhere in the conversation. Without global actions, you'd have to duplicate them in every stage — and keep every copy in sync when something changes. Global actions solve this by letting you define something once and reuse it.

## Common Use Cases

- **Help/Escalation** — _"I need to talk to a human"_ should work no matter which stage the user is in.
- **Cancel/Exit** — _"I want to stop"_ should end the conversation from anywhere.
- **Language switching** — _"Speak Spanish"_ should change the language globally.
- **Navigation** — _"Go back to the main menu"_ should work from any stage.
- **Error recovery** — Consistent error-handling behavior across all stages.
- **Safety shortcuts** — Quick exits from off-topic conversations ("Let's get back on track").

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

1. Enable **Use Global Actions** — this makes all project-level global actions available in the stage.

::: tip Selecting specific global actions
Filtering to only specific global actions per stage is not yet available in the UI. When Use Global Actions is enabled, all global actions are active in that stage.
:::

## Special Actions

Besides regular global actions, there are **special actions** that are executed automatically by the system under specific conditions. You can configure their effects to control what happens when they're triggered.

To set up a special action, click the **Special Actions** dropdown (the violet button next to **New Global Action**) and select the action you want to configure.

Since the trigger is system-controlled, the edit view hides the **Trigger** and **Parameters** tabs — you only configure **Effects** (and optionally the name and tags).

If an action hasn't been set up for the project yet, clicking it shows a **Not Configured** screen with an **Initialize** button that creates it for you.

### Moderation Blocked

The **Moderation Blocked** action runs when the moderation system flags a user's message. Use it to define how the assistant responds when a message is blocked — for example, generating a polite refusal or ending the conversation.

Content moderation is configured separately in **Design > Guardrails & Moderation** under the **Moderation** tab. See [Moderation](./moderation) for details.

### Conversation Lifecycle Actions

The following special actions fire at key points in a conversation's lifecycle. They are grouped under **Lifecycle** in the Special Actions dropdown.

#### Conversation Start

The **Conversation Start** action runs once after the conversation and its first stage are fully initialised. Use it to set up initial variable values, log session metadata, or call an external webhook to signal that a session has begun.

**Restrictions:** cannot end or abort the conversation.

#### Conversation Resume

The **Conversation Resume** action runs when a previously-interrupted conversation is resumed by the user. Use it to restore context, greet the returning user, or re-synchronise external state.

**Restrictions:** cannot end or abort the conversation.

#### Conversation End

The **Conversation End** action runs when the conversation is **gracefully ended** (e.g. via an `end_conversation` effect). Use it to send a closing webhook, persist final variable values, or trigger a post-conversation workflow.

**Restrictions:** cannot go to another stage, generate a response, or abort the conversation.

#### Conversation Abort

The **Conversation Abort** action runs when the conversation is **aborted** — an immediate, unclean stop (e.g. via an `abort_conversation` effect or a policy violation). Use it for urgent cleanup, alerting, or audit logging.

**Restrictions:** cannot go to another stage, generate a response, or end the conversation gracefully.

#### Conversation Failed

The **Conversation Failed** action runs when the conversation encounters a **fatal error** from which it cannot recover. Use it to log the failure, notify an external system, or record diagnostic data.

**Restrictions:** cannot go to another stage, generate a response, end, or abort the conversation.

## Global vs. Stage Actions

| | Stage Actions | Global Actions |
|---|---|---|
| **Scope** | Defined inside a single stage | Defined at project level, shared across stages |
| **Lifecycle actions** | Supports On Enter, On Leave, On Fallback | No stage lifecycle actions — global lifecycle is handled by Special Actions |
| **Special actions** | N/A | Moderation Blocked, Conversation Start, Conversation Resume, Conversation End, Conversation Abort, Conversation Failed |
| **Best for** | Stage-specific behaviors | Cross-cutting behaviors |
| **Maintenance** | Edited per-stage | Edit once, applies everywhere |

## Tips

- **Start with "always available" behaviors** — Help, cancel, and navigation are the classic global actions.
- **Use [Guardrails](./guardrails) for zero-tolerance rules** — If something must be blocked regardless of which stage the user is in, use a guardrail instead of a global action. Guardrails can't be accidentally disabled by a stage.
- **Use conditions** to control context — Even a global action can have a condition that limits when it's active. For example, "Transfer to human" might require `vars.escalationAllowed === true`.
- **Don't overuse** — If an action only makes sense in one or two stages, it's simpler as a regular stage action. Reserve global actions for genuinely cross-cutting behaviors.
