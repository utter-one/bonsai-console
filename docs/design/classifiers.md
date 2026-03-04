# Classifiers

A **classifier** is the component that understands what the user means. It analyzes the user's message and determines which action (if any) should be triggered.

Behind the scenes, a classifier uses a language model (LLM) to perform this analysis — it's essentially an AI reading the user's message, looking at the list of available actions, and deciding which ones match.

## How Classification Works

On every conversation turn:

1. The user sends a message.
2. The classifier receives:
   - Its own **classification prompt** (your instructions on how to classify).
   - The list of **available actions** (filtered by their conditions).
   - Each action's **classification trigger**, **parameters**, and **example phrases**.
   - The **user's message**.
3. The language model analyzes everything and returns:
   - Which **actions** matched the user's intent.
   - Any **parameter values** extracted from the message.
4. The matched actions' effects run.

## Creating a Classifier

Go to **Design > Classifiers** and click **Create Classifier**.

### Fields

- **Name** — A clear label (e.g., "Main Classifier", "Technical Support Classifier").
- **Description** — Optional notes.
- **Prompt** — Instructions that guide how the classifier should analyze input (see below).
- **LLM Provider** — Which language model to use for classification.
- **LLM Settings** — Model-specific settings (model name, temperature, etc.).

### The Classification Prompt

The prompt tells the classifier how to think about user input and what output format to produce. It's a [Handlebars template](../guide/templating) just like stage prompts — the system injects available context automatically.

#### What the Classifier Receives

When the classifier runs, the following variables are available in your prompt template:

- **`stage.availableActions`** — The list of actions currently eligible (conditions already checked), each with:
  - `id` — The action's unique ID (e.g., `check_order_status`)
  - `name` — The display name
  - `trigger` — The classification trigger description (the human-readable hint for the LLM)
  - `examples` — Array of example user phrases
  - `parameters` — Array of extractable parameters, each with `name`, `type`, and `description`
- **`userInput`** — The user's message.

#### Writing the Prompt

Use `{{#each stage.availableActions}}` to enumerate the actions and instruct the LLM on what to look for. Always include an explicit output format block so the LLM knows to return action IDs.

**Example classification prompt:**

```handlebars
You are a classification assistant. Your task is to analyze user input and extract actions with parameters.

{{#if stage}}
Available actions in this stage:
{{#each stage.availableActions}}
- **{{name}}** (ID: {{id}})
  {{#if examples}}
  Examples: {{join examples ", "}}
  {{/if}}
  {{#if parameters}}
  Parameters:
  {{#each parameters}}
    - {{name}} ({{type}}){{#if required}} *required*{{/if}}: {{description}}
  {{/each}}
  {{/if}}
{{/each}}
{{/if}}

Instructions:
1. Determine the user's actions from their input using the defined actions above.
2. Extract any parameters that match the defined actions for this stage.
3. For parameter extraction:
   - Only extract parameters that are explicitly mentioned or strongly implied in the user input.
   - For "text" type parameters, extract the relevant text value.
   - For "number" type parameters, extract numeric values.
4. For action classification:
   - Prioritize defined actions when the user input matches their trigger descriptions.
   - Consider the action associated with each intent when making classification decisions.
   - Fall back to general actions when no specific intent matches.
5. You can only use existing actions.

Respond with a JSON object in the following format:
{
  "actions": {
    "actionId1": {
      "parameter1": "value",
      "parameter2": "value"
    }
  }
}
```

#### Required Output Format

The classifier must return a JSON object. Keys are **action IDs** (not trigger labels), and each value is an object containing any extracted parameter values:

```json
{
  "check_order_status": {
    "orderId": "12345"
  },
  "escalate_to_agent": {}
}
```

Return an empty object `{}` if no actions match — for example, when the user sends a simple acknowledgment or an off-topic message.

::: warning Action IDs, not trigger labels
The LLM must return action **IDs** as keys (e.g., `check_order_status`) — not the classification trigger labels (e.g., "The user wants to check their order status"). The trigger label is only a hint shown to the LLM to help it understand what the action is for.
:::

::: tip Keep instructions concise
A brief prompt with clear per-action triggers usually outperforms elaborate prompts. Let the action triggers and examples do the heavy lifting — the prompt just sets the overall approach and output format.
:::

## Using Multiple Classifiers

Each stage has one **default classifier**, but individual actions can override it with a different classifier via the **overrideClassifierId** setting.

When multiple classifiers are involved:
- All of them run **in parallel** (no performance penalty).
- Each classifier only evaluates the actions assigned to it.
- Results are merged and deduplicated.

This is useful when you have a specialized domain that needs a different model or approach — for example, a fast, lightweight classifier for simple yes/no actions, and a more capable one for complex intents.

## Classification and Knowledge

When a stage has **Use Knowledge** enabled, knowledge categories are automatically injected into the classifier's consideration set as virtual actions. If the classifier matches a knowledge category, the relevant FAQ answers are included when the AI generates its response.

This means the classifier doesn't just match actions — it can also route to your knowledge base content. See [Knowledge Base](./knowledge) for details.

## Tips

- **Write action triggers clearly** — The classifier is only as good as the descriptions you give it. _"The user wants to check their order status"_ is better than _"order"_.
- **Provide examples on the actions** — Example user phrases help the classifier learn what real triggers look like.
- **Don't over-classify** — If the user says _"thanks"_, it probably doesn't need to trigger an action. A well-written prompt that says "return no matches for simple acknowledgments" handles this gracefully.
- **Use `__on_fallback`** on stages — When the classifier finds no match, the fallback action gives you control over what happens next, rather than leaving the AI to guess.
- **Lower temperature for classification** — Classification benefits from deterministic responses. A temperature of 0 or close to it usually works best.
