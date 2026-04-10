<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Plus, Clipboard, ClipboardPaste, Pencil, Copy, Trash2, Search, X, ChevronDown } from 'lucide-vue-next'
import type { StageAction, ParsedError, ClassifierResponse } from '@/api/types'
import { useTableSort } from '@/composables'
import StageActionModal from '@/components/modals/StageActionModal.vue'
import ActionDuplicateModal from '@/components/modals/ActionDuplicateModal.vue'
import ActionsPasteModal from '@/components/modals/ActionsPasteModal.vue'

const LIFECYCLE_ACTIONS = {
  ON_ENTER: '__on_enter',
  ON_LEAVE: '__on_leave',
  ON_FALLBACK: '__on_fallback',
} as const

function isLifecycleAction(key: string): boolean {
  return Object.values(LIFECYCLE_ACTIONS).includes(key as any)
}

const model = defineModel<Record<string, StageAction>>({ required: true })

const props = defineProps<{
  classifiers: ClassifierResponse[]
  stageVariables: any[]
  projectConstants: Record<string, any>
  isLoading: boolean
}>()

const showActionModal = ref(false)
const editingActionKey = ref<string | null>(null)
const editingAction = ref<StageAction | null>(null)
const actionModalError = ref<ParsedError | null>(null)
const showDuplicateModal = ref(false)
const duplicatingActionKey = ref<string | null>(null)

const showPasteModal = ref(false)
const clipboardActions = ref<Record<string, StageAction> | null>(null)

const actionsSearchQuery = ref('')
const actionsClassifierFilter = ref('')
const showClassifierDropdown = ref(false)

const { sortKey: actionsSortKey, sortOrder: actionsSortOrder, toggleSort: toggleActionsSort, getSortIcon: getActionsSortIcon } = useTableSort('sort-stage-actions')

const actionParametersForCompletion = computed(() => {
  const result: Record<string, any[]> = {}
  for (const [key, action] of Object.entries(model.value)) {
    if (!isLifecycleAction(key) && action.parameters && action.parameters.length > 0) {
      result[action.name] = action.parameters
    }
  }
  return result
})

const classifierNameById = computed(() => {
  const map: Record<string, string> = {}
  for (const c of props.classifiers) {
    map[c.id] = c.name
  }
  return map
})

const currentClassifierFilterLabel = computed(() => {
  if (!actionsClassifierFilter.value) return 'All Classifiers'
  if (actionsClassifierFilter.value === '__default') return 'Default'
  return classifierNameById.value[actionsClassifierFilter.value] ?? actionsClassifierFilter.value
})

const actionsClassifierOptions = computed(() => {
  const ids = new Set<string | null>()
  for (const [key, action] of Object.entries(model.value)) {
    if (!isLifecycleAction(key)) {
      ids.add(action.overrideClassifierId ?? null)
    }
  }
  const options: { value: string; label: string }[] = []
  if (ids.has(null)) {
    options.push({ value: '__default', label: 'Default' })
  }
  for (const id of ids) {
    if (id !== null) {
      options.push({ value: id, label: classifierNameById.value[id] ?? id })
    }
  }
  return options
})

