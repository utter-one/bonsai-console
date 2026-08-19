<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMonitoringStore, useProvidersStore } from '@/stores'
import type { MonitoringConfig } from '@/stores/monitoring'
import type { NotifierConfig, RuleOverride, ParsedError, ApiErrorDetail, AlertRuleCatalogItem } from '@/api/types'
import FormField from '@/components/FormField.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { ruleLabel, severityBadgeClass } from '@/utils/monitoringRules'
import { Save, Check, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight, BellRing, Info, Loader2 } from 'lucide-vue-next'

const monitoringStore = useMonitoringStore()
const providersStore = useProvidersStore()

const activeTab = ref('notifiers')
const formError = ref<ParsedError | null>(null)
const showSuccess = ref(false)
let successTimer: ReturnType<typeof setTimeout> | null = null

// ── Local draft state (string-based so "empty" means "server default") ──────

interface NotifierDraftState {
  id: string
  type: 'webhook' | 'email'
  enabled: boolean
  url: string
  channelProviderId: string
  to: string
  minSeverity: '' | 'info' | 'warning' | 'critical'
}

interface RuleDraftState {
  enabled: boolean
  threshold: string
  windowMinutes: string
  minSamples: string
  forMinutes: string
  resolveAfterGoodChecks: string
  cooldownMinutes: string
  maxUnresolvedHours: string
  severity: '' | 'info' | 'warning' | 'critical'
}

