<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Plus, X, Save, Check, Trash2, Route, Drama, AlertTriangle } from 'lucide-vue-next'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import MultiSelectCell from '@/components/MultiSelectCell.vue'
import {
  useSampleCopiesStore,
  useCopyDecoratorsStore,
  useStagesStore,
  useAgentsStore,
  useProjectSelectionStore,
  useProjectsStore,
  useClassifiersStore,
} from '@/stores'
import type { CreateSampleCopyRequest, SampleCopyResponse } from '@/api/types'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useSpreadsheetBehavior } from '@/composables/useSpreadsheetBehavior'

const vAutosize = {
  mounted(el: HTMLTextAreaElement) {
    el.style.overflow = 'hidden'
    el.style.resize = 'none'
    const resize = () => {
      el.style.height = 'auto'
      if (el.scrollHeight > 0) el.style.height = el.scrollHeight + 'px'
    }
    ;(el as any)._autosizeResize = resize
    resize()
    el.addEventListener('input', resize)
  },
  updated(el: HTMLTextAreaElement) {
    ;(el as any)._autosizeResize?.()
  },
}

const sampleCopiesStore = useSampleCopiesStore()
const copyDecoratorsStore = useCopyDecoratorsStore()
const stagesStore = useStagesStore()
const agentsStore = useAgentsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()
const classifiersStore = useClassifiersStore()
const { isReadOnly } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const activeTab = ref<'copies' | 'settings'>('copies')

const currentProject = ref<any>(null)
const settingsLoading = ref(false)
const settingsError = ref<string | null>(null)
const showSettingsSuccess = ref(false)
const defaultSampleCopyClassifierId = ref<string>('')

const tabs: TabDefinition[] = [
  { key: 'copies', label: 'Sample Copies' },
  { key: 'settings', label: 'Copy Decorators' },
]

// Filters
const searchQuery = ref('')
const filterStageId = ref('')
const filterAgentId = ref('')
const filterDecoratorId = ref('')

// Row state
interface RowState {
  tempId: string
  id: string | null
  name: string
  stages: string[]
  agents: string[]
  promptTrigger: string
  content: string[]
  amount: number
  samplingMethod: 'random' | 'round_robin'
  mode: 'regular' | 'forced'
  decoratorId: string | null
  classifierOverrideId: string | null
  version: number
  isDirty: boolean
  isSaving: boolean
  saveError: string | null
}

interface DecoratorRowState {
  tempId: string
  id: string | null
  name: string
  template: string
  version: number
  isDirty: boolean
  isSaving: boolean
}

const rows = ref<RowState[]>([])
const decoratorRows = ref<DecoratorRowState[]>([])
const isSavingAll = ref(false)
const showSaveAllSuccess = ref(false)
const saveAllError = ref<string | null>(null)
const isSavingAllDecorators = ref(false)
const showSaveAllDecoratorSuccess = ref(false)

const dirtyRowCount = computed(() => rows.value.filter(r => r.isDirty).length)
const dirtyDecoratorCount = computed(() => decoratorRows.value.filter(d => d.isDirty).length)
const showClassifierWarning = computed(() =>
  !defaultSampleCopyClassifierId.value && rows.value.filter(r => r.id !== null).length > 0
)

function makeRowState(item: SampleCopyResponse): RowState {
  return {
    tempId: item.id,
    id: item.id,
    name: item.name,
    stages: item.stages ? [...item.stages] : [],
    agents: item.agents ? [...item.agents] : [],
    promptTrigger: item.promptTrigger,
    content: [...item.content],
    amount: item.amount,
    samplingMethod: item.samplingMethod,
    mode: item.mode,
    decoratorId: item.decoratorId,
    classifierOverrideId: item.classifierOverrideId,
    version: item.version,
    isDirty: false,
    isSaving: false,
    saveError: null,
  }
}

function makeNewRow(): RowState {
  return {
    tempId: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    id: null,
    name: '',
    stages: [],
    agents: [],
    promptTrigger: '',
    content: [''],
    amount: 1,
    samplingMethod: 'random',
    mode: 'regular',
    decoratorId: null,
    classifierOverrideId: null,
    version: 0,
    isDirty: true,
    isSaving: false,
    saveError: null,
  }
}

