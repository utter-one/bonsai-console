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

## Tips

- **Use descriptive names** — Include the region or purpose in the description so it's immediately clear which instance is which.
- **Treat credentials carefully** — Environment credentials are stored securely, but only share access with the instances that genuinely need it.
