# Platform Monitoring

Platform monitoring shows the operational health of the Bonsai server itself — not a specific project. It covers the system health-check cycle, the alert engine's event history, per-provider call statistics, an explorer for the platform's internal metrics, and the platform-wide alerting configuration.

::: info Access
All monitoring views require the **`system:monitoring`** permission, which in the current release is granted to **super admin** operators only. If you don't have the permission, the sidebar entries are hidden and the API returns `403`.
:::

The monitoring entries appear in the **System** sidebar:

| View | What it shows |
|---|---|
| **System Health** | Live health-check snapshot (db, process, service heartbeats, per-provider probes) plus the persisted check history |
| **Alerts** | Alert events from the alert engine — filters, text search, acknowledge, and the per-event notification delivery trail |
| **Provider Calls** | The raw third-party call log — one row per call, with per-call streaming metrics (TTFT, tokens, chunk gaps, …) |
| **Metrics** | Explorer for the platform's internal metric time series (API outcomes, provider calls, voice media, process gauges, circuit breaker, …) |
| **Monitoring Config** | Edit the platform-wide monitoring config: alert notifiers, per-rule overrides, retention, probe + alert engine settings |

Per-provider monitoring (probe status + rolling call stats) lives in the **Providers** views rather than a separate page — see [Provider health](#provider-health).

When no project is selected, the **Dashboard** also shows a compact **System Health** card with the platform checks (db, process, service heartbeats — provider probes are not included; see the views above). The card is visible to operators with the permission. When alerts are currently firing, the card also shows a red **N firing** badge that links to the [Alerts](#alerts) view pre-filtered to firing events.

## System Health

The backend runs a periodic health-check cycle. Each cycle records one row per check:

- `db` — database connectivity
- `process` — process/resource sanity
- `service_heartbeat:<name>` — heartbeats from long-running services
- `provider:<id>` — a probe against each configured provider

The **Current Snapshot** section shows the last completed cycle (overall status is the worst check status); expand a check to see its raw detail payload. The **Check History** section lists persisted rows, filterable by status.

The console shows human-readable check names — `service_heartbeat:benchmark-executor` appears as **Benchmark executor**, and `provider:<id>` probes appear by provider name (hover any name to see the raw check name). Each row is tagged with a colored category chip — **System** for platform checks (db, process, service heartbeats) and **Provider** for per-provider probes.

## Alerts

The alert engine evaluates its rules on a fixed interval and records one **alert event** per firing. Events stay in history after they resolve (auto-resolve or safety-valve), so the list is a durable record of platform incidents.

Each event shows when it fired, its severity (info / warning / critical), the human-readable message, the rule that produced it, the scope key (e.g. `provider-down:prov_123`), and its current status (firing / resolved).

Filters:

- **Date range** — on the fired-at timestamp
- **Severity** — info, warning, or critical
- **Status** — firing or resolved
- **Rule** — any rule id known to the console
- **Text search** — matches message, scope key, and rule id

Filters can also be passed as query params (`?status=firing`, `?severity=critical`, `?rule=…`), which is how the Dashboard badge deep-links into the list.

### Acknowledging

Un-acked events show an **Ack** button (in the list row and on the event page). Acknowledging stamps `acked_at` + `acked_by` (the authenticated operator) exactly once — acknowledging twice is a no-op — and writes an audit entry on the first ack. Acked events show the ack time and operator instead of the button.

### Event detail

Opening an event shows three tabs plus metadata:

- **Overview** — severity/status/rule badges, the message, a fired → resolved → acknowledged timeline, and the scope fields (e.g. the provider the event is about).
- **Notifications** — the delivery trail: one row per notifier delivery attempt (fired or resolved phase) with the outcome and any failure detail (HTTP status, error message, cap overrun).
- **Context** — the evaluation context recorded with the event, including the resolution reason on resolved events.
- **Metadata** — raw identifiers and timestamps.

## Monitoring Config

The monitoring config is a platform-wide singleton (not project-scoped). The view loads the current validated config and edits it as a **full replace** under optimistic locking:

- **Notifiers** — alert delivery targets. Each notifier is a webhook (delivery URL) or an email (an SMTP/IMAP channel provider + recipient address), with an optional minimum-severity gate and an enabled toggle. Notifier ids are shown in monospace; new notifiers get a generated id.
- **Rules** — per-rule overrides for the alert engine's rules. Empty fields keep the engine default; clearing an override removes it from the config. The rule id list is curated in the console (mirroring the metric catalog) and unknown rule ids already present in the saved config are still listed and editable, but new ids can only be introduced by the backend.
- **Settings** — retention in days (minimum 7) for call logs / health checks / metric samples, the provider health probe policy (LLM probe mode — note that `one_token` probes cost money — and probe cooldown), and the alert engine settings (evaluation interval and default re-fire cooldown).

Saving sends the full config with the loaded version. If someone else saved in the meantime the backend returns a **409 conflict** — the view then offers *Reload latest config* so you can re-apply your changes on top of the new version. Invalid configs (unknown rule id, bad notifier, retention below 7 days) are rejected with a **400** and the offending fields are highlighted.

On success the running engine and notifiers pick up the new config on their next evaluation/delivery — no restart. The audit entry stores sanitized before/after summaries (webhook URLs are replaced by a `hasUrl` flag).

## Provider health

Per-provider monitoring is integrated into the **Providers** views (both parts require the `system:monitoring` permission):

- **Providers list** — a **Health** column shows each provider's latest probe status as a badge, with the rolling 15-minute summary underneath (calls, OK rate, p95).
- **Provider page → Health tab** — full detail for one provider: probe status, the rolling 15-minute window (calls, OK rate, p95 duration, top up-to-3 error codes), a refresh button, and a **View recent calls** link that opens [Provider Calls](#provider-calls) pre-filtered to that provider.

The probe status is the latest `provider:<id>` health-check result (`not probed` until the first cycle runs); the rolling window covers the last 15 minutes of recorded provider calls.

## Provider Calls

The raw call log written for every third-party API call (LLM generations, ASR/TTS sessions, channel sends, storage operations, …). Each row shows when, which provider, which operation, the model (when applicable), the outcome, and duration.

Filters:

- **Date range**
- **Provider** — can also be pre-selected via the `?providerId=…` query param (used by the provider page's Health tab)
- **Status** — OK or Errors
- **Error code** — `auth`, `rate_limited`, `timeout`, `server_error`, `client_error`, `network`, `unknown`

Expand a row to see:

- Call/conversation/project identifiers (the conversation links through to Monitor → Conversations)
- The full error text
- **Streaming metrics** — variant phase fields recorded for the call (time-to-first-token, token counts, chunk-gap statistics, …). Only fields recorded for that call's variant appear.

## Metrics

The metrics explorer queries the platform's in-process metric registry. The metric picker is a curated list mirroring the backend's closed registry, shown with human-readable names (the raw registry name is visible in the results header and on hover); if the backend ships a new metric, the console list needs a matching entry.

- **Chart value** — counters chart per-bucket *deltas*; gauges chart the average sampled value; histograms chart sample count and average (`sum / count`). You can also switch the chart to min or max per bucket.
- **Step** — bucket granularity: `1m`, `15m`, or `1h`.
- A metric can have multiple series (one per label set, e.g. per provider). Charts render up to 12 series; the table below the chart summarizes every returned series (labels, points, min, avg, max).

## API

All views are backed by read-only endpoints under `/api/monitoring/` (see the OpenAPI spec):

- `GET /api/monitoring/health` — current snapshot
- `GET /api/monitoring/health/history` — persisted check rows
- `GET /api/monitoring/providers` — per-provider probe + rolling window
- `GET /api/monitoring/provider-calls` — call log (filters: providerId, providerType, apiType, operation, model, projectId, conversationId, ok, errorCode, statusHttp, durationMs, fallbackProviderId, createdAt)
- `GET /api/monitoring/provider-stats` — bucketed aggregates (max window 14 days; `to` is exclusive)
- `GET /api/monitoring/metrics` — metric series (name must be a registered metric; step `1m` | `15m` | `1h`)
- `GET /api/monitoring/alerts` — alert event history (filters: ruleId, scopeKey, severity, status, firedAt/resolvedAt/ackedAt operators; `textSearch` over message, scopeKey, ruleId)
- `GET /api/monitoring/alerts/{id}` — a single alert event with its delivery trail and ack stamps
- `POST /api/monitoring/alerts/{id}/acknowledge` — idempotent acknowledgment (stamps `ackedAt`/`ackedBy`, audit entry on first ack)
- `GET /api/monitoring/config` — current monitoring config + optimistic-lock version
- `PUT /api/monitoring/config` — full-replace the config (`version` must match; 409 on conflict, 400 on invalid config)