function makeDecoratorRowState(item: { id: string; name: string; template: string; version: number }): DecoratorRowState {
  return {
    tempId: item.id,
    id: item.id,
    name: item.name,
    template: item.template,
    version: item.version,
    isDirty: false,
    isSaving: false,
  }
}

async function loadData() {
  if (!projectId.value) return
  await Promise.all([
    sampleCopiesStore.fetchAll(projectId.value, { limit: 500 }),
    stagesStore.fetchAll(projectId.value),
    agentsStore.fetchAll(projectId.value),
    copyDecoratorsStore.fetchAll(projectId.value),
    loadProjectSettings(),
  ])
  rows.value = sampleCopiesStore.items.map(makeRowState)
  decoratorRows.value = copyDecoratorsStore.items.map(makeDecoratorRowState)
}

async function loadProjectSettings() {
  if (!projectId.value) return
  try {
    await classifiersStore.fetchAll(projectId.value)
    currentProject.value = await projectsStore.fetchById(projectId.value)
    defaultSampleCopyClassifierId.value = currentProject.value?.sampleCopyConfig?.defaultClassifierId || ''
  } catch (err: any) {
    settingsError.value = err.response?.data?.message || 'Failed to load project settings'
  }
}

async function saveProjectSettings() {
  if (!currentProject.value) return
  settingsLoading.value = true
  settingsError.value = null
  try {
    const updated = await projectsStore.update(currentProject.value.id, {
      version: currentProject.value.version,
      sampleCopyConfig: defaultSampleCopyClassifierId.value
        ? { defaultClassifierId: defaultSampleCopyClassifierId.value }
        : null,
    })
    currentProject.value = updated
    showSettingsSuccess.value = true
    setTimeout(() => { showSettingsSuccess.value = false }, 3000)
  } catch (err: any) {
    settingsError.value = err.response?.data?.message || 'Failed to save project settings'
  } finally {
    settingsLoading.value = false
  }
}

onMounted(loadData)

watch(projectId, () => {
  rows.value = []
  decoratorRows.value = []
  loadData()
})

watch(activeTab, () => {
  nextTick(() => {
    document.querySelectorAll<HTMLTextAreaElement>('textarea.spreadsheet-input').forEach(el => {
      ;(el as any)._autosizeResize?.()
    })
  })
})

// Filtering
const filteredRows = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return rows.value.filter(row => {
    if (q && !row.name.toLowerCase().includes(q) && !row.promptTrigger.toLowerCase().includes(q)) return false
    if (filterStageId.value && !row.stages.includes(filterStageId.value)) return false
    if (filterAgentId.value && !row.agents.includes(filterAgentId.value)) return false
    if (filterDecoratorId.value === '__none__' && row.decoratorId !== null) return false
    if (filterDecoratorId.value === '__enforce__' && row.mode !== 'forced') return false
    if (filterDecoratorId.value && filterDecoratorId.value !== '__none__' && filterDecoratorId.value !== '__enforce__' && row.decoratorId !== filterDecoratorId.value) return false
    return true
  })
})

const hasFilters = computed(() =>
  !!searchQuery.value || !!filterStageId.value || !!filterAgentId.value || !!filterDecoratorId.value
)

function clearFilters() {
  searchQuery.value = ''
  filterStageId.value = ''
  filterAgentId.value = ''
  filterDecoratorId.value = ''
}

function addRow() {
  rows.value.unshift(makeNewRow())
}

function markDirty(row: RowState) {
  row.isDirty = true
  row.saveError = null
}