const actionsList = computed(() => {
  const query = actionsSearchQuery.value.toLowerCase().trim()
  const classifierFilter = actionsClassifierFilter.value
  const list = Object.entries(model.value)
    .filter(([key]) => !isLifecycleAction(key))
    .map(([key, action]) => ({ key, ...action }))
    .filter(action => {
      if (query) {
        const matchesQuery = (
          (action.name || '').toLowerCase().includes(query) ||
          (action.classificationTrigger || '').toLowerCase().includes(query) ||
          (action.overrideClassifierId ? (classifierNameById.value[action.overrideClassifierId] ?? '').toLowerCase().includes(query) : false)
        )
        if (!matchesQuery) return false
      }
      if (classifierFilter) {
        if (classifierFilter === '__default') {
          if (action.overrideClassifierId) return false
        } else {
          if (action.overrideClassifierId !== classifierFilter) return false
        }
      }
      return true
    })

  if (!actionsSortKey.value || !actionsSortOrder.value) return list

  return [...list].sort((a, b) => {
    let comparison = 0
    switch (actionsSortKey.value) {
      case 'key':
        comparison = a.key.localeCompare(b.key)
        break
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      case 'triggers': {
        const countA = (a.triggerOnUserInput ? 1 : 0) + (a.triggerOnClientCommand ? 1 : 0) + (a.triggerOnTransformation ? 1 : 0)
        const countB = (b.triggerOnUserInput ? 1 : 0) + (b.triggerOnClientCommand ? 1 : 0) + (b.triggerOnTransformation ? 1 : 0)
        comparison = countA - countB
        break
      }
      case 'classification':
        comparison = (a.classificationTrigger || '').localeCompare(b.classificationTrigger || '')
        break
      case 'classifier': {
        const nameA = a.overrideClassifierId ? (classifierNameById.value[a.overrideClassifierId] ?? a.overrideClassifierId) : ''
        const nameB = b.overrideClassifierId ? (classifierNameById.value[b.overrideClassifierId] ?? b.overrideClassifierId) : ''
        comparison = nameA.localeCompare(nameB)
        break
      }
      case 'effects':
        comparison = (a.effects?.length || 0) - (b.effects?.length || 0)
        break
    }
    return actionsSortOrder.value === 'asc' ? comparison : -comparison
  })
})

