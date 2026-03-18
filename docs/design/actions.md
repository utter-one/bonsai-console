# Actions & Effects

**Actions** are how your AI does more than just talk. When a user says something, the system detects their intent and triggers one or more actions. Each action contains a list of **effects** — the actual things that happen.

## How Actions Work

Actions can be triggered in three ways:

- **User input** — The classifier detects a matching intent in what the user said.
- **Client command** — The client application sends a specific command (e.g., a button press).
- **Transformer variable change** — A context transformer sets or changes a watched variable.

When one or more actions are triggered in the same turn, their effects are **collected together, sorted by priority, and executed in that order** — not action-by-action. This means effects from multiple triggered actions interleave globally based on their type priority, ensuring a consistent, predictable execution order regardless of how many actions fired.

## Anatomy of an Action

Each action has these key parts:

### Identification

- **Name** — A unique identifier within the stage (e.g., `CheckOrderStatus`). It is recommended to avoid spaces in action names.

### Triggers

Actions can be triggered in several ways:

| Trigger | Description |
|---|---|
| **User input** (default) | The classifier detects a matching intent in what the user said. |
| **Client command** | The client application sends a specific command (e.g., a button press). |
| **Transformation** | A context transformer changes a variable, and the action is watching for that change. |

### Classification Trigger

The **classification trigger** is a human-readable label that **the LLM reads** to understand when this action should fire. Think of it as the action's intent description shown directly to the language model. For example:

- _"The user wants to check their order status"_
- _"The user is asking about return policy"_
- _"The user wants to speak to a human"_

::: tip Labels for the LLM, Names in the response
The classification trigger is a hint *for* the language model — it explains an action's purpose so the LLM can decide whether it matches. When the LLM decides an action matches, it returns the action's **Name** (e.g., `CheckOrderStatus`) in its JSON response — not the trigger label. See [Classifiers](./classifiers#required-output-format) for the output format.
:::

### Examples

You can provide **example phrases** that help the classifier understand what kind of user messages should trigger this action:

- "Where's my order?"
- "Can you check the status of my delivery?"
- "I placed an order last week, has it shipped?"

### Parameters

Actions can extract **parameters** from the user's message. For example, an action triggered by "Check order 12345" could extract:

- `orderNumber` (string, required) — _"The order or tracking number"_

Extracted parameters are available in effects.

### Condition

An optional **condition** controls whether the action is available. If the condition evaluates to false, the action is hidden from the classifier entirely. Conditions are JavaScript expressions:

```
vars.retryCount < 3 && userProfile.tier === 'premium'
```

### Watched Variables (for transformation triggers)

If the action is triggered by variable changes, you specify which variables to watch and what kind of change to look for:

| Watch Mode | Meaning |
|---|---|
| `new` | The variable was just set for the first time |
| `changed` | The variable's value was updated |
| `removed` | The variable was cleared |
| `any` | The variable was set, updated, or cleared |

## Effects

Effects are the building blocks of action behavior. They run in order within an action, and each one can use the results of the ones before it.

### Go to Stage

Move the conversation to a different stage. Triggers lifecycle actions (On Leave on the current stage, On Enter on the new one).

### Modify Variables

Set, reset, or update stage variables:

| Operation | Description | Example |
|---|---|---|
| **Set** | Set a variable to a value | Set `status` to `"verified"` |
| **Reset** | Clear a variable | Reset `retryCount` |
| **Add** | Append a value to an array | Add `"step completed"` to `history` |
| **Remove** | Remove a value from an array | Remove `"item-1"` from `pendingItems` |

### Modify User Profile

Same operations as Modify Variables, but applied to the user's profile data instead of stage variables.

### Call Tool

Invoke a [tool](./tools) by ID, passing template-based parameters. The tool runs and returns a result that subsequent effects and prompts can use. Tools can be Smart Functions (LLM-based), Webhooks (external HTTP calls), or Scripts (custom JavaScript).

### Modify User Input

Replace the user's message with a template. This changes what the AI "sees" — useful for adding context:

```handlebars
Context: The user has order {{vars.orderId}} with status {{vars.orderStatus}}.
User's question: {{userInput}}
```

### Generate Response

Explicitly trigger an AI response. Two modes:

- **Generated** — The AI produces a response using the current prompt and context (normal behavior).
- **Prescripted** — Send one of several pre-written messages, selected randomly or in round-robin order. No AI call is made.

Prescripted responses are useful for standardized messages like "Please hold while I look that up."

### End Conversation

Gracefully end the conversation, optionally with a reason. The AI may generate a final response.

### Abort Conversation

Immediately terminate the conversation without generating any response.

## Lifecycle Actions

Stages support three special actions that run automatically:

| Action | When | Restrictions |
|---|---|---|
| **On Enter** | Entering the stage | Cannot end, abort, or navigate to another stage (including via `goToStage()` in scripts) |
| **On Leave** | Leaving the stage | Cannot navigate to another stage or generate a response (including via `goToStage()` in scripts) |
| **On Fallback** | No user-triggered action matched | No restrictions |

**On Fallback** is especially useful — it defines what happens when the user says something the classifier doesn't recognize. Without it, the AI just generates a response based on the prompt alone.

## Execution Order

When the user sends a message, here's what happens in detail:

1. All classifiers run **in parallel** (the default one plus any action-specific overrides).
2. All context transformers run **in parallel** with the classifiers.
3. Results are merged — matched actions are identified.
4. If nothing matched and **On Fallback** is defined, it runs instead.
5. Effects from all matched actions are **collected, sorted by their priority**, and executed in that order.
6. If any effect triggers navigation, conversation end, or abort, it takes effect after all current effects finish.

### Effect Execution Priority

When multiple actions are triggered in the same turn, the system **collects all effects from all matched actions** and sorts them globally by type before executing. Types with lower priority numbers run first:

| Priority | Effect Type |
|---|---|
| 1 | Call Tool (Webhook) |
| 2 | Call Tool (Smart Function)|
| 3 | Modify Variables |
| 4 | Modify User Profile |
| 5 | Modify User Input |
| 6 | Call Tool (Script) |
| 50 | Change Visibility |
| 100 | Generate Response (if not aborted) |
| 200 | End Conversation |
| 201 | Abort Conversation |
| 202 | Go to Stage (if not aborted/endeds) |

#### Conflict Resolution

When multiple matched actions contribute the same effect type, these rules apply:

- **Go to Stage** — Only the **first** matched action's target stage wins. Subsequent Go to Stage effects from other actions are discarded.
- **Abort Conversation** vs **End Conversation** — Abort Conversation always wins and suppresses any End Conversation effects.
- **Modify User Input** — All Modify User Input effects are **chained**: each one transforms the output of the previous, so the AI sees the result of all of them applied in order.

## Tips

- **Name actions descriptively** — `CheckOrderStatus` is better than `action_1`.
- **Write clear classification triggers** — Think of them as labels that describe user intent.
- **Provide examples** — The more example phrases you give, the better the classifier can match.
- **Use conditions** to hide actions that don't make sense yet (e.g., don't offer "confirm booking" until all required fields are collected).
- **Chain effects thoughtfully** — A common pattern: _call tool → store result in variable → generate response_ (the response prompt can then reference the result or variable with the data).
