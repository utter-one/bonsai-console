<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import { useConfirm } from '@/composables'
import type { MonitoringConfig } from '@/stores/monitoring'
import type { NotifierConfig, RuleOverride, ParsedError, ApiErrorDetail, AlertRuleCatalogItem } from '@/api/types'
import FormField from '@/components/FormField.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { ruleLabel, ruleArea, RULE_AREAS, RULE_AREA_OTHER, severityBadgeClass } from '@/utils/monitoringRules'
import { Save, Check, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight, BellRing, Info, Loader2, Search } from 'lucide-vue-next'

const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

const activeTab = ref('notifiers')
const formError = ref<ParsedError | null>(null)
const showSuccess = ref(false)
let successTimer: ReturnType<typeof setTimeout> | null = null

// ── Local draft state (string-based so "empty" means "server default") ──────

interface NotifierDraftState {
  id: string
  type: 'webhook' | 'email' | 'telegram' | 'twilio_sms' | 'whatsapp'
  enabled: boolean
  url: string
  channelProviderId: string
  to: string
  chatId: string
  minSeverity: '' | 'info' | 'warning' | 'critical'
}

// Numeric draft fields are typed string | number because v-model on
// <input type="number"> assigns numbers to the model in Vue 3. Empty string
// means "not set (engine default)".
type NumDraft = string | number

interface RuleDraftState {
  enabled: boolean
  threshold: NumDraft
  windowMinutes: NumDraft
  minSamples: NumDraft
  forMinutes: NumDraft
  resolveAfterGoodChecks: NumDraft
  cooldownMinutes: NumDraft
  maxUnresolvedHours: NumDraft
  severity: '' | 'info' | 'warning' | 'critical'
}

interface SettingsDraftState {
  retentionDays: NumDraft
  llmProbe: string
  asrProbe: string
  ttsProbe: string
  probeCooldownMinutes: NumDraft
  engineIntervalMinutes: NumDraft
  defaultCooldownMinutes: NumDraft
}

const notifiersDraft = ref<NotifierDraftState[]>([])
const rulesDraft = ref<Record<string, RuleDraftState>>({})
const settingsDraft = ref<SettingsDraftState>({
  retentionDays: '',
  llmProbe: '',
  asrProbe: '',
  ttsProbe: '',
  probeCooldownMinutes: '',
  engineIntervalMinutes: '',
  defaultCooldownMinutes: '',
})

/** Last successfully loaded/saved config snapshot — baseline for the unsaved-changes count. */
const lastSavedConfig = ref<MonitoringConfig | null>(null)
const expandedRule = ref<string | null>(null)

type ChannelNotifierType = 'email' | 'telegram' | 'twilio_sms' | 'whatsapp'

/** Human-readable label for each notifier type. */
const NOTIFIER_TYPE_LABELS: Record<NotifierDraftState['type'], string> = {
  webhook: 'Webhook',
  email: 'Email',
  telegram: 'Telegram',
  twilio_sms: 'Twilio SMS',
  whatsapp: 'WhatsApp',
}

/** Provider apiType the channel provider of each notifier type must have. */
const NOTIFIER_CHANNEL_API_TYPES: Record<ChannelNotifierType, string> = {
  email: 'smtp_imap',
  telegram: 'telegram',
  twilio_sms: 'twilio_messaging',
  whatsapp: 'whatsapp',
}

/** Display label for the channel provider kind each notifier type uses. */
const NOTIFIER_CHANNEL_LABELS: Record<ChannelNotifierType, string> = {
  email: 'SMTP/IMAP',
  telegram: 'Telegram',
  twilio_sms: 'Twilio Messaging',
  whatsapp: 'WhatsApp',
}

