# How to Design a Project

This guide walks you through the process of designing a complete conversational AI project in Bonsai Console — from the initial conversation map all the way to a working, testable flow.

## 1. Map the Conversation into Stages

Open **Design > Stages** — this is where you'll spend most of your time. A stage is a distinct phase where the AI has one focused goal.

**Start with the happy path.** Walk through the ideal conversation from beginning to end. Each time the AI's goal fundamentally changes (from "greet" to "verify identity" to "solve problem"), that's a new stage.

Then add:
- **Branching stages** — For decision points where the AI needs a different prompt, different actions, or a different tone.
- **Exception-handling stages** — For situations like angry users, missing data, or system errors that need dedicated handling.

**Keep each stage single-purpose.** If a stage tries to do two things at once (e.g., verify identity AND collect a cancellation reason), the prompt gets muddled and classification becomes unreliable. Split it.

::: tip Rule of Thumb
If you find yourself writing "if X then do Y, otherwise do Z" in a single prompt, you probably need two stages instead.
:::

## 2. Create Your Agent(s)

Go to **Design > Agents** and create the AI's persona.

- **One agent is usually enough.** Only create multiple agents when the personality genuinely changes mid-conversation (e.g., a receptionist hands off to a specialist with a completely different tone and voice).
- **Write personality traits, not scripts.** Describe *how* the agent behaves ("warm, concise, uses contractions") rather than giving it exact lines to say. Stage prompts handle the situational wording.
- **Match voice to personality.** If you configure TTS, the voice, speed, and tone should fit the written persona. A casual personality sounds wrong with a formal, slow voice.

**Agent prompt vs. stage prompt:** The agent prompt is appended to every stage's system prompt automatically. Put universal personality traits in the agent; put situational instructions in the stage.

## 3. Plan Variables and Constants

Variables are the conversation's working memory. Constants are project-wide values that never change per conversation.

### Variables (per stage)

Go to each stage's **Variables** tab:

- **Identify all data** the conversation needs to collect, compute, or reference across stages.
- **Assign each variable to the stage that collects it.** Don't duplicate variables across stages. If the "Identify Customer" stage collects `email`, other stages read it from <span v-pre>`{{stageVars.identify-customer.email}}`</span>.
- **Define typed descriptors** — choose proper types (`string`, `number`, `boolean`, `object`, arrays). This gives the LLM and context transformers a schema to work with.

### Constants (project-level)

Go to **Design > Global Constants**:

- Use constants for values that don't change per conversation — company name, policy limits, plan prices, support hours.
- Access them in any prompt via <span v-pre>`{{constants.key}}`</span>.
- Constants support types: String, Number, Boolean, and JSON (for structured data).

See [Prompt Templating](./templating) for all available template variables.

## 4. Choose Your Classifiers

Go to **Design > Classifiers**. A classifier determines *what the user wants* from their message.

- **One general-purpose classifier is usually enough.** A well-written intent classifier handles most stages. You don't need one per stage.
- **Create specialized classifiers only when the classification task is fundamentally different:**
  - A **yes/no confirmation classifier** — optimized for acceptance vs. rejection
  - A **reason/sentiment classifier** — for categorizing open-ended responses
  - A **topic classifier** — for routing among many possible subjects
- **Write the classifier prompt about the *task*, not the *answers*.** Tell it *how* to classify ("analyze the user's intent and determine which action best matches"). The available actions' classification triggers tell it the possible outcomes.
- **Use a faster/cheaper LLM for classifiers.** Classification is simpler than response generation — a smaller model with lower temperature works well.
- **Override per action when needed.** Individual actions have an **Override Classifier ID** setting if one action in a stage needs different classification logic.

## 5. Design Actions and Effects

Switch to each stage's **Actions** tab and define what happens when the user speaks.

### Writing Good Actions

- **One action = one user intent.** Don't create an action that handles "customer agrees OR asks a question." Split those.
- **Write clear classification triggers.** Be descriptive: *"Customer wants to cancel their subscription"* rather than just *"cancel"*.
- **Add 3–5 examples per action.** These user phrases are injected into the classifier prompt and dramatically improve accuracy.
- **Use conditions to enable/disable actions dynamically.** If an action only makes sense when a variable has a certain value, gate it with a JavaScript expression. This keeps the classifier focused on relevant options.

