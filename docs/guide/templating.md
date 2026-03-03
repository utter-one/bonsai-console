# Prompt Templating

Prompts in Bonsai are not just static text — they're **templates** that can include dynamic content based on the conversation state. This is powered by the [Handlebars](https://handlebarsjs.com/) templating language.

You'll encounter templates in stage prompts, agent prompts, tool prompts, and several action effects.

## Inserting Dynamic Values

Use double curly braces <code v-pre>{{ }}</code> to insert a value:

```handlebars
Hello {{userProfile.name}}, welcome to {{constants.companyName}}.
```

### Available Data

| Variable | Description |
|---|---|
| `vars` | Current stage variables (data collected during the conversation) |
| `userProfile` | The end user's profile information (custom fields defined in the project) |
| `constants` | Project-level constants (company name, support hours, etc.) |
| `userInput` | What the user just said |
| `time` | Current date and time (timezone-aware) |
| `context.results` | Results from tool calls and webhooks |

### User Profile Fields

Custom fields can be declared per-project in **Administration > Projects > Memory** tab. Custom fields show up in the prompt editor's autocomplete and can be accessed the same way:

```handlebars
{{userProfile.tier}}
{{userProfile.accountId}}
{{userProfile.preferences.language}}
```

See [Projects](../administration/projects#user-profile-variables) for details on defining custom fields.

### Nested Properties

Access nested data with dots:

```handlebars
Your order {{vars.order.id}} is currently {{vars.order.status}}.
```

## Conditional Content

Show content only when a condition is met:

```handlebars
{{#if vars.customerName}}
I see your name is {{vars.customerName}}.
{{else}}
Could you tell me your name?
{{/if}}
```

### Checking if a Value Exists

The `exists` helper is safer than `#if` because it specifically checks for null or undefined:

```handlebars
{{#exists vars.orderNumber}}
Let me look up order {{vars.orderNumber}} for you.
{{/exists}}
```

### Checking Array Length

```handlebars
{{#hasItems vars.pendingOrders}}
You have {{vars.pendingOrders.length}} pending orders.
{{/hasItems}}
```

## Loops

Iterate over arrays with `#each`:

```handlebars
Here are the steps we've completed:
{{#each vars.completedSteps}}
- {{this}}
{{/each}}
```

## Useful Helpers

Bonsai includes several built-in helpers beyond standard Handlebars:

<div v-pre>

| Helper | What It Does | Example |
|---|---|---|
| `exists` | Show content only if a value is defined | `{{#exists vars.name}}...{{/exists}}` |
| `hasItems` | Show content only if an array has items | `{{#hasItems vars.orders}}...{{/hasItems}}` |
| `get` | Safely access deeply nested values | `{{get vars "customer.address.city"}}` |
| `join` | Join array elements with a separator | `{{join vars.sizes ", "}}` |
| `contains` | Check if an array contains a value | `{{#contains vars.features "premium"}}...{{/contains}}` |
| `default` | Provide a fallback if a value is missing | `{{default userProfile.name "valued customer"}}` |
| `json` | Output a value as JSON | `{{json vars}}` |

</div>

## Time Context

Every prompt has access to a `time` object with the current date and time, anchored to the conversation's timezone. This is especially useful for scheduling, booking, and any time-sensitive scenarios.

### Quick Start — Grounding the AI in Time

Add this at the top of any prompt to give the AI accurate awareness of the current date and time:

```handlebars
{{time.anchor}}
```

This produces a single sentence like:

> Today is Friday, 27 February 2026 (Europe/Warsaw, UTC+01:00). This week (Mon–Sun): 23 Feb–1 Mar. Next week: 2 Mar–8 Mar.

### Common Time Fields

| Field | Example | Description |
|---|---|---|
| `time.date` | `2026-02-27` | Current date |
| `time.time` | `14:30:00` | Current time (24-hour) |
| `time.dayOfWeek` | `Friday` | Day of the week |
| `time.timezone` | `Europe/Warsaw` | Active timezone |
| `time.nextMonday` | `2026-03-02` | Date of next Monday |
| `time.nextTuesday` | `2026-03-03` | Date of next Tuesday |
| `time.calendar` | _(array)_ | Next 14 days with day names and dates |

### Timezone Priority

The timezone is determined once when a conversation starts:

1. Timezone passed in the connection message (highest priority)
2. Timezone stored in the user's profile
3. Project-level timezone setting
4. UTC (fallback)

### Example — Booking Assistant

```handlebars
{{time.anchor}}

You are a booking assistant for {{constants.companyName}}.
When the user says "next Tuesday", that means {{time.nextTuesday}}.
When the user says "this Friday", that means {{time.nextFriday}}.
```

## Full Prompt Example

Here's a realistic stage prompt combining several template features:

```handlebars
{{time.anchor}}

You are a {{constants.agentRole}} for {{constants.companyName}}.

{{#exists vars.customerName}}
You are speaking with {{vars.customerName}}.
{{/exists}}

{{#exists vars.issue}}
Current issue: {{vars.issue}}
Steps completed so far:
{{#hasItems vars.steps}}
{{#each vars.steps}}
- {{this}}
{{/each}}
{{/hasItems}}
{{/exists}}

Always be polite and professional. If you cannot resolve the issue,
offer to transfer to a human agent.
```

## Tips

- **Use `exists` guards** around variables that might not be set yet.
- **Put shared values in project constants** (like your company name) instead of repeating them in every prompt.
- **Use variables** to build up context across conversation turns — the prompt can reference everything collected so far.
- **Test with edge cases** — think about what happens when a variable is empty or hasn't been set.
