# Design Overview

The **Design** section is where you build your AI assistant's behavior. Everything here is scoped to the currently selected project — make sure you've picked a project from the selector in the top navigation bar.

## What You'll Build

At a high level, designing a conversation means defining:

1. **Who the AI is** → [Agents](./agents)
2. **What steps the conversation goes through** → [Stages](./stages)
3. **What the AI can do when users say things** → [Actions & Effects](./actions)
4. **How the AI understands user intent** → [Classifiers](./classifiers)
5. **How data is extracted from the conversation** → [Context Transformers](./context-transformers)
6. **Shared behaviors that work across stages** → [Global Actions](./global-actions)
7. **Project-wide safety, guardrails, and moderation** → [Guardrails & Moderation](./guardrails)
8. **AI-powered utility functions** → [Tools](./tools)
9. **FAQ content for consistent answers** → [Knowledge Base](./knowledge)
10. **User profile schema and project constants** → [Global Memory](./global-memory)

## Where to Start

If you're setting up a new project, follow the [Project Design Guide](../guide/project-design) for a step-by-step walkthrough — from mapping the conversation flow to writing prompts and testing the finished result.

## Templating & Scripting

Prompts throughout the Design section support **dynamic templates** with Handlebars syntax. You can insert variables, use conditionals, and loop over data. For custom logic beyond what templates can do, action effects support **JavaScript scripting**.

- [Prompt Templating](../guide/templating) — Dynamic prompts with variables.
- [Scripting](../guide/scripting) — Custom JavaScript in action effects.
