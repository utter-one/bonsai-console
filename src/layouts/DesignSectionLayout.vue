<script setup lang="ts">
import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'
import SectionLayout from './SectionLayout.vue'
import { Drama, Route, Target, Microchip, Hammer, Zap, BookOpen, MemoryStick, Shield } from 'lucide-vue-next'
import NoProjectSelected from '@/components/NoProjectSelected.vue'

const projectSelectionStore = useProjectSelectionStore()

const hasProject = computed(() => !!projectSelectionStore.selectedProjectId)

const menuItems = [
  { name: 'design.stages', label: 'Stages', icon: Route },
  { name: 'design.agents', label: 'Agents', icon: Drama },
  { name: 'design.moderation', label: 'Moderation', icon: Shield },
  { name: 'design.classifiers', label: 'Classifiers', icon: Target },
  { name: 'design.contextTransformers', label: 'Context Transformers', icon: Microchip },
  { name: 'design.tools', label: 'Tools', icon: Hammer },
  { name: 'design.globalActions', label: 'Global Actions', icon: Zap },
  { name: 'design.globalMemory', label: 'Global Memory', icon: MemoryStick },
  { name: 'design.knowledge', label: 'Knowledge', icon: BookOpen },
]
</script>

<template>
  <SectionLayout v-if="hasProject" title="Design" :menu-items="menuItems">
    <slot />
  </SectionLayout>
  
  <NoProjectSelected
    v-else
    description="Please select a project from the dropdown in the top navigation bar to access Design features."
  />
</template>
