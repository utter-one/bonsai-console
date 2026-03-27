<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, X, Save, Check, Trash2, Route, Drama } from 'lucide-vue-next'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import {
  useSampleCopiesStore,
  useCopyDecoratorsStore,
  useStagesStore,
  useAgentsStore,
  useProjectSelectionStore,
} from '@/stores'
import type { CreateSampleCopyRequest, SampleCopyResponse } from '@/api/types'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'

const sampleCopiesStore = useSampleCopiesStore()
const copyDecoratorsStore = useCopyDecoratorsStore()
const stagesStore = useStagesStore()
const agentsStore = useAgentsStore()
const projectSelectionStore = useProjectSelectionStore()
const { isReadOnly } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const activeTab = ref<'copies' | 'settings'>('copies')

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
  decoratorId: string | null
  classifierOverrideId: string | null
  version: number
  isDirty: boolean
  isSaving: boolean
  openStageDropdown: boolean
  openAgentDropdown: boolean
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
const successIds = ref<Set<string>>(new Set())

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
    decoratorId: item.decoratorId,
    classifierOverrideId: item.classifierOverrideId,
    version: item.version,
    isDirty: false,
    isSaving: false,
    openStageDropdown: false,
    openAgentDropdown: false,
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
    decoratorId: null,
    classifierOverrideId: null,
    version: 0,
    isDirty: true,
    isSaving: false,
    openStageDropdown: false,
    openAgentDropdown: false,
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
  ])
  rows.value = sampleCopiesStore.items.map(makeRowState)
  decoratorRows.value = copyDecoratorsStore.items.map(makeDecoratorRowState)
}

onMounted(loadData)

watch(projectId, () => {
  rows.value = []
  decoratorRows.value = []
  loadData()
})

