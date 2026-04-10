<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Clipboard, ClipboardPaste } from 'lucide-vue-next'
import type { ParsedError, FieldDescriptor } from '@/api/types'
import { useCopyPaste } from '@/composables/useCopyPaste'
import VariableTreeNode from '@/components/VariableTreeNode.vue'
import VariablesPasteModal from '@/components/modals/VariablesPasteModal.vue'
import FormField from '@/components/FormField.vue'

const model = defineModel<FieldDescriptor[]>({ required: true })

const props = defineProps<{
  isLoading: boolean
  error: ParsedError | null
  description?: string
  emptyLabel?: string
}>()

const {
  clipboardData: clipboardVariables,
  showPasteModal: showVariablesPasteModal,
  copyAll: copyAllVariablesBase,
  openPasteModal: openVariablesPasteModal,
  closePasteModal: closeVariablesPasteModal,
} = useCopyPaste<FieldDescriptor>('variable')

function copyAllVariables() {
  copyAllVariablesBase(model.value)
}

async function pasteVariables() {
  await openVariablesPasteModal()
}

function handleVariablesPaste(indices: number[]) {
  if (!clipboardVariables.value) return

  let pastedCount = 0
  let overwrittenCount = 0

  for (const index of indices) {
    const variable = clipboardVariables.value[index]
    if (!variable) continue

    const existingIndex = model.value.findIndex(v => v.name === variable.name)
    if (existingIndex !== -1) {
      model.value[existingIndex] = JSON.parse(JSON.stringify(variable))
      overwrittenCount++
    } else {
      model.value.push(JSON.parse(JSON.stringify(variable)))
    }
    pastedCount++
  }

  closeVariablesPasteModal()

  if (pastedCount > 0) {
    const message = overwrittenCount > 0
      ? `Successfully pasted ${pastedCount} variable(s) (${overwrittenCount} overwritten)`
      : `Successfully pasted ${pastedCount} variable(s)`
    alert(message)
  }
}

const expandedNodes = ref<Set<string>>(new Set())
const variableErrorPaths = ref<Map<string, string>>(new Map())

function validateVariablesRecursive(
  descriptors: Array<{ name: string; objectSchema?: any[] }>,
  pathPrefix: string,
  errorPaths: Map<string, string>
): void {
  const nameCounts = new Map<string, number[]>()
  for (let i = 0; i < descriptors.length; i++) {
    const name = descriptors[i]!.name?.trim() || ''
    if (!nameCounts.has(name)) nameCounts.set(name, [])
    nameCounts.get(name)!.push(i)
  }
  for (let i = 0; i < descriptors.length; i++) {
    const d = descriptors[i]!
    const pathKey = pathPrefix ? `${pathPrefix}-${i}` : `${i}`
    const name = d.name?.trim() || ''
    if (!name) {
      errorPaths.set(pathKey, 'Name is required.')
    } else if (nameCounts.get(name)!.length > 1) {
      errorPaths.set(pathKey, 'Duplicate name.')
    }
    if (d.objectSchema && d.objectSchema.length > 0) {
      validateVariablesRecursive(d.objectSchema, pathKey, errorPaths)
    }
  }
}

function validate(): boolean {
  const errorPaths = new Map<string, string>()
  validateVariablesRecursive(model.value, '', errorPaths)
  variableErrorPaths.value = errorPaths
  return errorPaths.size === 0
}

function getDescriptorByPath(path: number[]): any {
  let current: any = { objectSchema: model.value }
  for (const index of path) {
    current = current.objectSchema[index]
    if (!current) return null
  }
  return current
}

function addRootVariable() {
  model.value.push({
    name: 'new_variable',
    type: 'string',
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
    type: 'string',
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
      model.value.splice(index, 1)
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
defineExpose({ validate })
</script>

<template>
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Memory Variables</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ description ?? 'Click field names to edit, change types inline' }}
      </p>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        @click="copyAllVariables"
        class="btn-secondary"
        :disabled="isLoading || model.length === 0"
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

  <FormField :error="error" path="variableDescriptors" class="w-full">
    <div v-if="model.length === 0" class="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
      <p class="text-gray-500 dark:text-gray-400 mb-4">{{ emptyLabel ?? 'No variable descriptors defined yet' }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">
        Click "Add Variable" to define your first variable
      </p>
    </div>

    <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <template v-for="(descriptor, index) in model" :key="index">
          <VariableTreeNode
            :descriptor="descriptor"
            :path="[index]"
            :expanded-nodes="expandedNodes"
            :error-paths="variableErrorPaths"
            @toggle="toggleNode"
            @update-name="updateVariableName"
            @update-type="updateVariableType"
            @delete="deleteVariable"
            @add-nested="addNestedVariable"
          />
        </template>
      </div>
    </div>
  </FormField>

  <VariablesPasteModal
    v-if="showVariablesPasteModal && clipboardVariables"
    :clipboard-variables="clipboardVariables"
    :existing-names="model.map(v => v.name)"
    @close="closeVariablesPasteModal"
    @save="handleVariablesPaste"
  />
</template>
