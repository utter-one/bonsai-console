# Analytics

::: warning Experimental Feature
Analytics is under active development. Behaviour may change in future releases.
:::

The **Analytics** view provides latency statistics for conversations in your project. Use it to understand how fast your AI pipeline responds and to identify performance bottlenecks.

## Filters

Narrow the data using the filter bar at the top of the page:

| Filter | Description |
|---|---|
| **Time range** | Limit data to a recent window (last 15 minutes up to all time). Defaults to last 7 days. |
| **Stage** | Restrict results to turns that occurred within a specific stage. |
| **Source** | Filter by conversation modality — **text** or **voice**. |
| **Interval** | Granularity of the trend chart — **hour**, **day**, or **week**. |

Click **Apply** after changing filters to refresh the results.

## Summary Cards

At the top of the results, four headline numbers give a quick overview:

- **Total Turns** — Number of conversation turns in the selected period.
- **Avg Total Duration** — Average end-to-end duration of a turn.
- **p95 Total Duration** — 95th percentile turn duration (a measure of worst-case latency).
- **Avg Time to First Token** — Average time from when the LLM started processing to when it produced its first output token.

## Latency Trend Chart

A time-series chart showing how average total turn duration has changed over the selected period, grouped by the chosen interval.

## Latency Statistics Table

Detailed breakdown of each pipeline component, showing **average**, **min**, **max**, **p50**, and **p95** values:

| Metric | What It Measures |
|---|---|
| **Total Turn Duration** | Full end-to-end time from receiving user input to completing the response |
| **Time to First Token (from LLM start)** | How long the LLM takes to produce its first token after it starts |
| **Time to First Token (from turn start)** | Same measurement, but from the moment the user's turn begins |
| **LLM Duration** | Total time spent generating the LLM response |
| **Processing (Classification + Transforms)** | Time spent classifying intent and running context transformers |
| **Actions** | Time spent executing stage actions |
| **Moderation** | Time spent on content moderation checks |
| **ASR** *(voice only)* | Speech-to-text transcription time |
| **TTS** *(voice only)* | Text-to-speech synthesis time |
| **Time to First Audio** *(voice only)* | Time from turn start until the first audio chunk is ready to play |

## Latency Percentiles Table

A focused percentile breakdown (**p50**, **p75**, **p90**, **p95**, **p99**) for the most important timing metrics:

- Total Turn Duration
- Time to First Token (from LLM start)
- Time to First Token (from turn start)
- LLM Duration
- Time to First Audio (voice only)
