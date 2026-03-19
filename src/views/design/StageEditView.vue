<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStagesStore, useAgentsStore, useProvidersStore, useClassifiersStore, useContextTransformersStore, useToolsStore, useProjectSelectionStore, useProjectsStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useTableSort } from '@/composables'
import { ArrowLeft, Save, Plus, Settings, Trash2, CheckCircle, Circle, Copy, Pencil, Clipboard, ClipboardPaste, AlertTriangle, Check, Search, X } from 'lucide-vue-next'
import type { StageResponse, LlmSettings, StageAction } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import LLMSettingsModal from '@/components/modals/LLMSettingsModal.vue'
import LLMModelBadge from '@/components/LLMModelBadge.vue'
import StageActionModal from '@/components/modals/StageActionModal.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import ActionDuplicateModal from '@/components/modals/ActionDuplicateModal.vue'
import ActionsPasteModal from '@/components/modals/ActionsPasteModal.vue'
import VariablesPasteModal from '@/components/modals/VariablesPasteModal.vue'
import VariableTreeNode from '@/components/VariableTreeNode.vue'

// Lifecycle action constants
const LIFECYCLE_ACTIONS = {
  ON_ENTER: '__on_enter',
  ON_LEAVE: '__on_leave',
  ON_FALLBACK: '__on_fallback',
} as const

const LIFECYCLE_ACTION_INFO = {
  [LIFECYCLE_ACTIONS.ON_ENTER]: {
    name: 'On Enter',
    description: 'Executes when entering this stage',
    context: 'on_enter',
  },
  [LIFECYCLE_ACTIONS.ON_LEAVE]: {
    name: 'On Leave',
    description: 'Executes when leaving this stage',
    context: 'on_leave',
  },
  [LIFECYCLE_ACTIONS.ON_FALLBACK]: {
    name: 'On Fallback',
    description: 'Executes when no action matches user input',
    context: 'on_fallback',
  },
} as const

function isLifecycleAction(key: string): boolean {
  return Object.values(LIFECYCLE_ACTIONS).includes(key as any)
}

const route = useRoute()
const router = useRouter()
const stagesStore = useStagesStore()
const agentsStore = useAgentsStore()
const providersStore = useProvidersStore()
const classifiersStore = useClassifiersStore()
const transformersStore = useContextTransformersStore()
const toolsStore = useToolsStore()
const projectSelectionStore = useProjectSelectionStore()
const projectsStore = useProjectsStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const loadError = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'prompt' | 'features' | 'memory' | 'actions' | 'lifecycle' | 'metadata'>('basic')
const showLLMSettingsModal = ref(false)
const showActionModal = ref(false)
const showDuplicateModal = ref(false)
const showPasteModal = ref(false)
const showVariablesPasteModal = ref(false)
const editingActionKey = ref<string | null>(null)
const editingAction = ref<StageAction | null>(null)
const duplicatingActionKey = ref<string | null>(null)
const clipboardActions = ref<Record<string, StageAction> | null>(null)
const actionsSearchQuery = ref('')
const clipboardVariables = ref<Array<any> | null>(null)
const isLifecycleActionKey = ref(false)
const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  agentId: '',
  prompt: `{{agent}}

...

{{#hasItems faq}}
Relevant knowledge:
{{#each faq}}
Q: {{this.question}}
A: {{this.answer}}
{{/each}}
{{/hasItems}}`,
  llmProviderId: '',
  llmSettings: null as LlmSettings | null,
  enterBehavior: 'generate_response' as 'generate_response' | 'await_user_input',
  useKnowledge: false,
  knowledgeTags: [] as string[],
  useGlobalActions: false,
  globalActions: [] as string[],
  variableDescriptors: [] as Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]' | 'image' | 'image[]' | 'audio' | 'audio[]'
    isArray: boolean
    objectSchema?: Array<any>
  }>,
  actions: {} as Record<string, StageAction>,
  defaultClassifierId: '',
  transformerIds: [] as string[],
  metadata: {}
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const stageId = computed(() => route.params.stageId as string | undefined)
const isEditMode = computed(() => !!stageId.value)
const currentStage = ref<StageResponse | null>(null)

const { projectIsArchived } = useProjectReadOnly(currentStage)
const isReadOnly = computed(() => projectIsArchived.value || !!currentStage.value?.archived)

const llmProviders = computed(() => 
  providersStore.items.filter(p => p.providerType === 'llm')
)

