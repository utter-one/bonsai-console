<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { Save, Check, Plus, Trash2, Clipboard, ClipboardPaste, AlertTriangle } from 'lucide-vue-next'
import type { ProjectResponse, ParameterValue } from '@/api/types'

const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const { projectIsArchived } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const currentProject = ref<ProjectResponse | null>(null)

type ConstantType = 'string' | 'number' | 'boolean' | 'json'

interface ConstantEntry {
  key: string
  type: ConstantType
  value: string
}

const constants = ref<ConstantEntry[]>([])

const duplicateConstantKeys = computed(() => {
  const keys = constants.value.map(c => c.key.trim()).filter(Boolean)
  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const key of keys) {
    if (seen.has(key)) duplicates.push(key)
    seen.add(key)
  }
  return [...new Set(duplicates)]
})

watch(projectId, () => {
  loadProject()
})

onMounted(() => {
  loadProject()
})

function inferConstantType(val: any): ConstantType {
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'string') return 'string'
  return 'json'
}

function constantEntryToValue(entry: ConstantEntry): ParameterValue {
  switch (entry.type) {
    case 'number': return Number(entry.value)
    case 'boolean': return entry.value === 'true'
    case 'json':
      try { return JSON.parse(entry.value) } catch { return entry.value }
    default: return entry.value
  }
}

function constantsRecordToEntries(record: Record<string, ParameterValue>): ConstantEntry[] {
  return Object.entries(record).map(([key, val]) => {
    const type = inferConstantType(val)
    const value = type === 'json' ? JSON.stringify(val, null, 2) : String(val)
    return { key, type, value }
  })
}

function entriesToConstantsRecord(entries: ConstantEntry[]): Record<string, ParameterValue> {
  const result: Record<string, ParameterValue> = {}
  for (const entry of entries) {
    const trimmedKey = entry.key.trim()
    if (trimmedKey) result[trimmedKey] = constantEntryToValue(entry)
  }
  return result
}

