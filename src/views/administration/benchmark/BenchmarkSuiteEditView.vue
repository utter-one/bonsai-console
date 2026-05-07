<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkSuitesStore, useBenchmarkRunsStore, useBenchmarkConfigsStore, useBenchmarkProviderConfigsStore } from '@/stores'
import { ArrowLeft, Save, Check, Play, Plus } from 'lucide-vue-next'
import type { BenchmarkSuiteResponse, BenchmarkConfigResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import MetadataTab from '@/components/MetadataTab.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import RelativeDate from '@/components/RelativeDate.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const suitesStore = useBenchmarkSuitesStore()
const runsStore = useBenchmarkRunsStore()
const configsStore = useBenchmarkConfigsStore()
const providerConfigsStore = useBenchmarkProviderConfigsStore()

const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'general' | 'configs' | 'runs' | 'metadata'>('general')
const isTriggeringRun = ref(false)
const triggerError = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  cronExpression: '',
  isActive: true,
  tags: [] as string[],
})

const suiteId = computed(() => route.params.suiteId as string | undefined)
const isEditMode = computed(() => !!suiteId.value)
const currentSuite = ref<BenchmarkSuiteResponse | null>(null)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'general', label: 'General' },
  { key: 'configs', label: 'Benchmark Configs', show: isEditMode.value },
  { key: 'runs', label: 'Runs', show: isEditMode.value },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
])

const validTabs = ['general', 'configs', 'runs', 'metadata'] as const
const queryTab = route.query.tab as string | undefined
if (queryTab && validTabs.includes(queryTab as any)) {
  activeTab.value = queryTab as typeof activeTab.value
}

const { switchToFirstErrorTab } = useTabNavigation(activeTab)

const metadataFields = computed(() => {
  if (!currentSuite.value) return []
  return [
    { label: 'Suite ID', value: currentSuite.value.id, format: 'mono' as const },
    { label: 'Version', value: String(currentSuite.value.version) },
    { label: 'Created', value: currentSuite.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentSuite.value.updatedAt, format: 'date' as const },
  ]
})

function populateForm(suite: BenchmarkSuiteResponse) {
  form.value = {
    name: suite.name,
    description: suite.description ?? '',
    cronExpression: suite.cronExpression ?? '',
    isActive: suite.isActive,
    tags: [...suite.tags],
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    const cached = suitesStore.currentItem?.id === suiteId.value
      ? suitesStore.currentItem
      : (suitesStore.items.find(s => s.id === suiteId.value) ?? null)
    if (cached) {
      currentSuite.value = cached
      populateForm(cached)
    }
    await loadSuite(!cached)
    await Promise.all([
      runsStore.fetchAll(suiteId.value),
      configsStore.fetchBySuite(suiteId.value!),
      providerConfigsStore.fetchAll(),
    ])
  } else {
    runsStore.items = []
    configsStore.items = []
  }
})

