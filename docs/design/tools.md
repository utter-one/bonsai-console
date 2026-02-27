# Tools

A **tool** is an AI-powered function that can be called during a conversation. Tools use a language model to process input and produce output — they're useful for tasks that go beyond simple data manipulation.

## What Tools Are For

Think of tools as specialized AI assistants that your main conversation AI can call on:

- **Translation** — Translate a message into another language.
- **Summarization** — Condense a long conversation or document.
- **Data lookup** — Use AI reasoning to find information in structured data.
- **Image analysis** — Describe or analyze an image the user sent.
- **Content generation** — Create structured outputs like reports or emails.

## Creating a Tool

Go to **Design > Tools** and click **Create Tool**.

### Fields

- **Name** — A clear name (e.g., "Translate Text", "Analyze Image").
- **Description** — What the tool does. This helps you and your team understand its purpose.
- **Prompt** — A [template](../guide/templating) that defines what the AI should do with the input. This is the "job description" for the tool.
- **LLM Provider** — Which language model powers this tool.
- **LLM Settings** — Model-specific settings (model, temperature, etc.).
- **Input Type** — What kind of input the tool accepts: `text`, `image`, or `multi-modal`.
- **Output Type** — What kind of output it produces: `text`, `image`, or `multi-modal`.
- **Parameters** — The input values the tool expects.

### Tool Parameters

Parameters define what data the tool needs to do its job:

| Property | Description |
|---|---|
| **Name** | Parameter name (e.g., `text`, `language`) |
| **Type** | Data type: `string`, `number`, `boolean`, `object`, or arrays of these, plus `image` and `audio` |
| **Description** | Explains what this parameter is for |
| **Required** | Whether the parameter must be provided |

## Using Tools in Actions

Tools are invoked through the **Call Tool** effect in a stage action:

1. Select the tool to call.
2. Map the parameters — you can use template syntax to pass conversation data:
   - <code v-pre>Text to translate: {{userInput}}</code>
   - <code v-pre>Target language: {{vars.targetLanguage}}</code>

The tool's result is stored in the execution context and can be used by subsequent effects and prompts.

## Multimodal Support

Tools can work with images and audio, not just text:

- **Image input** — Process images sent by users (requires a vision-capable model).
- **Audio input** — Process audio clips.
- **Image/audio output** — Generate visual or audio content.

## Tips

- **Write clear tool prompts** — The prompt should unambiguously describe what the tool does and how it should process the input.
- **Keep tools focused** — One tool should do one thing well. A "Translate" tool and a "Summarize" tool are better than a "Translate and Summarize" tool.
- **Choose the right model** — Lightweight tasks (like simple extraction) can use a smaller, cheaper model. Complex reasoning needs a more capable one.
- **Test with realistic data** — Make sure the tool produces useful results with the kind of input it will actually receive.
