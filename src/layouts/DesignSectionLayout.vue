<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectSelectionStore } from '@/stores'
import SectionLayout from './SectionLayout.vue'
import { Drama, Route, Target, Microchip, Hammer, Zap, BookOpen, BriefcaseBusiness } from 'lucide-vue-next'

const router = useRouter()
const projectSelectionStore = useProjectSelectionStore()

const hasProject = computed(() => !!projectSelectionStore.selectedProjectId)

const menuItems = [
  { name: 'design.stages', label: 'Stages', icon: Route },
  { name: 'design.personas', label: 'Personas', icon: Drama },
  { name: 'design.classifiers', label: 'Classifiers', icon: Target },
  { name: 'design.contextTransformers', label: 'Context Transformers', icon: Microchip },
  { name: 'design.tools', label: 'Tools', icon: Hammer },
  { name: 'design.globalActions', label: 'Global Actions', icon: Zap },
  { name: 'design.knowledge', label: 'Knowledge', icon: BookOpen },
]

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