function selectClassifierFilter(value: string) {
  actionsClassifierFilter.value = value
  showClassifierDropdown.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const dropdown = document.querySelector('.classifier-filter-dropdown')
  const button = document.querySelector('.classifier-filter-button')
  if (dropdown && !dropdown.contains(target) && !button?.contains(target)) {
    showClassifierDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

function addAction() {
  editingActionKey.value = null
  editingAction.value = null
  showActionModal.value = true
}

function editAction(key: string) {
  const action = model.value[key]
  if (!action) return
  editingActionKey.value = key
  editingAction.value = action
  showActionModal.value = true
}

function deleteAction(key: string) {
  if (!confirm(`Are you sure you want to delete action "${key}"?`)) return
  const newActions = { ...model.value }
  delete newActions[key]
  model.value = newActions
}

function duplicateAction(key: string) {
  const action = model.value[key]
  if (!action) return
  duplicatingActionKey.value = key
  showDuplicateModal.value = true
}

function handleActionDuplicate(data: { name: string }) {
  if (!duplicatingActionKey.value) return
  const originalAction = model.value[duplicatingActionKey.value]
  if (!originalAction) return

  const newActions = { ...model.value }
  newActions[crypto.randomUUID()] = { ...originalAction, name: data.name }
  model.value = newActions

  duplicatingActionKey.value = null
  showDuplicateModal.value = false
}

function handleActionSave(data: { key: string; action: StageAction }) {
  const duplicate = Object.entries(model.value).find(
    ([key, action]) => key !== data.key && action.name === data.action.name
  )
  if (duplicate) {
    actionModalError.value = { message: `An action with name "${data.action.name}" already exists. Please choose a different name.` }
    return
  }
  const newActions = { ...model.value }
  newActions[data.key] = data.action
  model.value = newActions
  showActionModal.value = false
  actionModalError.value = null
}

function copyAllActions() {
  const regularActions: Record<string, StageAction> = {}
  for (const [key, action] of Object.entries(model.value)) {
    if (!isLifecycleAction(key)) {
      regularActions[key] = action
    }
  }

  if (Object.keys(regularActions).length === 0) {
    alert('No actions to copy')
    return
  }

  try {
    const jsonData = JSON.stringify(regularActions, null, 2)
    navigator.clipboard.writeText(jsonData)
    alert(`Copied ${Object.keys(regularActions).length} action(s) to clipboard`)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alert('Failed to copy actions to clipboard')
  }
}

async function pasteActions() {
  try {
    const clipboardText = await navigator.clipboard.readText()

    if (!clipboardText) {
      alert('Clipboard is empty')
      return
    }

    let parsedActions: Record<string, StageAction>
    try {
      parsedActions = JSON.parse(clipboardText)
    } catch (err) {
      alert('Clipboard does not contain valid JSON data')
      return
    }

    if (!parsedActions || typeof parsedActions !== 'object') {
      alert('Clipboard does not contain valid actions data')
      return
    }

    clipboardActions.value = parsedActions
    showPasteModal.value = true
  } catch (err) {
    console.error('Failed to read clipboard:', err)
    alert('Failed to read from clipboard. Please make sure you have clipboard permissions.')
  }
}

function handleActionsPaste(keys: string[]) {
  if (!clipboardActions.value) return

  const newActions = { ...model.value }
  let pastedCount = 0
  let overwrittenCount = 0

  for (const key of keys) {
    if (clipboardActions.value[key]) {
      const isOverwrite = !!newActions[key] && !isLifecycleAction(key)
      newActions[key] = clipboardActions.value[key]!
      pastedCount++
      if (isOverwrite) overwrittenCount++
    }
  }

  model.value = newActions
  showPasteModal.value = false
  clipboardActions.value = null

  if (pastedCount > 0) {
    const message = overwrittenCount > 0
      ? `Successfully pasted ${pastedCount} action(s) (${overwrittenCount} overwritten)`
      : `Successfully pasted ${pastedCount} action(s)`
    alert(message)
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Stage Actions</h3>
      <p class="text-sm text-gray-600 mt-1">
        Define custom actions that can be triggered during conversations
      </p>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        @click="copyAllActions"
        class="btn-secondary"
        :disabled="isLoading || actionsList.length === 0"
        title="Copy all actions to clipboard"
      >
        <Clipboard class="inline-block mr-1 w-4 h-4" />
        Copy
      </button>
      <button
        type="button"
        @click="pasteActions"
        class="btn-secondary"
        :disabled="isLoading"
        title="Paste actions from clipboard"
      >
        <ClipboardPaste class="inline-block mr-1 w-4 h-4" />
        Paste
      </button>
      <button
        type="button"
        @click="addAction"
        class="btn-primary"
        :disabled="isLoading"
      >
        <Plus class="inline-block mr-1 w-4 h-4" />
        Add Action
      </button>
    </div>
  </div>

  <div class="mb-6 flex items-center gap-3">
    <div class="relative">
      <button
        type="button"
        @click="showClassifierDropdown = !showClassifierDropdown"
        class="classifier-filter-button filter-btn shadow-none!"
      >
        <span>{{ currentClassifierFilterLabel }}</span>
        <ChevronDown class="w-4 h-4 ml-2" />
      </button>
      <div v-if="showClassifierDropdown" class="classifier-filter-dropdown filter-dropdown-panel min-w-50">
        <button
          type="button"
          @click="selectClassifierFilter('')"
          class="filter-dropdown-item"
          :class="{ 'filter-dropdown-item-active': actionsClassifierFilter === '' }"
        >
          All Classifiers
        </button>
        <button
          v-for="opt in actionsClassifierOptions"
          :key="opt.value"
          type="button"
          @click="selectClassifierFilter(opt.value)"
          class="filter-dropdown-item"
          :class="{ 'filter-dropdown-item-active': actionsClassifierFilter === opt.value }"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div class="relative min-w-25 grow">
      <Search class="input-icon-left" />
      <input
        v-model="actionsSearchQuery"
        type="text"
        placeholder="Search by name or classification..."
        class="search-input"
      />
      <button
        v-if="actionsSearchQuery"
        type="button"
        @click="actionsSearchQuery = ''"
        class="input-icon-right"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>

  <div v-if="actionsList.length === 0" class="text-center py-12">
    <p class="text-gray-500 mb-4">{{ actionsSearchQuery || actionsClassifierFilter ? 'No actions match your filters' : 'No actions defined yet' }}</p>
  </div>

  <div v-else class="table-container">
    <div class="table-wrapper">
      <table class="table">
        <thead class="table-header">
          <tr>
            <th class="table-header-cell-sortable" @click="toggleActionsSort('name')">
              <div class="flex items-center gap-1">
                Name
                <component :is="getActionsSortIcon('name')" class="w-4 h-4" :class="actionsSortKey === 'name' ? 'text-primary-600' : 'text-gray-400'" />
              </div>
            </th>
            <th class="table-header-cell-sortable" @click="toggleActionsSort('triggers')">
              <div class="flex items-center gap-1">
                Triggers
                <component :is="getActionsSortIcon('triggers')" class="w-4 h-4" :class="actionsSortKey === 'triggers' ? 'text-primary-600' : 'text-gray-400'" />
              </div>
            </th>
            <th class="table-header-cell-sortable" @click="toggleActionsSort('classification')">
              <div class="flex items-center gap-1">
                Classification
                <component :is="getActionsSortIcon('classification')" class="w-4 h-4" :class="actionsSortKey === 'classification' ? 'text-primary-600' : 'text-gray-400'" />
              </div>
            </th>
            <th class="table-header-cell-sortable" @click="toggleActionsSort('classifier')">
              <div class="flex items-center gap-1">
                Classifier
                <component :is="getActionsSortIcon('classifier')" class="w-4 h-4" :class="actionsSortKey === 'classifier' ? 'text-primary-600' : 'text-gray-400'" />
              </div>
            </th>
            <th class="table-header-cell-sortable" @click="toggleActionsSort('effects')">
              <div class="flex items-center gap-1">
                Effects
                <component :is="getActionsSortIcon('effects')" class="w-4 h-4" :class="actionsSortKey === 'effects' ? 'text-primary-600' : 'text-gray-400'" />
              </div>
            </th>
            <th class="table-header-cell-right">Actions</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr v-for="action in actionsList" :key="action.key" class="table-row">
            <td class="table-clickable-cell" @click="editAction(action.key)">
              {{ action.name }}
            </td>
            <td class="table-cell">
              <div class="flex flex-col gap-1">
                <span v-if="action.triggerOnUserInput" class="badge-primary text-xs whitespace-nowrap">User Input</span>
                <span v-if="action.triggerOnClientCommand" class="badge-primary text-xs whitespace-nowrap">Client Command</span>
                <span v-if="action.triggerOnTransformation" class="badge-primary text-xs whitespace-nowrap">Transformation</span>
              </div>
            </td>
            <td class="table-cell">
              <code v-if="action.classificationTrigger" class="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-700 dark:text-gray-300">
                {{ action.classificationTrigger }}
              </code>
              <span v-else class="text-gray-400 text-sm">—</span>
            </td>
            <td class="table-cell">
              <span v-if="action.overrideClassifierId" class="text-sm text-gray-700 dark:text-gray-300">
                {{ classifierNameById[action.overrideClassifierId] ?? action.overrideClassifierId }}
              </span>
              <span v-else class="text-gray-400 text-sm">Default</span>
            </td>
            <td class="table-cell-muted">
              {{ action.effects?.length || 0 }}
            </td>
            <td class="table-cell-right">
              <div class="flex-end">
                <button
                  type="button"
                  @click="editAction(action.key)"
                  class="btn-secondary btn-sm"
                  :disabled="isLoading"
                  title="Edit action"
                >
                  <Pencil class="inline-block w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="duplicateAction(action.key)"
                  class="btn-secondary btn-sm"
                  :disabled="isLoading"
                  title="Duplicate action"
                >
                  <Copy class="inline-block w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="deleteAction(action.key)"
                  class="btn-danger btn-sm"
                  :disabled="isLoading"
                  title="Delete action"
                >
                  <Trash2 class="inline-block w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <StageActionModal
    v-if="showActionModal"
    :action="editingAction"
    :editing-key="editingActionKey"
    :is-lifecycle-action="false"
    :stage-variables="stageVariables"
    :action-parameters="actionParametersForCompletion"
    :project-constants="projectConstants"
    :error="actionModalError"
    @close="showActionModal = false; actionModalError = null"
    @save="handleActionSave"
  />

  <ActionDuplicateModal
    v-if="showDuplicateModal && duplicatingActionKey"
    :original-key="duplicatingActionKey"
    :original-name="model[duplicatingActionKey]?.name || ''"
    :existing-names="Object.values(model).map(a => a.name)"
    @close="showDuplicateModal = false"
    @save="handleActionDuplicate"
  />

  <ActionsPasteModal
    v-if="showPasteModal && clipboardActions"
    :clipboard-actions="clipboardActions"
    :existing-keys="Object.keys(model).filter(k => !isLifecycleAction(k))"
    @close="showPasteModal = false"
    @save="handleActionsPaste"
  />
</template>
