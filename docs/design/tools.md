# Tools

A **tool** is a reusable, callable function that the conversation can invoke during a turn. Tools come in three types: AI-powered **Smart Functions**, external **Webhooks**, and custom **Scripts**.

## Tool Types

### Smart Function

A smart function uses a language model to process input and produce output. Use smart functions for tasks that require AI reasoning:

- **Translation** — Translate a message into another language.
- **Summarization** — Condense a long conversation or document.
- **Data lookup** — Use AI reasoning to find information in structured data.
- **Image analysis** — Describe or analyze an image the user sent.
- **Content generation** — Create structured outputs like reports or emails.

### Webhook

A webhook tool sends an HTTP request to an external service and returns the response. Use webhooks to:

- **Fetch external data** — Look up order status, customer records, or any external API.
- **Trigger actions** — POST to a backend service, booking system, or CRM.
- **Integrate third-party services** — Send notifications, update records, or invoke workflows.

URL and body values support [template syntax](../guide/templating), so you can pass conversation data dynamically in the request.

### Script

A script tool runs custom JavaScript in a secure sandbox. Use scripts for:

- **Data processing** — Parse API responses, reformat values, calculate results.
- **Conditional logic** — Make complex decisions that aren't possible with built-in effects alone.
- **Flow control** — Navigate stages, end conversations, or suppress responses based on computed conditions.

Scripts have access to conversation context (variables, user profile, history, and results from previously called tools). See [Scripting](../guide/scripting) for full details.

## Creating a Tool

Go to **Design > Tools** and click **New Tool**.

### Tool Type

Select the type that fits your use case. The type cannot be changed after creation.

### Common Fields

All tools share these fields:

| Field | Description |
|---|---|
| **Name** | A clear, descriptive name (e.g., "Translate Text", "Fetch Order Status", "Calculate Price") |
| **Description** | What the tool does — helps identify it when configuring Call Tool effects |
| **Tags** | Optional labels for filtering and organizing tools |
| **Parameters** | The input values the tool expects (see [Tool Parameters](#tool-parameters)) |

### Smart Function Fields

| Field | Description |
|---|---|
| **Prompt** | A [template](../guide/templating) that defines what the AI should do with the input |
| **LLM Provider** | Which language model powers this tool |
| **LLM Settings** | Model-specific settings (model, temperature, etc.) |
| **Input Type** | What kind of input the tool accepts: `text`, `image`, or `multi-modal` |
| **Output Type** | What kind of output it produces: `text`, `image`, or `multi-modal` |

### Webhook Fields

| Field | Description |
|---|---|
| **URL** | Target URL — supports template syntax (e.g., <code v-pre>https://api.example.com/orders/{{vars.orderId}}</code>) |
| **Method** | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` |
| **Headers** | HTTP headers to send; values support template syntax (e.g., <code v-pre>Authorization: Bearer {{consts.apiToken}}</code>) |
| **Body** | Request body template; used for POST/PUT/PATCH requests |

### Script Fields

| Field | Description |
|---|---|
| **Code** | JavaScript code to execute in a secure sandboxed environment |

### Tool Parameters

Parameters define what data the tool needs to do its job:

| Property | Description |
|---|---|
| **Name** | Parameter name (e.g., `text`, `language`, `orderId`) |
| **Type** | Data type: `string`, `number`, `boolean`, `object`, or arrays of these, plus `image` and `audio` |
| **Description** | Explains what this parameter is for |
| **Required** | Whether the parameter must be provided |

## Using Tools

Tools are invoked via the **Call Tool** effect in a stage action:

1. Select the tool to call.
2. Map the parameters — you can use template syntax to pass conversation data:
   - <code v-pre>Text to translate: {{userInput}}</code>
   - <code v-pre>Target language: {{vars.targetLanguage}}</code>

The tool's result is stored in the execution context and can be used by subsequent effects and prompts.

### Via Client Command

Tools can also be invoked directly by the client application using a client command — without requiring a user utterance or classifier match. This is available in the **Playground** and is useful when the client application needs to steer conversation flow programmatically (e.g., a button press in a custom UI that triggers an immediate tool call).

## Multimodal Support

Smart Function tools can work with images and audio, not just text:

- **Image input** — Process images sent by users (requires a vision-capable model).
- **Audio input** — Process audio clips.
- **Image/audio output** — Generate visual or audio content.

## Tips

- **Choose the right type** — Use a Webhook tool for external API calls, a Script tool for data processing logic, and a Smart Function for tasks requiring AI reasoning.
- **Keep tools focused** — One tool should do one thing well.
- **Write clear smart function prompts** — The prompt should unambiguously describe what the tool does and how it processes input.
- **Choose the right model** — Lightweight tasks (like simple extraction) can use a smaller, cheaper model. Complex reasoning needs a more capable one.
- **Test with realistic data** — Make sure the tool produces useful results with the kind of input it will actually receive.
