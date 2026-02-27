# Actions & Effects

**Actions** are how your AI does more than just talk. When a user says something, the system detects their intent and triggers one or more actions. Each action contains a list of **effects** — the actual things that happen.

## How Actions Work

1. The user says something.
2. The stage's **classifier** analyzes the message and decides which actions match.
3. Matched actions fire in order.
4. Each action's **effects** execute sequentially.
5. After all effects run, the AI generates its response (unless an effect says otherwise).

## Anatomy of an Action

Each action has these key parts:

### Identification

- **Action ID** — A unique key within the stage (e.g., `check_order_status`).
- **Name** — A display name for your reference.

### Triggers

Actions can be triggered in several ways:

| Trigger | Description |
|---|---|
| **User input** (default) | The classifier detects a matching intent in what the user said. |
| **Client command** | The client application sends a specific command (e.g., a button press). |
| **Transformation** | A context transformer changes a variable, and the action is watching for that change. |

### Classification Trigger

The **classification trigger** is a label that describes when this action should fire. It's what the classifier uses to match user input to this action. For example:

- _"The user wants to check their order status"_
- _"The user is asking about return policy"_
- _"The user wants to speak to a human"_

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

## Effects

Effects are the building blocks of action behavior. They run in order within an action, and each one can use the results of the ones before it.

### Go to Stage

Move the conversation to a different stage. Triggers lifecycle actions (`__on_leave` on the current stage, `__on_enter` on the new one).

### Run Script

Execute custom JavaScript. You have full access to conversation variables, user profile, history, and flow control functions. See [Scripting](../guide/scripting) for details.

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

### Call Webhook

Send an HTTP request to an external service. You can use template values in the URL, headers, and body:

- **Method** — GET, POST, PUT, DELETE
- **URL** — e.g., <code v-pre>https://api.example.com/orders/{{vars.orderId}}</code>
- **Headers** — e.g., <code v-pre>Authorization: Bearer {{constants.apiToken}}</code>
- **Body** — JSON payload
- **Result Key** — Name under which the response is stored for use in later effects

### Call Tool

Invoke an AI-powered [tool](./tools) by ID, passing template-based parameters. The tool runs and returns a result that subsequent effects and prompts can use.

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
| `__on_enter` | Entering the stage | Cannot end, abort, or navigate to another stage |
| `__on_leave` | Leaving the stage | Cannot navigate to another stage or generate a response |
| `__on_fallback` | No user-triggered action matched | No restrictions |

`__on_fallback` is especially useful — it defines what happens when the user says something the classifier doesn't recognize. Without it, the AI just generates a response based on the prompt alone.

## Execution Order

When the user sends a message, here's what happens in detail:

1. All classifiers run **in parallel** (the default one plus any action-specific overrides).
2. All context transformers run **in parallel** with the classifiers.
3. Results are merged — matched actions are identified.
4. If nothing matched and `__on_fallback` exists, it runs instead.
5. Matched actions' effects execute **sequentially**.
6. If any effect triggers navigation, conversation end, or abort, it takes effect after all current effects finish.

## Tips

- **Name actions descriptively** — `check_order_status` is better than `action_1`.
- **Write clear classification triggers** — Think of them as labels that describe user intent.
- **Provide examples** — The more example phrases you give, the better the classifier can match.
- **Use conditions** to hide actions that don't make sense yet (e.g., don't offer "confirm booking" until all required fields are collected).
- **Chain effects thoughtfully** — A common pattern: _call webhook → store result in variable → generate response_ (the response prompt can then reference the variable with the webhook data).