const projectAgents = computed(() =>
  agentsStore.items
)

const projectClassifiers = computed(() =>
  classifiersStore.items
)

const projectTransformers = computed(() =>
  transformersStore.items
)

watch(() => form.value.llmProviderId, (newVal) => {
  if (!newVal) {
    form.value.llmSettings = null
  }
})

// Lifecycle
onMounted(async () => {
  // Load related data
  await Promise.all([
    providersStore.fetchAll(),
    agentsStore.fetchAll(projectId.value),
    classifiersStore.fetchAll(projectId.value),
    transformersStore.fetchAll(projectId.value),
    toolsStore.fetchAll(projectId.value),
    projectsStore.fetchById(projectId.value),
  ])
  
  userProfileVariablesForCompletion.value = projectsStore.currentItem?.userProfileVariableDescriptors || []
  
  if (isEditMode.value) {
    await loadStage()
  }
})

// Methods
async function loadStage() {
  if (!stageId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentStage.value = await stagesStore.fetchById(projectId.value, stageId.value)
    if (currentStage.value) {
      form.value = {
        id: currentStage.value.id,
        name: currentStage.value.name,
        description: currentStage.value.description || '',
        tags: currentStage.value.tags || [],
        agentId: currentStage.value.agentId,
        prompt: currentStage.value.prompt,
        llmProviderId: currentStage.value.llmProviderId || '',
        llmSettings: currentStage.value.llmSettings || null,
        enterBehavior: currentStage.value.enterBehavior,
        useKnowledge: currentStage.value.useKnowledge,
        knowledgeTags: currentStage.value.knowledgeTags || [],
        useGlobalActions: currentStage.value.useGlobalActions,
        globalActions: currentStage.value.globalActions || [],
        variableDescriptors: currentStage.value.variableDescriptors || [],
        actions: currentStage.value.actions || {},
        defaultClassifierId: currentStage.value.defaultClassifierId || '',
        transformerIds: currentStage.value.transformerIds || [],
        metadata: currentStage.value.metadata || {}
      }
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load stage'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null

  // Validate required fields
  if (!form.value.llmProviderId) {
    error.value = 'LLM Provider is required. Please select an LLM provider.'
    activeTab.value = 'prompt'
    return
  }

  if (!form.value.llmSettings) {
    error.value = 'LLM Settings are required. Please configure the LLM settings.'
    activeTab.value = 'prompt'
    return
  }

  if (duplicateVariableNames.value.length > 0) {
    error.value = `Duplicate variable names detected: ${duplicateVariableNames.value.join(', ')}. Variable names must be unique within each level.`
    activeTab.value = 'memory'
    return
  }

  isLoading.value = true

  try {
    if (isEditMode.value && currentStage.value) {
      // Update existing stage
      const updated = await stagesStore.update(projectId.value, currentStage.value.id, {
        version: currentStage.value.version,
        name: form.value.name,
        description: form.value.description || undefined,
        tags: form.value.tags,
        agentId: form.value.agentId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings || undefined,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeTags: form.value.knowledgeTags,
        useGlobalActions: form.value.useGlobalActions,
        globalActions: form.value.globalActions,
        variableDescriptors: form.value.variableDescriptors,
        actions: form.value.actions,
        defaultClassifierId: form.value.defaultClassifierId || null,
        transformerIds: form.value.transformerIds,
        metadata: form.value.metadata
      })
      
      // Update currentStage with the response to get the new version
      currentStage.value = updated
    } else {
      // Create new stage
      const createData: any = {
        name: form.value.name,
        agentId: form.value.agentId,
        prompt: form.value.prompt,
        llmProviderId: form.value.llmProviderId,
        llmSettings: form.value.llmSettings,
        enterBehavior: form.value.enterBehavior,
        useKnowledge: form.value.useKnowledge,
        knowledgeTags: form.value.knowledgeTags,
        useGlobalActions: form.value.useGlobalActions,
        globalActions: form.value.globalActions,
        variableDescriptors: form.value.variableDescriptors,
        actions: form.value.actions,
        defaultClassifierId: form.value.defaultClassifierId || null,
        transformerIds: form.value.transformerIds,
        metadata: form.value.metadata
      }

      // Only include id if it's provided
      if (form.value.id) {
        createData.id = form.value.id
      }

      // Only include description if it's not empty
      if (form.value.description) {
        createData.description = form.value.description
      }

      // Only include tags if not empty
      if (form.value.tags.length > 0) {
        createData.tags = form.value.tags
      }

      const created = await stagesStore.create(projectId.value, createData)
      
      // Update currentStage with the created stage
      currentStage.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'design.stages.edit',
        params: { projectId: projectId.value, stageId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} stage`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'design.stages', params: { projectId: projectId.value } })
}

const metadataFields = computed(() => {
  if (!currentStage.value) return []
  return [
    { label: 'Stage ID', value: currentStage.value.id, format: 'mono' as const },
    { label: 'Project ID', value: currentStage.value.projectId, format: 'mono' as const },
    { label: 'Agent ID', value: currentStage.value.agentId, format: 'mono' as const },
    { label: 'Version', value: currentStage.value.version },
    { label: 'Created', value: currentStage.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentStage.value.updatedAt, format: 'date' as const },
  ]
})

// Computed properties for prompt editor auto-completion
const stageVariablesForCompletion = computed(() => form.value.variableDescriptors)

const userProfileVariablesForCompletion = ref<any[]>([])

const projectConstantsForCompletion = computed(() => projectsStore.currentItem?.constants ?? {})

const actionParametersForCompletion = computed(() => {
  const result: Record<string, any[]> = {}
  
  // Extract parameters from all actions (excluding lifecycle actions)
  // Use action.name as key since the backend references actions by name, not UUID key
  for (const [key, action] of Object.entries(form.value.actions)) {
    if (!isLifecycleAction(key) && action.parameters && action.parameters.length > 0) {
      result[action.name] = action.parameters
    }
  }
  
  return result
})

function handleLLMSettingsSave(settings: Record<string, any>) {
  form.value.llmSettings = settings as LlmSettings
  showLLMSettingsModal.value = false
}

// Action management functions
function addAction() {
  editingActionKey.value = null
  editingAction.value = null
  isLifecycleActionKey.value = false
  showActionModal.value = true
}

function editAction(key: string) {
  const action = form.value.actions[key]
  if (!action) return
  
  editingActionKey.value = key
  editingAction.value = action
  isLifecycleActionKey.value = isLifecycleAction(key)
  showActionModal.value = true
}

function deleteAction(key: string) {
  // Prevent deletion of lifecycle actions
  if (isLifecycleAction(key)) {
    alert('Lifecycle actions cannot be deleted. Use "Clear" to remove the configuration instead.')
    return
  }
  
  if (confirm(`Are you sure you want to delete action "${key}"?`)) {
    const newActions = { ...form.value.actions }
    delete newActions[key]
    form.value.actions = newActions
  }
}

function duplicateAction(key: string) {
  const action = form.value.actions[key]
  if (!action) return
  
  duplicatingActionKey.value = key
  showDuplicateModal.value = true
}

function handleActionDuplicate(data: { name: string }) {
  if (!duplicatingActionKey.value) return
  
  const originalAction = form.value.actions[duplicatingActionKey.value]
  if (!originalAction) return
  
  // Check if key already exists
  if (form.value.actions[data.name]) {
    alert(`Action with key "${data.name}" already exists. Please choose a different key.`)
    return
  }

  // Check if name already exists
  const duplicateName = Object.values(form.value.actions).find(action => action.name === data.name)
  if (duplicateName) {
    alert(`An action with name "${data.name}" already exists. Please choose a different name.`)
    return
  }

  // Clone the action with new key and name
  const newActions = { ...form.value.actions }
  newActions[crypto.randomUUID()] = {
    ...originalAction,
    name: data.name
  }
  form.value.actions = newActions
  
  // Reset state and close modal
  duplicatingActionKey.value = null
  showDuplicateModal.value = false
}

function copyAllActions() {
  // Filter out lifecycle actions when copying
  const regularActions: Record<string, StageAction> = {}
  for (const [key, action] of Object.entries(form.value.actions)) {
    if (!isLifecycleAction(key)) {
      regularActions[key] = action
    }
  }
  
  if (Object.keys(regularActions).length === 0) {
    alert('No actions to copy')
    return
  }
  
  try {
    // Copy to clipboard as JSON
    const jsonData = JSON.stringify(regularActions, null, 2)
    navigator.clipboard.writeText(jsonData)
    
    // Show success feedback
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
    
    // Try to parse as JSON
    let parsedActions: Record<string, StageAction>
    try {
      parsedActions = JSON.parse(clipboardText)
    } catch (err) {
      alert('Clipboard does not contain valid JSON data')
      return
    }
    
    // Validate structure
    if (!parsedActions || typeof parsedActions !== 'object') {
      alert('Clipboard does not contain valid actions data')
      return
    }
    
    // Store in state and show modal
    clipboardActions.value = parsedActions
    showPasteModal.value = true
  } catch (err) {
    console.error('Failed to read clipboard:', err)
    alert('Failed to read from clipboard. Please make sure you have clipboard permissions.')
  }
}

function handleActionsPaste(keys: string[]) {
  if (!clipboardActions.value) return
  
  const newActions = { ...form.value.actions }
  let pastedCount = 0
  let overwrittenCount = 0
  
  for (const key of keys) {
    if (clipboardActions.value[key]) {
      const isOverwrite = !!newActions[key] && !isLifecycleAction(key)
      newActions[key] = clipboardActions.value[key]
      pastedCount++
      if (isOverwrite) {
        overwrittenCount++
      }
    }
  }
  
  form.value.actions = newActions
  showPasteModal.value = false
  clipboardActions.value = null
  
  if (pastedCount > 0) {
    const message = overwrittenCount > 0
      ? `Successfully pasted ${pastedCount} action(s) (${overwrittenCount} overwritten)`
      : `Successfully pasted ${pastedCount} action(s)`
    alert(message)
  }
}

function copyAllVariables() {
  if (form.value.variableDescriptors.length === 0) {
    alert('No variables to copy')
    return
  }
  
  try {
    // Deep clone variables to avoid reference issues
    const jsonData = JSON.stringify(form.value.variableDescriptors, null, 2)
    navigator.clipboard.writeText(jsonData)
    
    // Show success feedback
    alert(`Copied ${form.value.variableDescriptors.length} variable(s) to clipboard`)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alert('Failed to copy variables to clipboard')
  }
}

async function pasteVariables() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    
    if (!clipboardText) {
      alert('Clipboard is empty')
      return
    }
    
    // Try to parse as JSON
    let parsedVariables: Array<any>
    try {
      parsedVariables = JSON.parse(clipboardText)
    } catch (err) {
      alert('Clipboard does not contain valid JSON data')
      return
    }
    
    // Validate structure
    if (!Array.isArray(parsedVariables)) {
      alert('Clipboard does not contain valid variables data (must be an array)')
      return
    }
    
    // Store in state and show modal
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
    
    // Check if variable with this name already exists
    const existingIndex = form.value.variableDescriptors.findIndex(v => v.name === variable.name)
    
    if (existingIndex !== -1) {
      // Overwrite existing variable
      form.value.variableDescriptors[existingIndex] = JSON.parse(JSON.stringify(variable))
      overwrittenCount++
    } else {
      // Add new variable
      form.value.variableDescriptors.push(JSON.parse(JSON.stringify(variable)))
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

function configureLifecycleAction(key: string) {
  editingActionKey.value = key
  editingAction.value = form.value.actions[key] || null
  isLifecycleActionKey.value = true
  showActionModal.value = true
}

function clearLifecycleAction(key: string) {
  if (confirm(`Are you sure you want to clear the "${LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO].name}" action?`)) {
    const newActions = { ...form.value.actions }
    delete newActions[key]
    form.value.actions = newActions
  }
}

function isLifecycleActionConfigured(key: string): boolean {
  return !!form.value.actions[key]
}

function handleActionSave(data: { key: string; action: StageAction }) {
  const duplicate = Object.entries(form.value.actions).find(
    ([key, action]) => key !== data.key && action.name === data.action.name
  )
  if (duplicate) {
    alert(`An action with name "${data.action.name}" already exists. Please choose a different name.`)
    return
  }
  const newActions = { ...form.value.actions }
  newActions[data.key] = data.action
  form.value.actions = newActions
  showActionModal.value = false
}

const { sortKey: actionsSortKey, sortOrder: actionsSortOrder, toggleSort: toggleActionsSort, getSortIcon: getActionsSortIcon } = useTableSort('sort-stage-actions')

const actionsList = computed(() => {
  const query = actionsSearchQuery.value.toLowerCase().trim()
  const list = Object.entries(form.value.actions)
    .filter(([key]) => !isLifecycleAction(key))
    .map(([key, action]) => ({
      key,
      ...action
    }))
    .filter(action => {
      if (!query) return true
      return (
        (action.name || '').toLowerCase().includes(query) ||
        (action.classificationTrigger || '').toLowerCase().includes(query)
      )
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
      case 'effects':
        comparison = (a.effects?.length || 0) - (b.effects?.length || 0)
        break
    }
    return actionsSortOrder.value === 'asc' ? comparison : -comparison
  })
})

const lifecycleActions = computed(() => {
  return Object.values(LIFECYCLE_ACTIONS).map(key => ({
    key,
    info: LIFECYCLE_ACTION_INFO[key as keyof typeof LIFECYCLE_ACTION_INFO],
    action: form.value.actions[key] || null,
    isConfigured: isLifecycleActionConfigured(key),
  }))
})

// Duplicate variable name detection (checked at each tree level)
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
  return findDuplicates(form.value.variableDescriptors)
})

// Variable descriptor management with inline tree editing
const expandedNodes = ref<Set<string>>(new Set())

function getDescriptorByPath(path: number[]): any {
  let current: any = { objectSchema: form.value.variableDescriptors }
  for (const index of path) {
    current = current.objectSchema[index]
    if (!current) return null
  }
  return current
}

function addRootVariable() {
  const newDescriptor = {
    name: 'new_variable',
    type: 'string' as const,
    isArray: false,
    objectSchema: []
  }
  form.value.variableDescriptors.push(newDescriptor)
}

function addNestedVariable(path: number[]) {
  const parent = getDescriptorByPath(path)
  if (!parent) return
  
  if (!parent.objectSchema) {
    parent.objectSchema = []
  }
  
  const newDescriptor = {
    name: 'new_field',
    type: 'string' as const,
    isArray: false,
    objectSchema: []
  }
  
  parent.objectSchema.push(newDescriptor)
  
  // Auto-expand parent
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
    
    // Clear objectSchema if changing away from object type
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
      form.value.variableDescriptors.splice(index, 1)
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


</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to stages">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ isEditMode ? 'Edit Stage' : 'Create Stage' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update the stage configuration' : 'Define a new conversation stage for this project' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button v-if="isReadOnly" class="btn-secondary" disabled>Read-only</button>
        <button v-else @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Stage')) }}
        </button>
      </div>
    </div>

    <!-- Archived banner -->
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This stage is read-only because the project is archived.
    </div>
    <!-- Tabs -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          General
        </button>
        <button
          @click="activeTab = 'prompt'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'prompt' }]"
          type="button"
        >
          Prompt
        </button>
        <button
          @click="activeTab = 'features'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'features' }]"
          type="button"
        >
          Features
        </button>
        <button
          @click="activeTab = 'memory'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'memory' }]"
          type="button"
        >
          Memory
        </button>
        <button
          @click="activeTab = 'actions'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'actions' }]"
          type="button"
        >
          Actions
        </button>
        <button
          @click="activeTab = 'lifecycle'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'lifecycle' }]"
          type="button"
        >
          Lifecycle
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
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading stage...
    </div>

    <!-- Error State -->
    <div v-else-if="loadError && isEditMode" class="error-state">
      {{ loadError }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Stages
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
          <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Error Message -->
          <div v-if="error" class="alert-error mb-6">
            {{ error }}
          </div>

          <!-- General Tab -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                Name <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Greeting Stage"
                class="form-input"
                :disabled="isLoading"
              />
              <p class="form-help-text">
                Human-readable name for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Description <span class="text-gray-500">(optional)</span>
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of this stage's purpose..."
                :disabled="isLoading"
              ></textarea>
              <p class="form-help-text">
                Optional description of what this stage does
              </p>
            </div>

            <TagsEditor v-model="form.tags" :disabled="isLoading" />

            <div class="form-group">
              <label class="form-label">
                Agent <span class="required">*</span>
              </label>
              <select
                v-model="form.agentId"
                required
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="">Select an agent</option>
                <option v-for="agent in projectAgents" :key="agent.id" :value="agent.id">
                  {{ agent.name }}
                </option>
              </select>
              <p class="form-help-text">
                The AI agent to use for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Default Enter Behavior <span class="required">*</span>
              </label>
              <select
                v-model="form.enterBehavior"
                required
                class="form-select-auto min-w-64"
                :disabled="isLoading"
              >
                <option value="generate_response">Generate Response</option>
                <option value="await_user_input">Await User Input</option>
              </select>
              <p class="form-help-text">
                What should happen when entering this stage
              </p>
            </div>
          </div>

          <!-- Prompt Tab -->
          <div v-show="activeTab === 'prompt'" class="tab-content">
            <div class="form-group">
              <label class="form-label">
                LLM Provider <span class="required">*</span>
              </label>
              <div class="flex flex-col md:flex-row gap-2">
                <select
                  v-model="form.llmProviderId"
                  required
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">Select an LLM provider</option>
                  <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="showLLMSettingsModal = true"
                  class="btn-secondary whitespace-nowrap"
                  :disabled="isLoading"
                >
                  <Settings class="inline-block mr-1 w-4 h-4" />
                  Settings...
                </button>
                <LLMModelBadge :settings="form.llmSettings" />
              </div>
              <p class="form-help-text">
                The LLM provider to use for this stage
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Stage Prompt <span class="required">*</span>
              </label>
              <PromptEditor
                v-model="form.prompt"
                :disabled="isLoading || isReadOnly"
                :stage-variables="stageVariablesForCompletion"
                :action-parameters="actionParametersForCompletion"
                :user-profile-variables="userProfileVariablesForCompletion"
                :project-constants="projectConstantsForCompletion"
                show-toolbar
                placeholder="You are now in the [stage name] stage..."
                aria-label="Stage prompt"
                min-height="28rem"
              />
              <p class="form-help-text">
                The system prompt or instructions specific to this stage
              </p>
            </div>
          </div>

          <!-- Features Tab -->
          <div v-show="activeTab === 'features'" class="tab-content">
            
            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.useKnowledge"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Knowledge Base
                </span>
              </label>
              <p class="form-help-text mt-1">
                Allow this stage to access the knowledge base
              </p>
            </div>

            <div class="form-group">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.useGlobalActions"
                  type="checkbox"
                  class="form-checkbox"
                  :disabled="isLoading"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                  Enable Global Actions
                </span>
              </label>
              <p class="form-help-text mt-1">
                Allow this stage to execute global actions
              </p>
            </div>

            <div class="mt-6">
              <div class="form-group">
                <label class="form-label">
                  Default Classifier <span class="text-gray-500">(required for actions)</span>
                </label>
                <select
                  v-model="form.defaultClassifierId"
                  class="form-select-auto min-w-64"
                  :disabled="isLoading"
                >
                  <option value="">No default classifier</option>
                  <option
                    v-for="classifier in projectClassifiers"
                    :key="classifier.id"
                    :value="classifier.id"
                  >
                    {{ classifier.name }}
                  </option>
                </select>
                <div
                  v-if="!form.defaultClassifierId"
                  class="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
                >
                  <AlertTriangle class="mt-0.5 w-4 h-4 shrink-0" />
                  <span>Actions triggered by user input classification won't work without a Default Classifier assigned.</span>
                </div>

                <p class="form-help-text">
                  Default classifier for this stage. Individual actions can override this using "Override Classifier ID" in action settings.
                </p>
              </div>
            </div>

            <div class="mt-6">
              <div class="form-group">
                <label class="form-label">
                  Attached Transformers <span class="text-gray-500">(optional)</span>
                </label>
                <div class="space-y-2">
                  <label
                    v-for="transformer in projectTransformers"
                    :key="transformer.id"
                    class="flex items-center cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                  >
                    <input
                      v-model="form.transformerIds"
                      :value="transformer.id"
                      type="checkbox"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-50">
                      {{ transformer.name }}
                    </span>
                  </label>
                  <p v-if="projectTransformers.length === 0" class="text-sm text-gray-500 italic">
                    No transformers available for this project
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Memory Tab -->
          <div v-show="activeTab === 'memory'" class="tab-content">
            <div v-if="duplicateVariableNames.length > 0" class="alert-error mb-4">
              <AlertTriangle class="inline-block mr-2 w-4 h-4" />
              Duplicate variable names detected: <strong>{{ duplicateVariableNames.join(', ') }}</strong>. Variable names must be unique within each level.
            </div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Memory Variables</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Click field names to edit, change types inline
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="copyAllVariables"
                  class="btn-secondary"
                  :disabled="isLoading || form.variableDescriptors.length === 0"
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
            <div v-if="form.variableDescriptors.length === 0" class="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <p class="text-gray-500 dark:text-gray-400 mb-4">No variable descriptors defined yet</p>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                Click "Add Variable" to define your first variable
              </p>
            </div>

            <!-- Tree View -->
            <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <template v-for="(descriptor, index) in form.variableDescriptors" :key="index">
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

          <!-- Actions Tab -->
          <div v-show="activeTab === 'actions'" class="tab-content">
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

            <!-- Search -->
            <div class="search-container">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Empty State -->
            <div v-if="actionsList.length === 0" class="text-center py-12">
              <p class="text-gray-500 mb-4">{{ actionsSearchQuery ? 'No actions match your search' : 'No actions defined yet' }}</p>
            </div>

            <!-- Actions Table -->
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
          </div>

          <!-- Lifecycle Tab -->
          <div v-show="activeTab === 'lifecycle'" class="tab-content">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lifecycle Actions</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Special system actions that execute at specific lifecycle points in the conversation flow.
                These are optional but provide powerful hooks for initialization, cleanup, and fallback handling.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                v-for="lifecycle in lifecycleActions" 
                :key="lifecycle.key"
                class="lifecycle-action-card"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-medium text-gray-900 dark:text-white">{{ lifecycle.info.name }}</h4>
                      <span 
                        v-if="lifecycle.isConfigured" 
                        class="badge-configured"
                      >
                        <CheckCircle class="w-3 h-3 mr-1 inline-block" />
                        Configured
                      </span>
                      <span 
                        v-else
                        class="badge-unconfigured"
                      >
                        <Circle class="w-3 h-3 mr-1 inline-block" />
                        Not Set
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ lifecycle.info.description }}</p>
                  </div>
                </div>
                
                <div v-if="lifecycle.action" class="mb-3 text-sm">
                  <p class="text-gray-700 dark:text-gray-300 font-medium">{{ lifecycle.action.name }}</p>
                  <p class="text-gray-500 text-xs mt-1">
                    {{ lifecycle.action.effects?.length || 0 }} effect(s)
                  </p>
                </div>
                
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="configureLifecycleAction(lifecycle.key)"
                    class="btn-secondary btn-sm flex-1"
                    :disabled="isLoading"
                  >
                    <Settings class="w-3 h-3 mr-1 inline-block" />
                    {{ lifecycle.isConfigured ? 'Edit' : 'Configure' }}
                  </button>
                  <button
                    v-if="lifecycle.isConfigured"
                    type="button"
                    @click="clearLifecycleAction(lifecycle.key)"
                    class="btn-danger btn-sm"
                    :disabled="isLoading"
                    title="Clear action"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="isEditMode && currentStage"
            v-show="activeTab === 'metadata'"
            :fields="metadataFields"
          />
          </fieldset>
        </form>
      </div>
    </div>

    <!-- LLM Settings Modal -->
    <LLMSettingsModal
      v-if="showLLMSettingsModal"
      :settings="form.llmSettings"
      :selected-provider-id="form.llmProviderId"
      :providers="llmProviders"
      @close="showLLMSettingsModal = false"
      @save="handleLLMSettingsSave"
    />

    <!-- Stage Action Modal -->
    <StageActionModal
      v-if="showActionModal"
      :action="editingAction"
      :editing-key="editingActionKey"
      :is-lifecycle-action="isLifecycleActionKey"
      :stage-variables="stageVariablesForCompletion"
      :action-parameters="actionParametersForCompletion"
      :project-constants="projectConstantsForCompletion"
      @close="showActionModal = false"
      @save="handleActionSave"
    />

    <!-- Action Duplicate Modal -->
    <ActionDuplicateModal
      v-if="showDuplicateModal && duplicatingActionKey"
      :original-key="duplicatingActionKey"
      :original-name="form.actions[duplicatingActionKey]?.name || ''"
      :existing-names="Object.values(form.actions).map(a => a.name)"
      @close="showDuplicateModal = false"
      @save="handleActionDuplicate"
    />

    <!-- Actions Paste Modal -->
    <ActionsPasteModal
      v-if="showPasteModal && clipboardActions"
      :clipboard-actions="clipboardActions"
      :existing-keys="Object.keys(form.actions).filter(k => !isLifecycleAction(k))"
      @close="showPasteModal = false"
      @save="handleActionsPaste"
    />

    <!-- Variables Paste Modal -->
    <VariablesPasteModal
      v-if="showVariablesPasteModal && clipboardVariables"
      :clipboard-variables="clipboardVariables"
      :existing-names="form.variableDescriptors.map(v => v.name)"
      @close="showVariablesPasteModal = false"
      @save="handleVariablesPaste"
    />
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
