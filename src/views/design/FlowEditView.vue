<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlowsStore, useToolsStore, useProjectSelectionStore, useClassifiersStore, useStagesStore } from '@/stores'
import { ArrowLeft, Save, Plus, Pencil, Trash2, Check, Hammer } from 'lucide-vue-next'
import type { FlowResponse, StageAction } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import StageActionModal from '@/components/modals/StageActionModal.vue'
import ActionDuplicateModal from '@/components/modals/ActionDuplicateModal.vue'

const route = useRoute()
const router = useRouter()
const flowsStore = useFlowsStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()
const classifiersStore = useClassifiersStore()
const stagesStore = useStagesStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'actions' | 'tools' | 'metadata'>('basic')
const showActionModal = ref(false)
const showDuplicateModal = ref(false)
const editingActionKey = ref<string | null>(null)
const editingAction = ref<StageAction | null>(null)
const duplicatingActionKey = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  actions: {} as Record<string, StageAction>,
  toolIds: [] as string[],
  metadata: {} as Record<string, any>
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const flowId = computed(() => route.params.flowId as string | undefined)
const isEditMode = computed(() => !!flowId.value)
const currentFlow = ref<FlowResponse | null>(null)

const actionsList = computed(() =>
  Object.entries(form.value.actions).map(([key, action]) => ({ key, ...action }))
)

const metadataFields = computed(() => {
  if (!currentFlow.value) return []
  const customFields = Object.entries(currentFlow.value.metadata || {}).map(([key, value]) => ({
    label: key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
    format: 'mono' as const,
  }))
  return [
    { label: 'Flow ID', value: currentFlow.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentFlow.value.projectId, format: 'mono' as const },
    { label: 'Version', value: String(currentFlow.value.version) },
    { label: 'Created', value: currentFlow.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentFlow.value.updatedAt, format: 'date' as const },
    ...customFields,
  ]
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    toolsStore.fetchAll(projectId.value),
    classifiersStore.fetchAll(projectId.value),
    stagesStore.fetchAll(projectId.value),
  ])

  if (isEditMode.value) {
    await loadFlow()
  }
})

