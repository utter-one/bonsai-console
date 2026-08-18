# Platform Monitoring

Platform monitoring shows the operational health of the Bonsai server itself — not a specific project. It covers the system health-check cycle, per-provider call statistics, the raw third-party call log, and an explorer for the platform's internal metrics.

::: info Access
All monitoring views require the **`system:monitoring`** permission, which in the current release is granted to **super admin** operators only. If you don't have the permission, the sidebar entries are hidden and the API returns `403`.
:::

The monitoring entries appear in the **Administration** sidebar:

| View | What it shows |
|---|---|
| **System Health** | Live health-check snapshot (db, process, service heartbeats, per-provider probes) plus the persisted check history |
| **Provider Health** | Latest probe status and a rolling 15-minute window of call stats per provider (calls, OK rate, p95 latency, top error codes) |
| **Provider Calls** | The raw third-party call log — one row per call, with per-call streaming metrics (TTFT, tokens, chunk gaps, …) |
| **Metrics** | Explorer for the platform's internal metric time series (API outcomes, provider calls, voice media, process gauges, circuit breaker, …) |

When no project is selected, the **Dashboard** also shows a compact **System Health** card with the platform checks (db, process, service heartbeats — provider probes are not included; see the views above). The card is visible to operators with the permission.

## System Health

The backend runs a periodic health-check cycle. Each cycle records one row per check:

- `db` — database connectivity
- `process` — process/resource sanity
- `service_heartbeat:<name>` — heartbeats from long-running services
- `provider:<id>` — a probe against each configured provider

The **Current Snapshot** section shows the last completed cycle (overall status is the worst check status); expand a check to see its raw detail payload. The **Check History** section lists persisted rows, filterable by status.

The console shows human-readable check names — `service_heartbeat:benchmark-executor` appears as **Benchmark executor**, and `provider:<id>` probes appear by provider name (hover any name to see the raw check name).

## Provider Health

One row per configured provider:

- **Probe** — the latest `provider:<id>` health-check status (`not probed` until the first cycle runs).
- **Rolling window** — the last 15 minutes of recorded provider calls: call count, OK rate (success ratio), p95 call duration, and the top up-to-3 failing error codes with counts.

The provider name links to the provider's edit page in Administration.

## Provider Calls

The raw call log written for every third-party API call (LLM generations, ASR/TTS sessions, channel sends, storage operations, …). Each row shows when, which provider, which operation, the model (when applicable), the outcome, and duration.

Filters:

- **Date range**
- **Provider**
- **Status** — OK or Errors
- **Error code** — `auth`, `rate_limited`, `timeout`, `server_error`, `client_error`, `network`, `unknown`

Expand a row to see:

- Call/conversation/project identifiers (the conversation links through to Monitor → Conversations)
- The full error text
- **Streaming metrics** — variant phase fields recorded for the call (time-to-first-token, token counts, chunk-gap statistics, …). Only fields recorded for that call's variant appear.

## Metrics

The metrics explorer queries the platform's in-process metric registry. The metric picker is a curated list mirroring the backend's closed registry, shown with human-readable names (the raw registry name is visible in the results header and on hover); if the backend ships a new metric, the console list needs a matching entry.

- **Chart value** — counters chart per-bucket *deltas*; gauges chart the average sampled value; histograms chart sample count and average (`sum / count`). You can also switch the chart to min or max per bucket.
- **Label filters** — series are matched by *exact label set*: a series is only returned if its labels are exactly the ones you specify. Add the labels a series carries (e.g. `provider_id=…`, `ok=true`) to narrow a metric down to one series.
- **Step** — bucket granularity: `1m`, `15m`, or `1h`.
- Charts render up to 12 series; use label filters to focus on fewer. The table below the chart summarizes every returned series (points, min, avg, max).

## API

All views are backed by read-only endpoints under `/api/monitoring/` (see the OpenAPI spec):

- `GET /api/monitoring/health` — current snapshot
- `GET /api/monitoring/health/history` — persisted check rows
- `GET /api/monitoring/providers` — per-provider probe + rolling window
- `GET /api/monitoring/provider-calls` — call log (filters: providerId, providerType, apiType, operation, model, projectId, conversationId, ok, errorCode, statusHttp, durationMs, fallbackProviderId, createdAt)
- `GET /api/monitoring/provider-stats` — bucketed aggregates (max window 14 days; `to` is exclusive)
- `GET /api/monitoring/metrics` — metric series (name must be a registered metric; step `1m` | `15m` | `1h`)