/** Channel providers able to deliver a notifier of the given type. */
function channelOptionsFor(type: NotifierDraftState['type']) {
  if (type === 'webhook') return []
  return providersStore.items
    .filter((p) => p.providerType === 'channel' && p.apiType === NOTIFIER_CHANNEL_API_TYPES[type])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** In-use notifier types that have no matching channel provider configured. */
const missingChannelWarnings = computed(() =>
  (Object.keys(NOTIFIER_CHANNEL_API_TYPES) as ChannelNotifierType[])
    .filter((type) => notifiersDraft.value.some((n) => n.type === type))
    .filter(
      (type) =>
        !providersStore.items.some(
          (p) => p.providerType === 'channel' && p.apiType === NOTIFIER_CHANNEL_API_TYPES[type],
        ),
    )
    .map((type) => ({ type, label: NOTIFIER_CHANNEL_LABELS[type] })),
)

// Rule catalog served live by the alert engine (GET /api/monitoring/rules)
const ruleCatalogById = computed(() => new Map(monitoringStore.ruleCatalog.map((r) => [r.id, r] as const)))

// Rules to show: catalog rules first, then any unknown ids present in the saved config
const visibleRuleIds = computed(() => {
  const ids = new Set<string>(monitoringStore.ruleCatalog.map((r) => r.id))
  for (const id of Object.keys(monitoringStore.monitoringConfig?.rules ?? {})) ids.add(id)
  return Array.from(ids)
})

// ── Rules tab: search / status filter / grouping ───────────────────────────

const ruleSearch = ref('')
const ruleStatusFilter = ref('all')

const hasRuleFilters = computed(() => ruleSearch.value.trim() !== '' || ruleStatusFilter.value !== 'all')

function clearRuleFilters() {
  ruleSearch.value = ''
  ruleStatusFilter.value = 'all'
}

const filteredRuleIds = computed(() => {
  const q = ruleSearch.value.trim().toLowerCase()
  return visibleRuleIds.value.filter((id) => {
    if (q && !ruleLabel(id).toLowerCase().includes(q) && !id.toLowerCase().includes(q)) return false
    const draft = rulesDraft.value[id]
    if (!draft) return false
    if (ruleStatusFilter.value === 'enabled' && !draft.enabled) return false
    if (ruleStatusFilter.value === 'disabled' && draft.enabled) return false
    if (ruleStatusFilter.value === 'modified' && ruleOverrideCount(id) === 0) return false
    return true
  })
})

interface RuleGroup {
  area: string
  ruleIds: string[]
}

const ruleGroups = computed<RuleGroup[]>(() => {
  const present = new Set(filteredRuleIds.value.map(ruleArea))
  return [...RULE_AREAS.map((a) => a.label), RULE_AREA_OTHER]
    .filter((label) => present.has(label))
    .map((label) => ({ area: label, ruleIds: filteredRuleIds.value.filter((id) => ruleArea(id) === label) }))
})

const ruleStats = computed(() => {
  const ids = Object.keys(rulesDraft.value)
  const disabled = ids.filter((id) => rulesDraft.value[id]?.enabled === false).length
  const modified = ids.filter((id) => ruleOverrideCount(id) > 0).length
  return { total: ids.length, disabled, modified }
})

// ── Catalog lookup helpers (safe under noUncheckedIndexedAccess) ─────────────

function ruleCatalogItem(ruleId: string): AlertRuleCatalogItem | undefined {
  return ruleCatalogById.value.get(ruleId)
}

function ruleSummary(ruleId: string): string {
  return ruleCatalogItem(ruleId)?.summary ?? ''
}

function ruleScopeLabel(ruleId: string): string {
  const scope = ruleCatalogItem(ruleId)?.scope
  return scope === 'per_provider' ? 'Per provider' : scope === 'global' ? 'Global' : ''
}

function ruleDefaultSeverity(ruleId: string): string {
  return ruleCatalogItem(ruleId)?.severity ?? ''
}

/** Compact rendering of the engine defaults (threshold semantics live in the summary). */
function defaultParamsLabel(ruleId: string): string {
  const p = ruleCatalogItem(ruleId)?.defaultParams
  if (!p) return ''
  const parts = [`thr ${p.threshold}`]
  parts.push(p.windowMinutes > 0 ? `${p.windowMinutes}m window` : 'gauge')
  if (p.minSamples > 0) parts.push(`min ${p.minSamples}`)
  return parts.join(' · ')
}

/** Engine default for a rule's override field — shown as the input placeholder. */
function ruleDefaultPlaceholder(
  ruleId: string,
  field: 'threshold' | 'windowMinutes' | 'minSamples' | 'forMinutes' | 'resolveAfterGoodChecks' | 'cooldownMinutes' | 'maxUnresolvedHours',
): string {
  return String(ruleCatalogItem(ruleId)?.defaultParams?.[field] ?? '')
}

// ── Unsaved-changes tracking ───────────────────────────────────────────────

const changesCount = computed(() => {
  const saved = lastSavedConfig.value
  if (!saved) return 0
  const current = serializeDrafts()
  let count = 0

  const savedNotifiers = new Map((saved.notifiers ?? []).map((n) => [n.id, JSON.stringify(n)]))
  const currentNotifiers = new Map((current.notifiers ?? []).map((n) => [n.id, JSON.stringify(n)]))
  for (const [id, json] of currentNotifiers) if (savedNotifiers.get(id) !== json) count++
  for (const id of savedNotifiers.keys()) if (!currentNotifiers.has(id)) count++

  const savedRules = saved.rules ?? {}
  const currentRules = current.rules ?? {}
  for (const id of new Set([...Object.keys(savedRules), ...Object.keys(currentRules)])) {
    if (JSON.stringify(savedRules[id] ?? null) !== JSON.stringify(currentRules[id] ?? null)) count++
  }

  const settingPairs: [unknown, unknown][] = [
    [saved.retentionDays, current.retentionDays],
    [saved.probeSettings?.llmProbe, current.probeSettings?.llmProbe],
    [saved.probeSettings?.asrProbe, current.probeSettings?.asrProbe],
    [saved.probeSettings?.ttsProbe, current.probeSettings?.ttsProbe],
    [saved.probeSettings?.cooldownMinutes, current.probeSettings?.cooldownMinutes],
    [saved.alerting?.engineIntervalMinutes, current.alerting?.engineIntervalMinutes],
    [saved.alerting?.defaultCooldownMinutes, current.alerting?.defaultCooldownMinutes],
  ]
  for (const [a, b] of settingPairs) if (JSON.stringify(a) !== JSON.stringify(b)) count++

  return count
})

const dirty = computed(() => changesCount.value > 0)

// ── Draft (de)serialization ──────────────────────────────────────────────────

function initDrafts() {
  const cfg = monitoringStore.monitoringConfig
  notifiersDraft.value = (cfg?.notifiers ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    enabled: n.enabled,
    url: n.url ?? '',
    channelProviderId: n.channelProviderId ?? '',
    to: n.to ?? '',
    chatId: n.chatId ?? '',
    minSeverity: n.minSeverity ?? '',
  }))
  const rules: Record<string, RuleDraftState> = {}
  for (const ruleId of visibleRuleIds.value) {
    const o = cfg?.rules?.[ruleId]
    rules[ruleId] = {
      enabled: o?.enabled !== false,
      threshold: o?.threshold != null ? String(o.threshold) : '',
      windowMinutes: o?.windowMinutes != null ? String(o.windowMinutes) : '',
      minSamples: o?.minSamples != null ? String(o.minSamples) : '',
      forMinutes: o?.forMinutes != null ? String(o.forMinutes) : '',
      resolveAfterGoodChecks: o?.resolveAfterGoodChecks != null ? String(o.resolveAfterGoodChecks) : '',
      cooldownMinutes: o?.cooldownMinutes != null ? String(o.cooldownMinutes) : '',
      maxUnresolvedHours: o?.maxUnresolvedHours != null ? String(o.maxUnresolvedHours) : '',
      severity: o?.severity ?? '',
    }
  }
  rulesDraft.value = rules
  settingsDraft.value = {
    retentionDays: cfg?.retentionDays != null ? String(cfg.retentionDays) : '',
    llmProbe: cfg?.probeSettings?.llmProbe ?? '',
    asrProbe: cfg?.probeSettings?.asrProbe ?? '',
    ttsProbe: cfg?.probeSettings?.ttsProbe ?? '',
    probeCooldownMinutes: cfg?.probeSettings?.cooldownMinutes != null ? String(cfg.probeSettings.cooldownMinutes) : '',
    engineIntervalMinutes: cfg?.alerting?.engineIntervalMinutes != null ? String(cfg.alerting.engineIntervalMinutes) : '',
    defaultCooldownMinutes: cfg?.alerting?.defaultCooldownMinutes != null ? String(cfg.alerting.defaultCooldownMinutes) : '',
  }
}

