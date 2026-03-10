# Global Constants

**Global constants** are project-wide key-value pairs available in all stage prompts and conversation logic via <span v-pre>`{{constants.key}}`</span>. Use them for values that don't change per conversation — company name, support hours, URLs, policy limits.

## Managing Constants

Go to **Design > Global Constants**. The view shows a list of all defined constants for the current project.

### Adding a Constant

Click **Add Constant** to create a new row. Each constant has three parts:

| Field | Description |
|---|---|
| **Key** | The name used when referencing this constant (e.g., `companyName`) |
| **Type** | `String`, `Number`, `Boolean`, or `JSON` |
| **Value** | The constant's value |

### Supported Types

| Type | Description | Example value |
|---|---|---|
| `String` | Plain text | `Acme Corp` |
| `Number` | Integer or decimal | `42` |
| `Boolean` | `true` or `false` | `true` |
| `JSON` | Inline JSON object or array | `{"tier": "pro", "limit": 100}` |

### Example Constants

| Key | Type | Value |
|---|---|---|
| `companyName` | String | `Acme Corp` |
| `supportHours` | String | `9am – 5pm EST` |
| `supportEmail` | String | `support@acme.com` |
| `maxRetries` | Number | `3` |
| `debugMode` | Boolean | `false` |

### Using Constants in Prompts

Reference any constant in a stage prompt or agent prompt:

```handlebars
Welcome to {{constants.companyName}} support!
Our hours are {{constants.supportHours}}.
```

See [Prompt Templating](../guide/templating) for all available template variables.

## Copy & Paste

Use **Copy** to export all constants as JSON and **Paste** to import them from the clipboard. Pasting merges with existing constants — existing keys are updated and new keys are added.

This is useful for transferring constants between projects or restoring from a backup.

## Tips

- **Use constants generously** — Company name, support hours, URLs — anything repeated across prompts belongs in constants.
- **Prefer constants over hardcoded values** — If you reference a value in multiple prompts, make it a constant. When the value changes, you only update it in one place.
- **Use JSON constants for structured data** — If you have a group of related values (e.g., business hours per day), a single JSON constant can be cleaner than many separate ones.
- **Keys must be unique** — The editor warns you if you have duplicate keys. Only the last value for a given key is saved.
