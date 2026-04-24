# Analytics

::: warning Experimental
Analytics features are experimental and may change in future releases.
:::

The Analytics section provides performance and usage insights for your project's conversations, organised into four tabs: **Latency Analysis**, **Token Usage**, **Explorer**, and **Funnels**.

## Latency Analysis

Measures how long different parts of a conversation turn take to process.

### Filters

Use the filter bar at the top to scope the data:

| Filter | Description |
|---|---|
| **Date range** | Limit results to a specific time window. Leave empty for all time. |
| **Stage** | Filter data to turns that went through a specific stage. |
| **Source** | Filter by channel — `Text`, `Voice`, or all. |
| **Interval** | Aggregation period for the trend chart — `Hourly`, `Daily`, or `Weekly`. |

Click **Apply** to load data with the selected filters.

### Summary Cards

| Card | Description |
|---|---|
| **Total Turns** | Total number of turns in the selected period. |
| **Avg Turn Duration** | Mean end-to-end turn latency. |
| **P95 Turn Duration** | 95th percentile of turn latency. |
| **Avg Time to First Token** | Mean time from LLM request to first token received. |

### Latency Statistics Table

Breaks down latency by pipeline stage. Each row shows **Count**, **Avg**, **Median**, **P95**, **Min**, and **Max**:

| Metric | Description |
|---|---|
| **Total Turn Duration** | End-to-end wall-clock time for the full turn. |
| **Time to First Token (from LLM start)** | Latency from when the LLM request was sent to the first token. |
| **Time to First Token (from turn start)** | Total latency from turn start to first LLM token. |
| **LLM Duration** | Total time spent inside the language model call. |
| **Processing (Classification + Transforms)** | Time spent on classifiers and context transformers. |
| **Actions** | Time spent executing actions triggered by the turn. |
| **Moderation** | Time taken by moderation checks. |
| **ASR (voice only)** | Automatic speech recognition duration. |
| **TTS (voice only)** | Text-to-speech synthesis duration. |
| **Time to First Audio (voice only)** | Time from turn start until the first audio chunk was ready. |

Voice-only rows are dimmed when the **Source** filter is set to **Text**.

### Percentile Distribution Table

A fine-grained view of latency distribution for five key metrics. Columns show **P50**, **P75**, **P90**, **P95**, and **P99** for:

- Total Turn Duration
- Time to First Token (from LLM start)
- Time to First Token (from turn start)
- LLM Duration
- Time to First Audio (voice only)

### Latency Trend Chart

Shows how average turn latency and time-to-first-token have changed over the selected period. The **Interval** filter controls the x-axis granularity.

---

## Token Usage

Tracks LLM token consumption across all events in your project.

### Filters

| Filter | Description |
|---|---|
| **Date range** | Limit results to a specific time window. |
| **Stage** | Filter events to a specific stage. |
| **Source** | Filter by channel — `Text`, `Voice`, or all. |
| **Interval** | Trend chart granularity — `Hourly`, `Daily`, or `Weekly`. |

Click **Apply** to load data.

### Summary Cards

| Card | Description |
|---|---|
| **Total Events** | Number of LLM call events in the selected period. |
| **Prompt Tokens** | Total tokens sent to the model (input). |
| **Completion Tokens** | Total tokens received from the model (output). |
| **Total Tokens** | Combined prompt + completion tokens. |

### Usage by Event Type Table

Breaks down token consumption by LLM event type (e.g. agent completion, classification). Columns:

| Column | Description |
|---|---|
| **Event Type** | The type of LLM call. |
| **Events** | Number of events of this type. |
| **Prompt Tokens** | Total input tokens. |
| **Completion Tokens** | Total output tokens. |
| **Total Tokens** | Combined total. |
| **Avg / Event** | Average tokens per event. |
| **In:Out Ratio** | Prompt-to-completion token ratio (e.g. `3.50:1`). |

### Token Usage Trend Chart

Shows how token consumption has changed over time at the selected interval granularity.

---

## Explorer

A flexible, ad-hoc query builder that lets you slice project data across multiple dimensions and metrics. Use it to answer questions that the pre-built tabs don't cover.

### Saved Queries

The toolbar at the top of the Explorer panel lets you manage named queries:

- Click the **Query** picker button (left side) to open a dropdown of all saved queries.
- Select a query from the list to load it — the builder and all filters will be restored.
- Select **New query** in the dropdown to start with a blank slate.
- The **Refresh list** option at the bottom of the dropdown re-fetches the list from the server.

A filled bookmark icon and the query name appear in the picker button when a saved query is active.

### Building a Query

The query builder has four configuration rows:

**Row 1 — Data source, interval and time range**

| Control | Description |
|---|---|
| **Source** | The data source to query (e.g. `Turns`, `LLM Events`). Changing source resets dimensions, metrics and filters. |
| **Interval** | Time bucketing — `None (aggregate)`, `Hourly`, `Daily`, `Weekly`, or `Monthly`. Choose `None` to return a single aggregated row. |
| **Time range** | A button showing the current time range. Click to open the time range picker. |

The time range picker offers three modes:

