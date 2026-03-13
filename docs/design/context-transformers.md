# Context Transformers

A **context transformer** is an LLM-powered component that runs on every conversation turn and can do much more than just extract data. Common uses include:

- **Data extraction** — Pull structured values out of what the user says (e.g., `customerName`, `orderNumber`).
- **Whispers** — Inject bracketed hints like `[customer sounds frustrated]` directly into the user's utterance to subtly influence the AI's response.
- **Prompt additions** — Generate a piece of text that gets appended to the stage prompt, dynamically enriching the context the AI sees.
- **Helper variables** — Compute and store values (sentiment score, detected topic, etc.) that conditions and scripts can use to control the flow.

Transformers run in parallel with classifiers on each user input — no added latency.

## Why Use Transformers?

Instead of writing explicit actions to ask for and capture every piece of information, transformers do it passively. If a user says _"My name is Sarah and I live in London"_, a transformer can pull out:

- `customerName` → `"Sarah"`
- `city` → `"London"`

...without any special action being triggered. The data just gets collected as the conversation flows naturally. Beyond data collection, transformers can also steer the conversation through whispers, prompt additions, and trigger reactive flows via watched variables.

## How They Work

1. You create a transformer with a prompt and a list of field names to extract.
2. You assign the transformer to one or more stages via the stage's **Transformer IDs** list.
3. On every user message, all referenced transformers run **in parallel** with the classifier (no added delay).
4. The language model reads the conversation and returns a JSON object with extracted values.
5. Only fields declared in **Context Fields** are accepted — any extra fields returned by the LLM are discarded.
6. Extracted values are **merged** into the stage's variable store. Fields omitted from the LLM's response keep their current values.
7. All variable writes from all transformers are flushed to the database in a single batch update.

## Creating a Context Transformer

Go to **Design > Context Transformers** and click **Create Context Transformer**.

### Fields

- **Name** — A clear label (e.g., "Customer Info Extractor").
- **Description** — Optional notes.
- **Prompt** — Instructions for the AI — what to extract, generate, or compute (see below).
- **Context Fields** — The list of variable names to populate. These should correspond to the variable descriptors defined on the stage. Only fields listed here are written; any extra fields the LLM returns are silently discarded.
- **LLM Provider** — Which language model performs the extraction.
- **LLM Settings** — Model-specific settings.

### The Extraction Prompt

The prompt is a **Handlebars template** with access to the full conversation context. Use the variables below to give the LLM the information it needs.

#### Template Variables

| Variable | Description |
|---|---|
| <code v-pre>{{schema}}</code> | Pseudo-JSON schema of the expected output — field names and their types derived from `contextFields` cross-referenced with the stage's variable descriptors. Always include this so the LLM knows the exact JSON structure to return. |
| <code v-pre>{{{json context}}}</code> | Current values of the transformer's context fields. Shows what is already populated so the LLM can decide what to update or leave unchanged. |
| <code v-pre>{{vars.*}}</code> | All stage variables (e.g. <code v-pre>{{vars.customerName}}</code>). |
| <code v-pre>{{userInput}}</code> | The current user message being processed. |
| <code v-pre>{{history}}</code> | Conversation history as an array of `{role, content}` entries. |
| <code v-pre>{{userProfile.*}}</code> | User profile fields. |
| <code v-pre>{{time.*}}</code> | Time context anchored to the conversation's timezone. |

A typical prompt using these variables:

```
Extract the following information from the user's message.
Only extract values that are explicitly stated or clearly implied.
Return null for any fields not mentioned.

Return a JSON object matching this schema:
{{schema}}

Current values (only update fields that changed):
{{{json context}}}
```

::: tip Be Specific
Describe exactly what constitutes a valid value for each field. This reduces false extractions and improves accuracy.
:::

#### Schema Format

<code v-pre>{{schema}}</code> renders as a JSON-like object where each value is the field's type label:

```json
{
  "customerName": "string",
  "orderNumber": "string",
  "issueType": "string",
  "itemCount": "number",
  "tags": ["string"],
  "address": {
    "street": "string",
    "city": "string"
  }
}
```

The LLM should respond with a JSON object of the same shape, with actual values instead of type labels.

## Triggering Actions from Transformations

Transformers can indirectly trigger actions. When a transformer sets or changes a variable, any action that:
- Has **Trigger on Transformation** enabled, and
- Is **watching** that variable

...will activate automatically.

For example, you could have an action that fires when `orderNumber` is newly set, automatically kicking off an order lookup via webhook.

### Watch Modes

| Mode | Fires When |
|---|---|
| **New** | The variable was unset before and now has a value |
| **Changed** | The variable already existed and its value was updated |
| **Removed** | The variable was cleared (set to null) |
| **Any** | The variable was set, updated, or cleared |
## Use Cases

- **Progressive form filling** — Collect name, email, phone number naturally over the course of a conversation, without asking each question in turn.
- **Entity extraction** — Pull out product names, dates, locations, reference numbers.
- **Sentiment tracking** — Continuously evaluate user sentiment and store it as a variable that conditions and scripts can check.
- **Topic detection** — Identify when the conversation topic shifts, and trigger a stage transition.

## Tips

- **Keep field lists focused** — A transformer with 3-5 fields works better than one trying to extract 20 things at once. Use multiple transformers if needed.
- **Always include <code v-pre>{{schema}}</code>** — This ensures the LLM knows what JSON structure to return and reduces formatting errors.
- **Use <code v-pre>{{{json context}}}</code> to avoid re-extracting known values** — Show the LLM what's already filled in so it can skip those fields.
- **Match field names to variable descriptors** — The context fields should correspond to the variable descriptors defined on the stage.
- **Don't extract what you already know** — If you've already collected the customer's name, you don't need to keep extracting it.
- **Use for optional enrichment** — Transformers work best as a complement to explicit actions, not a replacement. Use actions for critical data that must be collected, and transformers for opportunistic extraction.
