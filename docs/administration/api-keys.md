# API Keys

**API keys** are credentials that client applications use to connect to a project and start conversations. They authenticate the real-time connection between your app (website, mobile app, kiosk, etc.) and the Bonsai platform.

## How API Keys Work

API keys are scoped to a specific **project**. When a client application connects via WebSocket, it authenticates by sending the API key. The platform verifies the key and associates the connection with the correct project.

## Creating an API Key

Go to **Administration > API Keys** (or access them from the project context) and click **Create API Key**.

### Fields

- **Name** — A descriptive label (e.g., "Production Web App", "Mobile App - iOS", "Dev Testing").

After creating the key, you'll see the **full key value**. This is the only time the full key is displayed — copy it and store it securely.

::: warning Save the Key
The full API key is shown only once at creation time. After that, only a preview (first and last few characters) is visible. If you lose the key, you'll need to create a new one.
:::

## Managing Keys

### Deactivating a Key

If you need to temporarily disable a key (without deleting it), set it to **inactive**. Inactive keys are immediately rejected when a client tries to authenticate — existing connections are not affected, but no new connections can be made with the key.

### Deleting a Key

Delete a key when it's no longer needed. This is permanent.

### Multiple Keys Per Project

You can create multiple API keys for the same project. This is useful when:
- Different client applications need their own credentials.
- You want to rotate keys without downtime (create a new one, update the app, then delete the old one).

## Tips

- **Name keys after their use** — "Production Web App" is much more helpful than "Key 1" when you need to find and manage them later.
- **Rotate keys periodically** — Create a new key, update your application, then deactivate the old one.
- **Don't share keys across environments** — Use separate keys (or separate projects) for development, staging, and production.
- **Deactivate before deleting** — If you're unsure whether a key is still in use, deactivate it first and watch for connection failures before permanently deleting.