// Filtering
const filteredRows = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return rows.value.filter(row => {
    if (q && !row.name.toLowerCase().includes(q) && !row.promptTrigger.toLowerCase().includes(q)) return false
    if (filterStageId.value && !row.stages.includes(filterStageId.value)) return false
    if (filterAgentId.value && !row.agents.includes(filterAgentId.value)) return false
    if (filterDecoratorId.value === '__none__' && row.decoratorId !== null) return false
    if (filterDecoratorId.value && filterDecoratorId.value !== '__none__' && row.decoratorId !== filterDecoratorId.value) return false
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
  closeAllDropdowns()
  rows.value.unshift(makeNewRow())
}

function markDirty(row: RowState) {
  row.isDirty = true
}

async function saveRow(row: RowState) {
  if (!projectId.value || row.isSaving) return
  row.isSaving = true
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
        classifierOverrideId: row.classifierOverrideId || null,
        decoratorId: row.decoratorId,
      }
      const result = await sampleCopiesStore.create(projectId.value, req)
      row.id = result.id
      row.version = result.version
    } else {
      const result = await sampleCopiesStore.update(projectId.value, row.id, {
        name: row.name,
        stages: row.stages.length > 0 ? row.stages : null,
        agents: row.agents.length > 0 ? row.agents : null,
        promptTrigger: row.promptTrigger,
        content: row.content.filter(c => c.trim()),
        amount: row.amount,
        samplingMethod: row.samplingMethod,
        classifierOverrideId: row.classifierOverrideId || null,
        decoratorId: row.decoratorId,
        version: row.version,
      })
      row.version = result.version
    }
    row.isDirty = false
    flashSuccess(row.tempId)
  } catch {
    // error state managed by store
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

function flashSuccess(key: string) {
  const next = new Set(successIds.value)
  next.add(key)
  successIds.value = next
  setTimeout(() => {
    const n = new Set(successIds.value)
    n.delete(key)
    successIds.value = n
  }, 2000)
}

// Stage / agent helpers
function getStage(id: string) {
  return stagesStore.items.find(s => s.id === id)
}
function getAgent(id: string) {
  return agentsStore.items.find(a => a.id === id)
}
function availableStages(row: RowState) {
  return stagesStore.items.filter(s => !row.stages.includes(s.id))
}
function availableAgents(row: RowState) {
  return agentsStore.items.filter(a => !row.agents.includes(a.id))
}
function addStage(row: RowState, stageId: string) {
  if (!row.stages.includes(stageId)) {
    row.stages = [...row.stages, stageId]
    markDirty(row)
  }
  row.openStageDropdown = false
}
function removeStage(row: RowState, stageId: string) {
  row.stages = row.stages.filter(s => s !== stageId)
  markDirty(row)
}
function addAgent(row: RowState, agentId: string) {
  if (!row.agents.includes(agentId)) {
    row.agents = [...row.agents, agentId]
    markDirty(row)
  }
  row.openAgentDropdown = false
}
function removeAgent(row: RowState, agentId: string) {
  row.agents = row.agents.filter(a => a !== agentId)
  markDirty(row)
}
function addContent(row: RowState) {
  row.content = [...row.content, '']
  markDirty(row)
}
function removeContent(row: RowState, idx: number) {
  if (row.content.length <= 1) return
  row.content = row.content.filter((_, i) => i !== idx)
  markDirty(row)
}

function toggleDropdown(row: RowState, type: 'stage' | 'agent') {
  for (const r of rows.value) {
    if (r !== row) {
      r.openStageDropdown = false
      r.openAgentDropdown = false
    }
  }
  if (type === 'stage') {
    row.openAgentDropdown = false
    row.openStageDropdown = !row.openStageDropdown
  } else {
    row.openStageDropdown = false
    row.openAgentDropdown = !row.openAgentDropdown
  }
}

function closeAllDropdowns() {
  for (const r of rows.value) {
    r.openStageDropdown = false
    r.openAgentDropdown = false
  }
}

onMounted(() => document.addEventListener('click', closeAllDropdowns))
onUnmounted(() => document.removeEventListener('click', closeAllDropdowns))

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
    flashSuccess(dr.tempId)
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
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sample Copy</h1>
        <p class="page-subtitle">Manage and inject sample dialogues and system prompt injections based on states and conditions.</p>
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
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search rows..."
              class="form-input pl-8 py-1.5 text-sm h-9 w-50"
            />
          </div>

          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters:</span>

          <select v-model="filterStageId" class="form-select-auto text-sm py-1.5 h-9">
            <option value="">All Stages</option>
            <option v-for="s in stagesStore.items" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>

          <select v-model="filterAgentId" class="form-select-auto text-sm py-1.5 h-9">
            <option value="">All Agents</option>
            <option v-for="a in agentsStore.items" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>

          <select v-model="filterDecoratorId" class="form-select-auto text-sm py-1.5 h-9">
            <option value="">All Decorators</option>
            <option value="__none__">Raw (no decorator)</option>
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

          <button @click="addRow" class="btn-primary h-9" :disabled="isReadOnly">
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add Row
          </button>
        </div>

        <!-- Store error -->
        <div v-if="sampleCopiesStore.error" class="alert-error mb-4">{{ sampleCopiesStore.error }}</div>

        <!-- Loading (first load) -->
        <div v-if="sampleCopiesStore.isLoading && rows.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
          Loading...
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table class="w-full text-sm border-collapse" style="min-width: 1120px">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Name</th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                  <span class="flex items-center gap-1"><Route class="w-3.5 h-3.5" /> Stages</span>
                </th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                  <span class="flex items-center gap-1"><Drama class="w-3.5 h-3.5" /> Agents</span>
                </th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-52">When to Occur</th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sample Content</th>
                <th class="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">Amt.</th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Dist.</th>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Decor.</th>
                <th class="w-16"></th>
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
                v-for="row in filteredRows"
                :key="row.tempId"
                class="border-b border-gray-100 dark:border-gray-800 last:border-0 align-top group"
                :class="row.id === null ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-gray-50/40 dark:hover:bg-gray-800/20'"
              >
                <!-- NAME -->
                <td class="px-2 py-2">
                  <input
                    v-model="row.name"
                    @input="markDirty(row)"
                    type="text"
                    placeholder="name"
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-2 py-1 outline-none font-mono text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    :disabled="isReadOnly"
                  />
                </td>

                <!-- STAGES -->
                <td class="px-2 py-2">
                  <div class="flex flex-wrap gap-1 items-start min-h-[28px]">
                    <span
                      v-for="stageId in row.stages"
                      :key="stageId"
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 max-w-[110px]"
                    >
                      <span class="truncate">{{ getStage(stageId)?.name ?? stageId }}</span>
                      <button v-if="!isReadOnly" @click.stop="removeStage(row, stageId)" class="shrink-0 hover:text-red-500 ml-0.5"><X class="w-2.5 h-2.5" /></button>
                    </span>
                    <div v-if="!isReadOnly" class="relative">
                      <button
                        @click.stop="toggleDropdown(row, 'stage')"
                        class="inline-flex items-center justify-center w-5 h-5 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-600 dark:hover:border-gray-400 text-xs leading-none"
                      >+</button>
                      <div
                        v-if="row.openStageDropdown"
                        class="absolute left-0 top-7 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px] max-h-48 overflow-y-auto"
                      >
                        <div v-if="availableStages(row).length === 0" class="px-3 py-2 text-xs text-gray-400">No more stages</div>
                        <button
                          v-for="stage in availableStages(row)"
                          :key="stage.id"
                          class="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          @click="addStage(row, stage.id)"
                        >{{ stage.name }}</button>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- AGENTS -->
                <td class="px-2 py-2">
                  <div class="flex flex-wrap gap-1 items-start min-h-[28px]">
                    <span
                      v-for="agentId in row.agents"
                      :key="agentId"
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 max-w-[110px]"
                    >
                      <span class="truncate">{{ getAgent(agentId)?.name ?? agentId }}</span>
                      <button v-if="!isReadOnly" @click.stop="removeAgent(row, agentId)" class="shrink-0 hover:text-red-500 ml-0.5"><X class="w-2.5 h-2.5" /></button>
                    </span>
                    <div v-if="!isReadOnly" class="relative">
                      <button
                        @click.stop="toggleDropdown(row, 'agent')"
                        class="inline-flex items-center justify-center w-5 h-5 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-600 dark:hover:border-gray-400 text-xs leading-none"
                      >+</button>
                      <div
                        v-if="row.openAgentDropdown"
                        class="absolute left-0 top-7 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px] max-h-48 overflow-y-auto"
                      >
                        <div v-if="availableAgents(row).length === 0" class="px-3 py-2 text-xs text-gray-400">No more agents</div>
                        <button
                          v-for="agent in availableAgents(row)"
                          :key="agent.id"
                          class="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          @click="addAgent(row, agent.id)"
                        >{{ agent.name }}</button>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- TRIGGER -->
                <td class="px-2 py-2">
                  <textarea
                    v-model="row.promptTrigger"
                    @input="markDirty(row)"
                    rows="2"
                    placeholder="When should this activate..."
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-2 py-1 outline-none resize-y text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    :disabled="isReadOnly"
                  />
                </td>

                <!-- SAMPLE CONTENT -->
                <td class="px-2 py-2">
                  <div class="space-y-1.5">
                    <div v-for="(_, idx) in row.content" :key="idx" class="flex gap-1.5 items-start">
                      <span class="text-xs text-gray-400 dark:text-gray-500 mt-1.5 w-4 shrink-0 text-right font-mono select-none">{{ idx + 1 }}.</span>
                      <textarea
                        v-model="row.content[idx]"
                        @input="markDirty(row)"
                        rows="2"
                        placeholder="Sample text..."
                        class="flex-1 text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-2 py-1 outline-none resize-y text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                        :disabled="isReadOnly"
                      />
                      <button
                        v-if="!isReadOnly && row.content.length > 1"
                        @click="removeContent(row, idx)"
                        class="mt-1.5 shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
                      ><X class="w-3.5 h-3.5" /></button>
                    </div>
                    <button
                      v-if="!isReadOnly"
                      @click="addContent(row)"
                      class="text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 flex items-center gap-0.5 ml-5"
                    >
                      <Plus class="w-3 h-3" /> Add sample
                    </button>
                  </div>
                </td>

                <!-- AMT -->
                <td class="px-2 py-2">
                  <input
                    v-model.number="row.amount"
                    @input="markDirty(row)"
                    type="number"
                    min="1"
                    class="w-full text-center text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-1 py-1 outline-none text-gray-800 dark:text-gray-200"
                    :disabled="isReadOnly"
                  />
                </td>

                <!-- DIST -->
                <td class="px-2 py-2">
                  <select
                    v-model="row.samplingMethod"
                    @change="markDirty(row)"
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-1.5 py-1 outline-none text-gray-800 dark:text-gray-200"
                    :disabled="isReadOnly"
                  >
                    <option value="random">Random</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </td>

                <!-- TYPE -->
                <td class="px-2 py-2">
                  <select
                    v-model="row.decoratorId"
                    @change="markDirty(row)"
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded px-1.5 py-1 outline-none text-gray-800 dark:text-gray-200"
                    :disabled="isReadOnly"
                  >
                    <option :value="null">Raw</option>
                    <option v-for="d in copyDecoratorsStore.items" :key="d.id" :value="d.id">{{ d.name }}</option>
                  </select>
                </td>

                <!-- ACTIONS -->
                <td class="px-2 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="row.isDirty && !isReadOnly"
                      @click="saveRow(row)"
                      :disabled="row.isSaving"
                      class="btn-icon text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Save changes"
                    >
                      <Check v-if="successIds.has(row.tempId)" class="w-4 h-4 text-green-500" />
                      <span v-else-if="row.isSaving" class="block w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                      <Save v-else class="w-4 h-4" />
                    </button>
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

          <!-- Copy Settings Tab -->
          <div v-show="activeTab === 'settings'" class="tab-content">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Copy Decorators</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Define templates applied to selected sample copy content before injection. Reference the selected content using <code v-pre class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{content}}</code>.
            </p>
          </div>
          <button @click="addDecoratorRow" class="btn-primary ml-4 shrink-0" :disabled="isReadOnly">
            <Plus class="inline-block w-4 h-4 mr-1" />
            Add Decorator
          </button>
        </div>

        <div v-if="copyDecoratorsStore.error" class="alert-error mb-4">{{ copyDecoratorsStore.error }}</div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">Name</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template</th>
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
                :class="dr.id === null ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-gray-50/40 dark:hover:bg-gray-800/20'"
              >
                <td class="px-3 py-2">
                  <input
                    v-model="dr.name"
                    @input="dr.isDirty = true"
                    type="text"
                    placeholder="decorator name"
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 rounded px-2 py-1 outline-none font-mono text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    :disabled="isReadOnly"
                  />
                </td>
                <td class="px-3 py-2">
                  <textarea
                    v-model="dr.template"
                    @input="dr.isDirty = true"
                    rows="2"
                    :placeholder="'Template string, use {{content}} as the sample placeholder'"
                    class="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-400 rounded px-2 py-1 outline-none resize-y font-mono text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    :disabled="isReadOnly"
                  />
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="dr.isDirty && !isReadOnly"
                      @click="saveDecoratorRow(dr)"
                      :disabled="dr.isSaving"
                      class="btn-icon text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Save"
                    >
                      <Check v-if="successIds.has(dr.tempId)" class="w-4 h-4 text-green-500" />
                      <span v-else-if="dr.isSaving" class="block w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                      <Save v-else class="w-4 h-4" />
                    </button>
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
