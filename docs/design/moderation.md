# Moderation

**Moderation** enables automatic content safety screening on user messages. When a message is flagged, it is blocked before the AI processes it — and you can define what happens next using the **Moderation Blocked** action, configurable directly in the Moderation tab.

## Configuring Moderation

Go to **Design > Guardrails** and open the **Moderation** tab to configure content moderation for the current project.

### Enable Moderation

Toggle **Enable content moderation** to turn screening on or off. When enabled, every user message is evaluated by the moderation API before being processed by the conversation engine.

### Moderation Mode

Choose how strictly moderation is applied relative to the rest of the processing pipeline:

- **Strict** *(default)* — Moderation runs before all other processing. The turn is held until the moderation result is available, ensuring no flagged message is ever processed.
- **Standard** — Moderation runs after filler generation, in parallel with classification and knowledge retrieval, reducing perceived latency. Flagged messages are still blocked before classification results are acted upon.

Use **Standard** mode when latency matters and you are comfortable with the filler sentence being sent before the moderation result is available.

### Configure Blocked Action

Click **Configure Action** to set up how the system responds when a user message is blocked. This opens a guided modal with the following preset options:

- **End Conversation** — Sends a prescripted response to the user and ends the conversation.
- **Prescripted Response** — Sends a prescripted response and replaces the user's message with a redact placeholder before further processing.
- **Redact Only** — Silently replaces the user's message with a placeholder. No explicit response is sent.
- **Nothing** — Takes no action; the conversation continues as normal after the blocked turn.

Each preset allows you to customise the response text and/or the redact placeholder. You can also click **Configure Manually** in the modal to edit the underlying **Moderation Blocked** global action directly in **Design > Global Actions**.

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
2. The **Moderation Blocked** action runs — its effects are determined by whichever preset (or manual configuration) you chose in **Configure Action**.
3. If no blocked action has been configured, no response is sent to the user.

For project-wide safety rules that run on every turn using a classifier, see [Guardrails](./guardrails).

## Tips

- **Start with all categories blocked** (leave the selection empty) and narrow down later if needed.
- **Always configure a Moderation Blocked action** — Without one, users get no feedback when their message is blocked.
- **Use Standard mode** to reduce latency if your project sends filler sentences and a brief delay before blocking is acceptable.
- **Use a cost-effective provider** — Moderation calls are lightweight and run on every user message, so keep costs in mind.
