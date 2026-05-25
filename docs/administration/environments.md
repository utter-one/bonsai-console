# Environments

**Environments** are connections to other Bonsai server instances — for example, a different regional deployment, a partner installation, or another instance you control. They let you reference and pull data from those instances without leaving the console.

## Creating an Environment

Go to **Administration > Environments** and click **Create Environment**.

### Fields

- **Description** — A clear label for the connected instance (e.g., "EU Production", "Partner Instance").
- **URL** — The base URL of the remote Bonsai server (e.g., `https://api.partner.example.com`).
- **Login** — The credential login used to authenticate with the remote instance.
- **Password** — The corresponding credential password.

## Use Cases

- **Multi-region setups** — Connect to a Bonsai instance running in another region to pull or reference its data.
- **Partner integrations** — Link an external Bonsai installation to share resources or synchronize data.
- **Separate deployments** — Reference a sibling instance that manages related projects or configuration.

## Migration

Each environment entry has a **Migrate** button (downward arrow icon) that opens the migration wizard. This lets you pull resources from the connected remote environment into your current one. See [Environment Migration](./environment-migration) for details on available entity types and the migration process.

## Tips
