# Platform Monitoring

Platform monitoring shows the operational health of the Bonsai server itself — not a specific project. It covers the system health-check cycle, the alert engine's event history, per-provider call statistics, recorded failover transitions, an explorer for the platform's internal metrics, and the platform-wide alerting configuration.

::: info Access
All monitoring views require the **`system:monitoring`** permission, which in the current release is granted to **super admin** operators only. If you don't have the permission, the sidebar entries are hidden and the API returns `403`.
:::

The monitoring entries appear in the **System** sidebar:

| View | What it shows |
|---|---|
| **System Health** | Current status of core checks, service heartbeats, and all configured providers — each with status counts over a selectable window — plus the persisted check history |
| **Alerts** | Alert events from the alert engine — filters, text search, acknowledge, delete, and the per-event notification delivery trail |
| **Provider Calls** | The raw third-party call log — one row per call, with per-call streaming metrics (TTFT, tokens, chunk gaps, …) |
| **Fallback Events** | Recorded failover transitions — which provider failed, which one served, the error class, and whether the fallback succeeded |
| **Metrics** | Explorer for the platform's internal metric time series (API outcomes, provider calls, voice media, process gauges, circuit breaker, …) |
| **Monitoring Config** | Edit the platform-wide monitoring config: alert notifiers, per-rule overrides, retention, probe + alert engine settings |

