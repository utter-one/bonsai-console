<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useCopyPaste } from '@/composables/useCopyPaste'
import { Save, Check, Plus, Trash2, Clipboard, ClipboardPaste, AlertTriangle } from 'lucide-vue-next'
import VariableTreeNode from '@/components/VariableTreeNode.vue'
import VariablesPasteModal from '@/components/modals/VariablesPasteModal.vue'
import type { ProjectResponse, ParameterValue } from '@/api/types'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'

const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const { projectIsArchived } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const currentProject = ref<ProjectResponse | null>(null)
const activeTab = ref<'userProfile' | 'constants'>('userProfile')

const tabs: TabDefinition[] = [
  { key: 'userProfile', label: 'User Profile' },
  { key: 'constants', label: 'Constants' },
]

// User Profile state
const {
  clipboardData: clipboardVariables,
  showPasteModal: showVariablesPasteModal,
  copyAll: copyAllVariablesBase,
  openPasteModal: pasteVariables,
  closePasteModal: closeVariablesPasteModal,
} = useCopyPaste<any>('variable')

function copyAllVariables() {
  copyAllVariablesBase(form.value.userProfileVariableDescriptors)
}

const form = ref({
  version: undefined as number | undefined,
  autoCreateUsers: false,
  userProfileVariableDescriptors: [] as Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
    isArray: boolean
    objectSchema?: Array<any>
  }>,
})

const expandedNodes = ref<Set<string>>(new Set())

const duplicateVariableNames = computed(() => {
  function findDuplicates(descriptors: Array<{ name: string; objectSchema?: any[] }>): string[] {
    const seen = new Set<string>()
    const dupes: string[] = []
    for (const d of descriptors) {
      if (seen.has(d.name)) {
        if (!dupes.includes(d.name)) dupes.push(d.name)
      } else {
        seen.add(d.name)
      }
    }
    for (const d of descriptors) {
      if (d.objectSchema && d.objectSchema.length > 0) {
        dupes.push(...findDuplicates(d.objectSchema))
      }
    }
    return dupes
  }
  return findDuplicates(form.value.userProfileVariableDescriptors)
})

// Constants state
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

// Constants helpers
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
      form.value = {
        version: currentProject.value.version,
        autoCreateUsers: currentProject.value.autoCreateUsers ?? false,
        userProfileVariableDescriptors: currentProject.value.userProfileVariableDescriptors || [],
      }
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
      autoCreateUsers: form.value.autoCreateUsers,
      userProfileVariableDescriptors: form.value.userProfileVariableDescriptors,
      constants: entriesToConstantsRecord(constants.value),
    })

    currentProject.value = updated
    form.value.version = updated.version

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save changes'
  } finally {
    isLoading.value = false
  }
}

// User Profile functions
function getDescriptorByPath(path: number[]): any {
  let current: any = { objectSchema: form.value.userProfileVariableDescriptors }
  for (const index of path) {
    current = current.objectSchema[index]
    if (!current) return null
  }
  return current
}

function addRootVariable() {
  form.value.userProfileVariableDescriptors.push({
    name: 'new_variable',
    type: 'string' as const,
    isArray: false,
    objectSchema: []
  })
}

function addNestedVariable(path: number[]) {
  const parent = getDescriptorByPath(path)
  if (!parent) return
  if (!parent.objectSchema) {
    parent.objectSchema = []
  }
  parent.objectSchema.push({
    name: 'new_field',
    type: 'string' as const,
    isArray: false,
    objectSchema: []
  })
  expandedNodes.value.add(path.join('-'))
}

function updateVariableName(data: { path: number[]; name: string }) {
  const descriptor = getDescriptorByPath(data.path)
  if (descriptor) {
    descriptor.name = data.name
  }
}

function updateVariableType(data: { path: number[]; type: string }) {
  const descriptor = getDescriptorByPath(data.path)
  if (descriptor) {
    descriptor.type = data.type
    descriptor.isArray = data.type.endsWith('[]')
    const isObject = data.type === 'object' || data.type === 'object[]'
    if (!isObject && descriptor.objectSchema) {
      descriptor.objectSchema = []
    }
  }
}

function deleteVariable(path: number[]) {
  if (!confirm('Are you sure you want to delete this variable and all its nested fields?')) return
  if (path.length === 1) {
    const index = path[0]
    if (index !== undefined) {
      form.value.userProfileVariableDescriptors.splice(index, 1)
    }
  } else {
    const parentPath = path.slice(0, -1)
    const index = path[path.length - 1]
    const parent = getDescriptorByPath(parentPath)
    if (parent?.objectSchema && index !== undefined) {
      parent.objectSchema.splice(index, 1)
    }
  }
}

