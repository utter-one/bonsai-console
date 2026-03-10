# Moderation

**Moderation** enables automatic content safety screening on user messages. When a message is flagged, it can be blocked before the AI processes it — and you can define what happens next using the [Moderation Blocked](./global-actions#moderation-blocked) special action.

## Configuring Moderation

Go to **Design > Moderation** to configure content moderation for the current project.

### Enable Moderation

Toggle **Enable content moderation** to turn screening on or off. When enabled, every user message is evaluated by the moderation API before being processed by the conversation engine.

### Select a Provider

Choose a **Moderation Provider** from the dropdown. Only **OpenAI** and **Mistral** LLM providers support the moderation API — other provider types won't appear in the list.

If no compatible provider is available, you'll see a warning. Add an OpenAI or Mistral provider in **Administration > Providers** first.

### Choose Blocked Categories

After selecting a provider, the available moderation categories for that provider are shown. Each category represents a type of content that can be flagged (e.g., hate speech, self-harm, violence).

- **Select specific categories** to block only those types of content.
- **Leave all unchecked** to block any flagged content regardless of category.

The available categories depend on the selected provider — switching providers resets the selection.

## What Happens When a Message Is Blocked

When moderation flags a user message:

1. The message is **not** sent to the AI for processing.
2. If a **Moderation Blocked** special action is configured (in **Design > Global Actions**), its effects run instead — for example, generating a polite refusal message.
3. If no Moderation Blocked action is set up, the default platform behavior applies.

See [Global Actions — Special Actions](./global-actions#special-actions) for how to configure the Moderation Blocked response.

## Tips

- **Start with all categories blocked** (leave the selection empty) and narrow down later if needed.
- **Always configure a Moderation Blocked response** — Without one, users get no feedback when their message is blocked.
- **Use a cost-effective provider** — Moderation calls are lightweight and run on every user message, so keep costs in mind.
