# Agents

A **agent** defines the AI's personality and, optionally, its speaking voice. Think of it as the character your AI assistant plays in a conversation.

## Why Agents Matter

The agent's prompt shapes _how_ the AI communicates — its tone, vocabulary, mannerisms, and behavioral rules. A well-crafted agent makes conversations feel natural and consistent.

You might have different agents for different situations:
- A **friendly greeter** for initial contact
- A **technical specialist** for troubleshooting
- A **formal agent** for sensitive topics like billing

## Creating a Agent

Go to **Design > Agents** and click **Create Agent**.

### Name & Description

- **Name** — A clear label for your team (e.g., "Friendly Support Agent"). This isn't shown to end users.
- **Description** — Optional notes about when and how to use this agent.

### Personality Prompt

This is the most important field. It tells the AI how to behave. Write it in plain language:

```
You speak in a warm, professional tone. You use simple language and
avoid technical jargon. You always confirm you've understood the
customer before moving on. When the user seems frustrated, you
acknowledge their feelings first.
```

The personality prompt is combined with each stage's prompt — the stage says _what_ to do, and the agent says _how_ to do it.

::: tip Keep It Focused
The personality prompt should describe communication style, not tasks. Leave task instructions (what to ask, what information to collect) for stage prompts.
:::

### Voice Configuration (Optional)

If your project uses voice output (text-to-speech), you can configure the AI's speaking voice here. The available settings depend on which TTS provider you're using:

| Provider | Key Settings |
|---|---|
| **ElevenLabs** | Voice ID, model, stability, similarity boost, style |
| **OpenAI** | Voice name (alloy, echo, fable, etc.), model, speed |
| **Azure** | Voice name (e.g., en-US-JennyNeural), output format |
| **Deepgram** | Model name (e.g., aura-asteria-en) |
| **Cartesia** | Voice ID, model, language, output format |

You'll need to have a TTS provider set up in **Administration > Providers** before configuring voice settings.

## Using Agents in Stages

Every stage references exactly one agent. When the AI generates a response in that stage, it combines:

1. The stage's system prompt (what to do)
2. The agent's personality prompt (how to do it)

Multiple stages can share the same agent, which keeps the AI's personality consistent as the conversation moves through different phases.

## Best Practices

- **One personality per agent** — Don't put task instructions in the personality prompt.
- **Be specific about tone** — "Be friendly" is vague. "Use casual language, short sentences, and occasional humor" is better.
- **Include behavioral rules** — Describe what the AI should and shouldn't do: _"Never make promises about refund timelines"_ or _"Always ask permission before transferring to another department."_
- **Test with real scenarios** — Have a conversation with your AI and see if the personality feels right. Adjust until it does.
