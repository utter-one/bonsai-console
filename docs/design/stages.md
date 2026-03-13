# Stages

A **stage** represents a step or phase in a conversation. Stages are the central building block of conversation design — they tie together everything: the AI's prompt, its personality, how user input is understood, what actions are available, and what data is being tracked.

## Thinking in Stages

A customer service conversation might have stages like:

| Stage | Purpose |
|---|---|
| **Greeting** | Welcome the user and ask what they need |
| **Identify Issue** | Figure out what the problem is |
| **Troubleshooting** | Walk through resolution steps |
| **Escalation** | Transfer to a human agent |
| **Farewell** | Wrap up and say goodbye |

Each stage has its own context — its own prompt, available actions, and tracked data. The conversation moves between stages based on what happens (via the "go to stage" action effect).

## Creating a Stage

Go to **Design > Stages** and click **Create Stage**.

### Basic Settings

- **Name** — A descriptive label (e.g., "Greeting", "Order Lookup").
- **Description** — Optional notes for your team.
- **Agent** — Which personality and voice the AI uses in this stage.
- **LLM Provider** — Which language model generates the AI's responses.
- **LLM Settings** — Fine-tune the model settings (model name, temperature, max tokens, etc.).

### System Prompt

The prompt tells the AI what to do at this particular step. It's a [Handlebars template](../guide/templating) that can include dynamic content. Key variables available in stage prompts:

| Variable | Description |
|---|---|
| <code v-pre>{{agent}}</code> | The agent's personality prompt — **must be explicitly included** |
| `faq` | Array of matched Q&A pairs (`question`/`answer`) — **must be explicitly included** via <code v-pre>{{#hasItems faq}}</code> if Knowledge is enabled |
| <code v-pre>{{time.anchor}}</code> | Current date/time context sentence |
| <code v-pre>{{vars.*}}</code> | Stage variables collected during the conversation |
| <code v-pre>{{userProfile.*}}</code> | The end user's profile fields |
| <code v-pre>{{consts.*}}</code> | Project-level constants |

::: warning These variables are not auto-injected
Without <code v-pre>{{agent}}</code> in the prompt, the agent's personality is silently absent. Without the `faq` block, matched knowledge results are silently discarded even when the classifier found relevant content. Always include both on stages that use an agent and/or knowledge lookup.
:::

A canonical stage prompt looks like this:

```handlebars
{{agent}}

You are a customer service agent for {{consts.companyName}}.
The customer's name is {{userProfile.name}}.

{{#if (exists vars.issue)}}
The customer is experiencing: {{vars.issue}}
Help them resolve this issue step by step.
{{else}}
Ask the customer what they need help with today.
{{/if}}

{{#hasItems faq}}
Relevant knowledge:
{{#each faq}}
Q: {{this.question}}
A: {{this.answer}}
{{/each}}
{{/hasItems}}
```

See [Prompt Templating](../guide/templating) for the full list of available variables and helpers, including the <code v-pre>{{agent}}</code> and <code v-pre>{{faq}}</code> variables.

### Enter Behavior

When a conversation enters a stage (either at the very start, or when navigating from another stage), the **enter behavior** controls what happens first:

- **Generate response** — The AI immediately speaks based on the prompt. Good for greetings or informational stages where the AI should take the initiative.
- **Await user input** — The system waits for the user to say something first. Good when the user should initiate.

### Classifier

Select a **default classifier** for this stage. The classifier analyzes user input and decides which actions to trigger. See [Classifiers](./classifiers) for details.

### Knowledge

- **Use Knowledge** — Enable this to let the AI draw on your knowledge base for FAQ-type answers.
- **Knowledge Tags** — Filter which knowledge categories are relevant to this stage. If left empty, all categories are considered.

See [Knowledge Base](./knowledge) for more.

### Global Actions

- **Use Global Actions** — Enable this to make project-level global actions available in this stage.
- **Specific Actions** — Optionally pick only certain global actions rather than all of them.

See [Global Actions](./global-actions) for more.

### Context Transformers

Select which **context transformers** should run on each user input in this stage. Transformers automatically extract structured data (like names or order numbers) from what the user says.

See [Context Transformers](./context-transformers) for more.

## Variables

Each stage can define **variables** — named pieces of data that are tracked during the conversation. Variables are used in prompts, action conditions, and scripts.

### Defining Variable Descriptors

Variable descriptors declare what data this stage expects:

| Property | Description |
|---|---|
| **Name** | The variable name (e.g., `customerName`) |
| **Type** | `string`, `number`, `boolean`, or `object` |
| **Is Array** | Whether this holds multiple values |
| **Object Schema** | For object types, define nested fields |

Variables are stored per-stage — each stage has its own set. When the conversation moves to a different stage and later returns, the original stage's variables are still there.

### How Variables Get Populated

Variables can be set by:
- **Context transformers** — Automatically extracted from user input.
- **Action effects** — The `modify_variables` or `run_script` effects can set or update them.
- **Webhook and tool results** — Data returned from external services can be stored in variables.

### Using Variables

Variables are available in:
- **Prompts** — <code v-pre>{{vars.customerName}}</code>
- **Action conditions** — `vars.retryCount < 3`
- **Scripts** — `vars.retryCount = (vars.retryCount || 0) + 1`

::: tip Memory (User Profile Variables)
Stage variables (`vars.*`) are scoped to a single conversation. For data that persists across all of a user's conversations (e.g., account tier, preferences), use **user profile variables** instead. The schema for custom `userProfile.*` fields is defined at the project level in **Administration > Projects > Memory** tab.
:::

## Actions

Actions define what happens when the user triggers them. Each stage has its own set of actions. See [Actions & Effects](./actions) for the full breakdown.

## Stage Navigation

Conversations move between stages through the **go to stage** action effect. When a stage transition happens:

1. The current stage's `__on_leave` lifecycle action runs (if defined).
2. The new stage loads with its own prompt, agent, classifier, and actions.
3. The new stage's `__on_enter` lifecycle action runs (if defined).
4. The new stage's enter behavior activates (generate response or await input).

### Lifecycle Actions

Stages support three special actions that run automatically at specific moments:

| Action | When It Runs | Good For |
|---|---|---|
| `__on_enter` | When the conversation enters the stage | Initialization, setting default variable values |
| `__on_leave` | When the conversation is about to leave the stage | Cleanup, saving state |
| `__on_fallback` | When no user-triggered action matches | Default response for unrecognized input |

## Tips

- **Start simple** — Begin with a few stages and add complexity as you learn what's needed.
- **Name stages clearly** — Other team members (and future you) should instantly know what each stage does.
- **Use enter behaviors intentionally** — "Generate response" creates a proactive AI that guides the conversation; "Await user input" lets the user lead.
- **Use `__on_fallback`** — Define it on stages to handle cases where the classifier doesn't find a match, rather than leaving the AI to improvise.
