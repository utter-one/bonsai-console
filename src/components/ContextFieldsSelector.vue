<template>
  <div class="flex flex-col gap-4">
    <!-- Loading -->
    <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
      Loading stages...
    </div>

    <!-- No stages -->
    <div
      v-else-if="allStages.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8"
    >
      No stages found for this project.
    </div>

    <template v-else>
      <!-- Stage selector -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Stage
        </label>
        <div class="flex items-center gap-2">
          <select
            :value="selectedStageId"
            @change="handleStageChange($event)"
            class="form-select-auto min-w-64"
          >
            <option value="">— Select a stage —</option>
            <option
              v-for="stage in allStages"
              :key="stage.id"
              :value="stage.id"
              :disabled="stage.variableDescriptors.length === 0"
            >
              {{ stage.name }}{{ stage.variableDescriptors.length === 0 ? ' (no variables)' : '' }}
            </option>
          </select>
          <button
            v-if="selectedStageId"
            type="button"
            class="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
            title="Clear stage selection"
            @click="clearStage"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- No variables in selected stage -->
      <div
        v-if="selectedStageId && selectedStage && selectedStage.variableDescriptors.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-6 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        This stage has no variables defined.
      </div>

      <!-- Variable tree -->
      <div
        v-else-if="selectedStage"
        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        <!-- Toolbar: select / clear all -->
        <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ modelValue.length }} of {{ topLevelCount }} top-level field{{ topLevelCount !== 1 ? 's' : '' }} selected
          </span>
          <div class="flex gap-3">
            <button
              type="button"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              @click="selectAll"
            >
              Select all
            </button>
            <button
              v-if="modelValue.length > 0"
              type="button"
              class="text-xs text-gray-500 dark:text-gray-400 hover:underline"
              @click="clearAll"
            >
              Clear all
            </button>
          </div>
        </div>
        <div class="py-1">
          <ContextFieldNode
            v-for="(descriptor, i) in selectedStage.variableDescriptors"
            :key="i"
            :descriptor="descriptor"
            :path="descriptor.name"
            :selected-paths="modelValue"
            :level="0"
            :inside-array="false"
            @toggle-path="togglePath"
          />
        </div>
      </div>

      <!-- Placeholder when no stage is selected yet -->
      <div
        v-else
        class="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
      >
        Select a stage above to browse its variables.
      </div>

      <!-- Selected fields summary -->
      <div v-if="modelValue.length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Selected fields
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="field in modelValue"
            :key="field"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-md text-sm font-mono"
          >
            {{ field }}
            <button
              type="button"
              @click="togglePath(field)"
              class="hover:text-blue-600 dark:hover:text-blue-100 transition-colors leading-none"
              title="Remove"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useStagesStore } from '@/stores'
import type { StageResponse, ListParams, FieldDescriptor } from '@/api/types'
import ContextFieldNode from '@/components/ContextFieldNode.vue'

