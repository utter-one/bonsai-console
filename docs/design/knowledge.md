# Knowledge Base

The **knowledge base** is a structured FAQ system. You organize question-and-answer pairs into categories, and the AI can draw on this content to answer common questions accurately and consistently.

## Why Use Knowledge?

Without a knowledge base, you'd need to either:
- Write a separate action for every question users might ask, or
- Put all the information into the stage prompt (which gets long and unwieldy).

The knowledge base gives you a clean, manageable way to add FAQ content. The AI automatically uses the right answers when it detects a relevant question.

## How It Works

1. You create **categories** — groups of related Q&A pairs (e.g., "Billing FAQ", "Product Features"). Each category must have a **Prompt Trigger** that describes when it is relevant — this is what the classifier uses to match user questions to the category.
2. You add **items** to each category — each item can have multiple questions that map to a single answer.
3. You enable knowledge on a stage.
4. During a conversation, the classifier detects when the user asks a question that matches a category's prompt trigger.
5. The relevant Q&A pairs are included in the AI's context, and it generates an answer based on them.

The key insight: Knowledge categories appear to the classifier as virtual actions — the prompt trigger describes the intent, just like an action's classification trigger. The classifier matches the user's question to the right category, and the AI then uses the specific Q&A items to form its response.

## Creating Categories

Go to **Design > Knowledge** and click **New Category**. A new category is created and appears in the list with inline editing enabled.

### Category Fields (inline editing)

All category fields are editable inline — no modal dialogs:

- **Name** — A descriptive label (e.g., "Return Policy", "Pricing FAQ"). Editable directly in the category header with a seamless, label-style input. **This field is required.**
- **Tags** — Tags for categorizing and filtering categories. Displayed below the category name in a horizontal layout.
- **Prompt Trigger** — A phrase that describes when this category is relevant. This is what the classifier uses to match user questions. For example: _"The user is asking about returns, refunds, or exchanges."_ **This field is required** — without it, the classifier has no way to route questions to this category.
- **Order** — Controls the display order in the console. Located in the category header, aligned to the right.

### Writing Good Prompt Triggers

The prompt trigger is how the classifier knows to route a question to this category. Be specific:

| Trigger | Quality |
|---|---|
| _"returns"_ | Too vague |
| _"The user is asking about product returns, refunds, exchanges, or return shipping"_ | Good — covers the full range of related topics |

## Adding Items

Click the **+** button on a category to add an item. Items are editable inline with a two-column layout:

- **Questions** — Each item can have multiple questions (different ways users might ask the same thing). Each question is an auto-sizing text area. Add new questions using the **+ Add question** button in the right column. **At least one non-empty question is required.**
- **Answer** — The accurate answer shared across all questions in the item. **This field is required.**
- **Order** — Controls the display order within the category (right column).

::: tip Multiple Questions Per Item
An item can have multiple questions mapping to the same answer. For example, "What is your return policy?" and "How do I return something?" can be two questions for the same answer item.
:::

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

| Questions | Answer |
|---|---|
| What is your return policy?<br>How do I return something? | We accept returns within 30 days of purchase with the original receipt. Items must be in original condition. |
| How do I get a refund?<br>What's the refund process? | To request a refund, visit your order page and click "Request Refund". Refunds are processed within 5-7 business days. |
| Can I exchange an item? | Yes, exchanges are available for items currently in stock. Visit our exchange portal or contact support. |

When a user asks _"How can I return something?"_, the classifier matches the Return Policy category, and the AI uses these Q&A items to form an accurate response.

## Tips

- **Use specific prompt triggers** — Help the classifier accurately match user questions to the right category.
- **Use multiple questions per item** — Capture different ways users might ask the same thing, all mapping to one answer.
- **Keep items focused** — Each item should cover one specific topic. Don't combine multiple topics in one item.
- **Review periodically** — FAQ content goes stale. Update answers when policies, prices, or processes change.
- **Don't over-rely on knowledge** — For complex scenarios that require multi-step interactions, use stages and actions instead.
