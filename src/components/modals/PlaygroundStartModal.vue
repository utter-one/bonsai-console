<template>
  <BaseModal title="Conversation Setup" size="xl" @close="$emit('close')">
    <form @submit.prevent="handleConfirm">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Optionally set initial values before the conversation starts. All fields are optional.
      </p>

      <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        <!-- User Profile Variables -->
        <div
          v-if="userProfileDescriptors.length > 0"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-left"
            @click="toggleSection('user')"
          >
            <div class="flex items-center gap-2">
              <User :size="14" class="text-gray-500 dark:text-gray-400 shrink-0" />
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">User Profile Variables</span>
              <span class="badge badge-secondary text-xs">{{ userProfileDescriptors.length }}</span>
            </div>
            <ChevronDown
              :size="16"
              class="text-gray-400 transition-transform duration-150"
              :class="{ 'rotate-180': sectionExpanded['user'] }"
            />
          </button>
          <div v-show="sectionExpanded['user']" class="p-4 space-y-3 bg-white dark:bg-gray-900/20">
            <div v-for="field in userProfileDescriptors" :key="'profile-' + field.name">
              <label class="form-label text-sm">
                {{ field.name }}
                <span class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">({{ field.type }})</span>
              </label>
              <FieldValueInput
                :field="field"
                :values="profileValues"
                :array-values="profileArrayValues"
                :json-errors="profileJsonErrors"
              />
            </div>
          </div>
        </div>

        <!-- Stage Variable Sections -->
        <div v-if="isLoadingStages" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Loading stages...
        </div>

        <template v-else-if="allProjectStages.length > 0">
          <div
            v-for="s in allProjectStages"
            :key="s.id"
            class="border rounded-lg overflow-hidden"
                :class="effectiveStartingStageId === s.id
              ? 'border-primary-300 dark:border-primary-700'
              : 'border-gray-200 dark:border-gray-700'"
          >
            <!-- Stage with variables: collapsible -->
            <template v-if="(s.variableDescriptors?.length ?? 0) > 0">
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-3 text-left"
                :class="effectiveStartingStageId === s.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                  : 'bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60'"
                @click="toggleSection(s.id)"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <GitBranch :size="14" class="text-gray-500 dark:text-gray-400 shrink-0" />
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{{ s.name }}</span>
                  <span class="badge badge-secondary text-xs shrink-0">{{ s.variableDescriptors!.length }}</span>
                  <span v-if="effectiveStartingStageId === s.id" class="badge badge-active text-xs shrink-0">Starting stage</span>
                </div>
                <ChevronDown
                  :size="16"
                  class="text-gray-400 transition-transform duration-150 shrink-0 ml-2"
                  :class="{ 'rotate-180': sectionExpanded[s.id] }"
                />
              </button>
              <div v-show="sectionExpanded[s.id]" class="p-4 space-y-3 bg-white dark:bg-gray-900/20">
                <div v-for="field in s.variableDescriptors" :key="'stage-' + s.id + '-' + field.name">
                  <label class="form-label text-sm">
                    {{ field.name }}
                    <span class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">({{ field.type }})</span>
                  </label>
                  <FieldValueInput
                    :field="field"
                    :values="stageState(s.id).values"
                    :array-values="stageState(s.id).arrayValues"
                    :json-errors="stageState(s.id).jsonErrors"
                  />
                </div>
              </div>
            </template>

            <!-- Stage with no variables: plain row -->
            <div
              v-else
              class="flex items-center gap-2 px-4 py-3"
              :class="effectiveStartingStageId === s.id
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-gray-50 dark:bg-gray-800/60'"
            >
              <GitBranch :size="14" class="text-gray-500 dark:text-gray-400 shrink-0" />
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{{ s.name }}</span>
              <span v-if="effectiveStartingStageId === s.id" class="badge badge-active text-xs shrink-0">Starting stage</span>
              <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">No variables</span>
            </div>
          </div>
        </template>

        <div
          v-else-if="!isLoadingStages && userProfileDescriptors.length === 0"
          class="py-6 text-center text-sm text-gray-400 dark:text-gray-500"
        >
          No configurable variables found for this project.
        </div>
      </div>

      <div v-if="submitError" class="alert-error mt-4">{{ submitError }}</div>

      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn-primary">Start Conversation</button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref, computed } from 'vue'