// Methods
async function loadFlow() {
  if (!flowId.value) return

  isLoading.value = true
  error.value = null

  try {
    currentFlow.value = await flowsStore.fetchById(projectId.value, flowId.value)
    if (currentFlow.value) {
      form.value = {
        name: currentFlow.value.name,
        description: currentFlow.value.description || '',
        actions: { ...(currentFlow.value.actions || {}) },
        toolIds: [...(currentFlow.value.toolIds || [])],
        metadata: currentFlow.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load flow'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentFlow.value) {
      const updated = await flowsStore.update(projectId.value, currentFlow.value.id, {
        version: currentFlow.value.version,
        name: form.value.name,
        description: form.value.description || null,
        actions: form.value.actions,
        toolIds: form.value.toolIds,
        metadata: form.value.metadata
      })
      currentFlow.value = updated
    } else {
      const created = await flowsStore.create(projectId.value, {
        name: form.value.name,
        description: form.value.description || null,
        actions: form.value.actions,
        toolIds: form.value.toolIds,
        metadata: form.value.metadata
      })
      router.replace({ name: 'design.flows.edit', params: { projectId: projectId.value, flowId: created.id } })
      currentFlow.value = created
    }
    showSuccess.value = true
    setTimeout(() => showSuccess.value = false, 2000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save flow'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.flows', params: { projectId: projectId.value } })
}

// Action management
function addAction() {
  editingActionKey.value = null
  editingAction.value = null
  showActionModal.value = true
}

function editAction(key: string) {
  const action = form.value.actions[key]
  if (!action) return
  editingActionKey.value = key
  editingAction.value = action
  showActionModal.value = true
}

function deleteAction(key: string) {
  if (!confirm(`Delete action "${key}"?`)) return
  const newActions = { ...form.value.actions }
  delete newActions[key]
  form.value.actions = newActions
}

function duplicateAction(key: string) {
  duplicatingActionKey.value = key
  showDuplicateModal.value = true
}

function handleActionSave(data: { key: string; action: StageAction }) {
  const newActions = { ...form.value.actions }
  if (editingActionKey.value && editingActionKey.value !== data.key) {
    delete newActions[editingActionKey.value]
  }
  newActions[data.key] = data.action
  form.value.actions = newActions
  showActionModal.value = false
  editingAction.value = null
  editingActionKey.value = null
}

function handleActionDuplicate(data: { key: string; name: string }) {
  if (!duplicatingActionKey.value) return
  const originalAction = form.value.actions[duplicatingActionKey.value]
  if (!originalAction) return
  if (form.value.actions[data.key]) {
    alert(`Action with key "${data.key}" already exists.`)
    return
  }
  const newActions = { ...form.value.actions }
  newActions[data.key] = { ...originalAction, name: data.name }
  form.value.actions = newActions
  duplicatingActionKey.value = null
  showDuplicateModal.value = false
}

// Tool selection
function toggleTool(toolId: string) {
  const idx = form.value.toolIds.indexOf(toolId)
  if (idx === -1) {
    form.value.toolIds = [...form.value.toolIds, toolId]
  } else {
    form.value.toolIds = form.value.toolIds.filter(id => id !== toolId)
  }
}

function isToolSelected(toolId: string) {
  return form.value.toolIds.includes(toolId)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to flows">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Flow' : 'Create Flow' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the flow configuration' : 'Define a new flow for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">Cancel</button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Flow')) }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          Basic Information
        </button>
        <button
          @click="activeTab = 'actions'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'actions' }]"
          type="button"
        >
          Actions
        </button>
        <button
          @click="activeTab = 'tools'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'tools' }]"
          type="button"
        >
          Tools
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'metadata'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]"
          type="button"
        >
          Metadata
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !currentFlow && isEditMode" class="loading-state">
      Loading flow...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode && !currentFlow" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">Back to Flows</button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <!-- Error Message -->
          <div v-if="error" class="alert-error mb-6">{{ error }}</div>

          <!-- Basic Information Tab -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Name <span class="text-red-500">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Flow name"
                :disabled="isLoading"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input
                v-model="form.description"
                type="text"
                class="form-input"
                placeholder="Optional description"
                :disabled="isLoading"
              />
            </div>
          </div>

          <!-- Actions Tab -->
          <div v-show="activeTab === 'actions'" class="tab-content">
          <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Flow Actions</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define actions that can be triggered within this flow
              </p>
            </div>
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

          <div v-if="actionsList.length === 0" class="text-center py-12">
            <p class="text-gray-500 mb-4">No actions defined yet</p>
          </div>

          <div v-else class="table-container">
            <div class="table-wrapper">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th class="table-header-cell">Key</th>
                    <th class="table-header-cell">Name</th>
                    <th class="table-header-cell">Triggers</th>
                    <th class="table-header-cell">Classification</th>
                    <th class="table-header-cell">Effects</th>
                    <th class="table-header-cell-right">Operations</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr v-for="action in actionsList" :key="action.key" class="table-row">
                    <td class="table-cell">
                      <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-700 dark:text-gray-300">
                        {{ action.key }}
                      </code>
                    </td>
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
                          Duplicate
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
          </div>

          <!-- Tools Tab -->
          <div v-show="activeTab === 'tools'" class="tab-content">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Flow Tools</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select the tools available within this flow
              </p>
            </div>

            <div v-if="toolsStore.isLoading" class="loading-state">
              Loading tools...
            </div>

            <div v-else-if="toolsStore.items.length === 0" class="text-center py-12">
              <Hammer class="mx-auto mb-3 text-gray-400 w-12 h-12" />
              <p class="text-gray-500">No tools available in this project</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                v-for="tool in toolsStore.items"
                :key="tool.id"
                class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                :class="isToolSelected(tool.id)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
              >
                <input
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                  :checked="isToolSelected(tool.id)"
                  @change="toggleTool(tool.id)"
                />
                <div class="min-w-0">
                  <p class="font-medium text-sm text-gray-900 dark:text-white">{{ tool.name }}</p>
                  <p v-if="tool.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {{ tool.description }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ tool.id }}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentFlow"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
        </form>
      </div>
    </div>

    <!-- Action Modal -->
    <StageActionModal
      v-if="showActionModal"
      :action="editingAction"
      :editing-key="editingActionKey"
      @close="showActionModal = false; editingAction = null; editingActionKey = null"
      @save="handleActionSave"
    />

    <!-- Duplicate Modal -->
    <ActionDuplicateModal
      v-if="showDuplicateModal"
      :original-key="duplicatingActionKey || ''"
      :original-name="duplicatingActionKey ? (form.actions[duplicatingActionKey]?.name || '') : ''"
      @close="showDuplicateModal = false; duplicatingActionKey = null"
      @save="handleActionDuplicate"
    />
  </div>
</template>
