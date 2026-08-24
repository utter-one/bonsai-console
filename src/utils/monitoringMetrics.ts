/**
 * Curated catalog of the metrics the backend exposes through
 * GET /api/monitoring/metrics. Mirrors the closed registry in the backend
 * (MetricsRegistry.METRIC_CONFIGS) — if the backend adds a metric, add it here.
 *
 * `name` is the raw registry name (used in queries and responses); `label`
 * is the human-readable name shown in the UI.
 *
 * Kinds:
 * - counter: per-bucket delta of increments (chart the `count` of each point)
 * - gauge: instantaneous value (chart `sum / count` = average samples per bucket)
 * - histogram: per-bucket sample count + sum (chart count and/or average = sum/count)
 */
export type MetricKind = 'counter' | 'gauge' | 'histogram'

export interface MetricCatalogEntry {
  name: string
  label: string
  kind: MetricKind
  description: string
}

export const METRIC_CATALOG: MetricCatalogEntry[] = [
  // HTTP request outcomes
  { name: 'api_requests_total', label: 'API requests', kind: 'counter', description: 'By route group and status class' },
  { name: 'api_request_duration_ms', label: 'API request duration', kind: 'histogram', description: 'By route group' },
  // Third-party call outcomes
  { name: 'provider_calls_total', label: 'Provider calls', kind: 'counter', description: 'By provider, operation and outcome' },
  { name: 'provider_call_duration_ms', label: 'Provider call duration', kind: 'histogram', description: 'By provider and operation' },
  { name: 'llm_ttft_ms', label: 'LLM time to first token', kind: 'histogram', description: 'Time to the first generated token' },
  { name: 'llm_stream_duration_ms', label: 'LLM stream duration', kind: 'histogram', description: 'First to last streamed chunk' },
  { name: 'tts_ttfa_ms', label: 'TTS time to first audio', kind: 'histogram', description: 'Text to first audio chunk' },
  { name: 'tts_synthesis_ms', label: 'TTS synthesis time', kind: 'histogram', description: 'Total synthesis time' },
  { name: 'asr_setup_ms', label: 'ASR session setup', kind: 'histogram', description: 'Time to open an ASR session' },
  { name: 'asr_eos_to_final_ms', label: 'ASR end-of-speech to final', kind: 'histogram', description: 'Speech end to final transcript' },
  { name: 'ai_turn_ttft_ms', label: 'AI turn time to first token', kind: 'histogram', description: 'End to end, from user input' },
  // Live gauges
  { name: 'active_conversations', label: 'Active conversations', kind: 'gauge', description: 'Currently active' },
  { name: 'active_websocket_connections', label: 'Active WebSocket connections', kind: 'gauge', description: 'Open console connections' },
  { name: 'active_voice_media_streams', label: 'Active voice media streams', kind: 'gauge', description: 'Currently active' },
  // Voice media
  { name: 'voice_media_bytes_total', label: 'Voice media bytes', kind: 'counter', description: 'Transferred, by direction' },
  { name: 'voice_media_max_frame_gap_ms', label: 'Voice media max frame gap', kind: 'histogram', description: 'Largest gap between frames' },
  // Process / infrastructure
  { name: 'db_pool_total', label: 'DB pool total connections', kind: 'gauge', description: 'All pool connections' },
  { name: 'db_pool_idle', label: 'DB pool idle connections', kind: 'gauge', description: 'Idle pool connections' },
  { name: 'db_pool_waiting', label: 'DB pool waiting requests', kind: 'gauge', description: 'Queued, waiting for a connection' },
  { name: 'rss_bytes', label: 'Process memory', kind: 'gauge', description: 'Resident set size' },
  { name: 'event_loop_lag_p95_ms', label: 'Event loop lag (p95)', kind: 'gauge', description: '95th percentile lag' },
  // Circuit breaker / failover
  { name: 'circuit_breaker_state', label: 'Circuit breaker state', kind: 'gauge', description: '0 closed, 1 open, 2 half-open' },
  { name: 'circuit_opens_total', label: 'Circuit breaker openings', kind: 'counter', description: 'Times a circuit opened' },
  { name: 'circuit_open_skips_total', label: 'Calls skipped (circuit open)', kind: 'counter', description: 'Skipped because a circuit was open' },
  { name: 'fallback_attempts_total', label: 'Fallback attempts', kind: 'counter', description: 'Attempts to run a fallback provider' },
  { name: 'fallbacks_executed_total', label: 'Fallbacks executed', kind: 'counter', description: 'Fallbacks that actually ran' },
  { name: 'provider_chain_exhausted_total', label: 'Provider chains exhausted', kind: 'counter', description: 'Chains that ran out of options' },
  { name: 'fallback_incompatible_total', label: 'Fallbacks skipped (incompatible)', kind: 'counter', description: 'Skipped due to model incompatibility' },
  // Background services / rate limits / sync
  { name: 'background_service_last_run_ts', label: 'Background service last run', kind: 'gauge', description: 'Unix timestamp of the last run' },
  { name: 'rate_limit_rejections_total', label: 'Rate limit rejections', kind: 'counter', description: 'Rejected by own rate limits' },
  { name: 'oauth_refresh_total', label: 'OAuth token refreshes', kind: 'counter', description: 'By provider and outcome' },
  { name: 'imap_poll_total', label: 'IMAP polls', kind: 'counter', description: 'By mailbox and outcome' },
]

export const METRIC_CATALOG_BY_NAME: Record<string, MetricCatalogEntry> = Object.fromEntries(
  METRIC_CATALOG.map((m) => [m.name, m])
)