import { ChevronDown, User, GitBranch } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import FieldValueInput from '@/components/FieldValueInput.vue'
import type { StageResponse, FieldDescriptor } from '@/api/types'
import { useStagesStore } from '@/stores'

const props = defineProps<{
  stage: StageResponse | null
  startingStageId?: string
  userProfileDescriptors: FieldDescriptor[]
  projectId: string
}>()

const effectiveStartingStageId = computed(() => props.stage?.id ?? props.startingStageId)

const emit = defineEmits<{
  close: []
  confirm: [userProfile: Record<string, any>, stageVariables: Record<string, any>]
}>()

const stagesStore = useStagesStore()
const isLoadingStages = ref(false)
const allProjectStages = ref<StageResponse[]>([]);
const stagesWithVars = computed(() => allProjectStages.value.filter(s => (s.variableDescriptors?.length ?? 0) > 0))

const sectionExpanded = reactive<Record<string, boolean>>({})

function toggleSection(key: string) {
  sectionExpanded[key] = !sectionExpanded[key]
}

// Per-stage reactive containers — populated as stages load
const stageValuesByStageId = reactive<Record<string, {
  values: Record<string, any>
  arrayValues: Record<string, any[]>
  jsonErrors: Record<string, string>
}>>({})

// User profile state
const profileValues = reactive<Record<string, any>>({})
const profileArrayValues = reactive<Record<string, any[]>>({})
const profileJsonErrors = reactive<Record<string, string>>({})

const submitError = ref('')

function defaultPrimitive(type: string): any {
  if (type === 'number') return 0
  if (type === 'boolean') return false
  if (type === 'object') return '{}'
  return ''
}

function isArrayType(type: string): boolean {
  return type.endsWith('[]')
}

function initializeSection(
  descriptors: FieldDescriptor[],
  values: Record<string, any>,
  arrayValues: Record<string, any[]>,
) {
  for (const field of descriptors) {
    if (isArrayType(field.type)) {
      if (!(field.name in arrayValues)) arrayValues[field.name] = []
    } else {
      if (!(field.name in values)) values[field.name] = defaultPrimitive(field.type)
    }
  }
}

function loadSection(
  storageKey: string,
  descriptors: FieldDescriptor[],
  values: Record<string, any>,
  arrayValues: Record<string, any[]>,
) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const saved = JSON.parse(raw) as { values?: Record<string, any>; arrayValues?: Record<string, any[]> }
    const fieldNames = new Set(descriptors.map(f => f.name))
    if (saved.values) {
      for (const [k, v] of Object.entries(saved.values)) {
        if (fieldNames.has(k)) values[k] = v
      }
    }
    if (saved.arrayValues) {
      for (const [k, v] of Object.entries(saved.arrayValues)) {
        if (fieldNames.has(k) && Array.isArray(v)) arrayValues[k] = v
      }
    }
  } catch {
    // ignore corrupt localStorage
  }
}

function saveSection(
  storageKey: string,
  values: Record<string, any>,
  arrayValues: Record<string, any[]>,
) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ values, arrayValues }))
  } catch {
    // ignore write errors
  }
}

function collectSection(
  descriptors: FieldDescriptor[],
  values: Record<string, any>,
  arrayValues: Record<string, any[]>,
  jsonErrors: Record<string, string>,
): Record<string, any> | null {
  const result: Record<string, any> = {}
  let hasError = false

  for (const field of descriptors) {
    if (isArrayType(field.type)) {
      const arr = arrayValues[field.name] ?? []
      if (arr.length === 0) continue
      if (field.type === 'object[]') {
        try {
          result[field.name] = arr.map(item => JSON.parse(item))
          jsonErrors[field.name] = ''
        } catch {
          jsonErrors[field.name] = 'One or more items contain invalid JSON'
          hasError = true
        }
      } else {
        result[field.name] = arr
      }
    } else {
      const val = values[field.name]
      if (field.type === 'object') {
        const text = typeof val === 'string' ? val : '{}'
        if (text.trim() === '' || text.trim() === '{}') continue
        try {
          result[field.name] = JSON.parse(text)
          jsonErrors[field.name] = ''
        } catch {
          jsonErrors[field.name] = 'Invalid JSON'
          hasError = true
        }
      } else if (field.type === 'string') {
        if (val !== '') result[field.name] = val
      } else if (field.type === 'number') {
        if (val !== 0 && val !== '') result[field.name] = val
      } else if (field.type === 'boolean') {
        if (val !== false) result[field.name] = val
      } else {
        if (val != null && val !== '') result[field.name] = val
      }
    }
  }

  return hasError ? null : result
}