const props = defineProps<{
  modelValue: string[]
  projectId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const stagesStore = useStagesStore()
const isLoading = ref(false)
const allStages = ref<StageResponse[]>([])
const selectedStageId = ref('')

const selectedStage = computed(() =>
  allStages.value.find(s => s.id === selectedStageId.value) ?? null
)

const topLevelCount = computed(() =>
  selectedStage.value?.variableDescriptors.length ?? 0
)

async function loadStages() {
  if (!props.projectId) return
  isLoading.value = true
  try {
    await stagesStore.fetchAll(props.projectId, {
      limit: 200,
    } as ListParams)
    allStages.value = stagesStore.items.slice()
  } catch {
    // silently fail
  } finally {
    isLoading.value = false
  }
}

function handleStageChange(event: Event) {
  const newId = (event.target as HTMLSelectElement).value
  if (newId === selectedStageId.value) return

  if (props.modelValue.length > 0) {
    const ok = confirm('Switching stages will clear your current field selection. Continue?')
    if (!ok) {
      ;(event.target as HTMLSelectElement).value = selectedStageId.value
      return
    }
    emit('update:modelValue', [])
  }
  selectedStageId.value = newId
}

function clearStage() {
  if (props.modelValue.length > 0) {
    const ok = confirm('This will also clear your current field selection. Continue?')
    if (!ok) return
    emit('update:modelValue', [])
  }
  selectedStageId.value = ''
}

function getDescriptorByPath(path: string, topLevelDescriptors: FieldDescriptor[]): FieldDescriptor | null {
  const parts = path.split('.')
  let currentDescriptors = topLevelDescriptors
  let current: FieldDescriptor | null = null
  for (const part of parts) {
    const found = currentDescriptors.find(d => d.name === part)
    if (!found) return null
    current = found
    currentDescriptors = found.objectSchema ?? []
  }
  return current
}

function collapseIfNeeded(paths: string[], descriptors: FieldDescriptor[], parentPath: string): string[] {
  let result = [...paths]
  for (const descriptor of descriptors) {
    const currentPath = parentPath ? `${parentPath}.${descriptor.name}` : descriptor.name
    if (descriptor.type === 'object' && descriptor.objectSchema?.length) {
      result = collapseIfNeeded(result, descriptor.objectSchema, currentPath)
      const childPaths = descriptor.objectSchema.map(c => `${currentPath}.${c.name}`)
      if (childPaths.length > 0 && childPaths.every(cp => result.includes(cp))) {
        result = result.filter(p => !childPaths.includes(p))
        if (!result.includes(currentPath)) result.push(currentPath)
      }
    }
  }
  return result
}

function expandToExclude(ancestorPath: string, targetPath: string, topLevelDescriptors: FieldDescriptor[]): string[] {
  const ancestorDescriptor = getDescriptorByPath(ancestorPath, topLevelDescriptors)
  if (!ancestorDescriptor?.objectSchema?.length) return []
  const result: string[] = []
  for (const child of ancestorDescriptor.objectSchema) {
    const childPath = `${ancestorPath}.${child.name}`
    if (childPath === targetPath) {
      // Don't include: this is the path being unchecked
    } else if (targetPath.startsWith(childPath + '.')) {
      // Target is deeper inside this child: recurse
      result.push(...expandToExclude(childPath, targetPath, topLevelDescriptors))
    } else {
      result.push(childPath)
    }
  }
  return result
}

function togglePath(path: string) {
  const current = [...props.modelValue]
  const descriptors = selectedStage.value?.variableDescriptors ?? []

  const directIdx = current.indexOf(path)
  const ancestorPath = current.find(sp => path.startsWith(sp + '.'))

  if (directIdx >= 0) {
    current.splice(directIdx, 1)
    emit('update:modelValue', current)
  } else if (ancestorPath !== undefined) {
    // Path is implicitly selected via ancestor: expand ancestor to exclude this path
    const ancestorIdx = current.indexOf(ancestorPath)
    current.splice(ancestorIdx, 1)
    const expanded = expandToExclude(ancestorPath, path, descriptors)
    expanded.forEach(p => { if (!current.includes(p)) current.push(p) })
    emit('update:modelValue', current)
  } else {
    // Not selected (or indeterminate): remove any descendant paths, then add this path
    const withoutDescendants = current.filter(p => !p.startsWith(path + '.'))
    withoutDescendants.push(path)
    const normalized = collapseIfNeeded(withoutDescendants, descriptors, '')
    emit('update:modelValue', normalized)
  }
}

function selectAll() {
  if (!selectedStage.value) return
  emit('update:modelValue', selectedStage.value.variableDescriptors.map(d => d.name))
}

function clearAll() {
  emit('update:modelValue', [])
}

onMounted(() => loadStages())
watch(() => props.projectId, () => {
  selectedStageId.value = ''
  emit('update:modelValue', [])
  loadStages()
})
</script>