function toggleNode(path: number[]) {
  const key = path.join('-')
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key)
  } else {
    expandedNodes.value.add(key)
  }
}

function handleVariablesPaste(indices: number[]) {
  if (!clipboardVariables.value) return
  let pastedCount = 0
  let overwrittenCount = 0
  for (const index of indices) {
    const variable = clipboardVariables.value[index]
    if (!variable) continue
    const existingIndex = form.value.userProfileVariableDescriptors.findIndex(v => v.name === variable.name)
    if (existingIndex !== -1) {
      form.value.userProfileVariableDescriptors[existingIndex] = JSON.parse(JSON.stringify(variable))
      overwrittenCount++
    } else {
      form.value.userProfileVariableDescriptors.push(JSON.parse(JSON.stringify(variable)))
    }
    pastedCount++
  }
  showVariablesPasteModal.value = false
  clipboardVariables.value = null
  closeVariablesPasteModal()
  if (pastedCount > 0) {
    const message = overwrittenCount > 0
      ? `Successfully pasted ${pastedCount} variable(s) (${overwrittenCount} overwritten)`
      : `Successfully pasted ${pastedCount} variable(s)`
    alert(message)
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
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Global Memory</h1>
        <p class="page-subtitle">Configure user profile schema and project constants</p>
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

    <!-- Rounded panel -->
    <div class="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">

      <!-- Archived banner -->
      <div v-if="projectIsArchived" class="alert-warning rounded-none border-x-0 border-t-0 mb-0">
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
      <div v-else class="bg-white dark:bg-gray-800">
        <div class="mx-auto">
          <!-- Tabs -->
          <div class="tabs-container">
            <TabNavigator v-model="activeTab" :tabs="tabs" />
          </div>

          <fieldset :disabled="projectIsArchived" class="border-0 p-0 m-0 min-w-0 w-full">
            <!-- User Profile Tab -->
            <div v-show="activeTab === 'userProfile'" class="tab-content">
              <div v-if="error" class="alert-error mb-6">
                {{ error }}
              </div>

              <div class="form-group mb-6">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="form.autoCreateUsers"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="isLoading"
                  />
                  <span class="form-label mb-0">Automatically create users</span>
                </label>
                <p class="form-help-text mt-1 ml-7">
                  When enabled, users are automatically created on first connection if they do not exist, using the provided user ID and an empty profile
                </p>
              </div>

              <div v-if="duplicateVariableNames.length > 0" class="alert-error mb-4">
                <AlertTriangle class="inline-block mr-2 w-4 h-4" />
                Duplicate variable names detected: <strong>{{ duplicateVariableNames.join(', ') }}</strong>. Variable names must be unique within each level.
              </div>

              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Memory Variables</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Define the schema for user profile variables available in conversations of this project
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="copyAllVariables"
                    class="btn-secondary"
                    :disabled="isLoading || form.userProfileVariableDescriptors.length === 0"
                    title="Copy all variables to clipboard"
                  >
                    <Clipboard class="inline-block mr-1 w-4 h-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    @click="pasteVariables"
                    class="btn-secondary"
                    :disabled="isLoading"
                    title="Paste variables from clipboard"
                  >
                    <ClipboardPaste class="inline-block mr-1 w-4 h-4" />
                    Paste
                  </button>
                  <button
                    type="button"
                    @click="addRootVariable"
                    class="btn-primary"
                    :disabled="isLoading"
                  >
                    <Plus class="inline-block mr-1 w-4 h-4" />
                    Add Variable
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="form.userProfileVariableDescriptors.length === 0" class="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-gray-500 dark:text-gray-400 mb-4">No user profile variable descriptors defined yet</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  Click "Add Variable" to define your first variable
                </p>
              </div>

              <!-- Tree View -->
              <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <template v-for="(descriptor, index) in form.userProfileVariableDescriptors" :key="index">
                    <VariableTreeNode
                      :descriptor="descriptor"
                      :path="[index]"
                      :expanded-nodes="expandedNodes"
                      @toggle="toggleNode"
                      @update-name="updateVariableName"
                      @update-type="updateVariableType"
                      @delete="deleteVariable"
                      @add-nested="addNestedVariable"
                    />
                  </template>
                </div>
              </div>
            </div>

            <!-- Constants Tab -->
            <div v-show="activeTab === 'constants'" class="tab-content">
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
    </div><!-- end rounded panel -->

    <!-- Variables Paste Modal -->
    <VariablesPasteModal
      v-if="showVariablesPasteModal && clipboardVariables"
      :clipboard-variables="clipboardVariables"
      :existing-names="form.userProfileVariableDescriptors.map(v => v.name)"
      @close="closeVariablesPasteModal"
      @save="handleVariablesPaste"
    />
  </div>
</template>
