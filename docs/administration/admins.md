# Admins & Roles

The **Admins** view is where you manage the team members who have access to the Bonsai Console.

## Admin Accounts

Each admin has:
- **Email** — Used for logging in.
- **Name** — Display name.
- **Roles** — One or more roles that determine what they can see and do.

### Creating an Admin

Go to **Administration > Admins** and click **Create Admin**. Fill in the email, name, and password, then assign one or more roles.

## Roles

Roles control what an admin can access. Each role comes with a set of permissions.

| Role | Access Level |
|---|---|
| **Super Admin** | Full access to everything — all features and settings |
| **Content Manager** | Create and edit projects, personas, stages, classifiers, transformers, tools, knowledge, providers, and API keys |
| **Support** | View projects and conversations, manage users and issues |
| **Developer** | Read-only access to most resources plus system configuration |
| **Viewer** | Read-only access to most resources |

### Choosing the Right Role

- Give **Super Admin** only to team leads or platform administrators.
- Give **Content Manager** to people who design and maintain conversations.
- Give **Support** to customer service team members who need to review conversations and handle issues.
- Give **Developer** to technical staff who need to inspect configurations.
- Give **Viewer** to stakeholders who need to see what's configured but shouldn't change anything.

## Permissions

Behind the scenes, each role grants a set of permissions following the `entity:action` pattern. For example:

| Entity | Permissions |
|---|---|
| **Project** | `project:read`, `project:write`, `project:delete` |
| **Stage** | `stage:read`, `stage:write`, `stage:delete` |
| **Conversation** | `conversation:read`, `conversation:write`, `conversation:delete` |
| **Provider** | `provider:read`, `provider:write`, `provider:delete` |
| **Audit** | `audit:read` |
| **Migration** | `migration:export`, `migration:import` |
| **System** | `system:config` |

You don't need to manage permissions individually — they're determined by the assigned role(s).

## Initial Setup

When Bonsai is first installed with no admin accounts, a one-time setup screen appears where you create the first super admin. This endpoint is disabled as soon as the first admin is created.

## Tips

- **Follow least privilege** — Give each person only the access they need.
- **Use descriptive names** — When you have many admins, clear names make audit logs easier to read.
- **Review access periodically** — Remove accounts for people who no longer need access.