### Common Effect Patterns

| Pattern | When to Use |
|---|---|
| `Go to stage` | Conversation needs to move to a new phase |
| `Call webhook` → `Run script` | Fetch external data, then process or branch based on the result |
| `Modify variables` → `Generate response` | Update state, then let the AI respond with awareness of new data |
| `Generate response` (prescripted) | Exact wording matters (legal disclaimers, confirmation messages) |
| `Generate response` (generated) | Flexible, context-aware response |
| `Run script` with `goToStage()` | Dynamic routing based on complex logic |
| `End conversation` | Graceful ending (AI says goodbye first) |
| `Abort conversation` | Immediate termination (no AI response) |

### Lifecycle Actions

Every stage has three special built-in actions (find them in the **Lifecycle** tab):

- **On Enter** (`__on_enter`) — Runs when the conversation enters this stage. Use it to initialize variables, call setup webhooks, or log analytics. Cannot navigate away or end the conversation.
- **On Leave** (`__on_leave`) — Runs when the conversation leaves this stage. Use it for cleanup or saving state externally. Cannot navigate to another stage.
- **On Fallback** (`__on_fallback`) — Runs when no action matches the user's input. Almost every stage should have one — typically a `Generate response` (generated) effect so the AI handles the miss gracefully.

See [Actions & Effects](../design/actions) for full reference.

## 6. Set Up Context Transformers

Go to **Design > Context Transformers**. Transformers extract structured data from free-form user input.

**Use transformers when:**
- You need to pull out specific fields (email, phone, date, name) from what the user says.
- You want extraction to happen in parallel with classification — transformers and classifiers run simultaneously, so there's no extra latency.
- You want to decouple extraction logic from action logic.

**In the stage's Features tab**, attach transformers by checking them in the **Attached Transformers** list.

**Design tips:**
- Be explicit about what to extract — name each field and describe the expected format in the transformer prompt.
- Use **context fields** to declare which variables the transformer writes to.
- Pair transformers with actions that have **Trigger on Transformation** enabled and **watched variables** set. When a transformer fills in a variable, matching actions fire automatically — enabling reactive, event-driven flows.
- Only attach transformers to stages where extraction is needed. Each one consumes an LLM call.

See [Context Transformers](../design/context-transformers) for full reference.

## 7. Add Knowledge Base Content

Go to **Design > Knowledge** to create FAQ-style content the AI can use.

- **Organize into categories** with descriptive **prompt triggers** — the trigger tells the classifier when to surface that category's items.
- **Use tags** on categories and **knowledge tags** on stages to control which content is available where. Don't load irrelevant knowledge into a stage — it dilutes classification accuracy.
- **Enable knowledge per stage** by checking **Enable Knowledge Base** in the stage's **Features** tab. A greeting stage probably doesn't need knowledge; a product-questions stage does.

See [Knowledge Base](../design/knowledge) for full reference.

## 8. Configure Global Actions & Guardrails

Go to **Design > Global Actions & Guardrails** to create project-wide actions that work across multiple stages.

Good candidates for global actions:
- "I want to speak to a manager" (escalation)
- "Can you repeat that?" (repeat)
- "What time is it?" (meta-questions)
- Emergency or safety triggers
- Language switching

**Guardrails** — actions that enforce safety or consistency rules regardless of stage — are also defined here. For example, a guardrail might block off-topic requests or refuse policy-violating content.

