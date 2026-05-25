# Testers

**Testers** are AI-powered personas that simulate end users during automated scenario runs. Each tester is configured with a prompt that defines how it behaves — its personality, communication style, and decision-making logic.

## Creating a Tester

Navigate to **Testing → Testers** and click **New Tester**. The form has five tabs:

### General Tab

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | A descriptive name for the persona (e.g., "Frustrated Customer", "Tech-Savvy User"). |
| **Description** | No | Optional notes about what kind of user this persona simulates. |
| **Tags** | No | Optional labels for organising testers. Use tags to group personas by type (e.g., `support`, `sales`). |

### Prompt Tab

This tab configures the AI behaviour of the tester.

#### LLM Provider

Select an [LLM provider](../administration/providers#llm) from the dropdown, then configure its settings:

- **Model** — Which model to use for the persona's reasoning.
- **Max Tokens**, **Temperature**, **Top P** — Standard model parameters.
- **Timeout** — Request timeout in milliseconds.

Provider-specific reasoning/thinking settings (reasoning effort for OpenAI, extended thinking for Claude, etc.) are also configurable via the **Settings…** button.

#### Persona Prompt

A full-prompt editor (CodeMirror with Markdown support) that defines how the tester behaves during conversations. This prompt is sent to the LLM each turn and instructs the persona on how to respond.

Example persona prompt:
```
You are a customer calling about a billing issue. You are frustrated but polite.
You want to resolve the issue quickly. If the agent doesn't offer a refund within
3 turns, hang up.
```

#### Hang-Up Prompt

An optional mini-prompt evaluated at each conversation turn to decide whether the tester should end the call. It must return `true` to continue or `false` to hang up. This is used when the scenario has **Persona Can Hang Up** enabled.

Example:
```
If the agent has offered a refund, return false to hang up. Otherwise return true to continue.
```

### User Profile Tab

Define key-value pairs that are passed as the user profile when the tester starts a conversation. Fields can reference the project's [user profile variable descriptors](../design/global-memory#user-profile) or be custom entries. Supported types include text, number, and boolean.

### Metadata & History Tabs

- **Metadata** — View immutable identifiers (Tester ID, Project ID, Version, timestamps).
- **History** — Audit log of changes made to the tester, with ability to recover previous versions via [Entity History](../guide/core-concepts#entity-history).

## Where Testers Are Used

Testers are used exclusively in **scenario runs**. When you execute a scenario, you select one or more testers and specify how many conversations each should have. Each conversation is then generated independently with the selected persona.
