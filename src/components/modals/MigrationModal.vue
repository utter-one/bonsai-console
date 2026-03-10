<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Globe, ArrowDownToLine, CheckCircle, XCircle, Loader,
  ChevronDown, ChevronUp, AlertTriangle, RefreshCw,
} from 'lucide-vue-next'
import type { EnvironmentResponse, MigrationJob, MigrationPreview, EntityStub } from '@/api/types'
import apiClient from '@/api/client'

const props = defineProps<{
  environment: EnvironmentResponse
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

//  Entity group configuration 
interface EntityGroup {
  label: string
  previewKey: keyof Omit<MigrationPreview, 'totalCount'>
  selectionKey: string
  projectScoped?: boolean
  description?: string
}

const ENTITY_GROUPS: EntityGroup[] = [
  { label: 'Projects',              previewKey: 'projects',             selectionKey: 'projectIds' },
  { label: 'Stages',                previewKey: 'stages',               selectionKey: 'stageIds',             projectScoped: true, description: 'Pulls in agent, classifiers, context transformers, global actions & providers' },
  { label: 'Agents',                previewKey: 'agents',               selectionKey: 'agentIds',             projectScoped: true, description: 'Pulls in referenced TTS provider' },
  { label: 'Classifiers',           previewKey: 'classifiers',          selectionKey: 'classifierIds',        projectScoped: true, description: 'Pulls in referenced LLM provider' },
  { label: 'Context Transformers',  previewKey: 'contextTransformers',  selectionKey: 'contextTransformerIds',projectScoped: true, description: 'Pulls in referenced LLM provider' },
  { label: 'Tools',                 previewKey: 'tools',                selectionKey: 'toolIds',              projectScoped: true, description: 'Pulls in referenced LLM provider' },
  { label: 'Global Actions',        previewKey: 'globalActions',        selectionKey: 'globalActionIds',      projectScoped: true },
  { label: 'Knowledge Categories',  previewKey: 'knowledgeCategories',  selectionKey: 'knowledgeCategoryIds', projectScoped: true, description: 'Pulls all child knowledge items' },
  { label: 'Providers',             previewKey: 'providers',            selectionKey: 'providerIds' },
  { label: 'API Keys',              previewKey: 'apiKeys',              selectionKey: 'apiKeyIds' },
]

// Steps 
type Step = 'config' | 'running' | 'done'
const step = ref<Step>('config')

// Preview (entity loading)
const preview = ref<MigrationPreview | null>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const expandedGroups = ref<Set<string>>(new Set())

async function loadPreview() {
  previewLoading.value = true
  previewError.value = null
  try {
    preview.value = await apiClient.environmentsMigrationScopeList(props.environment.id)
  } catch (err: any) {
    previewError.value = err.response?.data?.message || 'Failed to load available entities'
  } finally {
    previewLoading.value = false
  }
}

function toggleGroup(key: string) {
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key)
  } else {
    expandedGroups.value.add(key)
  }
}

// Entity selection
// entitySelections: selectionKey → Set<id>
const entitySelections = ref<Record<string, Set<string>>>({})

function initSelections() {
  const sel: Record<string, Set<string>> = {}
  ENTITY_GROUPS.forEach(g => { sel[g.selectionKey] = new Set() })
  entitySelections.value = sel
}

// Project filter for custom selection
const selectedProjectFilter = ref<'all' | string>('all')

const projectFilterOptions = computed(() => {
  if (!preview.value) return []
  return preview.value.projects
})

function onProjectFilterChange() {
  initSelections()
}

function getGroupStubs(group: EntityGroup): EntityStub[] {
  if (!preview.value) return []
  const all = preview.value[group.previewKey] as EntityStub[]
  if (selectedProjectFilter.value === 'all') return all
  if (group.previewKey === 'projects') return all.filter(s => s.id === selectedProjectFilter.value)
  if (group.projectScoped) return all.filter(s => s.projectId === selectedProjectFilter.value)
  return all
}

function isEntitySelected(selectionKey: string, id: string): boolean {
  return entitySelections.value[selectionKey]?.has(id) ?? false
}