async function loadProject() {
  if (!projectId.value) return

  isLoading.value = true
  error.value = null

  try {
    currentProject.value = await projectsStore.fetchById(projectId.value)
    if (currentProject.value) {
      constants.value = constantsRecordToEntries(currentProject.value.constants || {})
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load project'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!currentProject.value) return

  isLoading.value = true
  error.value = null

  try {
    const updated = await projectsStore.update(currentProject.value.id, {
      version: currentProject.value.version,
      constants: entriesToConstantsRecord(constants.value),
    })

    currentProject.value = updated

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save constants'
  } finally {
    isLoading.value = false
  }
}

function addConstant() {
  constants.value.push({ key: '', type: 'string', value: '' })
}

function deleteConstant(index: number) {
  constants.value.splice(index, 1)
}

function copyAllConstants() {
  if (constants.value.length === 0) {
    alert('No constants to copy')
    return
  }
  try {
    const record = entriesToConstantsRecord(constants.value)
    navigator.clipboard.writeText(JSON.stringify(record, null, 2))
    alert(`Copied ${Object.keys(record).length} constant(s) to clipboard`)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alert('Failed to copy constants to clipboard')
  }
}

async function pasteConstants() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (!clipboardText) { alert('Clipboard is empty'); return }
    let parsed: Record<string, any>
    try { parsed = JSON.parse(clipboardText) } catch { alert('Clipboard does not contain valid JSON data'); return }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      alert('Clipboard does not contain a valid constants object')
      return
    }
    const incoming = constantsRecordToEntries(parsed as Record<string, ParameterValue>)
    let addedCount = 0
    let overwrittenCount = 0
    for (const entry of incoming) {
      const existing = constants.value.findIndex(c => c.key === entry.key)
      if (existing !== -1) {
        constants.value[existing] = entry
        overwrittenCount++
      } else {
        constants.value.push(entry)
        addedCount++
      }
    }
    const msg = overwrittenCount > 0
      ? `Pasted ${addedCount + overwrittenCount} constant(s) (${overwrittenCount} updated)`
      : `Pasted ${addedCount} constant(s)`
    alert(msg)
  } catch (err) {
    console.error('Failed to read clipboard:', err)
    alert('Failed to read from clipboard. Please make sure you have clipboard permissions.')
  }
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">Global Constants</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Key-value constants available in templating and conversation logic
          </p>
        </div>
        <div class="flex gap-3 items-center">
          <button
            v-if="!projectIsArchived"
            @click="handleSubmit"
            class="btn-primary"
            :disabled="isLoading || showSuccess"
            type="button"
          >
            <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
            <Save v-else class="inline-block mr-2 w-4 h-4" />
            {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : 'Save Changes') }}
          </button>
        </div>
      </div>

      <!-- Archived banner -->
      <div v-if="projectIsArchived" class="alert-warning mb-4">
        This project is archived — editing is disabled.
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !currentProject" class="loading-state">
        Loading...
      </div>

      <!-- Error State -->
      <div v-else-if="error && !currentProject" class="error-state">
        {{ error }}
      </div>

      <!-- Content -->
      <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-900">
        <div class="mx-auto">
          <fieldset :disabled="projectIsArchived" class="border-0 p-0 m-0 min-w-0 w-full">
            <div class="tab-content">
              <!-- Error Message -->
              <div v-if="error" class="alert-error mb-6">
                {{ error }}
              </div>

              <div v-if="duplicateConstantKeys.length > 0" class="alert-error mb-4">
                <AlertTriangle class="inline-block mr-2 w-4 h-4" />
                Duplicate constant keys detected: <strong>{{ duplicateConstantKeys.join(', ') }}</strong>. Keys must be unique.
              </div>

              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Project Constants</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Key-value constants available in templating and conversation logic
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="copyAllConstants"
                    class="btn-secondary"
                    :disabled="isLoading || constants.length === 0"
                    title="Copy all constants to clipboard"
                  >
                    <Clipboard class="inline-block mr-1 w-4 h-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    @click="pasteConstants"
                    class="btn-secondary"
                    :disabled="isLoading"
                    title="Paste constants from clipboard"
                  >
                    <ClipboardPaste class="inline-block mr-1 w-4 h-4" />
                    Paste
                  </button>
                  <button
                    type="button"
                    @click="addConstant"
                    class="btn-primary"
                    :disabled="isLoading"
                  >
                    <Plus class="inline-block mr-1 w-4 h-4" />
                    Add Constant
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="constants.length === 0" class="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-gray-500 dark:text-gray-400 mb-4">No constants defined yet</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  Click "Add Constant" to define your first constant
                </p>
              </div>

              <!-- Constants List -->
              <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div class="grid grid-cols-[1fr_auto_2fr_auto] gap-0 divide-y divide-gray-200 dark:divide-gray-700">
                  <!-- Header -->
                  <div class="col-span-4 grid grid-cols-[1fr_auto_2fr_auto] bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span>Key</span>
                    <span class="px-3">Type</span>
                    <span>Value</span>
                    <span></span>
                  </div>
                  <!-- Rows -->
                  <template v-for="(entry, index) in constants" :key="index">
                    <div class="col-span-4 grid grid-cols-[1fr_auto_2fr_auto] items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <!-- Key -->
                      <input
                        v-model="entry.key"
                        type="text"
                        placeholder="constant_name"
                        class="form-input py-1 px-2 text-sm font-mono"
                        :disabled="isLoading"
                        :class="{ 'border-red-400': duplicateConstantKeys.includes(entry.key.trim()) && entry.key.trim() }"
                      />
                      <!-- Type -->
                      <select
                        v-model="entry.type"
                        class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-[34px]"
                        :disabled="isLoading"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                      </select>
                      <!-- Value -->
                      <div class="flex items-center">
                        <input
                          v-if="entry.type === 'string' || entry.type === 'number' || entry.type === 'json'"
                          v-model="entry.value"
                          :type="entry.type === 'number' ? 'number' : 'text'"
                          :placeholder="entry.type === 'json' ? '{&quot;key&quot;: &quot;value&quot;}' : 'value'"
                          :class="['form-input py-1 px-2 text-sm w-full', entry.type === 'json' ? 'font-mono' : '']"
                          :disabled="isLoading"
                        />
                        <label v-else-if="entry.type === 'boolean'" class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            :checked="entry.value === 'true'"
                            @change="entry.value = ($event.target as HTMLInputElement).checked ? 'true' : 'false'"
                            class="form-checkbox"
                            :disabled="isLoading"
                          />
                          <span class="text-sm text-gray-700 dark:text-gray-300">{{ entry.value === 'true' ? 'true' : 'false' }}</span>
                        </label>
                      </div>
                      <!-- Delete -->
                      <button
                        type="button"
                        @click="deleteConstant(index)"
                        class="btn-icon text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        :disabled="isLoading"
                        title="Delete constant"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
</template>