**Control which stages use them** in each stage's **Features** tab:
- **Enable Global Actions** checked + empty list = all global actions active
- **Enable Global Actions** checked + specific IDs selected = only those
- **Enable Global Actions** unchecked = none (useful for stages where interruptions shouldn't happen, like a final goodbye)

### Special Actions

The **Special Actions** dropdown on the Global Actions page gives access to system-triggered actions like **Moderation Blocked** — the response that runs when user input is flagged by moderation. Click it, initialize the action, and configure its effects.

See [Global Actions & Guardrails](../design/global-actions) for full reference.

## 9. Set Up Global Constants and Memory

Go to **Design > Global Memory**. This page has two tabs:

- **Constants** tab — Define project-wide values (company name, support hours, etc.) accessible in all prompts via <span v-pre>`{{constants.key}}`</span>.
- **User Profile** tab — Declare the user profile schema — the custom fields your conversations will read and write on user profiles. This enables autocomplete in the prompt editor.

See [Global Memory](../design/global-memory) for details.

## 10. Configure Moderation

Go to **Design > Moderation** to enable content safety screening.

1. Toggle **Enable content moderation**.
2. Select a compatible provider (OpenAI or Mistral).
3. Choose which content categories to block.

Then go to **Design > Global Actions**, open the **Special Actions** dropdown, and set up the **Moderation Blocked** action to define what happens when a message is flagged.

See [Moderation](../design/moderation) for full reference.

## 11. Write Stage Prompts

The stage prompt is the most important part of each stage. Open the **Prompt** tab and follow these principles:

1. **State the objective first.** *"Your task is to verify the customer's identity."*
2. **Provide example phrasing as guidelines, not scripts.** *"Something like: 'Can I grab your email address?'"*
3. **Inject variable context conditionally.** Use Handlebars to show the AI what's already known:
   ```handlebars
   {{#exists vars.email}}Customer email: {{vars.email}}.{{/exists}}
   ```
4. **Add behavioral guardrails.** *"Do NOT attempt to sell."* / *"Do NOT proceed without confirmation."*
5. **Reference cross-stage data.** Use <span v-pre>`{{stageVars.identify-customer.customerName}}`</span> to pull data collected in other stages.
6. **Keep prompts focused.** A prompt handling too many scenarios is a sign the stage should be split.
7. **Use time context for temporal awareness.** <span v-pre>`{{time.dateTime}}`</span> grounds the AI in the current moment.

The prompt editor supports syntax highlighting and auto-completion for template variables. See [Prompt Templating](./templating) for the full template reference.

## 12. Choose Enter Behavior

In each stage's **Basic** tab, set the **Default Enter Behavior**:

| Value | When to Use |
|---|---|
| **Generate Response** | The AI should speak first upon entering the stage — greeting, presenting an offer, summarizing results |
| **Await User Input** | The AI should wait for the user — use this when the previous stage's response already set up the transition (e.g., after a question that ends with "what do you think?") |

Most stages use **Generate Response**. Use **Await User Input** when the stage transition itself serves as the prompt.

## 13. Scripting Tips

When you add **Run Script** effects, keep these guidelines in mind:

- Scripts run JavaScript in a sandbox — no network or filesystem access. External calls go through **Call Webhook** effects.
- Flow control functions (`goToStage`, `endConversation`, etc.) are queued and execute after the script completes. Only the last call of each type takes effect.
- Mutate `vars` and `userProfile` directly — changes persist automatically.
- Keep scripts short. Complex logic is better handled by an external service via webhooks.

See [Scripting](./scripting) for the full scripting reference.

## 14. Design Checklist

Use this checklist to make sure you haven't missed anything:

1. **Map the conversation flow** as stages (nodes) and transitions (edges)
2. **Identify the happy path** and all exception paths
3. **Create one agent** (add more only if the persona changes)
4. **Create 1–3 classifiers** (general intent + specialized ones if needed)
5. **List all data** the conversation collects → assign as stage variables or global constants
6. **Define global constants** for project-wide values (company name, hours, URLs)
7. **Define the memory schema** for user profile fields your conversations will track
8. **Create context transformers** for stages that extract structured data from free text
9. **Design actions per stage** — triggers, conditions, effects, examples
10. **Add lifecycle actions** (on enter, on leave, on fallback) where needed
11. **Create knowledge categories** for FAQ-heavy stages
12. **Create global actions** for cross-cutting intents
13. **Configure moderation** — enable screening and set up the Moderation Blocked response
14. **Write prompts** — agent first, then each stage
15. **Configure providers** — LLM, TTS, ASR at appropriate levels
16. **Test each stage in isolation** in the [Playground](./playground), then test full flows end-to-end
