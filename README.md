# Bonsai Console

Vue 3 admin panel for designing and managing [Bonsai](https://github.com/bonsai-platform) conversational AI experiences. Provides three functional areas: **Design** (build AI assistants), **Monitor** (watch conversations and users), and **Administration** (manage projects, providers, and access).

In-app documentation is available at `/help/` once the app is running.

## Tech Stack

- **Vue 3** + TypeScript — Composition API with `<script setup>`
- **Vite** — build tool and dev server
- **Pinia** — state management
- **Vue Router 4** — client-side routing
- **Tailwind CSS 4** — utility-first styling
- **VitePress** — documentation site (served at `/help/`)

## Prerequisites

- Node.js 22+
- npm

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd bonsai-admin

# 2. Configure environment
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your Bonsai API base URL

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The `dev` script automatically fetches the API contract and regenerates API types before starting the Vite dev server — no manual codegen step is required.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Generate API types, then start Vite dev server |
| `npm run build` | Type-check, build the Vue app and the VitePress docs |
| `npm run preview` | Serve the production build locally |
| `npm run docs:dev` | Start the VitePress docs dev server |
| `npm run docs:build` | Build the static VitePress docs site |
| `npm run generate:api` | Regenerate the typed API client from `src/api/openapi.json` |
| `npm run generate:ws-types` | Regenerate WebSocket message types |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL for the Bonsai API (HTTP and WebSocket) |

## Docker

The included `Dockerfile` produces a single nginx image that serves both the Vue SPA and the built docs.

```bash
# Build the image
docker build -t bonsai-console .

# Run on port 80
docker run -p 80:80 bonsai-console
```

- `/` → Vue SPA (client-side routing via fallback to `index.html`)
- `/help/` → VitePress documentation (static files)

## Project Structure

```
src/
├── api/           # Axios client, OpenAPI spec, auto-generated types
├── assets/        # Static assets
├── components/    # Reusable UI components and modals
├── composables/   # Vue composables (pagination, search, audio, etc.)
├── layouts/       # Page layouts (main, section-level)
├── router/        # Vue Router configuration
├── stores/        # Pinia stores (resource factory pattern)
├── types/         # Shared TypeScript types
└── views/         # Route-level view components
    ├── auth/
    ├── administration/
    ├── design/
    └── monitor/
```

## License

Licensed under the [Apache License 2.0](LICENSE)