Per-provider monitoring (probe status + rolling call stats) lives in the **Providers** views rather than a separate page — see [Provider health](#provider-health).

When no project is selected, the **Dashboard** also shows a compact **System Health** card fed by the same status endpoint (60-minute window). The card lists the platform checks (db, process, service heartbeats) with a mini status bar per check and a footer row summarizing all provider probes (worst status + window counts). The header shows two overall badges — **System** (platform checks only) and **All** (the backend's global status, which includes provider probes) — so the two scopes are always distinguishable. The card is visible to operators with the permission. When alerts are currently firing, the card also shows a red **N firing** badge that links to the [Alerts](#alerts) view pre-filtered to firing events.

## System Health

The backend runs a periodic health-check cycle. Each cycle records one row per check:

- `db` — database connectivity
- `process` — process/resource sanity
- `service_heartbeat:<name>` — heartbeats from long-running services
- `provider:<id>` — a probe against each configured provider

The **Current Status** section is served by the aggregated status endpoint, which also reports how often each check had each status over a selectable window (15 minutes to 24 hours, default 1 hour). The overall status is computed by the backend (the worst non-unknown check status — `down` > `degraded` > `ok`; unknown checks, e.g. providers that never ticked yet, are ignored so a healthy system still reports `ok`) and the header shows it as the **All** badge, next to a **System** badge covering platform checks only.

Checks are grouped by their check type — **Core** (db, process), **Background services** (service heartbeats), and **Other** for any future type — each group with its own worst-status badge. Every card shows its current status, latency, and a status bar split into discrete segments — one per time slice of the selected window (3 min each at 15 min, 5 min at 1 h, 15 min at 4 h, 1 h at 24 h) — colored by the window's status counts (worst status leftmost), with the exact counts listed under the bar. Clicking a bar segment opens a popup with the full window aggregates for that check or provider — per-status counts and shares, total checks in the window, worst status, current state (status, latency, last checked), and the raw identifiers. Providers use the same card grid, grouped by type (LLM, ASR, TTS, Embeddings, Storage, Channel) — the API vendor is shown on hover. The per-check detail payload (raw jsonb) is viewable from the [Check History](#check-history) table below, rendered as a key/value grid with formatted values (bytes, durations, relative timestamps, circuit-breaker badges) instead of raw JSON.

The **Check History** section lists persisted rows, filterable by status. Each row is tagged with a colored category chip — **System** for platform checks and **Provider** for per-provider probes.

The console shows human-readable check names — `service_heartbeat:benchmark-executor` appears as **Benchmark executor**, and provider rows appear by provider name (hover any name to see the raw id).

## Alerts

The alert engine evaluates its rules on a fixed interval and records one **alert event** per firing. Events stay in history after they resolve (auto-resolve or safety-valve), so the list is a durable record of platform incidents.

Each event shows when it fired, its severity (info / warning / critical), the human-readable message, the rule that produced it, the scope key (e.g. `provider-down:prov_123`), and its current status (firing / resolved).

Filters:

- **Date range** — on the fired-at timestamp
- **Severity** — info, warning, or critical
- **Status** — firing or resolved
- **Rule** — any rule from the live engine catalog
- **Text search** — matches message, scope key, and rule id

Filters can also be passed as query params (`?status=firing`, `?severity=critical`, `?rule=…`), which is how the Dashboard badge deep-links into the list.

### Acknowledging

Un-acked events show an **Ack** icon button (in the list row and on the event page). Acknowledging stamps `acked_at` + `acked_by` (the authenticated operator) exactly once — acknowledging twice is a no-op — and writes an audit entry on the first ack. Acked events show the ack time and operator instead of the button.

Row operations (acknowledge, view, delete) are icon buttons in the row's **Actions** area; the row itself also opens the event detail.

### Deleting

Each list row has a delete action (trash icon, with confirmation). Deleting **permanently** removes the event from history and writes a `DELETE_ALERT` audit entry. It's meant for stalled alerts or known situations without an easy resolution (e.g. a deleted provider). Note that if the condition still holds, the engine may record a **new** event for the same rule and scope — disable the rule in the [Monitoring Config](#monitoring-config) to silence it permanently.

### Event detail

Opening an event shows three tabs plus metadata:

- **Overview** — severity/status/rule badges, the message, a fired → resolved → acknowledged timeline, and the scope fields (e.g. the provider the event is about).
- **Notifications** — the delivery trail: one row per notifier delivery attempt (fired or resolved phase) with the outcome and any failure detail (HTTP status, error message, cap overrun).
- **Context** — the evaluation context recorded with the event, including the resolution reason on resolved events.
- **Metadata** — raw identifiers and timestamps.

## Monitoring Config

The monitoring config is a platform-wide singleton (not project-scoped). The view loads the current validated config and edits it as a **full replace** under optimistic locking:

- **Notifiers** — alert delivery targets. Each notifier is a webhook (delivery URL), an email (SMTP/IMAP channel provider + recipient address), a Telegram message (Telegram channel provider + chat id), or an SMS/WhatsApp message (Twilio Messaging / WhatsApp channel provider + E.164 phone number), with an optional minimum-severity gate and an enabled toggle. The channel provider dropdown lists only providers matching the notifier type; switching a notifier's type clears its type-specific fields. A warning appears for any in-use notifier type that has no matching channel provider configured. Notifier ids are shown in monospace; new notifiers get a generated id.
- **Rules** — per-rule overrides for the alert engine's rules. The rule list, summaries, scope, default severities, and default parameters are served live from the engine's rule registry (`GET /api/monitoring/rules`), so they always match what the engine evaluates — there is no console-side rule catalog to drift. Rules are grouped by area (database, upstream providers, streaming quality, …) and can be searched by label/id and filtered by status (enabled / disabled / modified); a summary line shows the total, disabled, and modified counts. Each row shows the engine defaults (threshold · window · min samples) and expands to an editor with the rule description (threshold semantics live there) and per-rule overrides: enabled, threshold, window, min samples, sustainment, resolve-after-good-checks, cooldown, max-unresolved, and severity. Empty fields keep the engine default — shown as each field's placeholder — and clearing an override removes it from the config. Unknown rule ids already present in the saved config are still listed and editable, but new ids can only be introduced by the backend.

  The current engine ships 20 built-in rules across nine areas — database, background services, upstream providers, API surface, background-service failures, process health, streaming quality, TTS/ASR quality, and failover. Two rules worth knowing: `api-429-spike` watches Bonsai's own API rate-limit rejections while `auth-429-spike` watches the auth limiter (upstream 429s are covered by `provider-rate-limited`), and `fallback-active` is a Phase 3 placeholder — registered but unable to fire until fallback events start being written.
- **Settings** — retention in days (minimum 7, default 90) for call logs / health checks / metric samples, the provider health probe policy (LLM probe mode — note that `one_token` probes cost money — ASR/TTS probe modes, and probe cooldown), the alert engine settings (evaluation interval and default re-fire cooldown), and the per-provider **circuit breaker policy**: failure threshold (default 5, minimum 1), sliding failure window in ms (default 60000, minimum 1000), and the open → half-open cooldown in ms (default 300000, minimum 1000). Every field shows its engine default as a placeholder.

Editing is guarded: an amber badge in the header counts how many fields diverge from the saved config, leaving the view (or reloading) with unsaved changes asks for confirmation, and the browser warns when closing the tab. When a save fails validation, the view jumps to the tab containing the first error.

Saving sends the full config with the loaded version. If someone else saved in the meantime the backend returns a **409 conflict** — the view then offers *Reload latest config* so you can re-apply your changes on top of the new version. Invalid configs (unknown rule id, bad notifier, retention below 7 days) are rejected with a **400** and the offending fields are highlighted.

On success the running engine and notifiers pick up the new config on their next evaluation/delivery — no restart. The audit entry stores sanitized before/after summaries (webhook URLs are replaced by a `hasUrl` flag).

## Provider health

Per-provider monitoring is integrated into the **Providers** views (both parts require the `system:monitoring` permission):

- **Providers list** — a **Fallbacks** column shows the configured failover chain (provider names in order), and a **Health** column shows each provider's latest probe status as a badge — with a **breaker** badge next to it whenever the circuit breaker is open or half-open — plus the rolling 15-minute summary underneath (calls, OK rate, p95).
- **Provider page → Health tab** — full detail for one provider: probe status, the rolling 15-minute window (calls, OK rate, p95 duration, top up-to-3 error codes), the circuit breaker state (state badge, failures in the current window, when the state last changed, and how often the breaker opened in the last 24 hours), a refresh button, and **View recent calls** / **View failover events** links that open [Provider Calls](#provider-calls) and [Fallback Events](#fallback-events) pre-filtered to that provider.

The probe status is the latest `provider:<id>` health-check result (`not probed` until the first cycle runs); the rolling window covers the last 15 minutes of recorded provider calls. The circuit breaker state is in-memory (a process restart resets it to *closed*) and is `no calls yet` until the provider has recorded calls; a breaker that opens after the configured failure threshold is reached within the sliding window fails fast instead of hammering the degraded upstream, and starts half-open probes after the cooldown.

## Provider Calls

The raw call log written for every third-party API call (LLM generations, ASR/TTS sessions, channel sends, storage operations, …). Each row shows when, which provider, which operation, the model (when applicable), the outcome, and duration.

Filters:

- **Date range**
- **Provider** — can also be pre-selected via the `?providerId=…` query param (used by the provider page's Health tab)
- **Status** — OK or Errors
- **Error code** — `auth`, `rate_limited`, `timeout`, `server_error`, `client_error`, `network`, `unknown`

Above the log is an **Aggregated stats** section (one row per time bucket × provider × operation for the window): call counts, average/max duration, p95 time-to-first-token, stalled-call count (chunk gaps over 10s), and TTS calls slower than real time. The window mirrors the date-range filter (default: the last 24 hours), is clamped to the backend's 14-day maximum, and defaults to daily buckets for windows over three days. Long result sets are capped to the latest 150 rows — narrow the window or pick a provider for the full breakdown.

Expand a row to see:

- Call/conversation/project identifiers (the conversation links through to Monitor → Conversations)
- The full error text
- **Streaming metrics** — variant phase fields recorded for the call (time-to-first-token, token counts, chunk-gap statistics, …). Only fields recorded for that call's variant appear.

## Fallback Events

Every recorded failover transition: the provider that failed, the provider the request fell over to, the error class of the failed attempt, the operation, and whether the fallback ultimately served the request. This is the durable record behind the circuit breakers and the `fallback-active` alert rule.

Filters:

- **Date range** — on the transition timestamp
- **Failed provider** — can also be pre-selected via the `?providerId=…` query param (used by the provider page's Health tab)
- **Fallback provider** — which provider served the request
- **Reason** — the error class of the failed attempt (`auth`, `rate_limited`, `timeout`, `server_error`, …)
- **Outcome** — succeeded or failed

Expand a row to see the event id, the raw provider ids, and the owning project/conversation (the conversation links through to Monitor → Conversations).

## Metrics

The metrics explorer queries the platform's in-process metric registry. The metric picker is a curated list mirroring the backend's closed registry, shown with human-readable names (the raw registry name is visible in the results header and on hover); if the backend ships a new metric, the console list needs a matching entry.

- **Chart value** — counters chart per-bucket *deltas*; gauges chart the average sampled value; histograms chart sample count and average (`sum / count`). You can also switch the chart to min or max per bucket.
- **Step** — bucket granularity: `1m`, `15m`, or `1h`.
- A metric can have multiple series (one per label set, e.g. per provider). Charts render up to 12 series; the table below the chart summarizes every returned series (labels, points, min, avg, max). Label sets are rendered with friendly key names in a fixed order, e.g. `provider: Gemini LLM · type: llm · operation: llm.models · outcome: ok · error: none` — provider IDs are shown as provider names, `true`/`false` outcomes as `ok`/`failed`, and unknown keys pass through verbatim.

## API

All views are backed by read-only endpoints under `/api/monitoring/` (see the OpenAPI spec):

- `GET /api/monitoring/status` — current status page: checks + providers with window counts (`windowMinutes` 5–1440, default 60) and optional per-day aggregates (`days` 1–90)
- `GET /api/monitoring/health/history` — persisted check rows
- `GET /api/monitoring/providers` — per-provider probe + rolling window
- `GET /api/monitoring/provider-calls` — call log (filters: providerId, providerType, apiType, operation, model, projectId, conversationId, ok, errorCode, statusHttp, durationMs, fallbackProviderId, createdAt)
- `GET /api/monitoring/provider-stats` — bucketed aggregates (max window 14 days; `to` is exclusive)
- `GET /api/monitoring/fallback-events` — failover transition events (filters: providerId, fallbackProviderId, providerType, operation, reason, projectId, conversationId, success, createdAt)
- `GET /api/monitoring/metrics` — metric series (name must be a registered metric; step `1m` | `15m` | `1h`)
- `GET /api/monitoring/alerts` — alert event history (filters: ruleId, scopeKey, severity, status, firedAt/resolvedAt/ackedAt operators; `textSearch` over message, scopeKey, ruleId)
- `GET /api/monitoring/alerts/{id}` — a single alert event with its delivery trail and ack stamps
- `POST /api/monitoring/alerts/{id}/acknowledge` — idempotent acknowledgment (stamps `ackedAt`/`ackedBy`, audit entry on first ack)
- `GET /api/monitoring/rules` — static alert rule catalog (id, scope, default severity, summary, default params) served from the engine registry
- `GET /api/monitoring/config` — current monitoring config + optimistic-lock version
- `PUT /api/monitoring/config` — full-replace the config (`version` must match; 409 on conflict, 400 on invalid config)
