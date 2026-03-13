# Knowledge Base

The **knowledge base** is a structured FAQ system. You organize question-and-answer pairs into categories, and the AI can draw on this content to answer common questions accurately and consistently.

## Why Use Knowledge?

Without a knowledge base, you'd need to either:
- Write a separate action for every question users might ask, or
- Put all the information into the stage prompt (which gets long and unwieldy).

The knowledge base gives you a clean, manageable way to add FAQ content. The AI automatically uses the right answers when it detects a relevant question.

## How It Works

1. You create **categories** — groups of related Q&A pairs (e.g., "Billing FAQ", "Product Features"). Each category must have a **Prompt Trigger** that describes when it is relevant — this is what the classifier uses to match user questions to the category.
2. You add **items** to each category — specific question-and-answer pairs.
3. You enable knowledge on a stage.
4. During a conversation, the classifier detects when the user asks a question that matches a category's prompt trigger.
5. The relevant Q&A pairs are included in the AI's context, and it generates an answer based on them.

The key insight: Knowledge categories appear to the classifier as virtual actions — the prompt trigger describes the intent, just like an action's classification trigger. The classifier matches the user's question to the right category, and the AI then uses the specific Q&A items to form its response.

## Creating Categories

Go to **Design > Knowledge** and click **Create Category**.

### Category Fields

- **Name** — A descriptive label (e.g., "Return Policy", "Pricing FAQ").
- **Prompt Trigger** — A phrase that describes when this category is relevant. This is what the classifier uses to match user questions. For example: _"The user is asking about returns, refunds, or exchanges."_ **This field is required** — without it, the classifier has no way to route questions to this category.
- **Order** — Controls the display order in the console.

### Writing Good Prompt Triggers

The prompt trigger is how the classifier knows to route a question to this category. Be specific:

| Trigger | Quality |
|---|---|
| _"returns"_ | Too vague |
| _"The user is asking about product returns, refunds, exchanges, or return shipping"_ | Good — covers the full range of related topics |

## Adding Items

Within a category, add question-and-answer pairs:

- **Question** — The question users might ask (e.g., _"What is your return policy?"_).
- **Answer** — The accurate answer (e.g., _"We accept returns within 30 days of purchase with the original receipt."_).
- **Order** — Controls the display order.

::: tip Keep Answers Factual
Write answers that state facts clearly. The AI will use your answers as the source of truth and compose a natural response based on them — you don't need to worry about making answers conversational.
:::

## Using Knowledge on Stages

On the stage edit view:

Enable **Use Knowledge** — this makes all knowledge categories available for classifier matching in this stage.

## Example

**Category:** Return Policy
- **Prompt Trigger:** _"The user is asking about returns, refunds, or exchanges"_

**Items:**

| Question | Answer |
|---|---|
| What is your return policy? | We accept returns within 30 days of purchase with the original receipt. Items must be in original condition. |
| How do I get a refund? | To request a refund, visit your order page and click "Request Refund". Refunds are processed within 5-7 business days. |
| Can I exchange an item? | Yes, exchanges are available for items currently in stock. Visit our exchange portal or contact support. |

When a user asks _"How can I return something?"_, the classifier matches the Return Policy category, and the AI uses these Q&A items to form an accurate response.

## Tips

- **Use specific prompt triggers** — Help the classifier accurately match user questions to the right category.
- **Keep items focused** — Each item should cover one specific question. Don't combine multiple topics in one item.
- **Review periodically** — FAQ content goes stale. Update answers when policies, prices, or processes change.
- **Don't over-rely on knowledge** — For complex scenarios that require multi-step interactions, use stages and actions instead.
