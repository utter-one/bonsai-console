# Guardrails

**Guardrails** are project-wide safety rules that evaluate on every user input turn. Unlike [global actions](./global-actions) — which are triggered by specific classifier outputs and must be enabled per stage — guardrails run automatically across all stages using a single project-level classifier, making them ideal for enforcing consistent policies.

Use guardrails for things like:
- Blocking offensive or harmful language
- Refusing off-topic requests regardless of which stage the user is in
- Enforcing usage policies (e.g., preventing discussion of competitors)
- Handling sensitive topics that should always be caught

## How Guardrails Work

Every time a user sends a message, the platform runs the guardrail classifier against the input. If the output matches a guardrail's **Classification Trigger**, that guardrail fires and its effects execute — before stage-level processing continues.

Guardrails can also have an optional **Condition** expression (JavaScript). If the condition is set and evaluates to falsy, the guardrail is skipped even if the classifier matches.

## Setting Up the Guardrail Classifier

Go to **Design > Guardrails** and select a classifier from the **Guardrails Classifier** dropdown. This classifier is shared by all guardrails in the project. Choosing **None** disables all guardrails.

The selected classifier should be trained with labels that map to your guardrails' classification triggers. For example, if you have a guardrail triggered by `offensive_language`, that label must exist in the classifier.

## Creating a Guardrail

Click **New Guardrail** to open the guardrail editor. The form shares the same structure as global actions, with tabs for the basic fields, trigger, effects, and metadata.

### Basic Fields

- **Name** — A descriptive, ID-like label (e.g., `offensive_language`, `off_topic_request`). Avoid spaces; use underscores instead. The name should match the format of the classification trigger your guardrails classifier will return for this rule.
- **Condition** — An optional JavaScript expression. The guardrail only fires when this evaluates to truthy. Leave blank to always fire on a classification match.
- **Examples** — Sample phrases that should trigger this guardrail. These help train and document the classifier.
- **Tags** — Optional labels for filtering and organization.

### Trigger Tab

- **Classification Trigger** — The label the guardrail classifier must output to fire this guardrail. This must match a label your classifier can produce.

Unlike global actions, guardrails do not have trigger mode settings (user input / client command) — they always evaluate on user input.

### Effects Tab

Define what happens when the guardrail fires. Common effects:
- **Generate Response** — Reply with a message explaining the restriction.
- **End Conversation** — Terminate the conversation immediately.
- **Go To Stage** — Redirect to a specific stage (e.g., a polite refusal stage).
- **Call Tool** — Invoke a script, smart function or webhook tool for custom logic.

See [Actions & Effects](./actions) for the full list of effect types.

## Guardrails vs. Global Actions

| | Guardrails | Global Actions |
|---|---|---|
| **Trigger mechanism** | Project-level classifier, every turn | Per-stage classifier (may be different per stage) |
| **Stage opt-in** | Always active across all stages | Must be enabled per stage |
| **Parameters** | Not supported | Supported |
| **Trigger modes** | User input only | User input, client commands, or both |
| **Best for** | Safety and policy enforcement | Reusable cross-stage behaviors |

## Tips

- **A single guardrail classifier handles all your rules** — Train it with all the labels your guardrails need. This keeps the evaluation cost low (one classifier call, many rules).
- **Use conditions for context-dependent rules** — A guardrail that should only apply to authenticated users could have `vars.isAuthenticated === true` as a condition.
- **Order matters less than coverage** — All matching guardrails on a given turn fire, not just the first one. Design effects that compose well.
- **Prefer guardrails for zero-tolerance rules** — If something should never be allowed regardless of stage, make it a guardrail, not a global action. No stage can accidentally opt out.

## Moderation

**Moderation** enables an additional layer of automatic content safety screening that runs before the conversation engine processes the user's message. It complements guardrails: guardrails use a project-level classifier with custom rules, while moderation uses the provider's built-in safety API.

Go to **Design > Guardrails** and open the **Moderation** tab.

### Enabling Moderation

Toggle **Enable content moderation** to turn screening on or off. When enabled, every user message is evaluated by the moderation API before classification and action processing.

### Selecting a Provider

Choose a **Moderation Provider** from the dropdown. Only **OpenAI** and **Mistral** LLM providers support the moderation API. If no compatible provider is configured, add one in **Administration > Providers** first.

### Blocked Categories

After selecting a provider, choose which content categories to block (e.g., hate speech, self-harm, violence). Leave all unchecked to block any flagged content regardless of category. The available categories depend on the selected provider.

### Handling Blocked Messages

When moderation flags a user message:

1. The message is **not** passed to the AI for processing.
2. If a **Moderation Blocked** special action is configured in **Design > Global Actions**, its effects run instead (e.g., a polite refusal message).
3. If no Moderation Blocked action is set up, the default platform behavior applies.

See [Global Actions — Special Actions](./global-actions#special-actions) for how to configure the Moderation Blocked response.