interface SettingsDraftState {
  retentionDays: string
  llmProbe: string
  asrProbe: string
  ttsProbe: string
  probeCooldownMinutes: string
  engineIntervalMinutes: string
  defaultCooldownMinutes: string
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

const lastSaved = ref('')
const expandedRule = ref<string | null>(null)

// Email channel providers (SMTP/IMAP channels can send email alerts)
const channelOptions = computed(() =>
  providersStore.items
    .filter((p) => p.providerType === 'channel' && p.apiType === 'smtp_imap')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
)

// Rule catalog served live by the alert engine (GET /api/monitoring/rules)
const ruleCatalogById = computed(() => new Map(monitoringStore.ruleCatalog.map((r) => [r.id, r] as const)))

// Rules to show: catalog rules first, then any unknown ids present in the saved config
const visibleRuleIds = computed(() => {
  const ids = new Set<string>(monitoringStore.ruleCatalog.map((r) => r.id))
  for (const id of Object.keys(monitoringStore.monitoringConfig?.rules ?? {})) ids.add(id)
  return Array.from(ids)
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
  parts.push(p.windowMinutes > 0 ? `${p.windowMinutes} min window` : 'gauge')
  if (p.minSamples > 0) parts.push(`min ${p.minSamples} samples`)
  return parts.join(' · ')
}

const dirty = computed(() => JSON.stringify(serializeDrafts()) !== lastSaved.value)

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

function toNumber(raw: string | undefined): number | undefined {
  const v = (raw ?? '').trim()
  if (v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Build the clean config payload from the local drafts (no validation). */
function serializeDrafts(): MonitoringConfig {
  const notifiers: NotifierConfig[] = notifiersDraft.value.map((n) => {
    const notifier: NotifierConfig = { id: n.id, type: n.type, enabled: n.enabled }
    if (n.type === 'webhook') {
      if (n.url.trim()) notifier.url = n.url.trim()
    } else {
      if (n.channelProviderId) notifier.channelProviderId = n.channelProviderId
      if (n.to.trim()) notifier.to = n.to.trim()
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
        details.push({ path: ['notifiers', i, 'channelProviderId'], message: 'An email channel provider is required for email notifiers.', code: 'required' })
      }
      const to = n.to.trim()
      if (!to) {
        details.push({ path: ['notifiers', i, 'to'], message: 'Recipient email address is required for email notifiers.', code: 'required' })
      } else if (!EMAIL_RE.test(to)) {
        details.push({ path: ['notifiers', i, 'to'], message: 'Recipient must be a valid email address.', code: 'invalid_format' })
      }
    }
  })

  for (const [ruleId, fields] of Object.entries(rulesDraft.value)) {
    const check = (raw: string | undefined, field: string, message: string, positive?: boolean) => {
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
  // Non-fatal: on failure the rules tab falls back to config-only rows and
  // shows a retry notice. Awaited before initDrafts so drafts cover all catalog rules.
  const catalogPromise = monitoringStore.fetchRuleCatalog().catch(() => undefined)
  try {
    await monitoringStore.fetchMonitoringConfig()
    formError.value = null
    await catalogPromise
    initDrafts()
    lastSaved.value = JSON.stringify(serializeDrafts())
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
    minSeverity: '',
  })
}

function removeNotifier(index: number) {
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
    if (state[key].trim() !== '') count++
  }
  if (state.severity) count++
  return count
}

function flashSuccess() {
  showSuccess.value = true
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => (showSuccess.value = false), 2000)
}

async function save() {
  if (monitoringStore.monitoringConfigSaving) return
  const { config, error } = buildConfig()
  if (error) {
    formError.value = error
    return
  }
  formError.value = null
  try {
    await monitoringStore.saveMonitoringConfig(config)
    initDrafts()
    lastSaved.value = JSON.stringify(serializeDrafts())
    flashSuccess()
  } catch {
    // error surfaced via monitoringStore.monitoringConfigSaveError
  }
}

onMounted(load)
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
            { key: 'rules', label: 'Rules' },
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
              v-for="(notifier, index) in notifiersDraft"
              :key="notifier.id"
              class="rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="badge" :class="notifier.enabled ? 'badge-success' : 'badge-secondary'">
                    {{ notifier.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  <span class="text-sm font-medium">{{ notifier.type === 'webhook' ? 'Webhook' : 'Email' }}</span>
                  <span class="text-xs font-mono text-gray-400 dark:text-gray-500" :title="notifier.id">{{ notifier.id }}</span>
                </div>
                <button class="btn-icon-danger" title="Remove notifier" @click="removeNotifier(index)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Type" :path="['notifiers', index, 'type']" :error="formError">
                  <select v-model="notifier.type" class="form-select-auto">
                    <option value="webhook">Webhook</option>
                    <option value="email">Email</option>
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
                      <option v-for="provider in channelOptions" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
                    </select>
                  </FormField>
                  <FormField label="Recipient" required :path="['notifiers', index, 'to']" :error="formError">
                    <input v-model="notifier.to" type="email" class="form-input form-input-mono" placeholder="ops@example.com" />
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
              Per-rule overrides. Empty fields keep the engine default; clearing an override removes it from the
              config entirely.
            </p>
            <div v-if="monitoringStore.ruleCatalogError" class="alert-warning mb-4 flex items-center justify-between gap-3">
              <span>{{ monitoringStore.ruleCatalogError }} — only rules present in the saved config are listed.</span>
              <button class="btn-secondary" :disabled="monitoringStore.ruleCatalogLoading" @click="monitoringStore.fetchRuleCatalog().catch(() => undefined)">
                Retry
              </button>
            </div>
            <div class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell w-8"></th>
                      <th class="table-header-cell">Rule</th>
                      <th class="table-header-cell">Scope</th>
                      <th class="table-header-cell">Engine defaults</th>
                      <th class="table-header-cell">Default severity</th>
                      <th class="table-header-cell">Override</th>
                      <th class="table-header-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <template v-for="ruleId in visibleRuleIds" :key="ruleId">
                      <tr class="table-row cursor-pointer" @click="toggleRule(ruleId)">
                        <td class="table-cell">
                          <ChevronRight v-if="expandedRule !== ruleId" :size="14" class="text-gray-400" />
                          <ChevronDown v-else :size="14" class="text-gray-400" />
                        </td>
                        <td class="table-cell">
                          <div class="text-sm font-medium">{{ ruleLabel(ruleId) }}</div>
                          <div class="text-xs text-gray-400 dark:text-gray-500">
                            <template v-if="ruleSummary(ruleId)">{{ ruleSummary(ruleId) }}</template>
                            <template v-else>Not in the current engine catalog — <code class="font-mono">{{ ruleId }}</code></template>
                          </div>
                        </td>
                        <td class="table-cell">
                          <span v-if="ruleScopeLabel(ruleId)" class="badge badge-secondary">{{ ruleScopeLabel(ruleId) }}</span>
                          <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
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
                        <td class="table-cell" colspan="7">
                          <div v-if="rulesDraft[ruleId]" class="bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 space-y-4">
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
                            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <FormField
                                label="Threshold"
                                :path="['rules', ruleId, 'threshold']"
                                :error="formError"
                                help="Rule-specific: count, ratio, ms, or bytes — see the rule summary"
                              >
                                <input v-model="rulesDraft[ruleId].threshold" type="number" class="form-input" />
                              </FormField>
                              <FormField label="Window (minutes)" :path="['rules', ruleId, 'windowMinutes']" :error="formError" help="Evaluation window">
                                <input v-model="rulesDraft[ruleId].windowMinutes" type="number" min="1" class="form-input" />
                              </FormField>
                              <FormField label="Min samples" :path="['rules', ruleId, 'minSamples']" :error="formError" help="Minimum samples before the rule may fire">
                                <input v-model="rulesDraft[ruleId].minSamples" type="number" min="1" class="form-input" />
                              </FormField>
                              <FormField label="For (minutes)" :path="['rules', ruleId, 'forMinutes']" :error="formError" help="Sustainment before firing">
                                <input v-model="rulesDraft[ruleId].forMinutes" type="number" min="0" class="form-input" />
                              </FormField>
                              <FormField label="Resolve after good checks" :path="['rules', ruleId, 'resolveAfterGoodChecks']" :error="formError" help="Consecutive good evaluations to auto-resolve">
                                <input v-model="rulesDraft[ruleId].resolveAfterGoodChecks" type="number" min="0" class="form-input" />
                              </FormField>
                              <FormField label="Cooldown (minutes)" :path="['rules', ruleId, 'cooldownMinutes']" :error="formError" help="Minimum gap between re-fires of the same key">
                                <input v-model="rulesDraft[ruleId].cooldownMinutes" type="number" min="0" class="form-input" />
                              </FormField>
                              <FormField label="Max unresolved (hours)" :path="['rules', ruleId, 'maxUnresolvedHours']" :error="formError" help="Auto-resolve safety valve">
                                <input v-model="rulesDraft[ruleId].maxUnresolvedHours" type="number" min="1" class="form-input" />
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
            <FormField label="Retention (days)" :path="['retentionDays']" :error="formError" class="w-full" help="Days to keep provider call logs, health checks, and metric samples (hourly stats keep 2×). Minimum 7.">
              <input v-model="settingsDraft.retentionDays" type="number" min="7" class="form-input" placeholder="90" />
            </FormField>

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
                <FormField label="Probe cooldown (minutes)" :path="['probeSettings', 'cooldownMinutes']" :error="formError" class="w-full" help="Minimum minutes between probes of the same provider">
                  <input v-model="settingsDraft.probeCooldownMinutes" type="number" min="0" class="form-input" placeholder="10" />
                </FormField>
              </div>
            </div>

            <div class="section-card p-4">
              <h2 class="section-title mb-4">Alert engine</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Engine interval (minutes)" :path="['alerting', 'engineIntervalMinutes']" :error="formError" class="w-full" help="How often the rule engine evaluates. Minimum 1.">
                  <input v-model="settingsDraft.engineIntervalMinutes" type="number" min="1" class="form-input" placeholder="1" />
                </FormField>
                <FormField label="Default cooldown (minutes)" :path="['alerting', 'defaultCooldownMinutes']" :error="formError" class="w-full" help="Default per-key re-fire cooldown">
                  <input v-model="settingsDraft.defaultCooldownMinutes" type="number" min="0" class="form-input" placeholder="15" />
                </FormField>
              </div>
            </div>
          </div>
        </TabContent>
      </div>
    </div>
  </div>
</template>
