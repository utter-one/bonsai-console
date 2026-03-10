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
7. **AI-powered utility functions** → [Tools](./tools)
8. **FAQ content for consistent answers** → [Knowledge Base](./knowledge)
9. **User profile schema and project constants** → [Global Memory](./global-memory)
10. **Content moderation settings** → [Moderation](./moderation)

## Where to Start

If you're setting up a new project, a good order is:

1. **Create a agent** — Even a simple personality prompt gets you started.
2. **Create a classifier** — You'll need one for your stages to understand user input.
3. **Create your first stage** — Assign the agent and classifier. Write a prompt that tells the AI what to do. Set the enter behavior to "Generate response" so the AI speaks first.
4. **Add actions to the stage** — Define what happens when users say specific things.
5. **Add more stages** — Map out the full conversation flow and connect stages with "go to stage" effects.
6. **Add knowledge** — Create FAQ categories to handle common questions.
7. **Create global actions** — Factor out any behaviors that repeat across stages.
8. **Set up global memory** — Define project constants and user profile schema.
9. **Configure moderation** — Enable content moderation and select blocked categories.

## Cloning

Most design resources (agents, stages, classifiers, tools, etc.) can be **cloned** to create copies. This is handy when you want to create a variation of something without starting from scratch — for example, a slightly different agent for after-hours support, or a new stage based on an existing one.

## Templating & Scripting

Prompts throughout the Design section support **dynamic templates** with Handlebars syntax. You can insert variables, use conditionals, and loop over data. For custom logic beyond what templates can do, action effects support **JavaScript scripting**.

- [Prompt Templating](../guide/templating) — Dynamic prompts with variables.
- [Scripting](../guide/scripting) — Custom JavaScript in action effects.
