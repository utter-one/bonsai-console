<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { useAnalyticsStore, useProjectSelectionStore, useAuthStore, useStagesStore, useGlobalActionsStore, useProjectsStore, useToolsStore } from '@/stores'
import { Plus, X, Play, ChevronDown, Bookmark, BookmarkCheck, RefreshCw, Check, CalendarDays } from 'lucide-vue-next'
import type { FunnelStep, FunnelQuery, SavedFunnelQuery, RelativeTime } from '@/api/generated/data-contracts'
import FunnelChart from '@/components/FunnelChart.vue'
import FloatingDropdown from '@/components/FloatingDropdown.vue'

const analyticsStore = useAnalyticsStore()
const projectSelectionStore = useProjectSelectionStore()
const authStore = useAuthStore()
const stagesStore = useStagesStore()
const globalActionsStore = useGlobalActionsStore()
const projectsStore = useProjectsStore()
const toolsStore = useToolsStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

type FunnelEventType = FunnelStep['eventType']

const EVENT_TYPE_LABELS: Record<FunnelEventType, string> = {
  enter_stage: 'Enter Stage',
  end_stage: 'End Stage',
  action_fire: 'Action Fire',
  variable_changed: 'Variable Changed',
  user_profile_changed: 'User Profile Changed',
  session_started: 'Session Started',
  tool_response: 'Tool Response',
}

const steps = ref<FunnelStep[]>([
  { eventType: 'enter_stage', params: {} },
  { eventType: 'enter_stage', params: {} },
])