- **Relative** — e.g. *Last 7 days*. Choose from quick presets (1h, 24h, 7d, 30d, 3mo) or enter a custom amount and unit.
- **Absolute** — Specify exact **From** and **To** datetime values. Switching from Relative to Absolute pre-fills the inputs using the current relative window.
- **All time** — No time filter; all available data is included.

**Row 2 — Group By**

Add up to five dimensions to group results by (e.g. stage, source, model). Click **+ Add** to open the dimension picker and select a field. Each added tag can be removed with **×**. The available dimensions depend on the selected source.

**Row 2b — Normalize By**

An optional secondary dimension used for two-phase aggregation. When set, metrics are first summed within each *(Group By + Normalize By)* group, then the selected aggregation function is applied across those sums.

Example: with **Group By** = *Stage*, **Normalize By** = *Conversation*, and metric **AVG: Prompt Tokens**, the query computes the total prompt tokens per conversation per stage first, then averages those per-conversation totals — giving the average total prompt tokens per conversation, broken down by stage.

> **Note:** The bare **Count** metric is not compatible with Normalize By. Use a named metric with an aggregation function instead.

**Row 3 — Metrics**

Select one or more metric + aggregation combinations. Click **+ Add metric** to open the picker:

- Choose a metric field from the dropdown.
- Choose an aggregation function. Available functions depend on the metric type:
  - `ms` metrics: `avg`, `p50`, `p95`, `p99`, `min`, `max`
  - `tokens` metrics: `sum`, `avg`, `p95`
  - Other metrics: `count`

Each metric tag shows as `AGG: Label` (e.g. `AVG: LLM Duration`). A **Count** shortcut button adds a simple row count metric. Tags can be removed with **×**.

**Row 4 — Filters**

Narrow results to specific dimension values. Click **+ Add filter** to open the filter picker, select a dimension and a value, then confirm. Active filters appear as `Dimension = Value` tags. Each can be removed with **×**.

### Running a Query

Click the **Run** button (▶) to execute the current query. A spinner appears while the query is in progress.

### Results Table

#### Flat mode

When only a single dimension (or none) is selected, results appear in a flat table. Each row combines:
- A **Time** column if an interval was selected.
- One column per group-by dimension.
- One column per metric.

Time values are formatted for readability (e.g. `Jan 3`).
Duration (ms) values are shown in human-readable form — milliseconds for short values, `m s` or `h m s` for longer durations.

A **Results** heading above the table shows the row count. If the number of rows equals the query limit, a warning indicates that results were truncated.

#### Drilldown mode

When two or more levels are selected (interval + at least one dimension, or two or more dimensions), results switch to a hierarchical drilldown view. Top-level group rows show a rollup and can be expanded with ▶ to reveal sub-groups and individual rows.

### Saving Queries

Once you have built a query you want to reuse, save it using the button on the right side of the toolbar:

**When no query is loaded (or you are viewing a shared query you don't own):**

- A single **Save as…** button appears. Click it to open the save popover.
- Enter a name (required) and optionally tick **Share with all project operators** to make the query visible to all operators on the project.
- Click **Save** to confirm.

**When you own the active saved query:**

- A split button appears: **Save** (left) overwrites the existing query with the current builder state.
- The **▾** chevron (right) opens a menu with additional options:
  - **Save as new copy…** — save as a new query without affecting the original.
  - **Rename…** — change the name of the active query.
  - **Share with project / Unshare** — toggle visibility for all project operators.
  - **Delete this query** — permanently delete the saved query (requires confirmation).

### Permissions

A saved query can only be updated, renamed, shared, or deleted by:
- The operator who created it, or
- A `super_admin`.

---

## Funnels

The **Funnels** tab lets you visualise how conversations progress through a sequence of events — and where drop-off happens. Use it to measure completion rates across key milestones in your conversation flow.

### How Funnels Work

A funnel is a sequence of **steps**. Each step matches a specific event that must occur in a conversation. The funnel measures what percentage of conversations that completed step *N* also completed step *N+1*.

Events are matched in order. A conversation counts as having reached a step only if it also reached every preceding step.

### Building a Funnel

Click **+ Add step** to add each step in sequence. For each step, choose an **event type**:

| Event type | Description |
|---|---|
| **Action fired** | A specific action was executed. Select the action from the dropdown. |
| **Guardrail fired** | A specific guardrail check triggered. Select the guardrail from the dropdown. |

You can add as many steps as needed. Steps can be removed individually with the **×** button on each row.

### Running a Funnel

Once you have added at least two steps, click **Run** (▶) to execute the funnel query. Results appear below as a bar chart showing the count and percentage of conversations that reached each step.

### Saved Funnels

Funnels can be saved and reused, following the same pattern as Explorer saved queries:

- Use the **Query** picker button on the left to browse and load saved funnels, or select **New funnel** to start fresh.
- **Save as…** appears when no funnel is loaded (or you are viewing one you don't own). Enter a name and optionally share it with all project operators.
- When you own the active funnel, a split **Save** button appears. The **▾** chevron opens a menu with **Save as new copy…**, **Rename…**, **Share / Unshare**, and **Delete**.

Saved funnels are scoped to the project and subject to the same ownership and `super_admin` permissions as Explorer queries.