async function loadSuite(showLoading = true) {
  if (!suiteId.value) return
  if (showLoading) isLoading.value = true
  error.value = null
  try {
    currentSuite.value = await suitesStore.fetchById(suiteId.value)
    if (showLoading && currentSuite.value) {
      populateForm(currentSuite.value)
    }
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    if (showLoading) isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true
  try {
    if (isEditMode.value && currentSuite.value) {
      const updated = await suitesStore.update(currentSuite.value.id, {
        version: currentSuite.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        cronExpression: form.value.cronExpression || undefined,
        isActive: form.value.isActive,
        tags: form.value.tags,
      })
      currentSuite.value = updated
      showSuccess.value = true
      setTimeout(() => (showSuccess.value = false), 2000)
    } else {
      const created = await suitesStore.create({
        name: form.value.name,
        description: form.value.description || undefined,
        cronExpression: form.value.cronExpression || undefined,
        isActive: form.value.isActive,
        tags: form.value.tags,
      })
      router.push({ name: 'administration.benchmarkSuites.edit', params: { suiteId: created.id } })
    }
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

async function triggerRun() {
  if (!suiteId.value) return
  isTriggeringRun.value = true
  triggerError.value = null
  try {
    await runsStore.triggerRun(suiteId.value)
    await runsStore.fetchAll(suiteId.value)
    activeTab.value = 'runs'
    startPollingIfNeeded()
  } catch (err: any) {
    triggerError.value = parseApiError(err).message
  } finally {
    isTriggeringRun.value = false
  }
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const hasActiveRuns = computed(() =>
  runsStore.items.some(r => r.status === 'pending' || r.status === 'in_progress')
)

function startPollingIfNeeded() {
  if (pollingTimer) return
  if (!hasActiveRuns.value) return
  pollingTimer = setInterval(async () => {
    if (!suiteId.value) return
    await runsStore.pollSilent(suiteId.value)
    if (!hasActiveRuns.value) stopPolling()
  }, 2000)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

watch(activeTab, (tab) => {
  if (tab === 'runs') {
    startPollingIfNeeded()
  } else {
    stopPolling()
  }
})

onUnmounted(() => stopPolling())

function viewRun(runId: string) {
  router.push({ name: 'administration.benchmarkRuns.detail', params: { runId }, query: { fromTab: 'runs' } })
}

async function deleteRun(runId: string) {
  if (!confirm('Delete this benchmark run?\n\nThis action cannot be undone.')) return
  try {
    await runsStore.remove(runId)
  } catch {
    alert('Failed to delete run')
  }
}

function createConfig() {
  router.push({ name: 'administration.benchmarkSuites.configs.create', params: { suiteId: suiteId.value }, query: { fromTab: activeTab.value } })
}

function editConfig(config: BenchmarkConfigResponse) {
  router.push({ name: 'administration.benchmarkSuites.configs.edit', params: { suiteId: suiteId.value, configId: config.id }, query: { fromTab: activeTab.value } })
}

async function deleteConfig(config: BenchmarkConfigResponse) {
  if (!confirm(`Delete benchmark config "${config.name}"?\n\nThis action cannot be undone.`)) return
  try {
    await configsStore.remove(config.id)
  } catch {
    alert('Failed to delete benchmark config')
  }
}

function providerConfigName(id: string) {
  return providerConfigsStore.items.find(p => p.id === id)?.name ?? id
}

const inputTypeBadge: Record<string, string> = {
  messages: 'badge-info',
  text: 'badge-primary',
  audio: 'badge-warning',
}

const runStatusClass: Record<string, string> = {
  pending: 'badge-info',
  running: 'badge-warning',
  in_progress: 'badge-warning',
  completed: 'badge-active',
  failed: 'badge-error',
}
</script>

<template>
  <div class="flex-1 min-w-0">
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="router.push({ name: 'administration.benchmarkSuites' })" class="btn-icon mb-2 md:mb-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Suite' : 'New Benchmark Suite' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ isEditMode ? 'Edit benchmark suite settings' : 'Create a new benchmark suite' }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button v-if="isEditMode" type="button" @click="triggerRun" :disabled="isTriggeringRun" class="btn-secondary">
          <Play class="inline-block mr-2 w-4 h-4" />
          {{ isTriggeringRun ? 'Triggering...' : 'Trigger Run' }}
        </button>
        <button @click="handleSubmit" :disabled="isLoading || showSuccess" class="btn-primary">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Plus v-else-if="!isEditMode" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Suite')) }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <TabNavigator v-model="activeTab" :tabs="tabs" />
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <ErrorDisplay :error="error" class="mx-8 mt-4" />

          <TabContent v-model="activeTab" tab="general">
            <FormField label="Name" required :error="error" path="name" class="w-full" help="A descriptive name for this benchmark suite">
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g. LLM Response Quality" :disabled="isLoading" />
            </FormField>

            <FormField label="Description" :error="error" path="description" class="w-full">
              <textarea v-model="form.description" class="form-textarea" rows="3" placeholder="What does this suite benchmark?" :disabled="isLoading" />
            </FormField>

            <FormField label="Active" :error="error" path="isActive" hint="Enable to allow scheduled automatic runs">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.isActive" type="checkbox" class="form-checkbox" :disabled="isLoading" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Enable scheduled runs</span>
              </label>
            </FormField>

            <FormField v-if="form.isActive" label="Cron Expression" :error="error" path="cronExpression" class="w-full md:w-96" help="Schedule for automatic runs, e.g. 0 0 * * * for daily at midnight">
              <input v-model="form.cronExpression" type="text" class="form-input font-mono" placeholder="0 0 * * *" :disabled="isLoading" />
            </FormField>

            <TagsEditor v-model="form.tags" :disabled="isLoading" />
          </TabContent>

          <TabContent v-if="isEditMode" v-model="activeTab" tab="configs">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Benchmark Configs</h3>
              <button type="button" @click="createConfig" class="btn-primary">
                <Plus class="inline-block mr-2 w-4 h-4" />
                New Config
              </button>
            </div>

            <div v-if="configsStore.isLoading" class="loading-state">Loading configs...</div>

            <div v-else-if="configsStore.items.length === 0" class="empty-state">
              <p class="empty-state-title">No benchmark configs yet</p>
              <p>Add test cases to define what will be benchmarked</p>
            </div>

            <div v-else class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Name</th>
                      <th class="table-header-cell">Provider Config</th>
                      <th class="table-header-cell">Input Type</th>
                      <th class="table-header-cell">Repeats</th>
                      <th class="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr
                      v-for="config in configsStore.items"
                      :key="config.id"
                      class="table-row cursor-pointer"
                      @click="editConfig(config)"
                    >
                      <td class="table-clickable-cell font-medium">{{ config.name }}</td>
                      <td class="table-cell text-gray-500 dark:text-gray-400 text-sm">{{ providerConfigName(config.providerConfigId) }}</td>
                      <td class="table-cell">
                        <span :class="inputTypeBadge[config.inputType] ?? 'badge-info'">{{ config.inputType }}</span>
                      </td>
                      <td class="table-cell text-sm text-gray-500 dark:text-gray-400">{{ config.repeats }}×</td>
                      <td class="table-cell-right">
                        <div class="flex-end">
                          <button type="button" @click.stop="editConfig(config)" class="btn-secondary btn-sm">Edit</button>
                          <button type="button" @click.stop="deleteConfig(config)" class="btn-danger btn-sm">Delete</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabContent>

          <TabContent v-if="isEditMode" v-model="activeTab" tab="runs">
            <p v-if="triggerError" class="text-red-500 text-sm mb-3">{{ triggerError }}</p>

            <div v-if="runsStore.isLoading" class="loading-state">Loading runs...</div>

            <div v-else-if="runsStore.items.length === 0" class="empty-state">
              <p class="empty-state-title">No runs yet</p>
              <p>Trigger a run to see results here</p>
            </div>

            <div v-else class="table-container">
              <div class="table-wrapper">
                <table class="table">
                  <thead class="table-header">
                    <tr>
                      <th class="table-header-cell">Run ID</th>
                      <th class="table-header-cell">Status</th>
                      <th class="table-header-cell">Trigger</th>
                      <th class="table-header-cell">Started</th>
                      <th class="table-header-cell">Finished</th>
                      <th class="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="table-body">
                    <tr
                      v-for="run in runsStore.items"
                      :key="run.id"
                      class="table-row"
                    >
                      <td class="table-cell font-mono text-xs">{{ run.id.slice(0, 8) }}...</td>
                      <td class="table-cell">
                        <span :class="runStatusClass[run.status] ?? 'badge-info'">{{ run.status }}</span>
                      </td>
                      <td class="table-cell text-gray-500 dark:text-gray-400">{{ run.trigger }}</td>
                      <td class="table-cell-muted"><RelativeDate :date="run.startedAt" /></td>
                      <td class="table-cell-muted">
                        <RelativeDate v-if="run.completedAt" :date="run.completedAt" />
                        <span v-else class="text-gray-400">—</span>
                      </td>
                      <td class="table-cell-right">
                        <div class="flex-end">
                          <button
                            @click="viewRun(run.id)"
                            :disabled="run.status === 'pending' || run.status === 'in_progress'"
                            class="btn-secondary btn-sm"
                          >View</button>
                          <button @click="deleteRun(run.id)" class="btn-danger btn-sm">Delete</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabContent>
        </form>

        <MetadataTab
          v-if="isEditMode && currentSuite"
          v-model="activeTab"
          tab="metadata"
          :fields="metadataFields"
        />
      </div>
    </div>
  </div>
  </div>
</template>
