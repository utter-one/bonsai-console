# Scripting

For situations where templates and built-in effects aren't enough, Bonsai lets you write custom **JavaScript** that runs during a conversation. Scripts execute inside the `run_script` action effect.

## What Scripts Can Do

Scripts are useful for:
- **Conditional logic** — If the customer has retried 3 times, escalate.
- **Data processing** — Parse a webhook response, reformat a phone number, calculate a value.
- **Flow control** — Decide which stage to go to next based on complex conditions.
- **Input manipulation** — Clean up or enrich what the AI sees as the user's message.

## Safety

Scripts run in a **secure sandbox** with strict limits:
- **5-second time limit** — Long-running code is automatically stopped.
- **16 MB memory limit** — Prevents runaway memory usage.
- **No internet access** — Scripts cannot make network requests (use the `call_webhook` effect for that).
- **No file access** — Scripts cannot read or write files on the server.

This means scripts are safe to use — they can only read and modify conversation data.

## What's Available in Scripts

### Data You Can Read and Modify

| Variable | Access | Description |
|---|---|---|
| `vars` | Read & Write | Stage variables — the main place to store conversation data |
| `userProfile` | Read & Write | The end user's profile |
| `userInput` | Read & Write | The current user message (modify to change what the AI sees) |

### Data You Can Read Only

| Variable | Description |
|---|---|
| `conversationId` | Current conversation's unique ID |
| `projectId` | Current project ID |
| `stageId` | Current stage ID |
| `stage` | Full stage information (name, available actions, metadata) |
| `history` | All messages in the conversation so far |
| `events` | Complete event log (messages, actions, stage changes, tool calls) |
| `actions` | Classification results — which actions were matched |
| `results` | Results from webhooks and tool calls |
| `time` | Current date/time with timezone (same fields as in templates) |
| `originalUserInput` | The unmodified user input before any scripts changed it |
| `userInputSource` | How the user communicated: `'text'`, `'voice'`, or `null` |
| `stageVars` | Variables from all stages (keyed by stage ID) |

## Common Patterns

### Setting Variables

```javascript
vars.retryCount = (vars.retryCount || 0) + 1;

vars.order = {
  id: "ORD-123",
  status: "pending"
};
```

### Conditional Logic

```javascript
if (vars.retryCount >= 3) {
  vars.needsEscalation = true;
  vars.escalationReason = "Max retries exceeded";
}
```

### Processing Webhook Results

```javascript
const response = results.webhooks?.orderLookup;
if (response) {
  vars.customerName = response.firstName + " " + response.lastName;
  vars.accountTier = response.subscription?.tier || "free";
}
```

### Time-Based Decisions

```javascript
const hour = parseInt(time.hour, 10);
const isWeekend = time.dayOfWeek === 'Saturday' || time.dayOfWeek === 'Sunday';
vars.isBusinessHours = !isWeekend && hour >= 9 && hour < 17;
```

## Flow Control Functions

These functions let a script control the conversation flow. They take effect _after_ the script finishes running.

| Function | What It Does |
|---|---|
| `goToStage(stageId)` | Navigate to a different stage |
| `endConversation(reason?)` | Gracefully end the conversation |
| `abortConversation(reason?)` | Immediately terminate the conversation |
| `prescriptResponse(text)` | Send a specific message instead of generating one with the AI |
| `suppressResponse()` | Don't generate any response for this turn |

::: warning `goToStage` is ignored in lifecycle actions
`goToStage()` has no effect when called from a script running inside `__on_enter` or `__on_leave`. If you need stage navigation, use a regular user-triggered action.
:::

### Example — Smart Routing

```javascript
if (vars.retryCount >= 3) {
  goToStage('escalation-stage');
} else if (vars.taskComplete) {
  prescriptResponse('All done! Is there anything else I can help with?');
}
```

## History Helpers

Convenient functions for working with conversation history:

| Function | What It Does |
|---|---|
| `lastMessage(role?)` | Get the text of the last message, optionally filtered by `'user'` or `'assistant'` |
| `messageCount(role?)` | Count total messages, optionally by role |
| `historyText(opts?)` | Get formatted conversation transcript (options: `n` for limit, `role` to filter) |
| `historyContains(text, role?)` | Check if any message contains specific text (case-insensitive) |
| `stageMessages(role?)` | Get only messages from the current stage |

### Example — Detecting Patterns

```javascript
if (historyContains('cancel', 'user')) {
  vars.wantsToCancel = true;
}

if (messageCount('user') >= 5) {
  vars.longConversation = true;
}
```

## Utility Functions

| Function | What It Does |
|---|---|
| `uuid()` | Generate a unique ID |
| `formatDate(iso, locale?, options?)` | Format a date string (e.g., `formatDate(time.iso, 'en-US', { dateStyle: 'long' })`) |

## Debugging

Use `console.log()`, `console.warn()`, and `console.error()` in scripts. The output is captured in the conversation's event log, which you can view in the Monitor section.

```javascript
console.log("Processing order:", vars.orderId);
console.log("Retry count:", vars.retryCount);
```

## Limitations to Keep in Mind

- Scripts are **synchronous** — no `async`/`await` or promises.
- No external modules or `require()` / `import`.
- No `setTimeout` or `setInterval`.
- For network calls, use the `call_webhook` or `call_tool` effects instead of scripts.
- Always check if variables exist before using them to avoid errors.
