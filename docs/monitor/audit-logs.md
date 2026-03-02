# Audit Logs

The **Audit Logs** view provides a complete, read-only record of every administrative action performed through the console.

## What Gets Logged

Every time an operator creates, updates, or deletes a resource, an audit log entry is recorded with:

| Field | Description |
|---|---|
| **Operator** | Who performed the action |
| **Action** | What they did (create, update, delete) |
| **Entity type** | What kind of resource was affected (stage, agent, project, etc.) |
| **Entity ID** | Which specific resource was changed |
| **Previous state** | The resource's state before the change |
| **New state** | The resource's state after the change |
| **Timestamp** | When the action occurred |

## Use Cases

- **Track changes** — See exactly who changed what and when. Useful when something breaks and you need to figure out which edit caused it.
- **Compliance and governance** — Maintain a record of all operator actions for compliance purposes.
- **Collaboration** — When multiple team members work on the same project, audit logs show who did what.
- **Rollback support** — The previous and new state data lets you see exactly what changed, making it easier to manually revert a problematic edit.

## Access

Audit logs are visible to users with the `audit:read` permission. By default, super admins have this permission. See [Operators & Roles](../administration/operators) for details on permissions.

## Tips

- **Correlate with issues** — If conversations start failing after a certain time, check audit logs to see what changed around that time.
- **Use filters** — Filter by entity type, operator, or date range to find specific changes quickly.