async function saveRow(row: RowState) {
  if (!projectId.value || row.isSaving || !row.isDirty) return
  row.isSaving = true
  row.saveError = null
  try {
    if (row.id === null) {
      const req: CreateSampleCopyRequest = {
        name: row.name,
        stages: row.stages.length > 0 ? row.stages : undefined,
        agents: row.agents.length > 0 ? row.agents : undefined,
        promptTrigger: row.promptTrigger,
        content: row.content.filter(c => c.trim()),
        amount: row.amount,
        samplingMethod: row.samplingMethod,
        mode: row.mode,
        classifierOverrideId: row.classifierOverrideId || null,
        decoratorId: row.decoratorId,
      }
      const result = await sampleCopiesStore.create(projectId.value, req)
      row.id = result.id
      row.version = result.version
      row.tempId = result.id
    } else {
      const result = await sampleCopiesStore.update(projectId.value, row.id, {
        name: row.name,
        stages: row.stages.length > 0 ? row.stages : null,
        agents: row.agents.length > 0 ? row.agents : null,
        promptTrigger: row.promptTrigger,
        content: row.content.filter(c => c.trim()),
        amount: row.amount,
        samplingMethod: row.samplingMethod,
        mode: row.mode,
        classifierOverrideId: row.classifierOverrideId || null,
        decoratorId: row.decoratorId,
        version: row.version,
      })
      row.version = result.version
    }
    row.isDirty = false
  } catch (err: any) {
    row.saveError = err.response?.data?.message || 'Save failed'
  } finally {
    row.isSaving = false
  }
}

async function deleteRow(row: RowState) {
  if (row.id === null) {
    rows.value = rows.value.filter(r => r !== row)
    return
  }
  if (!confirm(`Delete "${row.name}"?`)) return
  try {
    await sampleCopiesStore.remove(projectId.value, row.id, row.version)
    rows.value = rows.value.filter(r => r !== row)
  } catch {
    // error state managed by store
  }
}

async function saveAllRows() {
  const dirty = rows.value.filter(r => r.isDirty && !r.isSaving)
  if (dirty.length === 0) return
  isSavingAll.value = true
  saveAllError.value = null
  await Promise.all(dirty.map(row => saveRow(row)))
  isSavingAll.value = false
  if (dirty.every(r => !r.saveError)) {
    showSaveAllSuccess.value = true
    setTimeout(() => { showSaveAllSuccess.value = false }, 2000)
  }
}

async function saveAllDecoratorRows() {
  const dirty = decoratorRows.value.filter(d => d.isDirty && !d.isSaving)
  if (dirty.length === 0) return
  isSavingAllDecorators.value = true
  await Promise.all(dirty.map(dr => saveDecoratorRow(dr)))
  isSavingAllDecorators.value = false
  showSaveAllDecoratorSuccess.value = true
  setTimeout(() => { showSaveAllDecoratorSuccess.value = false }, 2000)
}

function onDecoratorChange(row: RowState, value: string) {
  if (value === '__enforce__') {
    row.decoratorId = null
    row.mode = 'forced'
    row.amount = 1
  } else {
    row.decoratorId = value || null
    row.mode = 'regular'
  }
  markDirty(row)
}

// Stage / agent option lists for MultiSelectCell
const stageOptions = computed(() =>
  stagesStore.items.map(s => ({ id: s.id, name: s.name }))
)
const agentOptions = computed(() =>
  agentsStore.items.map(a => ({ id: a.id, name: a.name }))
)

function addContent(row: RowState) {
  row.content = [...row.content, '']
  markDirty(row)
}

function removeContent(row: RowState, idx: number) {
  row.content = row.content.filter((_, i) => i !== idx)
  markDirty(row)
}

function onContentKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const ta = e.target as HTMLTextAreaElement
  const container = ta.closest('[data-content-cell]')
  if (!container) return
  const textareas = Array.from(container.querySelectorAll<HTMLTextAreaElement>('textarea'))
  const i = textareas.indexOf(ta)
  if (i === -1) return

  if (e.key === 'ArrowDown') {
    const lineCount = ta.value.split('\n').length
    const cursorLine = ta.value.substring(0, ta.selectionEnd).split('\n').length
    if (cursorLine < lineCount) return // cursor not on last line — let browser move it
    if (i >= textareas.length - 1) return // last textarea — let table handler move row
    e.preventDefault()
    e.stopPropagation()
    const next = textareas[i + 1]!
    next.focus()
    next.setSelectionRange(0, 0)
  } else {
    const cursorLine = ta.value.substring(0, ta.selectionStart).split('\n').length
    if (cursorLine > 1) return // cursor not on first line
    if (i <= 0) return // first textarea — let table handler move row
    e.preventDefault()
    e.stopPropagation()
    const prev = textareas[i - 1]!
    prev.focus()
    prev.setSelectionRange(prev.value.length, prev.value.length)
  }
}

