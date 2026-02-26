<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectSelectionStore, useFlowsStore, useStagesStore } from '@/stores'
import SectionLayout from './SectionLayout.vue'
import { Drama, Target, Microchip, Hammer, Zap, BookOpen, BriefcaseBusiness, GitFork } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const projectSelectionStore = useProjectSelectionStore()
const flowsStore = useFlowsStore()
const stagesStore = useStagesStore()

const hasProject = computed(() => !!projectSelectionStore.selectedProjectId)
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const selectedFlowId = computed(() => projectSelectionStore.selectedFlowId || '')

async function loadFlows() {
  if (!projectId.value) return
  try {
    await flowsStore.fetchAll(projectId.value, { limit: null })
  } catch {
    // ignore errors in sidebar
  }
}

async function loadStages() {
  if (!projectId.value || !selectedFlowId.value) return
  try {
    await stagesStore.fetchAll(projectId.value, selectedFlowId.value, { limit: null })
  } catch {
    // ignore errors in sidebar
  }
}

onMounted(() => {
  if (projectId.value) loadFlows()
  if (projectId.value && selectedFlowId.value) loadStages()
})

watch(projectId, (newId) => {
  if (newId) loadFlows()
})

watch(selectedFlowId, (newId) => {
  if (newId) loadStages()
  else stagesStore.items.splice(0)
})

// Sync selectedFlowId from route when the route carries one
watch(() => route.params.flowId, (newId) => {
  if (newId && newId !== selectedFlowId.value) {
    projectSelectionStore.setSelectedFlowId(newId as string)
  }
})

const flowSubItems = computed(() =>
  [...flowsStore.items]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(flow => ({
      name: 'design.flows.edit',
      label: flow.name,
      params: { projectId: projectId.value, flowId: flow.id },
      children: flow.id === selectedFlowId.value ? stageSubItems.value : []
    }))
)

const stageSubItems = computed(() =>
  selectedFlowId.value
    ? [...stagesStore.items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(stage => ({
          name: 'design.stages.edit',
          label: stage.name,
          params: { projectId: projectId.value, flowId: selectedFlowId.value, stageId: stage.id }
        }))
    : []
)

const menuItems = computed(() => [
  {
    name: 'design.flows',
    label: 'Flows & Stages',
    icon: GitFork,
    children: flowSubItems.value
  },
  { name: 'design.personas', label: 'Personas', icon: Drama },
  { name: 'design.classifiers', label: 'Classifiers', icon: Target },
  { name: 'design.contextTransformers', label: 'Context Transformers', icon: Microchip },
  { name: 'design.tools', label: 'Tools', icon: Hammer },
  { name: 'design.globalActions', label: 'Global Actions', icon: Zap },
  { name: 'design.knowledge', label: 'Knowledge', icon: BookOpen },
])

function goToProjects() {
  router.push({ name: 'administration.projects' })
}
</script>

<template>
  <SectionLayout v-if="hasProject" title="Design" :menu-items="menuItems">
    <slot />
  </SectionLayout>
  
  <div v-else class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center max-w-md">
      <BriefcaseBusiness class="mx-auto mb-4 text-gray-400" :size="64" />
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
      <p class="text-gray-600 mb-6">
        Please select a project from the dropdown in the top navigation bar to access Design features.
      </p>
      <button 
        @click="goToProjects"
        class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
      >
        View All Projects
      </button>
    </div>
  </div>
</template>