function toggleEntity(selectionKey: string, id: string) {
  const set = entitySelections.value[selectionKey]
  if (!set) return
  if (set.has(id)) set.delete(id)
  else set.add(id)
}

function groupSelectionState(group: EntityGroup): 'all' | 'partial' | 'none' {
  const stubs = getGroupStubs(group)
  if (!stubs.length) return 'none'
  const set = entitySelections.value[group.selectionKey]
  const count = stubs.filter(s => set?.has(s.id)).length
  if (count === 0) return 'none'
  if (count === stubs.length) return 'all'
  return 'partial'
}

function toggleGroupAll(group: EntityGroup) {
  const stubs = getGroupStubs(group)
  const set = entitySelections.value[group.selectionKey]
  if (!set) return
  const state = groupSelectionState(group)
  if (state === 'all') {
    stubs.forEach(s => set.delete(s.id))
  } else {
    stubs.forEach(s => set.add(s.id))
  }
}

function selectAll() {
  ENTITY_GROUPS.forEach(g => {
    const stubs = getGroupStubs(g)
    const set = entitySelections.value[g.selectionKey]
    if (set) stubs.forEach(s => set.add(s.id))
  })
}

function deselectAll() {
  ENTITY_GROUPS.forEach(g => {
    entitySelections.value[g.selectionKey]?.clear()
  })
}

const totalSelectedCount = computed(() => {
  return ENTITY_GROUPS.reduce((sum, g) => sum + (entitySelections.value[g.selectionKey]?.size ?? 0), 0)
})

const nonEmptyGroups = computed(() => {
  if (!preview.value) return []
  return ENTITY_GROUPS.filter(g => (preview.value![g.previewKey] as EntityStub[]).length > 0)
})

const customSelectionValid = computed(() => totalSelectedCount.value > 0)

// Options 
const dryRun = ref(false)
const force = ref(false)

// Build selection payload 
const selectionPayload = computed(() => {
  const result: Record<string, string[]> = {}
  ENTITY_GROUPS.forEach(g => {
    const ids = [...(entitySelections.value[g.selectionKey] ?? [])]
    if (ids.length) result[g.selectionKey] = ids
  })
  return result
})

// Job
const job = ref<MigrationJob | null>(null)
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const pollError = ref<string | null>(null)

const showEntityCounts = ref(true)

const statusLabel = computed(() => {
  if (!job.value) return ''
  const map: Record<MigrationJob['status'], string> = {
    pending: 'Queued', running: 'Running', completed: 'Completed', failed: 'Failed',
  }
  return map[job.value.status] ?? job.value.status
})

const isActive = computed(() =>
  job.value?.status === 'pending' || job.value?.status === 'running'
)

const totalUpserted = computed(() =>
  job.value?.result?.upserted.reduce((sum, c) => sum + c.count, 0) ?? 0
)

async function startMigration() {
  pollError.value = null
  try {
    step.value = 'running'
    const result = await apiClient.environmentsMigrationPullCreate(props.environment.id, {
      selection: selectionPayload.value,
      dryRun: dryRun.value,
      force: force.value,
    })
    job.value = result
    if (isActive.value) {
      startPolling(result.id)
    } else {
      step.value = 'done'
    }
  } catch (err: any) {
    pollError.value = err.response?.data?.message || 'Failed to start migration'
    step.value = 'done'
  }
}

function startPolling(jobId: string) {
  stopPolling()
  pollTimer.value = setInterval(async () => {
    try {
      const result = await apiClient.environmentsMigrationJobsDetail(props.environment.id, jobId)
      job.value = result
      if (!isActive.value) {
        stopPolling()
        step.value = 'done'
      }
    } catch (err: any) {
      pollError.value = err.response?.data?.message || 'Failed to fetch job status'
      stopPolling()
      step.value = 'done'
    }
  }, 1500)
}

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