// Decorator management
function addDecoratorRow() {
  decoratorRows.value.unshift({
    tempId: `dec_new_${Date.now()}`,
    id: null,
    name: '',
    template: '',
    version: 0,
    isDirty: true,
    isSaving: false,
  })
}

async function saveDecoratorRow(dr: DecoratorRowState) {
  if (!projectId.value || dr.isSaving) return
  dr.isSaving = true
  try {
    if (!dr.id) {
      const result = await copyDecoratorsStore.create(projectId.value, {
        name: dr.name,
        template: dr.template,
      })
      dr.id = result.id
      dr.version = result.version
    } else {
      const result = await copyDecoratorsStore.update(projectId.value, dr.id, {
        name: dr.name,
        template: dr.template,
        version: dr.version,
      })
      dr.version = result.version
    }
    dr.isDirty = false
  } catch {
    // error state managed by store
  } finally {
    dr.isSaving = false
  }
}

async function deleteDecoratorRow(dr: DecoratorRowState) {
  if (!dr.id) {
    decoratorRows.value = decoratorRows.value.filter(r => r !== dr)
    return
  }
  if (!confirm(`Delete decorator "${dr.name}"?`)) return
  try {
    await copyDecoratorsStore.remove(projectId.value, dr.id, dr.version)
    decoratorRows.value = decoratorRows.value.filter(r => r !== dr)
  } catch {
    // error state managed by store
  }
}

// Column widths in px: [Name, Stages, Agents, WhenToOccur, SampleContent, Amt, Dist, Decor]
const DEFAULT_COL_WIDTHS = [144, 128, 128, 208, 200, 56, 112, 112]
const MIN_COL_WIDTH = 48

function colWidthsKey(pid: string) {
  return `sample-copies:col-widths:${pid}`
}

function loadColWidths(pid: string): number[] {
  try {
    const raw = localStorage.getItem(colWidthsKey(pid))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === DEFAULT_COL_WIDTHS.length && parsed.every(Number.isFinite))
        return parsed
    }
  } catch { /* ignore */ }
  return [...DEFAULT_COL_WIDTHS]
}

function saveColWidths(pid: string, widths: number[]) {
  try {
    localStorage.setItem(colWidthsKey(pid), JSON.stringify(widths))
  } catch { /* ignore */ }
}

const colWidths = ref<number[]>(loadColWidths(projectId.value))

watch(projectId, (pid) => {
  colWidths.value = loadColWidths(pid)
})

const tableWidth = computed(() => colWidths.value.reduce((a, b) => a + b, 0) + 64)

