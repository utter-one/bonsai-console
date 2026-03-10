# Global Memory

**Global memory** defines the schema for custom fields stored on each end user's profile. Declaring fields here enables autocomplete in the prompt editor and documents your data model for the team.

## Managing the Memory Schema

Go to **Design > Global Memory**. The view shows the user profile variable schema for the current project.

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

## Schema is Informational

The schema documents the expected shape of user profiles — it provides autocomplete in the prompt editor and makes the data model explicit for your team. It does not enforce or validate the data at runtime. Values are set dynamically through action effects and scripts.

## Copy & Paste

Use **Copy** to export the memory schema as JSON and **Paste** to import from the clipboard. This is useful for transferring schemas between projects.

## Tips

- **Define your memory schema early** — Declaring custom profile fields gives you autocomplete in the prompt editor from the start.
- **Use meaningful names** — Field names appear in autocomplete and templates, so `accountTier` is more useful than `t`.
- **Keep it flat when possible** — Deeply nested objects are harder to reference in templates. Use objects for genuinely structured data (like `address` with `street`, `city`, `zip`), not as a general namespace.