function toNumber(raw: NumDraft | null | undefined): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(String(raw).trim())
  return Number.isFinite(n) ? n : undefined
}

function hasDraftValue(v: NumDraft | undefined): boolean {
  return v != null && String(v).trim() !== ''
}

/** Build the clean config payload from the local drafts (no validation). */
function serializeDrafts(): MonitoringConfig {
  const notifiers: NotifierConfig[] = notifiersDraft.value.map((n) => {
    const notifier: NotifierConfig = { id: n.id, type: n.type, enabled: n.enabled }
    if (n.type === 'webhook') {
      if (n.url.trim()) notifier.url = n.url.trim()
    } else {
      if (n.channelProviderId) notifier.channelProviderId = n.channelProviderId
      if (n.type === 'telegram') {
        if (n.chatId.trim()) notifier.chatId = n.chatId.trim()
      } else if (n.to.trim()) {
        notifier.to = n.to.trim()
      }
    }
    if (n.minSeverity) notifier.minSeverity = n.minSeverity
    return notifier
  })

  const rules: Record<string, RuleOverride> = {}
  for (const [ruleId, fields] of Object.entries(rulesDraft.value)) {
    const override: RuleOverride = {}
    if (!fields.enabled) override.enabled = false
    const threshold = toNumber(fields.threshold)
    if (threshold !== undefined) override.threshold = threshold
    const windowMinutes = toNumber(fields.windowMinutes)
    if (windowMinutes !== undefined) override.windowMinutes = windowMinutes
    const minSamples = toNumber(fields.minSamples)
    if (minSamples !== undefined) override.minSamples = minSamples
    const forMinutes = toNumber(fields.forMinutes)
    if (forMinutes !== undefined) override.forMinutes = forMinutes
    const resolveAfterGoodChecks = toNumber(fields.resolveAfterGoodChecks)
    if (resolveAfterGoodChecks !== undefined) override.resolveAfterGoodChecks = resolveAfterGoodChecks
    const cooldownMinutes = toNumber(fields.cooldownMinutes)
    if (cooldownMinutes !== undefined) override.cooldownMinutes = cooldownMinutes
    const maxUnresolvedHours = toNumber(fields.maxUnresolvedHours)
    if (maxUnresolvedHours !== undefined) override.maxUnresolvedHours = maxUnresolvedHours
    if (fields.severity) override.severity = fields.severity
    if (Object.keys(override).length) rules[ruleId] = override
  }

  const config: MonitoringConfig = { notifiers, rules }
  const retentionDays = toNumber(settingsDraft.value.retentionDays)
  if (retentionDays !== undefined) config.retentionDays = retentionDays

  const probe: {
    llmProbe?: 'models' | 'one_token' | 'off'
    asrProbe?: 'free' | 'off'
    ttsProbe?: 'free' | 'off'
    cooldownMinutes?: number
  } = {}
  if (settingsDraft.value.llmProbe) probe.llmProbe = settingsDraft.value.llmProbe as 'models' | 'one_token' | 'off'
  if (settingsDraft.value.asrProbe) probe.asrProbe = settingsDraft.value.asrProbe as 'free' | 'off'
  if (settingsDraft.value.ttsProbe) probe.ttsProbe = settingsDraft.value.ttsProbe as 'free' | 'off'
  const probeCooldown = toNumber(settingsDraft.value.probeCooldownMinutes)
  if (probeCooldown !== undefined) probe.cooldownMinutes = probeCooldown
  if (Object.keys(probe).length) config.probeSettings = probe

  const alerting: { engineIntervalMinutes?: number; defaultCooldownMinutes?: number } = {}
  const engineInterval = toNumber(settingsDraft.value.engineIntervalMinutes)
  if (engineInterval !== undefined) alerting.engineIntervalMinutes = engineInterval
  const defaultCooldown = toNumber(settingsDraft.value.defaultCooldownMinutes)
  if (defaultCooldown !== undefined) alerting.defaultCooldownMinutes = defaultCooldown
  if (Object.keys(alerting).length) config.alerting = alerting

  return config
}

