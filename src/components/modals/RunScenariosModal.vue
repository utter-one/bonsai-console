<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useScenariosStore, useTestersStore, useScenarioRunsStore } from '@/stores'
import type { ScenarioResponse, TesterResponse } from '@/api/types'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'run'): void
}>()

interface TesterEntry {
  testerId: string
  conversations: number
}

const scenariosStore = useScenariosStore()
const testersStore = useTestersStore()
const scenarioRunsStore = useScenarioRunsStore()

const scenarios = ref<ScenarioResponse[]>([])
const testers = ref<TesterResponse[]>([])
const isLoadingScenarios = ref(false)
const isLoadingTesters = ref(false)

const scenarioId = ref('')
const testerEntries = ref<TesterEntry[]>([{ testerId: '', conversations: 1 }])
const isRunning = ref(false)
const runError = ref<string | null>(null)

const canRun = computed(() =>
  !!scenarioId.value &&
  testerEntries.value.length > 0 &&
  testerEntries.value.every(e => !!e.testerId && e.conversations >= 1)
)

const usedTesterIds = computed(() => testerEntries.value.map(e => e.testerId).filter(Boolean))

function availableTestersFor(index: number): TesterResponse[] {
  const selectedId = testerEntries.value[index]?.testerId ?? ''
  return testers.value.filter(t => !usedTesterIds.value.includes(t.id) || t.id === selectedId)
}

function addTesterEntry() {
  testerEntries.value.push({ testerId: '', conversations: 1 })
}

function removeTesterEntry(index: number) {
  testerEntries.value.splice(index, 1)
}

async function handleRun() {
  if (!canRun.value) return
  const testers: Record<string, number> = {}
  for (const entry of testerEntries.value) {
    testers[entry.testerId] = entry.conversations
  }
  isRunning.value = true
  runError.value = null
  try {
    await scenarioRunsStore.create(props.projectId, { scenarioId: scenarioId.value, testers })
    emit('run')
  } catch (err: any) {
    runError.value = err.response?.data?.message || 'Failed to start run'
  } finally {
    isRunning.value = false
  }
}

onMounted(async () => {
  isLoadingScenarios.value = true
  isLoadingTesters.value = true
  try {
    await scenariosStore.fetchAll(props.projectId, { limit: 1000 })
    scenarios.value = scenariosStore.items
  } finally {
    isLoadingScenarios.value = false
  }
  try {
    await testersStore.fetchAll(props.projectId, { limit: 1000 })
    testers.value = testersStore.items
  } finally {
    isLoadingTesters.value = false
  }
})
</script>

<template>
  <BaseModal title="Run Scenarios" size="lg" @close="$emit('close')">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Select a scenario and one or more tester personas to run, and specify conversation counts.
    </p>

    <div class="space-y-5">
      <FormField label="Scenario" required path="scenarioId" :error="null" class="w-full">
        <select v-model="scenarioId" class="form-select" :disabled="isLoadingScenarios">
          <option value="" disabled>{{ isLoadingScenarios ? 'Loading…' : 'Select a scenario' }}</option>
          <option v-for="s in scenarios" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </FormField>

      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="form-label mb-0">
            Testers
            <span class="text-red-500 ml-0.5">*</span>
          </span>
          <button
            type="button"
            class="btn-secondary text-xs flex items-center gap-1"
            :disabled="isLoadingTesters || testers.length === 0 || testerEntries.length >= testers.length"
            @click="addTesterEntry"
          >
            <Plus class="w-3.5 h-3.5" />
            Add Tester
          </button>
        </div>

        <div v-if="isLoadingTesters" class="text-sm text-gray-500 dark:text-gray-400 py-2">
          Loading testers…
        </div>
        <div v-else-if="testers.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">
          No testers available in this project.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(entry, index) in testerEntries"
            :key="index"
            class="flex items-center gap-2"
          >
            <select v-model="entry.testerId" class="form-select flex-1">
              <option value="" disabled>Select a tester</option>
              <option
                v-for="t in availableTestersFor(index)"
                :key="t.id"
                :value="t.id"
              >
                {{ t.name }}
              </option>
            </select>
            <input
              v-model.number="entry.conversations"
              type="number"
              min="1"
              class="form-input w-28 text-right"
              placeholder="Count"
              title="Number of conversations"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">conv.</span>
            <button
              v-if="testerEntries.length > 1"
              type="button"
              class="btn-icon text-gray-400 hover:text-red-500"
              title="Remove tester"
              @click="removeTesterEntry(index)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <div v-else class="w-8" />
          </div>
        </div>

        <p v-if="testerEntries.length > 0" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Total conversations:
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ testerEntries.reduce((s, e) => s + (e.conversations || 0), 0) }}
          </span>
        </p>
      </div>
    </div>

    <template #footer>
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div v-if="runError" class="alert-error mb-3">{{ runError }}</div>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary" :disabled="isRunning" @click="$emit('close')">Cancel</button>
          <button type="button" class="btn-primary" :disabled="!canRun || isRunning" @click="handleRun">
            {{ isRunning ? 'Starting…' : 'Run' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
