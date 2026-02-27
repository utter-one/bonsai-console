# Context Transformers

A **context transformer** automatically extracts structured data from what the user says and writes it into stage variables. Think of it as an AI-powered form filler that works in the background of every conversation turn.

## Why Use Transformers?

Instead of writing explicit actions to ask for and capture every piece of information, transformers do it passively. If a user says _"My name is Sarah and I live in London"_, a transformer can pull out:

- `customerName` → `"Sarah"`
- `city` → `"London"`

...without any special action being triggered. The data just gets collected as the conversation flows naturally.

## How They Work

1. You create a transformer with a prompt and a list of field names to extract.
2. You assign the transformer to one or more stages.
3. On every user message, the transformer runs **in parallel** with the classifier (no added delay).
4. The language model reads the conversation and extracts values for your fields.
5. Extracted values are written into the stage's variables.

## Creating a Context Transformer

Go to **Design > Context Transformers** and click **Create Context Transformer**.

### Fields

- **Name** — A clear label (e.g., "Customer Info Extractor").
- **Description** — Optional notes.
- **Prompt** — Instructions telling the AI what to look for (see below).
- **Context Fields** — The list of variable names to populate (these should match your stage's variable descriptors).
- **LLM Provider** — Which language model performs the extraction.
- **LLM Settings** — Model-specific settings.

### The Extraction Prompt

Write the prompt as clear instructions about what to look for:

```
Extract the following information from the user's message.
Only extract values that are explicitly stated or clearly implied.
Return null for any fields not mentioned.

Fields to extract:
- customerName: The user's full name
- orderNumber: Any order or reference number mentioned
- issueType: Category of the issue (billing, technical, shipping)
```

::: tip Be Specific
Describe exactly what constitutes a valid value for each field. This reduces false extractions and improves accuracy.
:::

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

## Use Cases

- **Progressive form filling** — Collect name, email, phone number naturally over the course of a conversation, without asking each question in turn.
- **Entity extraction** — Pull out product names, dates, locations, reference numbers.
- **Sentiment tracking** — Continuously evaluate user sentiment and store it as a variable that conditions and scripts can check.
- **Topic detection** — Identify when the conversation topic shifts, and trigger a stage transition.

## Tips

- **Keep field lists focused** — A transformer with 3-5 fields works better than one trying to extract 20 things at once. Use multiple transformers if needed.
- **Match field names to variable descriptors** — The context fields should correspond to the variable descriptors defined on the stage.
- **Don't extract what you already know** — If you've already collected the customer's name, you don't need to keep extracting it.
- **Use for optional enrichment** — Transformers work best as a complement to explicit actions, not a replacement. Use actions for critical data that must be collected, and transformers for opportunistic extraction.