function addStep() {
  steps.value.push({ eventType: 'enter_stage', params: {} })
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

function onEventTypeChange(index: number, newType: FunnelEventType) {
  steps.value.splice(index, 1, { eventType: newType, params: {} })
}

function isStepValid(step: FunnelStep): boolean {
  const { eventType, params } = step
  switch (eventType) {
    case 'enter_stage': return !!params.stageName?.trim()
    case 'end_stage': return !!params.stageName?.trim()
    case 'action_fire': return !!params.actionName?.trim()
    case 'variable_changed': return !!params.variableName?.trim()
    case 'user_profile_changed': return !!params.profileName?.trim()
    case 'session_started': return !!params.minSessions?.trim() && Number.isInteger(Number(params.minSessions)) && Number(params.minSessions) > 0
    case 'tool_response': return !!params.toolName?.trim() && !!params.response?.trim()
    default: return false
  }
}

const canRun = computed(() =>
  !!projectId.value &&
  steps.value.length >= 2 &&
  steps.value.every(isStepValid),
)

type TimeRangeMode = 'relative' | 'absolute'
const timeRangeMode = ref<TimeRangeMode>('relative')
const relativeTimeAmount = ref(7)
const relativeTimeUnit = ref<RelativeTime['unit']>('days')
const absoluteFrom = ref('')
const absoluteTo = ref('')
const showTimeRangePicker = ref(false)
const timeRangePickerRef = useTemplateRef<HTMLElement>('timeRangePickerRef')

const relativePresets: { label: string; amount: number; unit: RelativeTime['unit'] }[] = [
  { label: '1h', amount: 1, unit: 'hours' },
  { label: '24h', amount: 24, unit: 'hours' },
  { label: '7d', amount: 7, unit: 'days' },
  { label: '30d', amount: 30, unit: 'days' },
  { label: '3mo', amount: 3, unit: 'months' },
]

function setRelativePreset(p: { amount: number; unit: RelativeTime['unit'] }) {
  relativeTimeAmount.value = p.amount
  relativeTimeUnit.value = p.unit
}

function relativeToMs(amount: number, unit: RelativeTime['unit']): number {
  const ms = { hours: 3_600_000, days: 86_400_000, weeks: 604_800_000, months: 30 * 86_400_000 }
  return amount * ms[unit]
}

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function switchTimeRangeMode(mode: TimeRangeMode) {
  if (mode === 'absolute' && timeRangeMode.value === 'relative') {
    const now = new Date()
    const from = new Date(now.getTime() - relativeToMs(relativeTimeAmount.value, relativeTimeUnit.value))
    absoluteFrom.value = toLocalDatetimeInput(from)
    absoluteTo.value = toLocalDatetimeInput(now)
  }
  timeRangeMode.value = mode
}

const timeRangeLabel = computed<string>(() => {
  if (timeRangeMode.value === 'relative') {
    return `Last ${relativeTimeAmount.value} ${relativeTimeUnit.value}`
  }
  const from = absoluteFrom.value ? new Date(absoluteFrom.value).toLocaleDateString() : '?'
  const to = absoluteTo.value ? new Date(absoluteTo.value).toLocaleDateString() : '?'
  return `${from} – ${to}`
})

const activeQuery = ref<SavedFunnelQuery | null>(null)
const isSaving = ref(false)
const saveError = ref<string | null>(null)

const showQuerySelector = ref(false)
const querySelectorRef = useTemplateRef<HTMLElement>('querySelectorRef')

const showSaveDialog = ref(false)
const saveDialogName = ref('')
const saveDialogShared = ref(false)
const saveDialogRef = useTemplateRef<HTMLElement>('saveDialogRef')

const showRenameDialog = ref(false)
const renameDialogName = ref('')

const showSaveMenu = ref(false)
const saveMenuRef = useTemplateRef<HTMLElement>('saveMenuRef')

const canEditSavedFunnelQuery = (q: SavedFunnelQuery) =>
  q.operatorId === authStore.currentOperator?.id ||
  (authStore.currentOperator?.roles.includes('super_admin') ?? false)

function buildFunnelQuery(): FunnelQuery {
  return {
    steps: steps.value,
    relativeTime: timeRangeMode.value === 'relative'
      ? { amount: relativeTimeAmount.value, unit: relativeTimeUnit.value }
      : undefined,
    from: timeRangeMode.value === 'absolute' && absoluteFrom.value
      ? new Date(absoluteFrom.value).toISOString()
      : undefined,
    to: timeRangeMode.value === 'absolute' && absoluteTo.value
      ? new Date(absoluteTo.value).toISOString()
      : undefined,
  }
}

async function runFunnel() {
  if (!projectId.value || !canRun.value) return
  await analyticsStore.runFunnelQuery(projectId.value, buildFunnelQuery())
}

function loadQuery(q: SavedFunnelQuery) {
  analyticsStore.clearFunnelResult()
  const fq = q.query
  steps.value = fq.steps.map(s => ({ ...s, params: { ...s.params } }))
  if (fq.relativeTime) {
    timeRangeMode.value = 'relative'
    relativeTimeAmount.value = fq.relativeTime.amount
    relativeTimeUnit.value = fq.relativeTime.unit
  } else if (fq.from || fq.to) {
    timeRangeMode.value = 'absolute'
    absoluteFrom.value = fq.from ? fq.from.slice(0, 16) : ''
    absoluteTo.value = fq.to ? fq.to.slice(0, 16) : ''
  }
  activeQuery.value = q
  showQuerySelector.value = false
}

function clearActiveQuery() {
  analyticsStore.clearFunnelResult()
  steps.value = [
    { eventType: 'enter_stage', params: {} },
    { eventType: 'enter_stage', params: {} },
  ]
  timeRangeMode.value = 'relative'
  relativeTimeAmount.value = 7
  relativeTimeUnit.value = 'days'
  activeQuery.value = null
  showQuerySelector.value = false
}

function openSaveDialog() {
  saveDialogName.value = ''
  saveDialogShared.value = false
  saveError.value = null
  showSaveMenu.value = false
  showRenameDialog.value = false
  showSaveDialog.value = true
}

function openRenameDialog() {
  if (!activeQuery.value) return
  renameDialogName.value = activeQuery.value.name
  saveError.value = null
  showSaveMenu.value = false
  showSaveDialog.value = false
  showRenameDialog.value = true
}

async function renameActiveQuery() {
  if (!activeQuery.value || !projectId.value || !renameDialogName.value.trim()) return
  isSaving.value = true
  saveError.value = null
  try {
    const updated = await analyticsStore.updateSavedFunnelQuery(projectId.value, activeQuery.value.id, {
      name: renameDialogName.value.trim(),
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
    showRenameDialog.value = false
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to rename query'
  } finally {
    isSaving.value = false
  }
}

async function toggleShareActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  isSaving.value = true
  saveError.value = null
  showSaveMenu.value = false
  try {
    const updated = await analyticsStore.updateSavedFunnelQuery(projectId.value, activeQuery.value.id, {
      isShared: !activeQuery.value.isShared,
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to update query'
  } finally {
    isSaving.value = false
  }
}

async function saveAsNew() {
  if (!projectId.value || !saveDialogName.value.trim()) return
  isSaving.value = true
  saveError.value = null
  try {
    const created = await analyticsStore.createSavedFunnelQuery(projectId.value, {
      name: saveDialogName.value.trim(),
      query: buildFunnelQuery(),
      isShared: saveDialogShared.value,
    })
    activeQuery.value = created
    showSaveDialog.value = false
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to save query'
  } finally {
    isSaving.value = false
  }
}

async function updateActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  isSaving.value = true
  saveError.value = null
  try {
    const updated = await analyticsStore.updateSavedFunnelQuery(projectId.value, activeQuery.value.id, {
      query: buildFunnelQuery(),
      version: activeQuery.value.version,
    })
    activeQuery.value = updated
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to update query'
  } finally {
    isSaving.value = false
  }
}

async function deleteActiveQuery() {
  if (!activeQuery.value || !projectId.value) return
  if (!confirm(`Delete saved query "${activeQuery.value.name}"?`)) return
  isSaving.value = true
  saveError.value = null
  try {
    await analyticsStore.deleteSavedFunnelQuery(projectId.value, activeQuery.value.id, activeQuery.value.version)
    activeQuery.value = null
    showSaveMenu.value = false
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to delete query'
  } finally {
    isSaving.value = false
  }
}

function handleDocumentMousedown(e: MouseEvent) {
  const target = e.target as Node
  if (showTimeRangePicker.value && timeRangePickerRef.value && !timeRangePickerRef.value.contains(target)) {
    showTimeRangePicker.value = false
  }
  if (showQuerySelector.value && querySelectorRef.value && !querySelectorRef.value.contains(target)) {
    showQuerySelector.value = false
  }
  if (showSaveMenu.value && saveMenuRef.value && !saveMenuRef.value.contains(target)) {
    showSaveMenu.value = false
  }
  if ((showSaveDialog.value || showRenameDialog.value) && saveDialogRef.value && !saveDialogRef.value.contains(target)) {
    showSaveDialog.value = false
    showRenameDialog.value = false
  }
}

async function loadProjectData(id: string) {
  await Promise.all([
    analyticsStore.fetchSavedFunnelQueries(id),
    stagesStore.fetchAll(id, { limit: 500 }),
    globalActionsStore.fetchAll(id, { limit: 500 }),
    projectsStore.fetchById(id),
    toolsStore.fetchAll(id, { limit: 500 }),
  ])
}

onMounted(async () => {
  if (projectId.value) {
    await loadProjectData(projectId.value)
  }
  document.addEventListener('mousedown', handleDocumentMousedown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown)
})

watch(projectId, async (newId) => {
  if (newId) {
    activeQuery.value = null
    analyticsStore.clearFunnelResult()
    await loadProjectData(newId)
  }
})

const result = computed(() => analyticsStore.funnelResult)

const stageOptions = computed(() => stagesStore.items.map(s => s.name))

const actionGroups = computed(() => {
  const globals = globalActionsStore.items.map(a => a.name)
  const byStage = stagesStore.items
    .filter(s => Object.keys(s.actions).length > 0)
    .map(s => ({
      stageName: s.name,
      actions: Object.values(s.actions).map(a => ({
        label: a.name,
        value: a.name,
      })),
    }))
  return { globals, byStage }
})

const variableGroups = computed(() =>
  stagesStore.items
    .filter(s => s.variableDescriptors.length > 0)
    .map(s => ({
      stageName: s.name,
      variables: s.variableDescriptors.map(d => d.name),
    }))
)

const userProfileVariables = computed(() =>
  projectsStore.currentItem?.userProfileVariableDescriptors?.map(d => d.name) ?? []
)

const toolOptions = computed(() => toolsStore.items.map(t => t.name))
</script>

<template>
  <!-- Config box -->
  <div class="bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-6">

    <!-- Header: query selector + save -->
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">

      <!-- Query selector -->
      <div ref="querySelectorRef" class="relative items-center hidden sm:flex gap-2 flex-1 min-w-0">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Query</span>
        <button
          @click="showQuerySelector = !showQuerySelector"
          :disabled="!projectId"
          :class="[
            'btn-secondary text-sm py-2 px-3 gap-2 min-w-40 w-full justify-start',
            activeQuery
              ? 'border-violet-400 text-violet-700 dark:border-violet-500 dark:text-violet-300'
              : 'text-gray-500 dark:text-gray-400',
          ]"
        >
          <BookmarkCheck v-if="activeQuery" class="w-4 h-4 shrink-0" />
          <Bookmark v-else class="w-4 h-4 shrink-0" />
          <span class="truncate flex-1 text-left">{{ activeQuery?.name ?? 'New query' }}</span>
          <ChevronDown class="w-3.5 h-3.5 shrink-0 ml-1 opacity-60" />
        </button>

        <div
          v-if="showQuerySelector"
          class="absolute left-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-55 max-h-72 overflow-y-auto"
        >
          <button
            @click="clearActiveQuery"
            class="w-full text-left text-sm px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            :class="{ 'bg-gray-50 dark:bg-gray-700/60': !activeQuery }"
          >
            <Bookmark class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="italic text-gray-400 dark:text-gray-500">New query</span>
            <Check v-if="!activeQuery" class="w-3.5 h-3.5 text-violet-500 ml-auto shrink-0" />
          </button>

          <template v-if="analyticsStore.savedFunnelQueries.length > 0">
            <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button
              v-for="q in analyticsStore.savedFunnelQueries"
              :key="q.id"
              @click="loadQuery(q)"
              class="w-full text-left text-sm px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              :class="{ 'bg-violet-50 dark:bg-violet-900/20': q.id === activeQuery?.id }"
            >
              <BookmarkCheck v-if="q.id === activeQuery?.id" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <Bookmark v-else class="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span class="flex-1 truncate">{{ q.name }}</span>
              <span v-if="q.isShared" class="text-xs text-gray-400 dark:text-gray-500 shrink-0">shared</span>
              <Check v-if="q.id === activeQuery?.id" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
            </button>
          </template>
          <div v-else-if="!analyticsStore.isLoadingSavedFunnelQueries" class="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500">
            No saved queries yet
          </div>

          <div class="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
            <button
              @click="analyticsStore.fetchSavedFunnelQueries(projectId); showQuerySelector = false"
              class="w-full text-left text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5"
              :disabled="analyticsStore.isLoadingSavedFunnelQueries"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': analyticsStore.isLoadingSavedFunnelQueries }" />
              {{ analyticsStore.isLoadingSavedFunnelQueries ? 'Refreshing…' : 'Refresh list' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Save area -->
      <div ref="saveDialogRef" class="relative flex items-center">

        <button
          v-if="!activeQuery || !canEditSavedFunnelQuery(activeQuery)"
          @click="openSaveDialog"
          class="btn-alt py-2! px-3! text-sm gap-1.5"
          :disabled="!projectId || isSaving"
        >
          <Bookmark class="w-3.5 h-3.5" />
          Save as…
        </button>

        <template v-else>
          <div class="flex">
            <button
              @click="updateActiveQuery"
              class="btn-alt-hardright py-2! px-3! text-sm"
              :disabled="isSaving"
              title="Overwrite this saved query with current settings"
            >
              {{ isSaving ? 'Saving…' : 'Save' }}
            </button>
            <div ref="saveMenuRef" class="relative flex">
              <button
                @click="showSaveDialog = false; showSaveMenu = !showSaveMenu"
                class="btn-alt-hardleft py-2! px-2! text-sm border-l border-violet-500 dark:border-violet-600"
                :disabled="isSaving"
                title="More options"
              >
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
              <div
                v-if="showSaveMenu"
                class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-47.5"
              >
                <button @click="openSaveDialog" class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Save as new copy…
                </button>
                <button @click="openRenameDialog" class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Rename…
                </button>
                <button
                  @click="toggleShareActiveQuery"
                  class="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  :disabled="isSaving"
                >
                  {{ activeQuery?.isShared ? 'Unshare' : 'Share with project' }}
                </button>
                <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  @click="deleteActiveQuery(); showSaveMenu = false"
                  class="w-full text-left text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  :disabled="isSaving"
                >
                  Delete this query
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Rename popover -->
        <div
          v-if="showRenameDialog"
          class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-70"
        >
          <div class="mb-3">
            <label class="form-label text-xs mb-1">New name</label>
            <input
              v-model="renameDialogName"
              type="text"
              class="form-input text-sm w-full"
              placeholder="Query name…"
              maxlength="255"
              @keydown.enter="renameActiveQuery"
              autofocus
            />
          </div>
          <div v-if="saveError" class="text-xs text-red-500 dark:text-red-400 mb-2">{{ saveError }}</div>
          <div class="flex justify-end gap-2">
            <button @click="showRenameDialog = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
            <button
              @click="renameActiveQuery"
              class="btn-primary text-xs py-1 px-2"
              :disabled="!renameDialogName.trim() || isSaving"
            >
              {{ isSaving ? 'Saving…' : 'Rename' }}
            </button>
          </div>
        </div>

        <!-- Save-as popover -->
        <div
          v-if="showSaveDialog"
          class="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-70"
        >
          <div class="mb-2">
            <label class="form-label text-xs mb-1">Name</label>
            <input
              v-model="saveDialogName"
              type="text"
              class="form-input text-sm w-full"
              placeholder="My funnel…"
              maxlength="255"
              @keydown.enter="saveAsNew"
              autofocus
            />
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input id="funnel-save-shared" v-model="saveDialogShared" type="checkbox" class="form-checkbox" />
            <label for="funnel-save-shared" class="text-sm text-gray-700 dark:text-gray-300">Share with all project operators</label>
          </div>
          <div v-if="saveError" class="text-xs text-red-500 dark:text-red-400 mb-2">{{ saveError }}</div>
          <div class="flex justify-end gap-2">
            <button @click="showSaveDialog = false" class="btn-secondary text-xs py-1 px-2">Cancel</button>
            <button
              @click="saveAsNew"
              class="btn-primary text-xs py-1 px-2"
              :disabled="!saveDialogName.trim() || isSaving"
            >
              {{ isSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Config body -->
    <div class="p-4 space-y-4">

      <!-- Time range + Run -->
      <div class="flex flex-wrap items-center gap-3">
        <div ref="timeRangePickerRef" class="relative">
          <button
            @click="showTimeRangePicker = !showTimeRangePicker"
            class="btn-secondary text-sm py-2! px-3! gap-2"
          >
            <CalendarDays class="w-4 h-4 shrink-0" />
            <span>{{ timeRangeLabel }}</span>
            <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
          </button>

          <div
            v-if="showTimeRangePicker"
            class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-75"
          >
            <div class="flex gap-1 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <button
                v-for="tab in [{ mode: 'relative', label: 'Relative' }, { mode: 'absolute', label: 'Absolute' }]"
                :key="tab.mode"
                @click="switchTimeRangeMode(tab.mode as TimeRangeMode)"
                class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                :class="timeRangeMode === tab.mode
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
              >{{ tab.label }}</button>
            </div>

            <template v-if="timeRangeMode === 'relative'">
              <div class="flex flex-wrap gap-1 mb-3">
                <button
                  v-for="p in relativePresets"
                  :key="p.label"
                  @click="setRelativePreset(p)"
                  class="text-xs px-2 py-1 rounded border transition-colors"
                  :class="relativeTimeAmount === p.amount && relativeTimeUnit === p.unit
                    ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:border-violet-500 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-400'"
                >{{ p.label }}</button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">Last</span>
                <input
                  v-model.number="relativeTimeAmount"
                  type="number"
                  min="1"
                  max="100000"
                  class="w-20 shrink-0 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-primary-400"
                />
                <select v-model="relativeTimeUnit" class="form-select-auto text-sm py-1.5! min-w-25">
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </select>
              </div>
            </template>

            <template v-else>
              <div class="space-y-2">
                <div>
                  <label class="form-label text-xs mb-1">From</label>
                  <input v-model="absoluteFrom" type="datetime-local" class="form-input text-sm w-full" />
                </div>
                <div>
                  <label class="form-label text-xs mb-1">To</label>
                  <input v-model="absoluteTo" type="datetime-local" class="form-input text-sm w-full" />
                </div>
              </div>
            </template>

            <div class="flex justify-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button @click="showTimeRangePicker = false" class="btn-secondary text-xs py-1 px-2">Done</button>
            </div>
          </div>
        </div>

        <button
          @click="runFunnel"
          class="btn-primary flex items-center gap-2 py-2!"
          :disabled="analyticsStore.isLoadingFunnel || !canRun"
        >
          <Play class="w-3.5 h-3.5" />
          {{ analyticsStore.isLoadingFunnel ? 'Running…' : 'Run' }}
        </button>
      </div>

      <!-- Funnel steps -->
      <div>
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Funnel Steps</span>

        <div class="space-y-2">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex items-center gap-2"
          >
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 w-5 text-right shrink-0 select-none">
              {{ index + 1 }}
            </span>

            <select
              :value="step.eventType"
              @change="onEventTypeChange(index, ($event.target as HTMLSelectElement).value as FunnelEventType)"
              class="form-select-auto py-2! text-sm shrink-0"
            >
              <option v-for="(label, type) in EVENT_TYPE_LABELS" :key="type" :value="type">
                {{ label }}
              </option>
            </select>

            <template v-if="step.eventType === 'enter_stage'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                :items="stageOptions"
                align="left"
                maxHeight="280px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
                @select="step.params.stageName = $event"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.stageName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.stageName || 'Select stage…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #item="{ item }">{{ item }}</template>
              </FloatingDropdown>
            </template>

            <template v-else-if="step.eventType === 'end_stage'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                :items="stageOptions"
                align="left"
                maxHeight="280px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
                @select="step.params.stageName = $event"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.stageName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.stageName || 'Select stage…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #item="{ item }">{{ item }}</template>
              </FloatingDropdown>
              <input v-model="step.params.reason" type="text" class="form-input text-sm flex-1" placeholder="Reason (optional)" />
            </template>

            <template v-else-if="step.eventType === 'action_fire'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                align="left"
                maxHeight="320px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.actionName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.actionName || 'Select action…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #default="{ close }">
                  <div v-if="actionGroups.globals.length > 0">
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Global</div>
                    <button
                      v-for="name in actionGroups.globals"
                      :key="name"
                      type="button"
                      @click="step.params.actionName = name; close()"
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >{{ name }}</button>
                  </div>
                  <template v-if="actionGroups.byStage.length > 0">
                    <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
                    <template v-for="group in actionGroups.byStage" :key="group.stageName">
                      <div class="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ group.stageName }}</div>
                      <button
                        v-for="action in group.actions"
                        :key="action.value"
                        type="button"
                        @click="step.params.actionName = action.value; close()"
                        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >{{ action.label }}</button>
                    </template>
                  </template>
                  <div v-if="actionGroups.globals.length === 0 && actionGroups.byStage.length === 0" class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                    No actions available
                  </div>
                </template>
              </FloatingDropdown>
            </template>

            <template v-else-if="step.eventType === 'variable_changed'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                align="left"
                maxHeight="320px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.variableName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.variableName || 'Select variable…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #default="{ close }">
                  <template v-if="variableGroups.length > 0">
                    <template v-for="(group, gi) in variableGroups" :key="group.stageName">
                      <div v-if="gi > 0" class="border-t border-gray-100 dark:border-gray-700 my-1" />
                      <div class="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ group.stageName }}</div>
                      <button
                        v-for="variable in group.variables"
                        :key="variable"
                        type="button"
                        @click="step.params.variableName = variable; close()"
                        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >{{ variable }}</button>
                    </template>
                  </template>
                  <div v-else class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No variables available</div>
                </template>
              </FloatingDropdown>
              <input v-model="step.params.value" type="text" class="form-input text-sm flex-1" placeholder="Value (optional)" />
            </template>

            <template v-else-if="step.eventType === 'user_profile_changed'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                align="left"
                maxHeight="280px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.profileName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.profileName || 'Select profile attribute…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #default="{ close }">
                  <template v-if="userProfileVariables.length > 0">
                    <button
                      v-for="variable in userProfileVariables"
                      :key="variable"
                      type="button"
                      @click="step.params.profileName = variable; close()"
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >{{ variable }}</button>
                  </template>
                  <div v-else class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No profile attributes available</div>
                </template>
              </FloatingDropdown>
              <input v-model="step.params.value" type="text" class="form-input text-sm flex-1" placeholder="Value (optional)" />
            </template>

            <template v-else-if="step.eventType === 'session_started'">
              <input
                v-model="step.params.minSessions"
                type="number"
                min="1"
                class="form-input text-sm"
                placeholder="Min. sessions"
              />
            </template>

            <template v-else-if="step.eventType === 'tool_response'">
              <FloatingDropdown
                class="flex-1 min-w-0"
                :items="toolOptions"
                align="left"
                maxHeight="280px"
                triggerClass="btn-secondary text-sm py-2! px-3! gap-2 w-full justify-start min-w-0"
                @select="step.params.toolName = $event"
              >
                <template #trigger>
                  <span class="flex-1 text-left truncate" :class="step.params.toolName ? '' : 'text-gray-400 dark:text-gray-500'">
                    {{ step.params.toolName || 'Select tool…' }}
                  </span>
                  <ChevronDown class="w-3.5 h-3.5 opacity-60 shrink-0" />
                </template>
                <template #item="{ item }">{{ item }}</template>
              </FloatingDropdown>
              <input v-model="step.params.value" type="text" class="form-input text-sm flex-1" placeholder="Response (required)" />
            </template>

            <button
              @click="removeStep(index)"
              class="btn-icon shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              :disabled="steps.length <= 1"
              title="Remove step"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          @click="addStep"
          class="mt-3 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="steps.length >= 15"
        >
          <Plus class="w-4 h-4" />
          Add Funnel Step
        </button>
      </div>
    </div>
  </div>

  <!-- Error -->
  <div v-if="analyticsStore.funnelError" class="error-state mb-6">
    {{ analyticsStore.funnelError }}
  </div>

  <!-- Loading -->
  <div v-if="analyticsStore.isLoadingFunnel" class="loading-state">
    Running funnel query…
  </div>

  <!-- Idle -->
  <div v-else-if="!result" class="empty-state">
    <p class="empty-state-title">No data yet</p>
    <p>Define at least 2 steps and click <span class="font-semibold">Run</span> to analyse your funnel.</p>
  </div>

  <!-- Results -->
  <template v-else>
    <hr class="border-gray-200 dark:border-gray-700 mb-5" />

    <!-- Summary stats -->
    <div class="flex items-start gap-8 mb-6">
      <div>
        <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {{ result.totalConversionRate.toFixed(1) }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total conversion rate</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {{ result.usersAtStart.toLocaleString() }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Users at Start (Step 1)</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {{ result.usersAtEnd.toLocaleString() }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Users at End (Last Step)</div>
      </div>
    </div>

    <!-- No users at step 1 -->
    <div v-if="result.usersAtStart === 0" class="empty-state">
      <p class="empty-state-title">No users matched the first step</p>
      <p>Try adjusting the first step's parameters or widening the time range.</p>
    </div>

    <template v-else>
      <FunnelChart :result="result" />

      <!-- Step detail table -->
      <div class="table-container mt-4">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell w-12">#</th>
                <th class="table-header-cell">Event</th>
                <th class="table-header-cell-right">Users</th>
                <th class="table-header-cell-right">% of Step 1</th>
                <th class="table-header-cell-right">Drop-off</th>
                <th class="table-header-cell-right">Drop-off %</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="step in result.steps" :key="step.stepNumber" class="table-row">
                <td class="table-cell-muted">{{ step.stepNumber }}</td>
                <td class="table-cell font-medium">{{ step.label }}</td>
                <td class="table-cell-mono text-right">{{ step.userCount.toLocaleString() }}</td>
                <td
                  class="table-cell-right font-semibold"
                  :class="step.stepNumber === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'"
                >
                  {{ step.percentage.toFixed(1) }}%
                </td>
                <td class="table-cell-mono text-right text-gray-500 dark:text-gray-400">
                  {{ step.stepNumber === 1 ? '—' : step.dropoffCount.toLocaleString() }}
                </td>
                <td class="table-cell-right text-gray-500 dark:text-gray-400">
                  {{ step.stepNumber === 1 ? '—' : `${step.dropoffPercentage.toFixed(1)}%` }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </template>
</template>