function reset() {
  stopPolling()
  step.value = 'config'
  job.value = null
  pollError.value = null
  dryRun.value = false
  force.value = false
  selectedProjectFilter.value = 'all'
  initSelections()
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

onMounted(() => {
  initSelections()
  loadPreview()
})

onUnmounted(stopPolling)
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content" style="max-width: 600px; width: 100%;" @click.stop>

      <!-- Header -->
      <div class="modal-header flex items-center gap-2">
        <ArrowDownToLine class="w-5 h-5 text-primary-600" />
        Migrate from Environment
      </div>

      <!-- Environment info badge -->
      <div class="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <Globe class="w-4 h-4 text-gray-500 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ environment.description }}</p>
          <p class="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">{{ environment.url }}</p>
        </div>
      </div>

      <!--  Step 1: Config  -->
      <template v-if="step === 'config'">

        <!-- Entity picker -->
        <!-- Loading -->
          <div v-if="previewLoading" class="flex items-center justify-center gap-3 py-8 text-gray-500 dark:text-gray-400">
            <Loader class="w-5 h-5 animate-spin" />
            <span class="text-sm">Loading available entities…</span>
          </div>

          <!-- Error -->
          <div v-else-if="previewError" class="flex items-start gap-3 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-red-700 dark:text-red-300">{{ previewError }}</p>
            </div>
            <button @click="loadPreview" class="btn-secondary btn-sm shrink-0" title="Retry">
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Entity list -->
          <template v-else-if="preview">
            <!-- Project filter -->
            <div class="form-group" v-if="projectFilterOptions.length > 1">
              <label class="form-label">Project</label>
              <select v-model="selectedProjectFilter" class="form-select" @change="onProjectFilterChange">
                <option value="all">All projects</option>
                <option v-for="p in projectFilterOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <!-- Select / deselect all bar -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ totalSelectedCount }} of {{ preview.totalCount }} entities selected
              </span>
              <div class="flex gap-2">
                <button type="button" @click="selectAll" class="text-xs text-primary-600 hover:underline">Select all</button>
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <button type="button" @click="deselectAll" class="text-xs text-gray-500 dark:text-gray-400 hover:underline">Deselect all</button>
              </div>
            </div>

            <!-- Entity groups -->
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 mb-4 max-h-72 overflow-y-auto">
              <template v-for="group in nonEmptyGroups" :key="group.selectionKey">
                <!-- Group header -->
                <div
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  @click="toggleGroup(group.selectionKey)"
                >
                  <!-- Group checkbox -->
                  <input
                    type="checkbox"
                    class="form-checkbox shrink-0"
                    :checked="groupSelectionState(group) === 'all'"
                    :indeterminate="groupSelectionState(group) === 'partial'"
                    @click.stop="toggleGroupAll(group)"
                  />
                  <span class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ group.label }}
                    <span class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                      ({{ getGroupStubs(group).length }})
                    </span>
                  </span>
                  <span
                    v-if="entitySelections[group.selectionKey]?.size"
                    class="text-xs text-primary-600 dark:text-primary-400 mr-1"
                  >
                    {{ entitySelections[group.selectionKey]?.size }} selected
                  </span>
                  <component
                    :is="expandedGroups.has(group.selectionKey) ? ChevronUp : ChevronDown"
                    class="w-3.5 h-3.5 text-gray-400 shrink-0"
                  />
                </div>

                <!-- Entity items -->
                <div v-if="expandedGroups.has(group.selectionKey)" class="bg-white dark:bg-gray-900">
                  <label
                    v-for="stub in getGroupStubs(group)"
                    :key="stub.id"
                    class="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      class="form-checkbox shrink-0"
                      :checked="isEntitySelected(group.selectionKey, stub.id)"
                      @change="toggleEntity(group.selectionKey, stub.id)"
                    />
                    <span class="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">{{ stub.name }}</span>
                    <span class="text-xs font-mono text-gray-400 dark:text-gray-500 shrink-0 ml-2">{{ stub.id }}</span>
                  </label>
                </div>
              </template>

              <!-- Empty state -->
              <div v-if="nonEmptyGroups.length === 0" class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                No entities available on the remote environment
              </div>
            </div>

            <p v-if="totalSelectedCount === 0" class="text-xs text-amber-600 dark:text-amber-400 mb-2">
              Select at least one entity to continue
            </p>
          </template>

        <!-- Options -->
        <div class="form-group">
          <label class="form-label">Options</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" v-model="dryRun" class="form-checkbox mt-0.5" />
              <span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dry run</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">Simulate the migration without writing any data</span>
              </span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" v-model="force" class="form-checkbox mt-0.5" />
              <span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Force</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">Bypass schema hash mismatch check</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button
            type="button"
            @click="startMigration"
            :disabled="!customSelectionValid || previewLoading"
            class="btn-primary"
          >
            <ArrowDownToLine class="inline-block mr-2 w-4 h-4" />
            {{ dryRun ? 'Run Dry Migration' : 'Start Migration' }}
          </button>
        </div>
      </template>

      <!--  Step 2: Running  -->
      <template v-else-if="step === 'running'">
        <div class="flex flex-col items-center gap-4 py-8">
          <Loader class="w-10 h-10 text-primary-500 animate-spin" />
          <div class="text-center">
            <p class="font-medium text-gray-900 dark:text-gray-100">Migration in progress…</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Status: <span class="font-mono">{{ statusLabel }}</span>
            </p>
            <p v-if="job?.id" class="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
              Job ID: {{ job.id }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close (keep running)</button>
        </div>
      </template>

      <!--  Step 3: Done  -->
      <template v-else-if="step === 'done'">
        <!-- Error from API call itself -->
        <template v-if="pollError && !job">
          <div class="flex flex-col items-center gap-3 py-6">
            <XCircle class="w-10 h-10 text-red-500" />
            <p class="font-medium text-gray-900 dark:text-gray-100">Migration failed to start</p>
            <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ pollError }}</p>
          </div>
        </template>

        <!-- Job result -->
        <template v-else-if="job">
          <!-- Success -->
          <template v-if="job.status === 'completed'">
            <div class="flex items-center gap-3 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle class="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <p class="font-medium text-green-800 dark:text-green-200">
                  {{ job.result?.dryRun ? 'Dry run completed' : 'Migration completed' }}
                </p>
                <p class="text-sm text-green-700 dark:text-green-300">
                  {{ totalUpserted }} record{{ totalUpserted !== 1 ? 's' : '' }} {{ job.result?.dryRun ? 'would be' : 'were' }} upserted
                  <span v-if="job.result?.durationMs"> in {{ formatDuration(job.result.durationMs) }}</span>
                </p>
              </div>
            </div>

            <!-- Schema hash mismatch warning -->
            <div
              v-if="job.result && !job.result.schemaHashMatch"
              class="flex items-start gap-2 mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
            >
              <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <span class="text-yellow-600 dark:text-yellow-400 text-sm">
                Schema hash mismatch — source and local REST schemas differ. Data was imported with <code class="font-mono">force=true</code>.
              </span>
            </div>

            <!-- Entity counts -->
            <div v-if="job.result?.upserted.length">
              <button
                class="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
                type="button"
                @click="showEntityCounts = !showEntityCounts"
              >
                <component :is="showEntityCounts ? ChevronUp : ChevronDown" class="w-4 h-4" />
                Entity breakdown
              </button>
              <div v-if="showEntityCounts" class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Entity</th>
                      <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                        {{ job.result.dryRun ? 'Would upsert' : 'Upserted' }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(count, idx) in job.result.upserted"
                      :key="count.entity"
                      :class="idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'"
                    >
                      <td class="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{{ count.entity }}</td>
                      <td class="px-3 py-1.5 text-right text-gray-900 dark:text-gray-100 font-medium">{{ count.count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <!-- Failed -->
          <template v-else-if="job.status === 'failed'">
            <div class="flex items-start gap-3 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <XCircle class="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-red-800 dark:text-red-200">Migration failed</p>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ job.error ?? 'An unknown error occurred' }}</p>
              </div>
            </div>
          </template>
        </template>

        <!-- Polling error alongside job data -->
        <div v-if="pollError && job" class="text-sm text-red-600 dark:text-red-400 mb-4">
          ⚠ {{ pollError }}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" @click="reset" class="btn-secondary">Run Again</button>
          <button type="button" @click="$emit('close')" class="btn-primary">Close</button>
        </div>
      </template>

    </div>
  </div>
</template>
