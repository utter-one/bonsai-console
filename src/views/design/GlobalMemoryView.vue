<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { Save, Check, Plus, Clipboard, ClipboardPaste, AlertTriangle } from 'lucide-vue-next'
import VariableTreeNode from '@/components/VariableTreeNode.vue'
import VariablesPasteModal from '@/components/modals/VariablesPasteModal.vue'
import type { ProjectResponse } from '@/api/types'

const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const { projectIsArchived } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const currentProject = ref<ProjectResponse | null>(null)

const showVariablesPasteModal = ref(false)
const clipboardVariables = ref<Array<any> | null>(null)

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

watch(projectId, () => {
  loadProject()
})

onMounted(() => {
  loadProject()
})

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
    })

    currentProject.value = updated
    form.value.version = updated.version

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save memory configuration'
  } finally {
    isLoading.value = false
  }
}

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

function copyAllVariables() {
  if (form.value.userProfileVariableDescriptors.length === 0) {
    alert('No variables to copy')
    return
  }
  try {
    const jsonData = JSON.stringify(form.value.userProfileVariableDescriptors, null, 2)
    navigator.clipboard.writeText(jsonData)
    alert(`Copied ${form.value.userProfileVariableDescriptors.length} variable(s) to clipboard`)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alert('Failed to copy variables to clipboard')
  }
}

async function pasteVariables() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (!clipboardText) { alert('Clipboard is empty'); return }
    let parsedVariables: Array<any>
    try {
      parsedVariables = JSON.parse(clipboardText)
    } catch {
      alert('Clipboard does not contain valid JSON data'); return
    }
    if (!Array.isArray(parsedVariables)) {
      alert('Clipboard does not contain valid variables data (must be an array)'); return
    }
    clipboardVariables.value = parsedVariables
    showVariablesPasteModal.value = true
  } catch (err) {
    console.error('Failed to read clipboard:', err)
    alert('Failed to read from clipboard. Please make sure you have clipboard permissions.')
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
  if (pastedCount > 0) {
    const message = overwrittenCount > 0
      ? `Successfully pasted ${pastedCount} variable(s) (${overwrittenCount} overwritten)`
      : `Successfully pasted ${pastedCount} variable(s)`
    alert(message)
  }
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">Global Memory</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Configure user profile variable schema and memory settings for this project
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
          </fieldset>
        </div>
      </div>
    </div>

    <!-- Variables Paste Modal -->
    <VariablesPasteModal
      v-if="showVariablesPasteModal && clipboardVariables"
      :clipboard-variables="clipboardVariables"
      :existing-names="form.userProfileVariableDescriptors.map(v => v.name)"
      @close="showVariablesPasteModal = false"
      @save="handleVariablesPaste"
    />
</template>