// ── Client-side validation (mirrors the backend's 400 checks) ───────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** E.164 phone number: optional leading +, then 7–15 digits, no leading zero. */
const E164_RE = /^\+?[1-9]\d{6,14}$/

function buildConfig(): { config: MonitoringConfig; error: ParsedError | null } {
  const details: ApiErrorDetail[] = []
  const config = serializeDrafts()

  notifiersDraft.value.forEach((n, i) => {
    if (n.type === 'webhook') {
      const url = n.url.trim()
      if (!url) {
        details.push({ path: ['notifiers', i, 'url'], message: 'Webhook URL is required for webhook notifiers.', code: 'required' })
      } else {
        try {
          const parsed = new URL(url)
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            details.push({ path: ['notifiers', i, 'url'], message: 'Webhook URL must be http(s).', code: 'invalid_format' })
          }
        } catch {
          details.push({ path: ['notifiers', i, 'url'], message: 'Webhook URL must be a valid http(s) URL.', code: 'invalid_format' })
        }
      }
    } else {
      if (!n.channelProviderId) {
        details.push({
          path: ['notifiers', i, 'channelProviderId'],
          message: `A ${NOTIFIER_CHANNEL_LABELS[n.type]} channel provider is required for ${NOTIFIER_TYPE_LABELS[n.type].toLowerCase()} notifiers.`,
          code: 'required',
        })
      }
      if (n.type === 'telegram') {
        if (!n.chatId.trim()) {
          details.push({ path: ['notifiers', i, 'chatId'], message: 'Chat id is required for Telegram notifiers.', code: 'required' })
        }
      } else {
        const to = n.to.trim()
        if (!to) {
          details.push({
            path: ['notifiers', i, 'to'],
            message: n.type === 'email'
              ? 'Recipient email address is required for email notifiers.'
              : 'Recipient phone number is required for Twilio SMS/WhatsApp notifiers.',
            code: 'required',
          })
        } else if (n.type === 'email' && !EMAIL_RE.test(to)) {
          details.push({ path: ['notifiers', i, 'to'], message: 'Recipient must be a valid email address.', code: 'invalid_format' })
        } else if (n.type !== 'email' && !E164_RE.test(to)) {
          details.push({ path: ['notifiers', i, 'to'], message: 'Recipient must be a valid E.164 phone number (e.g. +48123456789).', code: 'invalid_format' })
        }
      }
    }
  })

  for (const [ruleId, fields] of Object.entries(rulesDraft.value)) {
    const check = (raw: NumDraft | null | undefined, field: string, message: string, positive?: boolean) => {
      const n = toNumber(raw)
      if (n === undefined) return
      if (positive && n <= 0) details.push({ path: ['rules', ruleId, field], message, code: 'too_small' })
      else if (n < 0) details.push({ path: ['rules', ruleId, field], message, code: 'too_small' })
    }
    check(fields.threshold, 'threshold', 'Threshold must be a number.')
    check(fields.windowMinutes, 'windowMinutes', 'Window must be greater than 0.', true)
    check(fields.minSamples, 'minSamples', 'Minimum samples must be greater than 0.', true)
    check(fields.forMinutes, 'forMinutes', 'Sustainment cannot be negative.')
    check(fields.resolveAfterGoodChecks, 'resolveAfterGoodChecks', 'Good checks count cannot be negative.')
    check(fields.cooldownMinutes, 'cooldownMinutes', 'Cooldown cannot be negative.')
    check(fields.maxUnresolvedHours, 'maxUnresolvedHours', 'Max unresolved hours must be greater than 0.', true)
  }

  const retention = toNumber(settingsDraft.value.retentionDays)
  if (retention !== undefined && retention < 7) {
    details.push({ path: ['retentionDays'], message: 'Retention must be at least 7 days.', code: 'too_small' })
  }
  const engineInterval = toNumber(settingsDraft.value.engineIntervalMinutes)
  if (engineInterval !== undefined && engineInterval < 1) {
    details.push({ path: ['alerting', 'engineIntervalMinutes'], message: 'Engine interval must be at least 1 minute.', code: 'too_small' })
  }

  if (details.length) {
    return { config, error: { message: 'Please fix the highlighted fields', details } }
  }
  return { config, error: null }
}

/** Server error details arrive prefixed with `config.*` — strip it for FormField paths. */
function serverFormError(): ParsedError | null {
  const err = monitoringStore.monitoringConfigSaveError
  if (!err) return null
  if (!err.details?.length) return err
  return {
    ...err,
    details: err.details.map((d) =>
      d.path[0] === 'config' ? { ...d, path: d.path.slice(1) } : d
    ),
  }
}

const isConflict = computed(() => monitoringStore.monitoringConfigSaveError?.statusCode === 409)

// ── Actions ──────────────────────────────────────────────────────────────────

