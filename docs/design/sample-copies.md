# Sample Copies

**Sample Copies** let you deliver pre-written, prescripted answers in conversations. Instead of the AI generating a response from scratch, the system selects from a curated set of variant answers and injects them into the conversation — either as context hints for the LLM, or as direct responses that bypass AI generation entirely.

## How It Works

On each conversation turn, the system:

1. **Classifies user input** — A dedicated sample copy classifier (LLM-powered) evaluates the user's message against all active sample copies' prompt triggers.
2. **Selects a sample copy** — If the classifier matches a copy, it returns that copy's name.
3. **Samples content** — The system picks the configured number of items from the copy's content array using the chosen sampling method.
4. **Injects or forces** — Depending on the mode, the selected content is either injected into the prompt context or returned directly as the AI response.

::: tip When Does It Run?
Sample copy classification only runs on a stage if the stage prompt contains <code v-pre>{{copy}}</code> or <code v-pre>{{copy.</code>. If neither is present, the stage skips sample copy processing entirely.
:::

## Creating a Sample Copy

Go to **Design > Sample Copies** and click **Create Sample Copy**.

### Basic Fields

| Field | Description |
|---|---|
| **Name** | A unique identifier for this copy within the project. Used by the classifier to refer to it. |
| **Prompt Trigger** | A natural-language description of when this copy should activate — e.g. *"The user is asking about our return policy or requesting a refund."* |
| **Content** | One or more variant answers to select from. Add at least one item; add multiple to enable sampling across variants. |

### Scoping

By default, a sample copy is available in every stage and for every agent. You can narrow this:

| Field | Description |
|---|---|
| **Stages** | Restrict to specific stage IDs. Leave empty to apply to all stages. |
| **Agents** | Restrict to stages that use a specific agent. Leave empty for all agents. |

Both conditions must be satisfied for a copy to be considered active in a given stage.

### Sampling

| Field | Description |
|---|---|
| **Amount** | Number of content items to select on each turn. Defaults to `1`. |
| **Sampling Method** | `random` — shuffles and picks from the array each turn (stateless). `round_robin` — cycles through items in order; state is preserved for the full conversation. |

When `amount` is greater than `1`, the selected items are joined with newlines and injected as a single <code v-pre>{{copy}}</code> value.

### Mode

| Mode | Behaviour |
|---|---|
| `regular` (default) | Injects the selected content into the prompt as <code v-pre>{{copy}}</code>. The LLM uses it as guidance but may rephrase or expand on it. |
| `forced` | Returns the selected content **directly as the AI response**, bypassing the LLM entirely. Useful for legal disclaimers or any case where exact wording must be preserved. |

### Classifier Override

By default, sample copy classification uses the project-level default classifier configured in **Project Settings > Sample Copy Config**. You can override this per copy by setting **Classifier Override** to a specific classifier ID.

### Copy Decorator

Attach a **Copy Decorator** to wrap the selected content in a template before injection. For example, you could automatically add an instruction prefix around every selected answer without modifying each copy individually. See [Copy Decorators](#copy-decorators) below.

## Copy Decorators

A **Copy Decorator** is a reusable template that wraps selected sample copy content before it is injected into the conversation (or returned as a forced response).

Go to **Design > Copy Decorators** to manage decorators.

### Template Syntax

The decorator `template` field is a Handlebars template. Use <code v-pre>{{content}}</code> as the placeholder for the selected copy content:

```handlebars
Use the following approved answer verbatim:

{{content}}

Do not paraphrase or shorten the above text.
```

When a sample copy with this decorator is matched, the final injected <code v-pre>{{copy}}</code> value will be the full decorated string, not just the raw content.

::: tip When to Use Decorators
Decorators are most useful when you have many sample copies that all need the same surrounding instructions. Instead of repeating the wrapping text in every copy, create one decorator and reference it from each copy.
:::

## Template Variables

Add <code v-pre>{{copy}}</code> to your stage prompt to receive sample copy content. See [Sample Copy Variables](../guide/templating#sample-copy-variables) in the Templating guide for the full variable reference.

### Quick Example

```handlebars
{{agent}}

You are a customer service agent.

{{#if copy}}
Use the following prescripted answer for this question:
{{copy}}
{{/if}}
```

When a sample copy matches, <code v-pre>{{copy}}</code> is populated with the (optionally decorated) selected content. When no copy matches, <code v-pre>{{copy}}</code> is an empty string and the `#if` block is skipped — the AI responds normally.

## Classifier Configuration

Sample copy classification requires a project-level default classifier:

1. Go to **Administration > Projects** and open your project's settings.
2. Under **Sample Copy Config**, set the `defaultClassifierId` to the classifier you want to use.

The classifier receives the list of all active sample copies and their prompt triggers, then returns the name of the best match (or `null` if none apply).

## Conversation Events

Each turn produces a `sample_copy_selection` event in the conversation event log (visible in **Monitor > Conversations**):

| Field | Description |
|---|---|
| `classifierId` | ID of the classifier used |
| `input` | The user input that was classified |
| `sampleCopy` | Name of the matched copy, or `null` if none matched |

## Example

A sample copy for a return policy that switches between two phrasing variants using round-robin:

```json
{
  "name": "return-policy",
  "promptTrigger": "Activate when the user asks about returning a product, refund policy, or exchange",
  "content": [
    "Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5–7 business days.",
    "You can return any unused item within 30 days for a full refund. Please keep the original packaging. Refunds take up to 7 business days."
  ],
  "amount": 1,
  "samplingMethod": "round_robin",
  "mode": "regular"
}
```

## See Also

- [Prompt Templating](../guide/templating) — Full reference for <code v-pre>{{copy}}</code>, <code v-pre>{{copyContent}}</code>, and <code v-pre>{{sampleCopy}}</code>
- [Classifiers](./classifiers) — How to configure classifiers for sample copy selection
- [Scripting](../guide/scripting) — Accessing copy data from JavaScript action scripts
