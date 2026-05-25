# Environment Migration

**Migration** lets you pull project resources from one Bonsai environment into another. It is useful when you want to replicate a fully-designed project configuration — agents, stages, classifiers, knowledge base, and more — from a development or staging environment into production without recreating everything manually.

## When to Use Migration

- **Staging to production** — Design and test your conversation in a staging environment, then migrate the final configuration to production.
- **Template deployment** — Create a project template in one environment and deploy it across multiple projects or environments.
- **Multi-region sync** — Keep configurations aligned across regional deployments.

## Prerequisites

- You must have **environments** configured in **Administration > Environments**. Each environment represents a remote Bonsai server instance with its URL and credentials.
- You need the `migration:import` permission (granted to super admins, content managers, and developers).

## Running a Migration

1. Go to **Administration > Environments** and find the environment you want to pull from.
2. Click the **Migrate** button (downward arrow icon) on the environment card. The migration modal opens.
3. **Select entities** — Browse available entities grouped by type. Use the project filter to narrow the list, then select individual items or use **Select all / Deselect all**.

### Entity Types Available for Migration

| Group | Notes |
|---|---|
| **Projects** | Top-level containers |
| **Stages** | Pulls in referenced agent, classifiers, context transformers, global actions & providers |
| **Agents** | Pulls in referenced TTS provider |
| **Classifiers** | Pulls in referenced LLM provider |
| **Context Transformers** | Pulls in referenced LLM provider |
| **Tools** | Pulls in referenced LLM provider |
| **Global Actions** | Project-level shared actions |
| **Knowledge Categories** | Pulls all child knowledge items automatically |
| **Providers** | LLM, TTS, ASR, and storage providers |
| **API Keys** | Client authentication keys |
| **Testers** | Pulls in referenced project |
| **Scenarios** | Pulls in referenced project |
| **Guardrails** | Safety rules |
| **Copy Decorators** | Transitive references handled automatically |
| **Sample Copies** | Transitively pulls in referenced copyDecorators and classifiers |
| **Saved Slice Queries** | Saved Analytics Explorer queries |
| **Saved Funnel Queries** | Saved Analytics Funnels |

4. **Dry run (recommended)** — Toggle **Dry run** to simulate the migration without writing any data. This shows you what would be migrated and helps catch issues before committing.
5. **Start Migration** — Click **Start Migration** (or **Run Dry Migration** if dry run is enabled) to begin the process.

## Migration Progress

After starting a migration, its status appears in the environment's migration jobs list:

| Status | Description |
|---|---|
| **Running** | The migration is actively processing entities. |
| **Completed** | All selected entities were migrated successfully. |
| **Failed** | An error occurred during migration. Check the job details for the error message. |

You can view the results of a completed or failed migration by clicking on the job entry. Dry run results show what *would have been* migrated without making any changes.

## Tips

- **Always do a dry run first** — This lets you verify selections and catch potential issues before affecting your live environment.
- **Migrate in logical order** — If you're migrating across many entity types, start with Providers and LLM providers first, then stages and agents that depend on them.
- **Check for conflicts** — If an entity with the same name already exists in the target environment, the migration may skip it or create a duplicate depending on the entity type. Review the results carefully.
- **Copy Decorators are transitive** — When you migrate Sample Copies, their referenced Copy Decorators are pulled in automatically. You don't need to select them separately.