function startResize(e: MouseEvent, colIdx: number) {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = colWidths.value[colIdx]!
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'

  function onMove(ev: MouseEvent) {
    colWidths.value[colIdx] = Math.max(MIN_COL_WIDTH, startWidth + ev.clientX - startX)
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    saveColWidths(projectId.value, colWidths.value)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Spreadsheet behaviour — 8 focusable columns (0=name, 1=stages, 2=agents, 3=trigger,
// 4=content, 5=amount, 6=method, 7=decorator)
const { activeRowIdx, onTableKeydown, buildRowHandlers } = useSpreadsheetBehavior({
  columnCount: 8,
  getRowCount: () => filteredRows.value.length,
})
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sample Copy</h1>
        <p class="page-subtitle">Manage and inject sample dialogues and system prompt injections.</p>
      </div>
    </div>

    <!-- Rounded panel -->
    <div class="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">
      <div class="bg-white dark:bg-gray-800">
        <div class="mx-auto">

          <!-- Tabs -->
          <div class="tabs-container">
            <TabNavigator v-model="activeTab" :tabs="tabs" />
          </div>

          <!-- Sample Copies Tab -->
          <div v-show="activeTab === 'copies'" class="tab-content">

            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Sample Copies</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Sample copies are pre-written agent responses that are injected into the conversation context based on a prompt trigger. They help keep responses consistent and on-brand. Use Enforce mode to make the agent reply with the sample copy verbatim instead of using it as context.
                </p>
              </div>
            </div>

            <!-- Sample Copy Classifier Setting -->
            <div class="mb-6">
              <div class="form-group">
                <label class="form-label">Sample Copy Classifier</label>
                <div class="flex items-center gap-3">
                  <select
                    v-model="defaultSampleCopyClassifierId"
                    class="form-select-auto min-w-64"
                    :disabled="isReadOnly || settingsLoading"
                  >
                    <option value="">None — trigger matching disabled</option>
                    <option v-for="classifier in classifiersStore.items" :key="classifier.id" :value="classifier.id">
                      {{ classifier.name }}
                    </option>
                  </select>
                  <button
                    v-if="!isReadOnly"
                    @click="saveProjectSettings"
                    class="btn-secondary shrink-0"
                    :disabled="settingsLoading || showSettingsSuccess"
                  >
                    <Check v-if="showSettingsSuccess" class="inline-block mr-2 w-4 h-4" />
                    <Save v-else class="inline-block mr-2 w-4 h-4" />
                    {{ showSettingsSuccess ? 'Saved!' : 'Save' }}
                  </button>
                  <span
                    v-if="showClassifierWarning"
                    class="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400"
                    title="Trigger matching is disabled — sample copies won't be automatically activated without a classifier."
                  >
                    <AlertTriangle class="w-4 h-4 shrink-0" />
                    Trigger matching disabled
                  </span>
                </div>
                <p class="form-help-text">The classifier used to evaluate sample copy prompt triggers. Individual sample copies can override this with a per-copy classifier.</p>
                <p v-if="settingsError" class="text-sm text-red-600 dark:text-red-400 mt-1">{{ settingsError }}</p>
              </div>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search rows..."
                  class="form-input pl-8 py-1.5 text-sm w-50"
                />
              </div>

              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters:</span>

              <select v-model="filterStageId" class="form-select-auto text-sm py-1.5">
                <option value="">All Stages</option>
                <option v-for="s in stagesStore.items" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>

              <select v-model="filterAgentId" class="form-select-auto text-sm py-1.5">
                <option value="">All Agents</option>
                <option v-for="a in agentsStore.items" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>

              <select v-model="filterDecoratorId" class="form-select-auto text-sm py-1.5">
                <option value="">All Types</option>
                <option value="__none__">Raw (no decorator)</option>
                <option value="__enforce__">Enforce</option>
                <option v-for="d in copyDecoratorsStore.items" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>

              <button
                v-if="hasFilters"
                @click="clearFilters"
                class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X class="w-3.5 h-3.5" />Clear
              </button>

              <div class="flex-1" />

              <button
                v-if="!isReadOnly"
                @click="saveAllRows"
                class="btn-primary h-9"
                :disabled="isSavingAll || dirtyRowCount === 0"
              >
                <Check v-if="showSaveAllSuccess" class="inline-block w-4 h-4 mr-1 text-green-500" />
                <span v-else-if="isSavingAll" class="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <Save v-else class="inline-block w-4 h-4 mr-1" />
                {{ showSaveAllSuccess ? 'Saved!' : `Save Changes${dirtyRowCount > 0 ? ` (${dirtyRowCount})` : ''}` }}
              </button>

              <button
                v-if="!isReadOnly"
                @click="saveAllRows"
                class="btn-primary h-9"
                :disabled="isSavingAll || dirtyRowCount === 0"
              >
                <Check v-if="showSaveAllSuccess" class="inline-block w-4 h-4 mr-1 text-green-500" />
                <span v-else-if="isSavingAll" class="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <Save v-else class="inline-block w-4 h-4 mr-1" />
                {{ showSaveAllSuccess ? 'Saved!' : `Save Changes${dirtyRowCount > 0 ? ` (${dirtyRowCount})` : ''}` }}
              </button>

              <button @click="addRow" class="btn-primary" :disabled="isReadOnly">
                <Plus class="inline-block w-4 h-4 mr-1" />
                Add Row
              </button>
            </div>

            <!-- Store error -->
            <div v-if="sampleCopiesStore.error" class="alert-error mb-4">{{ sampleCopiesStore.error }}</div>

            <!-- Loading -->
            <div v-if="sampleCopiesStore.isLoading && rows.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
              Loading...
            </div>

            <!-- Spreadsheet Table -->
            <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table
                class="text-sm border-collapse"
                :style="{ tableLayout: 'fixed', width: tableWidth + 'px' }"
                @keydown="onTableKeydown"
              >
                <colgroup>
                  <col v-for="(w, i) in colWidths" :key="i" :style="{ width: w + 'px' }" />
                  <col style="width: 64px" />
                </colgroup>
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name<div class="col-resize-handle" @mousedown="startResize($event, 0)" /></th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span class="flex items-center gap-1"><Route class="w-3.5 h-3.5" /> Stages</span>
                      <div class="col-resize-handle" @mousedown="startResize($event, 1)" />
                    </th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span class="flex items-center gap-1"><Drama class="w-3.5 h-3.5" /> Agents</span>
                      <div class="col-resize-handle" @mousedown="startResize($event, 2)" />
                    </th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">When to Occur<div class="col-resize-handle" @mousedown="startResize($event, 3)" /></th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sample Content<div class="col-resize-handle" @mousedown="startResize($event, 4)" /></th>
                    <th class="col-th text-center px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amt.<div class="col-resize-handle" @mousedown="startResize($event, 5)" /></th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Distribution<div class="col-resize-handle" @mousedown="startResize($event, 6)" /></th>
                    <th class="col-th text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type<div class="col-resize-handle" @mousedown="startResize($event, 7)" /></th>
                    <th></th>
                  </tr>
                </thead>

                <tbody v-if="filteredRows.length === 0">
                  <tr>
                    <td colspan="9" class="text-center py-16 text-gray-400 dark:text-gray-500">
                      <span v-if="hasFilters">No rows match the current filters.</span>
                      <span v-else>No sample copies yet. Click "+ Add Row" to get started.</span>
                    </td>
                  </tr>
                </tbody>

                <tbody v-else>
                  <tr
                    v-for="(row, rowIdx) in filteredRows"
                    :key="row.tempId"
                    :data-row="rowIdx"
                    v-bind="buildRowHandlers(rowIdx)"
                    class="border-b border-gray-100 dark:border-gray-700 last:border-0 align-middle group transition-colors"
                    :class="[
                      row.id === null
                        ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                        : row.isDirty
                          ? 'bg-amber-50/60 dark:bg-amber-900/15'
                          : activeRowIdx === rowIdx
                            ? 'bg-gray-50/60 dark:bg-gray-700/50'
                            : 'hover:bg-gray-50/60 dark:hover:bg-gray-700',
                      row.isSaving ? 'opacity-75' : '',
                    ]"
                  >
                    <!-- NAME -->
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <input
                        v-model="row.name"
                        @input="markDirty(row)"
                        type="text"
                        placeholder="name"
                        data-col="0"
                        class="spreadsheet-input font-mono font-medium"
                        :disabled="isReadOnly"
                      />
                    </td>

                    <!-- STAGES -->
                    <td class="px-1 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <MultiSelectCell
                        :model-value="row.stages"
                        :options="stageOptions"
                        placeholder="Any stage"
                        :readonly="isReadOnly"
                        :data-col="1"
                        @update:model-value="(v) => { row.stages = v; markDirty(row) }"
                      />
                    </td>

                    <!-- AGENTS -->
                    <td class="px-1 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <MultiSelectCell
                        :model-value="row.agents"
                        :options="agentOptions"
                        placeholder="Any agent"
                        :readonly="isReadOnly"
                        :data-col="2"
                        @update:model-value="(v) => { row.agents = v; markDirty(row) }"
                      />
                    </td>

                    <!-- TRIGGER -->
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <textarea
                        v-model="row.promptTrigger"
                        v-autosize
                        @input="markDirty(row)"
                        rows="1"
                        placeholder="When to activate..."
                        data-col="3"
                        class="spreadsheet-input"
                        :disabled="isReadOnly"
                      />
                    </td>

                    <!-- SAMPLE CONTENT -->
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <div class="space-y-1" data-content-cell>
                        <div
                          v-for="(_, idx) in row.content"
                          :key="idx"
                          class="flex items-center gap-1"
                        >
                          <span class="text-xs text-gray-400 dark:text-gray-500 font-mono select-none shrink-0">{{ idx + 1 }}.</span>
                          <textarea
                            v-model="row.content[idx]"
                            v-autosize
                            @input="markDirty(row)"
                            @keydown="onContentKeydown"
                            :data-col="idx === 0 ? 4 : undefined"
                            rows="1"
                            placeholder="Sample text..."
                            class="spreadsheet-input flex-1 min-w-0"
                            :disabled="isReadOnly"
                          />
                          <button
                            v-if="!isReadOnly && row.content.length > 1"
                            type="button"
                            tabindex="-1"
                            @click="removeContent(row, idx)"
                            class="shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                          ><X class="w-3 h-3" /></button>
                        </div>
                        <button
                          v-if="!isReadOnly"
                          type="button"
                          tabindex="-1"
                          @click="addContent(row)"
                          class="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors mt-0.5"
                        ><Plus class="w-3 h-3" /> Add</button>
                      </div>
                    </td>

                    <!-- AMT -->
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-700">
                      <input
                        v-model.number="row.amount"
                        @input="markDirty(row)"
                        type="number"
                        min="1"
                        data-col="5"
                        class="spreadsheet-input text-center w-full"
                        :disabled="isReadOnly || row.mode === 'forced'"
                      />
                    </td>

                    <!-- DIST -->
                    <td class="px-2 py-1.5">
                      <select
                        v-model="row.samplingMethod"
                        @change="markDirty(row)"
                        data-col="6"
                        class="spreadsheet-select w-full"
                        :disabled="isReadOnly"
                      >
                        <option value="random">Random</option>
                        <option value="round_robin">Round Robin</option>
                      </select>
                    </td>

                    <!-- DECORATOR -->
                    <td class="px-2 py-1.5">
                      <select
                        :value="row.mode === 'forced' ? '__enforce__' : (row.decoratorId ?? '')"
                        @change="onDecoratorChange(row, ($event.target as HTMLSelectElement).value)"
                        data-col="7"
                        class="spreadsheet-select w-full"
                        :disabled="isReadOnly"
                      >
                        <option value="">Raw</option>
                        <option value="__enforce__">Enforce</option>
                        <option v-for="d in copyDecoratorsStore.items" :key="d.id" :value="d.id">{{ d.name }}</option>
                      </select>
                    </td>

                    <!-- ACTIONS -->
                    <td class="px-2 py-1.5">
                      <div class="flex items-center justify-end gap-1">
                        <span
                          v-if="row.saveError"
                          class="text-red-500 dark:text-red-400"
                          :title="row.saveError"
                        >
                          <AlertTriangle class="w-4 h-4" />
                        </span>
                        <span v-if="row.isSaving" class="block w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        <button
                          v-if="!isReadOnly"
                          @click="deleteRow(row)"
                          class="btn-icon text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete row"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Copy Decorators Tab -->
          <div v-show="activeTab === 'settings'" class="tab-content">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Copy Decorators</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Define templates applied to selected sample copy content before injection. Reference the selected content using <code v-pre class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{copyContent}}</code>.
                </p>
              </div>
              <div class="flex items-center gap-2 ml-4 shrink-0">
                <button
                  v-if="!isReadOnly"
                  @click="saveAllDecoratorRows"
                  class="btn-secondary"
                  :disabled="isSavingAllDecorators || dirtyDecoratorCount === 0"
                >
                  <Check v-if="showSaveAllDecoratorSuccess" class="inline-block w-4 h-4 mr-1 text-green-500" />
                  <span v-else-if="isSavingAllDecorators" class="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <Save v-else class="inline-block w-4 h-4 mr-1" />
                  {{ showSaveAllDecoratorSuccess ? 'Saved!' : `Save Changes${dirtyDecoratorCount > 0 ? ` (${dirtyDecoratorCount})` : ''}` }}
                </button>
                <button @click="addDecoratorRow" class="btn-primary" :disabled="isReadOnly">
                  <Plus class="inline-block w-4 h-4 mr-1" />
                  Add Decorator
                </button>
              </div>
            </div>

            <div v-if="copyDecoratorsStore.error" class="alert-error mb-4">{{ copyDecoratorsStore.error }}</div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-48">Name</th>
                    <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Template</th>
                    <th class="w-16"></th>
                  </tr>
                </thead>
                <tbody v-if="decoratorRows.length === 0">
                  <tr>
                    <td colspan="3" class="text-center py-12 text-gray-400 dark:text-gray-500">
                      No decorators yet. Click "Add Decorator" to create one.
                    </td>
                  </tr>
                </tbody>
                <tbody v-else>
                  <tr
                    v-for="dr in decoratorRows"
                    :key="dr.tempId"
                    class="border-b border-gray-100 dark:border-gray-800 last:border-0 align-top group"
                    :class="dr.id === null ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : dr.isDirty ? 'bg-amber-50/60 dark:bg-amber-900/15' : 'hover:bg-gray-50/40 dark:hover:bg-gray-700'"
                  >
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-800">
                      <input
                        v-model="dr.name"
                        @input="dr.isDirty = true"
                        type="text"
                        placeholder="decorator name"
                        class="spreadsheet-input font-mono"
                        :disabled="isReadOnly"
                      />
                    </td>
                    <td class="px-2 py-1.5 border-r border-gray-100 dark:border-gray-800">
                      <textarea
                        v-model="dr.template"
                        v-autosize
                        rows="1"
                        @input="dr.isDirty = true"
                        placeholder="Template string, use {{copyContent}} as the sample placeholder"
                        class="spreadsheet-input font-mono"
                        :disabled="isReadOnly"
                      />
                    </td>
                    <td class="px-2 py-1.5">
                      <div class="flex items-center justify-end gap-1">
                        <span v-if="dr.isSaving" class="block w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        <button
                          v-if="!isReadOnly"
                          @click="deleteDecoratorRow(dr)"
                          class="btn-icon text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.col-th {
  position: relative;
  overflow: visible;
}