async function load() {
  if (dirty.value && !window.confirm('Discard unsaved changes and reload the config?')) return
  // Non-fatal: on failure the rules tab falls back to config-only rows and
  // shows a retry notice. Awaited before initDrafts so drafts cover all catalog rules.
  const catalogPromise = monitoringStore.fetchRuleCatalog().catch(() => undefined)
  try {
    await monitoringStore.fetchMonitoringConfig()
    formError.value = null
    await catalogPromise
    initDrafts()
    lastSavedConfig.value = serializeDrafts()
  } catch {
    // fetch error surfaced via monitoringStore.monitoringConfigError
  }
  try {
    // Non-fatal: on failure the email channel select simply stays empty
    await providersStore.fetchAll()
  } catch {
    // ignore
  }
}

function addNotifier() {
  notifiersDraft.value.push({
    id: `${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'webhook',
    enabled: true,
    url: '',
    channelProviderId: '',
    to: '',
    chatId: '',
    minSeverity: '',
  })
}

/** Drop type-specific fields when the notifier type changes — channel providers are type-bound. */
function onNotifierTypeChange(index: number) {
  const notifier = notifiersDraft.value[index]
  if (!notifier) return
  notifier.channelProviderId = ''
  notifier.to = ''
  notifier.chatId = ''
}

const { confirmDelete } = useConfirm()

async function removeNotifier(index: number) {
  const notifier = notifiersDraft.value[index]
  if (!notifier) return
  if (!(await confirmDelete(notifier.id))) return
  notifiersDraft.value.splice(index, 1)
}

function toggleRule(ruleId: string) {
  expandedRule.value = expandedRule.value === ruleId ? null : ruleId
}

function clearRuleOverride(ruleId: string) {
  const state = rulesDraft.value[ruleId]
  if (!state) return
  rulesDraft.value[ruleId] = {
    enabled: true,
    threshold: '',
    windowMinutes: '',
    minSamples: '',
    forMinutes: '',
    resolveAfterGoodChecks: '',
    cooldownMinutes: '',
    maxUnresolvedHours: '',
    severity: '',
  }
}

function ruleOverrideCount(ruleId: string): number {
  const state = rulesDraft.value[ruleId]
  if (!state) return 0
  let count = 0
  if (!state.enabled) count++
  for (const key of ['threshold', 'windowMinutes', 'minSamples', 'forMinutes', 'resolveAfterGoodChecks', 'cooldownMinutes', 'maxUnresolvedHours'] as const) {
    if (hasDraftValue(state[key])) count++
  }
  if (state.severity) count++
  return count
}

function flashSuccess() {
  showSuccess.value = true
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => (showSuccess.value = false), 2000)
}

/** Jump to the tab containing the first validation error. */
function switchTabForError(err: ParsedError | null) {
  const root = err?.details?.[0]?.path[0]
  if (root === 'notifiers' || root === 'rules') activeTab.value = root
  else if (root) activeTab.value = 'settings'
}

async function save() {
  if (monitoringStore.monitoringConfigSaving) return
  const { config, error } = buildConfig()
  if (error) {
    formError.value = error
    switchTabForError(error)
    return
  }
  formError.value = null
  try {
    await monitoringStore.saveMonitoringConfig(config)
    initDrafts()
    lastSavedConfig.value = serializeDrafts()
    flashSuccess()
  } catch {
    // error surfaced via monitoringStore.monitoringConfigSaveError
    switchTabForError(serverFormError())
  }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm('You have unsaved monitoring config changes. Leave without saving?')
})

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  load()
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Monitoring Config</h1>
          <p class="page-subtitle">Alert notifiers, rule overrides, retention, and engine settings — platform-wide</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="changesCount > 0" class="badge badge-warning whitespace-nowrap">
            {{ changesCount }} unsaved change{{ changesCount > 1 ? 's' : '' }}
          </span>
          <span v-if="monitoringStore.monitoringConfigVersion" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            version {{ monitoringStore.monitoringConfigVersion }}
            <template v-if="monitoringStore.monitoringConfigUpdatedAt">
              · updated <RelativeDate :date="monitoringStore.monitoringConfigUpdatedAt" />
            </template>
          </span>
          <button @click="load" class="btn-secondary">
            <RefreshCw class="inline-block mr-2 w-4 h-4" />
            Reload
          </button>
          <button @click="save" class="btn-primary" :disabled="!dirty || monitoringStore.monitoringConfigSaving" type="button">
            <Loader2 v-if="monitoringStore.monitoringConfigSaving" class="inline-block mr-2 w-4 h-4 animate-spin" />
            <Check v-else-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
            <Save v-else class="inline-block mr-2 w-4 h-4" />
            {{ monitoringStore.monitoringConfigSaving ? 'Saving…' : showSuccess ? 'Saved!' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- 409 conflict banner -->
      <div v-if="isConflict" class="alert-warning mb-4 flex flex-col gap-2">
        <div>
          The monitoring config was changed by someone else since you loaded it (version conflict).
          Reload the latest version and re-apply your changes.
        </div>
        <button @click="load" class="btn-secondary self-start" :disabled="monitoringStore.monitoringConfigLoading">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          Reload latest config
        </button>
      </div>

      <ErrorDisplay :error="formError ?? (monitoringStore.monitoringConfigSaveError && !isConflict ? serverFormError() : null)" class="mb-4" />

      <!-- Loading -->
      <div v-if="monitoringStore.monitoringConfigLoading" class="flex justify-center py-12">
        <div class="spinner"></div>
      </div>

      <!-- Fetch error -->
      <div v-else-if="monitoringStore.monitoringConfigError" class="alert-error mb-4">{{ monitoringStore.monitoringConfigError }}</div>

      <!-- Config -->
      <div
        v-if="!monitoringStore.monitoringConfigLoading && monitoringStore.monitoringConfig"
        class="flex flex-col border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800"
      >
        <div class="tabs-container">
          <TabNavigator v-model="activeTab" :tabs="[
            { key: 'notifiers', label: `Notifiers${notifiersDraft.length ? ` (${notifiersDraft.length})` : ''}` },
            { key: 'rules', label: ruleStats.modified ? `Rules (${ruleStats.modified} modified)` : 'Rules' },
            { key: 'settings', label: 'Settings' },
          ]" />
        </div>

        <!-- Notifiers tab -->
        <TabContent v-model="activeTab" tab="notifiers">
          <div class="p-4 md:p-6 space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Alert delivery targets. Firing and resolving events are delivered to every enabled notifier whose
              minimum severity the alert meets.
            </p>

            <div v-if="notifiersDraft.length === 0" class="empty-state py-8">
              <div class="flex flex-col items-center gap-2">
                <BellRing class="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <p class="text-sm text-gray-500 dark:text-gray-400">No notifiers configured — alerts are only recorded, not delivered.</p>
              </div>
            </div>

            <div
              v-for="warning in missingChannelWarnings"
              :key="warning.type"
              class="alert-warning"
            >
              No {{ warning.label }} channel provider is configured yet —
              {{ NOTIFIER_TYPE_LABELS[warning.type].toLowerCase() }} notifiers can't deliver until you add one in
              Providers.
            </div>

            <div
              v-for="(notifier, index) in notifiersDraft"
              :key="notifier.id"
              class="rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="badge" :class="notifier.enabled ? 'badge-success' : 'badge-secondary'">
                    {{ notifier.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  <span class="text-sm font-medium">{{ NOTIFIER_TYPE_LABELS[notifier.type] }}</span>
                  <span class="text-xs font-mono text-gray-400 dark:text-gray-500" :title="notifier.id">{{ notifier.id }}</span>
                </div>
                <button class="btn-icon-danger" title="Remove notifier" @click="removeNotifier(index)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Type" :path="['notifiers', index, 'type']" :error="formError">
                  <select v-model="notifier.type" class="form-select-auto" @change="onNotifierTypeChange(index)">
                    <option value="webhook">Webhook</option>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                    <option value="twilio_sms">Twilio SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </FormField>

                <template v-if="notifier.type === 'webhook'">
                  <FormField label="URL" required :path="['notifiers', index, 'url']" :error="formError" class="sm:col-span-2">
                    <input v-model="notifier.url" type="url" class="form-input form-input-mono" placeholder="https://example.com/alerts" />
                  </FormField>
                </template>
                <template v-else>
                  <FormField label="Channel provider" required :path="['notifiers', index, 'channelProviderId']" :error="formError">
                    <select v-model="notifier.channelProviderId" class="form-select-auto">
                      <option value="" disabled>Select a channel…</option>
                      <option v-for="provider in channelOptionsFor(notifier.type)" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
                    </select>
                  </FormField>
                  <FormField
                    v-if="notifier.type === 'telegram'"
                    label="Chat id"
                    required
                    :path="['notifiers', index, 'chatId']"
                    :error="formError"
                    help="Numeric chat id or @channel username"
                  >
                    <input v-model="notifier.chatId" type="text" class="form-input form-input-mono" placeholder="123456789 or @alerts" />
                  </FormField>
                  <FormField
                    v-else
                    label="Recipient"
                    required
                    :path="['notifiers', index, 'to']"
                    :error="formError"
                    :help="notifier.type === 'email' ? undefined : 'E.164 phone number'"
                  >
                    <input
                      v-model="notifier.to"
                      :type="notifier.type === 'email' ? 'email' : 'tel'"
                      class="form-input form-input-mono"
                      :placeholder="notifier.type === 'email' ? 'ops@example.com' : '+48123456789'"
                    />
                  </FormField>
                </template>

                <FormField label="Minimum severity" :path="['notifiers', index, 'minSeverity']" :error="formError" help="Only deliver alerts at or above this severity">
                  <select v-model="notifier.minSeverity" class="form-select-auto">
                    <option value="">All</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </FormField>

                <FormField :path="['notifiers', index, 'enabled']" :error="formError" class="self-end">
                  <label class="checkbox-label">
                    <input v-model="notifier.enabled" type="checkbox" class="form-checkbox" />
                    Enabled
                  </label>
                </FormField>
              </div>
            </div>

            <button @click="addNotifier" class="btn-secondary">
              <Plus class="inline-block mr-2 w-4 h-4" />
              Add notifier
            </button>
          </div>
        </TabContent>

        <!-- Rules tab -->
        <TabContent v-model="activeTab" tab="rules">
          <div class="p-4 md:p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Per-rule overrides. Empty fields keep the engine default (shown as each field's placeholder); clearing
              an override removes it from the config entirely.
            </p>
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <div class="relative min-w-[220px] flex-1 max-w-sm">
                <Search class="input-icon-left" />
                <input v-model="ruleSearch" type="text" class="search-input" placeholder="Search rules…" />
              </div>
              <select v-model="ruleStatusFilter" class="form-select-auto" aria-label="Rule status filter">
                <option value="all">All rules</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
                <option value="modified">Modified</option>
              </select>
              <button v-if="hasRuleFilters" class="btn-link" @click="clearRuleFilters">Clear filters</button>
              <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {{ ruleStats.total }} rules · {{ ruleStats.total - ruleStats.disabled }} enabled
                <template v-if="ruleStats.disabled"> · {{ ruleStats.disabled }} disabled</template>
                <template v-if="ruleStats.modified"> · {{ ruleStats.modified }} modified</template>
              </span>
            </div>
            <div v-if="monitoringStore.ruleCatalogError" class="alert-warning mb-4 flex items-center justify-between gap-3">
              <span>{{ monitoringStore.ruleCatalogError }} — only rules present in the saved config are listed.</span>
              <button class="btn-secondary" :disabled="monitoringStore.ruleCatalogLoading" @click="monitoringStore.fetchRuleCatalog().catch(() => undefined)">
                Retry
              </button>
            </div>
            <div class="table-container">
              <div class="table-wrapper">
                <table class="table rules-compact">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell w-8"></th>
                      <th class="table-header-cell">Rule</th>
                      <th class="table-header-cell">Engine defaults</th>
                      <th class="table-header-cell">Severity</th>
                      <th class="table-header-cell">Override</th>
                      <th class="table-header-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr v-if="filteredRuleIds.length === 0" class="table-row">
                      <td colspan="6" class="table-cell text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        <template v-if="hasRuleFilters">No rules match the current filters.</template>
                        <template v-else>No rules available — the engine catalog could not be loaded and no overrides are saved.</template>
                      </td>
                    </tr>
                    <template v-for="group in ruleGroups" :key="group.area">
                      <tr class="table-row bg-gray-50 dark:bg-gray-900/40">
                        <td colspan="6" class="table-cell py-1.5">
                          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ group.area }}</span>
                        </td>
                      </tr>
                      <template v-for="ruleId in group.ruleIds" :key="ruleId">
                      <tr class="table-row cursor-pointer" @click="toggleRule(ruleId)">
                        <td class="table-cell">
                          <ChevronRight v-if="expandedRule !== ruleId" :size="14" class="text-gray-400" />
                          <ChevronDown v-else :size="14" class="text-gray-400" />
                        </td>
                        <td class="table-cell">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-medium">{{ ruleLabel(ruleId) }}</span>
                            <span v-if="ruleScopeLabel(ruleId)" class="badge badge-secondary">{{ ruleScopeLabel(ruleId) }}</span>
                          </div>
                          <div class="text-xs text-gray-400 dark:text-gray-500 max-w-[340px] truncate">
                            <template v-if="ruleSummary(ruleId)">{{ ruleSummary(ruleId) }}</template>
                            <template v-else>Not in the current engine catalog — <code class="font-mono">{{ ruleId }}</code></template>
                          </div>
                        </td>
                        <td class="table-cell-mono text-xs text-gray-500 dark:text-gray-400">{{ defaultParamsLabel(ruleId) || '—' }}</td>
                        <td class="table-cell">
                          <span v-if="ruleDefaultSeverity(ruleId)" class="badge" :class="severityBadgeClass(ruleDefaultSeverity(ruleId))">{{ ruleDefaultSeverity(ruleId) }}</span>
                          <span v-else class="text-xs text-gray-400 dark:text-gray-500">engine default</span>
                        </td>
                        <td class="table-cell">
                          <span v-if="ruleOverrideCount(ruleId)" class="badge badge-violet">{{ ruleOverrideCount(ruleId) }} field{{ ruleOverrideCount(ruleId) > 1 ? 's' : '' }}</span>
                          <span v-else class="text-xs text-gray-400 dark:text-gray-500">Defaults</span>
                        </td>
                        <td class="table-cell">
                          <span class="badge" :class="rulesDraft[ruleId]?.enabled ? 'badge-success' : 'badge-danger'">
                            {{ rulesDraft[ruleId]?.enabled ? 'Enabled' : 'Disabled' }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="expandedRule === ruleId">
                        <td class="table-cell" colspan="6">
                          <!-- whitespace-normal: .table-cell inherits nowrap, which would let the
                               field labels/help overflow the grid tracks and overlap neighbors -->
                          <div v-if="rulesDraft[ruleId]" class="whitespace-normal bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 space-y-4">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <label class="checkbox-label">
                                <input v-model="rulesDraft[ruleId].enabled" type="checkbox" class="form-checkbox" />
                                Rule enabled
                              </label>
                              <button
                                v-if="ruleOverrideCount(ruleId)"
                                class="btn-link"
                                @click.stop="clearRuleOverride(ruleId)"
                              >
                                Clear override (back to defaults)
                              </button>
                            </div>
                            <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                              <FormField
                                label="Threshold"
                                :path="['rules', ruleId, 'threshold']"
                                :error="formError"
                                help="Rule-specific: count, ratio, ms, or bytes — see the rule summary"
                              >
                                <input v-model="rulesDraft[ruleId].threshold" type="number" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'threshold')" />
                              </FormField>
                              <FormField label="Window (minutes)" :path="['rules', ruleId, 'windowMinutes']" :error="formError" help="Evaluation window">
                                <input v-model="rulesDraft[ruleId].windowMinutes" type="number" min="1" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'windowMinutes')" />
                              </FormField>
                              <FormField label="Min samples" :path="['rules', ruleId, 'minSamples']" :error="formError" help="Minimum samples before the rule may fire">
                                <input v-model="rulesDraft[ruleId].minSamples" type="number" min="1" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'minSamples')" />
                              </FormField>
                              <FormField label="For (minutes)" :path="['rules', ruleId, 'forMinutes']" :error="formError" help="Sustainment before firing">
                                <input v-model="rulesDraft[ruleId].forMinutes" type="number" min="0" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'forMinutes')" />
                              </FormField>
                              <FormField label="Resolve after good checks" :path="['rules', ruleId, 'resolveAfterGoodChecks']" :error="formError" help="Consecutive good evaluations to auto-resolve">
                                <input v-model="rulesDraft[ruleId].resolveAfterGoodChecks" type="number" min="0" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'resolveAfterGoodChecks')" />
                              </FormField>
                              <FormField label="Cooldown (minutes)" :path="['rules', ruleId, 'cooldownMinutes']" :error="formError" help="Minimum gap between re-fires of the same key">
                                <input v-model="rulesDraft[ruleId].cooldownMinutes" type="number" min="0" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'cooldownMinutes')" />
                              </FormField>
                              <FormField label="Max unresolved (hours)" :path="['rules', ruleId, 'maxUnresolvedHours']" :error="formError" help="Auto-resolve safety valve">
                                <input v-model="rulesDraft[ruleId].maxUnresolvedHours" type="number" min="1" class="form-input" :placeholder="ruleDefaultPlaceholder(ruleId, 'maxUnresolvedHours')" />
                              </FormField>
                              <FormField label="Severity" :path="['rules', ruleId, 'severity']" :error="formError" help="Override the rule default severity">
                                <select v-model="rulesDraft[ruleId].severity" class="form-select-auto">
                                  <option value="">Rule default</option>
                                  <option value="info">Info</option>
                                  <option value="warning">Warning</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </FormField>
                            </div>
                          </div>
                        </td>
                      </tr>
                      </template>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="flex items-start gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                The rule list and defaults are served live by the alert engine (GET /api/monitoring/rules), so they
                always match what the engine evaluates. Unknown ids already present in the saved config are listed too
                and can be overridden, but new ids cannot be added from the console.
              </span>
            </div>
          </div>
        </TabContent>

        <!-- Settings tab -->
        <TabContent v-model="activeTab" tab="settings">
          <div class="p-4 md:p-6 space-y-6 max-w-3xl">
            <div class="section-card p-4">
              <h2 class="section-title mb-4">Data retention</h2>
              <FormField label="Retention (days)" :path="['retentionDays']" :error="formError" class="w-full max-w-sm" help="Days to keep provider call logs, health checks, and metric samples (hourly stats keep 2×). Default 90, minimum 7.">
                <input v-model="settingsDraft.retentionDays" type="number" min="7" class="form-input" placeholder="90 (default)" />
              </FormField>
            </div>

            <div class="section-card p-4">
              <h2 class="section-title mb-4">Provider health probes</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="LLM probe" :path="['probeSettings', 'llmProbe']" :error="formError" class="w-full" help="How LLM providers are probed">
                  <select v-model="settingsDraft.llmProbe" class="form-select-auto">
                    <option value="">Default (models)</option>
                    <option value="models">Enumerate models (free)</option>
                    <option value="one_token">One-token generation (costs money)</option>
                    <option value="off">Off (call-log inference only)</option>
                  </select>
                </FormField>
                <FormField label="ASR probe" :path="['probeSettings', 'asrProbe']" :error="formError" class="w-full" help="How ASR providers are probed">
                  <select v-model="settingsDraft.asrProbe" class="form-select-auto">
                    <option value="">Default (free)</option>
                    <option value="free">Free liveness check (no such endpoint → call-log inference)</option>
                    <option value="off">Off (call-log inference only)</option>
                  </select>
                </FormField>
                <FormField label="TTS probe" :path="['probeSettings', 'ttsProbe']" :error="formError" class="w-full" help="How TTS providers are probed">
                  <select v-model="settingsDraft.ttsProbe" class="form-select-auto">
                    <option value="">Default (free)</option>
                    <option value="free">Free liveness check (no such endpoint → call-log inference)</option>
                    <option value="off">Off (call-log inference only)</option>
                  </select>
                </FormField>
                <FormField label="Probe cooldown (minutes)" :path="['probeSettings', 'cooldownMinutes']" :error="formError" class="w-full" help="Minimum minutes between probes of the same provider. Default 10.">
                  <input v-model="settingsDraft.probeCooldownMinutes" type="number" min="0" class="form-input" placeholder="10 (default)" />
                </FormField>
              </div>
            </div>

            <div class="section-card p-4">
              <h2 class="section-title mb-4">Alert engine</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Engine interval (minutes)" :path="['alerting', 'engineIntervalMinutes']" :error="formError" class="w-full" help="How often the rule engine evaluates. Default 1, minimum 1.">
                  <input v-model="settingsDraft.engineIntervalMinutes" type="number" min="1" class="form-input" placeholder="1 (default)" />
                </FormField>
                <FormField label="Default cooldown (minutes)" :path="['alerting', 'defaultCooldownMinutes']" :error="formError" class="w-full" help="Default per-key re-fire cooldown. Default 15.">
                  <input v-model="settingsDraft.defaultCooldownMinutes" type="number" min="0" class="form-input" placeholder="15 (default)" />
                </FormField>
              </div>
            </div>
          </div>
        </TabContent>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* .table-cell / .table-header-cell are defined unlayered in utilities.css, so
   Tailwind's layered px-* utilities cannot override their padding. Scope a
   compact gutter for the rules table with a higher-specificity rule. */
.rules-compact .table-cell,
.rules-compact .table-header-cell {
  padding-inline: 0.5rem;
}
</style>
