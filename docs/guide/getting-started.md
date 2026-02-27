# Quick Start

This page walks you through your first login and the basic steps to get a project up and running.

## Logging In

1. Open the Bonsai Console URL in your browser.
2. Enter your admin email and password.
3. Click **Log In**.

You'll land on the Dashboard.

::: tip First-Time Setup
If this is a brand-new installation with no admin accounts yet, you'll see a one-time setup screen where you create the first super-admin account.
:::

## Selecting a Project

Almost everything in Bonsai is organized inside a **project**. A project represents one complete conversational AI experience (for example, a customer service bot for your website).

Use the **project selector** dropdown in the top navigation bar to switch between projects. The Design and Monitor sections will automatically show data for whichever project is selected.

## Creating Your First Project

1. Go to **Administration > Projects**.
2. Click **Create Project**.
3. Fill in:
   - **Name** — A human-readable name (e.g., "Customer Support Bot").
   - **Description** — Optional notes about what this project is for.
4. Save the project.

## Setting Up a Provider

Before your AI can do anything, it needs access to a language model. Providers are connections to external AI services.

1. Go to **Administration > Providers**.
2. Click **Create Provider**.
3. Choose the provider type — for a basic setup, pick **LLM** (language model).
4. Select the API type (e.g., OpenAI, Anthropic).
5. Enter your API key and any other required settings.
6. Save.

You can add more providers later for voice synthesis (TTS), speech recognition (ASR), and storage.

## Building a Basic Conversation

With a project and a provider in place, you can start designing:

### 1. Create a Persona

Go to **Design > Personas** and create a persona. This defines the AI's personality:

- **Name** — e.g., "Friendly Agent"
- **Personality Prompt** — Describe how the AI should behave: _"You are a warm, professional customer service agent. You use simple language and always confirm you've understood the customer before moving on."_
- **Voice settings** — If you have a TTS provider, choose a voice here.

### 2. Create a Stage

Go to **Design > Stages** and create your first stage. Think of a stage as a step in the conversation:

- **Name** — e.g., "Greeting"
- **Prompt** — The instructions for the AI at this step: _"Welcome the customer and ask how you can help."_
- **Persona** — Select the persona you just created.
- **LLM Provider** — Select the language model provider you configured.
- **Enter Behavior** — Choose "Generate response" so the AI speaks first when a conversation starts.

### 3. Create an API Key

Go to **Administration > API Keys** (or the project's API Keys section) and create a key. Client applications will use this key to connect to your project and start conversations.

### 4. Test It

Use the **Playground** to start a test conversation and see your AI in action. You can send text messages and see how the assistant responds based on your stage prompt and persona.

## What's Next?

Now that you have a working conversation, explore the more powerful features:

- [Stages](../design/stages) — Add more steps to your conversation flow.
- [Actions & Effects](../design/actions) — Make the AI _do_ things beyond just talking.
- [Classifiers](../design/classifiers) — Teach the system to understand user intent.
- [Knowledge Base](../design/knowledge) — Add FAQ content for accurate, consistent answers.