.col-resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 7px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

.col-resize-handle::after {
  content: '';
  position: absolute;
  top: 15%;
  bottom: 15%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: transparent;
  transition: background 0.15s;
  border-radius: 1px;
}

.col-th:hover .col-resize-handle::after,
.col-resize-handle:hover::after {
  background: rgb(156 163 175);
}

.spreadsheet-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.875rem;
  outline: none;
  color: inherit;
  transition: border-color 0.1s;
}

.spreadsheet-input::placeholder {
  opacity: 0.4;
}

.spreadsheet-input:hover {
  border-color: rgb(229 231 235);
}

.spreadsheet-input:focus {
  border-color: rgb(52 211 153); /* emerald-400 */
}

.spreadsheet-select {
  width: auto;
  max-width: 100%;
  min-width: 0;

  padding: 4px 6px;

  border: 1px solid transparent;
  border-radius: 0.375rem; /* rounded */

  font-size: 0.875rem;

  background-color: rgb(247, 254, 251);
  color: #1f2937; /* text-gray-800 */

  cursor: pointer;

  outline: none;

  transition: border-color 0.1s, background-color 0.1s, color 0.1s;
}

/* Dark mode (using class strategy like Tailwind) */
.dark .spreadsheet-select {
  background-color: rgb(31, 45, 45);
  color: #ffffff;
}

.spreadsheet-select:hover {
  border-color: rgb(229 231 235);
}

.spreadsheet-select:focus {
  border-color: rgb(52 211 153); /* emerald-400 */
}

/* kept for dark mode — used only for border colors, not text */
:global(.dark) .spreadsheet-input:hover {
  border-color: rgb(55 65 81);
}

:global(.dark) .spreadsheet-input:focus {
  border-color: rgb(16 185 129); /* emerald-500 */
}

:global(.dark) .spreadsheet-select:hover {
  border-color: rgb(55 65 81);
}

:global(.dark) .spreadsheet-select:focus {
  border-color: rgb(16 185 129); /* emerald-500 */
}
</style>
