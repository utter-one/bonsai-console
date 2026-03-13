# Global Memory

The **Global Memory** page combines two related areas of project configuration in a tabbed view: the **User Profile** schema and **Constants**. Access it from **Design > Global Memory**.

Both tabs share a single **Save Changes** button in the page header — remember to save after making changes in either tab.

## User Profile Tab

The **User Profile** tab defines the schema for custom fields stored on each end user's profile. Declaring fields here enables autocomplete in the prompt editor and documents your data model for the team.

### Auto-Create Users

Toggle **Automatically create users** to let the system create a user record on first connection when no matching user exists. The new user gets the provided user ID and an empty profile.

### Adding a Variable

Click **Add Variable** to define a new profile field. Each variable has:

| Property | Description |
|---|---|
| **Name** | Field name (e.g., `tier`, `accountId`, `preferences`) |
| **Type** | `string`, `number`, `boolean`, `object`, or array variants (`string[]`, `number[]`, etc.) |
| **Object Schema** | For `object` types, define nested fields inline |

### Nested Objects

When a variable's type is `object`, you can define its inner fields — each with its own name and type. This lets you describe complex structures like:

```
preferences (object)
├── language (string)
├── notifications (boolean)
└── theme (string)
```

### Using Profile Fields

Custom fields are accessed in prompts and scripts like built-in ones:

```handlebars
{{userProfile.tier}}
{{userProfile.preferences.language}}
```

In scripts, mutate `userProfile` directly:

```javascript
userProfile.tier = 'premium'
userProfile.preferences.language = 'es'
```

Values can also be set via `modify_user_profile` action effects.

### Schema is Informational

The schema documents the expected shape of user profiles — it provides autocomplete in the prompt editor and makes the data model explicit for your team. It does not enforce or validate the data at runtime. Values are set dynamically through action effects and scripts.

### Copy & Paste (User Profile)

Use **Copy** to export the memory schema as JSON and **Paste** to import from the clipboard. This is useful for transferring schemas between projects.

## Constants Tab

**Constants** are project-wide key-value pairs available in all stage prompts and conversation logic via <span v-pre>`{{consts.key}}`</span>. Use them for values that don't change per conversation — company name, support hours, URLs, policy limits.

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
Welcome to {{consts.companyName}} support!
Our hours are {{consts.supportHours}}.
```

See [Prompt Templating](../guide/templating) for all available template variables.

### Copy & Paste (Constants)

Use **Copy** to export all constants as JSON and **Paste** to import them from the clipboard. Pasting merges with existing constants — existing keys are updated and new keys are added.

This is useful for transferring constants between projects or restoring from a backup.

## Tips

- **Define your memory schema early** — Declaring custom profile fields gives you autocomplete in the prompt editor from the start.
- **Use meaningful names** — Field names appear in autocomplete and templates, so `accountTier` is more useful than `t`.
- **Keep it flat when possible** — Deeply nested objects are harder to reference in templates. Use objects for genuinely structured data (like `address` with `street`, `city`, `zip`), not as a general namespace.
- **Use constants generously** — Company name, support hours, URLs — anything repeated across prompts belongs in constants.
- **Prefer constants over hardcoded values** — If you reference a value in multiple prompts, make it a constant. When the value changes, you only update it in one place.
- **Use JSON constants for structured data** — If you have a group of related values (e.g., business hours per day), a single JSON constant can be cleaner than many separate ones.
- **Keys must be unique** — The editor warns you if you have duplicate keys. Only the last value for a given key is saved.