type StageStateEntry = { values: Record<string, any>; arrayValues: Record<string, any[]>; jsonErrors: Record<string, string> }

function stageState(id: string): StageStateEntry {
  return (stageValuesByStageId as Record<string, StageStateEntry>)[id] ?? { values: {}, arrayValues: {}, jsonErrors: {} }
}

function initStageSection(s: StageResponse) {
  const descriptors = s.variableDescriptors ?? []
  const state: StageStateEntry = { values: {}, arrayValues: {}, jsonErrors: {} }
  stageValuesByStageId[s.id] = state
  initializeSection(descriptors, state.values, state.arrayValues)
  loadSection(`playground_stage_vars_${s.id}`, descriptors, state.values, state.arrayValues)
  if (!(s.id in sectionExpanded)) {
    sectionExpanded[s.id] = s.id === effectiveStartingStageId.value
  }
}

function handleConfirm() {
  submitError.value = ''
  for (const k of Object.keys(profileJsonErrors)) profileJsonErrors[k] = ''
  for (const s of stagesWithVars.value) {
    const je = stageValuesByStageId[s.id]?.jsonErrors
    if (je) for (const k of Object.keys(je)) je[k] = ''
  }

  const userProfile = collectSection(props.userProfileDescriptors, profileValues, profileArrayValues, profileJsonErrors)
  if (userProfile === null) {
    submitError.value = 'Please fix the highlighted fields before starting.'
    return
  }

  // Validate all stage sections
  let hasStageError = false
  for (const s of stagesWithVars.value) {
    const state = stageValuesByStageId[s.id]
    if (!state) continue
    if (collectSection(s.variableDescriptors!, state.values, state.arrayValues, state.jsonErrors) === null) {
      hasStageError = true
    }
  }
  if (hasStageError) {
    submitError.value = 'Please fix the highlighted fields before starting.'
    return
  }

  // Persist all sections to localStorage
  saveSection(`playground_user_profile_${props.projectId}`, profileValues, profileArrayValues)
  for (const s of stagesWithVars.value) {
    const state = stageValuesByStageId[s.id]
    if (state) saveSection(`playground_stage_vars_${s.id}`, state.values, state.arrayValues)
  }

  // Only the starting stage's variables are sent to the API
  const startingId = effectiveStartingStageId.value
  const startStage = startingId ? stagesWithVars.value.find(s => s.id === startingId) : null
  const startState = startingId ? stageValuesByStageId[startingId] : null
  const stageVariables = startStage && startState
    ? (collectSection(startStage.variableDescriptors!, startState.values, startState.arrayValues, startState.jsonErrors) ?? {})
    : {}

  emit('confirm', userProfile, stageVariables)
}

onMounted(async () => {
  initializeSection(props.userProfileDescriptors, profileValues, profileArrayValues)
  loadSection(`playground_user_profile_${props.projectId}`, props.userProfileDescriptors, profileValues, profileArrayValues)

  isLoadingStages.value = true
  try {
    await stagesStore.fetchAll(props.projectId, { limit: 200 })
    const all = stagesStore.items.slice()
    // Starting stage first, then alphabetical
    all.sort((a, b) => {
      if (a.id === effectiveStartingStageId.value) return -1
      if (b.id === effectiveStartingStageId.value) return 1
      return a.name.localeCompare(b.name)
    })
    allProjectStages.value = all
    for (const s of all.filter(s => (s.variableDescriptors?.length ?? 0) > 0)) initStageSection(s)
  } finally {
    isLoadingStages.value = false
  }
})
</script>
