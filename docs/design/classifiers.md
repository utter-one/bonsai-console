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

The prompt tells the classifier how to think about user input. Write it in natural language:

```
Analyze the user's message and determine which of the available actions
best matches their intent. Consider the conversation context.

If the user's message is a simple acknowledgment or doesn't clearly
match any action, return no matches.
```

You don't need to list the actions in the prompt — the system automatically appends the available actions and the user's message.

::: tip Keep It Brief
A short, clear prompt usually works best. The classifier prompt sets the overall approach; action-level triggers and examples do the detailed matching.
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
